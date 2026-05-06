"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface Room {
  id: string;
  room_type: string;
  base_price: number;
  floor_price: number;
  cost_price: number;
  current_price: number;
  total_rooms: number;
  available_rooms: number;
  location_area?: string;
  updated_at?: string;
}

const ROOM_ICONS: Record<string, string> = {
  "deluxe": "🛏️",
  "standard": "🛏️",
  "suite": "👑",
  "superior": "⭐",
  "family": "👨‍👩‍👧‍👦",
  "executive": "💼",
};

const getRoomIcon = (roomType: string) => {
  const lower = roomType.toLowerCase();
  for (const key of Object.keys(ROOM_ICONS)) {
    if (lower.includes(key)) return ROOM_ICONS[key];
  }
  return "🏨";
};

const ROOM_AMENITIES: Record<string, string[]> = {
  "Standard": ["📶 WiFi miễn phí", "❄️ Điều hòa", "📺 TV màn hình phẳng", "🚿 Phòng tắm riêng"],
  "Superior": ["📶 WiFi miễn phí", "❄️ Điều hòa", "📺 TV màn hình phẳng", "🛁 Bồn tắm", "☕ Máy pha cà phê"],
  "Deluxe": ["📶 WiFi miễn phí", "❄️ Điều hòa", "📺 Smart TV", "🛁 Bồn tắm cao cấp", "☕ Minibar", "🌅 View đẹp"],
  "Suite": ["📶 WiFi tốc độ cao", "❄️ Điều hòa trung tâm", "📺 Smart TV 55\"", "🛁 Bồn tắm Jacuzzi", "☕ Minibar đầy đủ", "🌅 View panorama", "🛋️ Phòng khách riêng"],
  "Executive": ["📶 WiFi tốc độ cao", "❄️ Điều hòa", "📺 Smart TV", "🛁 Bồn tắm", "☕ Minibar", "🍳 Bữa sáng miễn phí", "🏊 Hồ bơi riêng"],
  "Family": ["📶 WiFi miễn phí", "❄️ Điều hòa", "📺 TV màn hình phẳng", "🚿 2 Phòng tắm", "🛏️ 2 Phòng ngủ", "🍳 Bếp nhỏ"],
};

const getAmenities = (roomType: string): string[] => {
  for (const key of Object.keys(ROOM_AMENITIES)) {
    if (roomType.toLowerCase().includes(key.toLowerCase())) return ROOM_AMENITIES[key];
  }
  return ["📶 WiFi miễn phí", "❄️ Điều hòa", "📺 TV màn hình phẳng", "🚿 Phòng tắm riêng"];
};

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [nights, setNights] = useState(1);

  const id = params.id as string;

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/rooms/${id}`);
        setRoom(res.data);
      } catch (err) {
        console.error("Lỗi lấy thông tin phòng:", err);
        setError("Không thể tải thông tin phòng");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchRoom();
  }, [id]);

  const handleBookRoom = async () => {
    if (!isAuthenticated || !user?.customer_id) {
      alert("Vui lòng đăng nhập để đặt phòng");
      router.push("/login");
      return;
    }

    if (!room) return;

    try {
      setAddingToCart(true);
      await API.post("/cart/add", {
        CustomerID: user.customer_id,
        SKU: room.id,
        quantity: nights,
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      console.error("Lỗi đặt phòng:", err);
      alert("Không thể đặt phòng. Vui lòng thử lại.");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-5xl">🏨</div>
          <div className="text-lg text-gray-600">Đang tải thông tin phòng...</div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {error || "Không tìm thấy phòng"}
        </h2>
        <button
          onClick={() => router.push("/rooms")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Quay lại danh sách phòng
        </button>
      </div>
    );
  }

  const isFull = room.available_rooms === 0;
  const amenities = getAmenities(room.room_type);
  const totalPrice = room.current_price * nights;
  const discountFromBase = room.base_price > room.current_price
    ? Math.round(((room.base_price - room.current_price) / room.base_price) * 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push("/rooms")}
        className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
      >
        ← Quay lại danh sách phòng
      </button>

      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        {/* Room Hero */}
        <div className="relative flex h-64 items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 sm:h-80">
          <span className="text-9xl">{getRoomIcon(room.room_type)}</span>
          {discountFromBase > 0 && (
            <div className="absolute top-4 right-4 rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
              -{discountFromBase}% so với giá niêm yết
            </div>
          )}
          {isFull && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="rounded-full bg-red-600 px-6 py-2 text-lg font-bold text-white">
                Hết phòng
              </span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-0">
          {/* Room Info - Left */}
          <div className="md:col-span-2 p-8 border-r border-gray-100">
            {/* Header */}
            <div className="mb-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                  {room.room_type}
                </span>
                {room.location_area && (
                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    📍 {room.location_area}
                  </span>
                )}
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  isFull ? "bg-red-100 text-red-700" :
                  room.available_rooms <= 2 ? "bg-orange-100 text-orange-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {isFull ? "Hết phòng" : `Còn ${room.available_rooms}/${room.total_rooms} phòng`}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900">
                Phòng {room.room_type}
              </h1>
            </div>

            {/* Price Info */}
            <div className="mb-6 rounded-2xl bg-slate-50 p-5">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <p className="text-sm text-slate-500">Giá hiện tại</p>
                  <p className="text-3xl font-extrabold text-slate-900">
                    {room.current_price.toLocaleString("vi-VN")} ₫
                    <span className="ml-1 text-base font-normal text-slate-400">/đêm</span>
                  </p>
                </div>
                {room.base_price > room.current_price && (
                  <div>
                    <p className="text-sm text-slate-400">Giá niêm yết</p>
                    <p className="text-lg text-slate-400 line-through">
                      {room.base_price.toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Giá sàn: {room.floor_price.toLocaleString("vi-VN")} ₫ | 
                Cập nhật: {room.updated_at ? new Date(room.updated_at).toLocaleString("vi-VN") : "—"}
              </p>
            </div>

            {/* Amenities */}
            <div className="mb-6">
              <h2 className="mb-3 text-lg font-bold text-gray-900">Tiện nghi phòng</h2>
              <div className="grid grid-cols-2 gap-2">
                {amenities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-gray-900">Mô tả</h2>
              <p className="text-gray-600 leading-relaxed">
                Phòng {room.room_type} tại Khoi Hotel mang đến trải nghiệm lưu trú thoải mái và sang trọng.
                Với không gian được thiết kế tinh tế, đầy đủ tiện nghi hiện đại, phòng phù hợp cho cả
                khách du lịch và công tác. Giá phòng được cập nhật tự động theo nhu cầu thị trường
                và các chương trình ưu đãi đặc biệt.
              </p>
            </div>
          </div>

          {/* Booking Panel - Right */}
          <div className="p-8">
            <div className="sticky top-24">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Đặt phòng</h3>

              {/* Nights Selector */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Số đêm
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setNights(Math.max(1, nights - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-lg font-bold">{nights}</span>
                  <button
                    onClick={() => setNights(nights + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price Summary */}
              <div className="mb-6 rounded-2xl bg-blue-50 p-4">
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>{room.current_price.toLocaleString("vi-VN")} ₫ × {nights} đêm</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-blue-100 pt-2 mt-2">
                  <span>Tổng cộng</span>
                  <span>{totalPrice.toLocaleString("vi-VN")} ₫</span>
                </div>
              </div>

              {/* Book Button */}
              <button
                onClick={handleBookRoom}
                disabled={addingToCart || addedToCart || isFull}
                className={`w-full rounded-2xl py-4 text-base font-bold transition-all ${
                  isFull
                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                    : addedToCart
                    ? "bg-green-600 text-white"
                    : addingToCart
                    ? "cursor-not-allowed bg-slate-300 text-slate-500"
                    : "bg-blue-600 text-white hover:-translate-y-0.5 hover:bg-blue-700 shadow-lg shadow-blue-200"
                }`}
              >
                {isFull
                  ? "Hết phòng"
                  : addedToCart
                  ? "✓ Đã thêm vào giỏ"
                  : addingToCart
                  ? "Đang xử lý..."
                  : "Thêm vào giỏ đặt phòng"}
              </button>

              {!isFull && (
                <button
                  onClick={() => router.push("/bookings")}
                  className="mt-3 w-full rounded-2xl border-2 border-blue-600 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                >
                  Xem giỏ đặt phòng
                </button>
              )}

              <p className="mt-4 text-center text-xs text-slate-400">
                💡 Đăng nhập để nhận giá VIP ưu đãi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
