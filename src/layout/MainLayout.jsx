// src/components/MainLayout.jsx
import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// --- ASSETS ---
import rashtrotthanaLogo from "../assets/Logo.png";

// --- ICONS (SVG Paths for professional look) ---
const Icons = {
  dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>,
  cow: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 9H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V15z"/>, 
  milk: <path d="M14.06 6.1L12 4 9.94 6.1 8.5 4.6l-1.4 1.4L12 10.9l4.9-4.9-1.4-1.4zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>,
  health: <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>,
  admin: <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>,
  // 🔥 NEW: Gear Icon for Configuration
  config: <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
};

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // --- ROLE CHECKS ---
  const isAdmin = user?.role === "Admin" || user?.role === "Super Admin"; // Ensures both Admin types work
  const isViewer = user?.role === "Viewer";

  // --- MENU CONFIGURATION ---
  const menuGroups = [
    {
      title: "",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: Icons.dashboard },
      ]
    },
    {
      title: "HERD MANAGEMENT",
      items: [
        { name: "Herd Registry", path: "/cattle/master", icon: Icons.cow },
        { name: "Cattle Induction", path: "/cattle/register", icon: Icons.cow, restricted: !isAdmin },
        { name: "Calving Log", path: "/newborn", icon: Icons.cow },
        { name: "Tag Management", path: "/new-tag", icon: Icons.cow, restricted: !isAdmin },
        { name: "Herd Exit", path: "/deregister", icon: Icons.cow, restricted: !isAdmin },
      ]
    },
    {
      title: "OPERATIONS",
      items: [
        { name: "Milk Production", path: "/milk-yield", icon: Icons.milk },
        { name: "Nutrition", path: "/feeding", icon: Icons.milk },
        { name: "Waste Mgmt", path: "/bio-waste", icon: Icons.milk },
      ]
    },
    {
      title: "VETERINARY",
      items: [
        { name: "Clinical Records", path: "/treatment", icon: Icons.health },
        { name: "Preventive Care", path: "/vaccine", icon: Icons.health },
        { name: "Mortality Register", path: "/death-records", icon: Icons.health },
      ]
    },
    // 🔥 NEW SECTION: MASTER CONFIGURATION 🔥
    {
      title: "MASTER CONFIGURATION",
      items: [
        { name: "Breeds", path: "/config/breeds", icon: Icons.config, restricted: !isAdmin },
        { name: "Medicines", path: "/config/medicines", icon: Icons.config, restricted: !isAdmin },
        { name: "Rates", path: "/config/rates", icon: Icons.config, restricted: !isAdmin },
        { name: "Weight Stds", path: "/config/weight", icon: Icons.config, restricted: !isAdmin },
        { name: "Symptoms", path: "/config/symptoms", icon: Icons.config, restricted: !isAdmin },
      ]
    },
    {
      title: "FINANCE & ADMIN",
      items: [
        { name: "Sponsorships", path: "/dattu-yojana", icon: Icons.admin, restricted: isViewer },
        { name: "Reports", path: "/reports", icon: Icons.admin },
        { name: "User Management", path: "/users", icon: Icons.admin, restricted: !isAdmin },
      ]
    }
  ];

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f3f4f6", fontFamily: "'Segoe UI', sans-serif" }}>
      
      {/* --- SIDEBAR (Fixed Left) --- */}
      <aside style={{
        width: "260px",
        backgroundColor: "#111827", // Dark Slate
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        borderRight: "1px solid #1f2937",
        height: "100vh",
        overflowY: "auto"
      }}>
        {/* BRANDING HEADER */}
        <div style={{ padding: "1.5rem 1rem", borderBottom: "1px solid #1f2937", textAlign: "center", backgroundColor: "#0f172a" }}>
          <img 
            src={rashtrotthanaLogo} 
            alt="Rashtrotthana" 
            style={{ height: "60px", width: "auto", marginBottom: "0.8rem", objectFit: "contain" }} 
          />
          <h1 style={{ color: "#ea580c", fontSize: "1.1rem", fontWeight: "800", margin: 0, letterSpacing: "0.5px" }}>
            GOVARDHANA
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "0.65rem", margin: "4px 0 0 0", textTransform: "uppercase", letterSpacing: "1px" }}>
            Cattle Data Management
          </p>
        </div>

        {/* NAVIGATION */}
        <nav style={{ flex: 1, padding: "1rem 0" }}>
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} style={{ marginBottom: "1rem" }}>
              {group.title && (
                <div style={{ 
                  padding: "0 1.5rem", 
                  marginBottom: "0.5rem", 
                  fontSize: "0.7rem", 
                  fontWeight: "700", 
                  color: "#6b7280", 
                  letterSpacing: "0.05em" 
                }}>
                  {group.title}
                </div>
              )}
              
              {group.items.map((item, iIdx) => {
                // If item is restricted (e.g., config for non-admin), do not render
                if (item.restricted) return null;

                return (
                  <NavLink
                    key={iIdx}
                    to={item.path}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      padding: "0.75rem 1.5rem",
                      textDecoration: "none",
                      color: isActive ? "#fb923c" : "#d1d5db", // Saffron active text
                      background: isActive ? "rgba(234, 88, 12, 0.1)" : "transparent", // Saffron tint bg
                      borderLeft: isActive ? "4px solid #ea580c" : "4px solid transparent", // Saffron border
                      fontSize: "0.9rem",
                      fontWeight: isActive ? "600" : "400",
                      transition: "all 0.2s"
                    })}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ marginRight: "12px", opacity: 0.8 }}>
                      {item.icon}
                    </svg>
                    {item.name}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
        
        {/* SIDEBAR FOOTER */}
        <div style={{ padding: "1rem", borderTop: "1px solid #1f2937", fontSize: "0.7rem", color: "#6b7280", textAlign: "center" }}>
           © 2025 Rashtrotthana Parishat
        </div>
      </aside>

      {/* --- RIGHT COLUMN (Content Area) --- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        
        {/* HEADER (White & Clean) */}
        <header style={{ 
          background: "#ffffff", 
          color: "#334155",
          padding: "0 2rem", 
          height: "64px",
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          flexShrink: 0,
          borderBottom: "1px solid #e2e8f0"
        }}>
           {/* Left: Welcome Text */}
           <div>
             <div style={{ fontSize: "1rem", fontWeight: "600", color: "#334155" }}>
               Welcome back, <span style={{ color: "#ea580c" }}>{user?.name}</span>
             </div>
             <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{user?.role}</div>
           </div>

           {/* Right: Logout Button */}
           <button 
             onClick={handleLogout}
             style={{
               background: "#ea580c", // Saffron Orange
               color: "#fff",
               border: "none",
               padding: "0.5rem 1.2rem",
               borderRadius: "6px",
               cursor: "pointer",
               fontSize: "0.85rem",
               fontWeight: "600",
               display: "flex",
               alignItems: "center",
               gap: "8px",
               transition: "background 0.2s",
               boxShadow: "0 2px 4px rgba(234, 88, 12, 0.2)"
             }}
             onMouseOver={(e) => e.target.style.background = "#c2410c"}
             onMouseOut={(e) => e.target.style.background = "#ea580c"}
           >
             Logout 
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
           </button>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <main style={{ 
          flex: 1, 
          overflowY: "auto", 
          position: "relative",
          backgroundColor: "#f8fafc" // Light grey background for content
        }}>
          <Outlet />
        </main>

      </div>
    </div>
  );
}