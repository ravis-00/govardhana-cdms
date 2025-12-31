// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// --- ASSETS ---
import rashtrotthanaLogo from "../assets/Logo.png";
import logoCdms from "../assets/Logo-CDMS.png"; 

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
      
      {/* --- LEFT SIDE: LOGO-CDMS BRANDING --- */}
      <div style={styles.leftSection}>
        <img 
          src={logoCdms} 
          alt="Govardhana CDMS Branding" 
          style={styles.fullHeightImage}
        />
      </div>

      {/* --- RIGHT SIDE: LOGIN FORM --- */}
      <div style={styles.rightSection}>
        <div style={styles.formWrapper}>
          
          {/* APP HEADER */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            
            {/* RASHTROTTHANA LOGO */}
            <div style={styles.logoContainer}>
               <img 
                 src={rashtrotthanaLogo} 
                 alt="Rashtrotthana Parishat" 
                 style={styles.mainLogo} 
               />
            </div>
            
            {/* UPDATED TITLES */}
            <h2 style={styles.appTitle}>
              Rashtrotthana Parishat
            </h2>
            <h3 style={styles.appSubtitleHighlight}>
              Madhava Srushti
            </h3>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleSubmit} style={styles.form}>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <div style={styles.iconLeft}>
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

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <div style={styles.iconLeft}>
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
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </div>
              </div>
            </div>

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

            {error && <div style={styles.errorMsg}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Authenticating..." : "Login"}
            </button>
          </form>

          <div style={styles.footerMobile}>
             © 2025 Rashtrotthana Parishat
          </div>
        </div>
      </div>
    </div>
  );
}

// --- STYLES OBJECT ---
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#ffffff",
    fontFamily: "'Segoe UI', sans-serif",
  },
  // --- LEFT SECTION ---
  leftSection: {
    flex: 1,
    position: "relative",
    backgroundColor: "#f3f4f6",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fullHeightImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  
  // --- RIGHT SECTION ---
  rightSection: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    backgroundColor: "#ffffff",
  },
  formWrapper: {
    width: "100%",
    maxWidth: "420px",
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1.5rem",
  },
  mainLogo: {
    height: "110px", // Slightly larger
    width: "auto",
    objectFit: "contain",
  },
  // Updated Title Styles
  appTitle: {
    fontSize: "1.6rem",
    fontWeight: "700",
    color: "#111827",
    margin: "0",
  },
  appSubtitleHighlight: {
    fontSize: "1.8rem",
    fontWeight: "600",
    color: "#ea580c", // Brand Orange
    margin: "0.5rem 0 0 0",
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
    padding: "0.75rem 1rem 0.75rem 2.75rem",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "0.95rem",
    outline: "none",
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
    background: "linear-gradient(to right, #f97316, #ea580c)",
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
    marginTop: "3rem",
    textAlign: "center",
    fontSize: "0.8rem",
    color: "#9ca3af",
  }
};