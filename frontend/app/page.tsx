"use client";

import { useEffect, useState } from "react";
import ProductCard from "./components/product/ProductCard";
import API from "../services/api";

interface Product {
  sku: string;
  productName: string;
  currentPrice: number;
  image?: string;
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
      <div className="flex items-center justify-center min-h-screen text-gray-500 text-lg">
        ⏳ Đang tải sản phẩm...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 text-lg">
        ❌ {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-16 p-10 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-100 shadow-sm">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-blue-500 text-transparent bg-clip-text">
          Khoi Store
        </h1>
        <p className="text-gray-600 text-lg max-w-xl mx-auto">
          Sản phẩm chất lượng • Giá thông minh • Trải nghiệm hiện đại
        </p>
      </div>

      {/* Title */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-semibold text-gray-800 mb-2">
          Sản phẩm nổi bật
        </h2>
        <p className="text-gray-500">Top sản phẩm được đề xuất cho bạn</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <div
            key={product.sku}
            className="transform hover:scale-105 transition duration-300"
          >
            <ProductCard
              product={{
                sku: product.sku,
                productName: product.productName,
                currentPrice: product.currentPrice,
                image: product.image || "/images/default-product.jpg",
              }}
            />
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          📦 Chưa có sản phẩm nào
        </div>
      )}
    </div>
  );
}
