// backend/routes/admin.routes.js
const express = require("express");
const router = express.Router();

const { login, getProducts, updateProductPrice, getPriceHistory, runFlow1 } = require("../controllers/admin.controller");

// POST /admin/login - Đăng nhập admin
router.post("/login", login);

// GET /admin/products - Lấy danh sách sản phẩm
router.get("/products", getProducts);

// PUT /admin/products/:sku - Cập nhật giá sản phẩm
router.put("/products/:sku", updateProductPrice);

// GET /admin/price-history - Lấy lịch sử giá
router.get("/price-history", getPriceHistory);

// POST /admin/flow1/run - Chạy FLOW 1
router.post("/flow1/run", runFlow1);

module.exports = router;