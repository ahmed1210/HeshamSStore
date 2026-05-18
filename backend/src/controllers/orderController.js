let orders = [];

const productController = require("./productController");

const createOrder = (req, res) => {
  const { customer, items, totalPrice, paymentMethod } = req.body;

  if (!customer || !items || !items.length || !totalPrice) {
    return res.status(400).json({
      message: "Customer, items, and total price are required",
    });
  }

  const products = productController.getProductsData();

  for (const item of items) {
    const product = products.find((product) => product.id === Number(item.id));

    if (!product) {
      return res.status(404).json({
        message: `${item.name} was not found`,
      });
    }

    const selectedSize = String(item.selectedSize || "");
    const requestedQty = Number(item.cartQuantity || 0);
    const sizeStock = Number(product.sizeStock?.[selectedSize] || 0);

    if (!selectedSize) {
      return res.status(400).json({
        message: `Please choose a size for ${product.name}`,
      });
    }

    if (requestedQty <= 0) {
      return res.status(400).json({
        message: `Invalid quantity for ${product.name}`,
      });
    }

    if (sizeStock <= 0) {
      return res.status(400).json({
        message: `${product.name} size ${selectedSize} is out of stock`,
      });
    }

    if (requestedQty > sizeStock) {
      return res.status(400).json({
        message: `Only ${sizeStock} pieces available for ${product.name} size ${selectedSize}`,
      });
    }
  }

  for (const item of items) {
    productController.reduceProductSizeStock(
      Number(item.id),
      String(item.selectedSize),
      Number(item.cartQuantity)
    );
  }

  const newOrder = {
    id: Date.now(),
    orderNumber: `HS-${Date.now()}`,
    customer,
    items,
    totalPrice: Number(totalPrice),
    paymentMethod: paymentMethod || "Cash / Paymob later",
    paymentStatus: "pending",
    orderStatus: "new",
    createdAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);

  res.status(201).json({
    message: "Order created successfully",
    order: newOrder,
  });
};

const getOrders = (req, res) => {
  res.json(orders);
};

const updateOrderStatus = (req, res) => {
  const { status } = req.body;

  const order = orders.find((item) => item.id === Number(req.params.id));

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  order.orderStatus = status;

  res.json({
    message: "Order status updated",
    order,
  });
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
};