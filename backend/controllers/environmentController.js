const Wind = require("../models/Wind");
const Wave = require("../models/Wave");
const Current = require("../models/Current");
const mongoose = require("mongoose");

/**
 * @desc    Get all wind data
 * @route   GET /api/environment/winds
 */
const getWinds = async (req, res) => {
  try {
    const winds = await Wind.find({});
    res.json({ success: true, count: winds.length, data: winds });
  } catch (error) {
    console.error("getWinds error:", error.message);
    res.status(500).json({ success: false, error: "Server error fetching wind data" });
  }
};

/**
 * @desc    Get all wave data
 * @route   GET /api/environment/waves
 */
const getWaves = async (req, res) => {
  try {
    const waves = await Wave.find({});
    res.json({ success: true, count: waves.length, data: waves });
  } catch (error) {
    console.error("getWaves error:", error.message);
    res.status(500).json({ success: false, error: "Server error fetching wave data" });
  }
};

/**
 * @desc    Get all ocean current data
 * @route   GET /api/environment/currents
 */
const getCurrents = async (req, res) => {
  try {
    const currents = await Current.find({});
    res.json({ success: true, count: currents.length, data: currents });
  } catch (error) {
    console.error("getCurrents error:", error.message);
    res.status(500).json({ success: false, error: "Server error fetching current data" });
  }
};

/**
 * @desc    Get India EEZ boundary GeoJSON
 * @route   GET /api/environment/eez
 */
const getEEZ = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const eezData = await db.collection("eez").find({}).toArray();

    res.json({ success: true, count: eezData.length, data: eezData });
  } catch (error) {
    console.error("getEEZ error:", error.message);
    res.status(500).json({ success: false, error: "Server error fetching EEZ data" });
  }
};

module.exports = {
  getWinds,
  getWaves,
  getCurrents,
  getEEZ,
};
