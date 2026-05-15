// backend/routes/vipPricing.routes.js
const express = require("express");
const router = express.Router();
const { calculateVIPPrice } = require("../controllers/vipPricing.controller");

// Endpoint chính để tính giá VIP
router.post("/", calculateVIPPrice);

// Endpoint /calculate (alias cho /)
router.post("/calculate", calculateVIPPrice);

module.exports = router;
