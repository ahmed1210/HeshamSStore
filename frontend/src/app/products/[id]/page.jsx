"use client";
import { apiUrl } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { addItemToCart, getCart } from "@/utils/cartStorage";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();


  const buttonRef = useRef(null);
  const imageRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartVersion, setCartVersion] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [message, setMessage] = useState("");

  const productId = params?.id;

  useEffect(() => {
    loadProduct();
  }, [productId]);

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

  const loadProduct = async () => {
    try {
      setLoading(true);

     const res = await fetch(apiUrl(`/api/products/${productId}`));
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Product not found");
      }

      setProduct(data);
    } catch (error) {
      console.error("Product details error:", error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

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
          String(item.id || item.productId) === String(product?.id) &&
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
  }, [sizes, product?.id, cartVersion]);

  const totalRemainingStock = availableSizes.reduce(
    (sum, item) => sum + Number(item.remainingStock || 0),
    0
  );

  const isOutOfStock = totalRemainingStock <= 0;
  const isLowStock = totalRemainingStock > 0 && totalRemainingStock <= 3;

  useEffect(() => {
    if (!product) return;

    if (selectedSize) {
      const current = availableSizes.find(
        (item) => String(item.size) === String(selectedSize)
      );

      if (current && current.remainingStock > 0) {
        if (quantity > current.remainingStock) {
          setQuantity(current.remainingStock);
        }

        return;
      }
    }

    const firstAvailable = availableSizes.find(
      (item) => item.remainingStock > 0
    );

    setSelectedSize(firstAvailable?.size || "");
    setQuantity(1);
  }, [availableSizes, selectedSize, quantity, product]);

  const selectedSizeData = availableSizes.find(
    (item) => String(item.size) === String(selectedSize)
  );

  const selectedStock = Number(selectedSizeData?.remainingStock || 0);
  const selectedLowStock = selectedStock > 0 && selectedStock <= 3;

  const canAddToCart =
    product &&
    selectedSize &&
    selectedStock > 0 &&
    quantity > 0 &&
    quantity <= selectedStock &&
    !isOutOfStock;

  const incrementQuantity = () => {
    if (quantity < selectedStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
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
    setMessage("");

    if (isOutOfStock) {
      setMessage("This product is out of stock.");
      return;
    }

    if (!selectedSize) {
      setMessage("Please choose a size.");
      return;
    }

    if (selectedStock <= 0) {
      setMessage("This size is out of stock.");
      return;
    }

    if (quantity > selectedStock) {
      setMessage(`Only ${selectedStock} left for this size.`);
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
      quantity: Number(quantity || 1),
      stock: selectedStock,
      maxStock: selectedStock,
    };

    addItemToCart(cartItem);

    setAdded(true);
    setMessage("Added to cart.");
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--page-bg)] py-20">
        <div className="container">
          <div className="glass-panel rounded-[2rem] p-10 text-center theme-text">
            Loading product...
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[var(--page-bg)] py-20">
        <div className="container">
          <div className="glass-panel rounded-[2rem] p-10 text-center">
            <h1 className="theme-text text-3xl font-black">
              Product not found
            </h1>

            <button
              type="button"
              onClick={() => router.push("/products")}
              className="mt-6 rounded-full bg-yellow-400 px-6 py-3 font-black text-black"
            >
              Back to Products
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] py-20">
      <div className="container">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 px-5 py-3 font-black text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <section className="grid gap-8 lg:grid-cols-2">
          <div
            ref={imageRef}
            className="relative overflow-hidden rounded-[2.5rem] border border-yellow-400/20 bg-black shadow-2xl shadow-black/30"
          >
            {image ? (
              <img
                src={image}
                alt={productName}
                className={`h-[420px] w-full object-cover md:h-[620px] ${
                  isOutOfStock ? "grayscale" : ""
                }`}
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center text-zinc-500 md:h-[620px]">
                No Image
              </div>
            )}

            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              {isOutOfStock ? (
                <span className="rounded-full bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="rounded-full border border-red-500/50 bg-red-500/20 px-4 py-2 text-xs font-black uppercase tracking-wide text-red-200">
                  Limited Stock
                </span>
              ) : (
                <span className="rounded-full border border-green-500/40 bg-green-500/15 px-4 py-2 text-xs font-black uppercase tracking-wide text-green-300">
                  In Stock
                </span>
              )}

              {discount > 0 && !isOutOfStock && (
                <span className="rounded-full bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white">
                  -{discount}%
                </span>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2.5rem] p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-yellow-400">
              {productBrand}
            </p>

            <h1 className="theme-text mt-3 text-4xl font-black uppercase leading-none md:text-6xl">
              {productName}
            </h1>

            {productCategory && (
              <p className="theme-muted mt-4 text-sm font-black uppercase tracking-[0.2em]">
                {productCategory}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <strong className="text-3xl font-black text-yellow-400">
                {price} EGP
              </strong>

              {oldPrice > price && (
                <span className="text-lg font-bold text-zinc-500 line-through">
                  {oldPrice} EGP
                </span>
              )}
            </div>

            {product.description && (
              <p className="theme-muted mt-6 max-w-xl text-base leading-8">
                {product.description}
              </p>
            )}

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="theme-text text-sm font-black uppercase tracking-[0.2em]">
                  Choose Size
                </h2>

                {selectedLowStock && !isOutOfStock && (
                  <span className="text-xs font-black uppercase tracking-wide text-orange-400">
                    Only {selectedStock} left
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {availableSizes.length > 0 ? (
                  availableSizes.map((item) => {
                    const isSelected =
                      String(selectedSize) === String(item.size);
                    const disabled = item.remainingStock <= 0;

                    return (
                      <button
                        key={item.size}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setSelectedSize(item.size);
                          setQuantity(1);
                        }}
                        className={`relative flex h-11 min-w-11 items-center justify-center rounded-full border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-30 ${
                          isSelected
                            ? "border-yellow-400 bg-yellow-400 text-black"
                            : "border-white/15 text-[var(--text-main)] hover:border-yellow-400 hover:text-yellow-400"
                        }`}
                      >
                        {item.size === "Default" ? "One Size" : item.size}

                        {item.remainingStock > 0 &&
                          item.remainingStock <= 3 && (
                            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                          )}
                      </button>
                    );
                  })
                ) : (
                  <span className="theme-muted text-sm font-bold">
                    No sizes available
                  </span>
                )}
              </div>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="theme-muted text-xs font-black uppercase tracking-wide">
                    Quantity
                  </p>

                  {isOutOfStock ? (
                    <p className="mt-1 text-xs font-bold text-red-400">
                      Out of stock
                    </p>
                  ) : selectedLowStock ? (
                    <p className="mt-1 text-xs font-bold text-orange-400">
                      Only {selectedStock} left
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 font-black text-[var(--text-main)] transition hover:border-yellow-400 hover:text-yellow-400 disabled:opacity-30"
                  >
                    -
                  </button>

                  <span className="min-w-8 text-center text-lg font-black text-yellow-400">
                    {isOutOfStock ? 0 : quantity}
                  </span>

                  <button
                    type="button"
                    onClick={incrementQuantity}
                    disabled={quantity >= selectedStock || isOutOfStock}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 font-black text-[var(--text-main)] transition hover:border-yellow-400 hover:text-yellow-400 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {message && (
              <div className="mt-5 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm font-bold text-yellow-400">
                {message}
              </div>
            )}

            <button
              ref={buttonRef}
              type="button"
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-black uppercase tracking-[0.14em] shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                canAddToCart
                  ? "bg-yellow-400 text-black shadow-yellow-400/20 hover:bg-yellow-300"
                  : "bg-zinc-800 text-zinc-400 shadow-black/20"
              }`}
            >
              <ShoppingCart size={18} strokeWidth={3} />
              {isOutOfStock
                ? "Out of Stock"
                : added
                ? "Added"
                : "Add to Cart"}
            </button>

            <Link
              href="/products"
              className="mt-4 flex w-full items-center justify-center rounded-full border border-yellow-400/35 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
            >
              Continue Shopping
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}