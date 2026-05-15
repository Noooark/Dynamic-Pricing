"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, isAuthenticated, isReady } = useAuth();

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

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isFormValid = isValidEmail(formData.email) && formData.password.length > 0;

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
      // Test mode: Cho phép login với email/password cố định
      // Email: test@customer.local, Password: test123
      if (formData.email === 'test@customer.local' && formData.password === 'test123') {
        const testCustomer = {
          id: 'test-customer-id',
          customer_id: 'test-customer-id',
          name: 'Test Customer',
          full_name: 'Test Customer',
          email: 'test@customer.local',
          membership_type: 'Gold',
          rank_id: 2,
          total_orders: 5,
          total_spent: 5000000,
          phone: '0123456789'
        };
        signIn(testCustomer);
        setMessage({ type: "success", text: "Chào mừng trở lại Khoi Hotel (Test Mode)" });
        setTimeout(() => router.push("/account"), 1200);
        return;
      }

      // Nếu không phải test credentials, thử Supabase Auth
      console.log("[Login] Attempting Supabase Auth login with email:", formData.email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (error) {
        console.error("[Login] Supabase Auth error:", error);
        throw error;
      }

      console.log("[Login] Supabase Auth success, user:", data.user);

      if (data.user) {
        // Lấy thông tin customer từ database
        const userId = data.user.id;
        console.log("[Login] Fetching customer data for user_id:", userId);
        
        // First, let's check if the customer record exists with this user_id
        // Schema của bạn không có membership_type, total_orders, total_spent
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select(`
            id,
            user_id,
            full_name,
            email,
            phone,
            rank_id,
            customer_ranks (
              rank_name,
              discount_percentage
            )
          `)
          .eq('user_id', userId)
          .single();

        console.log("[Login] Query result:", { customerData, customerError });

        if (customerError) {
          console.error("[Login] Error fetching customer:", customerError);
          // Also try to check if any customer exists with this email
          const { data: emailCheck } = await supabase
            .from('customers')
            .select('id, user_id, full_name, email')
            .eq('email', data.user.email)
            .single();
          console.log("[Login] Email check result:", emailCheck);
          
          throw new Error("Không tìm thấy thông tin khách hàng: " + customerError.message);
        }

        console.log("[Login] Customer data found:", customerData);

        if (customerData) {
          console.log("[Login] Full customerData:", JSON.stringify(customerData, null, 2));
          
          // Add required fields for AuthUser type
          // customer_ranks could be an object or array depending on the relationship
          let rankName = 'Standard';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ranks = customerData.customer_ranks as any;
          if (ranks) {
            if (Array.isArray(ranks)) {
              rankName = ranks[0]?.rank_name || 'Standard';
            } else if (typeof ranks === 'object') {
              rankName = ranks.rank_name || 'Standard';
            }
          }
          
          console.log("[Login] Determined rankName:", rankName);
          
          const customerWithRequiredFields = {
            ...customerData,
            id: customerData.id,  // customers.id (UUID)
            customer_id: customerData.id,  // customers.id (UUID) - đúng với cart.customer_id
            user_id: customerData.user_id,  // auth.users.id
            name: customerData.full_name || customerData.email,
            membership_type: rankName,
          };
          signIn(customerWithRequiredFields);
          setMessage({ type: "success", text: "Chào mừng trở lại Khoi Hotel" });
          setTimeout(() => router.push("/account"), 1200);
        } else {
          throw new Error("Không tìm thấy thông tin khách hàng");
        }
      }
    } catch (err: unknown) {
      let errorMessage = "Đăng nhập thất bại";

      if (err instanceof Error) {
        errorMessage = err.message;
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
          <div className="mb-3 text-4xl">🏨</div>
          <h2 className="text-3xl font-bold text-slate-900">Đăng nhập</h2>
          <p className="mt-2 text-slate-600">
            Chào mừng trở lại Khoi Hotel
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
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-700">
          Chưa có tài khoản?{" "}
          <span
            onClick={() => router.push("/register")}
            className="cursor-pointer font-medium text-blue-600 hover:underline"
          >
            Đăng ký ngay
          </span>
        </p>
      </div>
    </div>
  );
}
