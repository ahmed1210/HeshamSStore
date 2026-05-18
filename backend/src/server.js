require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const paymobRoutes = require("./routes/paymobRoutes");
const discountRoutes = require("./routes/discountRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Public uploads folder: backend/uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.json({
    message: "Hesham Store API is running",
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend test route is working",
  });
});

app.get("/api/env-test", (req, res) => {
  res.json({
    port: process.env.PORT || 5000,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

    hasAdminEmail: !!process.env.ADMIN_EMAIL,
    hasAdminUsername: !!process.env.ADMIN_USERNAME,
    hasAdminPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,

    hasDevEmail: !!process.env.DEV_EMAIL,
    hasDevUsername: !!process.env.DEV_USERNAME,
    hasDevPasswordHash: !!process.env.DEV_PASSWORD_HASH,

    hasJwtSecret: !!process.env.JWT_SECRET,

    hasPaymobApiKey:
      !!process.env.PAYMOB_API_KEY &&
      process.env.PAYMOB_API_KEY !== "your_paymob_api_key",

    hasPaymobIntegrationId:
      !!process.env.PAYMOB_INTEGRATION_ID &&
      process.env.PAYMOB_INTEGRATION_ID !== "your_paymob_integration_id",

    hasPaymobIframeId:
      !!process.env.PAYMOB_IFRAME_ID &&
      process.env.PAYMOB_IFRAME_ID !== "your_paymob_iframe_id",
  });
});

// API routes
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/paymob", paymobRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/admin/discounts", discountRoutes);
// 404 route
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    message: error.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Hesham Store backend running on port ${PORT}`);
});