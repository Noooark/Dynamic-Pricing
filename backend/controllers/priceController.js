// backend/controllers/priceController.js
const { getAllProducts, getProductBySKU, updateProductPrice, appendPriceLog } = require("../services/googleSheet.service");

exports.getProducts = async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách sản phẩm", error: err.message });
  }
};

// Logic tính và giảm giá theo đối thủ (FLOW 1)
exports.reducePriceByCompetitor = async (req, res) => {
  try {
    const { SKU } = req.body;

    if (!SKU) {
      return res.status(400).json({ message: "Thiếu SKU" });
    }

    const product = await getProductBySKU(SKU);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    const currentPrice = parseFloat(product.currentPrice);
    const competitorPrice = parseFloat(product.competitorPrice);
    const floorPrice = parseFloat(product.floorPrice);
    const costPrice = parseFloat(product.costPrice);
    const maxDiscount = parseFloat(product.maxDiscountPercent) / 100 || 0.15;

    if (!competitorPrice || competitorPrice >= currentPrice) {
      return res.json({
        sku: SKU,
        needsUpdate: false,
        message: "Không cần giảm giá"
      });
    }

    // Tính giá đề xuất
    let proposedPrice = competitorPrice - 1000;

    // Không giảm dưới sàn
    if (proposedPrice < floorPrice) proposedPrice = floorPrice;

    // Bảo vệ margin tối thiểu 12%
    const minMarginPrice = costPrice * 1.12;
    if (proposedPrice < minMarginPrice) proposedPrice = Math.ceil(minMarginPrice);

    // Giới hạn giảm tối đa
    const maxAllowed = currentPrice * (1 - maxDiscount);
    if (proposedPrice < maxAllowed) proposedPrice = Math.ceil(maxAllowed);

    const needsUpdate = (currentPrice - proposedPrice) >= 500;

    if (!needsUpdate) {
      return res.json({
        sku: SKU,
        needsUpdate: false,
        message: "Chênh lệch quá nhỏ, không giảm"
      });
    }

    // Cập nhật giá
    await updateProductPrice(SKU, proposedPrice);

    // Ghi log
    await appendPriceLog({
      sku: SKU,
      oldPrice: currentPrice,
      newPrice: proposedPrice,
      competitorPrice,
      reason: "Giảm theo đối thủ",
      decision: "Auto"
    });

    res.json({
      sku: SKU,
      oldPrice: currentPrice,
      newPrice: proposedPrice,
      competitorPrice,
      discountPercent: Math.round((currentPrice - proposedPrice) / currentPrice * 100),
      needsUpdate: true,
      message: "Đã cập nhật giá thành công"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi xử lý giảm giá", error: err.message });
  }
};