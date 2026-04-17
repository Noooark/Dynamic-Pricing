// backend/routes/cart.routes.js
const express = require("express");
const router = express.Router();

const {
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  calculateCartVIPPrice,
  clearCart,
  checkout
} = require("../controllers/cart.controller");

// GET /cart?CustomerID=C001 - Lấy giỏ hàng
router.get("/", getCart);

// POST /cart/add - Thêm sản phẩm vào giỏ
router.post("/add", addToCart);

// POST /cart/remove - Xóa sản phẩm khỏi giỏ
router.post("/remove", removeFromCart);

// PUT /cart/update - Cập nhật số lượng
router.put("/update", updateCartQuantity);

// POST /cart/calculate-vip - Tính giá VIP cho giỏ hàng (FLOW 3)
router.post("/calculate-vip", calculateCartVIPPrice);

// DELETE /cart/clear - Xóa toàn bộ giỏ
router.delete("/clear", clearCart);

// POST /cart/checkout - Thanh toán
router.post("/checkout", checkout);

module.exports = router;