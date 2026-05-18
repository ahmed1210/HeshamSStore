"use client";

import { apiUrl } from "@/lib/api";
import AdminHeader from "@/components/AdminHeader";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Eye,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  User,
  X,
} from "lucide-react";

const statusOptions = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminOrdersPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    loadCurrentUser();
    loadOrders();
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

  const loadOrders = async () => {
    try {
      setLoading(true);

      const res = await fetch(apiUrl("/api/orders"), {
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        throw new Error(data.message || "You do not have permission");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to load orders");
      }

      const ordersArray = Array.isArray(data)
        ? data
        : Array.isArray(data.orders)
        ? data.orders
        : Array.isArray(data.data)
        ? data.data
        : [];

      setOrders(ordersArray);
    } catch (error) {
      console.error("Load orders error:", error);

      const text = String(error.message || "").toLowerCase();

      if (text.includes("failed to fetch")) {
        showMessage(
          "Cannot connect to backend. Please make sure backend is running.",
          "error"
        );
      } else {
        showMessage(error.message || "Failed to load orders", "error");
      }

      handleAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      setUpdating(true);

      const res = await fetch(apiUrl(`/api/orders/${orderId}/status`), {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        throw new Error(data.message || "You do not have permission");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to update order status");
      }

      showMessage("Order status updated successfully");

      setOrders((prev) =>
        prev.map((order) =>
          String(order.id) === String(orderId)
            ? { ...order, status }
            : order
        )
      );

      setSelectedOrder((prev) =>
        prev && String(prev.id) === String(orderId)
          ? { ...prev, status }
          : prev
      );
    } catch (error) {
      console.error("Update order status error:", error);
      showMessage(error.message || "Failed to update order status", "error");
      handleAuthError(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const visibleOrders = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return orders.filter((order) => {
      const orderStatus = String(order.status || "pending").toLowerCase();

      if (statusFilter !== "all" && orderStatus !== statusFilter) {
        return false;
      }

      if (dateFilter) {
        const orderDate = getOrderDateInputValue(order);
        if (orderDate !== dateFilter) return false;
      }

      if (!searchText) return true;

      const orderText = `${order.id || ""} ${order.orderNumber || ""} ${
        order.customerName || order.name || ""
      } ${order.customerEmail || order.email || ""} ${
        order.customerPhone || order.phone || ""
      } ${getOrderItems(order)
        .map((item) => item.name || item.title || "")
        .join(" ")}`.toLowerCase();

      return orderText.includes(searchText);
    });
  }, [orders, search, statusFilter, dateFilter]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(getOrderTotal(order) || 0),
      0
    );

    return {
      total: orders.length,
      pending: orders.filter(
        (order) => String(order.status || "pending").toLowerCase() === "pending"
      ).length,
      delivered: orders.filter(
        (order) =>
          String(order.status || "").toLowerCase() === "delivered"
      ).length,
      revenue: totalRevenue,
    };
  }, [orders]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("");
  };

  if (!currentUser) {
    return (
      <main className="admin-page min-h-screen bg-[#020617] p-8 text-white">
        <div className="admin-card p-6 font-bold">Loading orders...</div>
      </main>
    );
  }

  return (
    <main className="admin-page min-h-screen bg-[#020617] p-8 text-white">
      <AdminHeader
        currentUser={currentUser}
        title="Orders"
        subtitle="View customer orders, search by date, customer, product, and update order status."
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
        <StatCard label="Total Orders" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Delivered" value={stats.delivered} />
        <StatCard label="Revenue" value={`${stats.revenue} EGP`} />
      </section>

      <section className="admin-card mb-6 p-6">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.8fr_0.8fr_auto_auto]">
          <div className="flex items-center gap-3 rounded-2xl border border-yellow-400/20 bg-[#020617] px-4">
            <Search size={18} className="text-yellow-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent py-3 text-white outline-none"
              placeholder="Search order, customer, phone, product..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-input"
          >
            <option value="all">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {capitalize(status)}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="admin-input"
          />

          <button
            type="button"
            onClick={loadOrders}
            className="admin-btn-outline justify-center"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={clearFilters}
            className="admin-btn-outline justify-center"
          >
            <X size={16} />
            Clear
          </button>
        </div>
      </section>

      <section className="admin-card p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2 text-yellow-400">
            <ShoppingBag size={22} />
            <h2 className="text-xl font-black uppercase">Orders List</h2>
          </div>

          <p className="text-sm font-bold text-zinc-400">
            Showing{" "}
            <span className="text-yellow-400">{visibleOrders.length}</span>{" "}
            order{visibleOrders.length === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <div className="admin-card-dark p-8 text-center font-bold text-zinc-400">
            Loading orders...
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="admin-card-dark p-8 text-center">
            <ShoppingBag className="mx-auto text-yellow-400" size={44} />
            <h3 className="mt-4 text-xl font-black">No orders found</h3>
            <p className="mt-2 text-zinc-400">
              Try changing search, date, or status filter.
            </p>
          </div>
        ) : (
          <>
            <div className="orders-desktop-table overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead>
                  <tr className="border-b border-yellow-400/20 text-yellow-400">
                    <th className="p-4 text-sm font-black uppercase">Order</th>
                    <th className="p-4 text-sm font-black uppercase">
                      Customer
                    </th>
                    <th className="p-4 text-sm font-black uppercase">Date</th>
                    <th className="p-4 text-sm font-black uppercase">Items</th>
                    <th className="p-4 text-sm font-black uppercase">Total</th>
                    <th className="p-4 text-sm font-black uppercase">
                      Status
                    </th>
                    <th className="p-4 text-sm font-black uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleOrders.map((order) => (
                    <OrderTableRow
                      key={order.id || order.orderNumber}
                      order={order}
                      updating={updating}
                      onView={setSelectedOrder}
                      onStatusChange={updateOrderStatus}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="orders-mobile-cards">
              {visibleOrders.map((order) => (
                <OrderMobileCard
                  key={order.id || order.orderNumber}
                  order={order}
                  updating={updating}
                  onView={setSelectedOrder}
                  onStatusChange={updateOrderStatus}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          updating={updating}
          onStatusChange={updateOrderStatus}
        />
      )}
    </main>
  );
}

function OrderTableRow({ order, updating, onView, onStatusChange }) {
  const items = getOrderItems(order);
  const orderId = order.id || order.orderNumber;
  const status = String(order.status || "pending").toLowerCase();

  return (
    <tr className="border-b border-white/10">
      <td className="p-4">
        <p className="font-black text-white">#{orderId}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {order.paymentMethod || order.paymentType || "Payment"}
        </p>
      </td>

      <td className="p-4">
        <p className="font-black text-white">
          {order.customerName || order.name || "Customer"}
        </p>
        <p className="mt-1 text-sm text-blue-100">
          {order.customerPhone || order.phone || "-"}
        </p>
      </td>

      <td className="p-4 font-bold text-zinc-300">{formatOrderDate(order)}</td>

      <td className="p-4 font-bold text-zinc-300">
        {items.length} item{items.length === 1 ? "" : "s"}
      </td>

      <td className="p-4 font-black text-yellow-400">
        {getOrderTotal(order)} EGP
      </td>

      <td className="p-4">
        <StatusBadge status={status} />
      </td>

      <td className="p-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onView(order)}
            className="rounded-full bg-blue-500/15 px-4 py-2 text-xs font-black text-blue-300 transition hover:bg-blue-500 hover:text-white"
          >
            View
          </button>

          <select
            value={status}
            disabled={updating}
            onChange={(e) => onStatusChange(orderId, e.target.value)}
            className="rounded-full border border-yellow-400/25 bg-[#020617] px-3 py-2 text-xs font-black text-white outline-none"
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {capitalize(item)}
              </option>
            ))}
          </select>
        </div>
      </td>
    </tr>
  );
}

function OrderMobileCard({ order, updating, onView, onStatusChange }) {
  const items = getOrderItems(order);
  const orderId = order.id || order.orderNumber;
  const status = String(order.status || "pending").toLowerCase();

  return (
    <article className="admin-card-dark p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Order
          </p>

          <h3 className="mt-1 text-lg font-black text-white">#{orderId}</h3>

          <p className="mt-2 text-sm font-bold text-blue-100">
            {order.customerName || order.name || "Customer"}
          </p>
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <InfoBox label="Date" value={formatOrderDate(order)} />
        <InfoBox label="Items" value={items.length} />
        <InfoBox label="Phone" value={order.customerPhone || order.phone || "-"} />
        <InfoBox label="Total" value={`${getOrderTotal(order)} EGP`} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onView(order)}
          className="rounded-full bg-blue-500/15 px-4 py-3 text-xs font-black text-blue-300 transition hover:bg-blue-500 hover:text-white"
        >
          View
        </button>

        <select
          value={status}
          disabled={updating}
          onChange={(e) => onStatusChange(orderId, e.target.value)}
          className="rounded-full border border-yellow-400/25 bg-[#020617] px-3 py-3 text-xs font-black text-white outline-none"
        >
          {statusOptions.map((item) => (
            <option key={item} value={item}>
              {capitalize(item)}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}

function OrderDetailsModal({ order, onClose, updating, onStatusChange }) {
  const items = getOrderItems(order);
  const orderId = order.id || order.orderNumber;
  const status = String(order.status || "pending").toLowerCase();

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-yellow-400/25 bg-[#111827] p-6 text-white shadow-2xl shadow-black/60">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
              Order Details
            </p>

            <h2 className="mt-2 text-3xl font-black uppercase">#{orderId}</h2>

            <p className="mt-2 text-blue-100">{formatOrderDate(order)}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-yellow-400/25 p-3 text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <InfoPanel
            icon={User}
            title="Customer"
            lines={[
              order.customerName || order.name || "Customer",
              order.customerPhone || order.phone || "-",
              order.customerEmail || order.email || "-",
            ]}
          />

          <InfoPanel
            icon={Truck}
            title="Delivery"
            lines={[
              order.city || order.area || order.deliveryPlace || "-",
              order.address || order.customerAddress || "-",
              `Delivery: ${Number(
                order.deliveryPrice || order.shipping || 0
              )} EGP`,
            ]}
          />

          <InfoPanel
            icon={Calendar}
            title="Payment"
            lines={[
              order.paymentMethod || order.paymentType || "-",
              `Subtotal: ${Number(order.subtotal || 0)} EGP`,
              `Total: ${getOrderTotal(order)} EGP`,
            ]}
          />
        </div>

        <div className="mb-6 rounded-3xl border border-yellow-400/20 bg-[#020617] p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <h3 className="text-xl font-black uppercase text-yellow-400">
              Products
            </h3>

            <div className="flex items-center gap-2">
              <StatusBadge status={status} />

              <select
                value={status}
                disabled={updating}
                onChange={(e) => onStatusChange(orderId, e.target.value)}
                className="rounded-full border border-yellow-400/25 bg-[#111827] px-3 py-2 text-xs font-black text-white outline-none"
              >
                {statusOptions.map((item) => (
                  <option key={item} value={item}>
                    {capitalize(item)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3">
            {items.length > 0 ? (
              items.map((item, index) => (
                <div
                  key={`${item.id || item.productId || index}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111827] p-3"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black">
                    {getItemImage(item) ? (
                      <img
                        src={getItemImage(item)}
                        alt={item.name || "Product"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package size={20} className="text-zinc-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-white">
                      {item.name || item.title || "Product"}
                    </p>

                    <p className="mt-1 text-sm text-zinc-400">
                      Size: {item.size || "-"} | Qty:{" "}
                      {item.quantity || item.qty || 1}
                    </p>
                  </div>

                  <p className="font-black text-yellow-400">
                    {Number(item.price || 0)} EGP
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 text-center text-zinc-400">
                No products found in this order.
              </div>
            )}
          </div>
        </div>

        {order.notes && (
          <div className="rounded-3xl border border-yellow-400/20 bg-[#020617] p-5">
            <h3 className="mb-2 text-lg font-black uppercase text-yellow-400">
              Notes
            </h3>
            <p className="leading-7 text-blue-100">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="admin-card p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
        {label}
      </p>

      <strong className="mt-3 block text-2xl font-black text-yellow-400">
        {value}
      </strong>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020617] p-3">
      <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-1 truncate font-black text-white">{value}</p>
    </div>
  );
}

function InfoPanel({ icon: Icon, title, lines }) {
  return (
    <div className="rounded-3xl border border-yellow-400/20 bg-[#020617] p-5">
      <div className="mb-3 flex items-center gap-2 text-yellow-400">
        <Icon size={18} />
        <h3 className="font-black uppercase">{title}</h3>
      </div>

      <div className="space-y-1">
        {lines.map((line, index) => (
          <p key={index} className="break-words text-sm font-bold text-blue-100">
            {line || "-"}
          </p>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusClass =
    status === "delivered"
      ? "bg-green-500/15 text-green-400"
      : status === "cancelled"
      ? "bg-red-500/15 text-red-400"
      : status === "shipped"
      ? "bg-blue-500/15 text-blue-400"
      : status === "processing"
      ? "bg-purple-500/15 text-purple-400"
      : status === "confirmed"
      ? "bg-orange-500/15 text-orange-400"
      : "bg-yellow-500/15 text-yellow-400";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusClass}`}
    >
      {capitalize(status)}
    </span>
  );
}

function getOrderItems(order) {
  if (Array.isArray(order.items)) return order.items;
  if (Array.isArray(order.products)) return order.products;
  if (Array.isArray(order.cart)) return order.cart;
  return [];
}

function getOrderTotal(order) {
  return Number(
    order.total ||
      order.totalPrice ||
      order.grandTotal ||
      order.finalTotal ||
      0
  );
}

function getItemImage(item) {
  return (
    item.image ||
    item.imageUrl ||
    item.photo ||
    item.thumbnail ||
    item.images?.[0] ||
    ""
  );
}

function getOrderDateInputValue(order) {
  const rawDate = order.createdAt || order.date || order.orderDate || order.time;

  if (!rawDate) return "";

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function formatOrderDate(order) {
  const rawDate = order.createdAt || order.date || order.orderDate || order.time;

  if (!rawDate) return "-";

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
}

function capitalize(text) {
  return String(text || "")
    .charAt(0)
    .toUpperCase() + String(text || "").slice(1);
}