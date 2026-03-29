const express = require("express");
const router = express.Router();
const {
  getWinds,
  getWaves,
  getCurrents,
  getEEZ,
} = require("../controllers/environmentController");

router.get("/winds", getWinds);
router.get("/waves", getWaves);
router.get("/currents", getCurrents);
router.get("/eez", getEEZ);

module.exports = router;
