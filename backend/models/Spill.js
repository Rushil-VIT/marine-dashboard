const mongoose = require("mongoose");

/**
 * Spill Model — GeoJSON Feature format
 * Matches spills_dataset.json structure
 */
const SpillSchema = new mongoose.Schema(
  {
    type: { type: String, default: "Feature" },
    geometry: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
    properties: {
      spill_id: { type: String, required: true, unique: true },
      title: { type: String, required: true },
      date: { type: String, required: true },
      state: { type: String },
      coast: { type: String, enum: ["east", "west", "island"] },
      severity: { type: String, enum: ["major", "moderate", "minor"] },
      estimated_volume_tonnes: { type: Number, default: 0 },
      cause: { type: String },
      source_type: { type: String },
      status: { type: String, enum: ["cleaned", "contained", "monitoring"] },
    },
  },
  { collection: "spills", timestamps: false }
);

// Geospatial index for $near queries
SpillSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("Spill", SpillSchema);
