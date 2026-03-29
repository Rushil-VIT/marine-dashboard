const mongoose = require("mongoose");

/**
 * Current Model — GeoJSON Feature format
 * Matches currents_filtered.json structure
 */
const CurrentSchema = new mongoose.Schema(
  {
    type: { type: String, default: "Feature" },
    geometry: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
    properties: {
      LAT: Number,
      LON: Number,
      CURRENT: Number,   // Current speed magnitude
      U: Number,         // Eastward current velocity
      V: Number,         // Northward current velocity
      DEPTH1_1: Number,  // Depth level
      TAXIS: String,     // Timestamp
    },
  },
  { collection: "ocean_currents", timestamps: false }
);

CurrentSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("Current", CurrentSchema);
