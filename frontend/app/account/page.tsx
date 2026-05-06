"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const getMembershipIcon = (type?: string) => {
  if (type === "Platinum") return "💎";
  if (type === "Gold") return "🥇";
  return "🥈";
};

const getMembershipColor = (type?: string) => {
  if (type === "Platinum") return "from-purple-600 to-indigo-600";
  if (type === "Gold") return "from-yellow-500 to-amber-500";
  return "from-slate-600 to-slate-800";
};

const getMembershipBenefit = (type?: string) => {
  if (type === "Platinum") return "Giảm 15% tất cả phòng + Ưu tiên đặt phòng";
  if (type === "Gold") return "Giảm 10% tất cả phòng + Check-in sớm";
  return "Giảm 5% phòng tiêu chuẩn";
};

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
        <div className="text-center">
          <div className="mb-3 text-4xl">🏨</div>
          <p>Đang tải tài khoản...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    signOut();
    router.push("/");
  };

  const memberType = user.membership_type || "Silver";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="glass-panel overflow-hidden rounded-[32px]">
        {/* Header Banner */}
        <div className={`bg-gradient-to-br ${getMembershipColor(memberType)} px-6 py-8 text-white sm:px-8`}>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
            Tài khoản khách hàng
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-4xl">{getMembershipIcon(memberType)}</span>
            <div>
              <h1 className="text-3xl font-black tracking-tight">{user.name}</h1>
              <p className="mt-1 text-white/80">{user.email}</p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            <span>{getMembershipIcon(memberType)}</span>
            <span>Thành viên {memberType}</span>
            <span className="text-white/70">•</span>
            <span className="text-white/80 text-xs">{getMembershipBenefit(memberType)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 px-6 py-6 sm:grid-cols-3 sm:px-8">
          <div className="rounded-3xl bg-blue-50 p-5">
            <p className="text-sm text-slate-500">Mã khách hàng</p>
            <p className="mt-2 text-xl font-bold text-slate-900 font-mono">{user.customer_id}</p>
          </div>
          <div className="rounded-3xl bg-amber-50 p-5">
            <p className="text-sm text-slate-500">Tổng lần đặt phòng</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {user.total_orders ?? 0} lần
            </p>
          </div>
          <div className="rounded-3xl bg-emerald-50 p-5">
            <p className="text-sm text-slate-500">Tổng chi tiêu</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {(user.total_spent ?? 0).toLocaleString("vi-VN")} ₫
            </p>
          </div>
        </div>

        {/* Membership Progress */}
        <div className="px-6 pb-4 sm:px-8">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">Hạng thành viên hiện tại</p>
              <span className="text-sm font-bold text-blue-600">{memberType}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className={memberType === "Silver" ? "font-bold text-slate-700" : ""}>🥈 Silver</span>
              <div className="flex-1 h-2 rounded-full bg-slate-200">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all`}
                  style={{
                    width: memberType === "Platinum" ? "100%" : memberType === "Gold" ? "66%" : "33%"
                  }}
                />
              </div>
              <span className={memberType === "Gold" ? "font-bold text-yellow-600" : ""}>🥇 Gold</span>
              <span className={memberType === "Platinum" ? "font-bold text-purple-600" : ""}>💎 Platinum</span>
            </div>
            {memberType !== "Platinum" && (
              <p className="mt-2 text-xs text-slate-400">
                {memberType === "Silver"
                  ? "Đặt thêm phòng để nâng hạng lên Gold và nhận ưu đãi 10%"
                  : "Đặt thêm phòng để nâng hạng lên Platinum và nhận ưu đãi 15%"}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 px-6 pb-8 sm:px-8">
          <Link
            href="/rooms"
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition"
          >
            🏨 Xem phòng
          </Link>
          <Link
            href="/bookings"
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-600 transition"
          >
            📋 Giỏ đặt phòng
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-red-200 hover:text-red-600 transition"
          >
            Đăng xuất
          </button>
        </div>
      </section>
    </div>
  );
}
