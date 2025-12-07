// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout.jsx";

// Public pages
import Login from "./pages/Login.jsx";

// Layout pages (inside MainLayout)
import Dashboard from "./pages/Dashboard.jsx";
import ActiveCattle from "./pages/ActiveCattle.jsx";
import CattleRegistration from "./pages/CattleRegistration.jsx";
import MasterCattle from "./pages/MasterCattle.jsx";
import MilkYield from "./pages/MilkYield.jsx";
import BioWaste from "./pages/BioWaste.jsx";
import Vaccine from "./pages/Vaccine.jsx";
import Treatment from "./pages/Treatment.jsx";
import NewBorn from "./pages/NewBorn.jsx";
import Feeding from "./pages/Feeding.jsx";
import DattuYojana from "./pages/DattuYojana.jsx";
import Deregister from "./pages/Deregister.jsx";
import DeathRecords from "./pages/DeathRecords.jsx";
import NewTag from "./pages/NewTag.jsx"; // ✅ new import
import CattleProfile from "./pages/CattleProfile.jsx";
import PedigreeViewer from "./pages/PedigreeViewer.jsx";


export default function App() {
  return (
    <Routes>
      {/* Public routes (without MainLayout) */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* Protected app area (with MainLayout) */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Cattle-related pages */}
        <Route path="/cattle/active" element={<ActiveCattle />} />
        <Route path="/cattle/master" element={<MasterCattle />} />
        <Route path="/cattle/register" element={<CattleRegistration />} />
<Route path="/new-tag" element={<NewTag />} /> {/* ✅ new route */}
        {/* Daily operations */}
        <Route path="/milk-yield" element={<MilkYield />} />
        <Route path="/bio-waste" element={<BioWaste />} />
        <Route path="/vaccine" element={<Vaccine />} />
        <Route path="/treatment" element={<Treatment />} />
        <Route path="/newborn" element={<NewBorn />} />
        <Route path="/feeding" element={<Feeding />} />
        <Route path="/dattu-yojana" element={<DattuYojana />} />
        <Route path="/deregister" element={<Deregister />} />
<Route path="/cattle/profile" element={<CattleProfile />} />
<Route path="/cattle/pedigree" element={<PedigreeViewer />} />
        {/* Death records (matches sidebar path) */}
        <Route path="/death-records" element={<DeathRecords />} />
      </Route>

      {/* Fallback: any unknown route -> login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
