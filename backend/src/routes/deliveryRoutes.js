const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "hesham_store_secret_key";

let deliveryPlaces = [
  {
    id: 1,
    name: "Cairo",
    price: 50,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Giza",
    price: 60,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Alexandria",
    price: 85,
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

  if (!["owner", "admin", "manager"].includes(user.role)) {
    res.status(403).json({
      message: "You do not have permission",
    });

    return null;
  }

  return user;
}

function normalizePlace(body, existingPlace = {}) {
  const name = String(body.name ?? existingPlace.name ?? "").trim();
  const price = Number(body.price ?? existingPlace.price ?? 0);

  return {
    ...existingPlace,
    name,
    price,
    active:
      typeof body.active === "boolean"
        ? body.active
        : existingPlace.active ?? true,
    updatedAt: new Date().toISOString(),
  };
}

/* =========================
   Public checkout route
   GET /api/delivery/places
   ========================= */

router.get("/places", (req, res) => {
  const activePlaces = deliveryPlaces.filter((place) => place.active !== false);

  res.json(activePlaces);
});

/* =========================
   Admin routes
   ========================= */

router.get("/admin/places", (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;

  res.json(deliveryPlaces);
});

router.post("/admin/places", (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;

  const { name, price } = req.body;

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({
      message: "Delivery place name is required",
    });
  }

  if (!Number.isFinite(Number(price)) || Number(price) < 0) {
    return res.status(400).json({
      message: "Delivery price must be a valid number",
    });
  }

  const exists = deliveryPlaces.some(
    (place) =>
      place.name.trim().toLowerCase() === String(name).trim().toLowerCase()
  );

  if (exists) {
    return res.status(400).json({
      message: "Delivery place already exists",
    });
  }

  const newPlace = {
    id: Date.now(),
    ...normalizePlace(req.body),
    createdAt: new Date().toISOString(),
  };

  deliveryPlaces.unshift(newPlace);

  res.status(201).json({
    message: "Delivery place created successfully",
    place: newPlace,
  });
});

router.put("/admin/places/:id", (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;

  const placeId = Number(req.params.id);
  const placeIndex = deliveryPlaces.findIndex((place) => place.id === placeId);

  if (placeIndex === -1) {
    return res.status(404).json({
      message: "Delivery place not found",
    });
  }

  const { name, price } = req.body;

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({
      message: "Delivery place name is required",
    });
  }

  if (!Number.isFinite(Number(price)) || Number(price) < 0) {
    return res.status(400).json({
      message: "Delivery price must be a valid number",
    });
  }

  const duplicate = deliveryPlaces.some(
    (place) =>
      place.id !== placeId &&
      place.name.trim().toLowerCase() === String(name).trim().toLowerCase()
  );

  if (duplicate) {
    return res.status(400).json({
      message: "Another delivery place with this name already exists",
    });
  }

  const updatedPlace = {
    id: placeId,
    ...normalizePlace(req.body, deliveryPlaces[placeIndex]),
  };

  deliveryPlaces[placeIndex] = updatedPlace;

  res.json({
    message: "Delivery place updated successfully",
    place: updatedPlace,
  });
});

router.delete("/admin/places/:id", (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;

  if (!["owner", "admin"].includes(user.role)) {
    return res.status(403).json({
      message: "Only owner or admin can delete delivery places",
    });
  }

  const placeId = Number(req.params.id);
  const exists = deliveryPlaces.some((place) => place.id === placeId);

  if (!exists) {
    return res.status(404).json({
      message: "Delivery place not found",
    });
  }

  deliveryPlaces = deliveryPlaces.filter((place) => place.id !== placeId);

  res.json({
    message: "Delivery place deleted successfully",
  });
});

module.exports = router;