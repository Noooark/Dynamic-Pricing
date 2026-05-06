"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";

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
  displayPrice?: number;
  isVIP?: boolean;
}

interface RoomCardProps {
  rooms: Room[];
}

const ROOM_ICONS: Record<string, string> = {
  "Deluxe Double": "🛏️",
  "Standard Twin": "🛏️",
  "Suite": "👑",
  "Superior": "⭐",
  "Family": "👨‍👩‍👧‍👦",
  "Executive": "💼",
};

const getRoomIcon = (roomType: string) => {
  for (const key of Object.keys(ROOM_ICONS)) {
    if (roomType.toLowerCase().includes(key.toLowerCase())) return ROOM_ICONS[key];
  }
  return "🏨";
};

const getAvailabilityColor = (available: number, total: number) => {
  const ratio = available / total;
  if (ratio === 0) return "text-red-600 bg-red-50";
  if (ratio <= 0.3) return "text-orange-600 bg-orange-50";
  return "text-green-600 bg-green-50";
};

const getAvailabilityText = (available: number) => {
  if (available === 0) return "Hết phòng";
  if (available <= 2) return `Còn ${available} phòng`;
  return `${available} phòng trống`;
};

export default function RoomCard({ rooms }: RoomCardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const handleBookRoom = async (roomId: string) => {
    if (!isAuthenticated || !user?.customer_id) {
      alert("Vui lòng đăng nhập để đặt phòng");
      router.push("/login");
      return;
    }

    try {
      setBookingId(roomId);
      await API.post("/cart/add", {
        CustomerID: user.customer_id,
        SKU: roomId,
        quantity: 1,
      });
      setBookedIds((prev) => new Set([...prev, roomId]));

      const room = rooms.find((r) => r.id === roomId);
      setNotificationMessage(`✅ Đã thêm "${room?.room_type || "Phòng"}" vào danh sách đặt phòng!`);
      setShowNotification(true);

      setTimeout(() => setShowNotification(false), 3000);
      setTimeout(() => {
        setBookedIds((prev) => {
          const next = new Set(prev);
          next.delete(roomId);
          return next;
        });
      }, 2000);
    } catch (err) {
      console.error("Lỗi đặt phòng:", err);
      alert("Không thể đặt phòng. Vui lòng thử lại.");
    } finally {
      setBookingId(null);
    }
  };

  return (
    <div>
      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="text-lg">✓</span>
            <span className="font-medium">{notificationMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => {
          const displayPrice = room.displayPrice || room.current_price || 0;
          const hasDiscount =
            room.isVIP && room.displayPrice && room.displayPrice < room.current_price;
          const availColor = getAvailabilityColor(room.available_rooms, room.total_rooms);
          const isBooked = bookedIds.has(room.id);
          const isBooking = bookingId === room.id;
          const isFull = room.available_rooms === 0;

          return (
            <div
              key={room.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              {/* Room Image Placeholder */}
              <div
                className="relative flex h-44 cursor-pointer items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50"
                onClick={() => router.push(`/room/${room.id}`)}
              >
                <span className="text-6xl">{getRoomIcon(room.room_type)}</span>
                {isFull && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-t-2xl">
                    <span className="rounded-full bg-red-600 px-4 py-1 text-sm font-bold text-white">
                      Hết phòng
                    </span>
                  </div>
                )}
                {room.isVIP && !isFull && (
                  <div className="absolute top-3 right-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-white shadow">
                    VIP DEAL
                  </div>
                )}
              </div>

              {/* Room Info */}
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3
                    className="cursor-pointer text-base font-bold text-slate-900 hover:text-blue-600"
                    onClick={() => router.push(`/room/${room.id}`)}
                  >
                    {room.room_type}
                  </h3>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${availColor}`}>
                    {getAvailabilityText(room.available_rooms)}
                  </span>
                </div>

                {room.location_area && (
                  <p className="mb-3 flex items-center gap-1 text-xs text-slate-500">
                    <span>📍</span>
                    <span>{room.location_area}</span>
                  </p>
                )}

                {/* Price */}
                <div className="mb-4 mt-auto">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-slate-900">
                      {displayPrice.toLocaleString("vi-VN")} ₫
                    </span>
                    <span className="text-xs text-slate-400">/đêm</span>
                  </div>
                  {hasDiscount && (
                    <span className="text-xs text-slate-400 line-through">
                      {room.current_price.toLocaleString("vi-VN")} ₫
                    </span>
                  )}
                </div>

                {/* Book Button */}
                <button
                  onClick={() => handleBookRoom(room.id)}
                  disabled={isBooking || isBooked || isFull}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
                    isFull
                      ? "cursor-not-allowed bg-slate-100 text-slate-400"
                      : isBooked
                      ? "bg-green-600 text-white"
                      : isBooking
                      ? "cursor-not-allowed bg-slate-300 text-slate-500"
                      : "bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-blue-600"
                  }`}
                >
                  {isFull
                    ? "Hết phòng"
                    : isBooked
                    ? "✓ Đã thêm"
                    : isBooking
                    ? "Đang xử lý..."
                    : "Đặt phòng"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {rooms.length === 0 && (
        <div className="p-10 text-center text-slate-500">
          <p className="mb-2 text-4xl">🏨</p>
          <p>Không tìm thấy phòng nào phù hợp.</p>
        </div>
      )}
    </div>
  );
}
