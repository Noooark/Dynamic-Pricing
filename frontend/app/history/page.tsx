"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/lib/supabase";

interface BookingHistoryItem {
  id: string;
  customer_id: string;
  room_id: string;
  quantity: number;
  created_at: string;
  rooms?: {
    room_type?: string;
    current_price?: number;
  };
}

interface BookingGroup {
  date: string;
  items: BookingHistoryItem[];
  totalRooms: number;
  totalPrice: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [history, setHistory] = useState<BookingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }
    fetchHistory();
  }, [isAuthenticated, user, router]);

  const fetchHistory = async () => {
    if (!user?.customer_id) return;
    
    try {
      setLoading(true);
      console.log("[HistoryPage] Fetching booking history for user:", user.customer_id);
      
      // First, find the actual customer.id from customers table using user_id
      console.log("[HistoryPage] Looking up customer.id...");
      let actualCustomerId: string;
      
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.customer_id)
        .maybeSingle();

      if (customerError) {
        console.error("[HistoryPage] Customer lookup error:", customerError);
        setHistory([]);
        setLoading(false);
        return;
      }

      if (customerData) {
        actualCustomerId = customerData.id;
        console.log("[HistoryPage] Found existing customer.id:", actualCustomerId);
      } else {
        // Customer not found, create new one
        console.log("[HistoryPage] Customer not found, creating new customer...");
        
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            user_id: user.customer_id,
            full_name: user.name || 'User',
            email: user.email,
            rank_id: 1
          })
          .select('id')
          .single();

        if (createError || !newCustomer) {
          console.error("[HistoryPage] Error creating customer:", createError);
          setHistory([]);
          setLoading(false);
          return;
        }

        actualCustomerId = newCustomer.id;
        console.log("[HistoryPage] Created new customer.id:", actualCustomerId);
      }
      
      // Lấy danh sách đặt phòng từ bảng cart
      const { data: cartItems, error } = await supabase
        .from('cart')
        .select(`
          *,
          rooms (
            room_type,
            current_price
          )
        `)
        .eq('customer_id', actualCustomerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("[HistoryPage] Error fetching history:", error);
        throw error;
      }

      console.log("[HistoryPage] Raw cart items:", cartItems);

      // Nhóm theo ngày tạo
      const grouped: Record<string, BookingHistoryItem[]> = {};
      cartItems?.forEach(item => {
        const date = new Date(item.created_at).toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(item);
      });

      // Chuyển thành mảng BookingGroup
      const historyGroups: BookingGroup[] = Object.entries(grouped).map(([date, items]) => ({
        date,
        items,
        totalRooms: items.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: items.reduce((sum, item) => sum + (item.rooms?.current_price || 0) * item.quantity, 0)
      }));

      console.log("[HistoryPage] Grouped history:", historyGroups);
      setHistory(historyGroups);
    } catch (err) {
      console.error("[HistoryPage] Error:", err);
      setError("Không thể tải lịch sử đặt phòng: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const returnRooms = async (groupId: string, items: BookingHistoryItem[]) => {
    if (!user?.customer_id) return;
    
    try {
      setProcessing(groupId);
      console.log(`[HistoryPage] Returning rooms for group ${groupId}:`, items);
      
      // 1. Xóa các items khỏi cart
      const itemIds = items.map(item => item.id);
      const { error: deleteError } = await supabase
        .from('cart')
        .delete()
        .in('id', itemIds);

      if (deleteError) {
        console.error("[HistoryPage] Delete error:", deleteError);
        throw deleteError;
      }

      // 2. Hoàn lại số phòng vào available_rooms
      for (const item of items) {
        // Lấy số phòng hiện tại
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('available_rooms, total_rooms')
          .eq('id', item.room_id)
          .single();

        if (roomError) {
          console.warn(`[HistoryPage] Cannot find room ${item.room_id}:`, roomError);
          continue;
        }

        // Kiểm tra không vượt quá total_rooms
        const newAvailable = Math.min(
          roomData.available_rooms + item.quantity,
          roomData.total_rooms
        );

        // Cập nhật available_rooms
        const { error: updateError } = await supabase
          .from('rooms')
          .update({
            available_rooms: newAvailable,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.room_id);

        if (updateError) {
          console.error(`[HistoryPage] Error updating room ${item.room_id}:`, updateError);
        } else {
          console.log(`[HistoryPage] Returned room ${item.room_id}: ${roomData.available_rooms} -> ${newAvailable}`);
        }
      }

      // 3. Cập nhật UI
      setHistory(prev => prev.filter(group => {
        const hasItemsToDelete = group.items.some(item => itemIds.includes(item.id));
        return !hasItemsToDelete;
      }));

      showNotification(`✅ Đã trả ${items.reduce((sum, item) => sum + item.quantity, 0)} phòng thành công!`, "success");
    } catch (err) {
      console.error("[HistoryPage] Return error:", err);
      showNotification("❌ Không thể trả phòng: " + (err instanceof Error ? err.message : "Lỗi không xác định"), "error");
    } finally {
      setProcessing(null);
    }
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

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
          <div className="mb-4 text-5xl">📋</div>
          <div className="text-lg text-gray-600">Đang tải lịch sử đặt phòng...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Lịch sử đặt phòng</h1>
        <p className="text-gray-600">Quản lý các đơn đặt phòng của bạn</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-12 text-center">
          <div className="mb-4 text-6xl">📋</div>
          <p className="text-lg font-medium text-gray-600 mb-2">Chưa có lịch sử đặt phòng</p>
          <p className="text-sm text-gray-400 mb-6">Hãy bắt đầu đặt phòng đầu tiên của bạn!</p>
          <button
            onClick={() => router.push("/rooms")}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold"
          >
            Xem danh sách phòng
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-white rounded-2xl shadow overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">📅 {group.date}</h3>
                    <p className="text-sm text-gray-500">
                      {group.totalRooms} phòng • {group.totalPrice.toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                  <button
                    onClick={() => returnRooms(`group-${groupIndex}`, group.items)}
                    disabled={processing === `group-${groupIndex}`}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === `group-${groupIndex}` ? "Đang xử lý..." : "🔄 Trả phòng"}
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-100">
                {group.items.map((item) => (
                  <div key={item.id} className="p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                      {item.rooms?.room_type?.includes("Suite") ? "👑" :
                       item.rooms?.room_type?.includes("Deluxe") ? "⭐" :
                       item.rooms?.room_type?.includes("Family") ? "👨‍👩‍👧‍👦" : "🛏️"}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {item.rooms?.room_type || "Phòng"}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {item.quantity} đêm × {(item.rooms?.current_price || 0).toLocaleString("vi-VN")} ₫
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {((item.rooms?.current_price || 0) * item.quantity).toLocaleString("vi-VN")} ₫
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.quantity} phòng
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}