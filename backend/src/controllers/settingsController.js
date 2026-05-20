const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");

const defaultSettings = {
  store_name: "Hesham Store",
  description: "Modern shoes store for men, women, and kids.",
  logo_url: "",
  phone: "",
  email: "",
  address: "",
  instagram_url: "",
  facebook_url: "",
  telegram_url: "",

  location_1_name: "",
  location_1_address: "",
  location_1_map_url: "",
  location_2_name: "",
  location_2_address: "",
  location_2_map_url: "",
  location_3_name: "",
  location_3_address: "",
  location_3_map_url: "",
  location_4_name: "",
  location_4_address: "",
  location_4_map_url: "",
  location_5_name: "",
  location_5_address: "",
  location_5_map_url: "",
};

const settingKeys = Object.keys(defaultSettings);

const normalizeSettings = (body) => {
  const payload = {};

  settingKeys.forEach((key) => {
    if (body[key] !== undefined) {
      payload[key] = body[key] === null ? "" : String(body[key]);
    }
  });

  payload.updated_at = new Date().toISOString();

  return payload;
};

const getPublicSettings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return res.json({
      ...defaultSettings,
      ...(data || {}),
    });
  } catch (error) {
    console.error("Get settings error:", error);

    return res.status(500).json({
      message: "Failed to load settings",
      error: error.message,
    });
  }
};

const updateStoreSettings = async (req, res) => {
  try {
    const payload = normalizeSettings(req.body);

    const { data: existing, error: findError } = await supabase
      .from("store_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (findError) throw findError;

    let result;
    let error;

    if (existing?.id) {
      const updateResult = await supabase
        .from("store_settings")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single();

      result = updateResult.data;
      error = updateResult.error;
    } else {
      const insertResult = await supabase
        .from("store_settings")
        .insert(payload)
        .select("*")
        .single();

      result = insertResult.data;
      error = insertResult.error;
    }

    if (error) throw error;

    return res.json({
      message: "Store settings updated successfully",
      settings: {
        ...defaultSettings,
        ...(result || {}),
      },
    });
  } catch (error) {
    console.error("Update settings error:", error);

    return res.status(500).json({
      message: "Could not update store settings",
      error: error.message,
    });
  }
};

const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const adminPasswordHash = String(process.env.ADMIN_PASSWORD_HASH || "").trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Current password, new password, and confirm password are required",
      });
    }

    if (!adminPasswordHash) {
      return res.status(500).json({
        message: "ADMIN_PASSWORD_HASH is missing in .env",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match",
      });
    }

    const currentPasswordMatches = await bcrypt.compare(
      String(currentPassword),
      adminPasswordHash
    );

    if (!currentPasswordMatches) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const newPasswordHash = await bcrypt.hash(String(newPassword), 10);
    process.env.ADMIN_PASSWORD_HASH = newPasswordHash;

    return res.json({
      message:
        "Admin password changed successfully. Use the new password next login.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not change admin password",
    });
  }
};

module.exports = {
  getPublicSettings,
  updateStoreSettings,
  changeAdminPassword,
};