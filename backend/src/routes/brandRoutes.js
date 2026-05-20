const express = require("express");

const {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} = require("../controllers/brandController");

const router = express.Router();

router.get("/", getBrands);
router.post("/", createBrand);
router.put("/:id", updateBrand);
router.patch("/:id", updateBrand);
router.delete("/:id", deleteBrand);

module.exports = router;