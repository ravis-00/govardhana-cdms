import React from "react";
import MasterTable from "../../components/MasterTable";

export default function Rates() {
  const columns = [
    { key: "item_name", label: "Item Name" },
    { key: "rate", label: "Rate (₹)", type: "number" },
    { key: "unit", label: "Per Unit" }
  ];
  return <MasterTable title="Product Rates" masterType="rates" columns={columns} />;
}