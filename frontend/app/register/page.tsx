"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import API from "../../services/api";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { signIn, isAuthenticated, isReady } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isFormValid =
    Boolean(formData.name.trim()) &&
    isValidEmail(formData.email) &&
    formData.password.length >= 4;

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/account");
    }
  }, [isAuthenticated, isReady, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await API.post("/auth/register", {
        Name: formData.name.trim(),
        Email: formData.email.trim(),
        Password: formData.password,
      });

      signIn(response.data.user);
      setMessage({ type: "success", text: "Đăng ký thành công." });
      setTimeout(() => router.push("/account"), 1200);
    } catch (err: unknown) {
      let errorMessage = "Đăng ký thất bại";

      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }

      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass-panel w-full max-w-md rounded-[32px] border border-white/60 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-10">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Tạo tài khoản</h2>
          <p className="mt-2 text-slate-600">
            Bắt đầu trải nghiệm mua sắm thông minh
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-2xl p-4 text-center text-sm font-medium ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Họ và tên"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />

          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 ${
              formData.email
                ? isValidEmail(formData.email)
                  ? "border-green-500 focus:ring-4 focus:ring-green-100"
                  : "border-red-500 focus:ring-4 focus:ring-red-100"
                : "border-slate-200 focus:ring-4 focus:ring-blue-100"
            }`}
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3 cursor-pointer text-sm text-slate-600 hover:text-slate-900"
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </span>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white hover:bg-blue-600 disabled:bg-slate-300"
          >
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-700">
          Đã có tài khoản?{" "}
          <span
            onClick={() => router.push("/login")}
            className="cursor-pointer font-medium text-blue-600 hover:underline"
          >
            Đăng nhập
          </span>
        </p>
      </div>
    </div>
  );
}
