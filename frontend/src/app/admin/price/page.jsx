"use client";
import AdminHeader from "@/components/AdminHeader";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  AlertTriangle,
  RefreshCw,
  Save,
  Search,
  Package,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

export default function AdminPriceStockPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [editedProducts, setEditedProducts] = useState({});
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const getAdminToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("adminToken");
  };

  const logoutAndRedirect = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    router.push("/admin/login");
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    const token = getAdminToken();

    if (!token) {
      logoutAndRedirect();
      return;
    }

    try {
      const res = await fetch(apiUrl("/api/products"));
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        setProducts([]);
        setError(data.message || "Could not load products.");
        return;
      }

      setProducts(data);

      const initialEdits = {};

      data.forEach((product) => {
        initialEdits[product.id] = {
          price: product.price || 0,
          oldPrice: product.oldPrice || 0,
          sizeStock: product.sizeStock || {},
        };
      });

      setEditedProducts(initialEdits);
    } catch {
      setProducts([]);
      setError("Cannot connect to backend. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const updateField = (productId, field, value) => {
    setEditedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const updateSizeStock = (productId, size, value) => {
    setEditedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        sizeStock: {
          ...(prev[productId]?.sizeStock || {}),
          [size]: Number(value),
        },
      },
    }));
  };

  const getEditedTotalStock = (productId) => {
    const stock = editedProducts[productId]?.sizeStock || {};

    return Object.values(stock).reduce(
      (sum, qty) => sum + Number(qty || 0),
      0
    );
  };

  const saveProductPriceStock = async (product) => {
    const token = getAdminToken();

    if (!token) {
      logoutAndRedirect();
      return;
    }

    const edited = editedProducts[product.id];

    if (!edited) {
      setError("No edits found for this product.");
      return;
    }

    setSavingId(product.id);
    setError("");
    setMessage("");

    try {
      const payload = {
        ...product,
        price: Number(edited.price || 0),
        oldPrice: Number(edited.oldPrice || 0),
        sizeStock: edited.sizeStock || {},
      };

    const res = await fetch(apiUrl(`/api/products/${product.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        logoutAndRedirect();
        return;
      }

      if (!res.ok) {
        setError(data.message || "Could not save product.");
        return;
      }

      setMessage(`${product.name} price and stock updated successfully.`);
      fetchProducts();
    } catch {
      setError("Cannot save changes. Make sure backend is running.");
    } finally {
      setSavingId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => product.isActive !== false);

    const searchText = search.toLowerCase().trim();

    if (searchText) {
      result = result.filter(
        (product) =>
          String(product.name || "").toLowerCase().includes(searchText) ||
          String(product.brand || "").toLowerCase().includes(searchText) ||
          String(product.category || "").toLowerCase().includes(searchText)
      );
    }

    if (stockFilter === "available") {
      result = result.filter((product) => Number(product.quantity || 0) > 0);
    }

    if (stockFilter === "low") {
      result = result.filter(
        (product) =>
          Number(product.quantity || 0) > 0 && Number(product.quantity || 0) <= 3
      );
    }

    if (stockFilter === "out") {
      result = result.filter((product) => Number(product.quantity || 0) <= 0);
    }

    return result;
  }, [products, search, stockFilter]);

  const activeProducts = products.filter((product) => product.isActive !== false);

  const totalStock = activeProducts.reduce(
    (sum, product) => sum + Number(product.quantity || 0),
    0
  );

  const lowStockCount = activeProducts.filter(
    (product) =>
      Number(product.quantity || 0) > 0 && Number(product.quantity || 0) <= 3
  ).length;

  const outStockCount = activeProducts.filter(
    (product) => Number(product.quantity || 0) <= 0
  ).length;

  const averagePrice =
    activeProducts.length > 0
      ? Math.round(
          activeProducts.reduce(
            (sum, product) => sum + Number(product.price || 0),
            0
          ) / activeProducts.length
        )
      : 0;

  return (
    <main className="min-h-screen bg-transparent py-20">
      <div className="container">
        <section className="glass-panel mb-8 rounded-[2rem] p-6 shadow-2xl shadow-yellow-400/10 md:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-black/20 px-4 py-2 text-sm font-bold text-yellow-400 backdrop-blur-md">
                <BadgeDollarSign size={16} />
                Fast Price & Stock Control
              </div>

              <h1 className="theme-text text-4xl font-black md:text-5xl">
                Price & <span className="text-yellow-400">Stock</span>
              </h1>

              <p className="theme-muted mt-3 max-w-3xl">
                Quickly update product price, old price, and stock quantity per
                size without opening the full product editor.
              </p>
            </div>

            <button
              onClick={fetchProducts}
              className="flex w-fit items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-4 font-black text-black transition hover:bg-yellow-300"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </section>

        <section className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-yellow-400/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/40 bg-yellow-400/10 text-yellow-400">
              <Package size={24} />
            </div>
            <p className="theme-muted">Total Stock</p>
            <h2 className="mt-2 text-3xl font-black text-yellow-400">
              {totalStock}
            </h2>
          </div>

          <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-yellow-400/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/40 bg-yellow-400/10 text-yellow-400">
              <BadgeDollarSign size={24} />
            </div>
            <p className="theme-muted">Average Price</p>
            <h2 className="mt-2 text-3xl font-black text-yellow-400">
              {averagePrice} EGP
            </h2>
          </div>

          <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-yellow-400/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/40 bg-orange-500/10 text-orange-500">
              <TrendingDown size={24} />
            </div>
            <p className="theme-muted">Low Stock</p>
            <h2 className="mt-2 text-3xl font-black text-orange-500">
              {lowStockCount}
            </h2>
          </div>

          <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-yellow-400/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 text-red-500">
              <AlertTriangle size={24} />
            </div>
            <p className="theme-muted">Out of Stock</p>
            <h2 className="mt-2 text-3xl font-black text-red-500">
              {outStockCount}
            </h2>
          </div>
        </section>

        <section className="glass-panel sticky top-24 z-30 mb-8 rounded-[2rem] p-5 shadow-2xl shadow-yellow-400/10">
          <div className="grid gap-4 md:grid-cols-[1fr_240px]">
            <div className="theme-input flex items-center gap-2 rounded-2xl px-4">
              <Search size={18} className="text-yellow-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product, brand, or category..."
                className="theme-text w-full bg-transparent py-3 outline-none"
              />
            </div>

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
          </div>
        </section>

        {message && (
          <div className="mb-6 rounded-2xl border border-green-500/40 bg-green-500/10 p-4 font-bold text-green-500">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 font-bold text-red-500">
            {error}
          </div>
        )}

        {loading ? (
          <div className="glass-panel rounded-3xl p-10 text-center theme-text">
            Loading price and stock...
          </div>
        ) : (
          <section className="space-y-5">
            {filteredProducts.map((product) => {
              const edited = editedProducts[product.id] || {
                price: product.price,
                oldPrice: product.oldPrice,
                sizeStock: product.sizeStock || {},
              };

              const editedTotalStock = getEditedTotalStock(product.id);

              return (
                <article
                  key={product.id}
                  className="glass-panel rounded-[2rem] p-5 shadow-2xl shadow-yellow-400/10 md:p-6"
                >
                  <div className="grid gap-6 lg:grid-cols-[260px_1fr_auto] lg:items-start">
                    <div className="flex gap-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-24 w-24 rounded-2xl object-cover"
                      />

                      <div>
                        <h2 className="theme-text text-xl font-black">
                          {product.name}
                        </h2>

                        <p className="theme-muted mt-1 text-sm">
                          {product.brand || "No brand"} · {product.category}
                        </p>

                        <span
                          className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-black ${
                            editedTotalStock <= 0
                              ? "bg-red-500/10 text-red-500"
                              : editedTotalStock <= 3
                              ? "bg-orange-500/10 text-orange-500"
                              : "bg-yellow-400/10 text-yellow-400"
                          }`}
                        >
                          Total stock: {editedTotalStock}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="theme-muted mb-2 block text-sm font-bold">
                            Current Price
                          </label>

                          <div className="theme-input flex items-center rounded-2xl px-4">
                            <input
                              type="number"
                              min="0"
                              value={edited.price}
                              onChange={(e) =>
                                updateField(product.id, "price", e.target.value)
                              }
                              className="theme-text w-full bg-transparent py-3 outline-none"
                            />
                            <span className="font-bold text-yellow-400">
                              EGP
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="theme-muted mb-2 block text-sm font-bold">
                            Old Price
                          </label>

                          <div className="theme-input flex items-center rounded-2xl px-4">
                            <input
                              type="number"
                              min="0"
                              value={edited.oldPrice}
                              onChange={(e) =>
                                updateField(
                                  product.id,
                                  "oldPrice",
                                  e.target.value
                                )
                              }
                              className="theme-text w-full bg-transparent py-3 outline-none"
                            />
                            <span className="font-bold text-yellow-400">
                              EGP
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-yellow-400/25 bg-black/10 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h3 className="font-black text-yellow-400">
                            Stock Per Size
                          </h3>

                          {Number(edited.oldPrice) > Number(edited.price) &&
                            Number(edited.price) > 0 && (
                              <span className="rounded-full border border-green-500/40 bg-green-500/10 px-3 py-1 text-xs font-black text-green-500">
                                Sale Active
                              </span>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
                          {(product.sizes || Object.keys(edited.sizeStock || {})).map(
                            (size) => (
                              <div key={size}>
                                <label className="theme-muted mb-2 block text-xs font-bold">
                                  Size {size}
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  value={edited.sizeStock?.[size] ?? 0}
                                  onChange={(e) =>
                                    updateSizeStock(
                                      product.id,
                                      size,
                                      e.target.value
                                    )
                                  }
                                  className={`w-full rounded-2xl border px-4 py-3 outline-none backdrop-blur-xl ${
                                    Number(edited.sizeStock?.[size] || 0) <= 0
                                      ? "border-red-500/40 bg-red-500/10 text-red-500"
                                      : Number(edited.sizeStock?.[size] || 0) <=
                                        3
                                      ? "border-orange-500/40 bg-orange-500/10 text-orange-500"
                                      : "border-yellow-400/40 bg-black/10 text-yellow-400"
                                  }`}
                                />
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                      <button
                        onClick={() => saveProductPriceStock(product)}
                        disabled={savingId === product.id}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-4 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 lg:w-fit"
                      >
                        <Save size={18} />
                        {savingId === product.id ? "Saving..." : "Save"}
                      </button>

                      <div className="rounded-2xl border border-yellow-400/25 bg-black/10 p-4 text-right">
                        <p className="theme-muted text-sm">Preview</p>

                        <p className="mt-1 text-2xl font-black text-yellow-400">
                          {edited.price} EGP
                        </p>

                        {Number(edited.oldPrice) > 0 && (
                          <p className="theme-muted text-sm line-through">
                            {edited.oldPrice} EGP
                          </p>
                        )}

                        {Number(edited.oldPrice) > Number(edited.price) &&
                          Number(edited.price) > 0 && (
                            <p className="mt-1 text-sm font-bold text-green-500">
                              Discount:{" "}
                              {Math.round(
                                ((Number(edited.oldPrice) -
                                  Number(edited.price)) /
                                  Number(edited.oldPrice)) *
                                  100
                              )}
                              %
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="glass-panel rounded-[2rem] p-12 text-center">
                <h2 className="theme-text text-2xl font-black">
                  No products found
                </h2>
                <p className="theme-muted mt-3">
                  Try changing the search or stock filter.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}