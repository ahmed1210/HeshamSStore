"use client";

import { apiUrl } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

const LOGIN_NOTE_TEXT =
  "This login is for testing only. Use the admin account details from the backend environment settings.";

export default function AdminLoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user = localStorage.getItem("adminUser");

    if (token && user) {
      router.push("/admin");
    }
  }, [router]);

  const showNotice = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 4500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier) {
      showNotice("Please enter username or email.");
      return;
    }

    if (!cleanPassword) {
      showNotice("Please enter password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(apiUrl("/api/admin/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: cleanIdentifier,
          username: cleanIdentifier,
          email: cleanIdentifier,
          password: cleanPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid username/email or password");
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user || {}));
      localStorage.setItem("adminEmail", data.user?.email || cleanIdentifier);

      showNotice("Login successful. Redirecting...", "success");

      setTimeout(() => {
        router.push("/admin");
      }, 700);
    } catch (error) {
      console.error("Login error:", error);

      const text = String(error.message || "").toLowerCase();

      if (text.includes("failed to fetch")) {
        showNotice(
          "Cannot connect to backend. Please make sure backend is running."
        );
      } else if (text.includes("email and password are required")) {
        showNotice(
          "Backend still expects email only. Update adminController.js to accept username or email."
        );
      } else {
        showNotice(error.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />
      <div className="login-grid-lines" />

      <div className="login-shoe login-shoe-one">👟</div>
      <div className="login-shoe login-shoe-two">👟</div>
      <div className="login-shoe login-shoe-three">👟</div>
      <div className="login-shoe login-shoe-four">👟</div>

      <section className="login-shell">
        <div className="login-top">
          <Link href="/" className="login-back-btn">
            <ArrowLeft size={16} />
            Back to Shop
          </Link>
        </div>

        <div className="login-layout">
          <aside className="login-showcase">
            <div className="login-brand">
              <div className="login-logo-float">
                <span>HS</span>
              </div>

              <p>Hesham Store</p>

              <h1>
                Admin
                <span>Dashboard</span>
              </h1>

              <small>
                Manage products, orders, stock, delivery, discounts, and users
                from one clean control panel.
              </small>
            </div>

            <div className="login-big-shoe-box">
              <div className="login-ring login-ring-one" />
              <div className="login-ring login-ring-two" />
              <div className="login-big-shoe">👟</div>
            </div>

            <div className="login-feature-grid">
              <div>
                <Sparkles size={18} />
                <strong>Fast Control</strong>
                <span>Daily store management made simple.</span>
              </div>

              <div>
                <ShieldCheck size={18} />
                <strong>Secure Access</strong>
                <span>Private dashboard login area.</span>
              </div>
            </div>
          </aside>

          <section className="login-card">
            <div className="login-card-head">
              <div className="login-icon">
                <ShieldCheck size={24} />
              </div>

              <div>
                <h2>Sign In</h2>
                <p>Enter your admin account details.</p>
              </div>
            </div>

            {message && (
              <div
                className={`login-message ${
                  messageType === "success"
                    ? "login-message-success"
                    : "login-message-error"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
              <div>
                <label>Username or Email</label>

                <div className="login-input-wrap">
                  <User size={18} />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter username or email"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label>Password</label>

                <div className="login-input-wrap">
                  <Lock size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="login-eye-btn"
                    aria-label="Toggle password"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-submit">
                <LogIn size={18} />
                {loading ? "Signing In..." : "Login"}
              </button>
            </form>

            <div className="login-test-note">
              <p>Login Note</p>
              <span>{LOGIN_NOTE_TEXT}</span>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}