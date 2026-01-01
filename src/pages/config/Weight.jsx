// src/pages/config/Weight.jsx
import React from "react";
import MasterTable from "../../components/MasterTable";

export default function Weight() {
  const columns = [
    { key: "breed", label: "Breed" },
    // "type: number" ensures the input field allows numbers only
    { key: "age_1", label: "Age 1 Year (kg)", type: "number" },
    { key: "age_2", label: "Age 2 Years (kg)", type: "number" },
    { key: "age_3", label: "Age 3 Years (kg)", type: "number" },
    { key: "age_4", label: "Age 4 Years (kg)", type: "number" },
    // Note: Ensure the backend sheet header is exactly "age_>5" or "Age_>5"
    { key: "age_>5", label: "Age > 5 Years (kg)", type: "number" } 
  ];

  return (
    <MasterTable 
      title="Weight Standards by Breed & Age" 
      masterType="weight" 
      columns={columns} 
    />
  );
}