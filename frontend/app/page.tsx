"use client";

import { useEffect, useState } from "react";
import API from "../services/api";

// Định nghĩa kiểu dữ liệu rõ ràng
interface Product {
  sku: string;
  productName: string;
  currentPrice: number;
  competitorPrice: number;
  lastUpdated: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/products")
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi lấy dữ liệu:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Đang tải dữ liệu hệ thống...</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>🚀 FLOW 1: Tự Động Giảm Giá</h1>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Server: <span style={{ color: '#27ae60' }}>● Online (ngrok active)</span>
        </div>
      </header>

      <table style={{ width: "100%", borderCollapse: "collapse", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <thead>
          <tr style={{ backgroundColor: "#2c3e50", color: "#fff", textAlign: "left" }}>
            <th style={thStyle}>SKU</th>
            <th style={thStyle}>Tên Sản Phẩm</th>
            <th style={thStyle}>Giá Hiện Tại</th>
            <th style={thStyle}>Giá Đối Thủ</th>
            <th style={thStyle}>Trạng Thái</th>
            <th style={thStyle}>Cập Nhật Cuối</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
              <td style={tdStyle}>{product.sku}</td>
              <td style={tdStyle}><strong>{product.productName}</strong></td>
              <td style={{ ...tdStyle, color: "#2980b9", fontWeight: "bold" }}>
                {product.currentPrice.toLocaleString()} đ
              </td>
              <td style={tdStyle}>{product.competitorPrice.toLocaleString()} đ</td>
              <td style={tdStyle}>
                <span style={{ 
                  padding: "4px 8px", 
                  borderRadius: "4px", 
                  backgroundColor: product.currentPrice <= product.competitorPrice ? "#eafaf1" : "#fff4e5",
                  color: product.currentPrice <= product.competitorPrice ? "#27ae60" : "#d35400",
                  fontSize: "12px"
                }}>
                  {product.currentPrice <= product.competitorPrice ? "Giá Cạnh Tranh" : "Cần Giảm Giá"}
                </span>
              </td>
              <td style={{ ...tdStyle, fontSize: "12px", color: "#95a5a6" }}>
                {product.lastUpdated ? new Date(product.lastUpdated).toLocaleString("vi-VN") : "---"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { padding: "15px" };
const tdStyle = { padding: "12px 15px" };