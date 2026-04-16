const { createClient } = require('@supabase/supabase-js');

// Thay thế bằng thông tin thực tế từ Supabase Dashboard của bạn
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...userData } = user;
  return userData;
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
      .select('customer_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUserError) throw existingUserError;

    if (existingUser) {
      return res.status(409).json({ message: "Email đã được sử dụng" });
    }

    const { count, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    const newIdNumber = (count || 0) + 1;
    const customerID = `C${String(newIdNumber).padStart(3, "0")}`;

    const { data, error: insertError } = await supabase
      .from('customers')
      .insert([
        { 
          customer_id: customerID, 
          name: normalizedName, 
          total_orders: 0, 
          total_spent: 0, 
          membership_type: 'Silver', 

          email: normalizedEmail,
          password: Password,
        }
      ])
      .select();

    if (insertError) throw insertError;

    res.json({
      message: "Đăng ký thành công trên Supabase",
      CustomerID: customerID,
      user: sanitizeUser(data[0])
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
      .select('*')
      .eq('email', normalizedEmail)
      .eq('password', Password)
      .maybeSingle();

    if (error || !customer) {
      console.error("Login Error:", error);
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác" });
    }


    res.json({
      message: "Đăng nhập thành công",
      user: sanitizeUser(customer)
    });

  } catch (err) {
    console.error("Lỗi Server Login:", err.message);
    res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
  }

};
