// backend/routes/price.routes.js
const express = require("express");
const router = express.Router();
const { getProducts, reducePriceByCompetitor } = require("../controllers/priceController");

router.get("/", getProducts);                    // Lấy danh sách sản phẩm
router.post("/reduce", reducePriceByCompetitor); // Giảm giá theo đối thủ

module.exports = router;