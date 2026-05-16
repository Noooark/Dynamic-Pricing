"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Room {
  id: string;
  room_type: string;
  base_price: number;
  current_price: number;
  cost_price: number;
  floor_price: number;
  total_rooms: number;
  available_rooms: number;
  location_area?: string;
  updated_at?: string;
}

export default function AdminRoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    room_type: "",
    base_price: 0,
    current_price: 0,
    cost_price: 0,
    floor_price: 0,
    total_rooms: 10,
    available_rooms: 10,
    location_area: "",
  });

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn");
    if (!isAdminLoggedIn) {
      router.push("/admin/login");
      return;
    }
    loadRooms();
  }, [router]);

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("room_type", { ascending: true });

      if (error) throw error;
      setRooms(data || []);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        room_type: room.room_type,
        base_price: room.base_price,
        current_price: room.current_price,
        cost_price: room.cost_price,
        floor_price: room.floor_price,
        total_rooms: room.total_rooms,
        available_rooms: room.available_rooms,
        location_area: room.location_area || "",
      });
    } else {
      setEditingRoom(null);
      setFormData({
        room_type: "",
        base_price: 0,
        current_price: 0,
        cost_price: 0,
        floor_price: 0,
        total_rooms: 10,
        available_rooms: 10,
        location_area: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRoom(null);
  };

  const handleSave = async () => {
    if (!formData.room_type.trim()) {
      alert("Vui lòng nhập tên loại phòng");
      return;
    }

    try {
      if (editingRoom) {
        const { error } = await supabase
          .from("rooms")
          .update({
            room_type: formData.room_type,
            base_price: formData.base_price,
            current_price: formData.current_price,
            cost_price: formData.cost_price,
            floor_price: formData.floor_price,
            total_rooms: formData.total_rooms,
            available_rooms: formData.available_rooms,
            location_area: formData.location_area,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingRoom.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("rooms").insert({
          room_type: formData.room_type,
          base_price: formData.base_price,
          current_price: formData.current_price,
          cost_price: formData.cost_price,
          floor_price: formData.floor_price,
          total_rooms: formData.total_rooms,
          available_rooms: formData.available_rooms,
          location_area: formData.location_area,
        });

        if (error) throw error;
      }

      handleCloseModal();
      loadRooms();
    } catch (err) {
      console.error("Error saving room:", err);
      alert("Có lỗi xảy ra khi lưu phòng");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa phòng này?")) return;

    try {
      const { error } = await supabase.from("rooms").delete().eq("id", id);

      if (error) throw error;
      loadRooms();
    } catch (err) {
      console.error("Error deleting room:", err);
      alert("Có lỗi xảy ra khi xóa phòng");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-5xl">🏨</div>
          <div className="text-lg text-gray-600">Đang tải danh sách phòng...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🏨 Quản lý Phòng</h1>
            <p className="text-gray-600">Quản lý thông tin phòng và giá cả</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Quay lại Dashboard
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Thêm phòng
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phòng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá hiện tại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá gốc</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá sàn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trống</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khu vực</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{room.room_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-semibold">{room.current_price.toLocaleString("vi-VN")} ₫</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{room.base_price.toLocaleString("vi-VN")} ₫</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{room.floor_price.toLocaleString("vi-VN")} ₫</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{room.total_rooms}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      room.available_rooms === 0 ? "text-red-600" :
                      room.available_rooms <= room.total_rooms * 0.2 ? "text-amber-600" :
                      "text-green-600"
                    }`}>
                      {room.available_rooms}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{room.location_area || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenModal(room)} className="text-blue-600 hover:text-blue-900 mr-3">Sửa</button>
                    <button onClick={() => handleDelete(room.id)} className="text-red-600 hover:text-red-900">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rooms.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <div className="mb-4 text-6xl">🏨</div>
            <p className="text-lg font-medium mb-2">Chưa có phòng nào</p>
            <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold">
              + Thêm phòng
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingRoom ? "Sửa thông tin phòng" : "Thêm phòng mới"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên loại phòng *</label>
                <input
                  type="text"
                  value={formData.room_type}
                  onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                  placeholder="Ví dụ: Standard Single, Deluxe Double..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá hiện tại (₫) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.current_price}
                    onChange={(e) => setFormData({ ...formData, current_price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá gốc (₫)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá sàn (₫)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.floor_price}
                    onChange={(e) => setFormData({ ...formData, floor_price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá vốn (₫)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tổng số phòng</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.total_rooms}
                    onChange={(e) => setFormData({ ...formData, total_rooms: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phòng trống</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.available_rooms}
                    onChange={(e) => setFormData({ ...formData, available_rooms: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực</label>
                <input
                  type="text"
                  value={formData.location_area}
                  onChange={(e) => setFormData({ ...formData, location_area: e.target.value })}
                  placeholder="Ví dụ: Đà Nẵng - Sơn Trà..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={handleCloseModal} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Hủy
              </button>
              <button onClick={handleSave} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}