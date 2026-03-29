const express = require("express");
const router = express.Router();
const {
  getAllSpills,
  getSpillTrends,
  getSpillStats,
  getNearbySpills,
  getSpillById,
} = require("../controllers/spillController");

// IMPORTANT: Static routes MUST come before :id param route
router.get("/", getAllSpills);
router.get("/trends", getSpillTrends);
router.get("/stats", getSpillStats);
router.get("/near", getNearbySpills);
router.get("/:id", getSpillById);

module.exports = router;
