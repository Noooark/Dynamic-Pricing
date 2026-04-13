// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";   // ← Thêm dòng import này

export const metadata: Metadata = {
  title: "Khoi Store - Dynamic Pricing",
  description: "Website bán hàng với giá thông minh",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <Header />           {/* ← Dùng Header đã import */}
        <main>{children}</main>
      </body>
    </html>
  );
}