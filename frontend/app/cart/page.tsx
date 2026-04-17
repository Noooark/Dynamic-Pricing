"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

interface CartItem {
  SKU: string;
  product_name: string;
  currentPrice: number;
  quantity: number;
  displayPrice?: number;
  discountPercent?: number;
  isVIP?: boolean;
  memberLevel?: string;
  eventInfo?: {
    name: string;
    discount_percent: number;
    hasEvent: boolean;
  } | null;
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

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }
    fetchCart();
    fetchCustomerInfo();
  }, [isAuthenticated, user, router]);

  const fetchCart = async () => {
    if (!user?.customer_id) return;
    
    try {
      setLoading(true);
      const res = await API.get(`/cart?CustomerID=${user.customer_id}`);
      setCart(res.data.items || []);
    } catch (err) {
      console.error("Lỗi lấy giỏ hàng:", err);
      setError("Không thể tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerInfo = async () => {
    if (!user?.customer_id) return;
    
    // Use the user data from AuthContext directly instead of API call
    setCustomerInfo({
      customer_id: user.customer_id,
      name: user.name,
      membership_type: user.membership_type || 'Silver',
      total_orders: user.total_orders || 0,
      total_spent: user.total_spent || 0
    });
  };

  const addToCart = async (SKU: string) => {
    if (!user?.customer_id) {
      router.push("/login");
      return;
    }

    try {
      await API.post("/cart/add", {
        CustomerID: user.customer_id,
        SKU,
        quantity: 1
      });
      fetchCart();
    } catch (err) {
      console.error("Lỗi thêm vào giỏ:", err);
      setError("Không thể thêm sản phẩm vào giỏ");
    }
  };

  const removeFromCart = async (SKU: string) => {
    if (!user?.customer_id) return;

    const item = cart.find(item => item.SKU === SKU);

    try {
      await API.post("/cart/remove", {
        CustomerID: user.customer_id,
        SKU
      });
      
      // Cập nhật UI ngay lập tức (optimistic update)
      setCart(prev => prev.filter(item => item.SKU !== SKU));
      
      // Hiển thị thông báo
      showNotification(`✅ Đã xóa "${item?.product_name || SKU}" khỏi giỏ hàng`, 'success');
    } catch (err) {
      console.error("Lỗi xóa khỏi giỏ:", err);
      showNotification("❌ Không thể xóa sản phẩm khỏi giỏ", 'error');
      // Reload lại giỏ hàng nếu có lỗi
      fetchCart();
    }
  };

  const updateQuantity = async (SKU: string, quantity: number) => {
    if (!user?.customer_id) return;
    
    const item = cart.find(item => item.SKU === SKU);
    if (!item) return;

    if (quantity <= 0) {
      await removeFromCart(SKU);
      return;
    }

    // Optimistic update - cập nhật ngay lập tức
    setCart(prev => prev.map(item => 
      item.SKU === SKU ? { ...item, quantity } : item
    ));

    try {
      // Sử dụng PUT thay vì POST, và endpoint đúng là /cart/update
      await API.put("/cart/update", {
        CustomerID: user.customer_id,
        SKU,
        quantity
      });
    } catch (err) {
      console.error("Lỗi cập nhật số lượng:", err);
      showNotification("❌ Không thể cập nhật số lượng", 'error');
      // Quay lại số lượng cũ nếu có lỗi
      fetchCart();
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const calculateVIPPrices = async () => {
    if (!user?.customer_id || cart.length === 0) return;

    try {
      setVipCalculating(true);
      const res = await API.post("/cart/calculate-vip", {
        CustomerID: user.customer_id
      });
      
      console.log("VIP calculation response:", res.data);
      
      if (res.data.cart?.items) {
        setCart(res.data.cart.items);
      } else if (res.data.items) {
        // Fallback in case response structure is different
        setCart(res.data.items);
      }
    } catch (err) {
      console.error("Lỗi tính giá VIP:", err);
      setError("Không thể tính giá VIP");
    } finally {
      setVipCalculating(false);
    }
  };

  const checkout = async () => {
    if (!user?.customer_id) {
      router.push("/login");
      return;
    }

    try {
      setUpdating(true);
      const res = await API.post("/cart/checkout", {
        CustomerID: user.customer_id
      });
      
      alert("Đặt hàng thành công!");
      setCart([]);
      router.push("/account");
    } catch (err) {
      console.error("Lỗi checkout:", err);
      setError("Không thể hoàn tất đơn hàng");
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    if (!user?.customer_id) return;

    try {
      await API.post("/cart/clear", {
        CustomerID: user.customer_id
      });
      setCart([]);
    } catch (err) {
      console.error("Lỗi xóa giỏ hàng:", err);
      setError("Không thể xóa giỏ hàng");
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

      {/* Notification Toast */}
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
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Sản phẩm</h2>
                <div className="flex gap-2">
                  <button
                    onClick={calculateVIPPrices}
                    disabled={vipCalculating || cart.length === 0}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {vipCalculating ? "Đang tính..." : "Tính giá VIP"}
                  </button>
                  <button
                    onClick={clearCart}
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
                    onClick={() => router.push("/products")}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Tiếp tục mua sắm
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.SKU} className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                        <p className="text-sm text-gray-600">SKU: {item.SKU}</p>
                        
                        {/* Price Display */}
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
                                {item.discountPercent && (
                                  <span className="ml-1 font-semibold">-{item.discountPercent}%</span>
                                )}
                              </span>
                            )}
                          </div>
                          
                        </div>
                      </div>

                      {/* Quantity Controls */}
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

                      {/* Remove Button */}
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

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Tổng đơn hàng</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính:</span>
                <span>{subtotal.toLocaleString("vi-VN")} ₫</span>
              </div>
              
              {totalSavings > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Giảm giá:</span>
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
                {updating ? "Đang xử lý..." : "Thanh toán ngay"}
              </button>
              
              <button
                onClick={() => router.push("/products")}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
              >
                Tiếp tục mua sắm
              </button>
            </div>

            {cart.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 Nhấn "Tính giá VIP" để nhận ưu đãi thành viên và sự kiện!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}