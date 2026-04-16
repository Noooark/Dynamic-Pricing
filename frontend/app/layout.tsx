// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import { AuthProvider } from "./context/AuthContext";

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
        <AuthProvider>
          <Header />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
