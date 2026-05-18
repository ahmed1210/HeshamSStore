"use client";

import { Suspense } from "react";
import { apiUrl } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import {
  Search,
  Sparkles,
  Filter,
  X,
  RefreshCw,
} from "lucide-react";
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
    } catch (err) {
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
      if (product.brand) {
        uniqueBrands.add(product.brand);
      }
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
          Number(product.quantity || 0) > 0 &&
          Number(product.quantity || 0) <= 3
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
        (a, b) => Number(b.id || 0) - Number(a.id || 0)
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
    (product) =>
      product.isActive !== false && Number(product.quantity || 0) > 0
  ).length;

  const outOfStockProducts = products.filter(
    (product) =>
      product.isActive !== false && Number(product.quantity || 0) <= 0
  ).length;

  return (
    <main className="min-h-screen bg-transparent py-20">
      {/* KEEP ALL YOUR CURRENT JSX HERE */}
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