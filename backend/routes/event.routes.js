// backend/routes/event.routes.js
const express = require("express");
const router = express.Router();

const { checkEvent, getActiveEvents } = require("../controllers/event.controller");

// POST /event/check - Kiểm tra event cho sản phẩm
router.post("/check", checkEvent);

// GET /event/active - Lấy danh sách events active
router.get("/active", getActiveEvents);

module.exports = router;