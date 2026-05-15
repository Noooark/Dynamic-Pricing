// backend/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/product.routes");
const roomRoutes = require("./routes/room.routes");
const vipPricingRoutes = require("./routes/vipPricing.routes");
const priceRoutes = require("./routes/price.routes");
const authRoutes = require("./routes/auth.routes");
const cartRoutes = require("./routes/cart.routes");
const eventRoutes = require("./routes/event.routes");
const adminRoutes = require("./routes/admin.routes");


const app = express();

// CORS Configuration - Allow all origins for development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://localhost:3002",
      "http://127.0.0.1:3002"
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests for all routes
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use("/products", productRoutes);
app.use("/rooms", roomRoutes);
app.use("/vip-pricing", vipPricingRoutes); 
app.use("/price", priceRoutes); 
app.use("/auth", authRoutes);
app.use("/cart", cartRoutes);
app.use("/event", eventRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  console.log("🔥 ROOT HIT");
  res.send("Backend Server is running");
});

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});