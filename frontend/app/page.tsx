"use client";

import { useEffect, useState } from "react";
import ProductTable from "./components/product/ProductTable";
import API from "../services/api";

interface Product {
  sku: string;
  product_name: string; // Lưu ý: Supabase dùng product_name (có gạch dưới)
  current_price: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await API.get("/products");
        setProducts(res.data);
      } catch (err) {
        let errorMessage = "Không thể tải sản phẩm";
        if (err instanceof Error) errorMessage = err.message;
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;

    return (
      product.sku.toLowerCase().includes(keyword) ||
      product.product_name.toLowerCase().includes(keyword)
    );
  });

  const priceValues = filteredProducts.map((product) => product.current_price);
  const totalProducts = filteredProducts.length;
  const averagePrice =
    totalProducts > 0
      ? Math.round(priceValues.reduce((sum, price) => sum + price, 0) / totalProducts)
      : 0;
  const lowestPrice = totalProducts > 0 ? Math.min(...priceValues) : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-lg text-slate-500">
        Đang tải sản phẩm...
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
<<<<<<< Updated upstream
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header của Store */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Khoi <span className="text-blue-600">Store</span>
          </h1>
          <p className="text-gray-500 mt-1">Hệ thống cập nhật giá tự động</p>
        </div>
        
        {/* Nút bấm giả lập để test (tùy chọn) */}
        <div className="flex gap-3">
          <button className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            Lọc sản phẩm
          </button>
        </div>
      </div>

      {/* DANH SÁCH DẠNG BẢNG - Thay thế cho Grid cũ */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Danh sách sản phẩm</h2>
        </div>
        
        <ProductTable products={products} />
      </div>

      {products.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">📦</p>
          <p>Hiện chưa có sản phẩm nào trong hệ thống.</p>
        </div>
      )}
    </div>
  );
}