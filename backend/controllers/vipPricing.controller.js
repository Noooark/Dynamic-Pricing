const axios = require("axios");

exports.calculateVIPPrice = async (req, res) => {
  try {
    const { SKU, CustomerID } = req.body;

    // Validate input
    if (!SKU || !CustomerID) {
      return res.status(400).json({
        message: "Thiếu SKU hoặc CustomerID",
      });
    }

    // 👉 Gọi n8n webhook
    const response = await axios.post(
      process.env.N8N_WEBHOOK_URL || "http://168.144.39.198:5678/webhook/vip-pricing",
      {
        SKU,
        CustomerID,
      },
      {
        timeout: 5000, // tránh treo request
      }
    );

    const data = response.data;

    // Validate response từ n8n
    if (!data || !data.display_price) {
      return res.status(500).json({
        message: "Pricing service trả dữ liệu không hợp lệ",
      });
    }

    // 👉 Trả thẳng về FE
    return res.json({
      ...data,
      source: "n8n",
    });

  } catch (err) {
    // In ra chi tiết để biết n8n trả về lỗi gì hoặc tại sao không kết nối được
    if (err.response) {
      // n8n có phản hồi nhưng trả về lỗi (ví dụ: 404, 500)
      console.error("n8n Error Data:", err.response.data);
      console.error("n8n Error Status:", err.response.status);
    } else if (err.request) {
      // Backend gọi đi nhưng n8n không trả lời (sai IP, sai Port, Firewall chặn)
      console.error("Không nhận được phản hồi từ n8n. Kiểm tra IP/Port.");
    } else {
      console.error("Lỗi thiết lập request:", err.message);
    }

    return res.status(500).json({ message: "...", fallback: true });
  }
};