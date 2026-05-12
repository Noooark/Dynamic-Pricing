// backend/controllers/cart.controller.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Lưu trữ giỏ hàng tạm trong memory (có thể thay bằng database)
const cartStore = new Map();

/**
 * Lấy giỏ hàng của khách hàng
 */
exports.getCart = async (req, res) => {
  try {
    const { CustomerID } = req.query;

    if (!CustomerID) {
      return res.status(400).json({ message: "Thiếu CustomerID" });
    }

    // Lấy giỏ hàng từ store
    const cart = cartStore.get(CustomerID) || [];

    res.json({
      CustomerID,
      items: cart,
      totalItems: cart.length,
      message: "Lấy giỏ hàng thành công"
    });

  } catch (err) {
    console.error("Get cart error:", err.message);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/**
 * Thêm sản phẩm vào giỏ hàng
 */
exports.addToCart = async (req, res) => {
  try {
    const { CustomerID, SKU, quantity = 1 } = req.body;

    if (!CustomerID || !SKU) {
      return res.status(400).json({ message: "Thiếu CustomerID hoặc SKU" });
    }

    // Kiểm tra trong bảng rooms trước, nếu không có thì kiểm tra products
    let itemName = "";
    let itemPrice = 0;

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, room_type, current_price')
      .eq('id', SKU)
      .maybeSingle();

    if (!roomError && room) {
      itemName = room.room_type;
      itemPrice = room.current_price;
    } else {
      // Fallback: kiểm tra bảng products
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('sku, product_name, current_price')
        .eq('sku', SKU)
        .maybeSingle();

      if (productError || !product) {
        return res.status(404).json({ message: "Phòng/sản phẩm không tồn tại" });
      }
      itemName = product.product_name;
      itemPrice = product.current_price;
    }

    // Lấy giỏ hàng hiện tại
    let cart = cartStore.get(CustomerID) || [];

    // Kiểm tra xem đã có trong giỏ chưa
    const existingIndex = cart.findIndex(item => item.SKU === SKU);

    if (existingIndex > -1) {
      // Cập nhật số lượng (số đêm)
      cart[existingIndex].quantity += quantity;
    } else {
      // Thêm mới
      cart.push({
        SKU,
        product_name: itemName,
        currentPrice: itemPrice,
        quantity,
        displayPrice: null,
        discountPercent: 0,
        isVIP: false
      });
    }

    cartStore.set(CustomerID, cart);

    res.json({
      message: "Thêm vào giỏ hàng thành công",
      cart: {
        CustomerID,
        items: cart,
        totalItems: cart.length
      }
    });

  } catch (err) {
    console.error("Add to cart error:", err.message);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/**
 * Xóa sản phẩm khỏi giỏ hàng
 */
exports.removeFromCart = async (req, res) => {
  try {
    const { CustomerID, SKU } = req.body;

    if (!CustomerID || !SKU) {
      return res.status(400).json({ message: "Thiếu CustomerID hoặc SKU" });
    }

    let cart = cartStore.get(CustomerID);

    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
    }

    cart = cart.filter(item => item.SKU !== SKU);
    cartStore.set(CustomerID, cart);

    res.json({
      message: "Xóa sản phẩm khỏi giỏ hàng thành công",
      cart: {
        CustomerID,
        items: cart,
        totalItems: cart.length
      }
    });

  } catch (err) {
    console.error("Remove from cart error:", err.message);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/**
 * Cập nhật số lượng sản phẩm trong giỏ
 */
exports.updateCartQuantity = async (req, res) => {
  try {
    const { CustomerID, SKU, quantity } = req.body;

    if (!CustomerID || !SKU || quantity === undefined) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    let cart = cartStore.get(CustomerID);

    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
    }

    const item = cart.find(item => item.SKU === SKU);

    if (!item) {
      return res.status(404).json({ message: "Sản phẩm không có trong giỏ" });
    }

    if (quantity <= 0) {
      // Nếu quantity = 0 thì xóa luôn
      cart = cart.filter(item => item.SKU !== SKU);
    } else {
      item.quantity = quantity;
    }

    cartStore.set(CustomerID, cart);

    res.json({
      message: "Cập nhật số lượng thành công",
      cart: {
        CustomerID,
        items: cart,
        totalItems: cart.length
      }
    });

  } catch (err) {
    console.error("Update cart error:", err.message);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/**
 * Tính giá VIP cho toàn bộ giỏ hàng (FLOW 3)
 * Flow 3 mới nhận room_id + email và trả về data.pricing.finalPrice
 */
exports.calculateCartVIPPrice = async (req, res) => {
  try {
    const { CustomerID, CustomerEmail } = req.body;

    if (!CustomerID) {
      return res.status(400).json({ message: "Thiếu CustomerID" });
    }

    // Lấy giỏ hàng
    let cart = cartStore.get(CustomerID);

    if (!cart || cart.length === 0) {
      return res.status(404).json({ message: "Giỏ hàng trống" });
    }

    // Lấy thông tin khách hàng từ Supabase theo schema mới:
    // customers(id, full_name, email, rank_id) + customer_ranks(rank_name, discount_percentage)
    let customerQuery = supabase
      .from('customers')
      .select('id, full_name, email, rank_id, customer_ranks(rank_name, discount_percentage, description)');

    if (CustomerEmail) {
      customerQuery = customerQuery.eq('email', CustomerEmail);
    } else {
      customerQuery = customerQuery.eq('id', CustomerID);
    }

    const { data: customer, error: customerError } = await customerQuery.maybeSingle();

    if (customerError || !customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    }

    // Gọi n8n webhook cho từng phòng (VIP Pricing)
    const axios = require('axios');
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || "http://168.144.39.198:5678/webhook/vip-pricing";

    const updatedCart = await Promise.all(
      cart.map(async (item) => {
        try {
          console.log(`🔍 Calling FLOW 3 VIP Pricing for room ${item.SKU}...`);
          console.log(`📡 n8n URL: ${n8nWebhookUrl}`);
          console.log(`📤 Payload: { room_id: "${item.SKU}", email: "${customer.email}" }`);

          const response = await axios.post(
            n8nWebhookUrl,
            {
              room_id: item.SKU,
              email: customer.email
            },
            { timeout: 5000 }
          );

          console.log(`✅ VIP Pricing response:`, response.data);

          const vipData = response.data;

          // Flow 3 mới trả về:
          // { success, data: { roomId, customerName, pricing: { originalPrice, finalPrice, discountApplied } } }
          const flowData = vipData.data || vipData;
          const pricing = flowData.pricing || {};
          const finalPrice = Number(pricing.finalPrice ?? vipData.final_price ?? item.currentPrice);
          const originalPrice = Number(pricing.originalPrice ?? vipData.old_price ?? item.currentPrice);
          const discountText = pricing.discountApplied || vipData.discount_text || "0%";
          const parsedDiscount = parseFloat(String(discountText).replace('%', '')) || 0;

          return {
            ...item,
            displayPrice: finalPrice,
            discountPercent: parsedDiscount,
            discountText,
            isVIP: parsedDiscount > 0,
            memberLevel: customer.customer_ranks?.rank_name?.toLowerCase() || 'standard',
            vipInfo: {
              roomId: flowData.roomId || item.SKU,
              customerName: flowData.customerName || customer.full_name,
              originalPrice,
              finalPrice,
              discountApplied: discountText,
              currency: pricing.currency || "VND",
              message: flowData.message || vipData.message || "Áp dụng giá VIP thành công"
            },
            eventInfo: null
          };
        } catch (err) {
          console.error(`❌ VIP pricing error for SKU ${item.SKU}:`, err.message);
          console.error(`❌ Error details:`, err.response?.data || err);
          
          // Trả về giá gốc nếu có lỗi
          return {
            ...item,
            displayPrice: item.currentPrice,
            discountPercent: 0,
            isVIP: false,
            memberLevel: customer.customer_ranks?.rank_name?.toLowerCase() || 'standard',
            error: "Không thể tính giá VIP"
          };
        }
      })
    );

    // Tính tổng tiền
    const subtotal = updatedCart.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
    const vipTotal = updatedCart.reduce((sum, item) => sum + ((item.displayPrice || item.currentPrice) * item.quantity), 0);
    const totalSavings = subtotal - vipTotal;

    cartStore.set(CustomerID, updatedCart);

    res.json({
      message: "Tính giá VIP thành công",
      CustomerID,
      customerInfo: {
        id: customer.id,
        name: customer.full_name,
        email: customer.email,
        rankId: customer.rank_id,
        membershipType: customer.customer_ranks?.rank_name || 'Standard',
        discountPercentage: customer.customer_ranks?.discount_percentage || 0
      },
      cart: {
        items: updatedCart,
        totalItems: updatedCart.length,
        subtotal: subtotal,
        vipTotal: vipTotal,
        totalSavings: totalSavings,
        savingsPercent: subtotal > 0 ? Math.round((totalSavings / subtotal) * 100) : 0
      }
    });

  } catch (err) {
    console.error("Calculate cart VIP price error:", err.message);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/**
 * Xóa toàn bộ giỏ hàng
 */
exports.clearCart = async (req, res) => {
  try {
    const { CustomerID } = req.body;

    if (!CustomerID) {
      return res.status(400).json({ message: "Thiếu CustomerID" });
    }

    cartStore.delete(CustomerID);

    res.json({
      message: "Xóa giỏ hàng thành công",
      CustomerID
    });

  } catch (err) {
    console.error("Clear cart error:", err.message);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/**
 * Checkout - Hoàn tất đơn hàng
 */
exports.checkout = async (req, res) => {
  try {
    const { CustomerID, CustomerEmail } = req.body;

    if (!CustomerID) {
      return res.status(400).json({ message: "Thiếu CustomerID" });
    }

    const cart = cartStore.get(CustomerID);

    if (!cart || cart.length === 0) {
      return res.status(404).json({ message: "Giỏ hàng trống" });
    }

    // Lấy thông tin khách hàng theo schema mới
    let customerQuery = supabase
      .from('customers')
      .select('id, full_name, email, rank_id, customer_ranks(rank_name, discount_percentage, description)');

    if (CustomerEmail) {
      customerQuery = customerQuery.eq('email', CustomerEmail);
    } else {
      customerQuery = customerQuery.eq('id', CustomerID);
    }

    const { data: customer, error: customerError } = await customerQuery.maybeSingle();

    if (customerError || !customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    }

    // Tính tổng
    const subtotal = cart.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
    const vipTotal = cart.reduce((sum, item) => sum + ((item.displayPrice || item.currentPrice) * item.quantity), 0);
    const totalSavings = subtotal - vipTotal;

    // Tạo order record (có thể lưu vào Supabase)
    const orderId = `ORD${Date.now()}`;

    // Schema customers mới hiện chưa có total_orders/total_spent nên không cập nhật thống kê ở đây.

    // Xóa giỏ hàng
    cartStore.delete(CustomerID);

    res.json({
      message: "Đặt hàng thành công",
      orderId,
      CustomerID,
      customerInfo: {
        id: customer.id,
        name: customer.full_name,
        email: customer.email,
        membershipType: customer.customer_ranks?.rank_name || 'Standard'
      },
      summary: {
        items: cart.length,
        subtotal,
        vipTotal,
        totalSavings,
        finalAmount: vipTotal
      }
    });

  } catch (err) {
    console.error("Checkout error:", err.message);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};