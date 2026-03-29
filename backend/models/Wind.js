const mongoose = require("mongoose");

/**
 * Wind Model — GeoJSON Feature format
 * Matches winds_filtered.json structure
 */
const WindSchema = new mongoose.Schema(
  {
    type: { type: String, default: "Feature" },
    geometry: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
    properties: {
      G0_LAT_0121_481: Number,
      G0_LON_1841_1201: Number,
      WSM: Number,   // Wind Speed Magnitude
      WSXM: Number,  // Wind Speed X component
      WSYM: Number,  // Wind Speed Y component
      TAX: String,   // Timestamp
    },
  },
  { collection: "wind_data", timestamps: false }
);

WindSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("Wind", WindSchema);
