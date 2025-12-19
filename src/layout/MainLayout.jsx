import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// --- MENU CONFIGURATION ---
const MENU_ITEMS = [
  { 
    path: "/dashboard", 
    label: "Dashboard", 
    roles: ["Admin", "User", "Viewer"] 
  },
  { 
    path: "/users", 
    label: "👥 User Management", 
    roles: ["Admin"] 
  },
  { 
    path: "/cattle/active", 
    label: "Active Cattle", 
    roles: ["Admin", "User", "Viewer"] 
  },
  { 
    path: "/cattle/master", 
    label: "Master Cattle Data", 
    roles: ["Admin", "User", "Viewer"] 
  },
  { 
    path: "/cattle/register", 
    label: "Cattle Registration", 
    roles: ["Admin", "User"] // Hidden for Viewer
  },
  { 
    path: "/new-tag", 
    label: "New Tag Number", 
    roles: ["Admin", "User"] // Hidden for Viewer
  },
  { 
    path: "/milk-yield", 
    label: "Milk Yield", 
    roles: ["Admin", "User", "Viewer"] 
  },
  { 
    path: "/bio-waste", 
    label: "Bio Waste", 
    roles: ["Admin", "User", "Viewer"] 
  },
  { 
    path: "/vaccine", 
    label: "Vaccine / Deworming", 
    roles: ["Admin", "User", "Viewer"] 
  },
  { 
    path: "/treatment", 
    label: "Medical Treatment", 
    roles: ["Admin", "User", "Viewer"] 
  },
  { 
    path: "/newborn", 
    label: "New Born", 
    roles: ["Admin", "User", "Viewer"] 
  },
  { 
    path: "/feeding", 
    label: "Feeding", 
    roles: ["Admin", "User", "Viewer"] 
  },
  { 
    path: "/dattu-yojana", 
    label: "Dattu Yojana", 
    roles: ["Admin", "User", "Viewer"] 
  },
  { 
    path: "/deregister", 
    label: "Deregister Cattle", 
    roles: ["Admin", "User"] // Hidden for Viewer
  },
  { 
    path: "/death-records", 
    label: "💀 Cattle Death Records", 
    roles: ["Admin", "User"] // Hidden for Viewer
  },
  { 
    path: "/certificates-reports", 
    label: "📄 Certificates & Reports", 
    roles: ["Admin", "User"] // Hidden for Viewer
  }
];

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
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Helper to check if current user has permission
  const hasPermission = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <div className="app-shell">
      {/* TOPBAR */}
      <header className="topbar">
        <button
          className="topbar-menu-btn"
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label="Toggle sidebar"
        >
          &#9776;
        </button>

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
              color: "white", 
              fontWeight: "600",
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
        <aside className={sidebarOpen ? "sidebar" : "sidebar sidebar-hidden"}>
          <nav style={{ display: "grid", gap: "0.25rem" }}>
            {MENU_ITEMS.map((item) => {
              // Only render if user has permission
              if (!hasPermission(item.roles)) return null;
              
              return (
                <NavLink key={item.path} to={item.path} style={linkStyle}>
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}