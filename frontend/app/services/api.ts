import axios from 'axios';
import { supabase, N8N_FLOW1_URL, N8N_FLOW2_URL, N8N_FLOW3_URL, N8N_FLOW4_URL } from '@/lib/supabase';

// ==========================================
// Supabase Data Fetching Functions
// ==========================================

/**
 * Fetch all rooms from Supabase
 */
export const fetchRooms = async () => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('room_type', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
};

/**
 * Fetch a single room by ID
 */
export const fetchRoomById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching room:', error);
    return null;
  }
};

/**
 * Fetch all products from Supabase
 */
export const fetchProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sku', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

/**
 * Fetch all events from Supabase
 */
export const fetchEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

/**
 * Fetch price history from Supabase
 */
export const fetchPriceHistory = async (limit: number = 50) => {
  try {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching price history:', error);
    return [];
  }
};

/**
 * Fetch market analysis from Supabase
 */
export const fetchMarketAnalysis = async (limit: number = 50) => {
  try {
    const { data, error } = await supabase
      .from('market_price_analysis')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching market analysis:', error);
    return [];
  }
};

/**
 * Fetch customer info from Supabase
 * Lưu ý: Schema dùng 'id' thay vì 'customer_id'
 */
export const fetchCustomerInfo = async (customer_id: string) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer_id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching customer info:', error);
    return null;
  }
};

// NOTE: fetchCartItems has been removed. Use getTempCart from @/app/lib/cartStorage instead.
// The cart now uses localStorage for temporary storage, only saving to database on checkout.

/**
 * Add item to cart in Supabase
 * Lưu ý: customer_id here is actually the user_id from auth.users
 * We need to find the actual customer.id first
 */
export const addToCart = async (user_id: string, room_id: string, quantity: number = 1) => {
  try {
    // First, find the customer record by user_id to get the actual customer.id
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (customerError || !customer) {
      console.error('Error finding customer by user_id:', customerError);
      throw new Error('Customer not found');
    }

    const customer_id = customer.id;
    console.log('[addToCart] Found customer_id:', customer_id, 'for user_id:', user_id);

    // Check if item already exists
    const { data: existingItem } = await supabase
      .from('cart')
      .select('*')
      .eq('customer_id', customer_id)
      .eq('room_id', room_id)
      .single();

    if (existingItem) {
      // Update quantity
      const { data, error } = await supabase
        .from('cart')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert new item
      const { data, error } = await supabase
        .from('cart')
        .insert({
          customer_id,
          room_id,
          quantity
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

/**
 * Update cart item quantity
 * Lưu ý: Schema hiện tại dùng room_id thay vì sku
 * Đã thêm logging chi tiết để debug
 */
export const updateCartQuantity = async (customer_id: string, room_id: string, quantity: number) => {
  console.log('[updateCartQuantity] Called with:', { customer_id, room_id, quantity });
  
  try {
    if (quantity <= 0) {
      console.log('[updateCartQuantity] Removing item from cart...');
      const { data, error } = await supabase
        .from('cart')
        .delete()
        .eq('customer_id', customer_id)
        .eq('room_id', room_id)
        .select();

      if (error) {
        console.error('[updateCartQuantity] Delete error:', error);
        throw error;
      }
      console.log('[updateCartQuantity] Delete successful:', data);
      return null;
    } else {
      console.log('[updateCartQuantity] Updating quantity...');
      const { data, error } = await supabase
        .from('cart')
        .update({ quantity })
        .eq('customer_id', customer_id)
        .eq('room_id', room_id)
        .select();

      if (error) {
        console.error('[updateCartQuantity] Update error:', error);
        throw error;
      }
      console.log('[updateCartQuantity] Update successful:', data);
      return data?.[0] || null;
    }
  } catch (error) {
    console.error('[updateCartQuantity] Error:', error);
    throw error;
  }
};

/**
 * Remove item from cart
 * Lưu ý: Schema hiện tại dùng room_id thay vì sku
 * Đã thêm logging chi tiết
 */
export const removeFromCart = async (customer_id: string, room_id: string) => {
  console.log('[removeFromCart] Called with:', { customer_id, room_id });
  
  try {
    const { data, error } = await supabase
      .from('cart')
      .delete()
      .eq('customer_id', customer_id)
      .eq('room_id', room_id)
      .select();

    if (error) {
      console.error('[removeFromCart] Delete error:', error);
      throw error;
    }
    
    console.log('[removeFromCart] Delete successful:', data);
    return true;
  } catch (error) {
    console.error('[removeFromCart] Error:', error);
    throw error;
  }
};

/**
 * Clear cart for customer
 * Đã thêm logging chi tiết
 */
export const clearCart = async (customer_id: string) => {
  console.log('[clearCart] Called with customer_id:', customer_id);
  
  try {
    const { data, error } = await supabase
      .from('cart')
      .delete()
      .eq('customer_id', customer_id)
      .select();

    if (error) {
      console.error('[clearCart] Delete error:', error);
      throw error;
    }
    
    console.log('[clearCart] Delete successful, removed', data?.length || 0, 'items');
    return true;
  } catch (error) {
    console.error('[clearCart] Error:', error);
    throw error;
  }
};

// ==========================================
// n8n Webhook Functions
// ==========================================

/**
 * Trigger Flow 1 via n8n webhook
 * Saves price changes to price_history table
 */
export const triggerFlow1 = async () => {
  try {
    console.log('🚀 [Flow 1] Starting Flow 1...');
    const response = await axios.post(N8N_FLOW1_URL, {
      action: 'run_flow1',
      timestamp: new Date().toISOString()
    }, { timeout: 30000 });

    console.log('[Flow 1] Response received:', response.data);
    
    // Process response and save to price_history
    // Response có thể có nhiều cấu trúc khác nhau:
    // 1. Array trực tiếp: [{ room1 }, { room2 }]
    // 2. Object chứa data: { data: [{ room1 }, { room2 }] }
    // 3. Array chứa object có data: [{ data: [{ room1 }, { room2 }] }]
    let roomsArray = [];
    
    if (Array.isArray(response.data)) {
      // Trường hợp 1: Array trực tiếp
      if (response.data.length > 0 && response.data[0].room_type) {
        roomsArray = response.data;
      } 
      // Trường hợp 3: Array chứa object có data field
      else if (response.data.length > 0 && response.data[0].data && Array.isArray(response.data[0].data)) {
        roomsArray = response.data[0].data;
      }
    } 
    // Trường hợp 2: Object chứa data array
    else if (response.data?.data && Array.isArray(response.data.data)) {
      roomsArray = response.data.data;
    }
    
    console.log('[Flow 1] Extracted rooms array:', roomsArray.length, 'rooms');
    
    if (roomsArray.length > 0) {
      console.log('[Flow 1] Total rooms in response:', roomsArray.length);
      console.log('[Flow 1] First room:', JSON.stringify(roomsArray[0], null, 2));
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roomsWithChanges = roomsArray.filter((room: any) => {
        const needsUpdate = room.NeedsUpdate;
        console.log(`[Flow 1] Room ${room.room_type}: NeedsUpdate =`, needsUpdate, 'type:', typeof needsUpdate);
        return needsUpdate === true || needsUpdate === 'true' || needsUpdate === 1 || needsUpdate === '1';
      });
      
      console.log(`[Flow 1] Found ${roomsWithChanges.length} rooms with price changes`);
      
      // Save each room's price change to price_history
      for (const room of roomsWithChanges) {
        const oldPrice = room.current_price;
        const newPrice = room.ProposedPrice || room.current_price;
        const reason = room.Reason || 'Flow 1: Auto price adjustment';
        
        console.log(`[Flow 1] Saving price history for room ${room.room_type}:`, {
          oldPrice,
          newPrice,
          reason
        });
        
        // Insert into price_history table (schema không có room_id, chỉ có room_type)
        const { error: historyError } = await supabase
          .from('price_history')
          .insert({
            room_type: room.room_type,
            old_price: oldPrice,
            new_price: newPrice,
            reason: reason
          });
        
        if (historyError) {
          console.error(`[Flow 1] Error saving price history for room ${room.id}:`, historyError);
        } else {
          console.log(`[Flow 1] Saved price history for room ${room.room_type}`);
        }
      }
      
      return {
        message: `Đã cập nhật giá cho ${roomsWithChanges.length} phòng`,
        totalProducts: roomsArray.length,
        updatedCount: roomsWithChanges.length,
        unchangedCount: roomsArray.length - roomsWithChanges.length,
        n8nResponse: response.data
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error triggering Flow 1:', error);
    throw error;
  }
};

/**
 * Trigger Flow 2 via n8n webhook
 * Added comprehensive logging for debugging
 */
export const triggerFlow2 = async () => {
  console.log('🚀 [Flow 2] === START TRIGGERING FLOW 2 ===');
  console.log('[Flow 2] Timestamp:', new Date().toISOString());
  console.log('[Flow 2] n8n Webhook URL:', N8N_FLOW2_URL);
  
  const startTime = Date.now();
  
  try {
    console.log('[Flow 2] Sending POST request to n8n webhook...');
    
    const response = await axios.post(N8N_FLOW2_URL, {
      action: 'run_flow2',
      timestamp: new Date().toISOString(),
      source: 'admin_dashboard'
    }, { 
      timeout: 90000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const duration = Date.now() - startTime;
    console.log('[Flow 2] ✅ Response received after', duration, 'ms');
    console.log('[Flow 2] Response status:', response.status);
    console.log('[Flow 2] Response data:', JSON.stringify(response.data, null, 2));
    
    // Log detailed flow execution info
    if (response.data) {
      console.log('[Flow 2] 📊 Flow 2 Execution Summary:');
      if (response.data.summary) {
        console.log('[Flow 2] Total rooms analyzed:', response.data.summary.totalRooms);
        console.log('[Flow 2] Rooms kept:', response.data.summary.keepCount);
        console.log('[Flow 2] Rooms reduced:', response.data.summary.reduceCount);
        console.log('[Flow 2] Rooms increased:', response.data.summary.increaseCount);
      }
      if (response.data.comparison) {
        console.log('[Flow 2] 📈 Price comparison results:', response.data.comparison.length, 'rooms');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response.data.comparison.forEach((item: any, index: number) => {
          console.log(`[Flow 2] Room ${index + 1}:`, {
            type: item.room_type,
            ourPrice: item.khoi_price,
            competitorPrice: item.competitor_min_price,
            status: item.status,
            decision: item.status?.includes('Đắt') ? 'GIẢM' : 'GIỮ'
          });
        });
      }
    }
    
    console.log('[Flow 2] === END TRIGGERING FLOW 2 ===\n');
    return response.data;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Flow 2] ❌ ERROR after', duration, 'ms');
    console.error('[Flow 2] Error type:', error instanceof Error ? error.name : 'Unknown');
    console.error('[Flow 2] Error message:', error instanceof Error ? error.message : error);
    
    if (axios.isAxiosError(error)) {
      console.error('[Flow 2] Axios error details:');
      console.error('[Flow 2] Status:', error.response?.status);
      console.error('[Flow 2] Status text:', error.response?.statusText);
      console.error('[Flow 2] Data:', error.response?.data);
      console.error('[Flow 2] Code:', error.code);
      console.error('[Flow 2] Request:', error.request);
    }
    
    console.log('[Flow 2] === END TRIGGERING FLOW 2 (WITH ERROR) ===\n');
    throw error;
  }
};

/**
 * Trigger Flow 4 via n8n webhook
 */
export const triggerFlow4 = async (date?: string) => {
  try {
    const response = await axios.post(N8N_FLOW4_URL, {
      date: date || new Date().toISOString().split('T')[0]
    }, { timeout: 30000 });

    return response.data;
  } catch (error) {
    console.error('Error triggering Flow 4:', error);
    throw error;
  }
};

/**
 * Calculate VIP price for a room (Flow 3 - VIP Pricing)
 * Gọi n8n Flow 3 webhook để tính giá VIP
 */
export const calculateVIPPriceForRoom = async (
  room_id: string,
  email: string,
  quantity: number = 1
) => {
  console.log('🔌 [API] calculateVIPPriceForRoom called with:', { room_id, email, quantity });
  
  try {
    // Gọi n8n Flow 3 webhook để tính giá VIP
    console.log('🌐 [API] Calling n8n Flow 3 webhook at:', N8N_FLOW3_URL);
    
    const requestBody = {
      room_id,
      email,
      quantity,
      CustomerID: email // Dùng email làm CustomerID
    };
    
    console.log('📦 [API] Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await axios.post(
      N8N_FLOW3_URL,
      requestBody,
      { 
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📥 [API] n8n Flow 3 response:', response.data);
    
    // Xử lý response từ n8n Flow 3
    const data = response.data;
    const flowData = data?.data || data;
    const pricing = flowData?.pricing || {};
    
    if (flowData && pricing.finalPrice !== undefined) {
      const result = {
        ...data,
        room_id: flowData.roomId || room_id,
        display_price: pricing.finalPrice,
        discount_percent: parseFloat(String(pricing.discountApplied || "0%").replace("%", "")) || 0,
        discount_text: pricing.discountApplied || "0%",
        isVIP: true,
        member_level: flowData.memberLevel || "Silver",
        source: "n8n-flow3",
      };
      
      console.log('✅ [API] VIP price calculation result:', result);
      return result;
    } else {
      console.warn('[API] n8n response invalid, using fallback calculation');
      // Fallback: tính giá đơn giản nếu n8n trả về không hợp lệ
      return {
        room_id,
        display_price: 0,
        discount_percent: 0,
        discount_text: "0%",
        isVIP: false,
        member_level: "Silver",
        source: "fallback",
        error: "Invalid n8n response"
      };
    }
  } catch (error) {
    console.error('❌ [API] Error calling n8n Flow 3:', error);
    if (axios.isAxiosError(error)) {
      console.error('[API] Axios error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    // Nếu n8n không khả dụng, trả về null để frontend xử lý
    return null;
  }
};

/**
 * Check event discount for a product/room
 * Kiểm tra xem có sự kiện nào đang diễn ra không
 * Đã refactor để dùng n8n webhook thay vì backend
 */
export const checkEventDiscount = async (date?: string, SKU?: string) => {
  console.log('📅 [Event Check] Checking event discount for date:', date || new Date().toISOString().split('T')[0], 'SKU:', SKU);
  
  try {
    // Dùng n8n Flow 4 webhook để kiểm tra event
    const response = await axios.post(
      N8N_FLOW4_URL,
      {
        date: date || new Date().toISOString().split('T')[0],
        SKU
      },
      { timeout: 15000 }
    );

    console.log('📅 [Event Check] Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [Event Check] Error checking event discount:', error);
    
    // Fallback: Query trực tiếp từ Supabase
    try {
      console.log('[Event Check] Falling back to Supabase direct query...');
      const currentDate = date || new Date().toISOString().split('T')[0];
      
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', currentDate)
        .gte('end_date', currentDate);

      if (error) throw error;
      
      const activeEvents = events || [];
      const bestEvent = activeEvents.length > 0 
        ? activeEvents.reduce((best, event) => 
            (event.discount_percent || 0) > (best.discount_percent || 0) ? event : best
          )
        : null;

      console.log('[Event Check] Supabase fallback result:', { 
        hasEvent: !!bestEvent, 
        discount: bestEvent?.discount_percent || 0 
      });

      return {
        hasEvent: !!bestEvent,
        eventDiscount: !!bestEvent,
        discount_percent: bestEvent?.discount_percent || 0,
        isVIP: !!bestEvent,
        member_level: bestEvent ? 'event' : 'none',
        eventInfo: bestEvent ? {
          name: bestEvent.name,
          discount_percent: bestEvent.discount_percent,
          start_date: bestEvent.start_date,
          end_date: bestEvent.end_date
        } : null,
        currentDate,
        activeEvents: activeEvents.length,
        bestDiscount: bestEvent?.discount_percent || 0,
        source: 'supabase_fallback'
      };
    } catch (fallbackError) {
      console.error('[Event Check] Fallback also failed:', fallbackError);
      return null;
    }
  }
};

export default supabase;
