const sheets = require("../config/google");

const SPREADSHEET_ID = "1z4q6PEUVbgN35zNOL2d8NxxrRfaw478QAJVFdQPFaHo";

exports.getAllProducts = async () => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Kho_hang!A2:D100",
  });

  return res.data.values || [];
};