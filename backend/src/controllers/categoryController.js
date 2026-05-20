const supabase = require("../config/supabase");

const makeSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load categories",
      error: error.message,
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, slug, image_url, active } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const payload = {
      name: String(name).trim(),
      slug: makeSlug(slug || name),
      image_url: image_url || "",
      active: active !== false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "Category created successfully",
      category: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create category",
      error: error.message,
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const payload = {
      updated_at: new Date().toISOString(),
    };

    if (req.body.name !== undefined) payload.name = String(req.body.name).trim();
    if (req.body.slug !== undefined) payload.slug = makeSlug(req.body.slug);
    if (req.body.image_url !== undefined) payload.image_url = req.body.image_url || "";
    if (req.body.active !== undefined) payload.active = req.body.active;

    if (payload.name && !payload.slug) {
      payload.slug = makeSlug(payload.name);
    }

    const { data, error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    res.json({
      message: "Category updated successfully",
      category: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update category",
      error: error.message,
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) throw error;

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};