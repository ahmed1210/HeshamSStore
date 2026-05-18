"use client";

import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";

const getApiBaseUrl = () => {
  return String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
};

const getProductImage = (product) => {
  const rawImage =
    product?.image ||
    product?.imageUrl ||
    product?.photo ||
    product?.thumbnail ||
    product?.images?.[0] ||
    "";

  if (!rawImage) return "";

  // Old local backend upload URLs
  if (rawImage.startsWith("http://localhost:5000")) {
    return rawImage.replace("http://localhost:5000", getApiBaseUrl());
  }

  if (rawImage.startsWith("https://localhost:5000")) {
    return rawImage.replace("https://localhost:5000", getApiBaseUrl());
  }

  // Old relative backend upload paths
  if (rawImage.startsWith("/uploads")) {
    return `${getApiBaseUrl()}${rawImage}`;
  }

  if (rawImage.startsWith("uploads")) {
    return `${getApiBaseUrl()}/${rawImage}`;
  }

  // New Supabase Storage public URLs
  return rawImage;
};

const getTotalStock = (product) => {
  if (product?.sizeStock && typeof product.sizeStock === "object") {
    return Object.values(product.sizeStock).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );
  }

  if (product?.size_stock && typeof product.size_stock === "object") {
    return Object.values(product.size_stock).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );
  }

  return Number(product?.quantity || product?.stock || 0);
};

export default function ProductCard({ product }) {
  const imageUrl = getProductImage(product);
  const stock = getTotalStock(product);
  const isOutOfStock = stock <= 0;

  const oldPrice = Number(product?.oldPrice || product?.old_price || 0);
  const price = Number(product?.price || 0);

  const tags = Array.isArray(product?.tags)
    ? product.tags
    : String(product?.tags || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-yellow-400/25 bg-black/50 shadow-2xl shadow-yellow-400/10 backdrop-blur-xl transition hover:-translate-y-1 hover:border-yellow-400/60">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative h-72 overflow-hidden bg-black">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name || "Product"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-500">
              No Image
            </div>
          )}

          {tags.length > 0 && (
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black uppercase text-black"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <span className="rounded-full border border-red-500 bg-red-500/20 px-5 py-2 text-sm font-black uppercase text-red-400">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-400">
              {product.brand || "Hesham Store"}
            </p>

            <div className="flex items-center gap-1 text-yellow-400">
              <Star size={15} fill="currentColor" />
              <span className="text-xs font-black">
                {Number(product.rating || 5)}
              </span>
            </div>
          </div>

          <h3 className="line-clamp-2 text-xl font-black text-white">
            {product.name || "Unnamed Product"}
          </h3>

          <p className="mt-2 text-sm font-bold capitalize text-zinc-400">
            {product.category || "shoes"}
          </p>

          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-black text-yellow-400">
                {price} EGP
              </p>

              {oldPrice > price && (
                <p className="text-sm font-bold text-zinc-500 line-through">
                  {oldPrice} EGP
                </p>
              )}
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                isOutOfStock
                  ? "bg-red-500/15 text-red-400"
                  : "bg-green-500/15 text-green-400"
              }`}
            >
              {isOutOfStock ? "Out" : "In Stock"}
            </span>
          </div>
        </div>
      </Link>

      <div className="px-5 pb-5">
        <Link
          href={`/products/${product.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:bg-yellow-300"
        >
          <ShoppingCart size={17} />
          View Product
        </Link>
      </div>
    </article>
  );
}