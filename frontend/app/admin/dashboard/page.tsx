"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../services/api";

interface Product {
  sku: string;
  product_name: string;
  current_price: number;
  cost_price: number;
  floor_price: number;
  competitor_price: number;
  max_discount_percent: number;
  last_updated: string;
}

interface PriceHistory {
  id: number;
  sku: string;
  old_price: number;
  new_price: number;
  reason: string;
  competitor_price: number;
  flow_name: string;
  timestamp: string;
  products?: { product_name: string };
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [flowRunning, setFlowRunning] = useState(false);
  const [flow1Result, setFlow1Result] = useState<{
    message?: string;
    totalProducts?: number;
    updatedCount?: number;
    unchangedCount?: number;
    error?: string;
  } | null>(null);
  const [flow2Result, setFlow2Result] = useState<{
    message?: string;
    totalProducts?: number;
    updatedCount?: number;
    unchangedCount?: number;
    error?: string;
  } | null>(null);
  const [flow4Result, setFlow4Result] = useState<{
    message?: string;
    totalProducts?: number;
    updatedCount?: number;
    unchangedCount?: number;
    error?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("products");
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState("");
  const router = useRouter();

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn");
    if (!isAdminLoggedIn) {
      router.push("/admin/login");
    } else {
      fetchProducts();
      fetchHistory();
    }
  }, [router]);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/admin/products");
      setProducts(response.data.products);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get("/admin/price-history?limit=50");
      setHistory(response.data.history);
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
      const response = await api.post("/admin/flow1/run");
      setFlow1Result(response.data);
      fetchProducts();
      fetchHistory();
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setFlow1Result({ error: error.response?.data?.message || "Lỗi khi chạy FLOW 1" });
    } finally {
      setFlowRunning(false);
    }
  };

  const runFlow2 = async () => {
    if (!confirm("Bạn có chắc muốn chạy FLOW 2 - Xả kho tự động?")) {
      return;
    }

    setFlowRunning(true);
    setFlow2Result(null);

    try {
      const response = await api.post("/admin/flow2/run");
      setFlow2Result(response.data);
      fetchProducts();
      fetchHistory();
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setFlow2Result({ error: error.response?.data?.message || "Lỗi khi chạy FLOW 2" });
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
      const response = await api.post("/admin/flow4", {
        date: new Date().toISOString().split('T')[0]
      });
      setFlow4Result(response.data);
      fetchProducts();
      fetchHistory();
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setFlow4Result({ error: error.response?.data?.message || "Lỗi khi chạy FLOW 4" });
    } finally {
      setFlowRunning(false);
    }
  };

  const updatePrice = async (sku: string) => {
    if (!editingPrice || isNaN(parseFloat(editingPrice))) {
      alert("Vui lòng nhập giá hợp lệ");
      return;
    }

    try {
      await api.put(`/admin/products/${sku}`, {
        sku,
        current_price: parseFloat(editingPrice)
      });
      setEditingSku(null);
      setEditingPrice("");
      fetchProducts();
      fetchHistory();
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      alert(error.response?.data?.message || "Cập nhật thất bại");
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
          <h2 className="text-xl font-bold mb-4">FLOW 1: Tự động giảm giá theo đối thủ</h2>
          <div className="text-gray-600 mb-4">
            <p>Hệ thống sẽ tự động kiểm tra giá đối thủ và điều chỉnh giá sản phẩm theo các quy tắc:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Giảm 1.000đ so với giá đối thủ</li>
              <li>Không giảm dưới Floor Price</li>
              <li>Bảo vệ margin tối thiểu 12%</li>
              <li>Giới hạn giảm tối đa theo % cài đặt</li>
            </ul>
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
                </div>
              )}
            </div>
          )}
        </div>

        {/* Flow 2 Button */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">FLOW 2: Xả kho tự động</h2>
          <div className="text-gray-600 mb-4">
            <p>Hệ thống sẽ tự động kiểm tra tồn kho và áp dụng giảm giá theo thời gian lưu kho:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Tồn kho trên 30 ngày: Giảm 10%</li>
              <li>Tồn kho trên 60 ngày: Giảm 20%</li>
              <li>Không giảm dưới Floor Price</li>
              <li>Gửi email thông báo ưu đãi cho khách hàng</li>
            </ul>
          </div>
          <button
            onClick={runFlow2}
            disabled={flowRunning}
            className={`px-6 py-3 rounded font-bold text-white transition ${
              flowRunning ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {flowRunning ? "Đang chạy..." : "Chạy FLOW 2 Ngay"}
          </button>

          {flow2Result && (
            <div className={`mt-4 p-4 rounded ${flow2Result.error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {flow2Result.error ? (
                <p>{flow2Result.error}</p>
              ) : (
                <div>
                  <p className="font-bold">{flow2Result.message}</p>
                  {flow2Result.totalProducts && <p>Tổng sản phẩm: {flow2Result.totalProducts}</p>}
                  {flow2Result.updatedCount !== undefined && <p>Đã cập nhật: {flow2Result.updatedCount}</p>}
                  {flow2Result.unchangedCount !== undefined && <p>Không thay đổi: {flow2Result.unchangedCount}</p>}
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
                  {flow4Result.totalProducts && <p>Tổng sản phẩm: {flow4Result.totalProducts}</p>}
                  {flow4Result.updatedCount !== undefined && <p>Đã cập nhật: {flow4Result.updatedCount}</p>}
                  {flow4Result.unchangedCount !== undefined && <p>Không thay đổi: {flow4Result.unchangedCount}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex mb-4 border-b">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 font-bold ${
              activeTab === "products"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Danh sách sản phẩm
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

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sản phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá hiện tại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá đối thủ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.sku}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingSku === product.sku ? (
                        <input
                          type="number"
                          value={editingPrice}
                          onChange={(e) => setEditingPrice(e.target.value)}
                          className="w-32 px-2 py-1 border rounded"
                          autoFocus
                        />
                      ) : (
                        `${formatCurrency(product.current_price)} ₫`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.competitor_price ? `${formatCurrency(product.competitor_price)} ₫` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.floor_price ? `${formatCurrency(product.floor_price)} ₫` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.max_discount_percent}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingSku === product.sku ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updatePrice(product.sku)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => {
                              setEditingSku(null);
                              setEditingPrice("");
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingSku(product.sku);
                            setEditingPrice(product.current_price.toString());
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Sửa giá
                        </button>
                      )}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá cũ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá mới</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lý do</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flow</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.products?.product_name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.old_price)} ₫
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {formatCurrency(item.new_price)} ₫
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{item.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.flow_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}