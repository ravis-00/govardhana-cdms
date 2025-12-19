import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // <--- Import Auth

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
  const { user, logout } = useAuth(); // <--- Get user and logout
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="app-shell">
      {/* TOPBAR */}
      <header className="topbar">
        {/* LEFT: hamburger */}
        <button
          className="topbar-menu-btn"
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label="Toggle sidebar"
        >
          &#9776;
        </button>

        {/* CENTER: logo + title */}
        <div
          className="topbar-center"
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

        {/* RIGHT: User Profile + Logout */}
        <div className="topbar-right">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginRight: "1rem" }}>
            <span className="topbar-user" style={{ fontSize: "0.9rem", fontWeight: "600" }}>
              {user ? user.name : "Guest"}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#fff", opacity: 0.8 }}>
              {user ? user.role : ""}
            </span>
          </div>
          
          <button
            type="button"
            className="topbar-home-btn"
            onClick={handleLogout}
            title="Logout"
            style={{ 
              background: "#dc2626", 
              border: "none", 
              color: "white",       // <--- ADDED THIS
              fontWeight: "600",    // <--- Added for better visibility
              padding: "0.4rem 0.8rem", 
              borderRadius: "4px",
              cursor: "pointer"
            }} 
          >
            Logout
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="layout-body">
        {/* SIDEBAR */}
        <aside
          className={
            sidebarOpen ? "sidebar" : "sidebar sidebar-hidden"
          }
        >
          <nav style={{ display: "grid", gap: "0.25rem" }}>
            <NavLink to="/dashboard" style={linkStyle}>
              Dashboard
            </NavLink>

            {/* Admin Only Menu Item */}
            {user?.role === "Admin" && (
              <NavLink to="/users" style={linkStyle}>
                👥 User Management
              </NavLink>
            )}

            <NavLink to="/cattle/active" style={linkStyle}>
              Active Cattle
            </NavLink>
            <NavLink to="/cattle/master" style={linkStyle}>
              Master Cattle Data
            </NavLink>
            <NavLink to="/cattle/register" style={linkStyle}>
              Cattle Registration
            </NavLink>
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
            <NavLink to="/death-records" style={linkStyle}>
              💀 Cattle Death Records
            </NavLink>
            <NavLink to="/certificates-reports" style={linkStyle}>
              📄 Certificates &amp; Reports
            </NavLink>
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}