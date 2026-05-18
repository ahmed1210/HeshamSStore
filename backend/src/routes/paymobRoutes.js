const express = require("express");
const axios = require("axios");

const router = express.Router();

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;

const PAYMOB_BASE_URL = "https://accept.paymob.com/api";

function validatePaymobConfig() {
  if (!PAYMOB_API_KEY || PAYMOB_API_KEY === "your_paymob_api_key") {
    return "Paymob API key is missing";
  }

  if (!PAYMOB_INTEGRATION_ID || PAYMOB_INTEGRATION_ID === "your_paymob_integration_id") {
    return "Paymob integration ID is missing";
  }

  if (!PAYMOB_IFRAME_ID || PAYMOB_IFRAME_ID === "your_paymob_iframe_id") {
    return "Paymob iframe ID is missing";
  }

  return null;
}

function getOrderData(body) {
  const customer = body.customer || {};

  const totalPrice = Number(body.totalPrice || body.total || body.amount || 0);

  const items = body.items || body.products || body.cart || [];

  return {
    customer,
    totalPrice,
    items,
  };
}

router.post("/create-payment", async (req, res) => {
  try {
    const configError = validatePaymobConfig();

    if (configError) {
      return res.status(400).json({
        message: configError,
      });
    }

    const { customer, totalPrice, items } = getOrderData(req.body);

    if (!customer || !customer.email || !customer.phone || !customer.address) {
      return res.status(400).json({
        message: "Customer email, phone, and address are required for payment",
      });
    }

    if (!Array.isArray(items) || items.length === 0 || !totalPrice) {
      return res.status(400).json({
        message: "Items and total price are required for payment",
      });
    }

    const amountCents = Math.round(Number(totalPrice) * 100);

    const authResponse = await axios.post(`${PAYMOB_BASE_URL}/auth/tokens`, {
      api_key: PAYMOB_API_KEY,
    });

    const authToken = authResponse.data.token;

    const orderResponse = await axios.post(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: "EGP",
      items: [],
    });

    const paymobOrderId = orderResponse.data.id;

    const paymentKeyResponse = await axios.post(
      `${PAYMOB_BASE_URL}/acceptance/payment_keys`,
      {
        auth_token: authToken,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: paymobOrderId,
        billing_data: {
          apartment: "NA",
          email: customer.email,
          floor: "NA",
          first_name: customer.fullName || customer.name || "Customer",
          street: customer.address || "NA",
          building: "NA",
          phone_number: customer.phone,
          shipping_method: "NA",
          postal_code: "NA",
          city: customer.city || "NA",
          country: "EG",
          last_name: "Customer",
          state: customer.city || "NA",
        },
        currency: "EGP",
        integration_id: Number(PAYMOB_INTEGRATION_ID),
      }
    );

    const paymentToken = paymentKeyResponse.data.token;

    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;

    res.json({
      message: "Payment created successfully",
      paymentUrl,
      paymobOrderId,
    });
  } catch (error) {
    console.error("Paymob error:", error.response?.data || error.message);

    res.status(500).json({
      message: "Failed to create Paymob payment",
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;