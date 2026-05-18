"use client";

import AdminHeader from "@/components/AdminHeader";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import {
  Settings,
  Image,
  Save,
  AlertTriangle,
  CheckCircle,
  Store,
  Link as LinkIcon,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";

const emptySettings = {
  storeName: "Hesham Store",
  logoText: "Hesham Store",
  logoImage: "",
  whatsappLink: "",
  instagramLink: "",
  facebookLink: "",
  homepageTitle: "",
  homepageSubtitle: "",
};

export default function AdminSettingsPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState(emptySettings);

  const [settingsMessage, setSettingsMessage] = useState("");
  const [error, setError] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  const getAdminToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("adminToken");
  };

  const logoutAndRedirect = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminEmail");
    router.push("/admin/login");
  };

  const loadCurrentUser = () => {
    try {
      const savedUser = localStorage.getItem("adminUser");

      if (!savedUser) {
        logoutAndRedirect();
        return;
      }

      const parsedUser = JSON.parse(savedUser);

      if (!parsedUser || !parsedUser.role) {
        logoutAndRedirect();
        return;
      }

      setCurrentUser(parsedUser);
    } catch (err) {
      logoutAndRedirect();
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    setError("");

    const token = getAdminToken();

    if (!token) {
      logoutAndRedirect();
      return;
    }

    try {
      const res = await fetch(apiUrl("/api/settings"));
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not load settings.");
        return;
      }

      setSettings({
        ...emptySettings,
        ...data,
      });
    } catch {
      setError("Cannot connect to backend. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
    fetchSettings();
  }, []);

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;

    setSettings({
      ...settings,
      [name]: value,
    });
  };

  const saveSettings = async (e) => {
    e.preventDefault();

    const token = getAdminToken();

    if (!token) {
      logoutAndRedirect();
      return;
    }

    setSavingSettings(true);
    setSettingsMessage("");
    setError("");

    try {
      const res = await fetch(apiUrl("/api/settings"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        logoutAndRedirect();
        return;
      }

      if (!res.ok) {
        setError(data.message || "Could not save settings.");
        return;
      }

      setSettings(data.settings || settings);
      setSettingsMessage("Store settings updated successfully.");
    } catch {
      setError("Cannot save settings. Make sure backend is running.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <main className="min-h-screen bg-transparent py-20">
      <div className="container">
        <AdminHeader
          currentUser={currentUser}
          title="Store Settings"
          subtitle="Edit store logo, store name, homepage text, and social links."
        />

        <section className="glass-panel mb-8 rounded-[2rem] p-6 shadow-2xl shadow-yellow-400/10 md:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-black/20 px-4 py-2 text-sm font-bold text-yellow-400 backdrop-blur-md">
                <Settings size={16} />
                Store Settings
              </div>

              <h1 className="theme-text text-4xl font-black md:text-5xl">
                Store <span className="text-yellow-400">Settings</span>
              </h1>

              <p className="theme-muted mt-3 max-w-3xl">
                Edit store logo, store name, homepage text, and social links.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchSettings}
              className="flex w-fit items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-4 font-black text-black transition hover:bg-yellow-300"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 font-bold text-red-500">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {settingsMessage && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-green-500/40 bg-green-500/10 p-4 font-bold text-green-500">
            <CheckCircle size={18} />
            {settingsMessage}
          </div>
        )}

        {loading ? (
          <div className="glass-panel rounded-3xl p-10 text-center theme-text">
            Loading settings...
          </div>
        ) : (
          <form
            onSubmit={saveSettings}
            className="glass-panel rounded-[2rem] p-6 shadow-2xl shadow-yellow-400/10"
          >
            <div className="mb-6 flex items-center gap-2 text-yellow-400">
              <Store size={22} />
              <h2 className="text-2xl font-black">Store Identity</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="theme-muted mb-2 block text-sm font-bold">
                  Store Name
                </label>
                <input
                  name="storeName"
                  value={settings.storeName}
                  onChange={handleSettingsChange}
                  className="theme-input w-full rounded-2xl px-4 py-3 outline-none"
                  placeholder="Hesham Store"
                />
              </div>

              <div>
                <label className="theme-muted mb-2 block text-sm font-bold">
                  Logo Text
                </label>
                <input
                  name="logoText"
                  value={settings.logoText}
                  onChange={handleSettingsChange}
                  className="theme-input w-full rounded-2xl px-4 py-3 outline-none"
                  placeholder="Hesham Store"
                />
              </div>

              <div className="md:col-span-2">
                <label className="theme-muted mb-2 block text-sm font-bold">
                  Logo Image URL
                </label>

                <div className="theme-input flex items-center gap-3 rounded-2xl px-4">
                  <Image size={18} className="text-yellow-400" />
                  <input
                    name="logoImage"
                    value={settings.logoImage}
                    onChange={handleSettingsChange}
                    className="theme-text w-full bg-transparent py-3 outline-none"
                    placeholder="https://..."
                  />
                </div>

                <p className="theme-muted mt-2 text-sm">
                  Leave empty to use logo text instead of image.
                </p>
              </div>

              <div>
                <label className="theme-muted mb-2 block text-sm font-bold">
                  Homepage Title
                </label>
                <input
                  name="homepageTitle"
                  value={settings.homepageTitle}
                  onChange={handleSettingsChange}
                  className="theme-input w-full rounded-2xl px-4 py-3 outline-none"
                  placeholder="Homepage title"
                />
              </div>

              <div>
                <label className="theme-muted mb-2 block text-sm font-bold">
                  Homepage Subtitle
                </label>
                <input
                  name="homepageSubtitle"
                  value={settings.homepageSubtitle}
                  onChange={handleSettingsChange}
                  className="theme-input w-full rounded-2xl px-4 py-3 outline-none"
                  placeholder="Homepage subtitle"
                />
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-yellow-400/25 bg-black/10 p-5">
              <div className="mb-4 flex items-center gap-2 text-yellow-400">
                <LinkIcon size={18} />
                <h3 className="font-black">Social Links</h3>
              </div>

              <div className="grid gap-4">
                <input
                  name="whatsappLink"
                  value={settings.whatsappLink}
                  onChange={handleSettingsChange}
                  className="theme-input rounded-2xl px-4 py-3 outline-none"
                  placeholder="WhatsApp link"
                />

                <input
                  name="instagramLink"
                  value={settings.instagramLink}
                  onChange={handleSettingsChange}
                  className="theme-input rounded-2xl px-4 py-3 outline-none"
                  placeholder="Instagram link"
                />

                <input
                  name="facebookLink"
                  value={settings.facebookLink}
                  onChange={handleSettingsChange}
                  className="theme-input rounded-2xl px-4 py-3 outline-none"
                  placeholder="Facebook link"
                />
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-yellow-400/25 bg-black/10 p-5">
              <h3 className="mb-4 font-black text-yellow-400">Logo Preview</h3>

              <div className="flex items-center gap-4">
                {settings.logoImage ? (
                  <img
                    src={settings.logoImage}
                    alt={settings.logoText || settings.storeName}
                    className="h-16 w-16 rounded-2xl border border-yellow-400/40 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/40 bg-yellow-400/10 text-yellow-400">
                    <Store size={30} />
                  </div>
                )}

                <div>
                  <h3 className="theme-text text-2xl font-black">
                    {settings.logoText || settings.storeName}
                  </h3>
                  <p className="theme-muted text-sm">
                    This preview will appear in Navbar after updating Navbar.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="mt-6 flex items-center gap-2 rounded-2xl bg-yellow-400 px-7 py-4 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />
              {savingSettings ? "Saving..." : "Save Store Settings"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}