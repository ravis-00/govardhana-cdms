// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    // For now: no real auth, just go to dashboard
    navigate("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2.5rem 1.5rem",
        background: "linear-gradient(135deg, #f9fafb, #e0f2fe)",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1120px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "18px",
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.18)",
          display: "flex",
          padding: "2.25rem 2.75rem",
          gap: "2.75rem",
        }}
      >
        {/* LEFT SIDE – App description + feature cards */}
        <section
          style={{
            flex: 1.4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ marginBottom: "1.75rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.25rem 0.7rem",
                borderRadius: "999px",
                backgroundColor: "#f97316",
                color: "white",
                fontSize: "0.78rem",
                fontWeight: 600,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}
            >
              <span>Govardhana Goshala</span>
            </div>

            <h1
              style={{
                fontSize: "2.3rem",
                margin: 0,
                marginBottom: "0.6rem",
                color: "#0f172a",
              }}
            >
              Govardhana CDMS
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "0.98rem",
                maxWidth: "520px",
                color: "#4b5563",
                lineHeight: 1.6,
              }}
            >
              Integrated cattle data management system for Govardhana Goshala –
              track cattle master data, milk yield, treatments, bio-waste, Dattu
              Yojana, and more from a single dashboard.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "1rem",
              maxWidth: "620px",
            }}
          >
            <FeatureCard
              title="Cattle Master"
              text="Maintain complete life-cycle records for each cattle – admission, adoption, de-registration."
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

        {/* RIGHT SIDE – Login form card */}
        <section
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "370px",
              padding: "1.9rem 2.1rem",
              borderRadius: "16px",
              backgroundColor: "#ffffff",
              boxShadow: "0 16px 45px rgba(15, 23, 42, 0.16)",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                margin: 0,
                marginBottom: "0.35rem",
                color: "#0f172a",
              }}
            >
              Login
            </h2>
            <p
              style={{
                margin: 0,
                marginBottom: "1.4rem",
                fontSize: "0.9rem",
                color: "#6b7280",
              }}
            >
              For development you can leave the fields blank and click{" "}
              <strong>Login</strong> to open the dashboard.
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
                    fontWeight: 500,
                    marginBottom: "0.25rem",
                    color: "#374151",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="(optional for now)"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    marginBottom: "0.25rem",
                    color: "#374151",
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="(optional for now)"
                  style={inputStyle}
                />
              </div>

              <button type="submit" style={buttonStyle}>
                Login
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "0.6rem 0.65rem",
  borderRadius: "9px",
  border: "1px solid #d1d5db",
  fontSize: "0.9rem",
  outline: "none",
};

const buttonStyle = {
  marginTop: "0.4rem",
  padding: "0.7rem 0.75rem",
  borderRadius: "999px",
  border: "none",
  background: "#f97316", // orange to match topbar
  color: "white",
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
};

function FeatureCard({ title, text }) {
  return (
    <div
      style={{
        padding: "0.9rem 1rem",
        borderRadius: "12px",
        backgroundColor: "rgba(255,255,255,0.95)",
        border: "1px solid rgba(148, 163, 184, 0.5)",
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.07)",
      }}
    >
      <div
        style={{
          fontSize: "0.95rem",
          fontWeight: 600,
          color: "#0f172a",
          marginBottom: "0.25rem",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: "0.8rem", color: "#4b5563", lineHeight: 1.5 }}>
        {text}
      </div>
    </div>
  );
}
