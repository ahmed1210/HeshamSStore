"use client";

import { apiUrl } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, ArrowRight, Tag, ShoppingBag } from "lucide-react";

const getImage = (product) => {
  const rawImage =
    product?.image ||
    product?.imageUrl ||
    product?.photo ||
    product?.thumbnail ||
    product?.images?.[0] ||
    "";

  return rawImage;
};

const getTags = (product) => {
  if (Array.isArray(product?.tags)) {
    return product.tags.join(", ");
  }

  return String(product?.tags || product?.tag || product?.label || "");
};

export default function SearchOverlay({ open, onClose }) {
  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    loadData();

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [productsRes, brandsRes, categoriesRes] = await Promise.all([
        fetch(apiUrl("/api/products")),
        fetch(apiUrl("/api/brands")),
        fetch(apiUrl("/api/categories")),
      ]);

      const productsData = await productsRes.json();
      const brandsData = await brandsRes.json();
      const categoriesData = await categoriesRes.json();

      setProducts(Array.isArray(productsData) ? productsData : []);
      setBrands(Array.isArray(brandsData) ? brandsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch {
      setProducts([]);
      setBrands([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const cleanQuery = query.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    if (!cleanQuery) {
      return products
        .filter((product) => product.isActive !== false)
        .slice(0, 8);
    }

    return products
      .filter((product) => {
        if (product.isActive === false) return false;

        const searchable = [
          product.name,
          product.brand,
          product.category,
          product.description,
          getTags(product),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(cleanQuery);
      })
      .slice(0, 10);
  }, [products, cleanQuery]);

  const filteredBrands = useMemo(() => {
    return brands
      .filter((brand) => {
        if (brand.active === false) return false;
        if (!cleanQuery) return true;

        return String(brand.name || "")
          .toLowerCase()
          .includes(cleanQuery);
      })
      .slice(0, 6);
  }, [brands, cleanQuery]);

  const filteredCategories = useMemo(() => {
    return categories
      .filter((category) => {
        if (category.active === false) return false;
        if (!cleanQuery) return true;

        return String(category.name || "")
          .toLowerCase()
          .includes(cleanQuery);
      })
      .slice(0, 6);
  }, [categories, cleanQuery]);

  const suggestions = useMemo(() => {
    const base = [];

    products.forEach((product) => {
      if (product.name) base.push(product.name);
      if (product.brand) base.push(product.brand);
      if (product.category) base.push(product.category);
    });

    brands.forEach((brand) => {
      if (brand.name) base.push(brand.name);
    });

    categories.forEach((category) => {
      if (category.name) base.push(category.name);
    });

    const unique = Array.from(new Set(base.map((item) => String(item).trim())))
      .filter(Boolean)
      .filter((item) => {
        if (!cleanQuery) return true;
        return item.toLowerCase().includes(cleanQuery);
      })
      .slice(0, 8);

    return unique;
  }, [products, brands, categories, cleanQuery]);

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-white text-black">
      <div className="sticky top-0 z-20 border-b border-black/10 bg-white px-4 py-5 md:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="mx-auto flex h-14 max-w-7xl items-center gap-4 rounded-2xl bg-zinc-100 px-4"
        >
          <Search size={22} className="text-black" />

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands, categories..."
            className="h-full flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-zinc-400"
          />

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="text-sm font-black uppercase tracking-[0.12em] text-black"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/10"
            aria-label="Close search"
          >
            <X size={22} />
          </button>
        </form>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-[270px_1fr] md:px-8">
        <aside className="space-y-8">
          <div>
            <h2 className="border-b border-black/10 pb-3 text-lg font-black">
              Suggestions
            </h2>

            <div className="mt-4 space-y-3">
              {suggestions.length > 0 ? (
                suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuery(item)}
                    className={`block text-left text-sm ${
                      item.toLowerCase() === cleanQuery
                        ? "font-black"
                        : "font-semibold text-zinc-700"
                    } hover:text-black`}
                  >
                    {item}
                  </button>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No suggestions.</p>
              )}
            </div>
          </div>

          {filteredBrands.length > 0 && (
            <div>
              <h2 className="border-b border-black/10 pb-3 text-lg font-black">
                Brands
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {filteredBrands.map((brand) => (
                  <Link
                    key={brand.id || brand.slug}
                    href={`/products?brand=${encodeURIComponent(
                      brand.slug || brand.name
                    )}`}
                    onClick={onClose}
                    className="flex h-20 items-center justify-center rounded-2xl border border-black/10 bg-white p-3 text-center text-xs font-black uppercase tracking-[0.12em] transition hover:border-black"
                  >
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="max-h-12 max-w-full object-contain"
                      />
                    ) : (
                      brand.name
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {filteredCategories.length > 0 && (
            <div>
              <h2 className="border-b border-black/10 pb-3 text-lg font-black">
                Categories
              </h2>

              <div className="mt-4 space-y-2">
                {filteredCategories.map((category) => (
                  <Link
                    key={category.id || category.slug}
                    href={`/products?category=${encodeURIComponent(
                      category.slug || category.name
                    )}`}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm font-bold transition hover:border-black"
                  >
                    {category.name}
                    <ArrowRight size={15} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section>
          <div className="mb-5 flex items-center justify-between border-b border-black/10 pb-3">
            <h2 className="text-lg font-black">Products</h2>

            {cleanQuery && (
              <Link
                href={`/products?search=${encodeURIComponent(query.trim())}`}
                onClick={onClose}
                className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em]"
              >
                View all
                <ArrowRight size={16} />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-2xl bg-zinc-100"
                />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredProducts.map((product) => {
                const image = getImage(product);
                const price = Number(product.price || 0);
                const oldPrice = Number(product.oldPrice || product.old_price || 0);

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    onClick={onClose}
                    className="group flex gap-5 rounded-3xl border border-black/10 bg-white p-4 transition hover:border-black"
                  >
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-100">
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <ShoppingBag className="text-zinc-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">
                        {product.brand || product.category || "Hesham Store"}
                      </p>

                      <h3 className="mt-2 line-clamp-2 text-lg font-black">
                        {product.name || "Unnamed Product"}
                      </h3>

                      <div className="mt-3 flex items-center gap-3">
                        <span className="font-black">
                          {price.toLocaleString()} EGP
                        </span>

                        {oldPrice > price && (
                          <span className="text-sm font-bold text-zinc-400 line-through">
                            {oldPrice.toLocaleString()} EGP
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs font-bold text-zinc-500">
                        <Tag size={14} />
                        {getTags(product) || "Product"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-black/10 bg-zinc-50 p-10 text-center">
              <h3 className="text-2xl font-black">No products found</h3>
              <p className="mt-2 text-zinc-500">
                Try another product name, brand, or category.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}