// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
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

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* Protected area with layout */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
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

        {/* NEW route */}
        <Route
          path="/certificates-reports"
          element={<CertificatesReports />}
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
