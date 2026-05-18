"use client";

import { apiUrl } from "@/lib/api";
import AdminHeader from "@/components/AdminHeader";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Edit,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

const emptyForm = {
  name: "",
  username: "",
  email: "",
  role: "staff",
  password: "",
  active: true,
};

const roleOptions = [
  { label: "Admin - Full Access", value: "admin" },
  { label: "Manager - Manage Store", value: "manager" },
  { label: "Staff - View Only", value: "staff" },
];

export default function AdminUsersPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
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

  const canManageUsers =
    currentUser?.role === "owner" || currentUser?.role === "admin";

  const loadUsers = async () => {
    try {
      setLoading(true);

      const res = await fetch(apiUrl("/api/admin/users"), {
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        throw new Error(data.message || "You do not have permission");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to load users");
      }

      const usersArray = Array.isArray(data)
        ? data
        : Array.isArray(data.users)
        ? data.users
        : Array.isArray(data.data)
        ? data.data
        : [];

      setUsers(usersArray);
    } catch (error) {
      console.error("Load users error:", error);

      const text = String(error.message || "").toLowerCase();

      if (text.includes("failed to fetch")) {
        showMessage(
          "Cannot connect to backend. Please make sure backend is running.",
          "error"
        );
      } else {
        showMessage(error.message || "Failed to load users", "error");
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

    if (name === "username") {
      setForm((prev) => ({
        ...prev,
        username: value.toLowerCase().replace(/\s/g, ""),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const cleanName = form.name.trim();
    const cleanUsername = form.username.trim();
    const cleanEmail = form.email.trim();
    const cleanPassword = form.password.trim();

    if (!cleanName || cleanName.length < 3) {
      showMessage("Full name must be at least 3 characters.", "error");
      return false;
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      showMessage("Username must be at least 3 characters.", "error");
      return false;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showMessage("Please enter a valid email address.", "error");
      return false;
    }

    if (!["admin", "manager", "staff"].includes(form.role)) {
      showMessage("Please select a valid user role.", "error");
      return false;
    }

    if (!editingId && (!cleanPassword || cleanPassword.length < 6)) {
      showMessage("Password must be at least 6 characters.", "error");
      return false;
    }

    if (editingId && cleanPassword && cleanPassword.length < 6) {
      showMessage("New password must be at least 6 characters.", "error");
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      username: form.username.trim().toLowerCase(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      active: form.active,
    };

    if (form.password.trim()) {
      payload.password = form.password.trim();
    }

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManageUsers) {
      showMessage("You do not have permission to manage users.", "error");
      return;
    }

    if (!validateForm()) return;

    try {
      setSaving(true);

      const url = editingId
        ? apiUrl(`/api/admin/users/${editingId}`)
        : apiUrl("/api/admin/users");

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
        throw new Error(data.message || "Failed to save user");
      }

      showMessage(
        editingId ? "User updated successfully." : "User created successfully."
      );

      resetForm();
      loadUsers();
    } catch (error) {
      console.error("Save user error:", error);
      showMessage(error.message || "Failed to save user", "error");
      handleAuthError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user) => {
    if (!canManageUsers) {
      showMessage("You do not have permission to edit users.", "error");
      return;
    }

    if (user.source === "env") {
      showMessage(
        "Environment accounts cannot be edited here. Change them in backend .env.",
        "error"
      );
      return;
    }

    setEditingId(user.id);

    setForm({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      role: user.role || "staff",
      password: "",
      active: user.active !== false,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (user) => {
    if (!canManageUsers) {
      showMessage("You do not have permission to delete users.", "error");
      return;
    }

    if (user.source === "env") {
      showMessage(
        "Environment accounts cannot be deleted here. Change them in backend .env.",
        "error"
      );
      return;
    }

    const confirmDelete = window.confirm(`Delete user ${user.username}?`);
    if (!confirmDelete) return;

    try {
      setSaving(true);

      const res = await fetch(apiUrl(`/api/admin/users/${user.id}`), {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        throw new Error(data.message || "You do not have permission");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete user");
      }

      showMessage("User deleted successfully.");

      if (editingId === user.id) {
        resetForm();
      }

      loadUsers();
    } catch (error) {
      console.error("Delete user error:", error);
      showMessage(error.message || "Failed to delete user", "error");
      handleAuthError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const visibleUsers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return users.filter((user) => {
      const userRole = String(user.role || "").toLowerCase();

      if (roleFilter !== "all" && userRole !== roleFilter) {
        return false;
      }

      if (!searchText) return true;

      const userText = `${user.name || ""} ${user.username || ""} ${
        user.email || ""
      } ${user.role || ""}`.toLowerCase();

      return userText.includes(searchText);
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((user) => user.role === "admin" || user.role === "owner")
        .length,
      managers: users.filter((user) => user.role === "manager").length,
      staff: users.filter((user) => user.role === "staff").length,
    };
  }, [users]);

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
  };

  if (!currentUser) {
    return (
      <main className="admin-page min-h-screen bg-[#020617] p-8 text-white">
        <div className="admin-card p-6 font-bold">Loading users...</div>
      </main>
    );
  }

  return (
    <main className="admin-page min-h-screen bg-[#020617] p-8 text-white">
      <AdminHeader
        currentUser={currentUser}
        title="Users Management"
        subtitle="Create dashboard users, assign roles, and manage access."
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
        <StatCard label="Total Users" value={stats.total} />
        <StatCard label="Admins" value={stats.admins} />
        <StatCard label="Managers" value={stats.managers} />
        <StatCard label="Staff" value={stats.staff} />
      </section>

      <section className="admin-card mb-6 p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
          Dashboard Access
        </p>

        <h2 className="mt-2 text-2xl font-black uppercase text-white">
          User Control
        </h2>

        <p className="mt-2 max-w-3xl leading-7 text-blue-100">
          Environment accounts are controlled from the backend settings. New
          users created here are dashboard users for testing and store
          management.
        </p>
      </section>

      <section className="admin-main-grid grid xl:grid-cols-[430px_1fr]">
        <div className="admin-card p-6">
          <div className="mb-6 flex items-center gap-2 text-yellow-400">
            {editingId ? <Edit size={20} /> : <UserPlus size={20} />}

            <h2 className="text-xl font-black uppercase">
              {editingId ? "Edit User" : "Add New User"}
            </h2>
          </div>

          {!canManageUsers ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 font-bold text-red-300">
              You do not have permission to manage users.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Full Name">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="Example: Ahmed Ali"
                />
              </Field>

              <Field label="Username">
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="Example: ahmed"
                />
              </Field>

              <Field label="Email Address">
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="example@email.com"
                />
              </Field>

              <Field label="User Role">
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="admin-input"
                >
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={editingId ? "New Password" : "Password"}>
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder={
                    editingId
                      ? "Leave empty to keep current password"
                      : "Enter password"
                  }
                  type="password"
                />
              </Field>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-yellow-400/20 bg-[#020617] p-4 font-bold text-zinc-200">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                Active account
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="admin-btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />
                  {saving ? "Saving..." : editingId ? "Update User" : "Add User"}
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
              <Users size={22} />
              <h2 className="text-xl font-black uppercase">Users List</h2>
            </div>

            <button
              type="button"
              onClick={loadUsers}
              className="admin-btn-outline w-fit"
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <div className="flex items-center gap-3 rounded-2xl border border-yellow-400/20 bg-[#020617] px-4">
              <Search size={18} className="text-yellow-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent py-3 text-white outline-none"
                placeholder="Search name, username, email..."
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="admin-input"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="admin-btn-outline justify-center"
            >
              <X size={16} />
              Clear
            </button>
          </div>

          {loading ? (
            <div className="admin-card-dark p-8 text-center font-bold text-zinc-400">
              Loading users...
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="admin-card-dark p-8 text-center">
              <Shield className="mx-auto text-yellow-400" size={44} />
              <h3 className="mt-4 text-xl font-black">No users found</h3>
              <p className="mt-2 text-zinc-400">
                Try clearing search or role filter.
              </p>
            </div>
          ) : (
            <>
              <div className="users-desktop-table overflow-x-auto">
                <table className="w-full min-w-[920px] text-left">
                  <thead>
                    <tr className="border-b border-yellow-400/20 text-yellow-400">
                      <th className="p-4 text-sm font-black uppercase">User</th>
                      <th className="p-4 text-sm font-black uppercase">
                        Username
                      </th>
                      <th className="p-4 text-sm font-black uppercase">Role</th>
                      <th className="p-4 text-sm font-black uppercase">
                        Source
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
                    {visibleUsers.map((user) => (
                      <UserTableRow
                        key={user.id}
                        user={user}
                        canManageUsers={canManageUsers}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="users-mobile-cards">
                {visibleUsers.map((user) => (
                  <UserMobileCard
                    key={user.id}
                    user={user}
                    canManageUsers={canManageUsers}
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
      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
        {label}
      </p>

      <strong className="mt-3 block text-3xl font-black text-yellow-400">
        {value}
      </strong>
    </div>
  );
}

function UserTableRow({ user, canManageUsers, onEdit, onDelete }) {
  const isEnvUser = user.source === "env";

  return (
    <tr className="border-b border-white/10">
      <td className="p-4">
        <p className="font-black text-white">{user.name || "User"}</p>
        <p className="mt-1 text-sm text-blue-100">{user.email || "-"}</p>
      </td>

      <td className="p-4 font-bold text-zinc-200">{user.username || "-"}</td>

      <td className="p-4">
        <RoleBadge role={user.role} />
      </td>

      <td className="p-4">
        <span className="rounded-full border border-yellow-400/25 px-3 py-1 text-xs font-black uppercase text-yellow-400">
          {isEnvUser ? "Env" : "Dashboard"}
        </span>
      </td>

      <td className="p-4">
        <StatusBadge active={user.active !== false} />
      </td>

      <td className="p-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(user)}
            disabled={!canManageUsers || isEnvUser}
            className="rounded-full bg-blue-500/15 px-4 py-2 text-xs font-black text-blue-300 transition hover:bg-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(user)}
            disabled={!canManageUsers || isEnvUser}
            className="rounded-full bg-red-500/15 px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function UserMobileCard({ user, canManageUsers, onEdit, onDelete }) {
  const isEnvUser = user.source === "env";

  return (
    <article className="admin-card-dark p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-white">
            {user.name || "User"}
          </h3>

          <p className="mt-1 text-sm font-bold text-blue-100">
            @{user.username || "-"}
          </p>

          <p className="mt-1 text-sm text-zinc-400">{user.email || "-"}</p>
        </div>

        <RoleBadge role={user.role} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-white/10 bg-[#020617] p-3">
          <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Source
          </p>
          <p className="mt-1 font-black text-yellow-400">
            {isEnvUser ? "Env" : "Dashboard"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#020617] p-3">
          <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Status
          </p>
          <div className="mt-1">
            <StatusBadge active={user.active !== false} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(user)}
          disabled={!canManageUsers || isEnvUser}
          className="rounded-full bg-blue-500/15 px-4 py-3 text-xs font-black text-blue-300 transition hover:bg-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(user)}
          disabled={!canManageUsers || isEnvUser}
          className="rounded-full bg-red-500/15 px-4 py-3 text-xs font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function RoleBadge({ role }) {
  const safeRole = String(role || "staff").toLowerCase();

  const className =
    safeRole === "owner" || safeRole === "admin"
      ? "bg-yellow-400 text-black"
      : safeRole === "manager"
      ? "bg-blue-500/15 text-blue-300"
      : "bg-zinc-500/15 text-zinc-300";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${className}`}>
      {safeRole === "owner" ? "Admin" : safeRole}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
        active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
      }`}
    >
      {active ? "Active" : "Disabled"}
    </span>
  );
} 