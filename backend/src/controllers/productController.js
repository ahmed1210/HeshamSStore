const supabase = require("../config/supabase");

const normalizeArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeTags = (value) => {
  return normalizeArray(value).map((tag) =>
    String(tag).trim().toLowerCase().replace(/\s+/g, "-")
  );
};

const calculateTotalStock = (sizeStock = {}) => {
  return Object.values(sizeStock).reduce(
    (sum, qty) => sum + Number(qty || 0),
    0
  );
};

const createSizeStockFromSizes = (sizes, existingSizeStock = {}) => {
  const stock = {};

  sizes.forEach((size) => {
    stock[size] = Number(existingSizeStock[size] ?? 0);
  });

  return stock;
};

const mapProductFromDb = (product) => {
  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    category: product.category || "",
    brand: product.brand || "",
    price: Number(product.price || 0),
    oldPrice: Number(product.old_price || 0),
    quantity: Number(product.quantity || 0),
    rating: Number(product.rating || 5),
    images: Array.isArray(product.images) ? product.images : [],
    image: product.image || "",
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    sizeStock:
      product.size_stock && typeof product.size_stock === "object"
        ? product.size_stock
        : {},
    tags: Array.isArray(product.tags) ? product.tags : [],
    description: product.description || "",
    isActive: product.is_active !== false,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
};

const normalizeProductToDb = (body, existingProduct = {}) => {
  const existingSizes = existingProduct.sizes || [];
  const existingSizeStock = existingProduct.sizeStock || {};

  const sizes = normalizeArray(body.sizes ?? existingSizes);

  let rawSizeStock = {};

  if (body.sizeStock && typeof body.sizeStock === "object") {
    rawSizeStock = body.sizeStock;
  } else if (typeof body.sizeStock === "string") {
    try {
      rawSizeStock = JSON.parse(body.sizeStock);
    } catch {
      rawSizeStock = existingSizeStock;
    }
  } else if (body.size_stock && typeof body.size_stock === "object") {
    rawSizeStock = body.size_stock;
  } else {
    rawSizeStock = existingSizeStock;
  }

  let sizeStock = createSizeStockFromSizes(sizes, rawSizeStock);

  if (sizes.length > 0 && Object.keys(sizeStock).length === 0) {
    sizeStock = createSizeStockFromSizes(sizes, {});
  }

  const quantity =
    body.quantity !== undefined
      ? Number(body.quantity || 0)
      : calculateTotalStock(sizeStock);

  const images = normalizeArray(
    body.images || body.image || existingProduct.images || []
  );

  const mainImage =
    body.image ||
    images[0] ||
    existingProduct.image ||
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200";

  return {
    name: String(body.name ?? existingProduct.name ?? "").trim(),
    category: String(body.category ?? existingProduct.category ?? "").trim(),
    brand: String(body.brand ?? existingProduct.brand ?? "").trim(),
    price: Number(body.price ?? existingProduct.price ?? 0),
    old_price: Number(body.oldPrice ?? existingProduct.oldPrice ?? 0),
    quantity,
    rating: Number(body.rating ?? existingProduct.rating ?? 5),
    images,
    image: mainImage,
    sizes,
    size_stock: sizeStock,
    tags: normalizeTags(body.tags ?? existingProduct.tags ?? []),
    description: String(
      body.description ?? existingProduct.description ?? ""
    ).trim(),
    is_active:
      typeof body.isActive === "boolean"
        ? body.isActive
        : existingProduct.isActive ?? true,
    updated_at: new Date().toISOString(),
  };
};

/* =========================
   Public/Admin: Get products
   GET /api/products
========================= */

const getProducts = async (req, res) => {
  try {
    const { category, search, brand, tag } = req.query;

    let query = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    let filteredProducts = Array.isArray(data)
      ? data.map(mapProductFromDb)
      : [];

    filteredProducts = filteredProducts.filter(
      (product) => product.isActive !== false
    );

    if (category) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          String(product.category || "").toLowerCase() ===
          String(category).toLowerCase()
      );
    }

    if (brand) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          String(product.brand || "").toLowerCase() ===
          String(brand).toLowerCase()
      );
    }

    if (tag) {
      const requestedTag = String(tag).toLowerCase().replace(/\s+/g, "-");

      filteredProducts = filteredProducts.filter((product) =>
        (product.tags || []).some(
          (item) =>
            String(item).toLowerCase().replace(/\s+/g, "-") === requestedTag
        )
      );
    }

    if (search) {
      const searchText = String(search).toLowerCase();

      filteredProducts = filteredProducts.filter((product) => {
        const productText = `${product.name} ${product.brand} ${
          product.category
        } ${(product.tags || []).join(" ")}`.toLowerCase();

        return productText.includes(searchText);
      });
    }

    return res.json(filteredProducts);
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      message: "Failed to load products",
      error: error.message,
    });
  }
};

/* =========================
   Public/Admin: Get product by ID
   GET /api/products/:id
========================= */

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.json(mapProductFromDb(data));
  } catch (error) {
    console.error("Get product by id error:", error);

    return res.status(500).json({
      message: "Failed to load product",
      error: error.message,
    });
  }
};

/* =========================
   Admin: Create product
   POST /api/products
========================= */

const createProduct = async (req, res) => {
  try {
    const { name, category, price, sizes } = req.body;

    if (!name || !category || !price || !sizes) {
      return res.status(400).json({
        message: "Name, category, price, and sizes are required",
      });
    }

    const payload = normalizeProductToDb(req.body);

    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    return res.status(201).json({
      message: "Product created successfully",
      product: mapProductFromDb(data),
    });
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
};

/* =========================
   Admin: Update product
   PUT /api/products/:id
========================= */

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getProductRawById(id);

    if (!existing) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const normalizedExisting = mapProductFromDb(existing);
    const payload = normalizeProductToDb(req.body, normalizedExisting);

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return res.json({
      message: "Product updated successfully",
      product: mapProductFromDb(data),
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      message: "Failed to update product",
      error: error.message,
    });
  }
};

/* =========================
   Admin: Delete product
   DELETE /api/products/:id
========================= */

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) throw error;

    return res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

/* =========================
   Internal helpers for orders
========================= */

const getProductRawById = async (id) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return data;
};

const getProductsData = async () => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];

  return Array.isArray(data) ? data.map(mapProductFromDb) : [];
};

const checkProductSizeStock = async (
  productId,
  selectedSize,
  quantityToCheck
) => {
  const rawProduct = await getProductRawById(productId);
  const product = mapProductFromDb(rawProduct);

  if (!product) {
    return {
      ok: false,
      status: 404,
      message: "Product not found",
    };
  }

  const size = String(selectedSize || "");
  const checkQty = Number(quantityToCheck || 0);

  if (!product.sizeStock || typeof product.sizeStock !== "object") {
    return {
      ok: false,
      status: 400,
      message: `${product.name} does not have size stock`,
    };
  }

  if (!Object.prototype.hasOwnProperty.call(product.sizeStock, size)) {
    return {
      ok: false,
      status: 400,
      message: `Size ${size} is not available for ${product.name}`,
    };
  }

  const currentStock = Number(product.sizeStock[size] || 0);

  if (!Number.isInteger(checkQty) || checkQty <= 0) {
    return {
      ok: false,
      status: 400,
      message: `Invalid quantity for ${product.name}`,
    };
  }

  if (currentStock < checkQty) {
    return {
      ok: false,
      status: 400,
      message: `${product.name} size ${size} has only ${currentStock} pieces left`,
    };
  }

  return {
    ok: true,
    product,
    currentStock,
  };
};

const reduceProductSizeStock = async (
  productId,
  selectedSize,
  quantityToReduce
) => {
  const checkResult = await checkProductSizeStock(
    productId,
    selectedSize,
    quantityToReduce
  );

  if (!checkResult.ok) {
    return checkResult;
  }

  const product = checkResult.product;
  const size = String(selectedSize);
  const reduceBy = Number(quantityToReduce || 0);
  const currentStock = Number(product.sizeStock[size] || 0);

  const updatedSizeStock = {
    ...product.sizeStock,
    [size]: currentStock - reduceBy,
  };

  const updatedQuantity = calculateTotalStock(updatedSizeStock);

  let updatedTags = Array.isArray(product.tags) ? [...product.tags] : [];

  if (updatedQuantity === 0) {
    updatedTags = [...new Set([...updatedTags, "out-of-stock"])];
  } else {
    updatedTags = updatedTags.filter((tag) => tag !== "out-of-stock");
  }

  const { data, error } = await supabase
    .from("products")
    .update({
      size_stock: updatedSizeStock,
      quantity: updatedQuantity,
      tags: updatedTags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .select("*")
    .single();

  if (error) {
    return {
      ok: false,
      status: 500,
      message: error.message,
    };
  }

  return {
    ok: true,
    product: mapProductFromDb(data),
  };
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsData,
  checkProductSizeStock,
  reduceProductSizeStock,
};