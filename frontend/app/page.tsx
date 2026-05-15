"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoomCard from "./components/room/RoomCard";
import { fetchRooms } from "./services/api";

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

export default function Home() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("");
  const [filterArea, setFilterArea] = useState<string>("");

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const data = await fetchRooms();
        setRooms(data);
      } catch (err) {
        let errorMessage = "Không thể tải danh sách phòng";
        if (err instanceof Error) errorMessage = err.message;
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  // Lấy danh sách loại phòng và khu vực duy nhất để filter
  const roomTypes = Array.from(new Set(rooms.map((r) => r.room_type)));
  const locationAreas = Array.from(
    new Set(rooms.map((r) => r.location_area).filter(Boolean))
  ) as string[];

  const filteredRooms = rooms.filter((room) => {
    const matchType = filterType ? room.room_type === filterType : true;
    const matchArea = filterArea ? room.location_area === filterArea : true;
    return matchType && matchArea;
  });

  const availableCount = rooms.filter((r) => r.available_rooms > 0).length;

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
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Hero Section */}
      <div className="mb-10">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 px-8 py-12 text-white shadow-xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Khoi <span className="text-cyan-200">Hotel</span>
          </h1>
          <p className="mt-3 text-lg text-blue-100">
            Hệ thống đặt phòng thông minh với định giá động theo thời gian thực
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="rounded-2xl bg-white/20 px-5 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">{rooms.length}</p>
              <p className="text-sm text-blue-100">Loại phòng</p>
            </div>
            <div className="rounded-2xl bg-white/20 px-5 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">{availableCount}</p>
              <p className="text-sm text-blue-100">Phòng còn trống</p>
            </div>
            <div className="rounded-2xl bg-white/20 px-5 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">{locationAreas.length || "—"}</p>
              <p className="text-sm text-blue-100">Khu vực</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-slate-600">Lọc phòng:</span>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Tất cả khu vực</option>
            {locationAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        )}

        {(filterType || filterArea) && (
          <button
            onClick={() => {
              setFilterType("");
              setFilterArea("");
            }}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            Xóa bộ lọc
          </button>
        )}

        <span className="ml-auto text-sm text-slate-500">
          {filteredRooms.length} phòng
        </span>
      </div>

      {/* Room List */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-50 px-6 py-5">
          <h2 className="text-xl font-bold text-gray-800">Danh sách phòng</h2>
          <p className="mt-1 text-sm text-gray-500">
            Giá được cập nhật tự động theo nhu cầu và sự kiện
          </p>
        </div>

        <RoomCard rooms={filteredRooms} />
      </div>

      {filteredRooms.length === 0 && !loading && (
        <div className="py-20 text-center text-gray-400">
          <p className="mb-4 text-5xl">🏨</p>
          <p>Không tìm thấy phòng phù hợp với bộ lọc.</p>
        </div>
      )}
    </div>
  );
}
