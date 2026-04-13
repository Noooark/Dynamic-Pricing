// app/components/product/ProductCard.tsx
"use client";

import Link from "next/link";

interface Product {
  sku: string;
  productName: string;
  currentPrice: number;
  displayPrice?: number;
  isVIP?: boolean;
  image?: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const finalPrice = product.displayPrice || product.currentPrice;
  const isVIP = product.isVIP || false;

  return (
    <Link href={`/product/${product.sku}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{
        border: "1px solid #eee",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "white",
        boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
        transition: "all 0.3s ease",
        height: "100%"
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-8px)"}
      onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
      >
        {/* Hình ảnh */}
        <div style={{
          height: "220px",
          backgroundColor: "#f8f9fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative"
        }}>
          {isVIP && (
            <div style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              backgroundColor: "#27ae60",
              color: "white",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "bold"
            }}>
              VIP
            </div>
          )}
          <img 
            src={product.image || "/images/default-product.jpg"} 
            alt={product.productName}
            style={{ maxHeight: "180px", objectFit: "contain" }}
          />
        </div>

        {/* Thông tin */}
        <div style={{ padding: "16px" }}>
          <h3 style={{ 
            fontSize: "16px", 
            margin: "0 0 12px 0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: "1.4"
          }}>
            {product.productName}
          </h3>

          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "20px", fontWeight: "bold", color: "#e74c3c" }}>
              {finalPrice.toLocaleString('vi-VN')} ₫
            </span>
            
            {isVIP && product.displayPrice && product.displayPrice < product.currentPrice && (
              <span style={{ 
                textDecoration: "line-through", 
                color: "#95a5a6", 
                fontSize: "14px" 
              }}>
                {product.currentPrice.toLocaleString('vi-VN')} ₫
              </span>
            )}
          </div>

          {isVIP && (
            <p style={{ color: "#27ae60", fontSize: "13px", marginTop: "8px" }}>
              ✓ Giá ưu đãi VIP
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}