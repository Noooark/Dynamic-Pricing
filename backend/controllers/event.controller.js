// backend/controllers/event.controller.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Kiểm tra event đang active
 */
exports.checkEvent = async (req, res) => {
  try {
    const { date, SKU } = req.body;

    // Lấy ngày hiện tại nếu không có date
    const currentDate = date || new Date().toISOString().split('T')[0];

    // Query lấy các event đang active
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', currentDate)
      .gte('end_date', currentDate);

    if (error) {
      throw error;
    }

    // Lọc các event đang diễn ra (start_date <= today <= end_date)
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);

    const activeEvents = events.filter(event => {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      return today >= startDate && today <= endDate;
    });

    // Lấy event có discount cao nhất
    const bestEvent = activeEvents.reduce((best, current) => {
      if (!best) return current;
      return current.discount_percent > best.discount_percent ? current : best;
    }, null);

    const hasEvent = !!bestEvent;
    const bestDiscount = bestEvent ? bestEvent.discount_percent : 0;

    // Nếu có SKU, lấy giá sản phẩm từ database
    let currentPrice = 0;
    let productInfo = null;

    if (SKU && SKU !== '') {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('current_price, product_name')
        .eq('sku', SKU)
        .maybeSingle();

      if (productError) {
        throw productError;
      }

      if (product) {
        currentPrice = product.current_price;
        productInfo = {
          sku: SKU,
          name: product.product_name,
          originalPrice: product.current_price
        };
      }
    }

    // Tính giá sau event discount
    const displayPrice = Math.round(currentPrice * (1 - bestDiscount / 100));

    res.json({
      hasEvent,
      eventDiscount: hasEvent,
      display_price: displayPrice,
      discount_percent: bestDiscount,
      isVIP: hasEvent,
      member_level: hasEvent ? 'event' : 'none',
      eventInfo: bestEvent ? {
        name: bestEvent.name,
        discount_percent: bestEvent.discount_percent,
        start_date: bestEvent.start_date,
        end_date: bestEvent.end_date
      } : null,
      productInfo: productInfo,
      currentDate,
      activeEvents: activeEvents.length,
      bestDiscount
    });

  } catch (err) {
    console.error("Event check error:", err.message);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/**
 * Lấy danh sách events active
 */
exports.getActiveEvents = async (req, res) => {
  try {
    const { date } = req.query;

    const currentDate = date || new Date().toISOString().split('T')[0];

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', currentDate)
      .gte('end_date', currentDate);

    if (error) {
      throw error;
    }

    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);

    const activeEvents = events.filter(event => {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      return today >= startDate && today <= endDate;
    });

    res.json({
      events: activeEvents,
      total: activeEvents.length,
      bestDiscount: activeEvents.length > 0 
        ? Math.max(...activeEvents.map(e => e.discount_percent))
        : 0
    });

  } catch (err) {
    console.error("Get active events error:", err.message);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};