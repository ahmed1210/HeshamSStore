"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle, Home, ShoppingBag, ReceiptText } from "lucide-react";

export default function CheckoutSuccessPage() {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem("lastOrder");

      if (savedOrder) {
        setOrder(JSON.parse(savedOrder));
      }
    } catch (error) {
      console.error("Failed to read last order:", error);
      setOrder(null);
    }
  }, []);

  const customer = order?.customer || {};
  const items = order?.items || order?.products || [];

  return (
    <main className="min-h-screen bg-[var(--page-bg)] py-20 text-[var(--text-main)]">
      <div className="container">
        <section className="mx-auto max-w-3xl rounded-[2.5rem] border border-yellow-400/30 bg-black/50 p-8 text-center shadow-2xl shadow-yellow-400/10 backdrop-blur-xl light:bg-white">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500/15 text-green-500">
            <CheckCircle size={58} strokeWidth={2.5} />
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
            Order Confirmed
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase text-white light:text-zinc-950 md:text-5xl">
            Thank You
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-zinc-300 light:text-zinc-600">
            Your order has been placed successfully. We will contact you soon to
            confirm the details.
          </p>

          {order ? (
            <div className="mt-8 rounded-[2rem] border border-yellow-400/20 bg-black/30 p-5 text-left light:bg-zinc-50">
              <div className="mb-5 flex items-center gap-2 text-yellow-400">
                <ReceiptText size={20} />
                <h2 className="font-black uppercase tracking-wide">
                  Order Summary
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                    Order Number
                  </p>
                  <p className="mt-1 font-black text-white light:text-zinc-950">
                    {order.orderNumber || order.id || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                    Payment Method
                  </p>
                  <p className="mt-1 font-black capitalize text-white light:text-zinc-950">
                    {order.paymentMethod || "cash"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                    Customer
                  </p>
                  <p className="mt-1 font-black text-white light:text-zinc-950">
                    {customer.fullName || customer.name || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                    Phone
                  </p>
                  <p className="mt-1 font-black text-white light:text-zinc-950">
                    {customer.phone || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                    Delivery
                  </p>
                  <p className="mt-1 font-black text-white light:text-zinc-950">
                    {order.deliveryPlace || customer.city || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                    Total
                  </p>
                  <p className="mt-1 text-xl font-black text-yellow-400">
                    {order.totalPrice || order.total || 0} EGP
                  </p>
                </div>
              </div>

              {items.length > 0 && (
                <div className="mt-6 border-t border-yellow-400/20 pt-5">
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-zinc-500">
                    Items
                  </p>

                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={`${item.id || index}-${index}`}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-yellow-400/15 bg-black/20 p-3 light:bg-white"
                      >
                        <div>
                          <p className="font-black text-white light:text-zinc-950">
                            {item.name || item.productName || "Product"}
                          </p>
                          <p className="text-sm text-zinc-400 light:text-zinc-600">
                            Size: {item.selectedSize || item.size || "-"} · Qty:{" "}
                            {item.quantity || item.cartQuantity || 1}
                          </p>
                        </div>

                        <p className="font-black text-yellow-400">
                          {Number(item.price || 0) *
                            Number(item.quantity || item.cartQuantity || 1)}{" "}
                          EGP
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5 text-yellow-400">
              Order completed successfully.
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-full bg-yellow-400 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-yellow-300"
            >
              <Home size={18} />
              Home
            </Link>

            <Link
              href="/products"
              className="flex items-center justify-center gap-2 rounded-full border border-yellow-400/40 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
            >
              <ShoppingBag size={18} />
              Continue Shopping
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}