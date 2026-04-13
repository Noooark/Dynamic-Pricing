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


// === THÊM VÀO CUỐI FILE googleSheet.service.js ===

exports.getProductBySKU = async (sku) => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Products!A2:H100",
  });

  const rows = res.data.values || [];
  
  const productRow = rows.find(row => row[0] === sku);
  
  if (!productRow) return null;

  return {
    sku: productRow[0],
    productName: productRow[1],
    currentPrice: parseFloat(productRow[2]) || 0,
    costPrice: parseFloat(productRow[3]) || 0,
    floorPrice: parseFloat(productRow[4]) || 0,
    competitorPrice: parseFloat(productRow[5]) || 0,
    lastUpdated: productRow[7]
  };
};

exports.getCustomerByID = async (customerID) => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Customer Data!A2:K100",   // Điều chỉnh range nếu cần
  });

  const rows = res.data.values || [];
  
  // Giả sử cột A là Customer ID
  const customerRow = rows.find(row => row[0] === customerID);
  
  if (!customerRow) return null;

  return {
    "Customer ID": customerRow[0],
    "Name": customerRow[1],
    "Total Orders": customerRow[2],
    "Total Spent": customerRow[3],
    "Member Ship": customerRow[4],
    "Last 30d Orders ": customerRow[5],
    "Email": customerRow[6],
    // thêm các cột khác nếu cần
  };
};