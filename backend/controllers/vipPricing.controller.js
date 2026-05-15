const axios = require("axios");
const { createClient } = require('@supabase/supabase-js');

// Khởi tạo Supabase Client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('💰 [VIP Pricing] Initializing controller...');
console.log('[VIP Pricing] SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Not set');
console.log('[VIP Pricing] SUPABASE_KEY:', SUPABASE_KEY ? '✅ Set' : '❌ Not set');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

exports.calculateVIPPrice = async (req, res) => {
  console.log('🔥 [VIP Pricing] === REQUEST START ===');
  console.log('[VIP Pricing] Request body:', JSON.stringify(req.body, null, 2));
  console.log('[VIP Pricing] Request headers:', JSON.stringify(req.headers, null, 2));

  try {
    const { room_id, email, SKU, CustomerID, quantity = 1 } = req.body;
    const targetRoomId = room_id || SKU;

    console.log('[VIP Pricing] Parsed data:', {
      room_id,
      SKU,
      targetRoomId,
      email,
      CustomerID,
      quantity
    });

    // Validate input
    if (!targetRoomId || !email) {
      console.warn('[VIP Pricing] Validation failed - missing room_id or email');
      return res.status(400).json({
        message: "Thiếu room_id hoặc email",
        received: { room_id, email, SKU, CustomerID, quantity }
      });
    }

    // Lấy thông tin room từ Supabase
    let roomInfo = null;
    console.log('[VIP Pricing] Fetching room info from Supabase for room_id:', targetRoomId);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', targetRoomId)
        .maybeSingle();

      if (error) {
        console.error('[VIP Pricing] Supabase room query error:', error);
      } else {
        console.log('[VIP Pricing] Room data from Supabase:', data);
        roomInfo = data;
      }
    } catch (err) {
      console.error("[VIP Pricing] Exception fetching room:", err.message);
    }

    // Lấy thông tin customer từ email
    let customerInfo = null;
    let membershipType = 'Silver';
    let totalOrders = 0;
    let totalSpent = 0;

    console.log('[VIP Pricing] Fetching customer info for email:', email);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('[VIP Pricing] Supabase customer query error:', error);
      } else {
        console.log('[VIP Pricing] Customer data from Supabase:', data);
        if (data) {
          customerInfo = data;
          membershipType = data.membership_type || 'Silver';
          totalOrders = data.total_orders || 0;
          totalSpent = data.total_spent || 0;
        }
      }
    } catch (err) {
      console.error("[VIP Pricing] Exception fetching customer:", err.message);
    }

    // Tính discount dựa trên membership type
    let discountPercent = 0;
    const membershipDiscounts = {
      'Silver': 0,
      'Gold': 5,
      'Platinum': 10
    };
    discountPercent = membershipDiscounts[membershipType] || 0;
    console.log('[VIP Pricing] Membership discount:', { membershipType, discountPercent });

    // Kiểm tra sự kiện đang diễn ra
    let eventDiscount = 0;
    const today = new Date().toISOString().split('T')[0];
    console.log('[VIP Pricing] Checking events for today:', today);
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today);

      if (error) {
        console.error('[VIP Pricing] Supabase events query error:', error);
      } else {
        console.log('[VIP Pricing] Events found:', events?.length || 0, events);
        if (events && events.length > 0) {
          // Lấy event có discount cao nhất
          const bestEvent = events.reduce((best, event) => 
            (event.discount_percent || 0) > (best.discount_percent || 0) ? event : best
          );
          eventDiscount = bestEvent.discount_percent || 0;
          console.log('[VIP Pricing] Best event discount:', { 
            eventName: bestEvent.name, 
            eventDiscount 
          });
        }
      }
    } catch (err) {
      console.error("[VIP Pricing] Exception fetching events:", err.message);
    }

    // Tổng discount
    const totalDiscount = discountPercent + eventDiscount;
    console.log('[VIP Pricing] Total discount:', totalDiscount, { discountPercent, eventDiscount });

    // Lấy giá phòng
    const basePrice = roomInfo?.current_price || 0;
    const finalPrice = Math.round(basePrice * (1 - totalDiscount / 100));
    console.log('[VIP Pricing] Price calculation:', { basePrice, totalDiscount, finalPrice });

    // Nếu có n8n webhook, thử gọi để lấy giá chính xác hơn
    let source = "local";
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    console.log('[VIP Pricing] N8N_WEBHOOK_URL configured:', n8nUrl ? '✅ Yes' : '❌ No');
    
    if (n8nUrl) {
      try {
        console.log('[VIP Pricing] Attempting to call n8n webhook...');
        const response = await axios.post(
          n8nUrl,
          {
            room_id: targetRoomId,
            email,
            quantity
          },
          { timeout: 5000 }
        );

        console.log('[VIP Pricing] n8n response:', response.data);
        const data = response.data;
        const flowData = data?.data || data;
        const pricing = flowData?.pricing || {};

        if (flowData && pricing.finalPrice !== undefined) {
          console.log('[VIP Pricing] n8n returned valid pricing, using n8n result');
          source = "n8n";
          return res.json({
            ...data,
            room_id: flowData.roomId || targetRoomId,
            display_price: pricing.finalPrice,
            discount_percent: parseFloat(String(pricing.discountApplied || "0%").replace("%", "")) || 0,
            discount_text: pricing.discountApplied || "0%",
            isVIP: true,
            member_level: membershipType,
            source,
          });
        } else {
          console.warn('[VIP Pricing] n8n response invalid, falling back to local calculation');
        }
      } catch (err) {
        // n8n không khả dụng, sử dụng tính toán local
        console.log('[VIP Pricing] n8n call failed, using local calculation:', err.message);
      }
    }

    // Trả về kết quả tính toán local
    console.log('[VIP Pricing] Returning local calculation result');
    const result = {
      room_id: targetRoomId,
      display_price: finalPrice,
      discount_percent: totalDiscount,
      discount_text: totalDiscount > 0 ? `${totalDiscount}%` : "0%",
      isVIP: totalDiscount > 0,
      member_level: membershipType,
      source,
      breakdown: {
        base_price: basePrice,
        membership_discount: discountPercent,
        event_discount: eventDiscount,
        total_discount: totalDiscount,
        quantity: quantity,
        total_amount: finalPrice * quantity
      },
      membershipInfo: {
        type: membershipType,
        totalOrders,
        totalSpent
      }
    };

    console.log('[VIP Pricing] Final result:', JSON.stringify(result, null, 2));
    console.log('[VIP Pricing] === REQUEST END ===\n');
    return res.json(result);

  } catch (err) {
    console.error("[VIP Pricing] FATAL ERROR:", err);
    console.error("[VIP Pricing] Error stack:", err.stack);
    return res.status(500).json({ 
      message: "Lỗi server khi tính giá VIP", 
      error: err.message,
      stack: err.stack
    });
  }
};
