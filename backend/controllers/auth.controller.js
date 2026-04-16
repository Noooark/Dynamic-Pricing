const { createClient } = require('@supabase/supabase-js');

// Thay thế bằng thông tin thực tế từ Supabase Dashboard của bạn
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

exports.register = async (req, res) => {
  try {
    const { Name, Email, Password } = req.body;

    if (!Name || !Email || !Password) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    // 1. Lấy số lượng khách hàng hiện tại để tạo ID (Tương đương việc đếm dòng trong Sheets)
    const { count, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Tạo CustomerID theo format C001, C002...
    const newIdNumber = (count || 0) + 1;
    const customerID = `C${String(newIdNumber).padStart(3, "0")}`;

    // 2. Ghi dữ liệu vào bảng 'customers'
    const { data, error: insertError } = await supabase
      .from('customers')
      .insert([
        { 
          customer_id: customerID, 
          name: Name, 
          total_orders: 0, 
          total_spent: 0, 
          membership_type: 'Silver', 
          email: Email, 
          // password: Password // Lưu ý: Nên hash password trước khi lưu
        }
      ])
      .select();

    if (insertError) throw insertError;

    res.json({
      message: "Đăng ký thành công trên Supabase",
      CustomerID: customerID,
      data: data[0]
    });

  } catch (err) {
    console.error("Lỗi Supabase:", err.message);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ Email và Password" });
    }

    // 1. Tìm khách hàng trong Supabase dựa trên Email và Password
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', Email)
      .eq('password', Password) 
      .single(); // Chỉ lấy 1 bản ghi duy nhất

    if (error || !customer) {
      console.error("Login Error:", error);
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác" });
    }

    // 2. Trả về thông tin khách hàng (Không nên trả về password)
    const { password, ...userData } = customer;

    res.json({
      message: "Đăng nhập thành công",
      user: userData
    });

  } catch (err) {
    console.error("Lỗi Server Login:", err.message);
    res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
  }
};