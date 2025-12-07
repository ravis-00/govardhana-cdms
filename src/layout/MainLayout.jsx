// src/layout/MainLayout.jsx
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

// Common style function for all sidebar links
const linkStyle = ({ isActive }) => ({
  display: "block",
  padding: "0.5rem 0.75rem",
  borderRadius: "6px",
  textDecoration: "none",
  color: isActive ? "white" : "#111827",
  backgroundColor: isActive ? "#2563eb" : "transparent",
  fontSize: "0.95rem",
});

export default function MainLayout() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      {/* TOPBAR */}
      <header className="topbar">
        <div
          className="topbar-left"
          onClick={() => navigate("/dashboard")}
          style={{ cursor: "pointer" }}
        >
          <div className="logo-placeholder">GV</div>
          <div>
            <div className="topbar-title">Govardhana CDMS</div>
            <div className="topbar-subtitle">
              Cattle Data Management System
            </div>
          </div>
        </div>

        <div className="topbar-right">
          {/* later we can plug in real user info / logout */}
          <span className="topbar-user">User</span>
        </div>
      </header>

      {/* BODY: SIDEBAR + MAIN CONTENT */}
      <div className="layout-body">
        <aside className="sidebar">
          <nav style={{ display: "grid", gap: "0.25rem" }}>
            <NavLink to="/dashboard" style={linkStyle}>
              Dashboard
            </NavLink>

            <NavLink to="/cattle/active" style={linkStyle}>
              Active Cattle
            </NavLink>

            <NavLink to="/cattle/master" style={linkStyle}>
              Master Cattle Data
            </NavLink>

            <NavLink to="/cattle/register" style={linkStyle}>
              Cattle Registration
            </NavLink>

{/* ✅ New Tag menu */}
  <NavLink to="/new-tag" style={linkStyle}>
    New Tag Number
  </NavLink>
            <NavLink to="/milk-yield" style={linkStyle}>
              Milk Yield
            </NavLink>

            <NavLink to="/bio-waste" style={linkStyle}>
              Bio Waste
            </NavLink>

            <NavLink to="/vaccine" style={linkStyle}>
              Vaccine / Deworming
            </NavLink>

            <NavLink to="/treatment" style={linkStyle}>
              Medical Treatment
            </NavLink>

            <NavLink to="/newborn" style={linkStyle}>
              New Born
            </NavLink>

            <NavLink to="/feeding" style={linkStyle}>
              Feeding
            </NavLink>

            <NavLink to="/dattu-yojana" style={linkStyle}>
              Dattu Yojana
            </NavLink>

            <NavLink to="/deregister" style={linkStyle}>
              Deregister Cattle
            </NavLink>

            <NavLink to="/cattle/profile" style={linkStyle}>
  Cattle Profile (demo)
</NavLink>
<NavLink to="/cattle/pedigree" style={linkStyle}>
  Pedigree Viewer
</NavLink>


            <NavLink to="/death-records" style={linkStyle}>
              💀 Cattle Death Records
            </NavLink>
          </nav>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
