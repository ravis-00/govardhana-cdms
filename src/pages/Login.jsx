// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// --- ASSETS ---
// Ensure Logo.png is inside src/assets/ folder
import rashtrotthanaLogo from "../assets/Logo.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // New state for eye toggle
  const [rememberMe, setRememberMe] = useState(false);     // New state for checkbox
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.error || "Invalid Credentials");
      }
    } catch (err) {
      setError("Login failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      
      {/* --- LEFT SIDE: HERITAGE & BRANDING (50%) --- */}
      <div style={styles.leftSection}>
        {/* Background Image - Replace URL with your own Gaushala photo if available */}
        <div style={styles.bgImageOverlay}></div>
        <img 
          src="https://images.unsplash.com/photo-1541625602330-2277a4c46182?q=80&w=1974&auto=format&fit=crop" 
          alt="Indian Indigenous Cow" 
          style={styles.bgImage}
        />
        
        {/* TOP LEFT: PARENT ORG LOGO */}
        <div style={styles.brandContainer}>
          <div style={styles.logoBox}>
             <img src={rashtrotthanaLogo} alt="Rashtrotthana Parishat" style={styles.logoImg} />
          </div>
          <div>
            <h2 style={styles.brandTitle}>Rashtrotthana Parishat</h2>
            <p style={styles.brandSubtitle}>Bengaluru</p>
          </div>
        </div>

        {/* BOTTOM LEFT: MISSION STATEMENT */}
        <div style={styles.missionContainer}>
          <div style={styles.projectBadge}>
            Project: Madhava Srushti
          </div>
          <h1 style={styles.heroTitle}>
            Preserving the Genetic<br/>Heritage of India
          </h1>
          <p style={styles.heroText}>
            Digitizing the conservation of indigenous breeds through data-driven Sewa.
          </p>
        </div>
      </div>

      {/* --- RIGHT SIDE: LOGIN FORM (50%) --- */}
      <div style={styles.rightSection}>
        <div style={styles.formWrapper}>
          
          {/* APP HEADER */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            {/* Custom SVG Govardhana Logo */}
            <div style={styles.appLogoCircle}>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "40px", height: "40px", color: "#ea580c" }}>
                  <path d="M12 3a9 9 0 0 1 9 9v9H3v-9a9 9 0 0 1 9-9z" fill="rgba(234, 88, 12, 0.1)" />
                  <path d="M12 3a9 9 0 0 1 9 9v9H3v-9a9 9 0 0 1 9-9z" />
                  <path d="M8 14c0 0 1.5 2 4 2s4-2 4-2" strokeLinecap="round" />
                  <circle cx="9" cy="11" r="1" fill="currentColor" />
                  <circle cx="15" cy="11" r="1" fill="currentColor" />
               </svg>
            </div>
            
            <h2 style={styles.appTitle}>
              Govardhana <span style={{ color: "#ea580c" }}>CDMS</span>
            </h2>
            <p style={styles.appSubtitle}>
              Cattle Data Management System v12.0
            </p>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleSubmit} style={styles.form}>
            
            {/* Email Input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <div style={styles.iconLeft}>
                  {/* User Icon SVG */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  placeholder="admin@rashtrotthana.org"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <div style={styles.iconLeft}>
                  {/* Lock Icon SVG */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  placeholder="••••••••"
                  required
                />
                <div 
                  style={styles.iconRight}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {/* Eye Toggle Icon SVG */}
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </div>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={styles.optionsRow}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: "#ea580c", marginRight: "8px" }} 
                />
                <span style={{ fontSize: "0.9rem", color: "#374151" }}>Remember me</span>
              </label>
              <a href="#" style={{ fontSize: "0.9rem", color: "#ea580c", fontWeight: 600, textDecoration: 'none' }}>Forgot password?</a>
            </div>

            {/* Error Message */}
            {error && <div style={styles.errorMsg}>{error}</div>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Authenticating..." : "Access Dashboard"}
            </button>
          </form>

          {/* Copyright Mobile */}
          <div style={styles.footerMobile}>
             © 2025 Rashtrotthana Parishat
          </div>
        </div>
      </div>
    </div>
  );
}

// --- STYLES OBJECT (Standard CSS properties) ---
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#ffffff",
    fontFamily: "'Segoe UI', sans-serif",
  },
  // --- LEFT SECTION STYLES ---
  leftSection: {
    flex: 1,
    position: "relative",
    backgroundColor: "#0f172a", // Dark fallback
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "2rem",
    color: "white",
    // Hide on mobile (simple media query logic isn't inline, 
    // so in production, add a CSS class `hidden-mobile` if needed.
    // For now, flex: 1 ensures it shows on desktop)
  },
  bgImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.6,
    zIndex: 0,
  },
  bgImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 100%)",
    zIndex: 1,
  },
  brandContainer: {
    position: "relative",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  logoBox: {
    width: "50px",
    height: "65px",
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(4px)",
    borderRadius: "8px",
    padding: "4px",
    border: "1px solid rgba(255,255,255,0.2)",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  brandTitle: {
    fontSize: "0.9rem",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#fdba74", // Orange-300
    margin: 0,
  },
  brandSubtitle: {
    fontSize: "0.75rem",
    color: "#d1d5db",
    margin: 0,
  },
  missionContainer: {
    position: "relative",
    zIndex: 10,
    maxWidth: "500px",
    marginBottom: "2rem",
  },
  projectBadge: {
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    marginBottom: "1rem",
    border: "1px solid rgba(249, 115, 22, 0.5)",
    borderRadius: "999px",
    backgroundColor: "rgba(124, 45, 18, 0.4)",
    color: "#fdba74",
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  heroTitle: {
    fontSize: "2.5rem",
    fontWeight: "800",
    lineHeight: 1.2,
    margin: "0 0 1rem 0",
    color: "#ffffff",
  },
  heroText: {
    fontSize: "1.1rem",
    color: "#d1d5db",
    lineHeight: 1.6,
  },

  // --- RIGHT SECTION STYLES ---
  rightSection: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    backgroundColor: "#ffffff",
    position: "relative",
  },
  formWrapper: {
    width: "100%",
    maxWidth: "420px",
  },
  appLogoCircle: {
    width: "64px",
    height: "64px",
    margin: "0 auto 1rem auto",
    borderRadius: "50%",
    backgroundColor: "#fff7ed", // Orange-50
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  appTitle: {
    fontSize: "2rem",
    fontWeight: "800",
    color: "#111827",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  appSubtitle: {
    fontSize: "0.9rem",
    color: "#6b7280",
    marginTop: "0.5rem",
  },
  form: {
    marginTop: "2rem",
  },
  inputGroup: {
    marginBottom: "1.5rem",
  },
  label: {
    display: "block",
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "0.5rem",
  },
  inputWrapper: {
    position: "relative",
  },
  iconLeft: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 2.75rem", // Padding left for icon
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  iconRight: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    display: "flex",
  },
  optionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  button: {
    width: "100%",
    padding: "0.85rem",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(to right, #f97316, #ea580c)", // Orange gradient
    color: "white",
    fontSize: "1rem",
    fontWeight: "600",
    boxShadow: "0 4px 6px -1px rgba(234, 88, 12, 0.3)",
    transition: "all 0.2s",
  },
  errorMsg: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "0.75rem",
    borderRadius: "8px",
    fontSize: "0.9rem",
    textAlign: "center",
    marginBottom: "1.5rem",
  },
  footerMobile: {
    marginTop: "2rem",
    textAlign: "center",
    fontSize: "0.8rem",
    color: "#9ca3af",
  }
};