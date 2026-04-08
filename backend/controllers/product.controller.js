const { getAllProducts } = require("../services/googleSheet.service");

exports.getProducts = async (req, res) => {
  try {
    const data = await getAllProducts();
    res.json(data);
  } catch (err) {
    console.error("FULL ERROR:", err);

    if (err.response) {
      console.error("DATA:", err.response.data);
    }

    res.status(500).json({
      message: err.message,
      details: err.response?.data || null,
    });
  }
};