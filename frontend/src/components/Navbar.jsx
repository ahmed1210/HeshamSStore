"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { getCartCount } from "@/utils/cartStorage";
import SearchOverlay from "@/components/SearchOverlay";
import {
  Home,
  Menu,
  X,
  Search,
  ShoppingBag,
  Tag,
  MapPin,
  Shield,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [scrolled, setScrolled] = useState(false);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("hesham-theme") || "dark";
    setTheme(savedTheme);

    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }

    updateCartCount();
    loadBrandsAndCategories();

    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const updateCartCount = () => {
    setCartCount(getCartCount());
  };

  const loadBrandsAndCategories = async () => {
    try {
      const [brandsRes, categoriesRes] = await Promise.all([
        fetch(apiUrl("/api/brands")),
        fetch(apiUrl("/api/categories")),
      ]);

      const brandsData = await brandsRes.json();
      const categoriesData = await categoriesRes.json();

      setBrands(
        Array.isArray(brandsData)
          ? brandsData.filter((item) => item.active !== false).slice(0, 8)
          : []
      );

      setCategories(
        Array.isArray(categoriesData)
          ? categoriesData.filter((item) => item.active !== false).slice(0, 8)
          : []
      );
    } catch {
      setBrands([]);
      setCategories([]);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("hesham-theme", nextTheme);

    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const closeMenu = () => setMenuOpen(false);

  const openSearch = () => {
    setSearchOpen(true);
    setMenuOpen(false);
  };

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-[70] border-b border-yellow-400/20 bg-yellow-400 px-4 py-2 text-center text-black">
        <p className="text-[11px] font-black uppercase tracking-[0.25em]">
          Fast delivery • Cash on delivery • New drops available
        </p>
      </div>

      <header
        className={`fixed left-0 right-0 top-8 z-[60] transition-all duration-500 ${
          scrolled
            ? "border-b border-yellow-400/15 bg-black/90 shadow-2xl shadow-black/40 backdrop-blur-2xl"
            : "bg-black/60 backdrop-blur-xl"
        }`}
      >
        <nav className="container flex min-h-[82px] items-center justify-between gap-4">
          <Link href="/" onClick={closeMenu} className="group flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-sm font-black text-black shadow-lg shadow-yellow-400/20 transition group-hover:rotate-6">
              HS
            </div>

            <div className="leading-none">
              <h1 className="text-lg font-black uppercase tracking-[0.16em] text-white group-hover:text-yellow-400">
                Hesham
              </h1>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                Store
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-1 xl:flex">
            <NavItem href="/" icon={<Home size={15} />} label="Home" />
            <NavItem href="/products" icon={<ShoppingBag size={15} />} label="Products" />
            <MegaMenu title="Brands" items={brands} type="brand" />
            <MegaMenu title="Categories" items={categories} type="category" />
            <NavItem href="/offers" icon={<Tag size={15} />} label="Offers" />
            <NavItem href="/location" icon={<MapPin size={15} />} label="Location" />
          </div>

          <div className="hidden flex-1 justify-center px-5 lg:flex">
            <button
              type="button"
              onClick={openSearch}
              className="flex h-12 w-full max-w-md items-center gap-3 rounded-2xl border border-yellow-400/20 bg-white/5 px-4 text-left transition hover:border-yellow-400/50"
            >
              <Search size={17} className="text-yellow-400" />
              <span className="text-sm font-bold text-zinc-500">
                Search products, brands, categories...
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openSearch}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 text-zinc-400 transition hover:border-yellow-400/40 hover:text-yellow-400"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/10 text-zinc-400 transition hover:border-yellow-400/40 hover:text-yellow-400 md:flex"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            <Link
              href="/cart"
              className="group relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 text-zinc-400 transition hover:border-yellow-400/40 hover:text-yellow-400"
              aria-label="Cart"
            >
              <ShoppingBag size={18} />

              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-black text-black">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 text-zinc-400 transition hover:border-yellow-400/40 hover:text-yellow-400 xl:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </header>

      <div
        className={`fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm transition xl:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeMenu}
      />

      <aside
        className={`fixed bottom-0 right-0 top-0 z-[90] w-[88vw] max-w-sm border-l border-yellow-400/20 bg-[#050505] p-6 text-white shadow-2xl transition duration-500 xl:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-black uppercase text-yellow-400">
              Hesham Store
            </p>
            <p className="text-xs font-bold text-zinc-500">Mobile menu</p>
          </div>

          <button
            type="button"
            onClick={closeMenu}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 text-zinc-400"
          >
            <X size={20} />
          </button>
        </div>

        <button
          type="button"
          onClick={openSearch}
          className="mt-7 flex w-full items-center gap-3 rounded-2xl border border-yellow-400/20 bg-white/5 px-4 py-4 text-left text-sm font-bold text-zinc-500"
        >
          <Search size={17} className="text-yellow-400" />
          Search products, brands, categories...
        </button>

        <div className="mt-7 space-y-2">
          <MobileItem href="/" icon={<Home size={18} />} label="Home" onClick={closeMenu} />
          <MobileItem href="/products" icon={<ShoppingBag size={18} />} label="Products" onClick={closeMenu} />
          <MobileItem href="/offers" icon={<Tag size={18} />} label="Offers" onClick={closeMenu} />
          <MobileItem href="/location" icon={<MapPin size={18} />} label="Location" onClick={closeMenu} />
          <MobileItem href="/admin/login" icon={<Shield size={18} />} label="Admin" onClick={closeMenu} />
        </div>

        {brands.length > 0 && (
          <div className="mt-7">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
              Brands
            </p>

            <div className="grid grid-cols-2 gap-2">
              {brands.slice(0, 6).map((brand) => (
                <Link
                  key={brand.id || brand.slug}
                  href={`/products?brand=${encodeURIComponent(brand.slug || brand.name)}`}
                  onClick={closeMenu}
                  className="flex h-16 items-center justify-center rounded-2xl border border-yellow-400/20 bg-black p-2 text-center text-xs font-black uppercase tracking-[0.12em] text-white"
                >
                  {brand.logo_url ? (
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      className="max-h-9 max-w-[90px] object-contain"
                    />
                  ) : (
                    brand.name
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div className="mt-7">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
              Categories
            </p>

            <div className="grid grid-cols-2 gap-2">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id || category.slug}
                  href={`/products?category=${encodeURIComponent(category.slug || category.name)}`}
                  onClick={closeMenu}
                  className="flex h-16 items-center justify-center rounded-2xl border border-yellow-400/20 bg-black p-2 text-center text-xs font-black uppercase tracking-[0.12em] text-white"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className="h-[114px]" />
    </>
  );
}

function NavItem({ href, icon, label }) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-400 transition hover:text-white"
    >
      <span className="text-zinc-500 group-hover:text-yellow-400">{icon}</span>
      {label}
      <span className="absolute bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-yellow-400 transition-all group-hover:w-8" />
    </Link>
  );
}

function MegaMenu({ title, items, type }) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-400 transition hover:text-white"
      >
        {title}
        <ChevronDown size={14} className="text-yellow-400" />
      </button>

      <div className="invisible absolute left-1/2 top-full z-50 mt-4 w-[520px] -translate-x-1/2 rounded-[2rem] border border-yellow-400/20 bg-black/95 p-5 opacity-0 shadow-2xl shadow-black/40 backdrop-blur-2xl transition group-hover:visible group-hover:opacity-100">
        {items.length === 0 ? (
          <p className="p-5 text-center text-sm font-bold text-zinc-500">
            No {title.toLowerCase()} yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => {
              const href =
                type === "brand"
                  ? `/products?brand=${encodeURIComponent(item.slug || item.name)}`
                  : `/products?category=${encodeURIComponent(item.slug || item.name)}`;

              return (
                <Link
                  key={item.id || item.slug}
                  href={href}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-yellow-400/50 hover:bg-yellow-400 hover:text-black"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-black/70 p-2">
                    {item.logo_url || item.image_url ? (
                      <img
                        src={item.logo_url || item.image_url}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-sm font-black text-yellow-400">
                        {String(item.name || "").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="font-black uppercase">{item.name}</p>
                    <p className="mt-1 text-xs font-bold opacity-60">Shop now</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MobileItem({ href, icon, label, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-black uppercase tracking-[0.14em] text-zinc-300"
    >
      <span className="text-yellow-400">{icon}</span>
      {label}
    </Link>
  );
}