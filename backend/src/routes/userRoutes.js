const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "hesham_store_secret_key";

const allowedRoles = ["owner", "admin", "manager", "staff"];

const DEV_OWNER = {
  id: 0,
  name: process.env.DEV_NAME || "Owner Developer",
  username: process.env.DEV_USERNAME || "owner",
  email: process.env.DEV_EMAIL || "owner@heshamstore.com",
  role: "owner",
  isMainAdmin: true,
  isDevOwner: true,
  passwordHash: process.env.DEV_PASSWORD_HASH,
  createdAt: new Date().toISOString(),
};

const MAIN_ADMIN = {
  id: 1,
  name: process.env.ADMIN_NAME || "Main Admin",
  username: process.env.ADMIN_USERNAME || "admin",
  email: process.env.ADMIN_EMAIL || "admin@heshamstore.com",
  role: "admin",
  isMainAdmin: true,
  isDevOwner: false,
  passwordHash: process.env.ADMIN_PASSWORD_HASH,
  createdAt: new Date().toISOString(),
};

let users = [
  DEV_OWNER,
  MAIN_ADMIN,
  {
    id: 2,
    name: "Store Manager",
    username: "manager",
    email: "manager@heshamstore.com",
    role: "manager",
    isMainAdmin: false,
    isDevOwner: false,
    passwordHash: bcrypt.hashSync("manager123", 10),
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Staff User",
    username: "staff",
    email: "staff@heshamstore.com",
    role: "staff",
    isMainAdmin: false,
    isDevOwner: false,
    passwordHash: bcrypt.hashSync("staff123", 10),
    createdAt: new Date().toISOString(),
  },
];

const removePassword = (user) => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  isMainAdmin: user.isMainAdmin || false,
  isDevOwner: user.isDevOwner || false,
  createdAt: user.createdAt,
});

const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isMainAdmin: user.isMainAdmin || false,
      isDevOwner: user.isDevOwner || false,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const getCurrentUser = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return users.find((user) => user.id === decoded.id) || null;
  } catch (error) {
    return null;
  }
};

const requireLoggedIn = (req, res) => {
  const currentUser = getCurrentUser(req);

  if (!currentUser) {
    res.status(401).json({
      message: "You must be logged in",
    });

    return null;
  }

  return currentUser;
};

const canCreateRole = (currentUser, newRole) => {
  if (currentUser.role === "owner") return true;
  if (currentUser.role === "admin" && newRole !== "owner") return true;
  if (currentUser.role === "manager" && newRole === "staff") return true;

  return false;
};

const canManageTargetUser = (currentUser, targetUser) => {
  // Owner can manage everyone, including main admin
  if (currentUser.role === "owner") return true;

  // Nobody except owner can touch owner/dev account
  if (targetUser.role === "owner" || targetUser.isDevOwner) return false;

  // Nobody except owner can touch main admin
  if (targetUser.isMainAdmin && currentUser.role !== "owner") return false;

  // Admin can manage normal admin/manager/staff accounts
  if (currentUser.role === "admin") return true;

  // Manager can only manage staff
  if (currentUser.role === "manager" && targetUser.role === "staff") {
    return true;
  }

  return false;
};

// Login by username OR email
router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({
        message: "Username/email and password are required",
      });
    }

    const user = users.find(
      (item) =>
        item.email.toLowerCase() === String(login).toLowerCase() ||
        item.username.toLowerCase() === String(login).toLowerCase()
    );

    if (!user) {
      return res.status(401).json({
        message: "Invalid username/email or password",
      });
    }

    if (!user.passwordHash) {
      return res.status(500).json({
        message:
          user.role === "owner"
            ? "Owner password hash is missing in .env"
            : "Admin password hash is missing in .env",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid username/email or password",
      });
    }

    const token = createToken(user);

    res.json({
      message: "Login successful",
      token,
      user: removePassword(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
    });
  }
});

// Current logged-in user
router.get("/me", (req, res) => {
  try {
    const currentUser = requireLoggedIn(req, res);
    if (!currentUser) return;

    res.json(removePassword(currentUser));
  } catch (error) {
    console.error("Get me error:", error);

    res.status(500).json({
      message: "Failed to load current user",
    });
  }
});

// Get users list
// Owner/dev account is hidden from the table for everyone
router.get("/", (req, res) => {
  try {
    const currentUser = requireLoggedIn(req, res);
    if (!currentUser) return;

    const visibleUsers = users.filter(
      (user) => user.role !== "owner" && !user.isDevOwner
    );

    res.json(visibleUsers.map(removePassword));
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      message: "Failed to load users",
    });
  }
});

// Create user
router.post("/", async (req, res) => {
  try {
    const currentUser = requireLoggedIn(req, res);
    if (!currentUser) return;

    const { name, username, email, role, password } = req.body;
    const newRole = role || "staff";

    if (!["owner", "admin", "manager"].includes(currentUser.role)) {
      return res.status(403).json({
        message: "You do not have permission to create users",
      });
    }

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        message: "Name, username, email, and password are required",
      });
    }

    if (!allowedRoles.includes(newRole)) {
      return res.status(400).json({
        message: "Invalid role selected",
      });
    }

    if (!canCreateRole(currentUser, newRole)) {
      return res.status(403).json({
        message: "You do not have permission to create this role",
      });
    }

    const existingEmail = users.find(
      (user) => user.email.toLowerCase() === String(email).toLowerCase()
    );

    if (existingEmail) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    const existingUsername = users.find(
      (user) => user.username.toLowerCase() === String(username).toLowerCase()
    );

    if (existingUsername) {
      return res.status(409).json({
        message: "User with this username already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now(),
      name: String(name).trim(),
      username: String(username).trim(),
      email: String(email).trim(),
      role: newRole,
      isMainAdmin: false,
      isDevOwner: false,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    res.status(201).json({
      message: "User created successfully",
      user: removePassword(newUser),
    });
  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
      message: "Failed to create user",
    });
  }
});

// Update user
router.put("/:id", async (req, res) => {
  try {
    const currentUser = requireLoggedIn(req, res);
    if (!currentUser) return;

    const userId = Number(req.params.id);
    const { name, username, email, role, password } = req.body;

    if (!["owner", "admin", "manager"].includes(currentUser.role)) {
      return res.status(403).json({
        message: "You do not have permission to update users",
      });
    }

    const userIndex = users.findIndex((user) => user.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const targetUser = users[userIndex];

    if (!canManageTargetUser(currentUser, targetUser)) {
      return res.status(403).json({
        message: "You do not have permission to edit this user",
      });
    }

    const updatedRole = targetUser.isDevOwner
      ? "owner"
      : targetUser.isMainAdmin
      ? "admin"
      : role || targetUser.role;

    if (!allowedRoles.includes(updatedRole)) {
      return res.status(400).json({
        message: "Invalid role selected",
      });
    }

    if (!canCreateRole(currentUser, updatedRole)) {
      return res.status(403).json({
        message: "You do not have permission to assign this role",
      });
    }

    if (email) {
      const duplicateEmail = users.find(
        (user) =>
          user.email.toLowerCase() === String(email).toLowerCase() &&
          user.id !== userId
      );

      if (duplicateEmail) {
        return res.status(409).json({
          message: "Another user already uses this email",
        });
      }
    }

    if (username) {
      const duplicateUsername = users.find(
        (user) =>
          user.username.toLowerCase() === String(username).toLowerCase() &&
          user.id !== userId
      );

      if (duplicateUsername) {
        return res.status(409).json({
          message: "Another user already uses this username",
        });
      }
    }

    users[userIndex] = {
      ...users[userIndex],
      name: name ? String(name).trim() : users[userIndex].name,
      username: username ? String(username).trim() : users[userIndex].username,
      email: email ? String(email).trim() : users[userIndex].email,
      role: updatedRole,
    };

    if (password && String(password).trim() !== "") {
      users[userIndex].passwordHash = await bcrypt.hash(password, 10);
    }

    res.json({
      message: "User updated successfully",
      user: removePassword(users[userIndex]),
    });
  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      message: "Failed to update user",
    });
  }
});

// Delete user
router.delete("/:id", (req, res) => {
  try {
    const currentUser = requireLoggedIn(req, res);
    if (!currentUser) return;

    const userId = Number(req.params.id);

    if (!["owner", "admin", "manager"].includes(currentUser.role)) {
      return res.status(403).json({
        message: "You do not have permission to delete users",
      });
    }

    const userToDelete = users.find((user) => user.id === userId);

    if (!userToDelete) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (userToDelete.isDevOwner || userToDelete.role === "owner") {
      return res.status(400).json({
        message: "Owner developer account cannot be deleted",
      });
    }

    if (userToDelete.isMainAdmin) {
      return res.status(400).json({
        message: "Main admin cannot be deleted",
      });
    }

    if (!canManageTargetUser(currentUser, userToDelete)) {
      return res.status(403).json({
        message: "You do not have permission to delete this user",
      });
    }

    users = users.filter((user) => user.id !== userId);

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      message: "Failed to delete user",
    });
  }
});

module.exports = router;