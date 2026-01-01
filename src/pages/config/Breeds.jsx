import React from "react";
import MasterTable from "../../components/MasterTable";

export default function Breeds() {
  const columns = [
    { key: "breed_name", label: "Breed Name" }, // Matches 'Breed Name' in sheet
    { key: "origin", label: "Origin" },
    { key: "description", label: "Description" }
  ];
  return <MasterTable title="Breed Configuration" masterType="breeds" columns={columns} />;
}