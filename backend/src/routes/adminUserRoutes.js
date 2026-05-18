const express = require("express");

const {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} = require("../controllers/adminUserController");

const router = express.Router();

router.get("/", getAdminUsers);
router.post("/", createAdminUser);
router.put("/:id", updateAdminUser);
router.patch("/:id", updateAdminUser);
router.delete("/:id", deleteAdminUser);

module.exports = router;