"use client";
import AdminHeader from "@/components/AdminHeader";
import { apiUrl } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import {
  Tags,
  Plus,
  Trash2,
  Edit,
  X,
  Search,
  RefreshCw,
  Layers,
  Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminCategoriesBrandsPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [newCategory, setNewCategory] = useState("");
  const [newBrand, setNewBrand] = useState("");

  const [editingCategory, setEditingCategory] = useState(null);
  const [editingBrand, setEditingBrand] = useState(null);

  const [categoryEditValue, setCategoryEditValue] = useState("");
  const [brandEditValue, setBrandEditValue] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
    setMessage("");
    setError("");

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

  const categories = useMemo(() => {
    const map = {};

    products.forEach((product) => {
      const category = product.category || "uncategorized";

      if (!map[category]) {
        map[category] = {
          name: category,
          count: 0,
          products: [],
        };
      }

      map[category].count += 1;
      map[category].products.push(product);
    });

    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const brands = useMemo(() => {
    const map = {};

    products.forEach((product) => {
      const brand = product.brand || "No Brand";

      if (!map[brand]) {
        map[brand] = {
          name: brand,
          count: 0,
          products: [],
        };
      }

      map[brand].count += 1;
      map[brand].products.push(product);
    });

    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(search.toLowerCase())
  );

  const updateProduct = async (product, updates) => {
    const token = getAdminToken();

    if (!token) {
      logoutAndRedirect();
      return false;
    }

   const res = await fetch(apiUrl(`/api/products/${product.id}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...product,
        ...updates,
      }),
    });

    const data = await res.json();

    if (res.status === 401 || res.status === 403) {
      logoutAndRedirect();
      return false;
    }

    if (!res.ok) {
      setError(data.message || "Could not update product.");
      return false;
    }

    return true;
  };

  const addCategory = async (e) => {
    e.preventDefault();

    const cleanCategory = newCategory.trim().toLowerCase();

    if (!cleanCategory) {
      setError("Category name is required.");
      return;
    }

    const exists = categories.some(
      (category) => category.name.toLowerCase() === cleanCategory
    );

    if (exists) {
      setError("This category already exists.");
      return;
    }

    setMessage(
      `Category "${cleanCategory}" is ready. Add or edit products and choose this category.`
    );
    setError("");
    setNewCategory("");
  };

  const addBrand = async (e) => {
    e.preventDefault();

    const cleanBrand = newBrand.trim();

    if (!cleanBrand) {
      setError("Brand name is required.");
      return;
    }

    const exists = brands.some(
      (brand) => brand.name.toLowerCase() === cleanBrand.toLowerCase()
    );

    if (exists) {
      setError("This brand already exists.");
      return;
    }

    setMessage(
      `Brand "${cleanBrand}" is ready. Add or edit products and choose this brand.`
    );
    setError("");
    setNewBrand("");
  };

  const startEditCategory = (categoryName) => {
    setEditingCategory(categoryName);
    setCategoryEditValue(categoryName);
    setMessage("");
    setError("");
  };

  const startEditBrand = (brandName) => {
    setEditingBrand(brandName);
    setBrandEditValue(brandName);
    setMessage("");
    setError("");
  };

  const saveCategoryRename = async () => {
    const oldName = editingCategory;
    const newName = categoryEditValue.trim().toLowerCase();

    if (!oldName || !newName) {
      setError("Category name is required.");
      return;
    }

    const productsToUpdate = products.filter(
      (product) => String(product.category || "").toLowerCase() === oldName
    );

    for (const product of productsToUpdate) {
      const ok = await updateProduct(product, { category: newName });
      if (!ok) return;
    }

    setMessage(`Category renamed from "${oldName}" to "${newName}".`);
    setEditingCategory(null);
    setCategoryEditValue("");
    fetchProducts();
  };

  const saveBrandRename = async () => {
    const oldName = editingBrand;
    const newName = brandEditValue.trim();

    if (!oldName || !newName) {
      setError("Brand name is required.");
      return;
    }

    const productsToUpdate = products.filter(
      (product) => String(product.brand || "No Brand") === oldName
    );

    for (const product of productsToUpdate) {
      const ok = await updateProduct(product, { brand: newName });
      if (!ok) return;
    }

    setMessage(`Brand renamed from "${oldName}" to "${newName}".`);
    setEditingBrand(null);
    setBrandEditValue("");
    fetchProducts();
  };

  const deleteCategory = async (categoryName) => {
    const confirmDelete = confirm(
      `Delete category "${categoryName}" from all products? Products will become "uncategorized".`
    );

    if (!confirmDelete) return;

    const productsToUpdate = products.filter(
      (product) => String(product.category || "").toLowerCase() === categoryName
    );

    for (const product of productsToUpdate) {
      const ok = await updateProduct(product, { category: "uncategorized" });
      if (!ok) return;
    }

    setMessage(`Category "${categoryName}" removed from products.`);
    fetchProducts();
  };

  const deleteBrand = async (brandName) => {
    const confirmDelete = confirm(
      `Delete brand "${brandName}" from all products? Products will become "No Brand".`
    );

    if (!confirmDelete) return;

    const productsToUpdate = products.filter(
      (product) => String(product.brand || "No Brand") === brandName
    );

    for (const product of productsToUpdate) {
      const ok = await updateProduct(product, { brand: "" });
      if (!ok) return;
    }

    setMessage(`Brand "${brandName}" removed from products.`);
    fetchProducts();
  };

  return (
    <main className="min-h-screen bg-transparent py-20">
      <div className="container">
        <section className="glass-panel mb-8 rounded-[2rem] p-6 shadow-2xl shadow-yellow-400/10 md:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-black/20 px-4 py-2 text-sm font-bold text-yellow-400 backdrop-blur-md">
                <Tags size={16} />
                Categories & Brands
              </div>

              <h1 className="theme-text text-4xl font-black md:text-5xl">
                Categories & <span className="text-yellow-400">Brands</span>
              </h1>

              <p className="theme-muted mt-3 max-w-3xl">
                Manage product categories and brands. Rename or remove them
                from all related products.
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

        <section className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-yellow-400/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/40 bg-yellow-400/10 text-yellow-400">
              <Layers size={24} />
            </div>
            <p className="theme-muted">Categories</p>
            <h2 className="mt-2 text-3xl font-black text-yellow-400">
              {categories.length}
            </h2>
          </div>

          <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-yellow-400/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/40 bg-yellow-400/10 text-yellow-400">
              <Building2 size={24} />
            </div>
            <p className="theme-muted">Brands</p>
            <h2 className="mt-2 text-3xl font-black text-yellow-400">
              {brands.length}
            </h2>
          </div>

          <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-yellow-400/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/40 bg-yellow-400/10 text-yellow-400">
              <Tags size={24} />
            </div>
            <p className="theme-muted">Products</p>
            <h2 className="mt-2 text-3xl font-black text-yellow-400">
              {products.length}
            </h2>
          </div>
        </section>

        <section className="glass-panel sticky top-24 z-30 mb-8 rounded-[2rem] p-5 shadow-2xl shadow-yellow-400/10">
          <div className="theme-input flex items-center gap-2 rounded-2xl px-4">
            <Search size={18} className="text-yellow-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories or brands..."
              className="theme-text w-full bg-transparent py-3 outline-none"
            />
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
            Loading categories and brands...
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="glass-panel rounded-4xl p-6 shadow-2xl shadow-yellow-400/10">
              <div className="mb-6 flex items-center gap-2 text-yellow-400">
                <Layers size={20} />
                <h2 className="text-2xl font-black">Categories</h2>
              </div>

              <form onSubmit={addCategory} className="mb-6 flex gap-3">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category name"
                  className="theme-input flex-1 rounded-2xl px-4 py-3 outline-none"
                />

                <button className="flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 font-black text-black transition hover:bg-yellow-300">
                  <Plus size={18} />
                  Add
                </button>
              </form>

              <div className="space-y-3">
                {filteredCategories.map((category) => (
                  <div
                    key={category.name}
                    className="rounded-2xl border border-yellow-400/20 bg-black/10 p-4"
                  >
                    {editingCategory === category.name ? (
                      <div className="flex flex-col gap-3 md:flex-row">
                        <input
                          value={categoryEditValue}
                          onChange={(e) =>
                            setCategoryEditValue(e.target.value)
                          }
                          className="theme-input flex-1 rounded-2xl px-4 py-3 outline-none"
                        />

                        <button
                          type="button"
                          onClick={saveCategoryRename}
                          className="rounded-2xl bg-yellow-400 px-5 py-3 font-black text-black"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className="rounded-2xl border border-red-500/40 px-5 py-3 font-black text-red-500"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                          <h3 className="theme-text text-xl font-black capitalize">
                            {category.name}
                          </h3>
                          <p className="theme-muted text-sm">
                            {category.count} product
                            {category.count === 1 ? "" : "s"}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => startEditCategory(category.name)}
                            className="rounded-xl bg-yellow-400 px-4 py-2 font-bold text-black"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() => deleteCategory(category.name)}
                            className="rounded-xl border border-red-500 px-4 py-2 font-bold text-red-500 transition hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {filteredCategories.length === 0 && (
                  <p className="theme-muted text-center">
                    No categories found.
                  </p>
                )}
              </div>
            </section>

            <section className="glass-panel rounded-[2rem] p-6 shadow-2xl shadow-yellow-400/10">
              <div className="mb-6 flex items-center gap-2 text-yellow-400">
                <Building2 size={20} />
                <h2 className="text-2xl font-black">Brands</h2>
              </div>

              <form onSubmit={addBrand} className="mb-6 flex gap-3">
                <input
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="New brand name"
                  className="theme-input flex-1 rounded-2xl px-4 py-3 outline-none"
                />

                <button className="flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 font-black text-black transition hover:bg-yellow-300">
                  <Plus size={18} />
                  Add
                </button>
              </form>

              <div className="space-y-3">
                {filteredBrands.map((brand) => (
                  <div
                    key={brand.name}
                    className="rounded-2xl border border-yellow-400/20 bg-black/10 p-4"
                  >
                    {editingBrand === brand.name ? (
                      <div className="flex flex-col gap-3 md:flex-row">
                        <input
                          value={brandEditValue}
                          onChange={(e) => setBrandEditValue(e.target.value)}
                          className="theme-input flex-1 rounded-2xl px-4 py-3 outline-none"
                        />

                        <button
                          type="button"
                          onClick={saveBrandRename}
                          className="rounded-2xl bg-yellow-400 px-5 py-3 font-black text-black"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingBrand(null)}
                          className="rounded-2xl border border-red-500/40 px-5 py-3 font-black text-red-500"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                          <h3 className="theme-text text-xl font-black">
                            {brand.name}
                          </h3>
                          <p className="theme-muted text-sm">
                            {brand.count} product{brand.count === 1 ? "" : "s"}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => startEditBrand(brand.name)}
                            className="rounded-xl bg-yellow-400 px-4 py-2 font-bold text-black"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() => deleteBrand(brand.name)}
                            className="rounded-xl border border-red-500 px-4 py-2 font-bold text-red-500 transition hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {filteredBrands.length === 0 && (
                  <p className="theme-muted text-center">No brands found.</p>
                )}
              </div>
            </section>
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-yellow-400/25 bg-yellow-400/10 p-5 text-yellow-400">
          <p className="font-bold">
            Note: with the current in-memory backend, added standalone category
            or brand names are not permanently stored unless assigned to a
            product. Later, with Supabase, categories and brands will have their
            own database tables and will save permanently.
          </p>
        </div>
      </div>
    </main>
  );
}