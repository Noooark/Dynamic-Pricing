// backend/controllers/room.controller.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔧 [room.controller] SUPABASE_URL:", SUPABASE_URL ? "✅ Có" : "❌ Không có");
console.log("🔧 [room.controller] SUPABASE_KEY:", SUPABASE_KEY ? "✅ Có" : "❌ Không có");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Lấy danh sách tất cả phòng
 */
exports.getRooms = async (req, res) => {
  console.log("📥 [GET /rooms] Request received");
  console.log("📥 [GET /rooms] Query params:", req.query);
  console.log("📥 [GET /rooms] Headers:", req.headers);

  try {
    const { room_type, location_area } = req.query;

    console.log("🔄 [GET /rooms] Building Supabase query...");

    let query = supabase
      .from('rooms')
      .select('*')
      .order('room_type', { ascending: true });

    if (room_type) {
      query = query.eq('room_type', room_type);
      console.log("🔍 [GET /rooms] Filter by room_type:", room_type);
    }

    if (location_area) {
      query = query.eq('location_area', location_area);
      console.log("🔍 [GET /rooms] Filter by location_area:", location_area);
    }

    console.log("🔄 [GET /rooms] Executing query...");
    const { data, error } = await query;

    console.log("📤 [GET /rooms] Supabase response:");
    console.log("   - Error:", error || "null");
    console.log("   - Data length:", data ? data.length : "null");
    console.log("   - Data sample:", data && data.length > 0 ? data[0] : "EMPTY");

    if (error) {
      console.error("❌ [GET /rooms] Supabase query error:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn("⚠️  [GET /rooms] No rooms found in database!");
    } else {
      console.log("✅ [GET /rooms] Returning", data.length, "rooms");
    }

    res.json(data);
  } catch (err) {
    console.error("❌ [GET /rooms] CATCH ERROR:", err.message);
    console.error("❌ [GET /rooms] Stack:", err.stack);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách phòng",
      details: err.message,
    });
  }
};

/**
 * Lấy thông tin 1 phòng theo ID
 */
exports.getRoomById = async (req, res) => {
  console.log("📥 [GET /rooms/:id] Request received, id:", req.params.id);

  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    console.log("📤 [GET /rooms/:id] Supabase response:");
    console.log("   - Error:", error || "null");
    console.log("   - Data:", data || "null");

    if (error) throw error;

    if (!data) {
      console.warn("⚠️  [GET /rooms/:id] Room not found, id:", id);
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    console.log("✅ [GET /rooms/:id] Room found:", data.room_type);
    res.json(data);
  } catch (err) {
    console.error("❌ [GET /rooms/:id] CATCH ERROR:", err.message);
    res.status(500).json({
      message: "Lỗi khi lấy thông tin phòng",
      details: err.message,
    });
  }
};
