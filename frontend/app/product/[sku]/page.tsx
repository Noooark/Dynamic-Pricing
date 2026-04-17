"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface Product {
  sku: string;
  product_name: string;
  current_price: number;
  cost_price?: number;
  floor_price?: number;
  competitor_price?: number;
  max_discount_percent?: number;
  last_updated?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const sku = params.sku as string;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/products`);
        const products = res.data as Product[];
        const foundProduct = products.find(p => p.sku === sku);
        
        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          setError("Không tìm thấy sản phẩm");
        }
      } catch (err) {
        console.error("Lỗi lấy sản phẩm:", err);
        setError("Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    if (sku) {
      fetchProduct();
    }
  }, [sku]);

  const handleAddToCart = async () => {
    if (!isAuthenticated || !user?.customer_id) {
      alert("Vui lòng đăng nhập để thêm vào giỏ hàng");
      router.push("/login");
      return;
    }

    if (!product) return;

    try {
      setAddingToCart(true);
      await API.post("/cart/add", {
        CustomerID: user.customer_id,
        SKU: product.sku,
        quantity: 1
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      console.error("Lỗi thêm vào giỏ:", err);
      alert("Không thể thêm sản phẩm vào giỏ");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Đang tải thông tin sản phẩm...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {error || "Không tìm thấy sản phẩm"}
        </h2>
        <button
          onClick={() => router.push("/products")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Quay lại danh sách sản phẩm
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push("/products")}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        ← Quay lại danh sách
      </button>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8 p-8">
          {/* Product Image Placeholder */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl flex items-center justify-center min-h-[300px]">
            <div className="text-9xl">📦</div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            <div className="mb-2">
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                {product.sku}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product.product_name}
            </h1>

            <div className="mb-6">
              <p className="text-4xl font-bold text-gray-900">
                {product.current_price.toLocaleString("vi-VN")} ₫
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Giá cập nhật: {product.last_updated 
                  ? new Date(product.last_updated).toLocaleString("vi-VN") 
                  : "Chưa cập nhật"}
              </p>
            </div>

            {/* Additional Info */}
            <div className="space-y-3 mb-8">
              {product.floor_price && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Giá sàn:</span>
                  <span className="font-semibold">
                    {product.floor_price.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              )}
              {product.competitor_price && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Giá đối thủ:</span>
                  <span className="font-semibold">
                    {product.competitor_price.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              )}
              {product.max_discount_percent && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Giảm tối đa:</span>
                  <span className="font-semibold text-green-600">
                    {product.max_discount_percent}%
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || addedToCart}
                className={`flex-1 py-4 rounded-xl font-semibold text-white transition-all ${
                  addedToCart
                    ? "bg-green-600 hover:bg-green-700"
                    : addingToCart
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5"
                }`}
              >
                {addedToCart ? "✓ Đã thêm vào giỏ" : addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
              </button>
              
              <button
                onClick={() => router.push("/cart")}
                className="px-6 py-4 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition"
              >
                Xem giỏ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description */}
      <div className="mt-8 bg-white rounded-2xl shadow p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Mô tả sản phẩm</h2>
        <p className="text-gray-600 leading-relaxed">
          Sản phẩm điện tử chính hãng, được bảo hành theo quy định của nhà sản xuất.
          Giá cả được cập nhật tự động dựa trên thị trường và chính sách giá của cửa hàng.
          Quý khách có thể yên tâm về chất lượng và giá cả cạnh tranh.
        </p>
      </div>
    </div>
  );
}