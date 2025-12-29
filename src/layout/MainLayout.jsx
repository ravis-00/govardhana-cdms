// src/layout/MainLayout.jsx
import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // --- ROLE CHECKS ---
  const isAdmin = user?.role === "Admin"; 
  
  // 🔥 NEW: Define Viewer check
  const isViewer = user?.role === "Viewer";

  // --- MENU CONFIGURATION ---
  const menuGroups = [
    {
      title: "",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: "📊" },
      ]
    },
    {
      title: "HERD MANAGEMENT",
      items: [
        { name: "Herd Registry", path: "/cattle/master", icon: "🐄" },
        { name: "Cattle Induction", path: "/cattle/register", icon: "➕", restricted: !isAdmin },
        { name: "Calving Log", path: "/newborn", icon: "🐣" },
        { name: "Tag Management", path: "/new-tag", icon: "🏷️", restricted: !isAdmin },
        { name: "Herd Exit", path: "/deregister", icon: "🚫", restricted: !isAdmin },
      ]
    },
    {
      title: "OPERATIONS",
      items: [
        { name: "Milk Production", path: "/milk-yield", icon: "🥛" },
        { name: "Nutrition", path: "/feeding", icon: "🌾" },
        { name: "Waste Mgmt", path: "/bio-waste", icon: "♻️" },
      ]
    },
    {
      title: "VETERINARY",
      items: [
        { name: "Clinical Records", path: "/treatment", icon: "⚕️" },
        { name: "Preventive Care", path: "/vaccine", icon: "💉" },
        { name: "Mortality Register", path: "/death-records", icon: "💀" },
      ]
    },
    {
      title: "FINANCE & ADMIN",
      items: [
        // 🔥 UPDATE: Restricted ONLY if Viewer. (So Admin & User CAN see it)
        { name: "Sponsorships", path: "/dattu-yojana", icon: "🤝", restricted: isViewer },
        
        { name: "Reports & Docs", path: "/certificates-reports", icon: "📄" },
        
        // User Management: Admin Only
        { name: "User Management", path: "/users", icon: "👥", restricted: !isAdmin },
      ]
    }
  ];

  return (
    // Outer Container: Fixed Height, No Scroll
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f3f4f6", overflow: "hidden" }}>
      
      {/* --- SIDEBAR (Fixed Left) --- */}
      <aside style={{
        width: "260px",
        backgroundColor: "#1e293b", // Dark Slate
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        borderRight: "1px solid #334155",
        height: "100vh", // Full height
        overflowY: "auto" // Sidebar scrolls internally if menu is long
      }}>
        {/* Brand */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #334155", flexShrink: 0 }}>
          <div style={{ fontSize: "1.1rem", fontWeight: "bold", letterSpacing: "0.5px", color: "#fbbf24" }}>Govardhana CDMS</div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>Cattle Data Management</div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "1rem 0" }}>
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} style={{ marginBottom: "1.5rem" }}>
              {group.title && (
                <div style={{ 
                  padding: "0 1.5rem", 
                  marginBottom: "0.5rem", 
                  fontSize: "0.7rem", 
                  fontWeight: "bold", 
                  color: "#64748b", 
                  letterSpacing: "0.05em" 
                }}>
                  {group.title}
                </div>
              )}
              
              {group.items.map((item, iIdx) => {
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
                      color: isActive ? "#fbbf24" : "#e2e8f0",
                      background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
                      borderLeft: isActive ? "4px solid #fbbf24" : "4px solid transparent",
                      fontSize: "0.9rem",
                      transition: "all 0.2s"
                    })}
                  >
                    <span style={{ marginRight: "0.75rem", fontSize: "1.1rem" }}>{item.icon}</span>
                    {item.name}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* --- RIGHT COLUMN (Wrapper for Header + Content) --- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        
        {/* HEADER (Fixed Top) */}
        <header style={{ 
          background: "#1e293b", // Matches Sidebar
          color: "#fff",
          padding: "0.75rem 2rem", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          flexShrink: 0, // Prevents shrinking
          zIndex: 10
        }}>
           {/* Left: Welcome Text */}
           <div>
             <div style={{ fontSize: "0.9rem", color: "#e2e8f0" }}>
               Welcome back, <strong style={{ color: "#fff" }}>{user?.name}</strong>
             </div>
             <div style={{ fontSize: "0.75rem", color: "#fbbf24" }}>{user?.role}</div>
           </div>

           {/* Right: Logout Button */}
           <button 
             onClick={handleLogout}
             style={{
               background: "#b91c1c",
               color: "#fff",
               border: "none",
               padding: "8px 16px",
               borderRadius: "6px",
               cursor: "pointer",
               fontSize: "0.85rem",
               fontWeight: "600",
               display: "flex",
               alignItems: "center",
               gap: "8px",
               transition: "background 0.2s"
             }}
             onMouseOver={(e) => e.target.style.background = "#dc2626"}
             onMouseOut={(e) => e.target.style.background = "#b91c1c"}
           >
             Logout <span>➔</span>
           </button>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <main style={{ 
          flex: 1, // Takes remaining space
          overflowY: "auto", // SCROLLS independently
          position: "relative" 
        }}>
          <Outlet />
        </main>

      </div>
    </div>
  );
}