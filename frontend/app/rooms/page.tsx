"use client";

import { useEffect, useState } from "react";
import RoomCard from "../components/room/RoomCard";
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
}

function isAxiosError(err: unknown): err is { response?: { data?: unknown }; message?: string } {
  return typeof err === "object" && err !== null;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("");
  const [filterArea, setFilterArea] = useState<string>("");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  useEffect(() => {
    console.log("[RoomsPage] Component mounted, fetching rooms...");

    const fetchRooms = async () => {
      try {
        console.log("[RoomsPage] Calling API.get('/rooms')...");
        const res = await API.get("/rooms");
        console.log("[RoomsPage] API response status:", res.status);
        console.log("[RoomsPage] API response data:", res.data);
        console.log("[RoomsPage] API response data type:", typeof res.data);
        console.log("[RoomsPage] API response data is array?", Array.isArray(res.data));
        if (Array.isArray(res.data)) {
          console.log("[RoomsPage] Number of rooms:", res.data.length);
        }
        setRooms(res.data);
      } catch (err) {
        console.error("[RoomsPage] API ERROR:", err);
        if (isAxiosError(err)) {
          console.error("[RoomsPage] Error response:", err.response);
          console.error("[RoomsPage] Error message:", err.message);
        }
        let errorMessage = "Không thể tải danh sách phòng";
        if (err instanceof Error) errorMessage = err.message;
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const roomTypes = Array.from(new Set(rooms.map((r) => r.room_type)));
  const locationAreas = Array.from(
    new Set(rooms.map((r) => r.location_area).filter(Boolean))
  ) as string[];

  const filteredRooms = rooms.filter((room) => {
    const matchType = filterType ? room.room_type === filterType : true;
    const matchArea = filterArea ? room.location_area === filterArea : true;
    const matchAvail = showAvailableOnly ? room.available_rooms > 0 : true;
    return matchType && matchArea && matchAvail;
  });

  console.log("[RoomsPage] Render - loading:", loading, "error:", error, "rooms count:", rooms.length, "filtered:", filteredRooms.length);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-lg text-slate-500">
        <div className="text-center">
          <div className="mb-4 text-5xl">🏨</div>
          <p>Đang tải danh sách phòng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-lg text-red-500">
        <div className="text-center">
          <div className="mb-4 text-5xl">⚠️</div>
          <p className="font-bold">{error}</p>
          <p className="text-sm mt-2">Vui lòng kiểm tra console (F12) để xem chi tiết lỗi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
          Danh sách <span className="text-blue-600">Phòng</span>
        </h1>
        <p className="mt-2 text-gray-500">
          Khám phá các loại phòng với giá tốt nhất, cập nhật theo thờgian thực
        </p>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <span className="text-sm font-semibold text-slate-600">Bộ lọc:</span>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Tất cả loại phòng</option>
          {roomTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        {locationAreas.length > 0 && (
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Tất cả khu vực</option>
            {locationAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        )}

        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
          <input
            type="checkbox"
            checked={showAvailableOnly}
            onChange={(e) => setShowAvailableOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Chỉ phòng còn trống
        </label>

        {(filterType || filterArea || showAvailableOnly) && (
          <button
            onClick={() => {
              setFilterType("");
              setFilterArea("");
              setShowAvailableOnly(false);
            }}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            Xóa bộ lọc
          </button>
        )}

        <span className="ml-auto text-sm text-slate-500">
          Tìm thấy <strong>{filteredRooms.length}</strong> phòng
        </span>
      </div>

      {/* Room Grid */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <RoomCard rooms={filteredRooms} />
      </div>
    </div>
  );
}
