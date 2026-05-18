export const normalizeRole = (role) => {
  const safeRole = String(role || "").toLowerCase();

  if (safeRole === "owner") return "admin";

  return safeRole || "admin";
};

export const hasPageAccess = (user, page) => {
  if (!user) return false;

  const role = String(user.role || "").toLowerCase();

  if (role === "owner" || role === "admin" || role === "super-admin") {
    return true;
  }

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  if (permissions.includes("all")) {
    return true;
  }

  return permissions.includes(page);
};

export const requirePageAccess = (user, page, router) => {
  if (!user) return false;

  const allowed = hasPageAccess(user, page);

  if (!allowed) {
    router.push("/admin");
    return false;
  }

  return true;
};