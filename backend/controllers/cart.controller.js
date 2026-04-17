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

    // Kiểm tra sản phẩm tồn tại trong Supabase
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('sku, product_name, current_price')
      .eq('sku', SKU)
      .maybeSingle();

    if (productError || !product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    // Lấy giỏ hàng hiện tại
    let cart = cartStore.get(CustomerID) || [];

    // Kiểm tra xem sản phẩm đã có trong giỏ chưa
    const existingIndex = cart.findIndex(item => item.SKU === SKU);

    if (existingIndex > -1) {
      // Cập nhật số lượng
      cart[existingIndex].quantity += quantity;
    } else {
      // Thêm mới
      cart.push({
        SKU,
        product_name: product.product_name,
        currentPrice: product.current_price,
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
 * Tính giá VIP cho toàn bộ giỏ hàng (FLOW 3 + FLOW 4)
 * Gọi n8n webhook cho từng sản phẩm trong giỏ, sau đó check event
 */
exports.calculateCartVIPPrice = async (req, res) => {
  try {
    const { CustomerID } = req.body;

    if (!CustomerID) {
      return res.status(400).json({ message: "Thiếu CustomerID" });
    }

    // Lấy giỏ hàng
    let cart = cartStore.get(CustomerID);

    if (!cart || cart.length === 0) {
      return res.status(404).json({ message: "Giỏ hàng trống" });
    }

    // Lấy thông tin khách hàng từ Supabase
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('customer_id, name, membership_type, total_orders, total_spent, email')
      .eq('customer_id', CustomerID)
      .maybeSingle();

    if (customerError || !customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    }

    // Gọi n8n webhook cho từng sản phẩm (VIP Pricing)
    const axios = require('axios');
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || "http://168.144.39.198:5678/webhook/vip-pricing";

    const updatedCart = await Promise.all(
      cart.map(async (item) => {
        try {
          console.log(`🔍 Calling VIP Pricing for SKU ${item.SKU}...`);
          console.log(`📡 n8n URL: ${n8nWebhookUrl}`);
          console.log(`📤 Payload: { SKU: "${item.SKU}", CustomerID: "${CustomerID}" }`);

          const response = await axios.post(
            n8nWebhookUrl,
            {
              SKU: item.SKU,
              CustomerID: CustomerID
            },
            { timeout: 5000 }
          );

          console.log(`✅ VIP Pricing response:`, response.data);

          const vipData = response.data;

          // Lấy giá VIP từ n8n
          const vipPrice = vipData.display_price || item.currentPrice;
          const vipDiscount = vipData.discount_percent || 0;
          const isVIP = vipData.isVIP || false;

          // Check Event (FLOW 4) - Kiểm tra event discount
          console.log(`🔍 Calling Event Check for SKU ${item.SKU}...`);
          console.log(`📡 Event URL: http://168.144.39.198:5678/webhook/event-check`);
          console.log(`📤 Payload: { SKU: "${item.SKU}", date: "${new Date().toISOString().split('T')[0]}" }`);

          const eventResponse = await axios.post(
            "http://168.144.39.198:5678/webhook/event-check",
            {
              date: new Date().toISOString().split('T')[0],
              SKU: item.SKU
            },
            { timeout: 5000 }
          );

          console.log(`✅ Event Check response:`, eventResponse.data);

          const eventData = eventResponse.data;

          // Tính tổng hợp discount
          let finalPrice = vipPrice;
          let totalDiscount = vipDiscount;
          let isEventVIP = false;
          let memberLevel = vipData.member_level || customer.membership_type?.toLowerCase() || 'silver';

          if (eventData.hasEvent && eventData.eventDiscount) {
            // Nếu có event, áp dụng event discount lên giá VIP
            finalPrice = eventData.display_price;
            totalDiscount = eventData.discount_percent;
            isEventVIP = true;
            memberLevel = 'event';
          } else if (isVIP) {
            // Chỉ có VIP discount
            isEventVIP = true;
            memberLevel = vipData.member_level || customer.membership_type?.toLowerCase() || 'silver';
          }

          return {
            ...item,
            displayPrice: finalPrice,
            discountPercent: totalDiscount,
            isVIP: isEventVIP,
            memberLevel: memberLevel,
            vipInfo: {
              originalPrice: item.currentPrice,
              vipPrice: vipPrice,
              vipDiscount: vipDiscount,
              isVIP: isVIP
            },
            eventInfo: eventData.hasEvent ? {
              name: eventData.eventInfo?.name,
              discount_percent: eventData.discount_percent,
              hasEvent: eventData.hasEvent
            } : null
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
            memberLevel: customer.membership_type?.toLowerCase() || 'silver',
            error: "Không thể tính giá VIP"
          };
        }
      })
    );

    // Tính tổng tiền
    const subtotal = updatedCart.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
    const vipTotal = updatedCart.reduce((sum, item) => sum + (item.displayPrice * item.quantity), 0);
    const totalSavings = subtotal - vipTotal;

    cartStore.set(CustomerID, updatedCart);

    res.json({
      message: "Tính giá VIP thành công",
      CustomerID,
      customerInfo: {
        name: customer.name,
        membershipType: customer.membership_type,
        totalOrders: customer.total_orders,
        totalSpent: customer.total_spent
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
    const { CustomerID } = req.body;

    if (!CustomerID) {
      return res.status(400).json({ message: "Thiếu CustomerID" });
    }

    const cart = cartStore.get(CustomerID);

    if (!cart || cart.length === 0) {
      return res.status(404).json({ message: "Giỏ hàng trống" });
    }

    // Lấy thông tin khách hàng
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('customer_id', CustomerID)
      .maybeSingle();

    if (customerError || !customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    }

    // Tính tổng
    const subtotal = cart.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
    const vipTotal = cart.reduce((sum, item) => sum + (item.displayPrice * item.quantity), 0);
    const totalSavings = subtotal - vipTotal;

    // Tạo order record (có thể lưu vào Supabase)
    const orderId = `ORD${Date.now()}`;

    // Cập nhật thông tin khách hàng
    const newTotalOrders = (customer.total_orders || 0) + cart.length;
    const newTotalSpent = (customer.total_spent || 0) + vipTotal;

    await supabase
      .from('customers')
      .update({
        total_orders: newTotalOrders,
        total_spent: newTotalSpent
      })
      .eq('customer_id', CustomerID);

    // Xóa giỏ hàng
    cartStore.delete(CustomerID);

    res.json({
      message: "Đặt hàng thành công",
      orderId,
      CustomerID,
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