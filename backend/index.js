// backend/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/product.routes");
const vipPricingRoutes = require("./routes/vipPricing.routes");

const app = express();
app.use(cors());
app.use(express.json());

// Mount routes
app.use("/products", productRoutes);        

// Sửa dòng này để khớp với webhook n8n
app.use("/webhook-test/vip-pricing", vipPricingRoutes);   // ← Sửa ở đây

app.get("/", (req, res) => {
  console.log("🔥 ROOT HIT");
  res.send("Backend Server is running");
});

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});