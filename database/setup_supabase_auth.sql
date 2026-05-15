-- ==========================================
-- SUPABASE AUTH INTEGRATION FOR EXISTING SCHEMA
-- ==========================================
-- Script này thêm các trường cần thiết để tích hợp với Supabase Auth
-- mà không làm thay đổi schema hiện tại của bạn
-- ==========================================

-- 1. Thêm cột user_id vào bảng customers (để liên kết với Supabase Auth)
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- 2. Thêm cột user_id vào bảng admins (để liên kết với Supabase Auth)
ALTER TABLE public.admins 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- 3. Tạo index cho user_id
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);

-- 4. Tạo function để tự động tạo customer khi có user mới đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Kiểm tra xem user đã có trong customers chưa
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE email = NEW.email) THEN
    INSERT INTO public.customers (
      user_id,
      full_name,
      email,
      phone,
      rank_id,
      membership_type,
      total_orders,
      total_spent,
      created_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
      NEW.email,
      NULL,
      1,
      'Standard',
      0,
      0,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Tạo trigger để tự động tạo customer khi có user mới đăng ký
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Enable Row Level Security (RLS) cho customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 7. Tạo policies cho customers
-- Policy để users có thể xem thông tin của chính mình
CREATE POLICY "Users can view their own customer data" ON public.customers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy để users có thể cập nhật thông tin của chính mình
CREATE POLICY "Users can update their own customer data" ON public.customers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy để system có thể insert customer mới (từ trigger)
CREATE POLICY "System can insert new customers" ON public.customers
  FOR INSERT
  WITH CHECK (true);

-- 8. Enable RLS cho admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 9. Tạo policies cho admins
-- Policy để admins có thể xem thông tin của chính mình
CREATE POLICY "Admins can view their own data" ON public.admins
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy để admins có thể xem tất cả admins (cần cho admin dashboard)
CREATE POLICY "Admins can view all admins" ON public.admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- HƯỚNG DẪN SỬ DỤNG
-- ==========================================
-- 1. Chạy script này trong Supabase SQL Editor
-- 2. Tạo admin user trong Supabase Auth (Authentication → Users → Add user)
-- 3. Sau khi tạo user, lấy user_id và chạy lệnh sau để thêm vào bảng admins:
--
--    INSERT INTO public.admins (user_id, username, password, email, full_name, role)
--    VALUES ('<user-id-tu-auth>', 'admin', 'hashed-password', 'admin@example.com', 'Admin', 'admin');
--
-- 4. Đối với customers, hệ thống sẽ tự động tạo khi user đăng ký qua Supabase Auth
-- ==========================================

-- ==========================================
-- LƯU Ý QUAN TRỌNG
-- ==========================================
-- - Bảng customers và admins vẫn giữ nguyên cấu trúc hiện at
-- - Cột password vẫn được giữ lại (nếu bạn muốn dùng backend để hash password)
-- - Cột user_id được thêm vào để liên kết với Supabase Auth
-- - Khi user đăng ký qua Supabase Auth, customer record sẽ được tạo tự động
-- - Admin cần được tạo thủ công trong Supabase Auth và thêm vào bảng admins
-- ==========================================