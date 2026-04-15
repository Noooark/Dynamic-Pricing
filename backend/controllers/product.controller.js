const { createClient } = require('@supabase/supabase-js');

// Khởi tạo Supabase Client (Nên đưa cấu hình này vào một file riêng như supabaseClient.js)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

exports.getProducts = async (req, res) => {
  try {

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sku', { ascending: true });

    // Kiểm tra nếu có lỗi từ phía Supabase (ví dụ: sai tên bảng)
    if (error) {
      throw error;
    }

    // Trả về dữ liệu sản phẩm dưới dạng JSON
    res.json(data);

  } catch (err) {
    console.error("SUPABASE ERROR:", err.message);

    // Xử lý lỗi trả về cho Frontend
    res.status(500).json({
      message: "Lỗi khi lấy dữ liệu từ Supabase",
      details: err.message,
    });
  }
};