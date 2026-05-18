let products = [
  {
    id: 1,
    name: "Black Runner Sneakers",
    category: "men",
    brand: "Hesham Brand",
    price: 1499,
    oldPrice: 1899,
    quantity: 15,
    rating: 4.8,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200",
    ],
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200",
    sizes: ["40", "41", "42", "43", "44"],
    sizeStock: {
      40: 3,
      41: 5,
      42: 4,
      43: 2,
      44: 1,
    },
    tags: ["best-sale", "featured"],
    description: "Modern black running sneakers for daily comfort.",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Yellow Street Sneakers",
    category: "women",
    brand: "Urban Step",
    price: 1299,
    oldPrice: 1599,
    quantity: 10,
    rating: 4.6,
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200",
    ],
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200",
    sizes: ["36", "37", "38", "39", "40"],
    sizeStock: {
      36: 2,
      37: 2,
      38: 3,
      39: 2,
      40: 1,
    },
    tags: ["sale", "new-arrival"],
    description: "Stylish yellow sneakers with a bold streetwear look.",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Kids Sport Shoes",
    category: "kids",
    brand: "Mini Step",
    price: 899,
    oldPrice: 1099,
    quantity: 20,
    rating: 4.7,
    images: [
      "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?q=80&w=1200",
    ],
    image:
      "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?q=80&w=1200",
    sizes: ["28", "29", "30", "31", "32"],
    sizeStock: {
      28: 4,
      29: 4,
      30: 4,
      31: 4,
      32: 4,
    },
    tags: ["trending"],
    description: "Comfortable sport shoes for active kids.",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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

const createSizeStockFromSizes = (sizes, existingSizeStock = {}) => {
  const stock = {};

  sizes.forEach((size) => {
    stock[size] = Number(existingSizeStock[size] ?? 0);
  });

  return stock;
};

const calculateTotalStock = (sizeStock = {}) => {
  return Object.values(sizeStock).reduce(
    (sum, qty) => sum + Number(qty || 0),
    0
  );
};

const normalizeSizeStock = (body, sizes, existingProduct = {}) => {
  if (body.sizeStock && typeof body.sizeStock === "object") {
    return createSizeStockFromSizes(sizes, body.sizeStock);
  }

  if (typeof body.sizeStock === "string") {
    try {
      const parsed = JSON.parse(body.sizeStock);
      return createSizeStockFromSizes(sizes, parsed);
    } catch {
      return createSizeStockFromSizes(sizes, existingProduct.sizeStock || {});
    }
  }

  if (existingProduct.sizeStock) {
    return createSizeStockFromSizes(sizes, existingProduct.sizeStock);
  }

  const equalStock = {};
  const totalQuantity = Number(body.quantity || existingProduct.quantity || 0);
  const perSize = sizes.length ? Math.floor(totalQuantity / sizes.length) : 0;
  const remainder = sizes.length ? totalQuantity % sizes.length : 0;

  sizes.forEach((size, index) => {
    equalStock[size] = perSize + (index < remainder ? 1 : 0);
  });

  return equalStock;
};

const normalizeProduct = (body, existingProduct = {}) => {
  const sizes = normalizeArray(body.sizes ?? existingProduct.sizes);
  const sizeStock = normalizeSizeStock(body, sizes, existingProduct);
  const quantity = calculateTotalStock(sizeStock);

  const images = normalizeArray(
    body.images || body.image || existingProduct.images
  );

  const mainImage =
    body.image ||
    images[0] ||
    existingProduct.image ||
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200";

  return {
    ...existingProduct,
    name: body.name ?? existingProduct.name,
    category: body.category ?? existingProduct.category,
    brand: body.brand ?? existingProduct.brand,
    price: Number(body.price ?? existingProduct.price ?? 0),
    oldPrice: Number(body.oldPrice ?? existingProduct.oldPrice ?? 0),
    quantity,
    rating: Number(body.rating ?? existingProduct.rating ?? 5),
    images,
    image: mainImage,
    sizes,
    sizeStock,
    tags: normalizeTags(body.tags ?? existingProduct.tags),
    description: body.description ?? existingProduct.description ?? "",
    isActive:
      typeof body.isActive === "boolean"
        ? body.isActive
        : existingProduct.isActive ?? true,
    createdAt: existingProduct.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/* =========================
   Public/Admin: Get products
   GET /api/products
========================= */

const getProducts = (req, res) => {
  const { category, search, brand, tag } = req.query;

  let filteredProducts = products.filter((product) => product.isActive !== false);

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

  res.json(filteredProducts);
};

/* =========================
   Public/Admin: Get product by ID
   GET /api/products/:id
========================= */

const getProductById = (req, res) => {
  const product = products.find((item) => item.id === Number(req.params.id));

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  res.json(product);
};

/* =========================
   Admin: Create product
   POST /api/products
========================= */

const createProduct = (req, res) => {
  const { name, category, price, sizes } = req.body;

  if (!name || !category || !price || !sizes) {
    return res.status(400).json({
      message: "Name, category, price, and sizes are required",
    });
  }

  const newProduct = {
    id: Date.now(),
    ...normalizeProduct(req.body),
  };

  products.push(newProduct);

  res.status(201).json({
    message: "Product created successfully",
    product: newProduct,
  });
};

/* =========================
   Admin: Update product
   PUT /api/products/:id
========================= */

const updateProduct = (req, res) => {
  const productId = Number(req.params.id);
  const productIndex = products.findIndex((item) => item.id === productId);

  if (productIndex === -1) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  const updatedProduct = {
    id: productId,
    ...normalizeProduct(req.body, products[productIndex]),
  };

  products[productIndex] = updatedProduct;

  res.json({
    message: "Product updated successfully",
    product: updatedProduct,
  });
};

/* =========================
   Admin: Delete product
   DELETE /api/products/:id
========================= */

const deleteProduct = (req, res) => {
  const productId = Number(req.params.id);
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  products = products.filter((item) => item.id !== productId);

  res.json({
    message: "Product deleted successfully",
  });
};

/* =========================
   Internal helpers
========================= */

const getProductsData = () => {
  return products;
};

const checkProductSizeStock = (productId, selectedSize, quantityToCheck) => {
  const product = products.find((item) => item.id === Number(productId));

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

const reduceProductSizeStock = (productId, selectedSize, quantityToReduce) => {
  const checkResult = checkProductSizeStock(
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

  product.sizeStock[size] = currentStock - reduceBy;
  product.quantity = calculateTotalStock(product.sizeStock);
  product.updatedAt = new Date().toISOString();

  if (product.quantity === 0) {
    product.tags = [...new Set([...(product.tags || []), "out-of-stock"])];
  } else {
    product.tags = (product.tags || []).filter(
      (tag) => tag !== "out-of-stock"
    );
  }

  return {
    ok: true,
    product,
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