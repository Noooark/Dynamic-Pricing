// app/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { id: "/", label: "🏠 Dashboard", href: "/" },
  { id: "/flow1", label: "📉 FLOW 1 - Giảm giá đối thủ", href: "/flow1" },
  { id: "/flow2", label: "📦 FLOW 2 - Xả kho tự động", href: "/flow2" },
  { id: "/flow3", label: "🌟 FLOW 3 - Giá VIP", href: "/flow3" },
  { id: "/flow4", label: "🎉 FLOW 4 - Giảm giá sự kiện", href: "/flow4" },
  { id: "/flow5", label: "✅ FLOW 5 - Duyệt giá", href: "/flow5" },
  { id: "/logs", label: "📋 Logs & History", href: "/logs" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div style={{
      width: "280px",
      backgroundColor: "#2c3e50",
      color: "white",
      height: "100vh",
      position: "fixed",
      padding: "20px 0",
      overflowY: "auto"
    }}>
      <div style={{ padding: "0 24px", marginBottom: "40px" }}>
        <h2>Dynamic Pricing</h2>
        <p style={{ fontSize: "14px", opacity: 0.7 }}>Hệ thống tự động</p>
      </div>

      {menuItems.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          style={{
            display: "block",
            padding: "14px 24px",
            color: "white",
            textDecoration: "none",
            backgroundColor: pathname === item.href ? "#34495e" : "transparent",
            borderLeft: pathname === item.href ? "4px solid #3498db" : "4px solid transparent",
            fontWeight: pathname === item.href ? "600" : "normal",
          }}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}