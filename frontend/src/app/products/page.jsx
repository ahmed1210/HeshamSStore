"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { 
  Search, 
  Sparkles, 
  Filter, 
  X, 
  RefreshCw, 
  SlidersHorizontal, 
  Grid3X3, 
  LayoutGrid,
  ArrowUpDown,
  ChevronDown,
  Package,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useSearchParams } from "next/navigation";

const categories = [
  { label: "All Categories", value: "", icon: "⊞" },
  { label: "Men", value: "men", icon: "♂" },
  { label: "Women", value: "women", icon: "♀" },
  { label: "Kids", value: "kids", icon: "★" },
];

const sortOptions = [
  { label: "Featured", value: "default", icon: Sparkles },
  { label: "Price: Low to High", value: "price-low", icon: ArrowUpDown },
  { label: "Price: High to Low", value: "price-high", icon: ArrowUpDown },
  { label: "Best Rated", value: "rating", icon: TrendingUp },
  { label: "Newest", value: "newest", icon: Package },
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
  const [showFilters, setShowFilters] = useState(false);
  const [gridCols, setGridCols] = useState(3);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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
      result = [...result].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }
    if (sortBy === "price-high") {
      result = [...result].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }
    if (sortBy === "rating") {
      result = [...result].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
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

  const activeFilterCount = [
    category, brand, search, sortBy !== "default" ? sortBy : "", 
    stockFilter !== "all" ? stockFilter : ""
  ].filter(Boolean).length;

  const totalProducts = products.filter((product) => product.isActive !== false).length;
  const availableProducts = products.filter(
    (product) => product.isActive !== false && Number(product.quantity || 0) > 0
  ).length;
  const outOfStockProducts = products.filter(
    (product) => product.isActive !== false && Number(product.quantity || 0) <= 0
  ).length;
  const lowStockProducts = products.filter(
    (product) => product.isActive !== false && Number(product.quantity || 0) > 0 && Number(product.quantity || 0) <= 3
  ).length;

  const stockFilters = [
    { id: "all", label: "All", count: totalProducts, color: "yellow" },
    { id: "available", label: "Available", count: availableProducts, color: "green" },
    { id: "low", label: "Low Stock", count: lowStockProducts, color: "orange" },
    { id: "out", label: "Out", count: outOfStockProducts, color: "red" },
  ];

  return (
    <main className="min-h-screen bg-[#030303] text-white relative overflow-x-hidden">
      {/* Interactive Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.07] bg-yellow-400 transition-all duration-700 ease-out"
          style={{
            left: `${mousePos.x * 0.5}%`,
            top: `${mousePos.y * 0.5}%`,
            transform: `translate(-50%, -50%)`,
          }}
        />
      </div>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative pt-32 pb-16 overflow-hidden"
      >
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(250,204,21,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(250,204,21,0.8) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }} />
        </div>

        <div className="container relative z-10">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 backdrop-blur-md px-4 py-2 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                Live Inventory
              </span>
            </div>

            <h1 className="text-6xl font-black uppercase leading-[0.85] tracking-[-0.06em] md:text-8xl lg:text-9xl mb-6">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-zinc-600">
                Find Your
              </span>
              <span className="block text-yellow-400 relative mt-2">
                Next Pair
                <svg className="absolute -bottom-3 left-0 w-48 md:w-72" viewBox="0 0 300 12" fill="none">
                  <path d="M2 8C50 2 100 2 150 6C200 10 250 8 298 4" stroke="#facc15" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>

            <p className="text-lg text-zinc-500 max-w-xl leading-relaxed">
              Shop men, women, and kids shoes with size-based stock, smart cart limits, 
              and a clean black/yellow glass experience.
            </p>
          </div>

          {/* Stats Row */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Products", value: totalProducts, color: "yellow", icon: Package },
              { label: "Available", value: availableProducts, color: "green", icon: TrendingUp },
              { label: "Low Stock", value: lowStockProducts, color: "orange", icon: AlertCircle },
              { label: "Out of Stock", value: outOfStockProducts, color: "red", icon: X },
            ].map((stat) => {
              const Icon = stat.icon;
              const colorMap = {
                yellow: "border-yellow-400/20 bg-yellow-400/5 text-yellow-400",
                green: "border-green-500/20 bg-green-500/5 text-green-500",
                orange: "border-orange-500/20 bg-orange-500/5 text-orange-500",
                red: "border-red-500/20 bg-red-500/5 text-red-500",
              };
              return (
                <div 
                  key={stat.label}
                  className={`group relative rounded-2xl border ${colorMap[stat.color]} p-5 backdrop-blur-md overflow-hidden transition-all duration-300 hover:scale-[1.02]`}
                >
                  <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Icon size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-2">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-black">{stat.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-0 z-40 border-y border-white/5 bg-[#030303]/80 backdrop-blur-2xl">
        <div className="container py-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[280px] max-w-md">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shoes by name..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-11 py-3 text-sm font-medium text-white placeholder:text-zinc-600 outline-none transition-all focus:border-yellow-400/50 focus:bg-white/[0.07]"
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="hidden md:flex items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`relative rounded-lg px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] transition-all duration-300 ${
                    category === cat.value
                      ? "text-black"
                      : "text-zinc-500 hover:text-white border border-white/10 hover:border-white/20"
                  }`}
                >
                  {category === cat.value && (
                    <span className="absolute inset-0 rounded-lg bg-yellow-400" />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="text-sm">{cat.icon}</span>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-8 bg-white/10" />

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] transition-all duration-300 ${
                showFilters || activeFilterCount > 0
                  ? "bg-yellow-400 text-black"
                  : "border border-white/10 text-zinc-500 hover:text-white hover:border-white/20"
              }`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-black text-yellow-400">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-zinc-500 hover:text-white hover:border-white/20 transition-all">
                <ArrowUpDown size={14} />
                {sortOptions.find(s => s.value === sortBy)?.label}
                <ChevronDown size={12} className="group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-[#0a0a0a] p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl shadow-black/50">
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${
                        sortBy === option.value
                          ? "bg-yellow-400/10 text-yellow-400"
                          : "text-zinc-500 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Icon size={14} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid Toggle */}
            <div className="hidden sm:flex items-center gap-1 rounded-lg border border-white/10 p-1">
              <button
                onClick={() => setGridCols(3)}
                className={`rounded-md p-2 transition-all ${gridCols === 3 ? "bg-yellow-400 text-black" : "text-zinc-500 hover:text-white"}`}
              >
                <Grid3X3 size={14} />
              </button>
              <button
                onClick={() => setGridCols(2)}
                className={`rounded-md p-2 transition-all ${gridCols === 2 ? "bg-yellow-400 text-black" : "text-zinc-500 hover:text-white"}`}
              >
                <LayoutGrid size={14} />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchProducts}
              className="rounded-lg border border-white/10 p-2.5 text-zinc-500 hover:text-yellow-400 hover:border-yellow-400/30 transition-all"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Expanded Filters */}
          <div className={`overflow-hidden transition-all duration-300 ${showFilters ? "max-h-96 mt-4" : "max-h-0"}`}>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
              {/* Stock Filter Pills */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-3">
                  Stock Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {stockFilters.map((filter) => {
                    const colorMap = {
                      yellow: "border-yellow-400/20 text-yellow-400 hover:bg-yellow-400/10",
                      green: "border-green-500/20 text-green-500 hover:bg-green-500/10",
                      orange: "border-orange-500/20 text-orange-500 hover:bg-orange-500/10",
                      red: "border-red-500/20 text-red-500 hover:bg-red-500/10",
                    };
                    const isActive = stockFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setStockFilter(filter.id)}
                        className={`relative flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                          isActive 
                            ? `bg-${filter.color}-400/10 ${colorMap[filter.color]} ring-1 ring-${filter.color}-400/30` 
                            : `border-white/10 text-zinc-600 hover:text-white hover:border-white/20`
                        }`}
                      >
                        {filter.label}
                        <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full text-[10px] font-black ${
                          isActive ? "bg-white/10" : "bg-white/5"
                        }`}>
                          {filter.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brand Filter */}
              {brandOptions.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-3">
                    Brands
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setBrand("")}
                      className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.1em] transition-all ${
                        !brand 
                          ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-400" 
                          : "border-white/10 text-zinc-600 hover:text-white hover:border-white/20"
                      }`}
                    >
                      All Brands
                    </button>
                    {brandOptions.map((brandName) => (
                      <button
                        key={brandName}
                        onClick={() => setBrand(brandName)}
                        className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.1em] transition-all ${
                          brand === brandName 
                            ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-400" 
                            : "border-white/10 text-zinc-600 hover:text-white hover:border-white/20"
                        }`}
                      >
                        {brandName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Category */}
              <div className="md:hidden">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-3">
                  Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.1em] transition-all ${
                        category === cat.value 
                          ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-400" 
                          : "border-white/10 text-zinc-600 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Tags */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                Active:
              </span>
              {category && (
                <FilterTag label={categories.find(c => c.value === category)?.label} onRemove={() => setCategory("")} />
              )}
              {brand && (
                <FilterTag label={brand} onRemove={() => setBrand("")} />
              )}
              {search && (
                <FilterTag label={`"${search}"`} onRemove={() => setSearch("")} />
              )}
              {sortBy !== "default" && (
                <FilterTag label={sortOptions.find(s => s.value === sortBy)?.label} onRemove={() => setSortBy("default")} />
              )}
              {stockFilter !== "all" && (
                <FilterTag label={stockFilters.find(s => s.id === stockFilter)?.label} onRemove={() => setStockFilter("all")} />
              )}
              <button
                onClick={clearFilters}
                className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-red-400 transition-colors ml-2"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="container relative z-10 py-10">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500 shrink-0" />
            <p className="text-sm font-bold text-red-400">{error}</p>
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-bold text-zinc-500">
            Showing <span className="text-yellow-400 font-black">{visibleProducts.length}</span> of{" "}
            <span className="text-white font-black">{totalProducts}</span> products
          </p>
          {visibleProducts.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <span className="hidden sm:inline">Sorted by</span>
              <span className="font-black text-yellow-400 uppercase tracking-wider">
                {sortOptions.find(s => s.value === sortBy)?.label}
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className={`grid gap-6 ${gridCols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-[520px] animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]"
              />
            ))}
          </div>
        ) : (
          <>
            <div className={`grid gap-6 ${gridCols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
              {visibleProducts.map((product, i) => (
                <div 
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {visibleProducts.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-yellow-400/20 flex items-center justify-center">
                    <Search size={32} className="text-yellow-400/30" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                    <X size={14} className="text-black" />
                  </div>
                </div>
                <h2 className="text-3xl font-black uppercase mb-3">
                  No Products Found
                </h2>
                <p className="text-zinc-500 max-w-md mb-8 leading-relaxed">
                  Try adjusting your search, category, brand, stock filter, or sorting to find what you're looking for.
                </p>
                <button
                  onClick={clearFilters}
                  className="group inline-flex items-center gap-2 rounded-full bg-yellow-400 px-8 py-4 text-sm font-black uppercase tracking-[0.15em] text-black hover:bg-yellow-300 transition-all"
                >
                  Reset All Filters
                  <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function FilterTag({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/20 bg-yellow-400/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-yellow-400">
      {label}
      <button 
        onClick={onRemove}
        className="ml-1 rounded-full hover:bg-yellow-400/20 p-0.5 transition-colors"
      >
        <X size={10} />
      </button>
    </span>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#030303] text-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Loading Products...</p>
          </div>
        </main>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}