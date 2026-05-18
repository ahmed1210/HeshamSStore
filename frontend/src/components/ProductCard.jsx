"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, ShoppingCart } from "lucide-react";
import { addItemToCart, getCart } from "@/utils/cartStorage";

export default function ProductCard({ product, addToCart }) {
  const buttonRef = useRef(null);
  const imageRef = useRef(null);

  const [cartVersion, setCartVersion] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const update = () => {
      setCartVersion((prev) => prev + 1);
    };

    window.addEventListener("cartUpdated", update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener("cartUpdated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const productId = product?.id;

  const image =
    product?.image ||
    product?.imageUrl ||
    product?.photo ||
    product?.thumbnail ||
    product?.images?.[0] ||
    "";

  const productName = product?.name || product?.title || "Product";
  const productBrand = product?.brand || product?.brandName || "Hesham Store";
  const productCategory = product?.category || product?.categoryName || "";

  const price = Number(product?.price || 0);
  const oldPrice = Number(product?.oldPrice || product?.old_price || 0);
  const totalProductStock = Number(product?.stock || product?.quantity || 0);

  const discount =
    oldPrice > price && oldPrice > 0
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : 0;

  const sizes = useMemo(() => {
    const sizeStockSource = product?.sizeStock || product?.stockBySize;

    if (sizeStockSource && typeof sizeStockSource === "object") {
      return Object.keys(sizeStockSource).map((size) => ({
        size,
        stock: Number(sizeStockSource[size] || 0),
      }));
    }

    if (Array.isArray(product?.sizes) && product.sizes.length > 0) {
      return product.sizes.map((size) => ({
        size,
        stock: totalProductStock,
      }));
    }

    if (totalProductStock > 0) {
      return [
        {
          size: "Default",
          stock: totalProductStock,
        },
      ];
    }

    return [];
  }, [product, totalProductStock]);

  const getCartQuantityForSize = (size) => {
    const cart = getCart();

    return cart
      .filter(
        (item) =>
          String(item.id || item.productId) === String(productId) &&
          String(item.selectedSize || item.size) === String(size)
      )
      .reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  };

  const availableSizes = useMemo(() => {
    return sizes.map((item) => {
      const cartQty = getCartQuantityForSize(item.size);
      const remainingStock = Math.max(0, Number(item.stock || 0) - cartQty);

      return {
        ...item,
        remainingStock,
      };
    });
  }, [sizes, productId, cartVersion]);

  const totalRemainingStock = availableSizes.reduce(
    (sum, item) => sum + Number(item.remainingStock || 0),
    0
  );

  const isOutOfStock = totalRemainingStock <= 0;
  const isLowStock = totalRemainingStock > 0 && totalRemainingStock <= 3;

  useEffect(() => {
    if (selectedSize) {
      const current = availableSizes.find(
        (item) => String(item.size) === String(selectedSize)
      );

      if (current && current.remainingStock > 0) return;
    }

    const firstAvailable = availableSizes.find(
      (item) => item.remainingStock > 0
    );

    setSelectedSize(firstAvailable?.size || "");
  }, [availableSizes, selectedSize]);

  const selectedSizeData = availableSizes.find(
    (item) => String(item.size) === String(selectedSize)
  );

  const selectedStock = Number(selectedSizeData?.remainingStock || 0);

  const selectedLowStock = selectedStock > 0 && selectedStock <= 3;

  const canAddToCart =
    product && selectedSize && selectedStock > 0 && !isOutOfStock;

  const mainBadge = () => {
    if (isOutOfStock) return "Out of Stock";

    const tags = product?.tags || [];
    const tagText = String(product?.tag || tags[0] || "").toLowerCase();

    if (discount > 0 || tagText.includes("sale")) return "Sale";
    if (tagText.includes("new")) return "New";
    if (tagText.includes("best")) return "Best Seller";
    if (tagText.includes("trend")) return "Trending";

    return "";
  };

  const runFlyToCartAnimation = () => {
    if (typeof window === "undefined") return;

    const startElement = imageRef.current || buttonRef.current;
    const cartElement =
      document.querySelector("[data-cart-icon]") ||
      document.querySelector('a[href="/checkout"]');

    if (!startElement || !cartElement) return;

    const startRect = startElement.getBoundingClientRect();
    const cartRect = cartElement.getBoundingClientRect();

    const flyingItem = document.createElement("div");
    flyingItem.className = "fly-to-cart-item";

    flyingItem.style.left = `${startRect.left + startRect.width / 2}px`;
    flyingItem.style.top = `${startRect.top + startRect.height / 2}px`;

    if (image) {
      flyingItem.innerHTML = `<img src="${image}" alt="" />`;
    } else {
      flyingItem.innerHTML = "🛒";
    }

    document.body.appendChild(flyingItem);

    const endX =
      cartRect.left +
      cartRect.width / 2 -
      (startRect.left + startRect.width / 2);

    const endY =
      cartRect.top +
      cartRect.height / 2 -
      (startRect.top + startRect.height / 2);

    flyingItem.animate(
      [
        {
          transform: "translate(0, 0) scale(1)",
          opacity: 1,
        },
        {
          transform: `translate(${endX * 0.45}px, ${endY - 80}px) scale(0.75)`,
          opacity: 0.9,
        },
        {
          transform: `translate(${endX}px, ${endY}px) scale(0.2)`,
          opacity: 0,
        },
      ],
      {
        duration: 850,
        easing: "cubic-bezier(0.22, 0.8, 0.2, 1)",
      }
    );

    setTimeout(() => {
      flyingItem.remove();
      cartElement.classList.add("cart-pop");

      setTimeout(() => {
        cartElement.classList.remove("cart-pop");
      }, 600);
    }, 850);
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      alert("This product is out of stock");
      return;
    }

    if (!selectedSize) {
      alert("Please choose a size");
      return;
    }

    if (selectedStock <= 0) {
      alert("This size is out of stock");
      return;
    }

    const cartItem = {
      id: product.id,
      productId: product.id,
      name: productName,
      productName,
      brand: productBrand,
      category: productCategory,
      price,
      oldPrice: oldPrice || "",
      image,
      selectedSize,
      size: selectedSize,
      quantity: 1,
      stock: selectedStock,
      maxStock: selectedStock,
    };

    addItemToCart(cartItem);

    if (typeof addToCart === "function") {
      addToCart(product, selectedSize, 1);
    }

    setAdded(true);
    runFlyToCartAnimation();

    if (buttonRef.current) {
      buttonRef.current.classList.add("cart-pop");

      setTimeout(() => {
        buttonRef.current?.classList.remove("cart-pop");
      }, 650);
    }

    window.dispatchEvent(new Event("cartUpdated"));
    setCartVersion((prev) => prev + 1);

    setTimeout(() => {
      setAdded(false);
    }, 1200);
  };

  const buttonText = () => {
    if (isOutOfStock) return "Out of Stock";
    if (!selectedSize) return "Choose Size";
    if (added) return "Added";
    return "Add to Cart";
  };

  const badge = mainBadge();

  return (
    <article className="product-card group overflow-hidden rounded-[1.6rem] border border-yellow-400/20 bg-black/70 shadow-xl shadow-black/25 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-yellow-400/60">
      <div
        ref={imageRef}
        className="relative h-[260px] overflow-hidden bg-zinc-950 sm:h-[300px]"
      >
        {image ? (
          <img
            src={image}
            alt={productName}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
              isOutOfStock ? "grayscale" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-black text-zinc-500">
            No Image
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {badge && (
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                isOutOfStock
                  ? "bg-red-600 text-white"
                  : "bg-yellow-400 text-black"
              }`}
            >
              {badge}
            </span>
          )}

          {discount > 0 && !isOutOfStock && (
            <span className="rounded-full bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              -{discount}%
            </span>
          )}
        </div>

        {isLowStock && !isOutOfStock && (
          <span className="absolute bottom-3 left-3 rounded-full border border-red-500/50 bg-red-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-red-200">
            Limited Stock
          </span>
        )}

        <Link
          href={`/products/${product?.id}`}
          className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full border border-white/25 bg-black/55 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white backdrop-blur-xl transition hover:border-yellow-400 hover:text-yellow-400"
        >
          <Eye size={13} strokeWidth={3} />
          Quick View
        </Link>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="brand-text text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">
                {productBrand}
              </p>

              <h3 className="product-title mt-1 line-clamp-2 text-base font-black uppercase leading-tight text-white sm:text-lg">
                {productName}
              </h3>
            </div>

            {productCategory && (
              <span className="category-badge shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-400">
                {productCategory}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <strong className="product-price text-lg font-black text-yellow-400 sm:text-xl">
              {price} EGP
            </strong>

            {oldPrice > price && (
              <span className="old-price ml-2 text-xs font-bold text-zinc-500 line-through sm:text-sm">
                {oldPrice} EGP
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="section-label text-[10px] font-black uppercase tracking-wide text-zinc-400">
              Size
            </p>

            {selectedLowStock && !isOutOfStock && (
              <p className="text-[10px] font-black uppercase tracking-wide text-orange-400">
                Only {selectedStock} left
              </p>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {availableSizes.length > 0 ? (
              availableSizes.map((item) => {
                const isSelected = String(selectedSize) === String(item.size);
                const disabled = item.remainingStock <= 0;

                return (
                  <button
                    key={item.size}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedSize(item.size)}
                    className={`size-btn relative flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full border px-2.5 text-[10px] font-black transition disabled:cursor-not-allowed disabled:opacity-30 ${
                      isSelected
                        ? "selected-size border-yellow-400 bg-yellow-400 text-black"
                        : "border-white/15 text-white hover:border-yellow-400 hover:text-yellow-400"
                    }`}
                  >
                    {item.size === "Default" ? "One" : item.size}

                    {item.remainingStock > 0 && item.remainingStock <= 3 && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })
            ) : (
              <span className="text-xs font-bold text-zinc-500">
                No sizes available
              </span>
            )}
          </div>
        </div>

        <button
          ref={buttonRef}
          type="button"
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className={`add-cart-btn flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-black uppercase tracking-[0.12em] shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:py-4 sm:text-sm ${
            canAddToCart
              ? "bg-yellow-400 text-black shadow-yellow-400/20 hover:bg-yellow-300"
              : "bg-zinc-800 text-zinc-400 shadow-black/20"
          }`}
        >
          <ShoppingCart size={17} strokeWidth={3} />
          {buttonText()}
        </button>
      </div>
    </article>
  );
}