const express = require("express");
const multer = require("multer");
const path = require("path");
const supabase = require("../config/supabase");

const router = express.Router();

const BUCKET_NAME = "product-images";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, and WEBP images are allowed"), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image uploaded",
      });
    }

    const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = `products/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);

      return res.status(500).json({
        message: "Failed to upload image to Supabase Storage",
        error: uploadError.message,
      });
    }

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const imageUrl = data.publicUrl;

    return res.status(201).json({
      message: "Image uploaded successfully",
      imageUrl,
      url: imageUrl,
      filename,
      path: filePath,
    });
  } catch (error) {
    console.error("Upload route error:", error);

    return res.status(500).json({
      message: error.message || "Failed to upload image",
    });
  }
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Image size must be less than 5MB",
      });
    }

    return res.status(400).json({
      message: error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      message: error.message || "Upload failed",
    });
  }

  next();
});

module.exports = router;