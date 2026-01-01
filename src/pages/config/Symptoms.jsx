// src/pages/config/Symptoms.jsx
import React from "react";
import MasterTable from "../../components/MasterTable";

export default function Symptoms() {
  const columns = [
    { key: "symptom_name", label: "Symptom Name" },
    { key: "category", label: "Category (e.g. Viral, Bacterial)" },
    { key: "description", label: "Description / Notes" }
  ];

  return (
    <MasterTable 
      title="Disease & Symptoms Master" 
      masterType="symptoms" 
      columns={columns} 
    />
  );
}