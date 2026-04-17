// backend/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/product.routes");
const vipPricingRoutes = require("./routes/vipPricing.routes");
const priceRoutes = require("./routes/price.routes");
const authRoutes = require("./routes/auth.routes");
const cartRoutes = require("./routes/cart.routes");

const app = express();
app.use(cors());
app.use(express.json());

// Mount routes
app.use("/products", productRoutes);        
app.use("/vip-pricing", vipPricingRoutes); 
app.use("/price", priceRoutes); 
app.use("/auth", authRoutes);
app.use("/cart", cartRoutes);

app.get("/", (req, res) => {
  console.log("🔥 ROOT HIT");
  res.send("Backend Server is running");
});

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});