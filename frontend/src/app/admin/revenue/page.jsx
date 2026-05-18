"use client";
import { apiUrl } from "@/lib/api";
import AdminHeader from "@/components/AdminHeader";
import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  RefreshCw,
  Search,
  CalendarDays,
  Banknote,
  XCircle,
  Clock,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";

const monthNames = [
  "All Months",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDate(orderDate) {
  const date = new Date(orderDate);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getOrderDateParts(orderDate) {
  const date = new Date(orderDate);

  if (Number.isNaN(date.getTime())) {
    return {
      day: "",
      month: "",
      year: "",
      monthName: "Unknown",
      monthKey: "Unknown",
    };
  }

  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return {
    day: String(date.getDate()),
    month: String(month),
    year: String(year),
    monthName: monthNames[month],
    monthKey: `${year}-${String(month).padStart(2, "0")}`,
  };
}

export default function AdminRevenuePage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const getAdminToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("adminToken");
  };

  const logoutAndRedirect = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminEmail");
    router.push("/admin/login");
  };

  const loadCurrentUser = () => {
    try {
      const savedUser = localStorage.getItem("adminUser");

      if (!savedUser) {
        logoutAndRedirect();
        return;
      }

      const parsedUser = JSON.parse(savedUser);

      if (!parsedUser || !parsedUser.role) {
        logoutAndRedirect();
        return;
      }

      setCurrentUser(parsedUser);
    } catch (err) {
      logoutAndRedirect();
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError("");

    const token = getAdminToken();

    if (!token) {
      logoutAndRedirect();
      return;
    }

    try {
     const res = await fetch(apiUrl("/api/orders"), {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        logoutAndRedirect();
        return;
      }

      if (!res.ok) {
        setOrders([]);
        setError(data.message || "Could not load revenue.");
        return;
      }

      if (!Array.isArray(data)) {
        setOrders([]);
        setError(data.message || "Invalid orders response.");
        return;
      }

      setOrders(data);
      setError("");
    } catch {
      setOrders([]);
      setError("Cannot connect to backend. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
    fetchOrders();
  }, []);

  const years = useMemo(() => {
    const uniqueYears = new Set();

    orders.forEach((order) => {
      const { year } = getOrderDateParts(order.createdAt);
      if (year) uniqueYears.add(year);
    });

    return Array.from(uniqueYears).sort((a, b) => Number(b) - Number(a));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchText = search.toLowerCase().trim();

      const productText = (order.items || [])
        .map((item) => `${item.name} ${item.selectedSize}`)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchText ||
        String(order.orderNumber || "").toLowerCase().includes(searchText) ||
        String(order.customer?.name || "").toLowerCase().includes(searchText) ||
        String(order.customer?.phone || "").toLowerCase().includes(searchText) ||
        productText.includes(searchText);

      const { month, year } = getOrderDateParts(order.createdAt);

      const matchesMonth =
        !monthFilter || month === String(Number(monthFilter));

      const matchesYear = !yearFilter || year === String(yearFilter);

      const matchesPayment =
        paymentFilter === "all" || order.paymentStatus === paymentFilter;

      const matchesStatus =
        statusFilter === "all" || order.orderStatus === statusFilter;

      return (
        matchesSearch &&
        matchesMonth &&
        matchesYear &&
        matchesPayment &&
        matchesStatus
      );
    });
  }, [orders, search, monthFilter, yearFilter, paymentFilter, statusFilter]);

  const activeOrders = filteredOrders.filter(
    (order) => order.orderStatus !== "cancelled"
  );

  const cancelledOrders = filteredOrders.filter(
    (order) => order.orderStatus === "cancelled"
  );

  const paidOrders = filteredOrders.filter(
    (order) =>
      order.paymentStatus === "paid" && order.orderStatus !== "cancelled"
  );

  const pendingOrders = filteredOrders.filter(
    (order) =>
      order.paymentStatus === "pending" && order.orderStatus !== "cancelled"
  );

  const totalRevenue = activeOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice || 0),
    0
  );

  const paidRevenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice || 0),
    0
  );

  const pendingRevenue = pendingOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice || 0),
    0
  );

  const cancelledValue = cancelledOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice || 0),
    0
  );

  const generalTotalRevenue = orders
    .filter((order) => order.orderStatus !== "cancelled")
    .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

  const monthlyRevenue = useMemo(() => {
    const monthlyMap = {};

    orders.forEach((order) => {
      const { monthKey, monthName, year } = getOrderDateParts(order.createdAt);

      if (!monthKey || monthKey === "Unknown") return;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          key: monthKey,
          monthName,
          year,
          orders: 0,
          activeOrders: 0,
          revenue: 0,
          paidRevenue: 0,
          pendingRevenue: 0,
          cancelledValue: 0,
        };
      }

      monthlyMap[monthKey].orders += 1;

      if (order.orderStatus === "cancelled") {
        monthlyMap[monthKey].cancelledValue += Number(order.totalPrice || 0);
        return;
      }

      monthlyMap[monthKey].activeOrders += 1;
      monthlyMap[monthKey].revenue += Number(order.totalPrice || 0);

      if (order.paymentStatus === "paid") {
        monthlyMap[monthKey].paidRevenue += Number(order.totalPrice || 0);
      }

      if (order.paymentStatus === "pending") {
        monthlyMap[monthKey].pendingRevenue += Number(order.totalPrice || 0);
      }
    });

    return Object.values(monthlyMap).sort((a, b) =>
      b.key.localeCompare(a.key)
    );
  }, [orders]);

  const clearFilters = () => {
    setSearch("");
    setMonthFilter("");
    setYearFilter("");
    setPaymentFilter("all");
    setStatusFilter("all");
  };

  const maxMonthlyRevenue = Math.max(
    ...monthlyRevenue.map((item) => item.revenue),
    1
  );

  return (
    <main className="min-h-screen bg-transparent py-20">
      <div className="container">
        <AdminHeader
          currentUser={currentUser}
          title="Revenue Dashboard"
          subtitle="Track total revenue, paid revenue, pending revenue, cancelled value, and revenue by each month."
        />

        <section className="glass-panel mb-8 rounded-[2rem] p-6 shadow-2xl shadow-yellow-400/10 md:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-black/20 px-4 py-2 text-sm font-bold text-yellow-400 backdrop-blur-md">
                <TrendingUp size={16} />
                Professional Revenue Analytics
              </div>

              <h1 className="theme-text text-4xl font-black md:text-5xl">
                Revenue <span className="text-yellow-400">Dashboard</span>
              </h1>

              <p className="theme-muted mt-3 max-w-3xl">
                Track total revenue, paid revenue, pending revenue, cancelled
                value, and revenue by each month.
              </p>
            </div>

            <button
              onClick={fetchOrders}
              className="flex w-fit items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-4 font-black text-black transition hover:bg-yellow-300"
            >
              <RefreshCw size={18} />
              Refresh Revenue
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 font-bold text-red-500">
            {error}
          </div>
        )}

        <section className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-yellow-400/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/40 bg-yellow-400/10 text-yellow-400">
              <Banknote size={24} />
            </div>
            <p className="theme-muted">General Total</p>
            <h2 className="mt-2 text-3xl font-black text-yellow-400">
              {generalTotalRevenue} EGP
            </h2>
            <p className="theme-muted mt-2 text-sm">All non-cancelled orders</p>
          </div>

          <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-yellow-400/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-green-500/40 bg-green-500/10 text-green-500">
              <CheckCircle size={24} />
            </div>
            <p className="theme-muted">Filtered Revenue</p>
            <h2 className="mt-2 text-3xl font-black text-green-500">
              {totalRevenue} EGP
            </h2>
            <p className="theme-muted mt-2 text-sm">Current filters</p>
          </div>

          <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-yellow-400/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-green-500/40 bg-green-500/10 text-green-500">
              <Banknote size={24} />
            </div>
            <p className="theme-muted">Paid Revenue</p>
            <h2 className="mt-2 text-3xl font-black text-green-500">
              {paidRevenue} EGP
            </h2>
          </div>

          <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-yellow-400/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/40 bg-orange-500/10 text-orange-500">
              <Clock size={24} />
            </div>
            <p className="theme-muted">Pending Revenue</p>
            <h2 className="mt-2 text-3xl font-black text-orange-500">
              {pendingRevenue} EGP
            </h2>
          </div>

          <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-yellow-400/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 text-red-500">
              <XCircle size={24} />
            </div>
            <p className="theme-muted">Cancelled Value</p>
            <h2 className="mt-2 text-3xl font-black text-red-500">
              {cancelledValue} EGP
            </h2>
          </div>
        </section>

        <section className="glass-panel sticky top-24 z-30 mb-8 rounded-[2rem] p-5 shadow-2xl shadow-yellow-400/10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <Search size={18} />
              <h2 className="font-black">Revenue Filters</h2>
            </div>

            <button
              onClick={clearFilters}
              className="rounded-full border border-yellow-400/40 px-4 py-2 text-sm font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
            >
              Clear
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="theme-input flex items-center gap-2 rounded-2xl px-4 lg:col-span-2">
              <Search size={18} className="text-yellow-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Order number, customer, phone, product..."
                className="theme-text w-full bg-transparent py-3 outline-none"
              />
            </div>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="theme-input rounded-2xl px-4 py-3 outline-none"
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index === 0 ? "" : index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="theme-input rounded-2xl px-4 py-3 outline-none"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="theme-input rounded-2xl px-4 py-3 outline-none"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="theme-input rounded-2xl px-4 py-3 outline-none"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </section>

        {loading ? (
          <div className="glass-panel rounded-3xl p-10 text-center theme-text">
            Loading revenue...
          </div>
        ) : (
          <>
            <section className="glass-panel mb-8 rounded-[2rem] p-6 shadow-2xl shadow-yellow-400/10">
              <div className="mb-6 flex items-center gap-2 text-yellow-400">
                <BarChart3 size={20} />
                <h2 className="text-2xl font-black">Revenue by Month</h2>
              </div>

              <div className="space-y-4">
                {monthlyRevenue.map((item) => {
                  const width = Math.max(
                    8,
                    Math.round((item.revenue / maxMonthlyRevenue) * 100)
                  );

                  return (
                    <div
                      key={item.key}
                      className="rounded-3xl border border-yellow-400/20 bg-black/10 p-5"
                    >
                      <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-center">
                        <div>
                          <h3 className="theme-text text-xl font-black">
                            {item.monthName} {item.year}
                          </h3>
                          <p className="theme-muted text-sm">
                            {item.orders} orders · {item.activeOrders} active
                          </p>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-2xl font-black text-yellow-400">
                            {item.revenue} EGP
                          </p>
                          <p className="theme-muted text-sm">
                            Cancelled: {item.cancelledValue} EGP
                          </p>
                        </div>
                      </div>

                      <div className="h-4 overflow-hidden rounded-full bg-black/40">
                        <div
                          className="h-full rounded-full bg-yellow-400"
                          style={{ width: `${width}%` }}
                        />
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3">
                          <p className="theme-muted text-sm">Paid</p>
                          <p className="font-black text-green-500">
                            {item.paidRevenue} EGP
                          </p>
                        </div>

                        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3">
                          <p className="theme-muted text-sm">Pending</p>
                          <p className="font-black text-orange-500">
                            {item.pendingRevenue} EGP
                          </p>
                        </div>

                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3">
                          <p className="theme-muted text-sm">Cancelled</p>
                          <p className="font-black text-red-500">
                            {item.cancelledValue} EGP
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {monthlyRevenue.length === 0 && (
                  <p className="theme-muted text-center">No revenue data yet.</p>
                )}
              </div>
            </section>

            <section className="glass-panel rounded-[2rem] p-6 shadow-2xl shadow-yellow-400/10">
              <div className="mb-6 flex items-center gap-2 text-yellow-400">
                <CalendarDays size={20} />
                <h2 className="text-2xl font-black">Filtered Orders Revenue</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-black text-yellow-400">
                    <tr>
                      <th className="p-4">Order</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-t border-white/10">
                        <td className="theme-text p-4 font-bold">
                          {order.orderNumber}
                        </td>
                        <td className="theme-muted p-4">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="theme-text p-4">
                          {order.customer?.name || "No name"}
                        </td>
                        <td className="p-4">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-bold ${
                              order.paymentStatus === "paid"
                                ? "bg-green-500/10 text-green-500"
                                : order.paymentStatus === "failed"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-orange-500/10 text-orange-500"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-bold ${
                              order.orderStatus === "cancelled"
                                ? "bg-red-500/10 text-red-500"
                                : order.orderStatus === "delivered"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-yellow-400/10 text-yellow-400"
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                        <td
                          className={`p-4 font-black ${
                            order.orderStatus === "cancelled"
                              ? "text-red-500 line-through"
                              : "text-yellow-400"
                          }`}
                        >
                          {order.totalPrice} EGP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredOrders.length === 0 && (
                  <div className="theme-muted p-10 text-center">
                    No orders match the selected filters.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}