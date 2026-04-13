"use client";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          🛒 Khoi Store
        </h1>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-gray-600 font-medium">
          <Link href="/" className="hover:text-blue-600 transition">Trang chủ</Link>
          <Link href="/products" className="hover:text-blue-600 transition">Sản phẩm</Link>
          <Link href="/cart" className="hover:text-blue-600 transition">Giỏ hàng</Link>
          <Link href="/account" className="hover:text-blue-600 transition">Tài khoản</Link>
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* User */}
          <span className="hidden sm:block text-gray-700">👤 Nguyễn Tư Anh Nguyễn</span>

          {/* Register button */}
          <Link href="/register">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition">
              Đăng ký
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}