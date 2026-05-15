-- Create cart table for Supabase (phù hợp với schema hiện có)
-- Lưu ý: Bảng rooms dùng id (uuid) làm khóa chính, không có sku
-- Nên cart sẽ dùng room_id thay vì sku

CREATE TABLE IF NOT EXISTS public.cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, room_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cart_customer_id ON public.cart(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_room_id ON public.cart(room_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Customers can view their own cart" ON public.cart;
DROP POLICY IF EXISTS "Customers can insert their own cart items" ON public.cart;
DROP POLICY IF EXISTS "Customers can update their own cart items" ON public.cart;
DROP POLICY IF EXISTS "Customers can delete their own cart items" ON public.cart;

-- Create policy to allow customers to view their own cart
CREATE POLICY "Customers can view their own cart" ON public.cart
  FOR SELECT
  USING (auth.uid()::uuid = customer_id);

-- Create policy to allow customers to insert their own cart items
CREATE POLICY "Customers can insert their own cart items" ON public.cart
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = customer_id);

-- Create policy to allow customers to update their own cart items
CREATE POLICY "Customers can update their own cart items" ON public.cart
  FOR UPDATE
  USING (auth.uid()::uuid = customer_id);

-- Create policy to allow customers to delete their own cart items
CREATE POLICY "Customers can delete their own cart items" ON public.cart
  FOR DELETE
  USING (auth.uid()::uuid = customer_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at (only if it doesn't exist)
DROP TRIGGER IF EXISTS update_cart_updated_at ON public.cart;
CREATE TRIGGER update_cart_updated_at
  BEFORE UPDATE ON public.cart
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();