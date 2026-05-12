const { createClient } = require('@supabase/supabase-js');

// Thay thế bằng thông tin thực tế từ Supabase Dashboard của bạn
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sanitizeUser = (user, rankInfo = null) => {
  if (!user) return null;
  return {
    customer_id: user.id,
    name: user.full_name,
    email: user.email,
    membership_type: rankInfo?.rank_name || 'Standard',
    total_orders: 0,
    total_spent: 0
  };
};

exports.register = async (req, res) => {
  try {
    const { Name, Email, Password } = req.body;
    const normalizedEmail = Email?.trim().toLowerCase();
    const normalizedName = Name?.trim();

    if (!normalizedName || !normalizedEmail || !Password) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    if (Password.length < 4) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 4 ký tự" });
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from('customers')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUserError) throw existingUserError;

    if (existingUser) {
      return res.status(409).json({ message: "Email đã được sử dụng" });
    }

    const { data, error: insertError } = await supabase
      .from('customers')
      .insert([
        { 
          full_name: normalizedName,
          email: normalizedEmail,
          password: Password,
          rank_id: 1,
        }
      ])
      .select('id, full_name, email, rank_id')
      .single();

    if (insertError) throw insertError;

    res.json({
      message: "Đăng ký thành công trên Supabase",
      CustomerID: data.id,
      user: sanitizeUser(data, { rank_name: 'Standard' })
    });

  } catch (err) {
    console.error("Lỗi Supabase:", err.message);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { Email, Password } = req.body;

    const normalizedEmail = Email?.trim().toLowerCase();

    if (!normalizedEmail || !Password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ Email và Password" });
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, full_name, email, phone, password, rank_id, customer_ranks(rank_name, discount_percentage, description)')
      .eq('email', normalizedEmail)
      .eq('password', Password)
      .maybeSingle();

    if (error || !customer) {
      console.error("Login Error:", error);
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác" });
    }


    res.json({
      message: "Đăng nhập thành công",
      user: sanitizeUser(customer, customer.customer_ranks || { rank_name: 'Standard' })
    });

  } catch (err) {
    console.error("Lỗi Server Login:", err.message);
    res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
  }

};
