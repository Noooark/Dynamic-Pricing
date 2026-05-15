-- ==========================================
-- FUNCTION: decrease_room_availability
-- ==========================================
-- Function này giảm số phòng còn trống khi đặt phòng
-- ==========================================

CREATE OR REPLACE FUNCTION decrease_room_availability(
  p_room_id UUID,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Giảm available_rooms theo số đêm đã đặt
  UPDATE public.rooms
  SET 
    available_rooms = available_rooms - p_quantity,
    updated_at = NOW()
  WHERE id = p_room_id
    AND available_rooms >= p_quantity;  -- Chỉ update nếu còn đủ phòng
  
  -- Kiểm tra xem có room nào được update không
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không đủ phòng trống cho room_id: %', p_room_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- HƯỚNG DẪN SỬ DỤNG
-- ==========================================
-- 1. Chạy script này trong Supabase SQL Editor
-- 2. Function sẽ được dùng khi checkout để giảm số phòng
-- 3. Nếu không đủ phòng, sẽ throw exception
-- ==========================================

-- ==========================================
-- TEST FUNCTION
-- ==========================================
-- Để test function, chạy lệnh sau:
-- SELECT decrease_room_availability('room-uuid-here', 1);
-- ==========================================