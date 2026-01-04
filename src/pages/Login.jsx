// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// --- STYLES & ASSETS ---
import "./Login.css";
import rashtrotthanaLogo from "../assets/Logo.png";

// --- ICONS ---
const CowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 9H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V15z"/></svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.06 6.1L12 4 9.94 6.1 8.5 4.6l-1.4 1.4L12 10.9l4.9-4.9-1.4-1.4zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // State for Custom Modal
  const [showModal, setShowModal] = useState(false);

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

  // Handle "Forgot Password" Click
  const handleForgotClick = (e) => {
    e.preventDefault();
    setShowModal(true); // Open the custom popup
  };

  return (
    <div className="login-container">
      
      {/* --- HEADER --- */}
      <header className="login-header">
        <img src={rashtrotthanaLogo} alt="Rashtrotthana Parishat" className="main-logo" />
        <h1 className="app-title">Rashtrotthana Parishat</h1>
        <h2 className="app-subtitle-highlight">Madhava Srushti</h2>
        <p className="app-tagline">
          Govardhana - Cattel Data Management System: A comprehensive platform for the holistic management, preservation, and development of indigenous cattle breeds.
        </p>
      </header>

      {/* --- FEATURES --- */}
      <section className="feature-cards-container">
        <div className="feature-card">
          <div className="feature-icon-wrapper"><CowIcon /></div>
          <h3 className="feature-title">Cattle Data Management</h3>
          <p className="feature-description">
            Maintain a digital registry of cattle, track genealogy, manage health records, vaccinations, and breeding history efficiently.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon-wrapper"><ChartIcon /></div>
          <h3 className="feature-title">Operations & Insights</h3>
          <p className="feature-description">
            Monitor daily milk production, optimize feeding & nutrition plans, and gain valuable insights through analytics.
          </p>
        </div>
      </section>

      {/* --- FORM --- */}
      <main className="form-container">
        <h3 className="form-title">Sign In to Your Account</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div className="input-wrapper">
              <div className="icon-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                placeholder="admin@rashtrotthana.org"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-wrapper">
              <div className="icon-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                placeholder="••••••••"
                required
              />
              <div className="icon-right" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </div>
            </div>
          </div>

          <div className="options-row">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: "#ea580c" }} 
              />
              <span className="remember-text">Remember me</span>
            </label>
            <button type="button" className="forgot-link" onClick={handleForgotClick}>
              Forgot password?
            </button>
          </div>

          {error && <div className="error-msg">{error}</div>}

          {/* 🔥 FIXED ACTION BUTTON 🔥 */}
          <button type="submit" disabled={loading} className="action-btn">
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </main>

      <footer className="login-footer">
        © 2025 Rashtrotthana Parishat. All rights reserved.
      </footer>

      {/* --- CUSTOM POPUP MODAL --- */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Reset Password</h3>
            <p className="modal-text">
              Contact system administrator to Reset password.
            </p>
            {/* Same orange button style reused here */}
            <button className="action-btn" style={{ width: "auto", minWidth: "100px", margin: "0 auto" }} onClick={() => setShowModal(false)}>
              OK
            </button>
          </div>
        </div>
      )}

    </div>
  );
}