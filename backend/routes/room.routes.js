// backend/routes/room.routes.js
const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room.controller");

// GET /rooms - Lấy danh sách phòng (có thể filter theo room_type, location_area)
router.get("/", roomController.getRooms);

// GET /rooms/:id - Lấy thông tin 1 phòng
router.get("/:id", roomController.getRoomById);

module.exports = router;
