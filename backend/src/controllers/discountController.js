const supabase = require("../config/supabase");

const getDiscounts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("discounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Get discounts error:", error);

    return res.status(500).json({
      message: "Failed to load discounts",
      error: error.message,
    });
  }
};

const createDiscount = async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      label,
      active,
      start_date,
      end_date,
      max_uses,
      min_subtotal,
    } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Discount code is required" });
    }

    if (!["percentage", "fixed", "free_delivery"].includes(type)) {
      return res.status(400).json({ message: "Invalid discount type" });
    }

    const payload = {
      code: String(code).trim().toUpperCase(),
      type,
      value: Number(value || 0),
      label: label || String(code).trim().toUpperCase(),
      active: active !== false,
      start_date: start_date || null,
      end_date: end_date || null,
      max_uses: max_uses === "" || max_uses === undefined ? null : Number(max_uses),
      min_subtotal: Number(min_subtotal || 0),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("discounts")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    return res.status(201).json({
      message: "Discount created successfully",
      discount: data,
    });
  } catch (error) {
    console.error("Create discount error:", error);

    return res.status(500).json({
      message: "Failed to create discount",
      error: error.message,
    });
  }
};

const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;

    const payload = {
      updated_at: new Date().toISOString(),
    };

    if (req.body.code !== undefined) {
      payload.code = String(req.body.code).trim().toUpperCase();
    }

    if (req.body.type !== undefined) {
      if (!["percentage", "fixed", "free_delivery"].includes(req.body.type)) {
        return res.status(400).json({ message: "Invalid discount type" });
      }

      payload.type = req.body.type;
    }

    if (req.body.value !== undefined) payload.value = Number(req.body.value || 0);
    if (req.body.label !== undefined) payload.label = req.body.label || "";
    if (req.body.active !== undefined) payload.active = req.body.active;
    if (req.body.start_date !== undefined) payload.start_date = req.body.start_date || null;
    if (req.body.end_date !== undefined) payload.end_date = req.body.end_date || null;

    if (req.body.max_uses !== undefined) {
      payload.max_uses =
        req.body.max_uses === "" || req.body.max_uses === null
          ? null
          : Number(req.body.max_uses);
    }

    if (req.body.min_subtotal !== undefined) {
      payload.min_subtotal = Number(req.body.min_subtotal || 0);
    }

    const { data, error } = await supabase
      .from("discounts")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return res.json({
      message: "Discount updated successfully",
      discount: data,
    });
  } catch (error) {
    console.error("Update discount error:", error);

    return res.status(500).json({
      message: "Failed to update discount",
      error: error.message,
    });
  }
};

const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("discounts")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return res.json({
      message: "Discount deleted successfully",
    });
  } catch (error) {
    console.error("Delete discount error:", error);

    return res.status(500).json({
      message: "Failed to delete discount",
      error: error.message,
    });
  }
};

const validateDiscount = async (req, res) => {
  try {
    const code = String(req.body.code || "").trim().toUpperCase();
    const subtotal = Number(req.body.subtotal || 0);
    const deliveryPrice = Number(req.body.deliveryPrice || 0);

    if (!code) {
      return res.status(400).json({ message: "Discount code is required" });
    }

    const { data: discount, error } = await supabase
      .from("discounts")
      .select("*")
      .eq("code", code)
      .eq("active", true)
      .single();

    if (error || !discount) {
      return res.status(404).json({ message: "Invalid discount code" });
    }

    const now = new Date();

    if (discount.start_date && new Date(discount.start_date) > now) {
      return res.status(400).json({
        message: "This discount code is not active yet",
      });
    }

    if (discount.end_date && new Date(discount.end_date) < now) {
      return res.status(400).json({
        message: "This discount code has expired",
      });
    }

    if (
      discount.max_uses !== null &&
      discount.max_uses !== undefined &&
      Number(discount.used_count || 0) >= Number(discount.max_uses)
    ) {
      return res.status(400).json({
        message: "This discount code has reached its usage limit",
      });
    }

    if (subtotal < Number(discount.min_subtotal || 0)) {
      return res.status(400).json({
        message: `Minimum order subtotal is ${discount.min_subtotal} EGP`,
      });
    }

    let discountAmount = 0;

    if (discount.type === "percentage") {
      discountAmount = Math.round(
        (subtotal * Number(discount.value || 0)) / 100
      );
    }

    if (discount.type === "fixed") {
      discountAmount = Math.min(subtotal, Number(discount.value || 0));
    }

    if (discount.type === "free_delivery") {
      discountAmount = deliveryPrice;
    }

    return res.json({
      message: "Discount applied successfully",
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: Number(discount.value || 0),
        label: discount.label || discount.code,
        discountAmount,
      },
    });
  } catch (error) {
    console.error("Validate discount error:", error);

    return res.status(500).json({
      message: "Failed to validate discount",
      error: error.message,
    });
  }
};

module.exports = {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscount,
};