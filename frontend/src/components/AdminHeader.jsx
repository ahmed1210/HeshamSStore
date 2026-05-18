"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, LogOut } from "lucide-react";

export default function AdminHeader({
  currentUser,
  title = "Admin Dashboard",
  subtitle = "Manage Hesham Store dashboard.",
  showBack = true,
}) {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminEmail");
    router.push("/admin/login");
  };

  return (
    <header className="admin-clean-header">
      <div className="admin-clean-actions">
        {showBack && (
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="admin-clean-btn"
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>
        )}

        <Link href="/" className="admin-clean-btn">
          <Home size={16} />
          Shop
        </Link>

        <button
          type="button"
          onClick={logout}
          className="admin-clean-btn admin-clean-logout"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <div className="admin-clean-title">
        <h1>{title}</h1>
        <span>{subtitle}</span>
      </div>
    </header>
  );
}