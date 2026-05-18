const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

let dashboardUsers = [];

const getEnvAccounts = () => {
  const accounts = [];

  if (process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL) {
    accounts.push({
      id: "admin-main",
      name: process.env.ADMIN_NAME || "Main Admin",
      username: process.env.ADMIN_USERNAME || "admin",
      email: process.env.ADMIN_EMAIL || "",
      passwordHash: process.env.ADMIN_PASSWORD_HASH || "",
      role: "owner",
      permissions: ["all"],
      source: "env",
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  if (process.env.DEV_USERNAME || process.env.DEV_EMAIL) {
    accounts.push({
      id: "dev-main",
      name: process.env.DEV_NAME || "Developer",
      username: process.env.DEV_USERNAME || "",
      email: process.env.DEV_EMAIL || "",
      passwordHash: process.env.DEV_PASSWORD_HASH || "",
      role: "owner",
      permissions: ["all"],
      source: "env",
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  return accounts;
};

const getAllUsers = () => {
  return [...getEnvAccounts(), ...dashboardUsers];
};

const safeUser = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
    active: user.active !== false,
    source: user.source || "dashboard",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const signToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
    },
    process.env.JWT_SECRET || "hesham_store_secret_key",
    {
      expiresIn: "7d",
    }
  );
};

const adminLogin = async (req, res) => {
  try {
    const { identifier, username, email, password } = req.body;

    const loginValue = String(identifier || username || email || "")
      .trim()
      .toLowerCase();

    const inputPassword = String(password || "").trim();

    if (!loginValue || !inputPassword) {
      return res.status(400).json({
        message: "Username/email and password are required",
      });
    }

    const users = getAllUsers();

    const account = users.find((user) => {
      const accountUsername = String(user.username || "").trim().toLowerCase();
      const accountEmail = String(user.email || "").trim().toLowerCase();

      return loginValue === accountUsername || loginValue === accountEmail;
    });

    if (!account || !account.passwordHash) {
      return res.status(401).json({
        message: "Invalid username/email or password",
      });
    }

    if (account.active === false) {
      return res.status(403).json({
        message: "This account is disabled",
      });
    }

    const passwordMatch = await bcrypt.compare(
      inputPassword,
      account.passwordHash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid username/email or password",
      });
    }

    const user = safeUser(account);
    const token = signToken(user);

    return res.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      message: "Login failed",
    });
  }
};

const getAdminDashboard = (req, res) => {
  try {
    const users = getAllUsers();

    return res.json({
      message: "Admin dashboard loaded successfully",
      stats: {
        users: users.length,
        dashboardUsers: dashboardUsers.length,
        envAccounts: getEnvAccounts().length,
      },
      user: req.admin || req.user || null,
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);

    return res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
};

const getAdminUsers = (req, res) => {
  try {
    const users = getAllUsers()
      .filter((user) => user.role !== "owner")
      .map(safeUser);

    return res.json(users);
  } catch (error) {
    console.error("Get admin users error:", error);

    return res.status(500).json({
      message: "Failed to load users",
    });
  }
};

const createAdminUser = async (req, res) => {
  try {
    const { name, username, email, password, role, active, permissions } =
      req.body;

    const cleanName = String(name || "").trim();
    const cleanUsername = String(username || "").trim().toLowerCase();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "").trim();
    const cleanRole = String(role || "staff").trim().toLowerCase();

    const cleanPermissions = Array.isArray(permissions)
      ? permissions.map((item) => String(item).trim()).filter(Boolean)
      : ["dashboard"];

    if (!cleanName || cleanName.length < 3) {
      return res.status(400).json({
        message: "Name must be at least 3 characters",
      });
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      return res.status(400).json({
        message: "Username must be at least 3 characters",
      });
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email",
      });
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    if (!["admin", "manager", "staff"].includes(cleanRole)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const users = getAllUsers();

    const exists = users.some((user) => {
      const userUsername = String(user.username || "").trim().toLowerCase();
      const userEmail = String(user.email || "").trim().toLowerCase();

      return (
        userUsername === cleanUsername ||
        (cleanEmail && userEmail === cleanEmail)
      );
    });

    if (exists) {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    const newUser = {
      id: Date.now().toString(),
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      role: cleanRole,
      permissions: cleanPermissions,
      source: "dashboard",
      active: typeof active === "boolean" ? active : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dashboardUsers.push(newUser);

    return res.status(201).json({
      message: "User created successfully",
      user: safeUser(newUser),
    });
  } catch (error) {
    console.error("Create admin user error:", error);

    return res.status(500).json({
      message: "Failed to create user",
    });
  }
};

const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email, password, role, active, permissions } =
      req.body;

    const userIndex = dashboardUsers.findIndex(
      (user) => String(user.id) === String(id)
    );

    if (userIndex === -1) {
      return res.status(404).json({
        message: "User not found or cannot be edited",
      });
    }

    const currentUser = dashboardUsers[userIndex];

    const cleanName = String(name || currentUser.name || "").trim();
    const cleanUsername = String(username || currentUser.username || "")
      .trim()
      .toLowerCase();
    const cleanEmail = String(email || currentUser.email || "")
      .trim()
      .toLowerCase();
    const cleanRole = String(role || currentUser.role || "staff")
      .trim()
      .toLowerCase();

    const cleanPermissions = Array.isArray(permissions)
      ? permissions.map((item) => String(item).trim()).filter(Boolean)
      : currentUser.permissions || ["dashboard"];

    if (!cleanName || cleanName.length < 3) {
      return res.status(400).json({
        message: "Name must be at least 3 characters",
      });
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      return res.status(400).json({
        message: "Username must be at least 3 characters",
      });
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email",
      });
    }

    if (!["admin", "manager", "staff"].includes(cleanRole)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const users = getAllUsers();

    const exists = users.some((user) => {
      if (String(user.id) === String(id)) return false;

      const userUsername = String(user.username || "").trim().toLowerCase();
      const userEmail = String(user.email || "").trim().toLowerCase();

      return (
        userUsername === cleanUsername ||
        (cleanEmail && userEmail === cleanEmail)
      );
    });

    if (exists) {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }

    let passwordHash = currentUser.passwordHash;

    if (password && String(password).trim()) {
      const cleanPassword = String(password).trim();

      if (cleanPassword.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters",
        });
      }

      passwordHash = await bcrypt.hash(cleanPassword, 10);
    }

    const updatedUser = {
      ...currentUser,
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      role: cleanRole,
      permissions: cleanPermissions,
      active: typeof active === "boolean" ? active : currentUser.active,
      passwordHash,
      updatedAt: new Date().toISOString(),
    };

    dashboardUsers[userIndex] = updatedUser;

    return res.json({
      message: "User updated successfully",
      user: safeUser(updatedUser),
    });
  } catch (error) {
    console.error("Update admin user error:", error);

    return res.status(500).json({
      message: "Failed to update user",
    });
  }
};

const deleteAdminUser = (req, res) => {
  try {
    const { id } = req.params;

    const userIndex = dashboardUsers.findIndex(
      (user) => String(user.id) === String(id)
    );

    if (userIndex === -1) {
      return res.status(404).json({
        message: "User not found or cannot be deleted",
      });
    }

    dashboardUsers.splice(userIndex, 1);

    return res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin user error:", error);

    return res.status(500).json({
      message: "Failed to delete user",
    });
  }
};

module.exports = {
  adminLogin,
  getAdminDashboard,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
};