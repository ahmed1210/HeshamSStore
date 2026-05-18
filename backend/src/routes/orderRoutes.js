const express = require("express");

const {
  createOrder,
  getOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const router = express.Router();

/* =========================
   Orders
========================= */

router.post("/", createOrder);

router.get("/", getOrders);

router.patch("/:id/status", updateOrderStatus);

router.put("/:id/status", updateOrderStatus);

  module.exports = router;