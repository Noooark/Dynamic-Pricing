"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Event {
  id: string;
  event_name: string;
  start_date: string;
  end_date: string;
  increase_percent: number;
  priority: number;
  event_type: string;
  description: string;
  is_recurring: boolean;
  created_at: string;
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    event_name: "",
    start_date: "",
    end_date: "",
    increase_percent: 0,
    priority: 1,
    event_type: "",
    description: "",
    is_recurring: false,
  });

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn");
    if (!isAdminLoggedIn) {
      router.push("/admin/login");
      return;
    }
    loadEvents();
  }, [router]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        event_name: event.event_name,
        start_date: event.start_date.split("T")[0],
        end_date: event.end_date.split("T")[0],
        increase_percent: event.increase_percent,
        priority: event.priority,
        event_type: event.event_type || "",
        description: event.description || "",
        is_recurring: event.is_recurring,
      });
    } else {
      setEditingEvent(null);
      setFormData({
        event_name: "",
        start_date: "",
        end_date: "",
        increase_percent: 0,
        priority: 1,
        event_type: "",
        description: "",
        is_recurring: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  const handleSave = async () => {
    if (!formData.event_name.trim()) {
      alert("Vui lòng nhập tên sự kiện");
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      alert("Vui lòng nhập ngày bắt đầu và kết thúc");
      return;
    }

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from("events")
          .update({
            event_name: formData.event_name,
            start_date: formData.start_date,
            end_date: formData.end_date,
            increase_percent: formData.increase_percent,
            priority: formData.priority,
            event_type: formData.event_type,
            description: formData.description,
            is_recurring: formData.is_recurring,
          })
          .eq("id", editingEvent.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert({
          event_name: formData.event_name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          increase_percent: formData.increase_percent,
          priority: formData.priority,
          event_type: formData.event_type,
          description: formData.description,
          is_recurring: formData.is_recurring,
        });

        if (error) throw error;
      }

      handleCloseModal();
      loadEvents();
    } catch (err) {
      console.error("Error saving event:", err);
      alert("Có lỗi xảy ra khi lưu sự kiện");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa sự kiện này?")) return;

    try {
      const { error } = await supabase.from("events").delete().eq("id", id);

      if (error) throw error;
      loadEvents();
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Có lỗi xảy ra khi xóa sự kiện");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-5xl">📅</div>
          <div className="text-lg text-gray-600">Đang tải danh sách sự kiện...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📅 Quản lý Sự kiện</h1>
            <p className="text-gray-600">Quản lý các sự kiện và ngày lễ đặc biệt</p>
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
              + Thêm sự kiện
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sự kiện</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tăng giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ưu tiên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Định kỳ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.event_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{event.event_type || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(event.start_date)} - {formatDate(event.end_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-amber-600">+{event.increase_percent}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.priority >= 3 ? "bg-red-100 text-red-800" :
                      event.priority >= 2 ? "bg-amber-100 text-amber-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {event.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {event.is_recurring ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Hàng năm
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Một lần</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenModal(event)} className="text-blue-600 hover:text-blue-900 mr-3">
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(event.id)} className="text-red-600 hover:text-red-900">
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {events.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <div className="mb-4 text-6xl">📅</div>
            <p className="text-lg font-medium mb-2">Chưa có sự kiện nào</p>
            <p className="text-sm text-gray-400 mb-6">Hãy thêm sự kiện đầu tiên của bạn</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold"
            >
              + Thêm sự kiện
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingEvent ? "Sửa sự kiện" : "Thêm sự kiện mới"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên sự kiện *</label>
                <input
                  type="text"
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  placeholder="Ví dụ: Tết Nguyên Đán, Lễ 30/4..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tăng giá (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.increase_percent}
                    onChange={(e) => setFormData({ ...formData, increase_percent: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Độ ưu tiên</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại sự kiện</label>
                <input
                  type="text"
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  placeholder="Ví dụ: Lễ tết, Sự kiện đặc biệt..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-700">
                  Sự kiện định kỳ hàng năm
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}