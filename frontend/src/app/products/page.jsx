"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Search, Sparkles, Filter, X, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";

const categories = [
  { label: "All Categories", value: "" },
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "Kids", value: "kids" },
];

const sortOptions = [
  { label: "Default", value: "default" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
  { label: "Best Rated", value: "rating" },
  { label: "Newest", value: "newest" },
];

function ProductsContent() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [brand, setBrand] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [stockFilter, setStockFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams();

      if (category) query.append("category", category);
      if (brand) query.append("brand", brand);
      if (search.trim()) query.append("search", search.trim());

      const res = await fetch(apiUrl(`/api/products?${query}`));
      const data = await res.json();

      if (!res.ok) {
        setProducts([]);
        setError(data.message || "Could not load products.");
        return;
      }

      if (!Array.isArray(data)) {
        setProducts([]);
        setError("Products response is not valid.");
        return;
      }

      setProducts(data);
    } catch {
      setProducts([]);
      setError("Cannot connect to backend. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, brand, search]);

  const brandOptions = useMemo(() => {
    const uniqueBrands = new Set();

    products.forEach((product) => {
      if (product.brand) uniqueBrands.add(product.brand);
    });

    return Array.from(uniqueBrands).sort();
  }, [products]);

  const visibleProducts = useMemo(() => {
    let result = products.filter((product) => product.isActive !== false);

    if (stockFilter === "available") {
      result = result.filter((product) => Number(product.quantity || 0) > 0);
    }

    if (stockFilter === "out") {
      result = result.filter((product) => Number(product.quantity || 0) <= 0);
    }

    if (stockFilter === "low") {
      result = result.filter(
        (product) =>
          Number(product.quantity || 0) > 0 && Number(product.quantity || 0) <= 3
      );
    }

    if (sortBy === "price-low") {
      result = [...result].sort(
        (a, b) => Number(a.price || 0) - Number(b.price || 0)
      );
    }

    if (sortBy === "price-high") {
      result = [...result].sort(
        (a, b) => Number(b.price || 0) - Number(a.price || 0)
      );
    }

    if (sortBy === "rating") {
      result = [...result].sort(
        (a, b) => Number(b.rating || 0) - Number(a.rating || 0)
      );
    }

    if (sortBy === "newest") {
      result = [...result].sort(
        (a, b) =>
          new Date(b.createdAt || b.created_at || 0) -
          new Date(a.createdAt || a.created_at || 0)
      );
    }

    return result;
  }, [products, stockFilter, sortBy]);

  const clearFilters = () => {
    setCategory("");
    setBrand("");
    setSearch("");
    setSortBy("default");
    setStockFilter("all");
  };

  const totalProducts = products.filter(
    (product) => product.isActive !== false
  ).length;

  const availableProducts = products.filter(
    (product) => product.isActive !== false && Number(product.quantity || 0) > 0
  ).length;

  const outOfStockProducts = products.filter(
    (product) => product.isActive !== false && Number(product.quantity || 0) <= 0
  ).length;

  return (
    <main className="min-h-screen bg-transparent py-20">
      <div className="container">
        <section className="glass-panel mb-8 overflow-hidden rounded-[2rem] p-6 shadow-2xl shadow-yellow-400/10 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-black/20 px-4 py-2 text-sm font-black text-yellow-400 backdrop-blur-md">
                <Sparkles size={16} />
                Hesham Store Collection
              </div>

              <h1 className="theme-text text-4xl font-black leading-tight md:text-6xl">
                Find Your Next{" "}
                <span className="text-yellow-400">Favorite Shoes</span>
              </h1>

              <p className="theme-muted mt-4 max-w-2xl text-lg">
                Shop men, women, and kids shoes with size-based stock, smart
                cart limits, and a clean black/yellow glass experience.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-yellow-400/30 bg-black/10 p-5 backdrop-blur-xl">
                <p className="theme-muted text-sm font-bold">Products</p>
                <h3 className="mt-2 text-3xl font-black text-yellow-400">
                  {totalProducts}
                </h3>
              </div>

              <div className="rounded-3xl border border-green-500/30 bg-green-500/10 p-5 backdrop-blur-xl">
                <p className="theme-muted text-sm font-bold">Available</p>
                <h3 className="mt-2 text-3xl font-black text-green-500">
                  {availableProducts}
                </h3>
              </div>

              <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 backdrop-blur-xl">
                <p className="theme-muted text-sm font-bold">Out Stock</p>
                <h3 className="mt-2 text-3xl font-black text-red-500">
                  {outOfStockProducts}
                </h3>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel sticky top-24 z-30 mb-10 rounded-[2rem] p-5 shadow-2xl shadow-yellow-400/10">
          <div className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto]">
            <div className="theme-input flex items-center gap-2 rounded-2xl px-4 shadow-lg">
              <Search size={18} className="text-yellow-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shoes by name..."
                className="theme-text w-full bg-transparent py-3 outline-none placeholder:text-zinc-400"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="theme-input rounded-2xl px-4 py-3 outline-none"
            >
              {categories.map((item) => (
                <option key={item.label} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="theme-input rounded-2xl px-4 py-3 outline-none"
            >
              <option value="">All Brands</option>
              {brandOptions.map((brandName) => (
                <option key={brandName} value={brandName}>
                  {brandName}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="theme-input rounded-2xl px-4 py-3 outline-none"
            >
              <option value="all">All Stock</option>
              <option value="available">Available</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="theme-input rounded-2xl px-4 py-3 outline-none"
            >
              {sortOptions.map((item) => (
                <option key={item.label} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchProducts}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-yellow-400/50 px-5 py-3 font-black text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-full border border-yellow-400/30 bg-black/10 px-4 py-2 text-sm font-bold text-yellow-400 backdrop-blur-xl">
              <Filter size={14} />
              Smart size stock enabled
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-full border border-yellow-400/40 px-4 py-2 text-sm font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
            >
              <X size={14} />
              Clear Filters
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 font-bold text-red-500">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="glass-panel h-[580px] animate-pulse rounded-3xl border-2 border-yellow-400/30"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="theme-muted font-bold">
                Showing{" "}
                <span className="text-yellow-400">{visibleProducts.length}</span>{" "}
                product{visibleProducts.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {visibleProducts.length === 0 && !error && (
              <div className="glass-panel rounded-[2rem] p-12 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-400/10 text-yellow-400">
                  <Search size={28} />
                </div>

                <h2 className="theme-text text-2xl font-black">
                  No products found
                </h2>

                <p className="theme-muted mt-3">
                  Try changing the search, category, brand, stock filter, or
                  sorting.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 rounded-2xl bg-yellow-400 px-6 py-3 font-black text-black transition hover:bg-yellow-300"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-white">
          Loading products...
        </main>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}