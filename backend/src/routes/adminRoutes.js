const express = require("express");
const {
  adminLogin,
  getAdminDashboard,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} = require("../controllers/adminController");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

router.post("/login", adminLogin);
router.get("/dashboard", adminAuth, getAdminDashboard);

router.get("/users", adminAuth, getAdminUsers);
router.post("/users", adminAuth, createAdminUser);
router.put("/users/:id", adminAuth, updateAdminUser);
router.delete("/users/:id", adminAuth, deleteAdminUser);

module.exports = router;