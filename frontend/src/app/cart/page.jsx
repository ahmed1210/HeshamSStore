"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import { getCart, saveCart } from "@/utils/cartStorage";

export default function CartPage() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    loadCart();

    const update = () => {
      loadCart();
    };

    window.addEventListener("cartUpdated", update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener("cartUpdated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const loadCart = () => {
    setCart(getCart());
  };

  const saveAndUpdateCart = (updatedCart) => {
    saveCart(updatedCart);
    setCart(updatedCart);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const updateCartItemQuantity = (productId, selectedSize, quantity) => {
    const safeQuantity = Number(quantity || 1);

    if (!Number.isInteger(safeQuantity) || safeQuantity <= 0) {
      return cart;
    }

    const updatedCart = cart.map((item) => {
      const sameProduct =
        String(item.productId || item.id) === String(productId);

      const sameSize =
        String(item.selectedSize || item.size || "Default") ===
        String(selectedSize || "Default");

      if (!sameProduct || !sameSize) return item;

      const maxStock = Number(item.maxStock || item.stock || 999);
      const newQuantity = Math.min(safeQuantity, maxStock);

      return {
        ...item,
        quantity: newQuantity,
        cartQuantity: newQuantity,
      };
    });

    saveAndUpdateCart(updatedCart);
    return updatedCart;
  };

  const removeCartItem = (productId, selectedSize) => {
    const updatedCart = cart.filter((item) => {
      const sameProduct =
        String(item.productId || item.id) === String(productId);

      const sameSize =
        String(item.selectedSize || item.size || "Default") ===
        String(selectedSize || "Default");

      return !(sameProduct && sameSize);
    });

    saveAndUpdateCart(updatedCart);
    return updatedCart;
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.quantity || 1);
    }, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => {
      return sum + Number(item.quantity || 1);
    }, 0);
  }, [cart]);

  const increaseQuantity = (item) => {
    const currentQuantity = Number(item.quantity || 1);
    const maxStock = Number(item.maxStock || item.stock || 999);

    if (currentQuantity >= maxStock) {
      alert("No more stock available for this item.");
      return;
    }

    updateCartItemQuantity(
      item.productId || item.id,
      item.selectedSize || item.size || "Default",
      currentQuantity + 1
    );
  };

  const decreaseQuantity = (item) => {
    const currentQuantity = Number(item.quantity || 1);

    if (currentQuantity <= 1) return;

    updateCartItemQuantity(
      item.productId || item.id,
      item.selectedSize || item.size || "Default",
      currentQuantity - 1
    );
  };

  const deleteItem = (item) => {
    removeCartItem(
      item.productId || item.id,
      item.selectedSize || item.size || "Default"
    );
  };

  const clearCart = () => {
    const confirmClear = window.confirm("Remove all items from cart?");
    if (!confirmClear) return;

    saveAndUpdateCart([]);
  };

  return (
    <main className="min-h-screen bg-[var(--page-bg)] py-20 text-[var(--text-main)]">
      <div className="container">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Link
              href="/products"
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/35 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
            >
              <ArrowLeft size={17} />
              Continue Shopping
            </Link>

            <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
              Shopping Cart
            </p>

            <h1 className="theme-text mt-3 text-4xl font-black uppercase leading-none md:text-6xl">
              Your Cart
            </h1>

            <p className="theme-muted mt-3">
              Review your items before checkout. You can update quantity or
              remove products.
            </p>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="w-fit rounded-full border border-red-500/40 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-red-400 transition hover:bg-red-500 hover:text-white"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <section className="mx-auto max-w-2xl rounded-[2.5rem] border border-yellow-400/25 bg-black/40 p-8 text-center shadow-2xl shadow-yellow-400/10 backdrop-blur-xl light:bg-white">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-yellow-400/15 text-yellow-400">
              <ShoppingCart size={52} strokeWidth={2.5} />
            </div>

            <h2 className="mt-6 text-3xl font-black uppercase text-white light:text-zinc-950">
              Cart is Empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-zinc-400 light:text-zinc-600">
              Add your favorite sneakers to cart and come back here to checkout.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-yellow-400 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-yellow-300"
            >
              <ShoppingBag size={18} />
              Shop Products
            </Link>
          </section>
        ) : (
          <section className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              {cart.map((item, index) => {
                const image =
                  item.image ||
                  item.imageUrl ||
                  item.photo ||
                  item.thumbnail ||
                  "";

                const itemName = item.name || item.productName || "Product";
                const quantity = Number(item.quantity || 1);
                const price = Number(item.price || 0);
                const maxStock = Number(item.maxStock || item.stock || 999);
                const isMax = quantity >= maxStock;

                return (
                  <article
                    key={`${item.productId || item.id}-${
                      item.selectedSize || item.size || "Default"
                    }-${index}`}
                    className="cart-item rounded-[2rem] border border-yellow-400/20 bg-black/50 p-4 shadow-xl shadow-black/20 backdrop-blur-xl light:bg-white"
                  >
                    <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
                      <div className="overflow-hidden rounded-[1.5rem] bg-zinc-950 light:bg-zinc-100">
                        {image ? (
                          <img
                            src={image}
                            alt={itemName}
                            className="h-36 w-full object-cover sm:h-full"
                          />
                        ) : (
                          <div className="flex h-36 items-center justify-center text-sm font-bold text-zinc-500">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between gap-4">
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-yellow-400">
                              {item.brand || "Hesham Store"}
                            </p>

                            <h2 className="mt-1 text-xl font-black uppercase leading-tight text-white light:text-zinc-950">
                              {itemName}
                            </h2>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full border border-yellow-400/30 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-400">
                                Size: {item.selectedSize || item.size || "-"}
                              </span>

                              {item.category && (
                                <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-zinc-400 light:border-zinc-200 light:text-zinc-600">
                                  {item.category}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => deleteItem(item)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/40 text-red-400 transition hover:bg-red-500 hover:text-white"
                            aria-label="Remove item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                              Price
                            </p>

                            <p className="mt-1 text-xl font-black text-yellow-400">
                              {price} EGP
                            </p>
                          </div>

                          <div>
                            <p className="mb-2 text-xs font-black uppercase tracking-wide text-zinc-500 md:text-right">
                              Quantity
                            </p>

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => decreaseQuantity(item)}
                                disabled={quantity <= 1}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-yellow-400 hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-30 light:border-zinc-300 light:text-zinc-950"
                              >
                                <Minus size={16} />
                              </button>

                              <span className="min-w-8 text-center text-lg font-black text-yellow-400">
                                {quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() => increaseQuantity(item)}
                                disabled={isMax}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-yellow-400 hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-30 light:border-zinc-300 light:text-zinc-950"
                              >
                                <Plus size={16} />
                              </button>
                            </div>

                            {isMax && maxStock < 999 && (
                              <p className="mt-2 text-xs font-bold text-orange-400">
                                Max available reached
                              </p>
                            )}
                          </div>

                          <div className="md:text-right">
                            <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                              Total
                            </p>

                            <p className="mt-1 text-2xl font-black text-yellow-400">
                              {price * quantity} EGP
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="h-fit rounded-[2.5rem] border border-yellow-400/25 bg-black/60 p-6 shadow-2xl shadow-yellow-400/10 backdrop-blur-xl light:bg-white">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
                Order Summary
              </p>

              <h2 className="mt-3 text-3xl font-black uppercase text-white light:text-zinc-950">
                Summary
              </h2>

              <div className="mt-6 space-y-4 border-y border-yellow-400/20 py-5">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-400 light:text-zinc-600">
                    Items
                  </span>
                  <strong className="text-white light:text-zinc-950">
                    {totalItems}
                  </strong>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-400 light:text-zinc-600">
                    Subtotal
                  </span>
                  <strong className="text-white light:text-zinc-950">
                    {subtotal} EGP
                  </strong>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-400 light:text-zinc-600">
                    Delivery
                  </span>
                  <strong className="text-zinc-400 light:text-zinc-600">
                    Calculated at checkout
                  </strong>
                </div>
              </div>

              <div className="mt-5 flex justify-between gap-4">
                <span className="text-lg font-black text-white light:text-zinc-950">
                  Total Now
                </span>

                <strong className="text-2xl font-black text-yellow-400">
                  {subtotal} EGP
                </strong>
              </div>

              <Link
                href="/checkout"
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-black shadow-xl shadow-yellow-400/20 transition hover:bg-yellow-300"
              >
                Checkout
              </Link>

              <Link
                href="/products"
                className="mt-3 flex w-full items-center justify-center rounded-full border border-yellow-400/35 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
              >
                Continue Shopping
              </Link>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}