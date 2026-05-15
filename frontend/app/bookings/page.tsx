"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { calculateVIPPriceForRoom } from "@/app/services/api";
import { 
  getTempCart, 
  removeFromTempCart, 
  updateTempCartQuantity, 
  clearTempCart,
  CartItemTemp 
} from "@/app/lib/cartStorage";

interface BookingItem {
  SKU: string;
  product_name: string;
  currentPrice: number;
  quantity: number;
  displayPrice?: number;
  discountPercent?: number;
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

interface CartItemRaw {
  room_id: string;
  quantity: number;
  rooms?: {
    room_type?: string;
    current_price?: number;
  };
}

const ROOM_ICONS: Record<string, string> = {
  "deluxe": "🛏️",
  "standard": "🛏️",
  "suite": "👑",
  "superior": "⭐",
  "family": "👨‍👩‍👧‍👦",
  "executive": "💼",
};

const getRoomIcon = (name: string) => {
  const lower = (name || "").toLowerCase();
  for (const key of Object.keys(ROOM_ICONS)) {
    if (lower.includes(key)) return ROOM_ICONS[key];
  }
  return "🏨";
};

export default function BookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vipCalculating, setVipCalculating] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }
    fetchBookings();
    fetchCustomerInfo();
  }, [isAuthenticated, user, router]);

  const fetchBookings = () => {
    try {
      setLoading(true);
      console.log("[BookingsPage] Fetching temp cart from localStorage");
      
      // Lấy giỏ hàng tạm từ localStorage (không dùng database)
      const tempCart = getTempCart();
      console.log("[BookingsPage] Temp cart:", tempCart);
      
      // Map to BookingItem format
      const mappedBookings: BookingItem[] = tempCart.map((item) => ({
        SKU: item.room_id,
        product_name: item.room_type,
        currentPrice: item.current_price,
        quantity: item.quantity,
        displayPrice: item.displayPrice,
        isVIP: item.isVIP,
        memberLevel: item.memberLevel,
        discountPercent: item.discountPercent,
      }));
      
      console.log("[BookingsPage] Mapped bookings:", mappedBookings);
      setBookings(mappedBookings);
    } catch (err) {
      console.error("[BookingsPage] Error fetching bookings:", err);
      setError("Không thể tải danh sách đặt phòng: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerInfo = async () => {
    if (!user?.customer_id) return;
    setCustomerInfo({
      customer_id: user.customer_id,
      name: user.name,
      membership_type: user.membership_type || "Silver",
      total_orders: user.total_orders || 0,
      total_spent: user.total_spent || 0,
    });
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const removeBooking = (SKU: string) => {
    const item = bookings.find((b) => b.SKU === SKU);
    try {
      // Xóa khỏi localStorage
      removeFromTempCart(SKU);
      // Cập nhật UI
      setBookings((prev) => prev.filter((b) => b.SKU !== SKU));
      showNotification(`✅ Đã xóa "${item?.product_name || "phòng"}" khỏi danh sách`, "success");
    } catch (err) {
      console.error("Lỗi xóa đặt phòng:", err);
      showNotification("❌ Không thể xóa phòng", "error");
      fetchBookings();
    }
  };

  const updateNights = (SKU: string, quantity: number) => {
    if (quantity <= 0) {
      removeBooking(SKU);
      return;
    }
    try {
      // Cập nhật trong localStorage
      updateTempCartQuantity(SKU, quantity);
      // Cập nhật UI
      setBookings((prev) =>
        prev.map((b) => (b.SKU === SKU ? { ...b, quantity } : b))
      );
    } catch (err) {
      console.error("Lỗi cập nhật số đêm:", err);
      showNotification("❌ Không thể cập nhật số đêm", "error");
      fetchBookings();
    }
  };

  const calculateVIPPrices = async () => {
    console.log('🔍 [VIP CALC] Starting VIP price calculation...');
    console.log('[VIP CALC] User:', user);
    console.log('[VIP CALC] Bookings:', bookings);

    if (!user?.customer_id || !user?.email) {
      console.warn('⚠️ [VIP CALC] Missing user info - customer_id:', user?.customer_id, 'email:', user?.email);
      showNotification("⚠️ Vui lòng đăng nhập với email để tính giá VIP", "error");
      return;
    }

    if (bookings.length === 0) {
      console.warn('⚠️ [VIP CALC] No bookings in cart');
      showNotification("⚠️ Giỏ đặt phòng trống", "error");
      return;
    }

    try {
      setVipCalculating(true);
      console.log('🚀 [VIP CALC] Starting to calculate VIP prices for', bookings.length, 'rooms');
      console.log('[VIP CALC] n8n Flow 3 URL:', process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL);
      
      // Tính giá VIP cho từng phòng trong giỏ
      let hasError = false;
      const updatedBookings = await Promise.all(
        bookings.map(async (item, index) => {
          console.log(`📋 [VIP CALC] Processing room ${index + 1}/${bookings.length}:`, {
            SKU: item.SKU,
            room_id: item.SKU,
            email: user.email,
            quantity: item.quantity,
            currentPrice: item.currentPrice
          });

          try {
            // Gọi API tính giá VIP cho từng room (qua n8n Flow 3)
            console.log(`🔌 [VIP CALC] Calling n8n Flow 3 for room ${item.SKU}...`);
            const vipResult = await calculateVIPPriceForRoom(
              item.SKU, // room_id
              user.email,
              item.quantity
            );

            console.log(`📥 [VIP CALC] Received result for room ${item.SKU}:`, vipResult);

            if (vipResult && vipResult.display_price !== undefined && vipResult.display_price > 0) {
              console.log(`✅ [VIP CALC] VIP price calculated for room ${item.SKU}:`, {
                originalPrice: item.currentPrice,
                vipPrice: vipResult.display_price,
                discount: vipResult.discount_percent,
                isVIP: vipResult.isVIP,
                source: vipResult.source
              });

              return {
                ...item,
                displayPrice: vipResult.display_price,
                discountPercent: vipResult.discount_percent || 0,
                isVIP: vipResult.isVIP || false,
                memberLevel: vipResult.member_level || user.membership_type || "Silver"
              };
            } else if (vipResult === null) {
              // n8n không khả dụng
              console.warn(`⚠️ [VIP CALC] n8n service unavailable for room ${item.SKU}`);
              hasError = true;
            } else {
              console.warn(`⚠️ [VIP CALC] Invalid result for room ${item.SKU}, using original price`);
            }
          } catch (err) {
            console.error(`❌ [VIP CALC] Error calculating VIP price for room ${item.SKU}:`, err);
            hasError = true;
          }
          // Nếu lỗi, giữ nguyên giá cũ
          return {
            ...item,
            displayPrice: item.currentPrice,
            discountPercent: 0,
            isVIP: false
          };
        })
      );

      console.log('📊 [VIP CALC] Final updated bookings:', updatedBookings);
      setBookings(updatedBookings);
      
      // Đếm số phòng được áp dụng VIP
      const vipCount = updatedBookings.filter(b => b.isVIP).length;
      console.log(`📈 [VIP CALC] VIP count: ${vipCount}/${bookings.length}`);
      
      if (hasError && vipCount === 0) {
        showNotification(
          "⚠️ Không thể kết nối dịch vụ tính giá VIP. Vui lòng kiểm tra n8n hoặc liên hệ admin.",
          "error"
        );
      } else if (vipCount > 0) {
        showNotification(`✅ Đã tính giá VIP cho ${vipCount}/${bookings.length} phòng`, "success");
      } else {
        showNotification("ℹ️ Không có ưu đãi VIP nào được áp dụng", "success");
      }
    } catch (err) {
      console.error("❌ [VIP CALC] Fatal error:", err);
      showNotification("❌ Không thể tính giá VIP. Vui lòng thử lại.", "error");
    } finally {
      setVipCalculating(false);
      console.log('🏁 [VIP CALC] Calculation completed');
    }
  };

  const clearBookings = () => {
    try {
      // Xóa localStorage
      clearTempCart();
      // Cập nhật UI
      setBookings([]);
      showNotification("✅ Đã xóa toàn bộ đặt phòng", "success");
    } catch (err) {
      console.error("Lỗi xóa danh sách:", err);
      showNotification("❌ Không thể xóa danh sách", "error");
    }
  };

  const checkout = async () => {
    if (bookings.length === 0) {
      showNotification("⚠️ Giỏ đặt phòng đang trống", "error");
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
      
      // Chuyển đổi bookings sang định dạng database
      const cartItemsToInsert = bookings.map(item => ({
        customer_id: user.customer_id,
        room_id: item.SKU,
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
      setBookings([]);
      
      showNotification("✅ Đặt phòng thành công! Đã lưu " + bookings.length + " phòng vào hệ thống.", "success");
      
      // Redirect về trang chủ sau 2 giây
      setTimeout(() => {
        router.push("/");
      }, 2000);
      
    } catch (err) {
      console.error("[Checkout] Error:", err);
      showNotification("❌ Không thể đặt phòng: " + (err instanceof Error ? err.message : "Lỗi không xác định"), "error");
    }
  };

  const subtotal = bookings.reduce((sum, b) => sum + b.currentPrice * b.quantity, 0);
  const vipTotal = bookings.reduce(
    (sum, b) => sum + (b.displayPrice || b.currentPrice) * b.quantity,
    0
  );
  const totalSavings = subtotal - vipTotal;
  const savingsPercent = subtotal > 0 ? Math.round((totalSavings / subtotal) * 100) : 0;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-5xl">🔐</div>
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
        <div className="text-center">
          <div className="mb-4 text-5xl">🏨</div>
          <div className="text-lg text-gray-600">Đang tải danh sách đặt phòng...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🏨 Giỏ đặt phòng</h1>
        {customerInfo && (
          <div className="text-gray-600">
            Khách hàng:{" "}
            <span className="font-semibold">{customerInfo.name}</span> |{" "}
            Hạng thành viên:{" "}
            <span className="font-semibold text-blue-600">{customerInfo.membership_type}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Phòng đã chọn</h2>
                <div className="flex gap-2">
                  <button
                    onClick={calculateVIPPrices}
                    disabled={vipCalculating || bookings.length === 0}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {vipCalculating ? "Đang tính..." : "✨ Giá VIP"}
                  </button>
                  <button
                    onClick={clearBookings}
                    disabled={bookings.length === 0}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-100">
              {bookings.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="mb-4 text-6xl">🏨</div>
                  <p className="text-lg font-medium mb-2">Chưa có phòng nào được chọn</p>
                  <p className="text-sm text-gray-400 mb-6">Hãy khám phá và chọn phòng phù hợp với bạn</p>
                  <button
                    onClick={() => router.push("/rooms")}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold"
                  >
                    Xem danh sách phòng
                  </button>
                </div>
              ) : (
                bookings.map((item) => {
                  const displayPrice = item.displayPrice || item.currentPrice;
                  const hasDiscount = item.displayPrice && item.displayPrice < item.currentPrice;

                  return (
                    <div key={item.SKU} className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Room Icon */}
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                          {getRoomIcon(item.product_name)}
                        </div>

                        {/* Room Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base">{item.product_name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">ID: {item.SKU}</p>

                          {/* Price */}
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <div>
                              <span className="text-lg font-extrabold text-gray-900">
                                {displayPrice.toLocaleString("vi-VN")} ₫
                              </span>
                              <span className="ml-1 text-xs text-gray-400">/đêm</span>
                              {hasDiscount && (
                                <span className="ml-2 text-sm text-gray-400 line-through">
                                  {item.currentPrice.toLocaleString("vi-VN")} ₫
                                </span>
                              )}
                            </div>
                            {item.isVIP && (
                              <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-700">
                                VIP {item.memberLevel?.toUpperCase() || "SILVER"}
                                {item.discountPercent ? ` -${item.discountPercent}%` : ""}
                              </span>
                            )}
                          </div>

                          {/* Subtotal */}
                          <p className="mt-1 text-sm text-slate-500">
                            Tổng: {(displayPrice * item.quantity).toLocaleString("vi-VN")} ₫
                            ({item.quantity} đêm)
                          </p>
                        </div>

                        {/* Nights Controls */}
                        <div className="flex flex-col items-end gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateNights(item.SKU, item.quantity - 1)}
                              disabled={updating}
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50"
                            >
                              −
                            </button>
                            <span className="w-10 text-center font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateNights(item.SKU, item.quantity + 1)}
                              disabled={updating}
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs text-gray-400">đêm</span>

                          {/* Remove */}
                          <button
                            onClick={() => removeBooking(item.SKU)}
                            disabled={updating}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl bg-white shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Tóm tắt đặt phòng</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Tạm tính:</span>
                <span>{subtotal.toLocaleString("vi-VN")} ₫</span>
              </div>

              {totalSavings > 0 && (
                <div className="flex justify-between text-green-600 font-semibold text-sm">
                  <span>Ưu đãi VIP:</span>
                  <span>-{totalSavings.toLocaleString("vi-VN")} ₫</span>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3">
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Tổng cộng:</span>
                  <span>{vipTotal.toLocaleString("vi-VN")} ₫</span>
                </div>
                {savingsPercent > 0 && (
                  <p className="text-right text-sm text-green-600 mt-1">
                    Tiết kiệm {savingsPercent}%
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={checkout}
                disabled={updating || bookings.length === 0}
                className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
              >
                {updating ? "Đang xử lý..." : "✅ Xác nhận đặt phòng"}
              </button>

              <button
                onClick={() => router.push("/rooms")}
                className="w-full rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Tiếp tục xem phòng
              </button>
            </div>

            {bookings.length > 0 && (
              <div className="mt-5 rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  💡 Nhấn <strong>Giá VIP</strong> để nhận ưu đãi thành viên và sự kiện đặc biệt!
                </p>
              </div>
            )}

            {/* Membership Badge */}
            {customerInfo && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500 mb-1">Hạng thành viên của bạn</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {customerInfo.membership_type === "Platinum" ? "💎" :
                     customerInfo.membership_type === "Gold" ? "🥇" : "🥈"}
                  </span>
                  <span className="font-bold text-slate-800">{customerInfo.membership_type}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
