const express = require("express");

const {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscount,
} = require("../controllers/discountController");

const router = express.Router();

/* Admin discounts */
router.get("/", getDiscounts);
router.post("/", createDiscount);

router.get("/admin", getDiscounts);
router.post("/admin", createDiscount);

/* Validate discount on checkout */
router.post("/validate", validateDiscount);

/* Single discount actions */
router.put("/:id", updateDiscount);
router.patch("/:id", updateDiscount);
router.delete("/:id", deleteDiscount);

router.put("/admin/:id", updateDiscount);
router.patch("/admin/:id", updateDiscount);
router.delete("/admin/:id", deleteDiscount);

module.exports = router;