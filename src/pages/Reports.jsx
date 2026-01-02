// src/pages/Reports.jsx
import React, { useState, useEffect } from "react";
import { getReportData } from "../api/masterApi"; 

// Report Configuration with EXACT Backend Keys
const REPORT_TYPES = [
  { 
    id: "birth", 
    label: "Birth Report", 
    columns: [
      { label: "Date", key: "date" },
      { label: "Tag / ID", key: "tag" },
      { label: "Name", key: "name" },
      { label: "Breed", key: "breed" },
      { label: "Gender", key: "gender" },
      { label: "Mother", key: "mother" },
      { label: "Father", key: "father" },
      { label: "Status", key: "status" }
    ] 
  },
  { 
    id: "death", 
    label: "Death Report", 
    columns: [
      { label: "Date", key: "date" },
      { label: "Tag", key: "tag" },
      { label: "Reason", key: "reason" },
      { label: "Remarks", key: "remarks" }
    ] 
  },
  { 
    id: "sales", 
    label: "Sales Report", 
    columns: [
      { label: "Date", key: "date" },
      { label: "Tag", key: "tag" },
      { label: "Buyer", key: "buyer" },
      { label: "Amount", key: "amount" },
      { label: "Receipt", key: "receipt" }
    ] 
  },
  { 
    id: "incoming", 
    label: "Incoming Report", 
    columns: [
      { label: "Date", key: "date" },
      { label: "Tag", key: "tag" },
      { label: "Source", key: "source" },
      { label: "Cost", key: "cost" },
      { label: "Breed", key: "breed" }
    ] 
  },
  { 
    id: "dattu", 
    label: "Dattu Yojana Report", 
    columns: [
      { label: "Date", key: "date" },
      { label: "Donor", key: "donor" },
      { label: "Scheme", key: "scheme" },
      { label: "Amount", key: "amount" },
      { label: "Receipt", key: "receipt" }
    ] 
  },
  { 
    id: "milk", 
    label: "Milk Yield Report", 
    columns: [
      { label: "Date", key: "date" },
      { label: "Morning", key: "morning" },
      { label: "Evening", key: "evening" },
      { label: "Total", key: "total" },
      { label: "Fat %", key: "fat" }
    ] 
  },
  { 
    id: "bio", 
    label: "Bio-Waste Report", 
    columns: [
      { label: "Date", key: "date" },
      { label: "Dung (kg)", key: "dung" },
      { label: "Urine (L)", key: "urine" },
      { label: "Slurry (L)", key: "slurry" }
    ] 
  },
];

export default function Reports() {
  const [activeReport, setActiveReport] = useState(REPORT_TYPES[0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Date Filters (Default: Current Year to capture test data)
  // Changed default to Jan 1st of current year to ensure you see data immediately
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().slice(0,10);
  const currentDay = today.toISOString().slice(0,10);
  
  const [fromDate, setFromDate] = useState(firstDay);
  const [toDate, setToDate] = useState(currentDay);

  useEffect(() => {
    loadReport();
  }, [activeReport]); 

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await getReportData(activeReport.id, fromDate, toDate);
      if (Array.isArray(res)) {
        setRows(res); // Handle direct array return
      } else if (res && res.data && Array.isArray(res.data)) {
        setRows(res.data); // Handle { success: true, data: [...] }
      } else {
        setRows([]);
      }
    } catch (err) {
      console.error("Report Error:", err);
      // alert("Failed to load report data."); // Optional: suppress alert to avoid annoyance
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const html = `
      <html>
        <head>
          <title>${activeReport.label}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; margin-bottom: 5px; }
            .meta { text-align: center; margin-bottom: 20px; color: #666; font-size: 0.9rem; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            @media print { @page { size: landscape; } }
          </style>
        </head>
        <body>
          <h1>${activeReport.label}</h1>
          <div class="meta">Period: ${fromDate} to ${toDate} | Generated on: ${new Date().toLocaleDateString()}</div>
          <table>
            <thead>
              <tr>${activeReport.columns.map(c => `<th>${c.label}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  ${activeReport.columns.map(col => `<td>${r[col.key] || "-"}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f3f4f6" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: "250px", background: "white", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#1f2937" }}>📊 Reports</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
          {REPORT_TYPES.map((rep) => (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 15px",
                marginBottom: "5px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: activeReport.id === rep.id ? "#eff6ff" : "transparent",
                color: activeReport.id === rep.id ? "#2563eb" : "#4b5563",
                fontWeight: activeReport.id === rep.id ? "600" : "400"
              }}
            >
              {rep.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* TOP BAR */}
        <div style={{ background: "white", padding: "1rem 2rem", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.4rem" }}>{activeReport.label}</h2>
          </div>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <div>
              <label style={labelStyle}>From</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>To</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={inputStyle} />
            </div>
            <button onClick={loadReport} style={primaryBtnStyle}>Apply Filter</button>
            <button onClick={handlePrint} style={secondaryBtnStyle}>🖨️ Print</button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
          <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead style={{ background: "#f9fafb", textAlign: "left" }}>
                <tr>
                  {activeReport.columns.map((col) => (
                    <th key={col.key} style={thStyle}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={activeReport.columns.length} style={emptyStyle}>Loading Data...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={activeReport.columns.length} style={emptyStyle}>No records found for this period.</td></tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      {activeReport.columns.map((col) => (
                         // 🔥 Direct Key Mapping (No fuzzy match)
                        <td key={col.key} style={tdStyle}>{row[col.key] || "-"}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "1rem", textAlign: "right", color: "#6b7280", fontSize: "0.85rem" }}>
            Total Records: {rows.length}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- STYLES ---
const labelStyle = { display: "block", fontSize: "0.75rem", color: "#6b7280", marginBottom: "4px" };
const inputStyle = { padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" };
const primaryBtnStyle = { padding: "0.5rem 1rem", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" };
const secondaryBtnStyle = { padding: "0.5rem 1rem", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontWeight: "600" };
const thStyle = { padding: "1rem", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontWeight: "600" };
const tdStyle = { padding: "0.8rem 1rem", borderBottom: "1px solid #f3f4f6", color: "#1f2937" };
const emptyStyle = { padding: "3rem", textAlign: "center", color: "#9ca3af" };