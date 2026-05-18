const supabase = require("../config/supabase");
const productController = require("./productController");

let telegramUtils = null;

try {
  telegramUtils = require("../utils/telegram");
} catch {
  telegramUtils = null;
}

const sendTelegramIfAvailable = async (order) => {
  try {
    if (
      telegramUtils &&
      typeof telegramUtils.sendTelegramMessage === "function" &&
      typeof telegramUtils.formatOrderTelegramMessage === "function"
    ) {
      const telegramMessage = telegramUtils.formatOrderTelegramMessage(order);
      await telegramUtils.sendTelegramMessage(telegramMessage);
    }
  } catch (error) {
    console.error("Telegram notification failed:", error.message);
  }
};

const mapOrderFromDb = (order) => {
  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.order_number || order.id,

    customer: {
      fullName: order.customer_name || "",
      name: order.customer_name || "",
      email: order.customer_email || "",
      phone: order.customer_phone || "",
      address: order.customer_address || "",
    },

    customerName: order.customer_name || "",
    customerEmail: order.customer_email || "",
    customerPhone: order.customer_phone || "",
    customerAddress: order.customer_address || "",

    city: order.city || "",
    deliveryPlace: order.delivery_place || "",
    deliveryPrice: Number(order.delivery_price || 0),

    items: Array.isArray(order.items) ? order.items : [],

    subtotal: Number(order.subtotal || 0),
    total: Number(order.total || 0),
    totalPrice: Number(order.total || 0),

    paymentMethod: order.payment_method || "cash",
    paymentStatus: order.payment_status || "pending",

    status: order.status || "pending",
    orderStatus: order.status || "pending",

    notes: order.notes || "",
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
};

const getCustomerValue = (customer, keys) => {
  for (const key of keys) {
    if (customer?.[key] !== undefined && customer?.[key] !== null) {
      return customer[key];
    }
  }

  return "";
};

const normalizeOrderPayload = (body) => {
  const customer = body.customer || {};

  const customerName =
    body.customerName ||
    body.fullName ||
    body.name ||
    getCustomerValue(customer, ["fullName", "name", "customerName"]);

  const customerEmail =
    body.customerEmail ||
    body.email ||
    getCustomerValue(customer, ["email", "customerEmail"]);

  const customerPhone =
    body.customerPhone ||
    body.phone ||
    getCustomerValue(customer, [
      "phone",
      "mobile",
      "customerPhone",
      "phoneNumber",
    ]);

  const customerAddress =
    body.customerAddress ||
    body.address ||
    getCustomerValue(customer, ["address", "customerAddress", "street"]);

  const city =
    body.city ||
    body.area ||
    body.deliveryPlace ||
    getCustomerValue(customer, ["city", "area", "deliveryPlace"]);

  const deliveryPlace =
    body.deliveryPlace ||
    body.delivery_place ||
    getCustomerValue(customer, ["deliveryPlace", "area", "city"]);

  const deliveryPrice = Number(
    body.deliveryPrice || body.delivery_price || body.shipping || 0
  );

  const subtotal = Number(body.subtotal || body.subTotal || 0);
  const total = Number(body.total || body.totalPrice || body.grandTotal || 0);

  return {
    order_number: `HS-${Date.now()}`,
    customer_name: String(customerName || "").trim(),
    customer_email: String(customerEmail || "").trim(),
    customer_phone: String(customerPhone || "").trim(),
    customer_address: String(customerAddress || "").trim(),
    city: String(city || "").trim(),
    delivery_place: String(deliveryPlace || "").trim(),
    delivery_price: deliveryPrice,
    items: Array.isArray(body.items) ? body.items : [],
    subtotal: subtotal || total,
    total,
    payment_method: body.paymentMethod || body.paymentType || "cash",
    payment_status: body.paymentStatus || "pending",
    status: body.status || body.orderStatus || "pending",
    notes: body.notes || customer.notes || "",
    updated_at: new Date().toISOString(),
  };
};

const getItemProductId = (item) => {
  return item.productId || item.product_id || item.id || item._id;
};

const getItemSelectedSize = (item) => {
  return item.selectedSize || item.selected_size || item.size;
};

const getItemQuantity = (item) => {
  return Number(item.cartQuantity || item.quantity || item.qty || 0);
};

const createOrder = async (req, res) => {
  try {
    console.log("ORDER BODY:", JSON.stringify(req.body, null, 2));

    const payload = normalizeOrderPayload(req.body);
    const items = payload.items;

    console.log("NORMALIZED ORDER PAYLOAD:", JSON.stringify(payload, null, 2));

    if (!payload.customer_name) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    if (!payload.customer_phone) {
      return res.status(400).json({ message: "Customer phone is required" });
    }

    if (!items.length) {
      return res.status(400).json({ message: "Order items are required" });
    }

    if (!payload.total || payload.total <= 0) {
      return res.status(400).json({ message: "Total price is required" });
    }

    for (const item of items) {
      const productId = getItemProductId(item);
      const selectedSize = String(getItemSelectedSize(item) || "");
      const requestedQty = getItemQuantity(item);

      if (!productId) {
        return res.status(400).json({
          message: `Product ID is required for ${item.name || "product"}`,
        });
      }

      if (!selectedSize) {
        return res.status(400).json({
          message: `Please choose a size for ${item.name || "product"}`,
        });
      }

      if (!Number.isInteger(requestedQty) || requestedQty <= 0) {
        return res.status(400).json({
          message: `Invalid quantity for ${item.name || "product"}`,
        });
      }

      const checkResult = await productController.checkProductSizeStock(
        productId,
        selectedSize,
        requestedQty
      );

      if (!checkResult || !checkResult.ok) {
        return res.status(checkResult?.status || 400).json({
          message:
            checkResult?.message ||
            `Stock check failed for ${item.name || "product"} size ${selectedSize}`,
        });
      }
    }

    for (const item of items) {
      const productId = getItemProductId(item);
      const selectedSize = String(getItemSelectedSize(item) || "");
      const requestedQty = getItemQuantity(item);

      const reduceResult = await productController.reduceProductSizeStock(
        productId,
        selectedSize,
        requestedQty
      );

      if (!reduceResult || !reduceResult.ok) {
        return res.status(reduceResult?.status || 400).json({
          message:
            reduceResult?.message ||
            `Stock update failed for ${item.name || "product"} size ${selectedSize}`,
        });
      }
    }

    const { data, error } = await supabase
      .from("orders")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase insert order error:", error);

      return res.status(500).json({
        message: "Failed to create order",
        error: error.message,
      });
    }

    const mappedOrder = mapOrderFromDb(data);

    await sendTelegramIfAvailable(mappedOrder);

    return res.status(201).json({
      message: "Order created successfully",
      order: mappedOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const orders = Array.isArray(data) ? data.map(mapOrderFromDb) : [];

    return res.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      message: "Failed to load orders",
      error: error.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Order not found" });
    }

    const mappedOrder = mapOrderFromDb(data);

    return res.json({
      message: "Order status updated",
      order: mappedOrder,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
};