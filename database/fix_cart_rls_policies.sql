-- ==========================================
-- FIX CART RLS POLICIES
-- ==========================================
-- Script này sửa RLS policies cho bảng cart
-- Vấn đề: customer_id trong cart là customers.id, không phải auth.users.id
-- Giải pháp: Dùng subquery để kiểm tra customer.user_id = auth.uid()
-- ==========================================

-- Enable RLS if not already enabled
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Customers can view their own cart" ON public.cart;
DROP POLICY IF EXISTS "Customers can insert their own cart items" ON public.cart;
DROP POLICY IF EXISTS "Customers can update their own cart items" ON public.cart;
DROP POLICY IF EXISTS "Customers can delete their own cart items" ON public.cart;

-- Allow service role to bypass RLS (for admin operations)
DROP POLICY IF EXISTS "Service role can do anything" ON public.cart;
CREATE POLICY "Service role can do anything" ON public.cart
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create policy to allow customers to view their own cart
-- Check if the cart's customer_id belongs to the authenticated user
CREATE POLICY "Customers can view their own cart" ON public.cart
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers 
      WHERE customers.id = cart.customer_id 
      AND customers.user_id = auth.uid()
    )
  );

-- Create policy to allow customers to insert their own cart items
CREATE POLICY "Customers can insert their own cart items" ON public.cart
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers 
      WHERE customers.id = cart.customer_id 
      AND customers.user_id = auth.uid()
    )
  );

-- Create policy to allow customers to update their own cart items
CREATE POLICY "Customers can update their own cart items" ON public.cart
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.customers 
      WHERE customers.id = cart.customer_id 
      AND customers.user_id = auth.uid()
    )
  );

-- Create policy to allow customers to delete their own cart items
CREATE POLICY "Customers can delete their own cart items" ON public.cart
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.customers 
      WHERE customers.id = cart.customer_id 
      AND customers.user_id = auth.uid()
    )
  );

-- ==========================================
-- HƯỚNG DẪN SỬ DỤNG
-- ==========================================
-- 1. Chạy script này trong Supabase SQL Editor
-- 2. Kiểm tra lại RLS policies trong Supabase dashboard
-- 3. Test xóa cart items từ frontend
-- ==========================================

-- ==========================================
-- KIỂM TRA SAU KHI ÁP DỤNG
-- ==========================================
-- Để kiểm tra xem policies đã được tạo đúng chưa:
-- SELECT * FROM pg_policies WHERE tablename = 'cart';
-- ==========================================