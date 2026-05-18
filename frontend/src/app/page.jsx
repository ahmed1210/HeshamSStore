"use client";
import { apiUrl } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";

export default function HomePage() {
  


  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const heroImage =
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1600";

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const res = await fetch(apiUrl("/api/products"));
      const data = await res.json();

      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getTag = (product) => {
    return String(product.tag || product.label || "").toLowerCase();
  };

  const getCategory = (product) => {
    return String(product.category || "").toLowerCase();
  };

  const newArrivals = useMemo(() => {
    const tagged = products.filter((product) =>
      getTag(product).includes("new")
    );

    return tagged.length ? tagged.slice(0, 4) : products.slice(0, 4);
  }, [products]);

  const bestSellers = useMemo(() => {
    const tagged = products.filter(
      (product) =>
        getTag(product).includes("best") ||
        getTag(product).includes("trending") ||
        getTag(product).includes("featured")
    );

    return tagged.length ? tagged.slice(0, 4) : products.slice(0, 4);
  }, [products]);

  const saleProducts = useMemo(() => {
    const tagged = products.filter((product) => {
      const oldPrice = Number(product.oldPrice || product.old_price || 0);
      const price = Number(product.price || 0);

      return getTag(product).includes("sale") || oldPrice > price;
    });

    return tagged.slice(0, 4);
  }, [products]);

  const categoryBlocks = [
    {
      title: "Men",
      text: "Everyday sneakers with strong street energy.",
      href: "/products?category=men",
      image:
        "https://images.unsplash.com/photo-1543508282-6319a3e2621f?q=80&w=1200",
    },
    {
      title: "Women",
      text: "Clean silhouettes, bold colors, premium daily style.",
      href: "/products?category=women",
      image:
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200",
    },
    {
      title: "Kids",
      text: "Comfortable sneakers built for movement.",
      href: "/products?category=kids",
      image:
        "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?q=80&w=1200",
    },
  ];

  return (
    <main className="min-h-screen bg-(--page-bg) text-(--text-main)">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Hesham Store sneakers"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-0 bg-linear-to-r from-black via-black/70 to-transparent" />
        </div>

        <div className="container relative z-10 flex min-h-155 items-center py-20">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full border border-yellow-400/50 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
              New season drops
            </p>

            <h1 className="text-5xl font-black uppercase leading-[0.95] tracking-tight text-white md:text-7xl lg:text-8xl">
              Hesham
              <span className="block text-yellow-400">Store</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-zinc-300 md:text-xl">
              Premium sneakers. Built for daily street style. Clean silhouettes,
              bold details, and comfort that moves with you.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="rounded-full bg-yellow-400 px-8 py-4 text-center text-sm font-black uppercase tracking-[0.15em] text-black shadow-xl shadow-yellow-400/25 transition hover:bg-yellow-300"
              >
                Shop Now
              </Link>

              <Link
                href="/products?tag=New Arrival"
                className="rounded-full border border-white/25 bg-white/10 px-8 py-4 text-center text-sm font-black uppercase tracking-[0.15em] text-white backdrop-blur-xl transition hover:border-yellow-400 hover:text-yellow-400"
              >
                New Arrivals
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-yellow-400/20 bg-black py-4 text-white">
        <div className="container flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs font-black uppercase tracking-[0.22em] text-zinc-300">
          <span>Free delivery from 2000 EGP</span>
          <span className="text-yellow-400">New drops weekly</span>
          <span>Secure checkout</span>
          <span className="text-yellow-400">Cash / Visa / E-wallet</span>
        </div>
      </section>

      <section className="container py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
              Collections
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase theme-text md:text-5xl">
              Shop by Category
            </h2>
          </div>

          <Link
            href="/products"
            className="text-sm font-black uppercase tracking-[0.15em] text-yellow-400 hover:text-yellow-300"
          >
            View all products →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {categoryBlocks.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="group relative min-h-85 overflow-hidden rounded-4xl border border-yellow-400/20 bg-black"
            >
              <img
                src={category.image}
                alt={category.title}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/45 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-3xl font-black uppercase text-white">
                  {category.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm font-semibold leading-6 text-zinc-300">
                  {category.text}
                </p>

                <span className="mt-5 inline-flex rounded-full bg-yellow-400 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-black">
                  Shop {category.title}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <ProductSection
        title="New Arrivals"
        eyebrow="Fresh drops"
        href="/products?tag=New Arrival"
        products={newArrivals}
        loading={loading}
      />

      <ProductSection
        title="Best Sellers"
        eyebrow="Most wanted"
        href="/products?tag=Best Sale"
        products={bestSellers}
        loading={loading}
      />

      <section className="container py-16">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-yellow-400/25 bg-black p-8 md:p-12">
          <div className="absolute right-0 top-0 h-full w-full opacity-25 md:w-1/2">
            <img
              src="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1400"
              alt="Sale sneakers"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
              Limited sale
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase leading-none text-white md:text-6xl">
              Street style
              <span className="block text-yellow-400">better price</span>
            </h2>

            <p className="mt-5 max-w-lg text-zinc-300">
              Explore selected sneakers with special prices. Limited stock,
              fresh looks, and fast checkout.
            </p>

            <Link
              href="/products?tag=Sale"
              className="mt-7 inline-flex rounded-full bg-yellow-400 px-8 py-4 text-sm font-black uppercase tracking-[0.15em] text-black transition hover:bg-yellow-300"
            >
              Shop Sale
            </Link>
          </div>
        </div>
      </section>

      {saleProducts.length > 0 && (
        <ProductSection
          title="Sale Picks"
          eyebrow="Special price"
          href="/products?tag=Sale"
          products={saleProducts}
          loading={loading}
        />
      )}
    </main>
  );
}

function ProductSection({ title, eyebrow, href, products, loading }) {
  return (
    <section className="container py-16">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase theme-text md:text-5xl">
            {title}
          </h2>
        </div>

        <Link
          href={href}
          className="text-sm font-black uppercase tracking-[0.15em] text-yellow-400 hover:text-yellow-300"
        >
          View collection →
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-115 animate-pulse rounded-4xl border border-yellow-400/15 bg-white/5"
            />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-4xl border border-yellow-400/20 bg-black/20 p-10 text-center theme-muted">
          No products found in this section.
        </div>
      )}
    </section>
  );
}