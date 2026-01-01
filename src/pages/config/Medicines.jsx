import React from "react";
import MasterTable from "../../components/MasterTable";

export default function Medicines() {
  const columns = [
    { key: "medicine_name", label: "Medicine Name" },
    { key: "type", label: "Type (Vaccine/Antibiotic)" },
    { key: "unit", label: "Unit (ml/mg)" }
  ];
  return <MasterTable title="Medicine Inventory" masterType="medicines" columns={columns} />;
}