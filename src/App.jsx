import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import MainLayout from "./layout/MainLayout.jsx";

// Import Pages
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import ActiveCattle from "./pages/ActiveCattle.jsx";
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
import CertificatesReports from "./pages/CertificatesReports.jsx";

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

        <Route element={<ProtectedRoute allowedRoles={["Admin", "User", "Viewer"]}><MainLayout /></ProtectedRoute>}>
          
          {/* --- GROUP 1: EVERYONE --- */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["Admin", "User", "Viewer"]}><Dashboard /></ProtectedRoute>} />
          <Route path="/cattle/active" element={<ProtectedRoute allowedRoles={["Admin", "User", "Viewer"]}><ActiveCattle /></ProtectedRoute>} />
          <Route path="/cattle/master" element={<ProtectedRoute allowedRoles={["Admin", "User", "Viewer"]}><MasterCattle /></ProtectedRoute>} />
          <Route path="/milk-yield" element={<ProtectedRoute allowedRoles={["Admin", "User", "Viewer"]}><MilkYield /></ProtectedRoute>} />
          <Route path="/bio-waste" element={<ProtectedRoute allowedRoles={["Admin", "User", "Viewer"]}><BioWaste /></ProtectedRoute>} />
          <Route path="/vaccine" element={<ProtectedRoute allowedRoles={["Admin", "User", "Viewer"]}><Vaccine /></ProtectedRoute>} />
          <Route path="/treatment" element={<ProtectedRoute allowedRoles={["Admin", "User", "Viewer"]}><Treatment /></ProtectedRoute>} />
          <Route path="/newborn" element={<ProtectedRoute allowedRoles={["Admin", "User", "Viewer"]}><NewBorn /></ProtectedRoute>} />
          <Route path="/feeding" element={<ProtectedRoute allowedRoles={["Admin", "User", "Viewer"]}><Feeding /></ProtectedRoute>} />
          <Route path="/dattu-yojana" element={<ProtectedRoute allowedRoles={["Admin", "User", "Viewer"]}><DattuYojana /></ProtectedRoute>} />

          {/* --- GROUP 2: ADMIN & USER ONLY --- */}
          <Route path="/cattle/register" element={<ProtectedRoute allowedRoles={["Admin", "User"]}><CattleRegistration /></ProtectedRoute>} />
          <Route path="/new-tag" element={<ProtectedRoute allowedRoles={["Admin", "User"]}><NewTag /></ProtectedRoute>} />
          <Route path="/deregister" element={<ProtectedRoute allowedRoles={["Admin", "User"]}><Deregister /></ProtectedRoute>} />
          <Route path="/death-records" element={<ProtectedRoute allowedRoles={["Admin", "User"]}><DeathRecords /></ProtectedRoute>} />
          <Route path="/certificates-reports" element={<ProtectedRoute allowedRoles={["Admin", "User"]}><CertificatesReports /></ProtectedRoute>} />

          {/* --- GROUP 3: ADMIN ONLY --- */}
          <Route path="/users" element={<ProtectedRoute allowedRoles={["Admin"]}><UserManagement /></ProtectedRoute>} />

        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}