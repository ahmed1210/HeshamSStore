"use client";

import { apiUrl } from "@/lib/api";
import AdminHeader from "@/components/AdminHeader";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Edit,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Truck,
  X,
} from "lucide-react";

const emptyForm = {
  name: "",
  price: "",
  active: true,
};

export default function AdminDeliveryPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [places, setPlaces] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadPlaces();
  }, []);

  const getToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("adminToken") || "";
  };

  const logoutAndRedirect = () => {
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    router.push("/admin/login");
  };

  const loadCurrentUser = () => {
    try {
      const savedUser = localStorage.getItem("adminUser");
      const savedToken = localStorage.getItem("adminToken");

      if (!savedUser || !savedToken) {
        logoutAndRedirect();
        return;
      }

      const parsedUser = JSON.parse(savedUser);

      if (!parsedUser || !parsedUser.role) {
        logoutAndRedirect();
        return;
      }

      setCurrentUser(parsedUser);
    } catch {
      logoutAndRedirect();
    }
  };

  const authHeaders = () => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    };
  };

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  const handleAuthError = (errorMessage) => {
    const text = String(errorMessage || "").toLowerCase();

    if (
      text.includes("logged in") ||
      text.includes("jwt") ||
      text.includes("token") ||
      text.includes("unauthorized")
    ) {
      logoutAndRedirect();
    }
  };

  const canManageDelivery =
    currentUser?.role === "owner" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "manager";

  const canDeleteDelivery =
    currentUser?.role === "owner" || currentUser?.role === "admin";

  const loadPlaces = async () => {
    try {
      setLoading(true);

      const res = await fetch(apiUrl("/api/delivery/admin/places"), {
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        throw new Error(data.message || "You do not have permission");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to load delivery places");
      }

      setPlaces(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load delivery places error:", error);

      const text = String(error.message || "").toLowerCase();

      if (text.includes("failed to fetch")) {
        showMessage(
          "Cannot connect to backend. Please make sure backend is running.",
          "error"
        );
      } else {
        showMessage(error.message || "Failed to load delivery places", "error");
      }

      handleAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "price") {
      setForm((prev) => ({
        ...prev,
        price: value.replace(/[^\d.]/g, ""),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      showMessage("Place name must be at least 2 characters", "error");
      return false;
    }

    if (form.price === "") {
      showMessage("Delivery price is required", "error");
      return false;
    }

    const price = Number(form.price);

    if (!Number.isFinite(price) || price < 0) {
      showMessage("Delivery price must be a valid number", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManageDelivery) {
      showMessage(
        "You do not have permission to manage delivery places",
        "error"
      );
      return;
    }

    if (!validateForm()) return;

    try {
      setLoading(true);

      const method = editingId ? "PUT" : "POST";

      const url = editingId
        ? apiUrl(`/api/delivery/admin/places/${editingId}`)
        : apiUrl("/api/delivery/admin/places");

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          price: Number(form.price),
          active: form.active,
        }),
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        throw new Error(data.message || "You do not have permission");
      }

      if (!res.ok) {
        throw new Error(data.message || "Request failed");
      }

      showMessage(
        editingId
          ? "Delivery place updated successfully"
          : "Delivery place added successfully"
      );

      resetForm();
      loadPlaces();
    } catch (error) {
      console.error("Save delivery place error:", error);
      showMessage(error.message || "Something went wrong", "error");
      handleAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (place) => {
    if (!canManageDelivery) {
      showMessage("You do not have permission to edit delivery places", "error");
      return;
    }

    setEditingId(place.id);

    setForm({
      name: place.name || "",
      price: String(place.price ?? ""),
      active: place.active !== false,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (place) => {
    if (!canDeleteDelivery) {
      showMessage("You do not have permission to delete delivery places", "error");
      return;
    }

    const confirmDelete = window.confirm(`Delete ${place.name}?`);
    if (!confirmDelete) return;

    try {
      setLoading(true);

      const res = await fetch(
        apiUrl(`/api/delivery/admin/places/${place.id}`),
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
        throw new Error(data.message || "Failed to delete delivery place");
      }

      showMessage("Delivery place deleted successfully");

      if (editingId === place.id) {
        resetForm();
      }

      loadPlaces();
    } catch (error) {
      console.error("Delete delivery place error:", error);
      showMessage(error.message || "Failed to delete delivery place", "error");
      handleAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const active = places.filter((place) => place.active).length;
    const hidden = places.filter((place) => !place.active).length;

    const average =
      places.length > 0
        ? Math.round(
            places.reduce((sum, place) => sum + Number(place.price || 0), 0) /
              places.length
          )
        : 0;

    return {
      total: places.length,
      active,
      hidden,
      average,
    };
  }, [places]);

  if (!currentUser) {
    return (
      <main className="admin-page min-h-screen bg-[#020617] p-8 text-white">
        <div className="admin-card p-6 font-bold">
          Loading delivery places...
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page min-h-screen bg-[#020617] p-8 text-white">
      <AdminHeader
        currentUser={currentUser}
        title="Delivery Places"
        subtitle="Add checkout delivery areas and set shipping price for each place."
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
        <StatCard label="Total Places" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Hidden" value={stats.hidden} />
        <StatCard label="Average Price" value={`${stats.average} EGP`} />
      </section>

      <section className="admin-card mb-6 p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
          Dashboard Access
        </p>

        <h2 className="mt-2 text-2xl font-black uppercase text-white">
          Delivery Control
        </h2>

        <p className="mt-2 max-w-3xl leading-7 text-blue-100">
          Create and manage the delivery places that customers can select during
          checkout. Active places appear in the checkout page.
        </p>
      </section>

      <section className="admin-main-grid grid xl:grid-cols-[420px_1fr]">
        <div className="admin-card p-6">
          <div className="mb-6 flex items-center gap-2 text-yellow-400">
            {editingId ? <Edit size={20} /> : <Plus size={20} />}
            <h2 className="text-xl font-black uppercase">
              {editingId ? "Edit Delivery Place" : "Add Delivery Place"}
            </h2>
          </div>

          {!canManageDelivery ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 font-bold text-red-300">
              You do not have permission to manage delivery places.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Place Name">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="Example: Cairo, Jeddah, Nasr City"
                />
              </Field>

              <Field label="Delivery Price">
                <input
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="Example: 50"
                  inputMode="decimal"
                />

                <p className="mt-2 text-xs font-bold text-zinc-500">
                  This price will be added to checkout shipping.
                </p>
              </Field>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-yellow-400/20 bg-[#020617] p-4 font-bold text-zinc-200">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                Active in checkout
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="admin-btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />
                  {loading
                    ? "Saving..."
                    : editingId
                    ? "Update Place"
                    : "Add Place"}
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
              <Truck size={22} />
              <h2 className="text-xl font-black uppercase">Places List</h2>
            </div>

            <button
              type="button"
              onClick={loadPlaces}
              className="admin-btn-outline w-fit"
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="admin-card-dark p-8 text-center font-bold text-zinc-400">
              Loading delivery places...
            </div>
          ) : places.length === 0 ? (
            <div className="admin-card-dark p-8 text-center">
              <MapPin className="mx-auto text-yellow-400" size={42} />
              <h3 className="mt-4 text-xl font-black">No delivery places</h3>
              <p className="mt-2 text-zinc-400">
                Add your first delivery place from the form.
              </p>
            </div>
          ) : (
            <>
              <div className="delivery-desktop-table overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead>
                    <tr className="border-b border-yellow-400/20 text-yellow-400">
                      <th className="p-4 text-sm font-black uppercase">
                        Place
                      </th>
                      <th className="p-4 text-sm font-black uppercase">
                        Price
                      </th>
                      <th className="p-4 text-sm font-black uppercase">
                        Status
                      </th>
                      <th className="p-4 text-sm font-black uppercase">
                        Created
                      </th>
                      <th className="p-4 text-sm font-black uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {places.map((place) => (
                      <DeliveryTableRow
                        key={place.id}
                        place={place}
                        canManageDelivery={canManageDelivery}
                        canDeleteDelivery={canDeleteDelivery}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="delivery-mobile-cards">
                {places.map((place) => (
                  <DeliveryMobileCard
                    key={place.id}
                    place={place}
                    canManageDelivery={canManageDelivery}
                    canDeleteDelivery={canDeleteDelivery}
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

function StatusBadge({ active }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
        active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
      }`}
    >
      {active ? "Active" : "Hidden"}
    </span>
  );
}

function DeliveryTableRow({
  place,
  canManageDelivery,
  canDeleteDelivery,
  onEdit,
  onDelete,
}) {
  return (
    <tr className="border-b border-white/10">
      <td className="p-4">
        <p className="font-black text-white">{place.name}</p>
      </td>

      <td className="p-4 font-black text-yellow-400">
        {Number(place.price || 0)} EGP
      </td>

      <td className="p-4">
        <StatusBadge active={place.active !== false} />
      </td>

      <td className="p-4 font-bold text-zinc-300">
        {place.createdAt ? new Date(place.createdAt).toLocaleDateString() : "-"}
      </td>

      <td className="p-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(place)}
            disabled={!canManageDelivery}
            className="rounded-full bg-blue-500/15 px-4 py-2 text-xs font-black text-blue-300 transition hover:bg-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(place)}
            disabled={!canDeleteDelivery}
            className="rounded-full bg-red-500/15 px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function DeliveryMobileCard({
  place,
  canManageDelivery,
  canDeleteDelivery,
  onEdit,
  onDelete,
}) {
  return (
    <article className="admin-card-dark p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-white">{place.name}</h3>

          <p className="mt-2 text-xl font-black text-yellow-400">
            {Number(place.price || 0)} EGP
          </p>
        </div>

        <StatusBadge active={place.active !== false} />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#020617] p-3">
        <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
          Created
        </p>

        <p className="mt-1 font-black text-white">
          {place.createdAt
            ? new Date(place.createdAt).toLocaleDateString()
            : "-"}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(place)}
          disabled={!canManageDelivery}
          className="rounded-full bg-blue-500/15 px-4 py-3 text-xs font-black text-blue-300 transition hover:bg-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(place)}
          disabled={!canDeleteDelivery}
          className="rounded-full bg-red-500/15 px-4 py-3 text-xs font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </article>
  );
}