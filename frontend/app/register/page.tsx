"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import API from "../../services/api";

export default function RegisterPage() {
  const router = useRouter();

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
    formData.name.trim() &&
    isValidEmail(formData.email) &&
    formData.password.length >= 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    setLoading(true);
    setMessage(null);

    try {
      await API.post("/auth/register", {
        Name: formData.name.trim(),
        Email: formData.email.trim(),
        Password: formData.password,
      });

      setMessage({
        type: "success",
        text: "🎉 Đăng ký thành công!",
      });

      setTimeout(() => router.push("/login"), 1500);
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
  <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-gray-200">

      {/* HEADER */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Tạo tài khoản
        </h2>
        <p className="text-gray-600 mt-2">
          Bắt đầu trải nghiệm mua sắm thông minh
        </p>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm text-center font-medium ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* NAME */}
        <input
          type="text"
          placeholder="Họ và tên"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 outline-none ${
            formData.email
              ? isValidEmail(formData.email)
                ? "border-green-500 focus:ring-green-500"
                : "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          }`}
        />

        {/* PASSWORD */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mật khẩu"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3 cursor-pointer text-gray-600 hover:text-gray-900 text-sm"
          >
            {showPassword ? "Ẩn" : "Hiện"}
          </span>
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          disabled={!isFormValid || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition disabled:bg-gray-400"
        >
          {loading ? "Đang xử lý..." : "Đăng ký"}
        </button>
      </form>

      {/* FOOTER */}
      <p className="text-center mt-6 text-gray-700">
        Đã có tài khoản?{" "}
        <span
          onClick={() => router.push("/login")}
          className="text-blue-600 cursor-pointer hover:underline font-medium"
        >
          Đăng nhập
        </span>
      </p>
    </div>
  </div>
);
}