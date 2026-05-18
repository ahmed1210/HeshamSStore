const express = require("express");
const jwt = require("jsonwebtoken");

const {
  checkProductSizeStock,
  reduceProductSizeStock,
} = require("../controllers/productController");

let telegramUtils = null;

try {
  telegramUtils = require("../utils/telegram");
} catch {
  telegramUtils = null;
}

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "hesham_store_secret_key";

let orders = [];

function getCurrentUser(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAdmin(req, res) {
  const user = getCurrentUser(req);

  if (!user) {
    res.status(401).json({
      message: "You must be logged in",
    });

    return null;
  }

  if (!["owner", "admin", "manager", "staff"].includes(user.role)) {
    res.status(403).json({
      message: "You do not have permission",
    });

    return null;
  }

  return user;
}

function normalizeOrderBody(body) {
  const customer = body.customer || {
    name: body.customerName || body.fullName || body.name || "",
    fullName: body.customerName || body.fullName || body.name || "",
    email: body.customerEmail || body.email || "",
    phone: body.customerPhone || body.phone || "",
    city: body.customerCity || body.city || "",
    address: body.customerAddress || body.address || "",
    notes: body.notes || "",
  };

  const items = body.items || body.products || body.cart || [];

  const totalPrice = Number(body.totalPrice || body.total || body.amount || 0);
  const subtotal = Number(body.subtotal || 0);
  const shipping = Number(body.shipping || body.deliveryPrice || 0);

  return {
    customer,
    items,
    totalPrice,
    subtotal,
    shipping,
  };
}

function normalizePhone(phone) {
  return String(phone || "").trim();
}

function buildSafeItems(items) {
  return items.map((item) => {
    const quantity = Number(item.quantity || item.cartQuantity || item.qty || 1);

    return {
      id: item.id || item.productId,
      productId: item.productId || item.id,
      name: item.name || item.productName || "Product",
      productName: item.productName || item.name || "Product",
      image: item.image || item.imageUrl || "",
      size: item.size || item.selectedSize || "",
      selectedSize: item.selectedSize || item.size || "",
      price: Number(item.price || 0),
      quantity,
      cartQuantity: quantity,
    };
  });
}

function validateSafeItems(safeItems) {
  for (const item of safeItems) {
    if (!item.productId) {
      return `Missing product id for ${item.name}`;
    }

    if (!item.selectedSize) {
      return `Missing selected size for ${item.name}`;
    }

    if (!Number.isFinite(item.price) || item.price < 0) {
      return `Invalid price for ${item.name}`;
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return `Invalid quantity for ${item.name}`;
    }
  }

  return "";
}

async function sendTelegramIfAvailable(order) {
  try {
    if (
      telegramUtils &&
      typeof telegramUtils.sendTelegramMessage === "function" &&
      typeof telegramUtils.formatOrderTelegramMessage === "function"
    ) {
      const telegramMessage = telegramUtils.formatOrderTelegramMessage(order);
      await telegramUtils.sendTelegramMessage(telegramMessage);
    }
  } catch (error) {
    console.error("Telegram notification failed:", error.message);
  }
}

/* =========================
   Admin: Get all orders
   GET /api/orders
========================= */

router.get("/", (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;

  res.json(orders);
});

/* =========================
   Admin: Get single order
   GET /api/orders/:id
========================= */

router.get("/:id", (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;

  const orderId = Number(req.params.id);
  const order = orders.find((item) => Number(item.id) === orderId);

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  res.json(order);
});

/* =========================
   Public: Create order
   POST /api/orders
========================= */

router.post("/", async (req, res) => {
  try {
    const { customer, items, totalPrice, subtotal, shipping } =
      normalizeOrderBody(req.body);

    if (!customer || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Customer and items are required",
      });
    }

    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
      return res.status(400).json({
        message: "Total price is required",
      });
    }

    const customerName = customer.fullName || customer.name;
    const customerPhone = normalizePhone(customer.phone);

    if (!customerName || String(customerName).trim().length < 3) {
      return res.status(400).json({
        message: "Customer name is required",
      });
    }

    if (!customer.email) {
      return res.status(400).json({
        message: "Customer email is required",
      });
    }

    if (!customerPhone) {
      return res.status(400).json({
        message: "Customer phone is required",
      });
    }

    if (!customer.address || String(customer.address).trim().length < 8) {
      return res.status(400).json({
        message: "Customer address is required",
      });
    }

    const safeItems = buildSafeItems(items);
    const itemsError = validateSafeItems(safeItems);

    if (itemsError) {
      return res.status(400).json({
        message: itemsError,
      });
    }

    /*
      Check stock first before reducing anything.
      This avoids reducing one item if another item fails.
    */
    for (const item of safeItems) {
      const stockResult = checkProductSizeStock(
        item.productId,
        item.selectedSize,
        item.quantity
      );

      if (!stockResult.ok) {
        return res.status(stockResult.status || 400).json({
          message: stockResult.message,
        });
      }
    }

    /*
      Reduce stock only after all items passed validation.
    */
    for (const item of safeItems) {
      const reduceResult = reduceProductSizeStock(
        item.productId,
        item.selectedSize,
        item.quantity
      );

      if (!reduceResult.ok) {
        return res.status(reduceResult.status || 400).json({
          message: reduceResult.message,
        });
      }
    }

    const now = new Date().toISOString();
    const orderId = Date.now();

    const newOrder = {
      id: orderId,
      orderNumber: `HS-${orderId}`,

      customer: {
        fullName: String(customerName).trim(),
        name: String(customerName).trim(),
        email: String(customer.email || "").trim(),
        phone: customerPhone,
        city: customer.city || req.body.deliveryPlace || "",
        address: String(customer.address || "").trim(),
        notes: customer.notes || req.body.notes || "",
      },

      deliveryPlaceId: req.body.deliveryPlaceId || "",
      deliveryPlace: req.body.deliveryPlace || customer.city || "",
      deliveryPrice: Number(req.body.deliveryPrice || shipping || 0),

      discountCode: req.body.discountCode || "",
      discountType: req.body.discountType || "",
      discountValue: Number(req.body.discountValue || 0),
      discountAmount: Number(req.body.discountAmount || 0),

      items: safeItems,
      products: safeItems,

      paymentMethod: req.body.paymentMethod || "cash",
      paymentStatus:
        req.body.paymentStatus ||
        (req.body.paymentMethod === "cash" ? "pending" : "pending"),

      status: req.body.status || "pending",
      orderStatus: req.body.orderStatus || "new",

      subtotal: Number(subtotal || 0),
      shipping: Number(shipping || req.body.deliveryPrice || 0),
      total: Number(totalPrice),
      totalPrice: Number(totalPrice),

      createdAt: req.body.createdAt || now,
      orderDate: req.body.orderDate || now,
      updatedAt: now,
    };

    orders.unshift(newOrder);

    await sendTelegramIfAvailable(newOrder);

    res.status(201).json({
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      message: error.message || "Failed to create order",
    });
  }
});

/* =========================
   Admin: Update order status
   PATCH /api/orders/:id/status
   PUT /api/orders/:id/status
========================= */

function updateOrderStatus(req, res) {
  const user = requireAdmin(req, res);
  if (!user) return;

  if (!["owner", "admin", "manager"].includes(user.role)) {
    return res.status(403).json({
      message: "You do not have permission to update orders",
    });
  }

  const orderId = Number(req.params.id);
  const { status } = req.body;

  const allowedStatuses = [
    "new",
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "payment_pending",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid order status",
    });
  }

  const index = orders.findIndex((item) => Number(item.id) === orderId);

  if (index === -1) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  orders[index].orderStatus = status;
  orders[index].status = status;
  orders[index].updatedAt = new Date().toISOString();

  res.json({
    message: "Order status updated successfully",
    order: orders[index],
  });
}

router.patch("/:id/status", updateOrderStatus);
router.put("/:id/status", updateOrderStatus);

/* =========================
   Admin: Delete order
   DELETE /api/orders/:id
========================= */

router.delete("/:id", (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;

  if (!["owner", "admin"].includes(user.role)) {
    return res.status(403).json({
      message: "Only owner or admin can delete orders",
    });
  }

  const orderId = Number(req.params.id);
  const exists = orders.some((item) => Number(item.id) === orderId);

  if (!exists) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  orders = orders.filter((item) => Number(item.id) !== orderId);

  res.json({
    message: "Order deleted successfully",
  });
});

module.exports = router;