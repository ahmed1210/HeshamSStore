const express = require("express");
const {
  getPublicSettings,
  updateStoreSettings,
  changeAdminPassword,
} = require("../controllers/settingsController");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", getPublicSettings);
router.put("/", adminAuth, updateStoreSettings);
router.patch("/password", adminAuth, changeAdminPassword);

module.exports = router;
