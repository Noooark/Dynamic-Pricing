"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import API from "../../services/api";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Kiểm tra định dạng email
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Điều kiện để nút Đăng nhập sáng lên
  const isFormValid = isValidEmail(formData.email) && formData.password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await API.post("/auth/login", {
        Email: formData.email.trim(),
        Password: formData.password,
      });

      // Lưu thông tin user vào localStorage (để n8n hoặc các trang khác sử dụng)
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setMessage({
        type: "success",
        text: "👋 Chào mừng bạn quay trở lại!",
      });

      // Chuyển hướng sau khi đăng nhập thành công
      setTimeout(() => router.push("/dashboard"), 1500); 
    } catch (err: unknown) {
      let errorMessage = "Đăng nhập thất bại";

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
          <h2 className="text-3xl font-bold text-gray-900">Đăng nhập</h2>
          <p className="text-gray-600 mt-2">
            Tiếp tục quản lý giá và ưu đãi của bạn
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
          
          {/* EMAIL */}
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        {/* FOOTER */}
        <p className="text-center mt-6 text-gray-700">
          Chưa có tài khoản?{" "}
          <span
            onClick={() => router.push("/register")}
            className="text-blue-600 cursor-pointer hover:underline font-medium"
          >
            Đăng ký ngay
          </span>
        </p>
      </div>
    </div>
  );
}