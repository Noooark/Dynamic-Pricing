// backend/controllers/vipPricing.controller.js
const { getProductBySKU, getCustomerByID } = require("../services/googleSheet.service");

exports.calculateVIPPrice = async (req, res) => {
  try {
    const { SKU, CustomerID } = req.body;

    if (!SKU || !CustomerID) {
      return res.status(400).json({ message: "Thiếu SKU hoặc CustomerID" });
    }

    const product = await getProductBySKU(SKU);
    const customer = await getCustomerByID(CustomerID);

    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    if (!customer) return res.status(404).json({ message: "Không tìm thấy khách hàng" });

    const currentPrice = parseFloat(product.currentPrice) || 0;
    const level = customer.memberShip || "Silver";
    const last30 = customer.last30dOrders || 0;

    let discount = 0;
    if (level === "Silver") discount = 3;
    if (level === "Gold") discount = 5;
    if (level === "Platinum") discount = 8;

    if (last30 >= 5) discount += 2;
    if (last30 >= 10) discount += 4;
    if (discount > 15) discount = 15;

    const displayPrice = Math.round(currentPrice * (1 - discount / 100));

    res.json({
      display_price: displayPrice,
      display_price_text: displayPrice.toLocaleString("vi-VN") + " ₫",
      discount_percent: discount,
      savings: currentPrice - displayPrice,
      savings_text: (currentPrice - displayPrice).toLocaleString("vi-VN") + " ₫",
      savings_percent: discount,
      member_level: level,
      isVIP: discount > 0,
      SKU: SKU,
      ProductName: product.productName,
    });

  } catch (err) {
    console.error("VIP Pricing Error:", err);
    res.status(500).json({ 
      message: "Lỗi server khi tính giá VIP", 
      error: err.message 
    });
  }
};