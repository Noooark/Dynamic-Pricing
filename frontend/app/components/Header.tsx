"use client";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
      <div className="glass-panel mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 rounded-[28px] px-5 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-lg text-white shadow-lg shadow-blue-200">
            🛒
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
              Khoi Store
            </p>
            <p className="text-xs font-medium text-slate-500">
              Dynamic pricing cho cửa hàng điện tử
            </p>
          </div>
        </Link>

        <nav className="order-3 flex w-full items-center justify-center gap-5 text-sm font-semibold text-slate-600 sm:order-2 sm:w-auto sm:gap-7">
          <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
          <Link href="/products" className="hover:text-blue-600">Sản phẩm</Link>
          <Link href="/cart" className="hover:text-blue-600">Giỏ hàng</Link>
          <Link href="/account" className="hover:text-blue-600">Tài khoản</Link>
        </nav>

        <div className="order-2 flex items-center gap-3 sm:order-3">
          <div className="hidden rounded-full border border-white/70 bg-white/70 px-3 py-2 text-sm text-slate-700 shadow-sm sm:flex sm:items-center sm:gap-2">
            <span className="text-blue-600">●</span>
            <span>Nguyễn Tư Anh Nguyễn</span>
          </div>

          <Link
            href="/register"
            className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-300 hover:-translate-y-0.5 hover:bg-blue-600"
          >
            Đăng ký
          </Link>
        </div>
      </div>
    </header>
  );
}
