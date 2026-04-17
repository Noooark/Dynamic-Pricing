// app/layout.tsx
"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import { AuthProvider } from "./context/AuthContext";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ẩn header nếu đang ở trang admin
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <html lang="vi">
      <body className={inter.className}>
        <AuthProvider>
          {!isAdminPage && <Header />}
          <main className={!isAdminPage ? "p-6" : ""}>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
