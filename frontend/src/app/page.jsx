"use client";

import { apiUrl } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CreditCard,
  MapPin,
  PackageCheck,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Zap,
} from "lucide-react";

const BRAND_LOGOS = ["NIKE", "ADIDAS", "PUMA", "LV", "NEW BALANCE", "HESHAM"];

const getImage = (product) => {
  return (
    product?.image ||
    product?.imageUrl ||
    product?.photo ||
    product?.thumbnail ||
    product?.images?.[0] ||
    ""
  );
};

const getTags = (product) => {
  if (Array.isArray(product?.tags)) return product.tags.join(" ").toLowerCase();
  return String(product?.tags || product?.tag || product?.label || "").toLowerCase();
};

const getStock = (product) => {
  if (product?.sizeStock && typeof product.sizeStock === "object") {
    return Object.values(product.sizeStock).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );
  }
  return Number(product?.quantity || product?.stock || 0);
};

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState("new");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    loadProducts();
    loadSettings();

    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

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

  const loadSettings = async () => {
    try {
      const res = await fetch(apiUrl("/api/settings"));
      const data = await res.json();
      if (res.ok) setSettings(data || {});
    } catch {
      setSettings({});
    }
  };

  const activeProducts = useMemo(() => {
    return products.filter((product) => product.isActive !== false);
  }, [products]);

  const heroProduct = useMemo(() => {
    return (
      activeProducts.find((product) => getImage(product) && getStock(product) > 0) ||
      activeProducts.find((product) => getImage(product)) ||
      activeProducts[0]
    );
  }, [activeProducts]);

  const heroImage = getImage(heroProduct);

  const newProducts = useMemo(() => {
    const tagged = activeProducts.filter((product) => getTags(product).includes("new"));
    return tagged.length ? tagged.slice(0, 4) : activeProducts.slice(0, 4);
  }, [activeProducts]);

  const bestProducts = useMemo(() => {
    const tagged = activeProducts.filter((product) => {
      const tags = getTags(product);
      return tags.includes("best") || tags.includes("featured") || tags.includes("trending");
    });
    return tagged.length ? tagged.slice(0, 4) : activeProducts.slice(0, 4);
  }, [activeProducts]);

  const saleProducts = useMemo(() => {
    return activeProducts
      .filter((product) => {
        const oldPrice = Number(product.oldPrice || product.old_price || 0);
        const price = Number(product.price || 0);
        return getTags(product).includes("sale") || oldPrice > price;
      })
      .slice(0, 4);
  }, [activeProducts]);

  const selectedProducts =
    collection === "best"
      ? bestProducts
      : collection === "sale"
      ? saleProducts
      : newProducts;

  const categories = ["men", "women", "kids"].map((category) => {
    const categoryProducts = activeProducts.filter(
      (product) => String(product.category || "").toLowerCase() === category
    );
    const productWithImage = categoryProducts.find((product) => getImage(product));
    return {
      name: category,
      count: categoryProducts.length,
      image: getImage(productWithImage),
      href: `/products?category=${category}`,
    };
  });

  const locations = [1, 2, 3, 4, 5]
    .map((num) => ({
      name: settings[`location_${num}_name`],
      address: settings[`location_${num}_address`],
      mapUrl: settings[`location_${num}_map_url`],
    }))
    .filter((location) => location.name || location.address || location.mapUrl);

  const storeName = settings.store_name || "Hesham Store";
  const availableCount = activeProducts.filter((item) => getStock(item) > 0).length;

  return (
    <main className="min-h-screen bg-[#030303] text-white overflow-x-hidden">
      {/* Animated Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 bg-yellow-400 transition-all duration-700 ease-out"
          style={{
            left: `${mousePos.x * 0.3}%`,
            top: `${mousePos.y * 0.3}%`,
            transform: `translate(-50%, -50%)`,
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-10 bg-white transition-all duration-1000 ease-out"
          style={{
            right: `${(100 - mousePos.x) * 0.2}%`,
            bottom: `${(100 - mousePos.y) * 0.2}%`,
            transform: `translate(50%, 50%)`,
          }}
        />
      </div>

      {/* Hero Section - Asymmetric Split with 3D Depth */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden"
      >
        {/* Dynamic Grid Background */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(250,204,21,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(250,204,21,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            transform: `perspective(1000px) rotateX(${scrollY * 0.02}deg)`,
          }} />
        </div>

        <div className="container relative z-10 grid min-h-screen items-center gap-8 py-20 lg:grid-cols-[1fr_1.1fr]">
          {/* Left Content */}
          <div className="relative z-10 space-y-8">
            {/* Floating Badge */}
            <div 
              className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-black/60 backdrop-blur-md px-5 py-2.5"
              style={{
                transform: `translateY(${scrollY * 0.05}px)`,
              }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                Live Store — {activeProducts.length} Products
              </span>
            </div>

            {/* Main Headline with Character Animation */}
            <div className="space-y-2">
              <h1 className="text-7xl font-black uppercase leading-[0.85] tracking-[-0.06em] md:text-8xl lg:text-[9rem]">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-zinc-500">
                  The Drop
                </span>
                <span className="block text-yellow-400 mt-2 relative">
                  Starts Here
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 12" fill="none">
                    <path d="M2 8C50 2 150 2 200 6C250 10 350 8 398 4" stroke="#facc15" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
              </h1>
            </div>

            {/* Description with Glass Card */}
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 max-w-xl">
              <div className="absolute -top-3 -right-3">
                <Sparkles className="text-yellow-400/60" size={24} />
              </div>
              <p className="text-base font-medium leading-7 text-zinc-400">
                {settings.description ||
                  `${storeName} is built for fast shoe shopping: real products, real stock, clean checkout, and delivery-ready orders.`}
              </p>
            </div>

            {/* CTA Buttons with Magnetic Effect */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/products"
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-yellow-400 px-9 py-5 text-sm font-black uppercase tracking-[0.15em] text-black shadow-2xl shadow-yellow-400/30 transition-all duration-300 hover:shadow-yellow-400/50 hover:scale-[1.02]"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Shop Collection
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Link>

              <Link
                href={heroProduct?.id ? `/products/${heroProduct.id}` : "/products"}
                className="group inline-flex items-center justify-center gap-3 rounded-full border border-yellow-400/40 bg-black/40 backdrop-blur-md px-9 py-5 text-sm font-black uppercase tracking-[0.15em] text-yellow-400 transition-all duration-300 hover:bg-yellow-400 hover:text-black hover:border-yellow-400"
              >
                <Play size={16} className="fill-current" />
                Featured Drop
              </Link>
            </div>

            {/* Stats with Animated Borders */}
            <div className="grid grid-cols-3 gap-4 max-w-md">
              {[
                { label: "Products", value: activeProducts.length, suffix: "" },
                { label: "Available", value: availableCount, suffix: "" },
                { label: "Orders", value: "Ready", suffix: "" },
              ].map((stat, i) => (
                <div 
                  key={stat.label}
                  className="group relative rounded-2xl border border-yellow-400/20 bg-black/40 p-4 backdrop-blur-md overflow-hidden"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <strong className="relative block text-3xl font-black text-yellow-400">
                    {stat.value}{stat.suffix}
                  </strong>
                  <span className="relative mt-1 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Hero Image with 3D Tilt & Floating Elements */}
          <div className="relative hidden lg:block">
            {/* Floating Price Card */}
            <div 
              className="absolute -left-8 top-16 z-30 rounded-3xl border border-yellow-400/30 bg-black/80 backdrop-blur-2xl p-6 shadow-2xl shadow-yellow-400/10"
              style={{
                transform: `translateY(${scrollY * -0.08}px) rotate(-3deg)`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-yellow-400" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">
                  Featured
                </p>
              </div>
              <p className="max-w-48 text-lg font-black leading-tight">
                {heroProduct?.name || "Add your first product"}
              </p>
              {heroProduct?.price && (
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-xs text-zinc-500">EGP</span>
                  <p className="text-3xl font-black text-yellow-400">
                    {Number(heroProduct.price)}
                  </p>
                </div>
              )}
            </div>

            {/* Floating Stock Badge */}
            <div 
              className="absolute -right-4 bottom-24 z-30 rounded-3xl bg-yellow-400 p-5 text-black shadow-2xl shadow-yellow-400/30"
              style={{
                transform: `translateY(${scrollY * 0.06}px) rotate(2deg)`,
              }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
                In Stock
              </p>
              <p className="mt-1 text-4xl font-black">
                {heroProduct ? getStock(heroProduct) : 0}
              </p>
              <p className="text-xs font-bold mt-1 opacity-60">Pairs Left</p>
            </div>

            {/* Main Image Container with Perspective */}
            <div 
              className="relative rounded-[2.5rem] overflow-hidden border border-yellow-400/20 shadow-2xl shadow-black/50"
              style={{
                transform: `perspective(1000px) rotateY(${-5 + (mousePos.x - 50) * 0.05}deg) rotateX(${(mousePos.y - 50) * 0.05}deg)`,
                transition: 'transform 0.3s ease-out',
              }}
            >
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={heroProduct?.name || storeName}
                  className="h-[680px] w-full object-cover"
                />
              ) : (
                <div className="flex h-[680px] items-center justify-center bg-gradient-to-b from-[#0a0a0a] to-[#050505] p-10 text-center">
                  <div className="space-y-4">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-yellow-400/30 mx-auto flex items-center justify-center">
                      <Sparkles className="text-yellow-400/50" size={32} />
                    </div>
                    <p className="text-zinc-600 font-medium">
                      Add a product image in admin to build your homepage hero.
                    </p>
                  </div>
                </div>
              )}

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

              {/* Bottom Info Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mb-1">
                        Real Product From Your Store
                      </p>
                      <h2 className="text-2xl font-black uppercase">
                        {heroProduct?.name || "No products yet"}
                      </h2>
                    </div>
                    <Link
                      href={heroProduct?.id ? `/products/${heroProduct.id}` : "/products"}
                      className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-400 text-black hover:scale-110 transition-transform"
                    >
                      <ArrowUpRight size={20} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Ring */}
            <div className="absolute -z-10 -inset-4 rounded-[3rem] border border-yellow-400/10" />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-yellow-400 to-transparent" />
        </div>
      </section>

      {/* Marquee Brand Strip */}
      <BrandMarquee />

      {/* Categories - Staggered Grid with Hover Reveal */}
      <section className="container relative z-10 py-24">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
              Browse Categories
            </p>
            <h2 className="text-5xl font-black uppercase md:text-7xl leading-[0.9]">
              Choose Your<br />
              <span className="text-zinc-600">Lane.</span>
            </h2>
          </div>
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-yellow-400 hover:text-white transition-colors"
          >
            View All 
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {categories.map((category, index) => (
            <Link
              key={category.name}
              href={category.href}
              className="group relative min-h-[480px] overflow-hidden rounded-[2.5rem] border border-yellow-400/15 bg-[#0a0a0a] transition-all duration-500 hover:border-yellow-400/40"
              style={{
                marginTop: index === 1 ? '2rem' : '0',
              }}
            >
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:opacity-60"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

              {/* Corner Accent */}
              <div className="absolute top-6 right-6 w-12 h-12 rounded-full border border-yellow-400/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-45">
                <ArrowUpRight size={20} className="text-yellow-400" />
              </div>

              <div className="absolute bottom-0 p-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-yellow-400" />
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
                    {category.count} Products
                  </p>
                </div>
                <h3 className="text-5xl font-black uppercase text-white mb-6">
                  {category.name}
                </h3>
                <span className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-3.5 text-xs font-black uppercase tracking-[0.14em] text-black opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  Shop Now <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Collection Switcher - Tabbed with Animated Underline */}
      <section className="container relative z-10 py-16">
        <div className="rounded-[2.5rem] border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-8 md:p-12">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
                Curated Picks
              </p>
              <h2 className="text-5xl font-black uppercase md:text-6xl">
                Shop By Signal.
              </h2>
            </div>

            <div className="flex flex-wrap gap-2 p-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-md">
              {[
                { id: "new", label: "New Drops" },
                { id: "best", label: "Best Sellers" },
                { id: "sale", label: "On Sale" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCollection(tab.id)}
                  className={`relative rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.14em] transition-all duration-300 ${
                    collection === tab.id
                      ? "text-black"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {collection === tab.id && (
                    <span className="absolute inset-0 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/25" />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <ProductSkeleton />
          ) : selectedProducts.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {selectedProducts.map((product, i) => (
                <div 
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Add tags like new, best, featured, or sale to show products here." />
          )}
        </div>
      </section>

      {/* Trust Features - Horizontal Scroll on Mobile */}
      <section className="container relative z-10 py-16">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: <Truck size={24} />, title: "Delivery Ready", text: "Delivery places and prices are connected to checkout.", color: "from-yellow-400/20" },
            { icon: <PackageCheck size={24} />, title: "Size Stock", text: "Each size has real stock quantity in admin.", color: "from-yellow-400/15" },
            { icon: <ShieldCheck size={24} />, title: "Saved Orders", text: "Orders are saved in Supabase and visible in admin.", color: "from-yellow-400/10" },
            { icon: <CreditCard size={24} />, title: "Payment Ready", text: "Cash on delivery now. Paymob integration next.", color: "from-yellow-400/5" },
          ].map((feature, i) => (
            <div 
              key={feature.title}
              className="group relative rounded-[2rem] border border-yellow-400/10 bg-black/40 p-7 backdrop-blur-md overflow-hidden transition-all duration-500 hover:border-yellow-400/30 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black uppercase">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  {feature.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sale Section - Diagonal Split */}
      {saleProducts.length > 0 && (
        <section className="container relative z-10 py-16">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-yellow-400">
            {/* Diagonal Background */}
            <div className="absolute inset-0 bg-black" style={{ clipPath: 'polygon(0 0, 45% 0, 35% 100%, 0 100%)' }} />

            <div className="relative grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center p-8 md:p-12">
              <div className="text-white">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 mb-6">
                  <BadgeCheck size={14} />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                    Real Sale Products
                  </span>
                </div>
                <h2 className="text-5xl font-black uppercase leading-[0.9] md:text-6xl">
                  Offers That<br />Actually Exist.
                </h2>
                <p className="mt-5 text-sm font-medium text-white/60 max-w-sm">
                  This section appears only when your products have old price or sale tag.
                </p>
                <Link
                  href="/offers"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black uppercase tracking-[0.15em] text-black hover:bg-zinc-200 transition-colors"
                >
                  Open Offers <ArrowRight size={18} />
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {saleProducts.slice(0, 2).map((product) => (
                  <div key={product.id} className="scale-95 hover:scale-100 transition-transform duration-300">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Locations - Minimal Cards */}
      {locations.length > 0 && (
        <section className="container relative z-10 py-16">
          <div className="rounded-[2.5rem] border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-8 md:p-12">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end mb-10">
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
                  Visit Us
                </p>
                <h2 className="text-5xl font-black uppercase md:text-6xl">
                  Find Us.
                </h2>
              </div>
              <Link
                href="/location"
                className="group inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-yellow-400"
              >
                All Locations 
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {locations.slice(0, 2).map((location, index) => (
                <Link
                  key={index}
                  href="/location"
                  className="group relative rounded-[2rem] border border-yellow-400/15 bg-[#070707] p-8 transition-all duration-300 hover:border-yellow-400/40 hover:bg-[#0a0a0a] overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-2xl group-hover:bg-yellow-400/10 transition-colors" />
                  <div className="relative flex items-start gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400 group-hover:bg-yellow-400 group-hover:text-black transition-all duration-300">
                      <MapPin size={24} />
                    </div>
                    <div>
                      {location.name && (
                        <h3 className="text-2xl font-black uppercase">
                          {location.name}
                        </h3>
                      )}
                      {location.address && (
                        <p className="mt-2 text-zinc-500 leading-relaxed">
                          {location.address}
                        </p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Get Directions <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA - Full Width with Radial Glow */}
      <section className="container relative z-10 py-16 pb-24">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-yellow-400/20 bg-black p-8 md:p-16">
          {/* Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-400/10 rounded-full blur-[100px]" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400 mb-4">
                Final Call
              </p>
              <h2 className="text-5xl font-black uppercase leading-[0.9] md:text-7xl">
                Your Next Pair<br />
                <span className="text-zinc-600">Is Waiting.</span>
              </h2>
            </div>

            <Link
              href="/products"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-yellow-400 px-10 py-6 text-sm font-black uppercase tracking-[0.15em] text-black shadow-2xl shadow-yellow-400/30 hover:shadow-yellow-400/50 hover:scale-105 transition-all duration-300"
            >
              Browse Products
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function BrandMarquee() {
  return (
    <section className="relative border-y border-yellow-400/10 bg-black/50 py-6 overflow-hidden">
      <div className="flex animate-marquee">
        {[...BRAND_LOGOS, ...BRAND_LOGOS, ...BRAND_LOGOS].map((brand, i) => (
          <Link
            key={`${brand}-${i}`}
            href={`/products?brand=${encodeURIComponent(brand)}`}
            className="group mx-6 flex h-20 min-w-[180px] items-center justify-center rounded-2xl border border-yellow-400/10 bg-[#0a0a0a] text-center text-lg font-black uppercase tracking-[0.12em] text-zinc-500 transition-all duration-300 hover:border-yellow-400/40 hover:text-yellow-400 hover:bg-yellow-400/5"
          >
            {brand}
          </Link>
        ))}
      </div>
    </section>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-3xl border border-yellow-400/20 bg-black/45 p-4 backdrop-blur-xl">
      <strong className="block text-2xl font-black text-yellow-400">
        {value}
      </strong>
      <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
        {label}
      </span>
    </div>
  );
}

function SwitchButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.16em] transition ${
        active
          ? "bg-yellow-400 text-black"
          : "border border-yellow-400/30 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black"
      }`}
    >
      {children}
    </button>
  );
}

function TrustCard({ icon, title, text }) {
  return (
    <div className="rounded-[2rem] border border-yellow-400/20 bg-black/45 p-6 transition hover:-translate-y-1 hover:border-yellow-400/60">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
        {icon}
      </div>
      <h3 className="text-xl font-black uppercase">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-[520px] animate-pulse rounded-[2rem] border border-yellow-400/15 bg-white/5"
        />
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[2rem] border border-yellow-400/20 bg-black/40 p-10 text-center text-zinc-400">
      {text}
    </div>
  );
}