/**
 * Cart Storage - Lưu giỏ hàng tạm trong localStorage
 * Chỉ lưu vào database khi khách hàng xác nhận đặt phòng
 */

export interface CartItemTemp {
  room_id: string;
  room_type: string;
  current_price: number;
  quantity: number;
  displayPrice?: number;
  isVIP?: boolean;
  memberLevel?: string;
  discountPercent?: number;
  discountText?: string;
}

const CART_STORAGE_KEY = 'khoi-hotel-temp-cart';

/**
 * Lấy giỏ hàng tạm từ localStorage
 */
export const getTempCart = (): CartItemTemp[] => {
  if (typeof window === 'undefined') {
    console.log('[cartStorage] getTempCart: window is undefined');
    return [];
  }
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    console.log('[cartStorage] getTempCart raw from localStorage:', stored);
    
    if (!stored) {
      console.log('[cartStorage] getTempCart: localStorage is empty');
      return [];
    }
    
    const parsed = JSON.parse(stored);
    console.log('[cartStorage] getTempCart parsed:', parsed);
    console.log('[cartStorage] getTempCart count:', parsed.length);
    return parsed;
  } catch (error) {
    console.error('[cartStorage] Error reading temp cart from localStorage:', error);
    return [];
  }
};

/**
 * Lưu giỏ hàng tạm vào localStorage
 */
export const saveTempCart = (cart: CartItemTemp[]): void => {
  try {
    console.log('[cartStorage] saveTempCart called with:', cart);
    const json = JSON.stringify(cart);
    console.log('[cartStorage] Stringified cart:', json);
    localStorage.setItem(CART_STORAGE_KEY, json);
    console.log('[cartStorage] Saved to localStorage');
    
    // Verify by reading back
    const verify = localStorage.getItem(CART_STORAGE_KEY);
    console.log('[cartStorage] Verified localStorage value:', verify);
  } catch (error) {
    console.error('Error saving temp cart to localStorage:', error);
  }
};

/**
 * Thêm phòng vào giỏ hàng tạm
 */
export const addToTempCart = (item: Omit<CartItemTemp, 'quantity'>, quantity: number = 1): CartItemTemp[] => {
  console.log('[cartStorage] addToTempCart called with:', item, 'quantity:', quantity);
  const cart = getTempCart();
  
  // Kiểm tra xem phòng đã có trong giỏ chưa
  const existingIndex = cart.findIndex(i => i.room_id === item.room_id);
  
  if (existingIndex >= 0) {
    // Cập nhật số lượng
    cart[existingIndex].quantity += quantity;
    console.log('[cartStorage] Updated existing item, new quantity:', cart[existingIndex].quantity);
  } else {
    // Thêm mới
    cart.push({ ...item, quantity });
    console.log('[cartStorage] Added new item');
  }
  
  saveTempCart(cart);
  return cart;
};

/**
 * Xóa phòng khỏi giỏ hàng tạm
 */
export const removeFromTempCart = (room_id: string): CartItemTemp[] => {
  console.log('[cartStorage] removeFromTempCart called with room_id:', room_id);
  const cart = getTempCart();
  const filtered = cart.filter(i => i.room_id !== room_id);
  console.log('[cartStorage] After filter, count:', filtered.length);
  saveTempCart(filtered);
  return filtered;
};

/**
 * Cập nhật số lượng phòng trong giỏ tạm
 */
export const updateTempCartQuantity = (room_id: string, quantity: number): CartItemTemp[] => {
  console.log('[cartStorage] updateTempCartQuantity called with:', { room_id, quantity });
  const cart = getTempCart();
  
  if (quantity <= 0) {
    // Xóa nếu quantity = 0
    const filtered = cart.filter(i => i.room_id !== room_id);
    console.log('[cartStorage] Removing item, new count:', filtered.length);
    saveTempCart(filtered);
    return filtered;
  }
  
  // Cập nhật số lượng
  const updated = cart.map(i => 
    i.room_id === room_id ? { ...i, quantity } : i
  );
  
  console.log('[cartStorage] Updated quantity');
  saveTempCart(updated);
  return updated;
};

/**
 * Xóa toàn bộ giỏ hàng tạm
 */
export const clearTempCart = (): void => {
  console.log('[cartStorage] clearTempCart called');
  localStorage.removeItem(CART_STORAGE_KEY);
  console.log('[cartStorage] Cleared localStorage');
};

/**
 * Lấy tổng số phòng trong giỏ tạm
 */
export const getTempCartCount = (): number => {
  const cart = getTempCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
};

/**
 * Tính tổng tiền giỏ hàng tạm
 */
export const getTempCartTotal = (): number => {
  const cart = getTempCart();
  return cart.reduce((sum, item) => {
    const price = item.displayPrice || item.current_price;
    return sum + (price * item.quantity);
  }, 0);
};