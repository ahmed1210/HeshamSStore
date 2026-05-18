require("dotenv").config();

const supabase = require("./config/supabase");

const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Supabase error:", error.message);
      return;
    }

    console.log("Supabase connected successfully");
    console.log("Products test result:", data);
  } catch (error) {
    console.error("Connection failed:", error.message);
  }
};

testConnection();