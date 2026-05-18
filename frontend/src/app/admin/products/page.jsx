"use client";

import { apiUrl } from "@/lib/api";
import AdminHeader from "@/components/AdminHeader";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Edit,
  ImagePlus,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const emptyForm = {
  name: "",
  brand: "",
  category: "men",
  price: "",
  oldPrice: "",
  description: "",
  image: "",
  sizes: "40, 41, 42, 43",
  tags: "",
  isActive: true,
};

export default function AdminProductsPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [sizeStock, setSizeStock] = useState({});
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    loadCurrentUser();
    loadProducts();
  }, []);

  const getToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("adminToken") || "";
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminEmail");
    router.push("/admin/login");
  };

  const loadCurrentUser = () => {
    try {
      const savedUser = localStorage.getItem("adminUser");
      const savedToken = localStorage.getItem("adminToken");

      if (!savedUser || !savedToken) {
        logout();
        return;
      }

      const parsedUser = JSON.parse(savedUser);

      if (!parsedUser?.role) {
        logout();
        return;
      }

      setCurrentUser(parsedUser);
    } catch {
      logout();
    }
  };

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 5000);
  };

  const handleAuthError = (errorMessage) => {
    const text = String(errorMessage || "").toLowerCase();

    if (
      text.includes("logged in") ||
      text.includes("token") ||
      text.includes("jwt") ||
      text.includes("unauthorized")
    ) {
      logout();
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);

      const res = await fetch(apiUrl("/api/products"));
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load products");
      }

      const productsArray = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.data)
        ? data.data
        : [];

      console.log("Admin products loaded:", productsArray);

      setProducts(productsArray);
    } catch (error) {
      console.error("Load products error:", error);

      const text = String(error.message || "").toLowerCase();

      if (text.includes("failed to fetch")) {
        showMessage(
          "Cannot connect to backend. Please make sure backend is running.",
          "error"
        );
      } else {
        showMessage(error.message || "Could not load products.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const parsedSizes = useMemo(() => {
    return String(form.sizes || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [form.sizes]);

  useEffect(() => {
    setSizeStock((prev) => {
      const nextStock = {};

      parsedSizes.forEach((size) => {
        nextStock[size] = Number(prev[size] ?? 0);
      });

      return nextStock;
    });
  }, [form.sizes]);

  const visibleProducts = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return products.filter((product) => {
      if (!searchText) return true;

      const productTags = Array.isArray(product.tags)
        ? product.tags.join(" ")
        : String(product.tags || "");

      const productText = `${product.name || ""} ${product.brand || ""} ${
        product.category || ""
      } ${productTags}`.toLowerCase();

      return productText.includes(searchText);
    });
  }, [products, search]);

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((item) => item.isActive !== false).length,
      inactive: products.filter((item) => item.isActive === false).length,
      outStock: products.filter((item) => getTotalStock(item) <= 0).length,
    };
  }, [products]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSizeStock({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (["price", "oldPrice"].includes(name)) {
      setForm((prev) => ({
        ...prev,
        [name]: value.replace(/[^\d.]/g, ""),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleStockChange = (size, value) => {
    const cleanValue = value.replace(/[^\d]/g, "");

    setSizeStock((prev) => ({
      ...prev,
      [size]: cleanValue === "" ? "" : Number(cleanValue),
    }));
  };

  const validateForm = () => {
    if (!form.name.trim() || form.name.trim().length < 3) {
      showMessage("Please enter a valid product name.", "error");
      return false;
    }

    if (!form.brand.trim()) {
      showMessage("Please enter product brand.", "error");
      return false;
    }

    if (!form.category.trim()) {
      showMessage("Please select product category.", "error");
      return false;
    }

    if (!Number(form.price) || Number(form.price) <= 0) {
      showMessage("Please enter a valid product price.", "error");
      return false;
    }

    if (form.oldPrice && Number(form.oldPrice) < Number(form.price)) {
      showMessage("Old price should be higher than current price.", "error");
      return false;
    }

    if (parsedSizes.length === 0) {
      showMessage("Please add at least one product size.", "error");
      return false;
    }

    const hasInvalidStock = parsedSizes.some((size) => {
      const stock = Number(sizeStock[size] || 0);
      return !Number.isInteger(stock) || stock < 0;
    });

    if (hasInvalidStock) {
      showMessage("Size stock must be valid numbers.", "error");
      return false;
    }

    if (!form.image.trim()) {
      showMessage("Please upload or add a product image.", "error");
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    const safeSizeStock = {};

    parsedSizes.forEach((size) => {
      safeSizeStock[size] = Number(sizeStock[size] || 0);
    });

    const totalQuantity = Object.values(safeSizeStock).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );

    return {
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category,
      price: Number(form.price || 0),
      oldPrice: Number(form.oldPrice || 0),
      description: form.description.trim(),
      image: form.image.trim(),
      images: [form.image.trim()],
      sizes: parsedSizes,
      sizeStock: safeSizeStock,
      quantity: totalQuantity,
      tags: String(form.tags || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      isActive: form.isActive,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      const url = editingId
        ? apiUrl(`/api/products/${editingId}`)
        : apiUrl("/api/products");

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(buildPayload()),
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        throw new Error(data.message || "You do not have permission");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to save product");
      }

      showMessage(
        editingId
          ? "Product updated successfully."
          : "Product added successfully."
      );

      resetForm();
      loadProducts();
    } catch (error) {
      console.error("Save product error:", error);
      showMessage(error.message || "Could not save product.", "error");
      handleAuthError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    const productSizes = Array.isArray(product.sizes)
      ? product.sizes
      : Object.keys(product.sizeStock || {});

    const productImage =
      product.image ||
      product.imageUrl ||
      product.photo ||
      product.thumbnail ||
      product.images?.[0] ||
      "";

    setEditingId(product.id);

    setForm({
      name: product.name || "",
      brand: product.brand || "",
      category: product.category || "men",
      price: String(product.price || ""),
      oldPrice: String(product.oldPrice || ""),
      description: product.description || "",
      image: productImage,
      sizes: productSizes.length ? productSizes.join(", ") : "40, 41, 42, 43",
      tags: Array.isArray(product.tags)
        ? product.tags.join(", ")
        : String(product.tags || ""),
      isActive: product.isActive !== false,
    });

    setSizeStock(product.sizeStock || {});

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (product) => {
    const confirmDelete = window.confirm(`Delete ${product.name}?`);
    if (!confirmDelete) return;

    try {
      setSaving(true);

      const res = await fetch(apiUrl(`/api/products/${product.id}`), {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        throw new Error(data.message || "You do not have permission");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete product");
      }

      showMessage("Product deleted successfully.");

      if (editingId === product.id) {
        resetForm();
      }

      loadProducts();
    } catch (error) {
      console.error("Delete product error:", error);
      showMessage(error.message || "Could not delete product.", "error");
      handleAuthError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      showMessage("Only JPG, PNG, and WEBP images are allowed.", "error");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage("Image size must be less than 5MB.", "error");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(apiUrl("/api/upload"), {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Image upload failed");
      }

      const imageUrl = data.imageUrl || data.url;

      if (!imageUrl) {
        throw new Error("Upload succeeded but image URL was not returned");
      }

      setForm((prev) => ({
        ...prev,
        image: imageUrl,
      }));

      showMessage("Image uploaded successfully.");
    } catch (error) {
      console.error("Upload image error:", error);

      const text = String(error.message || "").toLowerCase();

      if (text.includes("route not found")) {
        showMessage(
          "Upload route is missing in backend. Please add /api/upload route.",
          "error"
        );
      } else if (text.includes("failed to fetch")) {
        showMessage(
          "Could not connect to backend. Make sure backend is running.",
          "error"
        );
      } else {
        showMessage(error.message || "Could not upload image.", "error");
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (!currentUser) {
    return (
      <main className="admin-page min-h-screen bg-[#020617] p-8 text-white">
        <div className="admin-card p-6 font-bold">Loading products...</div>
      </main>
    );
  }

  return (
    <main className="admin-page min-h-screen bg-[#020617] p-8 text-white">
      <AdminHeader
        currentUser={currentUser}
        title="Products"
        subtitle="Add, edit, delete, upload images, and control product sizes and stock."
      />

      {message && (
        <div
          className={`mb-6 rounded-2xl border p-4 font-bold ${
            messageType === "success"
              ? "border-green-500/40 bg-green-500/10 text-green-400"
              : "border-red-500/40 bg-red-500/10 text-red-400"
          }`}
        >
          {message}
        </div>
      )}

      <section className="admin-stats-grid mb-6 grid sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Products" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Inactive" value={stats.inactive} />
        <StatCard label="Out Stock" value={stats.outStock} />
      </section>

      <section className="products-admin-layout">
        <div className="admin-card p-6">
          <div className="mb-6 flex items-center gap-2 text-yellow-400">
            {editingId ? <Edit size={20} /> : <Plus size={20} />}
            <h2 className="text-xl font-black uppercase">
              {editingId ? "Edit Product" : "Add Product"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Product Name">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="admin-input"
                placeholder="Black Runner Sneakers"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brand">
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="Hesham Brand"
                />
              </Field>

              <Field label="Category">
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="admin-input"
                >
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="kids">Kids</option>
                  <option value="unisex">Unisex</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price">
                <input
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="1499"
                  inputMode="decimal"
                />
              </Field>

              <Field label="Old Price">
                <input
                  name="oldPrice"
                  value={form.oldPrice}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="1899"
                  inputMode="decimal"
                />
              </Field>
            </div>

            <Field label="Sizes">
              <input
                name="sizes"
                value={form.sizes}
                onChange={handleChange}
                className="admin-input"
                placeholder="40, 41, 42, 43"
              />

              <p className="mt-2 text-xs font-bold text-zinc-500">
                Separate sizes with comma.
              </p>
            </Field>

            {parsedSizes.length > 0 && (
              <div className="rounded-2xl border border-yellow-400/20 bg-[#020617] p-4">
                <p className="mb-3 text-sm font-black uppercase text-yellow-400">
                  Stock Per Size
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {parsedSizes.map((size) => (
                    <div key={size}>
                      <label className="mb-1 block text-xs font-bold text-blue-100">
                        Size {size}
                      </label>

                      <input
                        value={sizeStock[size] ?? ""}
                        onChange={(e) =>
                          handleStockChange(size, e.target.value)
                        }
                        className="admin-input"
                        placeholder="0"
                        inputMode="numeric"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Field label="Tags">
              <input
                name="tags"
                value={form.tags}
                onChange={handleChange}
                className="admin-input"
                placeholder="new-arrival, best-sale, sale"
              />
            </Field>

            <Field label="Description">
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="admin-input min-h-[100px] resize-y"
                placeholder="Product description..."
              />
            </Field>

            <Field label="Product Image">
              <div className="rounded-2xl border border-yellow-400/20 bg-[#020617] p-4">
                {form.image ? (
                  <div className="mb-4 overflow-hidden rounded-2xl bg-black">
                    <img
                      src={form.image}
                      alt="Product preview"
                      className="h-48 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex h-40 items-center justify-center rounded-2xl border border-dashed border-yellow-400/30 text-zinc-500">
                    <ImagePlus size={40} />
                  </div>
                )}

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-yellow-400 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:bg-yellow-300">
                  <Upload size={17} />
                  {uploading ? "Uploading..." : "Upload Image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>

                <input
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  className="admin-input mt-3"
                  placeholder="Or paste image URL"
                />
              </div>
            </Field>

            <label className="flex items-center gap-3 rounded-2xl border border-yellow-400/20 bg-[#020617] p-4 font-bold text-blue-100">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />
              Product is active
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || uploading}
                className="admin-btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Product"
                  : "Add Product"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="admin-btn-outline"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-card p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2 text-yellow-400">
              <Package size={22} />
              <h2 className="text-xl font-black uppercase">Products List</h2>
            </div>

            <button
              type="button"
              onClick={loadProducts}
              className="admin-btn-outline w-fit"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-yellow-400/20 bg-[#020617] px-4">
            <Search size={18} className="text-yellow-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent py-3 text-white outline-none"
              placeholder="Search product, brand, category..."
            />
          </div>

          {loading ? (
            <div className="admin-card-dark p-8 text-center font-bold text-zinc-400">
              Loading products...
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="admin-card-dark p-8 text-center">
              <Package className="mx-auto text-yellow-400" size={44} />
              <h3 className="mt-4 text-xl font-black">No products found</h3>
              <p className="mt-2 text-zinc-400">
                Products loaded: {products.length}. Try clearing search or
                check backend response.
              </p>
            </div>
          ) : (
            <>
              <div className="products-desktop-table overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-yellow-400/20 text-yellow-400">
                      <th className="p-4 text-sm font-black uppercase">
                        Product
                      </th>
                      <th className="p-4 text-sm font-black uppercase">
                        Category
                      </th>
                      <th className="p-4 text-sm font-black uppercase">
                        Price
                      </th>
                      <th className="p-4 text-sm font-black uppercase">
                        Stock
                      </th>
                      <th className="p-4 text-sm font-black uppercase">
                        Status
                      </th>
                      <th className="p-4 text-sm font-black uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleProducts.map((product) => (
                      <ProductTableRow
                        key={product.id}
                        product={product}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="products-mobile-cards">
                {visibleProducts.map((product) => (
                  <ProductMobileCard
                    key={product.id}
                    product={product}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-blue-100">
        {label}
      </label>
      {children}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="admin-card p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
        {label}
      </p>

      <strong className="mt-3 block text-3xl font-black text-yellow-400">
        {value}
      </strong>
    </div>
  );
}

function getProductImage(product) {
  return (
    product.image ||
    product.imageUrl ||
    product.photo ||
    product.thumbnail ||
    product.images?.[0] ||
    ""
  );
}

function getTotalStock(product) {
  if (product.sizeStock && typeof product.sizeStock === "object") {
    return Object.values(product.sizeStock).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );
  }

  return Number(product.quantity || product.stock || 0);
}

function ProductTableRow({ product, onEdit, onDelete }) {
  const image = getProductImage(product);
  const stock = getTotalStock(product);

  return (
    <tr className="border-b border-white/10">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#020617]">
            {image ? (
              <img
                src={image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-500">
                <Package size={22} />
              </div>
            )}
          </div>

          <div>
            <p className="font-black text-white">
              {product.name || "Unnamed Product"}
            </p>
            <p className="text-sm text-blue-100">{product.brand || "-"}</p>
          </div>
        </div>
      </td>

      <td className="p-4 font-bold capitalize text-zinc-200">
        {product.category || "-"}
      </td>

      <td className="p-4">
        <p className="font-black text-yellow-400">
          {Number(product.price || 0)} EGP
        </p>

        {Number(product.oldPrice || 0) > Number(product.price || 0) && (
          <p className="text-sm text-zinc-500 line-through">
            {Number(product.oldPrice || 0)} EGP
          </p>
        )}
      </td>

      <td className="p-4 font-black text-white">{stock}</td>

      <td className="p-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
            product.isActive === false
              ? "bg-zinc-500/10 text-zinc-400"
              : stock <= 0
              ? "bg-red-500/10 text-red-400"
              : stock <= 3
              ? "bg-orange-500/10 text-orange-400"
              : "bg-green-500/10 text-green-400"
          }`}
        >
          {product.isActive === false
            ? "Inactive"
            : stock <= 0
            ? "Out"
            : stock <= 3
            ? "Low"
            : "Active"}
        </span>
      </td>

      <td className="p-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="rounded-full bg-blue-500/15 px-4 py-2 text-xs font-black text-blue-300 transition hover:bg-blue-500 hover:text-white"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(product)}
            className="rounded-full bg-red-500/15 px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-500 hover:text-white"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function ProductMobileCard({ product, onEdit, onDelete }) {
  const image = getProductImage(product);
  const stock = getTotalStock(product);

  return (
    <article className="admin-card-dark p-4">
      <div className="flex gap-3">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-black">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-500">
              <Package size={26} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-black text-white">
            {product.name || "Unnamed Product"}
          </p>

          <p className="mt-1 truncate text-sm text-blue-100">
            {product.brand || "-"}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-yellow-400/25 px-3 py-1 text-xs font-black uppercase text-yellow-400">
              {product.category || "-"}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                product.isActive === false
                  ? "bg-zinc-500/10 text-zinc-400"
                  : stock <= 0
                  ? "bg-red-500/10 text-red-400"
                  : stock <= 3
                  ? "bg-orange-500/10 text-orange-400"
                  : "bg-green-500/10 text-green-400"
              }`}
            >
              Stock {stock}
            </span>
          </div>

          <p className="mt-3 font-black text-yellow-400">
            {Number(product.price || 0)} EGP
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="rounded-full bg-blue-500/15 px-4 py-3 text-xs font-black text-blue-300 transition hover:bg-blue-500 hover:text-white"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(product)}
          className="rounded-full bg-red-500/15 px-4 py-3 text-xs font-black text-red-300 transition hover:bg-red-500 hover:text-white"
        >
          Delete
        </button>
      </div>
    </article>
  );
}