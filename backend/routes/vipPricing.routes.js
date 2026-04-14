// backend/routes/vipPricing.routes.js
const express = require("express");
const router = express.Router();
const { calculateVIPPrice } = require("../controllers/vipPricing.controller");

router.post("/", calculateVIPPrice);

module.exports = router;