const supabase = require("../config/supabase");

const makeSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getBrands = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load brands",
      error: error.message,
    });
  }
};

const createBrand = async (req, res) => {
  try {
    const { name, slug, logo_url, active } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Brand name is required" });
    }

    const payload = {
      name: String(name).trim(),
      slug: makeSlug(slug || name),
      logo_url: logo_url || "",
      active: active !== false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("brands")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "Brand created successfully",
      brand: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create brand",
      error: error.message,
    });
  }
};

const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const payload = {
      updated_at: new Date().toISOString(),
    };

    if (req.body.name !== undefined) payload.name = String(req.body.name).trim();
    if (req.body.slug !== undefined) payload.slug = makeSlug(req.body.slug);
    if (req.body.logo_url !== undefined) payload.logo_url = req.body.logo_url || "";
    if (req.body.active !== undefined) payload.active = req.body.active;

    if (payload.name && !payload.slug) {
      payload.slug = makeSlug(payload.name);
    }

    const { data, error } = await supabase
      .from("brands")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    res.json({
      message: "Brand updated successfully",
      brand: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update brand",
      error: error.message,
    });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("brands").delete().eq("id", id);

    if (error) throw error;

    res.json({ message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete brand",
      error: error.message,
    });
  }
};

module.exports = {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
};