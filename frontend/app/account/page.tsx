"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function AccountPage() {
  const router = useRouter();
  const { user, isReady, isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isReady, router]);

  if (!isReady || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-slate-500">
        Đang tải tài khoản...
      </div>
    );
  }

  const handleLogout = () => {
    signOut();
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="glass-panel overflow-hidden rounded-[32px]">
        <div className="border-b border-slate-200/70 bg-slate-950 px-6 py-8 text-white sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
            Tài khoản
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{user.name}</h1>
          <p className="mt-2 text-slate-300">{user.email}</p>
        </div>

        <div className="grid gap-4 px-6 py-6 sm:grid-cols-3 sm:px-8">
          <div className="rounded-3xl bg-blue-50 p-5">
            <p className="text-sm text-slate-500">Mã khách hàng</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{user.customer_id}</p>
          </div>
          <div className="rounded-3xl bg-orange-50 p-5">
            <p className="text-sm text-slate-500">Hạng thành viên</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {user.membership_type || "Silver"}
            </p>
          </div>
          <div className="rounded-3xl bg-emerald-50 p-5">
            <p className="text-sm text-slate-500">Tổng đơn hàng</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {user.total_orders ?? 0}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 px-6 pb-8 sm:px-8">
          <Link
            href="/"
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Về trang chủ
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-red-200 hover:text-red-600"
          >
            Đăng xuất
          </button>
        </div>
      </section>
    </div>
  );
}
