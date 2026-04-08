require("dotenv").config();
const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/product.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/products", productRoutes);

app.get("/", (req, res) => {
  console.log("🔥 ROOT HIT LOCAL");
  res.send("LOCAL SERVER");
});

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});