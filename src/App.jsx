// src/App.jsx
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import MainLayout from "./layout/MainLayout.jsx";

// Import Pages
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import UserManagement from "./pages/UserManagement.jsx";
// ActiveCattle deleted
import MasterCattle from "./pages/MasterCattle.jsx"; // Now "Herd Registry"
import CattleRegistration from "./pages/CattleRegistration.jsx"; // Now "Cattle Induction"
import NewTag from "./pages/NewTag.jsx"; // Now "Tag Management"
import MilkYield from "./pages/MilkYield.jsx"; // Now "Milk Production"
import BioWaste from "./pages/BioWaste.jsx"; // Now "Waste Mgmt"
import Vaccine from "./pages/Vaccine.jsx"; // Now "Preventive Care"
import Treatment from "./pages/Treatment.jsx"; // Now "Clinical Records"
import NewBorn from "./pages/NewBorn.jsx"; // Now "Calving Log"
import Feeding from "./pages/Feeding.jsx"; // Now "Nutrition"
import DattuYojana from "./pages/DattuYojana.jsx"; // Now "Sponsorships"
import Deregister from "./pages/Deregister.jsx"; // Now "Herd Exit"
import DeathRecords from "./pages/DeathRecords.jsx"; // Now "Mortality Register"
import CertificatesReports from "./pages/CertificatesReports.jsx"; // Now "Reports & Docs"

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#b91c1c" }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <p>Your Role: <strong>{user.role}</strong></p>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute allowedRoles={["Admin", "Super Admin", "User", "Viewer"]}><MainLayout /></ProtectedRoute>}>
          
          {/* --- DASHBOARD --- */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* --- HERD MANAGEMENT --- */}
          <Route path="/cattle/master" element={<MasterCattle />} />
          <Route path="/cattle/register" element={<ProtectedRoute allowedRoles={["Admin", "Super Admin"]}><CattleRegistration /></ProtectedRoute>} />
          <Route path="/newborn" element={<NewBorn />} />
          <Route path="/new-tag" element={<ProtectedRoute allowedRoles={["Admin", "Super Admin"]}><NewTag /></ProtectedRoute>} />
          <Route path="/deregister" element={<ProtectedRoute allowedRoles={["Admin", "Super Admin"]}><Deregister /></ProtectedRoute>} />

          {/* --- OPERATIONS --- */}
          <Route path="/milk-yield" element={<MilkYield />} />
          <Route path="/feeding" element={<Feeding />} />
          <Route path="/bio-waste" element={<BioWaste />} />

          {/* --- VETERINARY --- */}
          <Route path="/treatment" element={<Treatment />} />
          <Route path="/vaccine" element={<Vaccine />} />
          <Route path="/death-records" element={<DeathRecords />} />

          {/* --- FINANCE & ADMIN --- */}
          <Route path="/dattu-yojana" element={<ProtectedRoute allowedRoles={["Admin", "Super Admin"]}><DattuYojana /></ProtectedRoute>} />
          <Route path="/certificates-reports" element={<CertificatesReports />} />
          
          {/* USER MGMT - LOCKED for non-Super Admins */}
          <Route path="/users" element={<ProtectedRoute allowedRoles={["Super Admin"]}><UserManagement /></ProtectedRoute>} />

        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}