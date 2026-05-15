"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { 
  getTempCart, 
  saveTempCart, 
  removeFromTempCart, 
  updateTempCartQuantity, 
  clearTempCart,
  CartItemTemp 
} from "@/app/lib/cartStorage";

// NOTE: This page uses localStorage for temp cart, NOT Supabase database
// Only checkout() saves to database

interface CartItem extends CartItemTemp {
  SKU: string;
  product_name: string;
  currentPrice: number;
  displayPrice?: number;
  discountPercent?: number;
  discountText?: string;
  isVIP?: boolean;
  memberLevel?: string;
}

interface CustomerInfo {
  customer_id: string;
  name: string;
  membership_type: string;
  total_orders: number;
  total_spent: number;
}

export default function CartPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vipCalculating, setVipCalculating] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Debug: Log khi component mount
  console.log('[CartPage] Component rendered', { isAuthenticated, user });

  useEffect(() => {
    console.log('[CartPage] useEffect triggered', { isAuthenticated, user });
    if (!isAuthenticated || !user) {
      console.log('[CartPage] Not authenticated, redirecting to login');
      router.push("/login");
      return;
    }
    console.log('[CartPage] Calling fetchCart');
    fetchCart();
    fetchCustomerInfo();
  }, [isAuthenticated, user, router]);

  const fetchCart = () => {
    try {
      setLoading(true);
      console.log("[CartPage] === START fetchCart ===");
      console.log("[CartPage] Current localStorage value:", localStorage.getItem('khoi-hotel-temp-cart'));
      
      // Lấy giỏ hàng tạm từ localStorage (không dùng database)
      const tempCart = getTempCart();
      console.log("[CartPage] getTempCart returned:", tempCart);
      console.log("[CartPage] Temp cart length:", tempCart.length);
      
      if (tempCart.length === 0) {
        console.log("[CartPage] Cart is empty!");
      }
      
      // Chuyển đổi định dạng
      const mappedCart: CartItem[] = tempCart.map((item) => ({
        SKU: item.room_id,
        product_name: item.room_type,
        currentPrice: item.current_price,
        current_price: item.current_price,
        room_id: item.room_id,
        room_type: item.room_type,
        quantity: item.quantity,
        displayPrice: item.displayPrice,
        isVIP: item.isVIP,
        memberLevel: item.memberLevel,
        discountPercent: item.discountPercent,
        discountText: item.discountText,
      }));
      
      console.log("[CartPage] Mapped cart:", mappedCart);
      setCart(mappedCart);
      console.log("[CartPage] === END fetchCart ===");
    } catch (err) {
      console.error("[CartPage] Error fetching cart:", err);
      setError("Không thể tải giỏ hàng: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerInfo = () => {
    if (!user?.customer_id) return;
    
    setCustomerInfo({
      customer_id: user.customer_id,
      name: user.name,
      membership_type: user.membership_type || 'Silver',
      total_orders: user.total_orders || 0,
      total_spent: user.total_spent || 0
    });
  };

  const removeFromCart = async (SKU: string) => {
    const item = cart.find(item => item.SKU === SKU);
    console.log('[removeFromCart] Removing item:', { room_id: SKU });

    try {
      // Xóa khỏi localStorage
      const updatedCart = removeFromTempCart(SKU);
      
      // Chuyển đổi và cập nhật UI
      const mappedCart: CartItem[] = updatedCart.map((item) => ({
        SKU: item.room_id,
        product_name: item.room_type,
        currentPrice: item.current_price,
        current_price: item.current_price,
        room_id: item.room_id,
        room_type: item.room_type,
        quantity: item.quantity,
        displayPrice: item.displayPrice,
        isVIP: item.isVIP,
        memberLevel: item.memberLevel,
        discountPercent: item.discountPercent,
        discountText: item.discountText,
      }));
      
      setCart(mappedCart);
      showNotification(`✅ Đã xóa "${item?.product_name || SKU}" khỏi giỏ hàng`, 'success');
    } catch (err) {
      console.error("[removeFromCart] Error:", err);
      showNotification("❌ Không thể xóa sản phẩm khỏi giỏ", 'error');
    }
  };

  const updateQuantity = async (SKU: string, quantity: number) => {
    const item = cart.find(item => item.SKU === SKU);
    if (!item) return;

    console.log('[updateQuantity] Updating:', { room_id: SKU, quantity });

    if (quantity <= 0) {
      await removeFromCart(SKU);
      return;
    }

    try {
      // Cập nhật trong localStorage
      const updatedCart = updateTempCartQuantity(SKU, quantity);
      
      // Chuyển đổi và cập nhật UI
      const mappedCart: CartItem[] = updatedCart.map((item) => ({
        SKU: item.room_id,
        product_name: item.room_type,
        currentPrice: item.current_price,
        current_price: item.current_price,
        room_id: item.room_id,
        room_type: item.room_type,
        quantity: item.quantity,
        displayPrice: item.displayPrice,
        isVIP: item.isVIP,
        memberLevel: item.memberLevel,
        discountPercent: item.discountPercent,
        discountText: item.discountText,
      }));
      
      setCart(mappedCart);
    } catch (err) {
      console.error("[updateQuantity] Error:", err);
      showNotification("❌ Không thể cập nhật số lượng", 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const calculateVIPPrices = () => {
    if (cart.length === 0) {
      showNotification("⚠️ Vui lòng chọn phòng trước khi tính giá VIP", "error");
      return;
    }

    try {
      setVipCalculating(true);
      
      const membershipType = user?.membership_type || 'Standard';
      
      const membershipDiscounts: Record<string, number> = {
        'Platinum': 0.15,
        'Gold': 0.10,
        'Silver': 0.05,
        'Standard': 0.02,
      };
      
      const discountRate = membershipDiscounts[membershipType] || 0;
      
      // Cập nhật giá VIP
      const updatedCart = cart.map((item) => {
        const vipPrice = item.currentPrice * (1 - discountRate);
        return {
          ...item,
          displayPrice: vipPrice,
          isVIP: discountRate > 0,
          memberLevel: membershipType,
          discountPercent: Math.round(discountRate * 100),
          discountText: `${Math.round(discountRate * 100)}%`,
        };
      });
      
      // Lưu vào localStorage
      const tempCart: CartItemTemp[] = updatedCart.map(item => ({
        room_id: item.room_id,
        room_type: item.room_type,
        current_price: item.current_price,
        quantity: item.quantity,
        displayPrice: item.displayPrice,
        isVIP: item.isVIP,
        memberLevel: item.memberLevel,
        discountPercent: item.discountPercent,
        discountText: item.discountText,
      }));
      saveTempCart(tempCart);
      
      setCart(updatedCart);
      showNotification(`✅ Đã áp dụng giá VIP cho hạng ${membershipType}!`, "success");
    } catch (err) {
      console.error("Lỗi tính giá VIP:", err);
      showNotification("❌ Không thể tính giá VIP. Vui lòng thử lại.", "error");
    } finally {
      setVipCalculating(false);
    }
  };

  const checkout = async () => {
    if (cart.length === 0) {
      showNotification("⚠️ Giỏ hàng đang trống", "error");
      return;
    }

    if (!user?.customer_id) {
      showNotification("⚠️ Vui lòng đăng nhập để đặt phòng", "error");
      return;
    }

    try {
      showNotification("⏳ Đang xử lý đặt phòng...", "success");
      
      // Import supabase để lưu vào database
      const { supabase } = await import('@/lib/supabase');
      
      // Chuyển đổi cart items sang định dạng database
      const cartItemsToInsert = cart.map(item => ({
        customer_id: user.customer_id,
        room_id: item.room_id,
        quantity: item.quantity,
      }));
      
      console.log("[Checkout] Saving to database:", cartItemsToInsert);
      
      // Lưu vào bảng cart
      const { data, error } = await supabase
        .from('cart')
        .upsert(cartItemsToInsert, {
          onConflict: 'customer_id,room_id' // Update if exists
        })
        .select();

      if (error) {
        console.error("[Checkout] Database error:", error);
        throw new Error("Không thể lưu đặt phòng: " + error.message);
      }

      console.log("[Checkout] Saved to database:", data);
      
      // Xóa giỏ hàng tạm sau khi đã lưu thành công
      clearTempCart();
      setCart([]);
      
      showNotification("✅ Đặt phòng thành công! Đã lưu " + cart.length + " phòng vào hệ thống.", "success");
      
      // Redirect về trang chủ sau 2 giây
      setTimeout(() => {
        router.push("/");
      }, 2000);
      
    } catch (err) {
      console.error("[Checkout] Error:", err);
      showNotification("❌ Không thể đặt phòng: " + (err instanceof Error ? err.message : "Lỗi không xác định"), "error");
    }
  };

  const clearMyCart = () => {
    try {
      clearTempCart();
      setCart([]);
      showNotification("✅ Đã xóa toàn bộ giỏ hàng", "success");
    } catch (err) {
      console.error("Lỗi xóa giỏ hàng:", err);
      showNotification("❌ Không thể xóa giỏ hàng", "error");
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
  const vipTotal = cart.reduce((sum, item) => sum + ((item.displayPrice || item.currentPrice) * item.quantity), 0);
  const totalSavings = subtotal - vipTotal;
  const savingsPercent = subtotal > 0 ? Math.round((totalSavings / subtotal) * 100) : 0;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Vui lòng đăng nhập</h2>
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Đang tải giỏ hàng...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Giỏ hàng của bạn</h1>
        {customerInfo && (
          <div className="text-gray-600">
            Khách hàng: <span className="font-semibold">{customerInfo.name}</span> | 
            Thành viên: <span className="font-semibold text-blue-600">{customerInfo.membership_type}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-fade-in-down ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {notification.type === 'success' ? '✓' : '✗'}
            </span>
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Phòng đã chọn</h2>
                <div className="flex gap-2">
                  <button
                    onClick={calculateVIPPrices}
                    disabled={vipCalculating || cart.length === 0}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {vipCalculating ? "Đang tính..." : "Tính giá VIP"}
                  </button>
                  <button
                    onClick={clearMyCart}
                    disabled={cart.length === 0}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Xóa giỏ
                  </button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {cart.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-6xl mb-4">🛒</div>
                  <p>Giỏ hàng của bạn đang trống</p>
                  <button
                    onClick={() => router.push("/rooms")}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Chọn phòng ngay
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.SKU} className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                        <p className="text-sm text-gray-600">Mã phòng: {item.SKU}</p>
                        
                        <div className="mt-2 flex flex-col gap-2">
                          <div className="flex items-center space-x-4">
                            <div>
                              <span className="text-lg font-bold text-gray-900">
                                {(item.displayPrice || item.currentPrice).toLocaleString("vi-VN")} ₫
                              </span>
                              {item.displayPrice && item.displayPrice !== item.currentPrice && (
                                <span className="ml-2 text-sm text-gray-500 line-through">
                                  {item.currentPrice.toLocaleString("vi-VN")} ₫
                                </span>
                              )}
                            </div>
                            
                            {item.isVIP && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                VIP {item.memberLevel?.toUpperCase() || 'SILVER'}
                                {(item.discountText || item.discountPercent) && (
                                  <span className="ml-1 font-semibold">
                                    -{item.discountText || `${item.discountPercent}%`}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            const newQty = Math.max(0, item.quantity - 1);
                            updateQuantity(item.SKU, newQty);
                          }}
                          disabled={updating}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Giảm số lượng"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        
                        <span className="w-14 text-center font-bold text-lg">{item.quantity}</span>
                        
                        <button
                          onClick={() => {
                            const newQty = item.quantity + 1;
                            updateQuantity(item.SKU, newQty);
                          }}
                          disabled={updating}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Tăng số lượng"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.SKU)}
                        disabled={updating}
                        className="ml-4 px-4 py-2 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Xóa sản phẩm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Tổng đặt phòng</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính:</span>
                <span>{subtotal.toLocaleString("vi-VN")} ₫</span>
              </div>
              
              {totalSavings > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Giảm giá thành viên:</span>
                  <span>-{totalSavings.toLocaleString("vi-VN")} ₫</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-xl font-bold">
                  <span>Tổng cộng:</span>
                  <span>{vipTotal.toLocaleString("vi-VN")} ₫</span>
                </div>
                {savingsPercent > 0 && (
                  <p className="text-sm text-green-600 text-right">Tiết kiệm {savingsPercent}%</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={checkout}
                disabled={updating || cart.length === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Đang xử lý..." : "Đặt phòng ngay"}
              </button>
              
              <button
                onClick={() => router.push("/rooms")}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
              >
                Tiếp tục chọn phòng
              </button>
            </div>

            {cart.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 Giỏ hàng tạm - Chỉ lưu vào hệ thống khi xác nhận đặt phòng
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}