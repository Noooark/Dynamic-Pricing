"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Test mode: Cho phép login với username/password cố định
      // Username: admin, Password: admin123
      if (username === 'admin' && password === 'admin123') {
        // Lưu thông tin admin vào localStorage (test mode)
        localStorage.setItem("admin", JSON.stringify({
          id: 'test-admin-id',
          username: 'admin',
          email: 'admin@test.local',
          role: 'admin',
          full_name: 'Test Admin'
        }));
        localStorage.setItem("isAdminLoggedIn", "true");
        
        // Chuyển hướng đến dashboard
        router.push("/admin/dashboard");
        return;
      }

      // Nếu không phải test credentials, thử Supabase Auth
      const adminEmail = `${username}@admin.local`;
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: password,
      });

      if (authError) throw authError;

      if (data.user) {
        // Kiểm tra xem user có phải admin không (qua bảng admins)
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', data.user.id)
          .eq('role', 'admin')
          .single();

        if (adminError || !adminData) {
          await supabase.auth.signOut();
          throw new Error("Tài khoản này không có quyền admin");
        }

        localStorage.setItem("admin", JSON.stringify({
          id: adminData.id,
          user_id: data.user.id,
          username: adminData.username,
          email: adminData.email,
          role: adminData.role,
          full_name: adminData.full_name
        }));
        localStorage.setItem("isAdminLoggedIn", "true");
        router.push("/admin/dashboard");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      let errorMessage = "Đăng nhập thất bại";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Admin Login
        </h1>
        
        <form onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập username"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}