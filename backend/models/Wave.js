const mongoose = require("mongoose");

/**
 * Wave Model — GeoJSON Feature format
 * Matches waves_filtered.json structure
 */
const WaveSchema = new mongoose.Schema(
  {
    type: { type: String, default: "Feature" },
    geometry: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
    properties: {
      LAT: Number,
      LON: Number,
      SWH: Number,     // Significant Wave Height
      SWHX: Number,    // SWH X component
      SWHY: Number,    // SWH Y component
      SWELL: Number,   // Swell height
      SWELLX: Number,  // Swell X component
      SWELLY: Number,  // Swell Y component
      WP: Number,      // Wave Period
      SWP: Number,     // Swell Wave Period
      TIME: String,    // Timestamp
    },
  },
  { collection: "wave_data", timestamps: false }
);

WaveSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("Wave", WaveSchema);
