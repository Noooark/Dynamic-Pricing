// backend/controllers/admin.controller.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Đăng nhập admin
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Thiếu username hoặc password" });
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!admin) {
      return res.status(401).json({ message: "Sai username hoặc password" });
    }

    res.json({
      message: "Đăng nhập thành công",
      admin: {
        admin_id: admin.admin_id,
        username: admin.username,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (err) {
    console.error("Admin login error:", err.message);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/**
 * Lấy danh sách sản phẩm
 */
exports.getProducts = async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('sku', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      products: products,
      total: products.length
    });

  } catch (err) {
    console.error("Get products error:", err.message);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/**
 * Cập nhật giá sản phẩm
 */
exports.updateProductPrice = async (req, res) => {
  try {
    const { sku, current_price } = req.body;

    if (!sku || !current_price) {
      return res.status(400).json({ message: "Thiếu SKU hoặc giá mới" });
    }

    const { data: product, error: selectError } = await supabase
      .from('products')
      .select('*')
      .eq('sku', sku)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    const oldPrice = product.current_price;
    const newPrice = parseFloat(current_price);

    // Cập nhật giá sản phẩm
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        current_price: newPrice,
        last_updated: new Date().toISOString()
      })
      .eq('sku', sku)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Ghi log vào price_history
    const { error: logError } = await supabase
      .from('price_history')
      .insert({
        sku: sku,
        old_price: oldPrice,
        new_price: newPrice,
        reason: "Admin manual update",
        competitor_price: null,
        flow_name: "Manual Admin Update"
      });

    if (logError) {
      console.error("Log price history error:", logError.message);
      // Không throw error để không làm gián đoạn việc cập nhật giá
    }

    res.json({
      message: "Cập nhật giá thành công",
      product: updatedProduct,
      oldPrice: oldPrice,
      newPrice: newPrice,
      change: newPrice - oldPrice
    });

  } catch (err) {
    console.error("Update product price error:", err.message);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/**
 * Lấy lịch sử giá
 */
exports.getPriceHistory = async (req, res) => {
  try {
    const { sku, limit = 50 } = req.query;

    console.log("🔍 Getting price history:", { sku, limit });

    let query = supabase
      .from('price_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (sku) {
      console.log(`🔍 Filtering by SKU: ${sku}`);
      query = query.eq('sku', sku);
    }

    const { data: history, error } = await query;

    if (error) {
      console.error("❌ Price history query error:", error);
      throw error;
    }

    console.log(`✅ Price history found: ${history.length} records`);

    // Nếu có SKU, lấy tên sản phẩm riêng
    let historyWithNames = history;
    if (sku) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('product_name')
        .eq('sku', sku)
        .maybeSingle();

      if (!productError && product) {
        historyWithNames = history.map(item => ({
          ...item,
          product_name: product.product_name
        }));
      }
    }

    res.json({
      history: historyWithNames,
      total: history.length
    });

  } catch (err) {
    console.error("❌ Get price history error:", err.message);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/**
 * Chạy FLOW 1 (Tự động giảm giá theo đối thủ) - Gọi n8n webhook
 */
exports.runFlow1 = async (req, res) => {
  try {
    console.log("🚀 Running FLOW 1 via n8n webhook...");

    // Gọi n8n webhook để chạy FLOW 1
    const axios = require('axios');
    const n8nWebhookUrl = process.env.N8N_FLOW1_WEBHOOK_URL || "http://168.144.39.198:5678/webhook/flow1";

    console.log("📍 Webhook URL:", n8nWebhookUrl);

    const response = await axios.post(
      n8nWebhookUrl,
      {
        action: "run_flow1",
        timestamp: new Date().toISOString()
      },
      { timeout: 30000 } // 30 giây timeout
    );

    console.log("✅ FLOW 1 webhook response:", response.data);

    res.json({
      message: "FLOW 1 đã được kích hoạt qua n8n. Vui lòng kiểm tra email để xem kết quả.",
      n8nResponse: response.data,
      note: "n8n sẽ xử lý và gửi email báo cáo kết quả"
    });

  } catch (err) {
    console.error("❌ Run FLOW 1 error:", err.message);
    if (err.response) {
      console.error("📛 Response status:", err.response.status);
      console.error("📛 Response data:", err.response.data);
      console.error("📛 Response headers:", err.response.headers);
    }
    res.status(500).json({ 
      message: "Lỗi khi gọi FLOW 1", 
      error: err.message,
      note: "Vui lòng kiểm tra n8n webhook URL và kết nối"
    });
  }
};

/**
 * Chạy FLOW 4 (Cập nhật giảm giá theo Event) - Gọi n8n webhook
 */
exports.runFlow4 = async (req, res) => {
  try {
    console.log("🔍 runFlow4 - req.body:", req.body);
    console.log("🔍 runFlow4 - req.headers:", req.headers);

    // Kiểm tra req.body
    if (!req.body) {
      return res.status(400).json({ 
        message: "req.body is undefined. Please check Content-Type header",
        note: "Make sure to send Content-Type: application/json"
      });
    }

    const { date } = req.body;

    // Nếu không có date, dùng ngày hiện tại
    const targetDate = date || new Date().toISOString().split('T')[0];

    console.log("📅 Using date:", targetDate);

    console.log("🚀 Running FLOW 4 via n8n webhook...");
    console.log(`📅 Date: ${date}`);

    // Gọi n8n webhook để chạy FLOW 4
    const axios = require('axios');
    const n8nWebhookUrl = process.env.N8N_FLOW4_WEBHOOK_URL || "http://168.144.39.198:5678/webhook/event-check";

    console.log("📍 Webhook URL:", n8nWebhookUrl);
    console.log("📤 Sending payload:", { date: date });

    const response = await axios.post(
      n8nWebhookUrl,
      {
        date: date
      },
      { 
        timeout: 30000, // Tăng timeout vì FLOW 4 cần thời gian để cập nhật tất cả sản phẩm
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("✅ FLOW 4 webhook response:", response.data);

    // Phân tích kết quả
    const result = response.data;
    let message = "Thực hiện FLOW 4 thành công";
    let affectedProducts = 0;
    let discountPercent = 0;
    let hasEvent = false;

    console.log("🔍 FLOW 4 result structure:", typeof result, result);

    if (result && typeof result === 'object') {
      // Xử lý response object từ n8n
      if (result.hasEvent && result.discount_percent) {
        hasEvent = true;
        discountPercent = result.discount_percent;
        affectedProducts = result.affectedProducts || 0;
        const eventName = result.eventInfo?.name || "Event";
        message = `Thực hiện FLOW 4 thành công - Áp dụng giảm giá ${discountPercent}% cho event ${eventName}`;
      } else if (result.eventInfo && result.eventInfo.discount_percent) {
        hasEvent = true;
        discountPercent = result.eventInfo.discount_percent;
        affectedProducts = result.affectedProducts || 0;
        const eventName = result.eventInfo.name || "Event";
        message = `Thực hiện FLOW 4 thành công - Áp dụng giảm giá ${discountPercent}% cho event ${eventName}`;
      } else {
        message = "Thực hiện FLOW 4 thành công - Không có event hoạt động";
      }
    } else if (result && Array.isArray(result)) {
      // Xử lý response array (dự phòng)
      affectedProducts = result.length;
      if (result[0] && result[0].json) {
        discountPercent = result[0].json.discount_percent || 0;
      }
      if (discountPercent > 0) {
        message = `Thực hiện FLOW 4 thành công - Áp dụng giảm giá ${discountPercent}% cho ${affectedProducts} sản phẩm`;
      } else {
        message = "Thực hiện FLOW 4 thành công - Không có event hoạt động";
      }
    } else {
      message = "Thực hiện FLOW 4 thành công - Không có event hoạt động";
    }

    res.json({
      message: message,
      date: date,
      result: {
        hasEvent: discountPercent > 0,
        discountPercent: discountPercent,
        affectedProducts: affectedProducts,
        details: result
      }
    });

  } catch (err) {
    console.error("❌ Run FLOW 4 error:", err.message);
    console.error("❌ Error stack:", err.stack);
    
    if (err.response) {
      console.error("📛 Response status:", err.response.status);
      console.error("📛 Response data:", err.response.data);
      console.error("📛 Response headers:", err.response.headers);
    } else {
      console.error("❌ No response object - likely network/connection error");
    }
    
    res.status(500).json({ 
      message: "Lỗi thực hiện FLOW 4", 
      error: err.message,
      details: err.response?.data || null,
      stack: err.stack
    });
  }
};
