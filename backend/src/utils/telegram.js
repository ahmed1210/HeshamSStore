const axios = require("axios");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramMessage(message) {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.log("Telegram settings missing. Message not sent.");
      return;
    }

    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }
    );
  } catch (error) {
    console.error("Telegram message error:", error.response?.data || error.message);
  }
}

function formatOrderTelegramMessage(order) {
  const customer = order.customer || {};
  const items = order.items || [];

  const itemsText = items
    .map((item, index) => {
      return `${index + 1}. ${item.name || item.productName || "Product"}
   Size: ${item.size || item.selectedSize || "-"}
   Qty: ${item.quantity || 1}
   Price: ${item.price || 0} EGP`;
    })
    .join("\n\n");

  return `
✅ New Order - Hesham Store

🧾 Order Number: ${order.orderNumber || order.id}

👤 Customer: ${customer.fullName || customer.name || "-"}
📞 Phone: ${customer.phone || "-"}
📧 Email: ${customer.email || "-"}
🏙 City: ${customer.city || "-"}
📍 Address: ${customer.address || "-"}
📝 Notes: ${customer.notes || "-"}

🚚 Delivery: ${order.deliveryPlace || customer.city || "-"}
💳 Payment: ${order.paymentMethod || "cash"}
📌 Status: ${order.status || "pending"}

🛍 Items:
${itemsText || "-"}

Subtotal: ${order.subtotal || 0} EGP
Shipping: ${order.shipping || 0} EGP
💰 Total: ${order.totalPrice || order.total || 0} EGP

⏰ Date: ${new Date(order.createdAt || Date.now()).toLocaleString()}
`;
}

module.exports = {
  sendTelegramMessage,
  formatOrderTelegramMessage,
};