const supabase = require("../config/supabase");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "hesham_store_secret_key";

const getCurrentUser = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

const isOwner = (user) => {
  return user && user.role === "owner";
};

const getAdminUsers = async (req, res) => {
  try {
    const user = getCurrentUser(req);

    if (!user) {
      return res.status(401).json({
        message: "You must be logged in",
      });
    }

    const ownerUser = {
      id: "env-owner",
      name: process.env.ADMIN_NAME || "Owner",
      username:
        process.env.ADMIN_USERNAME ||
        process.env.ADMIN_EMAIL ||
        "owner",
      email: process.env.ADMIN_EMAIL || "",
      role: "owner",
      active: true,
      source: "env",
      protected: true,
      created_at: null,
      updated_at: null,
    };

    const { data, error } = await supabase
      .from("admin_users")
      .select("id, name, username, email, role, active, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return res.json([ownerUser, ...(Array.isArray(data) ? data : [])]);
  } catch (error) {
    console.error("Get admin users error:", error);

    return res.status(500).json({
      message: "Failed to load admin users",
      error: error.message,
    });
  }
};

const createAdminUser = async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);

    if (!isOwner(currentUser)) {
      return res.status(403).json({
        message: "Only owner can add admins",
      });
    }

    const { name, email, username, password, role, active } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const payload = {
      name: String(name).trim(),
      username: String(username || cleanEmail).trim().toLowerCase(),
      email: cleanEmail,
      password: String(password),
      role: role || "admin",
      active: active !== false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("admin_users")
      .insert(payload)
      .select("id, name, username, email, role, active, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      message: "Admin user created successfully",
      user: data,
    });
  } catch (error) {
    console.error("Create admin user error:", error);

    return res.status(500).json({
      message: "Failed to create admin user",
      error: error.message,
    });
  }
};

const updateAdminUser = async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);

    if (!isOwner(currentUser)) {
      return res.status(403).json({
        message: "Only owner can edit admins",
      });
    }

    const { id } = req.params;

    if (id === "env-owner") {
      return res.status(403).json({
        message: "Owner from ENV cannot be edited here",
      });
    }

    const payload = {
      updated_at: new Date().toISOString(),
    };

    if (req.body.name !== undefined) {
      payload.name = String(req.body.name).trim();
    }

    if (req.body.email !== undefined) {
      const cleanEmail = String(req.body.email).trim().toLowerCase();
      payload.email = cleanEmail;

      if (req.body.username === undefined) {
        payload.username = cleanEmail;
      }
    }

    if (req.body.username !== undefined) {
      payload.username = String(req.body.username).trim().toLowerCase();
    }

    if (req.body.password !== undefined && req.body.password) {
      payload.password = String(req.body.password);
    }

    if (req.body.role !== undefined) {
      payload.role = req.body.role || "admin";
    }

    if (req.body.active !== undefined) {
      payload.active = req.body.active;
    }

    const { data, error } = await supabase
      .from("admin_users")
      .update(payload)
      .eq("id", id)
      .select("id, name, username, email, role, active, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return res.json({
      message: "Admin user updated successfully",
      user: data,
    });
  } catch (error) {
    console.error("Update admin user error:", error);

    return res.status(500).json({
      message: "Failed to update admin user",
      error: error.message,
    });
  }
};

const deleteAdminUser = async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);

    if (!isOwner(currentUser)) {
      return res.status(403).json({
        message: "Only owner can delete admins",
      });
    }

    const { id } = req.params;

    if (id === "env-owner") {
      return res.status(403).json({
        message: "Owner cannot be deleted",
      });
    }

    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return res.json({
      message: "Admin user deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin user error:", error);

    return res.status(500).json({
      message: "Failed to delete admin user",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
};