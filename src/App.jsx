import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// ✅ CORRECT IMPORT PATH (src/layout/)
import MainLayout from "./layout/MainLayout.jsx";

// Import Pages
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import MasterCattle from "./pages/MasterCattle.jsx"; 
import CattleRegistration from "./pages/CattleRegistration.jsx"; 
import NewTag from "./pages/NewTag.jsx"; 
import MilkYield from "./pages/MilkYield.jsx"; 
import BioWaste from "./pages/BioWaste.jsx"; 
import Vaccine from "./pages/Vaccine.jsx"; 
import Treatment from "./pages/Treatment.jsx"; 
import NewBorn from "./pages/NewBorn.jsx"; 
import Feeding from "./pages/Feeding.jsx"; 
import DattuYojana from "./pages/DattuYojana.jsx"; 
import Deregister from "./pages/Deregister.jsx"; 
import DeathRecords from "./pages/DeathRecords.jsx"; 
import Reports from "./pages/Reports.jsx"; 

// --- CONFIG PAGES ---
import Breeds from "./pages/config/Breeds";
import Medicines from "./pages/config/Medicines";
import Rates from "./pages/config/Rates";
import Weight from "./pages/config/Weight";
import Symptoms from "./pages/config/Symptoms";
import ShedConfig from "./pages/config/ShedConfig";

// 🔥 IMPORT PEDIGREE VIEWER
import PedigreeViewer from "./pages/PedigreeViewer.jsx";

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

  // Normalize role to ensure matching works
  const userRole = user.role ? String(user.role).trim() : "";

  // Check permissions
  const hasPermission = allowedRoles 
    ? allowedRoles.some(r => r === userRole || r === user.role) 
    : true;

  if (allowedRoles && !hasPermission) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#b91c1c" }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <p>Your Role: <strong>{userRole}</strong></p>
        <p style={{fontSize: "0.8rem", color: "#666"}}>Required: {allowedRoles.join(", ")}</p>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* MAIN LAYOUT WRAPPER (PROTECTED) */}
        {/* Accessible by Admin, Super Admin, User, Viewer */}
        <Route element={<ProtectedRoute allowedRoles={["Admin", "Super Admin", "User", "Viewer"]}><MainLayout /></ProtectedRoute>}>
          
          {/* --- DASHBOARD --- */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* --- HERD MANAGEMENT --- */}
          <Route path="/cattle/master" element={<MasterCattle />} />
          <Route path="/cattle/register" element={<ProtectedRoute allowedRoles={["Admin", "Super Admin"]}><CattleRegistration /></ProtectedRoute>} />
          
          {/* 🔥 PEDIGREE ROUTE */}
          <Route path="/pedigree" element={<PedigreeViewer />} />

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
          <Route path="/dattu-yojana" element={<ProtectedRoute allowedRoles={["Admin", "Super Admin", "User"]}><DattuYojana /></ProtectedRoute>} />
          
          {/* --- REPORTS --- */}
          <Route path="/reports" element={<Reports />} />

          {/* --- MASTER CONFIGURATION --- */}
          <Route path="/config/breeds" element={<ProtectedRoute allowedRoles={["Admin", "Super Admin"]}><Breeds /></ProtectedRoute>} />
          <Route path="/config/medicines" element={<ProtectedRoute allowedRoles={["Admin", "Super Admin"]}><Medicines /></ProtectedRoute>} />
          <Route path="/config/rates" element={<ProtectedRoute allowedRoles={["Admin", "Super Admin"]}><Rates /></ProtectedRoute>} />
          <Route path="/config/weight" element={<ProtectedRoute allowedRoles={["Admin", "Super Admin"]}><Weight /></ProtectedRoute>} />
          <Route path="/config/symptoms" element={<ProtectedRoute allowedRoles={["Admin", "Super Admin"]}><Symptoms /></ProtectedRoute>} />
          <Route path="config/sheds" element={<ShedConfig />} />

          {/* --- USER MANAGEMENT --- */}
          <Route path="/users" element={<ProtectedRoute allowedRoles={["Admin", "Super Admin"]}><UserManagement /></ProtectedRoute>} />

        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}