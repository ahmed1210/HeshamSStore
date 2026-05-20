"use client";

import { apiUrl } from "@/lib/api";
import AdminHeader from "@/components/AdminHeader";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

const emptyForm = {
  store_name: "",
  description: "",
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

export default function AdminSettingsPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const getToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("adminToken") || "";
  };

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("adminUser");
    const savedToken = localStorage.getItem("adminToken");

    if (!savedUser || !savedToken) {
      router.push("/admin/login");
      return;
    }

    setCurrentUser(JSON.parse(savedUser));
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch(apiUrl("/api/settings"));
      const data = await res.json();

      if (res.ok) {
        setForm({
          ...emptyForm,
          ...data,
        });
      }
    } catch {
      setMessage("Failed to load settings.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const res = await fetch(apiUrl("/api/settings"), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save settings");
      }

      setMessage("Settings saved successfully.");
    } catch (error) {
      setMessage(error.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <main className="admin-page min-h-screen bg-[#020617] p-8 text-white">
        Loading settings...
      </main>
    );
  }

  return (
    <main className="admin-page min-h-screen bg-[#020617] p-8 text-white">
      <AdminHeader
        currentUser={currentUser}
        title="Store Settings"
        subtitle="Control store contact, social links, and locations."
      />

      {message && (
        <div className="mb-6 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 font-bold text-yellow-400">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-card space-y-8 p-6">
        <section>
          <h2 className="mb-4 text-xl font-black uppercase text-yellow-400">
            Basic Info
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Store Name" name="store_name" value={form.store_name} onChange={handleChange} />
            <Field label="Logo URL" name="logo_url" value={form.logo_url} onChange={handleChange} />
            <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} />
            <Field label="Email" name="email" value={form.email} onChange={handleChange} />
            <Field label="Address" name="address" value={form.address} onChange={handleChange} />
            <Field label="Instagram URL" name="instagram_url" value={form.instagram_url} onChange={handleChange} />
            <Field label="Facebook URL" name="facebook_url" value={form.facebook_url} onChange={handleChange} />
            <Field label="Telegram URL" name="telegram_url" value={form.telegram_url} onChange={handleChange} />
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-bold text-blue-100">
              Description
            </span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="admin-input min-h-[110px]"
            />
          </label>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-black uppercase text-yellow-400">
            Locations
          </h2>

          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                className="rounded-3xl border border-yellow-400/20 bg-[#020617] p-5"
              >
                <h3 className="mb-4 font-black text-yellow-400">
                  Location {num}
                </h3>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field
                    label="Location Name"
                    name={`location_${num}_name`}
                    value={form[`location_${num}_name`]}
                    onChange={handleChange}
                  />

                  <Field
                    label="Address"
                    name={`location_${num}_address`}
                    value={form[`location_${num}_address`]}
                    onChange={handleChange}
                  />

                  <Field
                    label="Google Map Embed URL"
                    name={`location_${num}_map_url`}
                    value={form[`location_${num}_map_url`]}
                    onChange={handleChange}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="admin-btn-primary disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </main>
  );
}

function Field({ label, name, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-blue-100">
        {label}
      </span>
      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        className="admin-input"
      />
    </label>
  );
}