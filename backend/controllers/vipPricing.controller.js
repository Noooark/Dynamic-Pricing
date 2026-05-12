const axios = require("axios");

exports.calculateVIPPrice = async (req, res) => {
  try {
    const { room_id, email, SKU, CustomerID } = req.body;
    const targetRoomId = room_id || SKU;

    // Validate input
    if (!targetRoomId || !email) {
      return res.status(400).json({
        message: "Thiếu room_id hoặc email",
      });
    }

    // 👉 Gọi n8n webhook
    const response = await axios.post(
      process.env.N8N_WEBHOOK_URL || "http://168.144.39.198:5678/webhook/vip-pricing",
      {
        room_id: targetRoomId,
        email,
      },
      {
        timeout: 5000, // tránh treo request
      }
    );

    const data = response.data;

    const flowData = data?.data || data;
    const pricing = flowData?.pricing || {};

    // Validate response từ n8n Flow 3 mới
    if (!flowData || pricing.finalPrice === undefined) {
      return res.status(500).json({
        message: "Pricing service trả dữ liệu không hợp lệ",
        rawResponse: data,
      });
    }

    // 👉 Trả về cả raw response và format tương thích với FE cũ
    return res.json({
      ...data,
      room_id: flowData.roomId || targetRoomId,
      display_price: pricing.finalPrice,
      discount_percent: parseFloat(String(pricing.discountApplied || "0%").replace("%", "")) || 0,
      discount_text: pricing.discountApplied || "0%",
      isVIP: true,
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