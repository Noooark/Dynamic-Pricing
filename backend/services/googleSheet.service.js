const sheets = require("../config/google");
const SPREADSHEET_ID = "1z4q6PEUVbgN35zNOL2d8NxxrRfaw478QAJVFdQPFaHo"; 

exports.getAllProducts = async () => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Products!A2:H100", 
  });

  const rows = res.data.values || [];
  
  // Chuyển đổi mảng thô thành Object để FE dễ dùng
  return rows.map(row => ({
    sku: row[0],
    productName: row[1],
    currentPrice: parseFloat(row[2]) || 0,
    costPrice: row[3],
    competitorPrice: parseFloat(row[5]) || 0, // Cột F trong Sheets
    lastUpdated: row[7] // Cột H trong Sheets
  }));
};