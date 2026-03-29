/**
 * Seed Script — Imports GeoJSON data from marine data/ into MongoDB collections.
 *
 * Usage: npm run seed
 *
 * Collections created:
 *   - spills        (from spills_dataset.json)
 *   - wind_data     (from winds_filtered.json)
 *   - wave_data     (from waves_filtered.json)
 *   - ocean_currents(from currents_filtered.json)
 *   - eez           (from india_eez_simplified.json)
 *
 * Idempotent: drops existing data before inserting.
 * Creates 2dsphere indexes on geometry fields.
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load env
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Data directory (relative to project root)
const DATA_DIR = path.join(__dirname, "..", "..", "marine data");

// Collection → file mapping
const COLLECTIONS = [
  { name: "spills", file: "spills_dataset.json", hasGeo: true },
  { name: "wind_data", file: "winds_filtered.json", hasGeo: true },
  { name: "wave_data", file: "waves_filtered.json", hasGeo: true },
  { name: "ocean_currents", file: "currents_filtered.json", hasGeo: true },
  { name: "eez", file: "india_eez_simplified.json", hasGeo: false },
];

async function seed() {
  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;

    for (const col of COLLECTIONS) {
      const filePath = path.join(DATA_DIR, col.file);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${col.file} — skipping`);
        continue;
      }

      // Read and parse JSON
      const rawData = fs.readFileSync(filePath, "utf-8");
      let data = JSON.parse(rawData);

      // Handle both array and FeatureCollection formats
      if (data.type === "FeatureCollection" && data.features) {
        data = data.features;
      }

      // Wrap single objects into array
      if (!Array.isArray(data)) {
        data = [data];
      }

      // Drop existing collection
      const collections = await db.listCollections({ name: col.name }).toArray();
      if (collections.length > 0) {
        await db.dropCollection(col.name);
        console.log(`🗑️  Dropped existing collection: ${col.name}`);
      }

      // Insert data
      const collection = db.collection(col.name);
      const result = await collection.insertMany(data);
      console.log(`✅ ${col.name}: inserted ${result.insertedCount} documents`);

      // Create 2dsphere index on geometry field
      if (col.hasGeo) {
        await collection.createIndex({ geometry: "2dsphere" });
        console.log(`📍 ${col.name}: created 2dsphere index on geometry`);
      }

      console.log("");
    }

    console.log("🎉 Seeding complete!");
  } catch (error) {
    console.error("❌ Seed error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

seed();
