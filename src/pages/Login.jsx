import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }
    // later we will add real auth; for now just go to dashboard
    navigate("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #f9fafb, #e0f2fe)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* LEFT: App description & feature cards */}
      <section
        style={{
          flex: 1.4,
          padding: "3rem 3rem 3rem 3.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            fontSize: "2.4rem",
            marginBottom: "0.5rem",
            color: "#0f172a",
          }}
        >
          Govardhana CDMS
        </h1>
        <p
          style={{
            fontSize: "1rem",
            maxWidth: "480px",
            color: "#4b5563",
            marginBottom: "1.75rem",
          }}
        >
          Integrated cattle data management system for Govardhana Goshala –
          track cattle master data, milk yield, treatments, bio-waste, Dattu
          Yojana, and more from a single dashboard.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            maxWidth: "720px",
          }}
        >
          <FeatureCard
            title="Cattle Master"
            text="Maintain complete life-cycle records for each cattle – admission, adoption, deregistration."
          />
          <FeatureCard
            title="Milk & Feeding"
            text="Daily milk yield and feeding logs to monitor health and productivity."
          />
          <FeatureCard
            title="Health & Vaccines"
            text="Record medical treatments, vaccinations, and follow-ups in one place."
          />
          <FeatureCard
            title="Reports & Dashboard"
            text="Quick overview of active cattle, milk trends, newborns, and donations."
          />
        </div>
      </section>

      {/* RIGHT: Login form */}
      <section
        style={{
          flex: 1,
          padding: "3rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "380px",
            padding: "2rem 2.25rem",
            borderRadius: "16px",
            background: "#ffffff",
            boxShadow: "0 20px 45px rgba(15, 23, 42, 0.12)",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              marginTop: 0,
              marginBottom: "0.5rem",
              color: "#0f172a",
            }}
          >
            Login
          </h2>
          <p
            style={{
              marginTop: 0,
              marginBottom: "1.5rem",
              fontSize: "0.9rem",
              color: "#6b7280",
            }}
          >
            Use your registered credentials to access Govardhana CDMS.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: "0.9rem" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  marginBottom: "0.25rem",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.6rem",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  marginBottom: "0.25rem",
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.6rem",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: "0.5rem",
                padding: "0.6rem 0.75rem",
                borderRadius: "999px",
                border: "none",
                background: "#2563eb",
                color: "white",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              Login
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, text }) {
  return (
    <div
      style={{
        padding: "0.9rem 1rem",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.9)",
        border: "1px solid rgba(148, 163, 184, 0.35)",
        boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div
        style={{
          fontSize: "0.95rem",
          fontWeight: 600,
          color: "#0f172a",
          marginBottom: "0.3rem",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: "0.8rem", color: "#4b5563" }}>{text}</div>
    </div>
  );
}
