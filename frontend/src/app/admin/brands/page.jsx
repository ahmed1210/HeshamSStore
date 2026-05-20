"use client";

import { apiUrl } from "@/lib/api";
import AdminHeader from "@/components/AdminHeader";
import { Edit, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const emptyForm = {
  name: "",
  slug: "",
  logo_url: "",
  active: true,
};

const makeSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function AdminBrandsPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const getToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("adminToken") || "";
  };

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("adminUser");
    const savedToken = localStorage.getItem("adminToken");

    if (!savedUser || !savedToken) {
      router.push("/admin/login");
      return;
    }

    setCurrentUser(JSON.parse(savedUser));
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);

      const res = await fetch(apiUrl("/api/admin/brands"), {
        headers: authHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load brands");
      }

      setBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      showMessage(error.message || "Failed to load brands", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "name" && !editingId) {
        next.slug = makeSlug(value);
      }

      if (name === "slug") {
        next.slug = makeSlug(value);
      }

      return next;
    });
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      showMessage("Brand name is required.", "error");
      return false;
    }

    if (!form.slug.trim()) {
      showMessage("Brand slug is required.", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);

      const url = editingId
        ? apiUrl(`/api/admin/brands/${editingId}`)
        : apiUrl("/api/admin/brands");

      const method = editingId ? "PUT" : "POST";

      const payload = {
        name: form.name.trim(),
        slug: makeSlug(form.slug || form.name),
        logo_url: form.logo_url.trim(),
        active: form.active,
      };

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save brand");
      }

      showMessage(editingId ? "Brand updated." : "Brand created.");
      resetForm();
      loadBrands();
    } catch (error) {
      showMessage(error.message || "Failed to save brand", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (brand) => {
    setEditingId(brand.id);
    setForm({
      name: brand.name || "",
      slug: brand.slug || "",
      logo_url: brand.logo_url || "",
      active: brand.active !== false,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (brand) => {
    const confirmed = window.confirm(`Delete brand ${brand.name}?`);
    if (!confirmed) return;

    try {
      setSaving(true);

      const res = await fetch(apiUrl(`/api/admin/brands/${brand.id}`), {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete brand");
      }

      showMessage("Brand deleted.");
      loadBrands();
    } catch (error) {
      showMessage(error.message || "Failed to delete brand", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <main className="admin-page min-h-screen bg-[#020617] p-8 text-white">
        Loading brands...
      </main>
    );
  }

  return (
    <main className="admin-page min-h-screen bg-[#020617] p-8 text-white">
      <AdminHeader
        currentUser={currentUser}
        title="Brands"
        subtitle="Add brand names and logo URLs for homepage and product filters."
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

      <section className="grid gap-6 xl:grid-cols-[430px_1fr]">
        <div className="admin-card p-6">
          <div className="mb-6 flex items-center gap-2 text-yellow-400">
            {editingId ? <Edit size={20} /> : <Plus size={20} />}
            <h2 className="text-xl font-black uppercase">
              {editingId ? "Edit Brand" : "Add Brand"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Brand Name">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="admin-input"
                placeholder="Nike"
              />
            </Field>

            <Field label="Slug">
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                className="admin-input"
                placeholder="nike"
              />
            </Field>

            <Field label="Logo URL">
              <input
                name="logo_url"
                value={form.logo_url}
                onChange={handleChange}
                className="admin-input"
                placeholder="https://..."
              />
            </Field>

            {form.logo_url && (
              <div className="rounded-2xl border border-yellow-400/20 bg-black p-4">
                <img
                  src={form.logo_url}
                  alt={form.name}
                  className="mx-auto h-20 max-w-full object-contain"
                />
              </div>
            )}

            <label className="flex items-center gap-3 rounded-2xl border border-yellow-400/20 bg-[#020617] p-4 font-bold text-zinc-200">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />
              Active brand
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="admin-btn-primary flex-1 disabled:opacity-60"
              >
                <Save size={17} />
                {saving ? "Saving..." : editingId ? "Update Brand" : "Add Brand"}
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
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-xl font-black uppercase text-yellow-400">
              Brands List
            </h2>

            <button
              type="button"
              onClick={loadBrands}
              className="admin-btn-outline"
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="admin-card-dark p-8 text-center font-bold text-zinc-400">
              Loading brands...
            </div>
          ) : brands.length === 0 ? (
            <div className="admin-card-dark p-8 text-center text-zinc-400">
              No brands yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {brands.map((brand) => (
                <article
                  key={brand.id}
                  className="rounded-3xl border border-yellow-400/20 bg-[#020617] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-white">
                        {brand.name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        /{brand.slug}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                        brand.active !== false
                          ? "bg-green-500/15 text-green-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {brand.active !== false ? "Active" : "Hidden"}
                    </span>
                  </div>

                  <div className="mt-5 flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-black">
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="h-16 max-w-[170px] object-contain"
                      />
                    ) : (
                      <span className="text-3xl font-black uppercase tracking-[0.2em] text-yellow-400">
                        {brand.name}
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(brand)}
                      className="rounded-full bg-blue-500/15 px-4 py-2 text-xs font-black text-blue-300 hover:bg-blue-500 hover:text-white"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(brand)}
                      className="rounded-full bg-red-500/15 px-4 py-2 text-xs font-black text-red-300 hover:bg-red-500 hover:text-white"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-blue-100">
        {label}
      </span>
      {children}
    </label>
  );
}