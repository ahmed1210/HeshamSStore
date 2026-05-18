const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "hesham_store_secret_key";

let discounts = [
  {
    id: 1,
    code: "HESHAM10",
    type: "percentage",
    value: 10,
    minOrder: 0,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    code: "HESHAM20",
    type: "percentage",
    value: 20,
    minOrder: 1000,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    code: "FREEDELIVERY",
    type: "free_delivery",
    value: 0,
    minOrder: 2000,
    active: true,
    createdAt: new Date().toISOString(),
  },
];

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

  if (!["owner", "admin"].includes(user.role)) {
    res.status(403).json({
      message: "Only owner or admin can manage discounts",
    });

    return null;
  }

  return user;
}

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

function normalizeDiscount(body, existingDiscount = {}) {
  const code = normalizeCode(body.code ?? existingDiscount.code);
  const type = body.type ?? existingDiscount.type ?? "percentage";
  const value = Number(body.value ?? existingDiscount.value ?? 0);
  const minOrder = Number(body.minOrder ?? existingDiscount.minOrder ?? 0);

  return {
    ...existingDiscount,
    code,
    type,
    value,
    minOrder,
    active:
      typeof body.active === "boolean"
        ? body.active
        : existingDiscount.active ?? true,
    updatedAt: new Date().toISOString(),
  };
}

function validateDiscountData(body) {
  const code = normalizeCode(body.code);
  const type = body.type;
  const value = Number(body.value || 0);
  const minOrder = Number(body.minOrder || 0);

  if (!code || code.length < 3) {
    return "Discount code must be at least 3 characters";
  }

  if (!["percentage", "fixed", "free_delivery"].includes(type)) {
    return "Discount type must be percentage, fixed, or free_delivery";
  }

  if (type === "percentage" && (value <= 0 || value > 100)) {
    return "Percentage discount must be between 1 and 100";
  }

  if (type === "fixed" && value <= 0) {
    return "Fixed discount value must be greater than 0";
  }

  if (!Number.isFinite(minOrder) || minOrder < 0) {
    return "Minimum order must be a valid number";
  }

  return "";
}

/* =========================
   Public validate route
   POST /api/discounts/validate
   ========================= */

router.post("/validate", (req, res) => {
  const code = normalizeCode(req.body.code);
  const subtotal = Number(req.body.subtotal || 0);
  const deliveryPrice = Number(req.body.deliveryPrice || 0);

  if (!code) {
    return res.status(400).json({
      message: "Discount code is required",
    });
  }

  const discount = discounts.find(
    (item) => item.code === code && item.active !== false
  );

  if (!discount) {
    return res.status(404).json({
      message: "Invalid discount code",
    });
  }

  if (subtotal < Number(discount.minOrder || 0)) {
    return res.status(400).json({
      message: `Minimum order for this code is ${discount.minOrder} EGP`,
    });
  }

  let discountAmount = 0;
  let label = "";

  if (discount.type === "percentage") {
    discountAmount = Math.round((subtotal * Number(discount.value || 0)) / 100);
    label = `${discount.value}% off`;
  }

  if (discount.type === "fixed") {
    discountAmount = Math.min(subtotal, Number(discount.value || 0));
    label = `${discount.value} EGP off`;
  }

  if (discount.type === "free_delivery") {
    discountAmount = deliveryPrice;
    label = "Free delivery";
  }

  res.json({
    message: "Discount applied successfully",
    discount: {
      id: discount.id,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      minOrder: discount.minOrder,
      label,
      discountAmount,
    },
  });
});

/* =========================
   Admin routes
   ========================= */

router.get("/admin", (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;

  res.json(discounts);
});

router.post("/admin", (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;

  const error = validateDiscountData(req.body);

  if (error) {
    return res.status(400).json({
      message: error,
    });
  }

  const code = normalizeCode(req.body.code);

  const exists = discounts.some((item) => item.code === code);

  if (exists) {
    return res.status(400).json({
      message: "Discount code already exists",
    });
  }

  const newDiscount = {
    id: Date.now(),
    ...normalizeDiscount(req.body),
    createdAt: new Date().toISOString(),
  };

  discounts.unshift(newDiscount);

  res.status(201).json({
    message: "Discount created successfully",
    discount: newDiscount,
  });
});

router.put("/admin/:id", (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;

  const discountId = Number(req.params.id);
  const discountIndex = discounts.findIndex((item) => item.id === discountId);

  if (discountIndex === -1) {
    return res.status(404).json({
      message: "Discount not found",
    });
  }

  const error = validateDiscountData(req.body);

  if (error) {
    return res.status(400).json({
      message: error,
    });
  }

  const code = normalizeCode(req.body.code);

  const duplicate = discounts.some(
    (item) => item.id !== discountId && item.code === code
  );

  if (duplicate) {
    return res.status(400).json({
      message: "Another discount with this code already exists",
    });
  }

  const updatedDiscount = {
    id: discountId,
    ...normalizeDiscount(req.body, discounts[discountIndex]),
  };

  discounts[discountIndex] = updatedDiscount;

  res.json({
    message: "Discount updated successfully",
    discount: updatedDiscount,
  });
});

router.delete("/admin/:id", (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;

  const discountId = Number(req.params.id);
  const exists = discounts.some((item) => item.id === discountId);

  if (!exists) {
    return res.status(404).json({
      message: "Discount not found",
    });
  }

  discounts = discounts.filter((item) => item.id !== discountId);

  res.json({
    message: "Discount deleted successfully",
  });
});

module.exports = router;