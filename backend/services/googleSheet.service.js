const sheets = require("../config/google");
const SPREADSHEET_ID = "1z4q6PEUVbgN35zNOL2d8NxxrRfaw478QAJVFdQPFaHo";

// Lấy tất cả sản phẩm (dùng cho FLOW 1)
exports.getAllProducts = async () => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Products!A2:H100",
  });

  const rows = res.data.values || [];

  return rows.map(row => ({
    sku: row[0],
    productName: row[1],
    currentPrice: parseFloat(row[2]) || 0,
    costPrice: parseFloat(row[3]) || 0,
    floorPrice: parseFloat(row[4]) || 0,
    competitorPrice: parseFloat(row[5]) || 0,
    maxDiscountPercent: parseFloat(row[6]) || 15,
    lastUpdated: row[7]
  }));
};

// Lấy 1 sản phẩm theo SKU
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
    maxDiscountPercent: parseFloat(productRow[6]) || 15,
    lastUpdated: productRow[7]
  };
};
// Cập nhật giá sản phẩm (dùng khi duyệt giảm giá)
exports.updateProductPrice = async (sku, newPrice) => {
  try {
    // Tìm row có SKU tương ứng
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Products!A2:H100",
    });

    const rows = getRes.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === sku);

    if (rowIndex === -1) {
      throw new Error("Không tìm thấy sản phẩm với SKU: " + sku);
    }

    const actualRowNumber = rowIndex + 2; // vì bắt đầu từ A2

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Products!C${actualRowNumber}`, // Cột CurrentPrice
      valueInputOption: "RAW",
      resource: {
        values: [[newPrice]]
      }
    });

    // Cập nhật thời gian LastUpdated
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Products!H${actualRowNumber}`,
      valueInputOption: "RAW",
      resource: {
        values: [[new Date().toISOString()]]
      }
    });

    return true;
  } catch (err) {
    console.error("Update price error:", err);
    throw err;
  }
};

// Ghi log vào PriceHistory
exports.appendPriceLog = async (logData) => {
  const { sku, oldPrice, newPrice, competitorPrice, reason, decision = "Auto" } = logData;

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "PriceHistory!A:I",
    valueInputOption: "RAW",
    resource: {
      values: [[
        new Date().toISOString(),   // Timestamp
        sku,
        "FLOW1",
        oldPrice,
        newPrice,
        competitorPrice,
        reason,
        decision,
        "Success"
      ]]
    }
  });
};
// Lấy thông tin khách hàng (dùng cho FLOW 3)
exports.getCustomerByID = async (customerID) => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Customer Data!A2:K100",
  });

  const rows = res.data.values || [];
  const customerRow = rows.find(row => row[0] === customerID);

  if (!customerRow) return null;

  return {
    customerID: customerRow[0],
    name: customerRow[1],
    totalOrders: parseInt(customerRow[2]) || 0,
    totalSpent: parseFloat(customerRow[3]) || 0,
    memberShip: customerRow[4] || "Silver",
    last30dOrders: parseInt(customerRow[5]) || 0,
    email: customerRow[6],
  };
};