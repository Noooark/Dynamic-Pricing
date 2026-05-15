import axios from 'axios';
import { supabase, N8N_FLOW1_URL, N8N_FLOW2_URL, N8N_FLOW4_URL } from '@/lib/supabase';

// API client for n8n webhooks (optional, for admin actions)
const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 10000,
});

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

/**
 * Fetch cart items from Supabase
 * Lưu ý: customer_id here is actually user_id, we need to find actual customer.id first
 */
export const fetchCartItems = async (user_id: string) => {
  try {
    // First find customer.id from user_id
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (customerError || !customer) {
      console.error('Error finding customer for cart:', customerError);
      return [];
    }

    const customer_id = customer.id;

    const { data, error } = await supabase
      .from('cart')
      .select(`
        *,
        rooms (
          id,
          room_type,
          current_price
        )
      `)
      .eq('customer_id', customer_id);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return [];
  }
};

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
 */
export const updateCartQuantity = async (customer_id: string, room_id: string, quantity: number) => {
  try {
    if (quantity <= 0) {
      // Remove item
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('customer_id', customer_id)
        .eq('room_id', room_id);

      if (error) throw error;
      return null;
    } else {
      const { data, error } = await supabase
        .from('cart')
        .update({ quantity })
        .eq('customer_id', customer_id)
        .eq('room_id', room_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error updating cart:', error);
    throw error;
  }
};

/**
 * Remove item from cart
 * Lưu ý: Schema hiện tại dùng room_id thay vì sku
 */
export const removeFromCart = async (customer_id: string, room_id: string) => {
  try {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('customer_id', customer_id)
      .eq('room_id', room_id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

/**
 * Clear cart for customer
 */
export const clearCart = async (customer_id: string) => {
  try {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('customer_id', customer_id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// ==========================================
// n8n Webhook Functions
// ==========================================

/**
 * Trigger Flow 1 via n8n webhook
 */
export const triggerFlow1 = async () => {
  try {
    const response = await axios.post(N8N_FLOW1_URL, {
      action: 'run_flow1',
      timestamp: new Date().toISOString()
    }, { timeout: 30000 });

    return response.data;
  } catch (error) {
    console.error('Error triggering Flow 1:', error);
    throw error;
  }
};

/**
 * Trigger Flow 2 via n8n webhook
 */
export const triggerFlow2 = async () => {
  try {
    const response = await axios.post(N8N_FLOW2_URL, {
      action: 'run_flow2',
      timestamp: new Date().toISOString()
    }, { timeout: 90000 });

    return response.data;
  } catch (error) {
    console.error('Error triggering Flow 2:', error);
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

export default API;