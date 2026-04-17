"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";

interface Product {
  sku: string;
  product_name: string; // Khớp với tên cột trong Supabase
  current_price: number;
  displayPrice?: number;
  isVIP?: boolean;
}

interface ProductTableProps {
  products: Product[];
}

export default function ProductTable({ products }: ProductTableProps) {
  const { user, isAuthenticated } = useAuth();
  const [addingSku, setAddingSku] = useState<string | null>(null);
  const [addedSkus, setAddedSkus] = useState<Set<string>>(new Set());
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const handleAddToCart = async (sku: string) => {
    if (!isAuthenticated || !user?.customer_id) {
      alert("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }

    try {
      setAddingSku(sku);
      await API.post("/cart/add", {
        CustomerID: user.customer_id,
        SKU: sku,
        quantity: 1
      });
      setAddedSkus(prev => new Set([...prev, sku]));
      
      // Hiển thị thông báo thành công
      const product = products.find(p => p.sku === sku);
      setNotificationMessage(`✅ Đã thêm "${product?.product_name || sku}" vào giỏ hàng!`);
      setShowNotification(true);
      
      // Ẩn thông báo sau 3 giây
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setAddedSkus(prev => {
          const next = new Set(prev);
          next.delete(sku);
          return next;
        });
      }, 2000);
    } catch (err) {
      console.error("Lỗi thêm vào giỏ:", err);
      alert("Không thể thêm sản phẩm vào giỏ");
    } finally {
      setAddingSku(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-down">
          <div className="flex items-center space-x-2">
            <span className="text-lg">✓</span>
            <span className="font-medium">{notificationMessage}</span>
          </div>
        </div>
      )}

      <table className="min-w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/80">
            <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 sm:px-6">
              SKU
            </th>
            <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 sm:px-6">
              Tên sản phẩm
            </th>
            <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 sm:px-6">
              Giá hiện tại
            </th>
            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-500 sm:px-6">
              Thao tác
            </th>

          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const displayPrice = product.displayPrice || product.current_price || 0;
            const hasDiscount =
              product.isVIP &&
              product.displayPrice &&
              product.displayPrice < product.current_price;

            return (
              <tr
                key={product.sku}
                className="border-b border-slate-100 last:border-b-0 hover:bg-blue-50/55"
              >
                <td className="px-5 py-5 sm:px-6">
                  <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 font-mono text-sm font-semibold text-blue-700">
                    {product.sku}
                  </span>
                </td>
                <td className="px-5 py-5 sm:px-6">
                  <div className="max-w-md">
                    <p className="text-sm font-semibold text-slate-900 sm:text-[15px]">
                      {product.product_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Sản phẩm điện tử chính hãng, theo dõi giá theo thời gian thực.
                    </p>
                  </div>
                </td>
                <td className="px-5 py-5 sm:px-6">
                  <div className="flex flex-col">
                    <span className="text-base font-extrabold text-slate-900 sm:text-lg">
                      {displayPrice.toLocaleString("vi-VN")} ₫
                    </span>
                    {hasDiscount && (
                      <span className="mt-1 text-xs text-slate-400 line-through">
                        {product.current_price.toLocaleString("vi-VN")} ₫
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-5 py-5 text-center sm:px-6">
                  <button
                    onClick={() => handleAddToCart(product.sku)}
                    className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-200 hover:-translate-y-0.5 hover:bg-blue-600 active:scale-95"
                  >
                    Thêm giỏ hàng
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {products.length === 0 && (

        <div className="p-10 text-center text-slate-500">
          Không tìm thấy sản phẩm nào trong kho.
        </div>
      )}
    </div>
  );
}
