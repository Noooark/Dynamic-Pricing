"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchRooms, fetchPriceHistory } from "@/app/services/api";

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

interface PriceHistory {
  id: string;
  room_id: string;
  room_type: string;
  old_price: number;
  new_price: number;
  reason: string;
  created_at: string;

}
export default function AdminDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [flowRunning, setFlowRunning] = useState(false);
  const [flow1Result, setFlow1Result] = useState<{
    message?: string;
    totalProducts?: number;
    updatedCount?: number;
    unchangedCount?: number;
    error?: string;
    n8nResponse?: Record<string, unknown> | unknown[] | string | number | boolean | null;
  } | null>(null);
  interface ComparisonItem {
    room_type?: string;
    khoi_price?: number;
    competitor_min_price?: number;
    competitor_name?: string;
    matching_rooms_count?: number;
    status?: string;
    // Legacy fields (for backward compatibility)
    old_price?: number;
    new_price?: number;
    avg_market?: number;
    decision?: string;
    competitors_found?: number;
  }

  interface Flow2Summary {
    totalRooms?: number;
    keepCount?: number;
    reduceCount?: number;
    increaseCount?: number;
  }

  const [flow2Result, setFlow2Result] = useState<{
    message?: string;
    totalProducts?: number;
    updatedCount?: number;
    unchangedCount?: number;
    error?: string;
    summary?: Flow2Summary;
    comparison?: ComparisonItem[];
    n8nResponse?: unknown;
  } | null>(null);
  interface EventInfo {
    event_name?: string;
    name?: string;
    increase_percent?: number;
    discount_percent?: number;
    start_date?: string;
    end_date?: string;
  }

  const [flow4Result, setFlow4Result] = useState<{
    message?: string;
    totalProducts?: number;
    updatedCount?: number;
    unchangedCount?: number;
    error?: string;
    eventInfo?: EventInfo;
    hasEvent?: boolean;
    n8nResponse?: unknown;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("rooms");
  const router = useRouter();

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn");
    if (!isAdminLoggedIn) {
      router.push("/admin/login");
    } else {
      loadRooms();
      loadHistory();
    }
  }, [router]);

  const loadRooms = async () => {
    try {
      const data = await fetchRooms();
      setRooms(data);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await fetchPriceHistory(50);
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const runFlow1 = async () => {
    if (!confirm("Bạn có chắc muốn chạy FLOW 1 - Tự động giảm giá theo đối thủ?")) {
      return;
    }

    setFlowRunning(true);
    setFlow1Result(null);

    try {
      const { triggerFlow1 } = await import("@/app/services/api");
      const response = await triggerFlow1();
      setFlow1Result(response);
      loadRooms();
      loadHistory();
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setFlow1Result({ error: error.message || "Lỗi khi chạy FLOW 1" });
    } finally {
      setFlowRunning(false);
    }
  };

  const runFlow2 = async () => {
    if (!confirm("Bạn có chắc muốn chạy FLOW 2 - Theo dõi giá đối thủ? Hệ thống sẽ quét giá từ Google Hotels và điều chỉnh giá phòng.")) {
      return;
    }

    setFlowRunning(true);
    setFlow2Result(null);

    try {
      console.log("[Flow2] Starting Flow 2...");
      const { triggerFlow2 } = await import("@/app/services/api");
      const response = await triggerFlow2();
      console.log("[Flow2] Response received:", response);
      console.log("[Flow2] Response type:", typeof response);
      console.log("[Flow2] Is array?", Array.isArray(response));
      
      // Parse response to ensure correct format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let flow2Response: any = {};
      
      // If response is an array, it means rooms were compared
      if (Array.isArray(response)) {
        flow2Response = {
          message: `Đã quét và so sánh ${response.length} phòng`,
          n8nResponse: response
        };
      } else if (typeof response === 'string') {
        try {
          flow2Response = JSON.parse(response);
        } catch {
          flow2Response = { message: response };
        }
      } else if (typeof response === 'object' && response !== null) {
        flow2Response = response;
      }
      
      console.log("[Flow2] Processed response:", flow2Response);
      setFlow2Result(flow2Response);
      loadRooms();
      loadHistory();
    } catch (err) {
      console.error("[Flow2] Error:", err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setFlow2Result({ error: error.message || "Lỗi khi chạy FLOW 2" });
    } finally {
      setFlowRunning(false);
    }
  };

  const runFlow4 = async () => {
    if (!confirm("Bạn có chắc muốn chạy FLOW 4 - Cập nhật giảm giá theo event?")) {
      return;
    }

    setFlowRunning(true);
    setFlow4Result(null);

    try {
      console.log("[Flow4] Starting Flow 4...");
      const { triggerFlow4 } = await import("@/app/services/api");
      const response = await triggerFlow4();
      console.log("[Flow4] Response:", response);
      
      // Parse response to ensure correct format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let flow4Response: any = {};
      
      // If response is an array, check if rooms have update_reason (event info)
      if (Array.isArray(response)) {
        // Check if any room has update_reason containing event info
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const roomWithEvent = response.find((room: any) => room.update_reason && room.update_reason.includes('Sự kiện'));
        const eventInfo = roomWithEvent ? {
          event_name: roomWithEvent.update_reason.replace('Sự kiện: ', ''),
          increase_percent: roomWithEvent.increase_percent || 0
        } : null;
        
        flow4Response = {
          message: `Đã cập nhật giá cho ${response.length} phòng`,
          updatedCount: response.length,
          hasEvent: !!eventInfo,
          eventInfo: eventInfo,
          n8nResponse: response
        };
      } else if (typeof response === 'string') {
        try {
          flow4Response = JSON.parse(response);
        } catch {
          flow4Response = { message: response, hasEvent: false };
        }
      } else if (typeof response === 'object' && response !== null) {
        flow4Response = response;
        
        // Ensure hasEvent and eventInfo are set correctly
        if (flow4Response.eventInfo || (flow4Response.event_info && typeof flow4Response.event_info === 'object')) {
          flow4Response.hasEvent = true;
          flow4Response.eventInfo = flow4Response.eventInfo || flow4Response.event_info;
        } else if (flow4Response.hasEvent === undefined) {
          flow4Response.hasEvent = false;
        }
      }
      
      console.log("[Flow4] Processed response:", flow4Response);
      setFlow4Result(flow4Response);
      loadRooms();
      loadHistory();
    } catch (err) {
      console.error("[Flow4] Error:", err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setFlow4Result({ error: error.message || "Lỗi khi chạy FLOW 4" });
    } finally {
      setFlowRunning(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("isAdminLoggedIn");
    router.push("/admin/login");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const [adminInfo, setAdminInfo] = useState<{
    admin_id?: number;
    username?: string;
    full_name?: string;
    email?: string;
    role?: string;
  } | null>(null);

  useEffect(() => {
    const getAdminInfo = () => {
      if (typeof window !== 'undefined') {
        const admin = localStorage.getItem("admin");
        return admin ? JSON.parse(admin) : null;
      }
      return null;
    };
    setAdminInfo(getAdminInfo());
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            {adminInfo && (
              <p className="text-gray-600 mt-1">Xin chào, {adminInfo.full_name}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Flow 1 Button */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">FLOW 1: Tự động giảm giá theo số lượng phòng trống</h2>
          {/* <div className="text-gray-600 mb-4">
            <p>Hệ thống sẽ tự động kiểm tra giá đối thủ và điều chỉnh giá sản phẩm theo các quy tắc:</p>
            <ul className="list-disc list-inside mt-2">trống
              <li>Giảm 1.000đ so với giá đối thủ</li>
              <li>Không giảm dưới Floor Price</li>
              <li>Bảo vệ margin tối thiểu 12%</li>
              <li>Giới hạn giảm tối đa theo % cài đặt</li>
            </ul>
          </div> */}
          
          {/* Webhook URL Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">🔗 Webhook URL:</span>{" "}
              <code className="bg-white px-2 py-1 rounded text-xs break-all">
                https://nonempirically-araucarian-leia.ngrok-free.dev/webhook/flow1
              </code>
            </p>
          </div>
          
          <button
            onClick={runFlow1}
            disabled={flowRunning}
            className={`px-6 py-3 rounded font-bold text-white transition ${
              flowRunning ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {flowRunning ? "Đang chạy..." : "Chạy FLOW 1 Ngay"}
          </button>

          {flow1Result && (
            <div className={`mt-4 p-4 rounded ${flow1Result.error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {flow1Result.error ? (
                <p>{flow1Result.error}</p>
              ) : (
                <div>
                  <p className="font-bold">{flow1Result.message}</p>
                  {flow1Result.totalProducts && <p>Tổng sản phẩm: {flow1Result.totalProducts}</p>}
                  {flow1Result.updatedCount !== undefined && <p>Đã cập nhật: {flow1Result.updatedCount}</p>}
                  {flow1Result.unchangedCount !== undefined && <p>Không thay đổi: {flow1Result.unchangedCount}</p>}
                  {flow1Result.n8nResponse !== undefined && flow1Result.n8nResponse !== null && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-semibold">Xem chi tiết phản hồi n8n</summary>
                      <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(flow1Result.n8nResponse, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Flow 2 Button */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">FLOW 2: Theo dõi giá đối thủ</h2>
          {/* <div className="text-gray-600 mb-4">
            <p>Hệ thống sẽ tự động quét giá đối thủ từ Google Hotels và điều chỉnh giá phòng:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Quét giá từ Google Hotels qua SerpAPI</li>
              <li>So sánh giá phòng của mình với đối thủ</li>
              <li>Tự động điều chỉnh: Giảm nếu đắt hơn 22%, Tăng nếu rẻ hơn 22%</li>
              <li>Không giảm dưới Floor Price</li>
              <li>Gửi email thông báo ưu đãi cho khách hàng</li>
            </ul>
          </div> */}
          
          {/* Webhook URL Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">🔗 Webhook URL:</span>{" "}
              <code className="bg-white px-2 py-1 rounded text-xs break-all">
                https://nonempirically-araucarian-leia.ngrok-free.dev/webhook/flow2
              </code>
            </p>
          </div>
          
          <button
            onClick={runFlow2}
            disabled={flowRunning}
            className={`px-6 py-3 rounded font-bold text-white transition ${
              flowRunning ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {flowRunning ? "Đang quét..." : "Chạy FLOW 2 Ngay"}
          </button>

          {flow2Result && (
            <div className={`mt-4 p-4 rounded ${flow2Result.error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {flow2Result.error ? (
                <p>{flow2Result.error}</p>
              ) : (
                <div>
                  <p className="font-bold">{flow2Result.message}</p>
                  
                  {/* Summary Statistics */}
                  {flow2Result.summary && (
                    <div className="mt-4 grid grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-500">Tổng phòng</p>
                        <p className="text-2xl font-bold">{flow2Result.summary.totalRooms}</p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-lg shadow-sm">
                        <p className="text-sm text-green-600">Giữ nguyên</p>
                        <p className="text-2xl font-bold text-green-700">{flow2Result.summary.keepCount}</p>
                      </div>
                      <div className="bg-red-100 p-3 rounded-lg shadow-sm">
                        <p className="text-sm text-red-600">Giảm giá</p>
                        <p className="text-2xl font-bold text-red-700">{flow2Result.summary.reduceCount}</p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-lg shadow-sm">
                        <p className="text-sm text-blue-600">Tăng giá</p>
                        <p className="text-2xl font-bold text-blue-700">{flow2Result.summary.increaseCount}</p>
                      </div>
                    </div>
                  )}

                  {/* Comparison Table - Support both old and new format */}
                  {(() => {
                    // Handle new format: array of {my_room, khoi_price, competitor_name, competitor_price, status}
                    const n8nResponse = flow2Result.n8nResponse;
                    if (Array.isArray(n8nResponse) && n8nResponse.length > 0 && n8nResponse[0]?.my_room) {
                      return (
                        <div className="mt-6">
                          <h3 className="font-bold text-lg mb-3">Báo cáo so sánh giá</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white rounded-lg overflow-hidden">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại phòng</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá của mình</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đối thủ</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá đối thủ</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {n8nResponse.map((item: {
                                  my_room?: string;
                                  khoi_price?: number;
                                  competitor_name?: string;
                                  competitor_price?: number;
                                  status?: string;
                                }, index: number) => {
                                  const isExpensive = item.status?.includes('🔴');
                                  const statusColor = isExpensive ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50';
                                  const priceDiff = (item.khoi_price || 0) - (item.competitor_price || 0);
                                  
                                  return (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm font-medium">{item.my_room}</td>
                                      <td className="px-4 py-3 text-sm font-semibold">
                                        {item.khoi_price?.toLocaleString('vi-VN')} ₫
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        {item.competitor_name || '—'}
                                      </td>
                                      <td className="px-4 py-3 text-sm font-bold text-blue-600">
                                        {item.competitor_price?.toLocaleString('vi-VN')} ₫
                                      </td>
                                      <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded ${statusColor} font-semibold`}>
                                          {item.status || '—'}
                                        </span>
                                        {priceDiff > 0 && (
                                          <span className="text-xs text-red-600 ml-2">
                                            Cao hơn {priceDiff.toLocaleString('vi-VN')}₫
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }
                    
                    // Handle old format
                    if (flow2Result.comparison && flow2Result.comparison.length > 0) {
                      return (
                        <div className="mt-6">
                          <h3 className="font-bold text-lg mb-3">Báo cáo so sánh giá</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white rounded-lg overflow-hidden">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại phòng</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá của mình</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá đối thủ thấp nhất</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đối thủ</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số phòng khớp</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {flow2Result.comparison.map((item, index) => {
                                  const khoiPrice = item.khoi_price || 0;
                                  const competitorPrice = item.competitor_min_price || 0;
                                  const isExpensive = item.status?.includes('Đắt') || khoiPrice > competitorPrice * 1.22;
                                  const statusColor = isExpensive ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50';
                                  const statusIcon = isExpensive ? '🔴' : '🟢';
                                  const priceDiff = khoiPrice - competitorPrice;
                                  const priceDiffPercent = competitorPrice ? ((priceDiff / competitorPrice) * 100).toFixed(1) : '0';
                                  
                                  return (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm font-medium">{item.room_type}</td>
                                      <td className="px-4 py-3 text-sm font-semibold">
                                        {item.khoi_price?.toLocaleString('vi-VN')} ₫
                                      </td>
                                      <td className="px-4 py-3 text-sm font-bold text-blue-600">
                                        {item.competitor_min_price?.toLocaleString('vi-VN')} ₫
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        {item.competitor_name || '—'}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-center">
                                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                                          {item.matching_rooms_count || 0} phòng
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm">
                                        <div className="flex flex-col gap-1">
                                          <span className={`px-2 py-1 rounded ${statusColor} font-semibold`}>
                                            {statusIcon} {item.status || (isExpensive ? 'Đắt' : 'Tốt')}
                                          </span>
                                          {priceDiff > 0 && (
                                            <span className="text-xs text-red-600">
                                              Cao hơn {priceDiff.toLocaleString('vi-VN')}₫ ({priceDiffPercent}%)
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Raw Response (collapsible) */}
                  {flow2Result.n8nResponse !== undefined && flow2Result.n8nResponse !== null && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-semibold">Xem chi tiết phản hồi n8n</summary>
                      <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-64">
                        {JSON.stringify(flow2Result.n8nResponse, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Flow 4 Button */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">FLOW 4: Cập nhật giảm giá theo Event</h2>
          <div className="text-gray-600 mb-4">
            <p>Hệ thống sẽ kiểm tra các event đang active và cập nhật giá sản phẩm theo discount của event:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Kiểm tra các event đang diễn ra</li>
              <li>Lấy event có discount cao nhất</li>
              <li>Áp dụng discount lên giá hiện tại</li>
              <li>Cập nhật giá mới cho tất cả sản phẩm</li>
              <li>Ghi log lịch sử thay đổi giá</li>
            </ul>
          </div>
          <button
            onClick={runFlow4}
            disabled={flowRunning}
            className={`px-6 py-3 rounded font-bold text-white transition ${
              flowRunning ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            {flowRunning ? "Đang chạy..." : "Chạy FLOW 4 Ngay"}
          </button>

          {flow4Result && (
            <div className={`mt-4 p-4 rounded ${flow4Result.error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {flow4Result.error ? (
                <p>{flow4Result.error}</p>
              ) : (
                <div>
                  <p className="font-bold">{flow4Result.message}</p>
                  
                  {/* Event Info */}
                  {(() => {
                    const eventData = flow4Result.eventInfo || flow4Result.n8nResponse;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if (eventData && typeof eventData === 'object' && (eventData as any).event_name) {
                      return 
                        <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                          <h3 className="font-bold text-lg mb-3 text-gray-800">📅 Thông tin sự kiện</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Tên sự kiện</p>
                              <p className="font-semibold text-lg">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(eventData as any).event_name || (eventData as any).name || '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Tỷ lệ tăng giá</p>
                              <p className="font-semibold text-lg text-red-600">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                +{((eventData as any).increase_percent || 0) * 100 || (eventData as any).discount_percent || 0}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Ngày bắt đầu</p>
                              <p className="font-medium">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(eventData as any).start_date ? new Date((eventData as any).start_date).toLocaleString('vi-VN') : '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Ngày kết thúc</p>
                              <p className="font-medium">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(eventData as any).end_date ? new Date((eventData as any).end_date).toLocaleString('vi-VN') : '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ;
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if (!flow4Result.eventInfo && !flow4Result.hasEvent && !((flow4Result.n8nResponse as any)?.event_name)) {
                      return (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-yellow-800 font-medium">
                            ⚠️ Không có sự kiện nào đang diễn ra. Giá phòng đã được reset về giá gốc (base_price).
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Updated Rooms Count */}
                  {flow4Result.updatedCount !== undefined && (
                    <div className="mt-3 text-sm">
                      <p>✅ Số phòng đã cập nhật: <span className="font-bold">{flow4Result.updatedCount}</span></p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex mb-4 border-b">
          <button
            onClick={() => setActiveTab("rooms")}
            className={`px-4 py-2 font-bold ${
              activeTab === "rooms"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Danh sách phòng
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 font-bold ${
              activeTab === "history"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Lịch sử giá
          </button>
        </div>

        {/* Rooms Tab */}
        {activeTab === "rooms" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại phòng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khu vực</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá gốc</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá hiện tại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng phòng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Còn trống</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{room.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">{room.room_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.location_area || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(room.base_price)} ₫</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{formatCurrency(room.current_price)} ₫</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {room.floor_price ? `${formatCurrency(room.floor_price)} ₫` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.total_rooms}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        room.available_rooms > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {room.available_rooms}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {room.updated_at ? new Date(room.updated_at).toLocaleString("vi-VN") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại phòng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá cũ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá mới</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thay đổi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lý do</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Chưa có lịch sử thay đổi giá
                    </td>
                  </tr>
                ) : (
                  history.map((item) => {
                    const change = item.new_price - item.old_price;
                    const changePercent = ((change / item.old_price) * 100).toFixed(1);
                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.room_type || "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(item.old_price)} ₫
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {formatCurrency(item.new_price)} ₫
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={change >= 0 ? "text-red-600" : "text-green-600"}>
                            {change >= 0 ? "+" : ""}{formatCurrency(change)} ₫ ({change >= 0 ? "+" : ""}{changePercent}%)
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {item.reason || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
