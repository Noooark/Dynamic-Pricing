const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = "1z4q6PEUVbgN35zNOL2d8NxxrRfaw478QAJVFdQPFaHo";

exports.register = async (req, res) => {
  try {
    const { Name, Email, Password } = req.body;

    if (!Name || !Email || !Password) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    const sheets = google.sheets({
      version: "v4",
      auth: await auth.getClient(),
    });

    // 👉 Lấy toàn bộ dữ liệu để tạo ID
    const getData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Customer Data!A:A",
    });

    const rows = getData.data.values || [];

    const newIdNumber = rows.length; // dòng header + data
    const customerID = `C${String(newIdNumber).padStart(3, "0")}`;

    // 👉 Ghi dữ liệu
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Customer Data!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          customerID,
          Name,
          0,
          0,
          "Silver",
          0,
          Email,
          Password
        ]],
      },
    });

    res.json({
      message: "Đăng ký thành công",
      CustomerID: customerID,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};