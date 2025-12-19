import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext"; // Import Auth Context
import MainLayout from "./layout/MainLayout.jsx";

// Import Pages
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import UserManagement from "./pages/UserManagement.jsx"; // <--- New Page
import ActiveCattle from "./pages/ActiveCattle.jsx";
import MilkYield from "./pages/MilkYield.jsx";
import BioWaste from "./pages/BioWaste.jsx";
import Vaccine from "./pages/Vaccine.jsx";
import Treatment from "./pages/Treatment.jsx";
import NewBorn from "./pages/NewBorn.jsx";
import Feeding from "./pages/Feeding.jsx";
import DattuYojana from "./pages/DattuYojana.jsx";
import Deregister from "./pages/Deregister.jsx";
import CattleRegistration from "./pages/CattleRegistration.jsx";
import DeathRecords from "./pages/DeathRecords.jsx";
import MasterCattle from "./pages/MasterCattle.jsx";
import NewTag from "./pages/NewTag.jsx";
import CertificatesReports from "./pages/CertificatesReports.jsx";

// --- PROTECTED ROUTE COMPONENT ---
// This component checks if the user is logged in and has the correct role
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem", color: "#666" }}>
        Loading...
      </div>
    );
  }

  // 1. Not Logged In -> Redirect to Login
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 2. Role Check (Optional)
  // If allowedRoles is provided, check if user's role is in the list
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
    // Wrap the entire routing logic in AuthProvider so all pages can access user state
    <AuthProvider>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* --- Protected Routes (Wrapped in MainLayout) --- */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard - Accessible to all logged in users */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Admin Only Route */}
          <Route 
            path="/users" 
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <UserManagement />
              </ProtectedRoute>
            } 
          />

          {/* Operational Routes - Accessible to Admin & User (Viewer typically read-only, handled in pages) */}
          <Route path="/cattle/active" element={<ActiveCattle />} />
          <Route path="/cattle/master" element={<MasterCattle />} />
          <Route path="/cattle/register" element={<CattleRegistration />} />
          <Route path="/new-tag" element={<NewTag />} />
          <Route path="/milk-yield" element={<MilkYield />} />
          <Route path="/bio-waste" element={<BioWaste />} />
          <Route path="/vaccine" element={<Vaccine />} />
          <Route path="/treatment" element={<Treatment />} />
          <Route path="/newborn" element={<NewBorn />} />
          <Route path="/feeding" element={<Feeding />} />
          <Route path="/dattu-yojana" element={<DattuYojana />} />
          <Route path="/deregister" element={<Deregister />} />
          <Route path="/death-records" element={<DeathRecords />} />
          <Route path="/certificates-reports" element={<CertificatesReports />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}