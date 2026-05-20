"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgePercent,
  BarChart3,
  Boxes,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Tags,
  Truck,
  Users,
} from "lucide-react";

const adminCards = [
  {
    title: "Products",
    description: "Add, edit, delete products and upload product images.",
    href: "/admin/products",
    permission: "products",
    icon: Package,
  },
  {
    title: "Price & Stock",
    description: "Update prices, discounts, size stock, and quantities.",
    href: "/admin/price-stock",
    permission: "price-stock",
    icon: Boxes,
  },
  {
    title: "Orders",
    description: "View orders, customer details, items, dates, and status.",
    href: "/admin/orders",
    permission: "orders",
    icon: ClipboardList,
  },
  {
    title: "Revenue",
    description: "Track total sales and monthly revenue performance.",
    href: "/admin/revenue",
    permission: "revenue",
    icon: BarChart3,
  },
  {
    title: "Categories",
    description: "Manage category names, slugs, images, and homepage sections.",
    href: "/admin/categories",
    permission: "categories",
    icon: FolderTree,
  },
  {
    title: "Brands",
    description: "Manage brand names, logo URLs, and homepage logo cards.",
    href: "/admin/brands",
    permission: "brands",
    icon: Tags,
  },
  {
    title: "Delivery",
    description: "Add delivery places and set shipping prices.",
    href: "/admin/delivery",
    permission: "delivery",
    icon: Truck,
  },
  {
    title: "Discounts",
    description: "Create percentage, fixed amount, and free delivery codes.",
    href: "/admin/discounts",
    permission: "discounts",
    icon: BadgePercent,
  },
  {
    title: "Users",
    description: "Create dashboard users, roles, and page access.",
    href: "/admin/users",
    permission: "users",
    icon: Users,
  },
  {
    title: "Store Settings",
    description: "Edit store name, contact, locations, social links, and logo.",
    href: "/admin/settings",
    permission: "settings",
    icon: Settings,
  },
];

const hasPageAccess = (user, permission) => {
  if (!user) return false;

  const role = String(user.role || "").toLowerCase();

  if (role === "owner" || role === "admin" || role === "super-admin") {
    return true;
  }

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  if (permissions.includes("all")) {
    return true;
  }

  if (permission === "dashboard") {
    return permissions.includes("dashboard");
  }

  return permissions.includes(permission);
};

const getDisplayRole = (role) => {
  const safeRole = String(role || "admin").toLowerCase();

  if (safeRole === "owner" || safeRole === "super-admin") {
    return "admin";
  }

  return safeRole;
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = () => {
    try {
      const savedToken = localStorage.getItem("adminToken");
      const savedUser = localStorage.getItem("adminUser");

      if (!savedToken || !savedUser) {
        router.push("/admin/login");
        return;
      }

      const parsedUser = JSON.parse(savedUser);

      if (!parsedUser || !parsedUser.role) {
        logout();
        return;
      }

      setCurrentUser(parsedUser);
      setReady(true);
    } catch (error) {
      console.error("Load admin user error:", error);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminEmail");
    router.push("/admin/login");
  };

  const visibleCards = useMemo(() => {
    if (!currentUser) return [];

    return adminCards.filter((card) =>
      hasPageAccess(currentUser, card.permission)
    );
  }, [currentUser]);

  const displayRole = getDisplayRole(currentUser?.role);

  if (!ready || !currentUser) {
    return (
      <main className="admin-dashboard-page min-h-screen bg-[#020617] p-6 text-white md:p-8">
        <div className="rounded-3xl border border-yellow-400/20 bg-[#111827] p-6 font-black">
          Loading dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-page min-h-screen bg-[#020617] p-6 text-white md:p-8">
      <section className="mb-8 overflow-hidden rounded-4xl border border-yellow-400/20 bg-[#111827] p-6 shadow-2xl shadow-black/30 md:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
              <LayoutDashboard size={16} />
              Admin Dashboard
            </div>

            <h1 className="text-3xl font-black uppercase leading-none text-white md:text-5xl">
              Hesham Store
              <span className="block text-yellow-400">Control Panel</span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-zinc-300 md:text-base">
              Manage products, brands, categories, orders, stock, delivery,
              discounts, users, and store settings from one clean dashboard.
            </p>
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-[#020617] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
              Signed in as
            </p>

            <p className="mt-2 text-xl font-black text-white">
              {currentUser.name || currentUser.username || "Admin"}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black uppercase text-black">
                {displayRole}
              </span>

              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-red-400/30 px-3 py-1 text-xs font-black uppercase text-red-300 transition hover:bg-red-500 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Available Pages" value={visibleCards.length} />
        <StatCard label="Access Level" value={displayRole.toUpperCase()} />
        <StatCard label="Store Mode" value="Live" />
        <StatCard label="Database" value="Supabase" />
      </section>

      {visibleCards.length === 0 ? (
        <section className="rounded-4xl border border-yellow-400/20 bg-[#111827] p-8 text-center">
          <ShoppingBag className="mx-auto text-yellow-400" size={44} />

          <h2 className="mt-4 text-2xl font-black uppercase text-white">
            No Pages Available
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-zinc-400">
            This account does not have access to any admin pages yet. Ask an
            admin to update page access for this account.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.href}
                href={card.href}
                className="group relative overflow-hidden rounded-[2rem] border border-yellow-400/20 bg-[#111827] p-6 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-yellow-400/50 hover:bg-[#172033]"
              >
                <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-yellow-400/10 transition group-hover:bg-yellow-400/20" />

                <div className="relative z-10">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-lg shadow-yellow-400/20">
                    <Icon size={26} />
                  </div>

                  <h2 className="text-xl font-black uppercase text-white">
                    {card.title}
                  </h2>

                  <p className="mt-3 min-h-13 text-sm font-semibold leading-6 text-zinc-400">
                    {card.description}
                  </p>

                  <div className="mt-6 inline-flex rounded-full border border-yellow-400/30 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-400 transition group-hover:bg-yellow-400 group-hover:text-black">
                    Open Page
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}

      <section className="mt-8 rounded-4xl border border-yellow-400/20 bg-[#111827] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
              Store Status
            </p>

            <h2 className="mt-2 text-2xl font-black uppercase text-white">
              Ready for Testing
            </h2>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-zinc-400">
              Products, brands, categories, settings, and orders are connected
              to Supabase for testing and demo.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-yellow-400/30 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
          >
            Back to Shop
          </Link>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-yellow-400/20 bg-[#111827] p-5 shadow-xl shadow-black/20">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </p>

      <strong className="mt-3 block text-2xl font-black text-yellow-400">
        {value}
      </strong>
    </div>
  );
}