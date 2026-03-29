const Spill = require("../models/Spill");

/**
 * @desc    Get all spill records
 * @route   GET /api/spills
 */
const getAllSpills = async (req, res) => {
  try {
    const spills = await Spill.find({});
    res.json({ success: true, count: spills.length, data: spills });
  } catch (error) {
    console.error("getAllSpills error:", error.message);
    res.status(500).json({ success: false, error: "Server error fetching spills" });
  }
};

/**
 * @desc    Get spill trends — grouped by year/month
 * @route   GET /api/spills/trends
 * @returns Total spills per period, severity breakdown, total volume
 */
const getSpillTrends = async (req, res) => {
  try {
    const trends = await Spill.aggregate([
      {
        $addFields: {
          parsedDate: {
            $dateFromString: {
              dateString: "$properties.date",
              format: "%Y-%m-%d",
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$parsedDate" },
            month: { $month: "$parsedDate" },
          },
          totalSpills: { $sum: 1 },
          totalVolume: { $sum: "$properties.estimated_volume_tonnes" },
          majorCount: {
            $sum: { $cond: [{ $eq: ["$properties.severity", "major"] }, 1, 0] },
          },
          moderateCount: {
            $sum: { $cond: [{ $eq: ["$properties.severity", "moderate"] }, 1, 0] },
          },
          minorCount: {
            $sum: { $cond: [{ $eq: ["$properties.severity", "minor"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          totalSpills: 1,
          totalVolume: 1,
          severityBreakdown: {
            major: "$majorCount",
            moderate: "$moderateCount",
            minor: "$minorCount",
          },
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    res.json({ success: true, count: trends.length, data: trends });
  } catch (error) {
    console.error("getSpillTrends error:", error.message);
    res.status(500).json({ success: false, error: "Server error fetching trends" });
  }
};

/**
 * @desc    Get overall spill statistics
 * @route   GET /api/spills/stats
 * @returns Aggregate counts, volume totals, breakdowns by severity/coast/status
 */
const getSpillStats = async (req, res) => {
  try {
    const stats = await Spill.aggregate([
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                totalSpills: { $sum: 1 },
                totalVolume: { $sum: "$properties.estimated_volume_tonnes" },
                avgVolume: { $avg: "$properties.estimated_volume_tonnes" },
                maxVolume: { $max: "$properties.estimated_volume_tonnes" },
              },
            },
            { $project: { _id: 0 } },
          ],
          bySeverity: [
            {
              $group: {
                _id: "$properties.severity",
                count: { $sum: 1 },
                totalVolume: { $sum: "$properties.estimated_volume_tonnes" },
              },
            },
            { $project: { _id: 0, severity: "$_id", count: 1, totalVolume: 1 } },
          ],
          byCoast: [
            {
              $group: {
                _id: "$properties.coast",
                count: { $sum: 1 },
              },
            },
            { $project: { _id: 0, coast: "$_id", count: 1 } },
          ],
          byStatus: [
            {
              $group: {
                _id: "$properties.status",
                count: { $sum: 1 },
              },
            },
            { $project: { _id: 0, status: "$_id", count: 1 } },
          ],
          byCause: [
            {
              $group: {
                _id: "$properties.cause",
                count: { $sum: 1 },
              },
            },
            { $project: { _id: 0, cause: "$_id", count: 1 } },
          ],
        },
      },
      {
        $project: {
          overview: { $arrayElemAt: ["$overview", 0] },
          bySeverity: 1,
          byCoast: 1,
          byStatus: 1,
          byCause: 1,
        },
      },
    ]);

    res.json({ success: true, data: stats[0] || {} });
  } catch (error) {
    console.error("getSpillStats error:", error.message);
    res.status(500).json({ success: false, error: "Server error fetching stats" });
  }
};

/**
 * @desc    Get nearby spills using geospatial query
 * @route   GET /api/spills/near?lat=&lng=&maxDistance=
 * @query   lat (required), lng (required), maxDistance (meters, default 500000)
 */
const getNearbySpills = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 500000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: "lat and lng query parameters are required",
      });
    }

    const spills = await Spill.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: "distance",
          maxDistance: parseInt(maxDistance),
          spherical: true,
        },
      },
    ]);

    res.json({ success: true, count: spills.length, data: spills });
  } catch (error) {
    console.error("getNearbySpills error:", error.message);
    res.status(500).json({ success: false, error: "Server error fetching nearby spills" });
  }
};

/**
 * @desc    Get single spill by spill_id
 * @route   GET /api/spills/:id
 */
const getSpillById = async (req, res) => {
  try {
    const spill = await Spill.findOne({ "properties.spill_id": req.params.id });

    if (!spill) {
      return res.status(404).json({ success: false, error: "Spill not found" });
    }

    res.json({ success: true, data: spill });
  } catch (error) {
    console.error("getSpillById error:", error.message);
    res.status(500).json({ success: false, error: "Server error fetching spill" });
  }
};

module.exports = {
  getAllSpills,
  getSpillTrends,
  getSpillStats,
  getNearbySpills,
  getSpillById,
};
