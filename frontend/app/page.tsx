"use client";

import { useEffect, useState } from "react";
import ProductTable from "./components/product/ProductTable";
import API from "../services/api";

interface Product {
  sku: string;
  product_name: string;
  current_price: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-10 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Khoi <span className="text-blue-600">Store</span>
          </h1>
          <p className="mt-1 text-gray-500">Hệ thống cập nhật giá tự động</p>
        </div>

        <div className="flex gap-3">
          <button className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-medium hover:bg-gray-50">
            Lọc sản phẩm
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-50 p-6">
          <h2 className="text-xl font-bold text-gray-800">Danh sách sản phẩm</h2>
        </div>

        <ProductTable products={products} />
      </div>

      {products.length === 0 && (
        <div className="py-20 text-center text-gray-400">
          <p className="mb-4 text-5xl">📦</p>
          <p>Hiện chưa có sản phẩm nào trong hệ thống.</p>
        </div>
      )}
    </div>
  );
}