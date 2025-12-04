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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cattle/active" element={<ActiveCattle />} />
        <Route path="/milk-yield" element={<MilkYield />} />
        <Route path="/bio-waste" element={<BioWaste />} />
        <Route path="/vaccine" element={<Vaccine />} />
        <Route path="/treatment" element={<Treatment />} />
        <Route path="/newborn" element={<NewBorn />} />
        <Route path="/feeding" element={<Feeding />} />
        <Route path="/dattu-yojana" element={<DattuYojana />} />
        <Route path="/deregister" element={<Deregister />} />
      </Route>
    </Routes>
  );
}
