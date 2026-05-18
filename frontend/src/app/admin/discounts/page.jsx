"use client";

import { apiUrl } from "@/lib/api";
import AdminHeader from "@/components/AdminHeader";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Edit,
  Percent,
  Plus,
  RefreshCw,
  Save,
  Tag,
  Trash2,
  X,
} from "lucide-react";

const emptyForm = {
  code: "",
  type: "percentage",
  value: "",
  minOrder: "0",
  active: true,
};

export default function AdminDiscountsPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    loadCurrentUser();
    loadDiscounts();
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
    }, 4500);
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

  const canManageDiscounts =
    currentUser?.role === "owner" || currentUser?.role === "admin";

  const loadDiscounts = async () => {
    try {
      setLoading(true);

      const res = await fetch(apiUrl("/api/discounts/admin"), {
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        throw new Error(data.message || "You do not have permission");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to load discounts");
      }

      const discountsArray = Array.isArray(data)
        ? data
        : Array.isArray(data.discounts)
        ? data.discounts
        : Array.isArray(data.data)
        ? data.data
        : [];

      setDiscounts(discountsArray);
    } catch (error) {
      console.error("Load discounts error:", error);

      const text = String(error.message || "").toLowerCase();

      if (text.includes("failed to fetch")) {
        showMessage(
          "Cannot connect to backend. Please make sure backend is running.",
          "error"
        );
      } else {
        showMessage(error.message || "Failed to load discounts", "error");
      }

      handleAuthError(error.message);
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

    if (name === "code") {
      setForm((prev) => ({
        ...prev,
        code: value.toUpperCase().replace(/\s/g, ""),
      }));
      return;
    }

    if (["value", "minOrder"].includes(name)) {
      setForm((prev) => ({
        ...prev,
        [name]: value.replace(/[^\d.]/g, ""),
      }));
      return;
    }

    if (name === "type") {
      setForm((prev) => ({
        ...prev,
        type: value,
        value: value === "free_delivery" ? "0" : prev.value,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const code = form.code.trim().toUpperCase();
    const value = Number(form.value || 0);
    const minOrder = Number(form.minOrder || 0);

    if (!code || code.length < 3) {
      showMessage("Discount code must be at least 3 characters", "error");
      return false;
    }

    if (!["percentage", "fixed", "free_delivery"].includes(form.type)) {
      showMessage("Please select a valid discount type", "error");
      return false;
    }

    if (form.type === "percentage" && (value <= 0 || value > 100)) {
      showMessage("Percentage discount must be between 1 and 100", "error");
      return false;
    }

    if (form.type === "fixed" && value <= 0) {
      showMessage("Fixed discount must be greater than 0", "error");
      return false;
    }

    if (!Number.isFinite(minOrder) || minOrder < 0) {
      showMessage("Minimum order must be a valid number", "error");
      return false;
    }

    return true;
  };

  const buildPayload = () => ({
    code: form.code.trim().toUpperCase(),
    type: form.type,
    value: form.type === "free_delivery" ? 0 : Number(form.value || 0),
    minOrder: Number(form.minOrder || 0),
    active: form.active,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManageDiscounts) {
      showMessage("You do not have permission to manage discounts.", "error");
      return;
    }

    if (!validateForm()) return;

    try {
      setSaving(true);

      const url = editingId
        ? apiUrl(`/api/discounts/admin/${editingId}`)
        : apiUrl("/api/discounts/admin");

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
        throw new Error(data.message || "Failed to save discount");
      }

      showMessage(
        editingId
          ? "Discount updated successfully."
          : "Discount created successfully."
      );

      resetForm();
      loadDiscounts();
    } catch (error) {
      console.error("Save discount error:", error);
      showMessage(error.message || "Failed to save discount", "error");
      handleAuthError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (discount) => {
    if (!canManageDiscounts) {
      showMessage("You do not have permission to edit discounts.", "error");
      return;
    }

    setEditingId(discount.id);

    setForm({
      code: discount.code || "",
      type: discount.type || "percentage",
      value: String(discount.value ?? ""),
      minOrder: String(discount.minOrder ?? 0),
      active: discount.active !== false,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (discount) => {
    if (!canManageDiscounts) {
      showMessage("You do not have permission to delete discounts.", "error");
      return;
    }

    const confirmDelete = window.confirm(
      `Delete discount code ${discount.code}?`
    );

    if (!confirmDelete) return;

    try {
      setSaving(true);

      const res = await fetch(
        apiUrl(`/api/discounts/admin/${discount.id}`),
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        throw new Error(data.message || "You do not have permission");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete discount");
      }

      showMessage("Discount deleted successfully.");

      if (editingId === discount.id) {
        resetForm();
      }

      loadDiscounts();
    } catch (error) {
      console.error("Delete discount error:", error);
      showMessage(error.message || "Failed to delete discount", "error");
      handleAuthError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: discounts.length,
      active: discounts.filter((item) => item.active !== false).length,
      inactive: discounts.filter((item) => item.active === false).length,
      percentage: discounts.filter((item) => item.type === "percentage").length,
      freeDelivery: discounts.filter((item) => item.type === "free_delivery")
        .length,
    };
  }, [discounts]);

  if (!currentUser) {
    return (
      <main className="admin-page min-h-screen bg-[#020617] p-8 text-white">
        <div className="admin-card p-6 font-bold">Loading discounts...</div>
      </main>
    );
  }

  return (
    <main className="admin-page min-h-screen bg-[#020617] p-8 text-white">
      <AdminHeader
        currentUser={currentUser}
        title="Discount Codes"
        subtitle="Create percentage, fixed amount, and free delivery codes for checkout."
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

      <section className="admin-stats-grid mb-6 grid sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Codes" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Inactive" value={stats.inactive} />
        <StatCard label="Percentage" value={stats.percentage} />
        <StatCard label="Free Delivery" value={stats.freeDelivery} />
      </section>

      <section className="admin-main-grid grid xl:grid-cols-[420px_1fr]">
        <div className="admin-card p-6">
          <div className="mb-6 flex items-center gap-2 text-yellow-400">
            {editingId ? <Edit size={20} /> : <Plus size={20} />}

            <h2 className="text-xl font-black uppercase">
              {editingId ? "Edit Discount" : "Add Discount"}
            </h2>
          </div>

          {!canManageDiscounts ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 font-bold text-red-300">
              You do not have permission to manage discount codes.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Discount Code">
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  className="admin-input font-black uppercase"
                  placeholder="HESHAM10"
                />
              </Field>

              <Field label="Discount Type">
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="admin-input"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="free_delivery">Free Delivery</option>
                </select>
              </Field>

              {form.type !== "free_delivery" && (
                <Field label="Value">
                  <input
                    name="value"
                    value={form.value}
                    onChange={handleChange}
                    className="admin-input"
                    placeholder={form.type === "percentage" ? "10" : "100"}
                    inputMode="decimal"
                  />

                  <p className="mt-2 text-xs font-bold text-zinc-500">
                    {form.type === "percentage"
                      ? "Example: 10 means 10% off"
                      : "Example: 100 means 100 EGP off"}
                  </p>
                </Field>
              )}

              <Field label="Minimum Order">
                <input
                  name="minOrder"
                  value={form.minOrder}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="0"
                  inputMode="decimal"
                />
              </Field>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-yellow-400/20 bg-[#020617] p-4 font-bold text-zinc-200">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                Active code
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="admin-btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update"
                    : "Create"}
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
          )}
        </div>

        <div className="admin-card p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2 text-yellow-400">
              <Tag size={20} />
              <h2 className="text-xl font-black uppercase">All Codes</h2>
            </div>

            <button
              type="button"
              onClick={loadDiscounts}
              className="admin-btn-outline w-fit"
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="admin-card-dark p-8 text-center font-bold text-zinc-400">
              Loading discount codes...
            </div>
          ) : discounts.length === 0 ? (
            <div className="admin-card-dark p-8 text-center">
              <Percent className="mx-auto text-yellow-400" size={42} />

              <h3 className="mt-4 text-xl font-black">No discount codes</h3>

              <p className="mt-2 text-zinc-400">
                Create your first code from the form.
              </p>
            </div>
          ) : (
            <>
              <div className="discounts-desktop-table overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead>
                    <tr className="border-b border-yellow-400/20 text-yellow-400">
                      <th className="p-4 text-sm font-black uppercase">Code</th>
                      <th className="p-4 text-sm font-black uppercase">Type</th>
                      <th className="p-4 text-sm font-black uppercase">
                        Value
                      </th>
                      <th className="p-4 text-sm font-black uppercase">
                        Min Order
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
                    {discounts.map((discount) => (
                      <DiscountTableRow
                        key={discount.id}
                        discount={discount}
                        canManageDiscounts={canManageDiscounts}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="discounts-mobile-cards">
                {discounts.map((discount) => (
                  <DiscountMobileCard
                    key={discount.id}
                    discount={discount}
                    canManageDiscounts={canManageDiscounts}
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
      <label className="mb-2 block text-sm font-bold text-zinc-300">
        {label}
      </label>
      {children}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="admin-card p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </p>

      <strong className="mt-3 block text-3xl font-black text-yellow-400">
        {value}
      </strong>
    </div>
  );
}

function DiscountTableRow({
  discount,
  canManageDiscounts,
  onEdit,
  onDelete,
}) {
  return (
    <tr className="border-b border-white/10">
      <td className="p-4">
        <span className="rounded-full bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wide text-black">
          {discount.code}
        </span>
      </td>

      <td className="p-4 font-bold text-zinc-200">
        {getTypeLabel(discount.type)}
      </td>

      <td className="p-4 font-black text-yellow-400">
        {getDiscountValueText(discount)}
      </td>

      <td className="p-4 font-bold text-zinc-200">
        {Number(discount.minOrder || 0)} EGP
      </td>

      <td className="p-4">
        <StatusBadge active={discount.active !== false} />
      </td>

      <td className="p-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(discount)}
            disabled={!canManageDiscounts}
            className="flex items-center gap-1 rounded-full bg-blue-500/15 px-4 py-2 text-xs font-black text-blue-300 transition hover:bg-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Edit size={14} />
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(discount)}
            disabled={!canManageDiscounts}
            className="flex items-center gap-1 rounded-full bg-red-500/15 px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function DiscountMobileCard({
  discount,
  canManageDiscounts,
  onEdit,
  onDelete,
}) {
  return (
    <article className="admin-card-dark p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wide text-black">
            {discount.code}
          </span>

          <p className="mt-3 text-sm font-bold text-blue-100">
            {getTypeLabel(discount.type)}
          </p>

          <p className="mt-1 text-xl font-black text-yellow-400">
            {getDiscountValueText(discount)}
          </p>
        </div>

        <StatusBadge active={discount.active !== false} />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#020617] p-3">
        <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
          Minimum Order
        </p>

        <p className="mt-1 font-black text-white">
          {Number(discount.minOrder || 0)} EGP
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(discount)}
          disabled={!canManageDiscounts}
          className="rounded-full bg-blue-500/15 px-4 py-3 text-xs font-black text-blue-300 transition hover:bg-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(discount)}
          disabled={!canManageDiscounts}
          className="rounded-full bg-red-500/15 px-4 py-3 text-xs font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
        active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function getTypeLabel(type) {
  if (type === "percentage") return "Percentage";
  if (type === "fixed") return "Fixed Amount";
  if (type === "free_delivery") return "Free Delivery";
  return type || "-";
}

function getDiscountValueText(discount) {
  if (discount.type === "percentage") return `${discount.value}%`;
  if (discount.type === "fixed") return `${discount.value} EGP`;
  if (discount.type === "free_delivery") return "Free Delivery";
  return "-";
}