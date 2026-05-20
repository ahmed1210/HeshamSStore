"use client";

import { apiUrl } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const getTags = (product) => {
  if (Array.isArray(product?.tags)) {
    return product.tags.join(" ").toLowerCase();
  }

  return String(product?.tags || product?.tag || product?.label || "").toLowerCase();
};

export default function OffersPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        const res = await fetch(apiUrl("/api/products"));
        const data = await res.json();

        setProducts(Array.isArray(data) ? data : []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const offerProducts = useMemo(() => {
    return products.filter((product) => {
      const oldPrice = Number(product.oldPrice || product.old_price || 0);
      const price = Number(product.price || 0);

      return (
        product.isActive !== false &&
        (getTags(product).includes("sale") || oldPrice > price)
      );
    });
  }, [products]);

  return (
    <main className="min-h-screen bg-transparent py-20 text-white">
      <div className="container">
        <section className="mb-10 rounded-[2.5rem] border border-yellow-400/20 bg-black/50 p-8">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400 text-black">
            <Tag size={30} />
          </div>

          <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
            Special Deals
          </p>

          <h1 className="mt-3 text-5xl font-black uppercase md:text-7xl">
            Offers
          </h1>

          <p className="mt-4 max-w-2xl text-zinc-400">
            Products shown here are real sale products from your admin dashboard.
          </p>
        </section>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[520px] animate-pulse rounded-[2rem] border border-yellow-400/15 bg-white/5"
              />
            ))}
          </div>
        ) : offerProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {offerProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-[2.5rem] border border-yellow-400/20 bg-black/50 p-12 text-center">
            <h2 className="text-3xl font-black uppercase text-white">
              No offers yet
            </h2>
            <p className="mt-3 text-zinc-400">
              Add old price or sale tag to products from admin.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}