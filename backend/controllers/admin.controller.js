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

    // Tìm room_type từ products table (nếu có)
    let roomType = null;
    try {
      const { data: productData } = await supabase
        .from('products')
        .select('room_type')
        .eq('sku', sku)
        .maybeSingle();
      
      if (productData && productData.room_type) {
        roomType = productData.room_type;
      }
    } catch (e) {
      // Bảng products có thể không có room_type
      console.log("Product has no room_type, skipping room association");
    }

    // Ghi log vào price_history (schema mới với room_type)
    const { error: logError } = await supabase
      .from('price_history')
      .insert({
        room_type: roomType,
        old_price: oldPrice,
        new_price: newPrice,
        reason: "Admin manual update",
        occupancy_rate: null
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
 * Lấy lịch sử giá (schema mới: price_history có room_type là text)
 */
exports.getPriceHistory = async (req, res) => {
  try {
    const { room_type, limit = 50 } = req.query;

    console.log("🔍 Getting price history:", { room_type, limit });

    // Kiểm tra Supabase connection
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("❌ Supabase credentials not configured");
      return res.status(500).json({ 
        message: "Supabase chưa được cấu hình", 
        error: "Thiếu SUPABASE_URL hoặc SUPABASE_KEY" 
      });
    }

    let query = supabase
      .from('price_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (room_type) {
      console.log(`🔍 Filtering by room_type: ${room_type}`);
      query = query.eq('room_type', room_type);
    }

    const { data: history, error } = await query;

    if (error) {
      console.error("❌ Price history query error:", error);
      // Kiểm tra nếu lỗi do bảng không tồn tại
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return res.json({
          history: [],
          total: 0,
          message: "Bảng price_history chưa có dữ liệu"
        });
      }
      throw error;
    }

    console.log(`✅ Price history found: ${history ? history.length : 0} records`);

    res.json({
      history: history || [],
      total: (history || []).length
    });

  } catch (err) {
    console.error("❌ Get price history error:", err.message);
    console.error("❌ Error stack:", err.stack);
    res.json({
      history: [],
      total: 0,
      error: err.message
    });
  }
};

/**
 * Lấy phân tích giá thị trường (market_price_analysis)
 */
exports.getMarketAnalysis = async (req, res) => {
  try {
    const { room_id, limit = 50 } = req.query;

    console.log("🔍 Getting market analysis:", { room_id, limit });

    let query = supabase
      .from('market_price_analysis')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (room_id) {
      query = query.eq('room_id', room_id);
    }

    const { data: analysis, error } = await query;

    if (error) {
      console.error("❌ Market analysis query error:", error);
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return res.json({
          analysis: [],
          total: 0,
          message: "Bảng market_price_analysis chưa có dữ liệu"
        });
      }
      throw error;
    }

    console.log(`✅ Market analysis found: ${analysis ? analysis.length : 0} records`);

    res.json({
      analysis: analysis || [],
      total: (analysis || []).length
    });

  } catch (err) {
    console.error("❌ Get market analysis error:", err.message);
    res.json({
      analysis: [],
      total: 0,
      error: err.message
    });
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
    const n8nWebhookUrl = process.env.N8N_FLOW1_WEBHOOK_URL || "https://nonempirically-araucarian-leia.ngrok-free.dev/webhook/flow1";

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
 * Chạy FLOW 2 (Theo dõi giá đối thủ) - Gọi n8n webhook
 * Quét giá từ Google Hotels qua SerpAPI, so sánh và điều chỉnh giá
 */
exports.runFlow2 = async (req, res) => {
  try {
    console.log("🚀 Running FLOW 2 - Theo dõi giá đối thủ via n8n webhook...");

    // Gọi n8n webhook để chạy FLOW 2
    const axios = require('axios');
    const n8nWebhookUrl = process.env.N8N_FLOW2_WEBHOOK_URL || "https://nonempirically-araucarian-leia.ngrok-free.dev/webhook/flow2";

    console.log("📍 Webhook URL:", n8nWebhookUrl);

    const response = await axios.post(
      n8nWebhookUrl,
      {
        action: "run_flow2_competitor_tracking",
        timestamp: new Date().toISOString()
      },
      { timeout: 90000 } // 90 giây timeout vì cần quét SerpAPI
    );

    console.log("✅ FLOW 2 webhook response:", response.data);

    // Phân tích kết quả từ flow mới
    const flowResult = response.data;
    let comparisonData = [];
    let summary = {
      totalRooms: 0,
      updatedCount: 0,
      keepCount: 0,
      reduceCount: 0,
      increaseCount: 0
    };

    // Nếu response có dữ liệu so sánh
    if (flowResult && typeof flowResult === 'object') {
      if (Array.isArray(flowResult.comparison)) {
        comparisonData = flowResult.comparison;
      } else if (Array.isArray(flowResult)) {
        comparisonData = flowResult;
      }

      // Tính summary
      summary.totalRooms = comparisonData.length;
      comparisonData.forEach(item => {
        const decision = (item.decision || '').toUpperCase();
        if (decision === 'REDUCE') summary.reduceCount++;
        else if (decision === 'INCREASE') summary.increaseCount++;
        else summary.keepCount++;
      });
    }

    res.json({
      message: "FLOW 2 đã hoàn thành. Hệ thống đã quét giá đối thủ từ Google Hotels và cập nhật giá phòng.",
      n8nResponse: flowResult,
      comparison: comparisonData,
      summary: summary,
      note: "n8n đã quét giá đối thủ từ Google Hotels, so sánh với giá phòng của mình và điều chỉnh tự động"
    });

  } catch (err) {
    console.error("❌ Run FLOW 2 error:", err.message);
    if (err.response) {
      console.error("📛 Response status:", err.response.status);
      console.error("📛 Response data:", err.response.data);
      console.error("📛 Response headers:", err.response.headers);
    }
    res.status(500).json({ 
      message: "Lỗi khi gọi FLOW 2", 
      error: err.message,
      note: "Vui lòng kiểm tra n8n webhook URL và kết nối SerpAPI"
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

    // Nếu không有 date, dùng ngày hiện tại
    const targetDate = date || new Date().toISOString().split('T')[0];

    console.log("📅 Using date:", targetDate);

    console.log("🚀 Running FLOW 4 via n8n webhook...");

    // Gọi n8n webhook để chạy FLOW 4
    const axios = require('axios');
    const n8nWebhookUrl = process.env.N8N_FLOW4_WEBHOOK_URL || "https://nonempirically-araucarian-leia.ngrok-free.dev/webhook/event-check";

    console.log("📍 Webhook URL:", n8nWebhookUrl);

    const response = await axios.post(
      n8nWebhookUrl,
      {
        date: date
      },
      { 
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("✅ FLOW 4 webhook response:", response.data);

    // Phân tích kết quả
    const result = response.data;
    let message = "Thực hiện FLOW 4 thành công";
    let eventInfo = null;
    let updatedRooms = [];

    // Xử lý response - có thể là array hoặc object
    if (Array.isArray(result)) {
      // Response là array các rooms
      updatedRooms = result;
      
      // Lấy thông tin event từ room đầu tiên
      if (result.length > 0 && result[0].update_reason) {
        const eventReason = result[0].update_reason;
        // Extract event name from "Sự kiện: <tên event>"
        const eventName = eventReason.replace('Sự kiện:', '').trim();
        
        // Lấy increase_percent từ room đầu tiên
        const increasePercent = result[0].increase_percent || 0;
        
        eventInfo = {
          event_name: eventName,
          increase_percent: increasePercent / 100, // Convert to decimal
          room_count: result.length
        };
        
        message = `Thực hiện FLOW 4 thành công - Áp dụng tăng giá ${increasePercent}% cho event "${eventName}"`;
      } else {
        message = "Thực hiện FLOW 4 thành công - Không có sự kiện đang diễn ra";
      }
    } else if (result && typeof result === 'object') {
      // Response là object
      if (result.eventInfo) {
        eventInfo = result.eventInfo;
        message = `Thực hiện FLOW 4 thành công - Event: ${eventInfo.event_name || 'Unknown'}`;
      } else {
        message = "Thực hiện FLOW 4 thành công - Không có sự kiện đang diễn ra";
      }
    }

    res.json({
      message: message,
      date: date,
      eventInfo: eventInfo,
      hasEvent: !!eventInfo,
      updatedCount: updatedRooms.length,
      updatedRooms: updatedRooms,
      result: {
        hasEvent: !!eventInfo,
        eventInfo: eventInfo,
        updatedRooms: updatedRooms
      }
    });

  } catch (err) {
    console.error("❌ Run FLOW 4 error:", err.message);
    console.error("❌ Error stack:", err.stack);
    
    if (err.response) {
      console.error("📛 Response status:", err.response.status);
      console.error("📛 Response data:", err.response.data);
    }
    
    res.status(500).json({ 
      message: "Lỗi thực hiện FLOW 4", 
      error: err.message,
      details: err.response?.data || null
    });
  }
};

