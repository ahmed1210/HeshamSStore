"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCartCount } from "@/utils/cartStorage";

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("hesham-theme") || "dark";
    setTheme(savedTheme);

    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }

    updateCartCount();

    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  const updateCartCount = () => {
    setCartCount(getCartCount());
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

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "New", href: "/products?tag=New%20Arrival" },
    { label: "Best Sellers", href: "products?tag=Best%20Sale" },
    { label: "Sale", href: "/products?tag=Sale" },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-yellow-400/20 bg-black/90 text-white backdrop-blur-2xl">
      <div className="bg-yellow-400 px-4 py-2 text-center text-xs font-black uppercase tracking-[0.22em] text-black">
        Free delivery from 2000 EGP
      </div>

      <nav className="container flex min-h-[78px] items-center justify-between gap-4">
        <div className="group flex items-center gap-3">
  <Link
    href="/admin/login"
    onClick={closeMenu}
    title="Admin Login"
    className="flex h-12 w-12 items-center justify-center rounded-full border border-yellow-400 bg-yellow-400 text-lg font-black text-black shadow-lg shadow-yellow-400/20 transition hover:scale-105"
  >
    HS
  </Link>

  <Link href="/" onClick={closeMenu} className="leading-none">
    <h1 className="text-lg font-black uppercase tracking-[0.12em] text-white">
      Hesham
    </h1>
    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-400">
      Store
    </p>
  </Link>
</div>

        <div className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-black uppercase tracking-[0.12em] text-zinc-200 transition hover:text-yellow-400"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden rounded-full border border-white/15 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:border-yellow-400 hover:text-yellow-400 sm:block"
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>

          <Link
            href="/cart"
            data-cart-icon
            className="relative flex h-11 min-w-11 items-center justify-center rounded-full border border-white/15 px-3 text-lg transition hover:border-yellow-400 hover:text-yellow-400"
            aria-label="Cart"
          >
            🛒

            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-yellow-400 px-1.5 text-xs font-black text-black shadow-lg shadow-yellow-400/25">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-xl font-black text-white lg:hidden"
            aria-label="Open menu"
          >
            {menuOpen ? "×" : "☰"}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-white/10 bg-black/95 lg:hidden">
          <div className="container flex flex-col gap-2 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-yellow-400 hover:text-black"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/cart"
              onClick={closeMenu}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-yellow-400 hover:text-black"
            >
              <span>Cart</span>
              <span className="rounded-full bg-yellow-400 px-2 py-1 text-xs font-black text-black">
                {cartCount}
              </span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-2xl border border-white/15 px-4 py-3 text-left text-sm font-black uppercase tracking-[0.12em] text-white"
            >
              Switch to {theme === "light" ? "Dark" : "Light"} Mode
            </button>

            <Link
              href="/admin/login"
              onClick={closeMenu}
              className="rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-zinc-400 transition hover:bg-zinc-900 hover:text-yellow-400"
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}