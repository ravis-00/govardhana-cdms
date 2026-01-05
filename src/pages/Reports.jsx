import React, { useState, useEffect, useMemo } from "react";
import { getReportData } from "../api/masterApi"; 

// --- 1. CONFIGURATION ---
const REPORT_TYPES = [
  { 
    id: "birth", 
    label: "Birth Report", 
    columns: [
      { label: "Sl.No", key: "slno" },
      { label: "Date", key: "date" },
      { label: "Time", key: "time" },
      { label: "Name", key: "name" },
      { label: "Breed", key: "breed" },
      { label: "Gender", key: "gender" },
      { label: "Color", key: "color" },
      { label: "Mother Breed", key: "momBreed" },
      { label: "Mother Tag", key: "momTag" },
      { label: "Father Breed", key: "dadBreed" },
      { label: "Father Tag", key: "dadTag" },
      { label: "Status", key: "status" }
    ] 
  },
  { 
    id: "death", 
    label: "Death Report", 
    columns: [
      { label: "Sl.No", key: "slno" },
      { label: "Date", key: "date" },
      { label: "Time", key: "time" },
      { label: "Name", key: "name" },
      { label: "Tag No", key: "tag" },
      { label: "Age", key: "age" },
      { label: "Gender", key: "gender" },
      { label: "Reason", key: "reason" }
    ] 
  },
  { 
    id: "sales", 
    label: "Sales Report", 
    columns: [
      { label: "Sl.No", key: "slno" },
      { label: "Date", key: "date" },
      { label: "Cattle Name", key: "name" },
      { label: "Tag No", key: "tag" },
      { label: "Buyer Name", key: "partyName" },
      { label: "Contact", key: "partyPhone" },
      { label: "Receipt No", key: "receipt" },
      { label: "Amount", key: "amount" }
    ] 
  },
  { 
    id: "incoming", 
    label: "Incoming Report", 
    columns: [
      { label: "Sl.No", key: "slno" },
      { label: "Date", key: "date" },
      { label: "Tag No", key: "tag" },
      { label: "Cattle Name", key: "name" },
      { label: "Breed", key: "breed" },
      { label: "Gender", key: "gender" },
      { label: "Source", key: "partyName" }
    ] 
  },
  { 
    id: "dattu", 
    label: "Dattu Yojana Report", 
    columns: [
      { label: "Sl.No", key: "slno" },
      { label: "Date", key: "date" },
      { label: "Donor Name", key: "donor" },
      { label: "Mobile", key: "contact" },
      { label: "Cattle Name", key: "name" },
      { label: "Tag No", key: "tag" },
      { label: "Scheme", key: "scheme" },
      { label: "Receipt", key: "receipt" },
      { label: "Expiry", key: "expiry" },
      { label: "Amount", key: "amount" }
    ] 
  },
  { 
    id: "milk", 
    label: "Daily Milk Report", 
    columns: [
      { label: "Sl.No", key: "slno" },
      { label: "Date", key: "date" },
      // AM
      { label: "AM Yield", key: "amYield" },
      { label: "AM Good", key: "amGood" },
      { label: "AM Colostrum", key: "amCol" },
      // PM
      { label: "PM Yield", key: "pmYield" },
      { label: "PM Good", key: "pmGood" },
      { label: "PM Colostrum", key: "pmCol" },
      // Distribution
      { label: "Temple", key: "temple" },
      { label: "Workers", key: "workers" },
      { label: "Calves/Bulls", key: "bulls" },
      // Totals
      { label: "Total Yield", key: "totalYield" },
      { label: "Total Dist", key: "totalLeftByProd" } // Mapped conceptually
    ] 
  },
  { 
    id: "govardhana", 
    label: "Govardhana Outgoing", 
    columns: [
      { label: "Sl.No", key: "slno" },
      { label: "Date", key: "date" },
      { label: "Invoice", key: "invoice" },
      { label: "Sector", key: "sector" },
      { label: "Milk (Kg)", key: "milkQty" },
      { label: "Milk (Rs)", key: "milkRs" },
      { label: "Dung (Kg)", key: "dungQty" },
      { label: "Dung (Rs)", key: "dungRs" },
      { label: "Urine (L)", key: "urineQty" },
      { label: "Urine (Rs)", key: "urineRs" },
      { label: "Total (Rs)", key: "totalAmount" }
    ] 
  }
];

// Reports that show a Total Row
const REPORTS_WITH_TOTALS = ["sales", "dattu", "milk", "govardhana"];

export default function Reports() {
  const [activeReport, setActiveReport] = useState(REPORT_TYPES[0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false); // For mobile menu toggle
  
  // Default Date Range: Current Month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0,10);
  const currentDay = today.toISOString().slice(0,10);
  
  const [fromDate, setFromDate] = useState(firstDay);
  const [toDate, setToDate] = useState(currentDay);

  useEffect(() => {
    setRows([]); 
    loadReport();
    setSidebarOpen(false); // Close sidebar on mobile when report changes
  }, [activeReport]); 

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await getReportData(activeReport.id, fromDate, toDate);
      
      // 🔥 FIX: Handle API Wrapper
      let rawData = [];
      if (res && res.data && Array.isArray(res.data)) {
          rawData = res.data;
      } else if (Array.isArray(res)) {
          rawData = res;
      }

      const processed = rawData.map((row, index) => ({
        ...row,
        slno: index + 1
      }));
      setRows(processed);
    } catch (err) {
      console.error("Report Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // CALCULATE TOTALS
  const totals = useMemo(() => {
    if (!rows.length || !REPORTS_WITH_TOTALS.includes(activeReport.id)) return {};
    
    const summableKeys = [
      "milkQty", "milkRs", "dungQty", "dungRs", 
      "urineQty", "urineRs", "slurryQty", "slurryRs", "totalAmount",
      "amount",
      "amYield", "amByProd", "amGood", "amCol", "temple", 
      "pmYield", "pmByProd", "pmGood", "pmCol", 
      "bulls", "workers", 
      "totalYield", "totalColostrum", "totalFree", "totalLeftByProd"
    ];

    const sums = {};
    activeReport.columns.forEach(col => {
      if (summableKeys.includes(col.key)) {
        const sum = rows.reduce((acc, row) => {
          const val = parseFloat(row[col.key]);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);
        sums[col.key] = Math.round(sum * 100) / 100;
      }
    });
    return sums;
  }, [rows, activeReport]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const fmtDate = (d) => d ? d.split('-').reverse().join('-') : ""; 
    const uniqueTitle = `${activeReport.label} (${fmtDate(fromDate)} to ${fmtDate(toDate)})`;

    const rowsHtml = rows.map(r => `
      <tr>
        ${activeReport.columns.map(col => `<td>${r[col.key] || "-"}</td>`).join("")}
      </tr>
    `).join("");

    let totalRowHtml = "";
    if (REPORTS_WITH_TOTALS.includes(activeReport.id)) {
      totalRowHtml = `
        <tr class="total-row">
          ${activeReport.columns.map(col => {
            if (col.key === "slno") return "<td>Total</td>";
            if (totals[col.key] !== undefined) return `<td>${totals[col.key]}</td>`;
            return "<td></td>";
          }).join("")}
        </tr>
      `;
    }

    const html = `
      <html>
        <head>
          <title>${uniqueTitle}</title> 
          <style>
            body { font-family: "Calibri", sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .main-title { font-size: 20px; font-weight: bold; text-transform: uppercase; text-decoration: underline; }
            .sub-title { font-size: 14px; margin-top: 5px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: 9px; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 4px; text-align: center; word-wrap: break-word; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .total-row td { background-color: #e5e7eb; font-weight: bold; border-top: 2px solid #000; }
            .footer { display: flex; justify-content: space-between; margin-top: 60px; padding: 0 40px; }
            .signature-block { text-align: center; width: 200px; }
            .signature-line { border-top: 1px solid #000; padding-top: 5px; font-weight: bold; font-size: 12px; }
            @media print { @page { size: landscape; margin: 10mm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="main-title">Madhava Srusti Rashtrotthana Goshala</div>
            <div class="sub-title">${activeReport.label} (Period: ${fmtDate(fromDate)} to ${fmtDate(toDate)})</div>
          </div>
          <table>
            <thead>
              <tr>${activeReport.columns.map(c => `<th>${c.label}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
              ${totalRowHtml} 
            </tbody>
          </table>
          <div class="footer">
            <div class="signature-block"><div class="signature-line">Supervisor Signature</div></div>
            <div class="signature-block"><div class="signature-line">Project Manager Signature</div></div>
          </div>
          <script>setTimeout(() => { window.print(); }, 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="reports-container" style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f3f4f6" }}>
      
      {/* 1. MOBILE REPORT SELECTOR (Horizontal Scroll) */}
      <div className="mobile-report-menu" style={{ overflowX: "auto", whiteSpace: "nowrap", background: "white", padding: "10px", borderBottom: "1px solid #e5e7eb", display: "none" /* Handled by CSS media query in styling */ }}>
         {REPORT_TYPES.map((rep) => (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep)}
              style={{
                padding: "6px 12px",
                marginRight: "8px",
                borderRadius: "20px",
                border: activeReport.id === rep.id ? "1px solid #2563eb" : "1px solid #e5e7eb",
                background: activeReport.id === rep.id ? "#eff6ff" : "white",
                color: activeReport.id === rep.id ? "#2563eb" : "#4b5563",
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              {rep.label}
            </button>
         ))}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* 2. DESKTOP SIDEBAR */}
        <div className="desktop-sidebar" style={{ width: "260px", background: "white", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "1.5rem", borderBottom: "1px solid #e5e7eb" }}>
            <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#1f2937" }}>📊 Reports</h2>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
            {REPORT_TYPES.map((rep) => (
              <button
                key={rep.id}
                onClick={() => setActiveReport(rep)}
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "12px 15px", marginBottom: "5px",
                  borderRadius: "8px", border: "none", cursor: "pointer",
                  background: activeReport.id === rep.id ? "#eff6ff" : "transparent",
                  color: activeReport.id === rep.id ? "#2563eb" : "#4b5563",
                  fontWeight: activeReport.id === rep.id ? "600" : "400",
                  transition: "all 0.2s"
                }}
              >
                {rep.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. MAIN CONTENT AREA */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          
          {/* Top Bar: Title & Filters */}
          <div style={{ background: "white", padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
               <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#111827" }}>{activeReport.label}</h2>
               
               <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{fontSize:"0.8rem", color:"#666"}}>From:</span>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{fontSize:"0.8rem", color:"#666"}}>To:</span>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={inputStyle} />
                  </div>
                  <button onClick={loadReport} className="btn-primary" style={btnStyle}>Apply</button>
                  <button onClick={handlePrint} className="btn-secondary" style={printBtnStyle}>🖨️ Print</button>
               </div>
            </div>
          </div>

          {/* Data Table Container */}
          <div style={{ flex: 1, padding: "1rem", overflow: "hidden", display:"flex", flexDirection: "column" }}>
            <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ overflow: "auto", flex: 1 }}> {/* 🔥 SCROLLABLE TABLE AREA */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", minWidth: "100%" }}>
                  <thead style={{ background: "#f9fafb", textAlign: "left", position: "sticky", top: 0, zIndex: 10 }}>
                    <tr>{activeReport.columns.map((col) => <th key={col.key} style={thStyle}>{col.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {loading ? <tr><td colSpan={activeReport.columns.length} style={{padding:"3rem", textAlign:"center", color:"#6b7280"}}>Loading data...</td></tr> : 
                     rows.length === 0 ? <tr><td colSpan={activeReport.columns.length} style={{padding:"3rem", textAlign:"center", color:"#9ca3af"}}>No records found for this period.</td></tr> :
                     rows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "white" : "#fafafa" }}>
                        {activeReport.columns.map((col) => <td key={col.key} style={tdStyle}>{row[col.key] || "-"}</td>)}
                      </tr>
                     ))}
                  </tbody>
                  
                  {/* Sticky Footer for Totals */}
                  {rows.length > 0 && REPORTS_WITH_TOTALS.includes(activeReport.id) && (
                    <tfoot style={{ background: "#f1f5f9", position: "sticky", bottom: 0, zIndex: 10, fontWeight: "bold", borderTop:"2px solid #e2e8f0" }}>
                      <tr>
                        {activeReport.columns.map((col) => (
                          <td key={col.key} style={{ padding: "10px", whiteSpace: "nowrap", color: "#1e293b" }}>
                            {col.key === "slno" ? "Total" : (totals[col.key] !== undefined ? totals[col.key] : "")}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
            <div style={{marginTop:"10px", textAlign:"right", color:"#666", fontSize:"0.8rem"}}>Total Records: <strong>{rows.length}</strong></div>
          </div>
        </div>
      </div>

      {/* RESPONSIVE CSS INJECTION (Or add to your index.css) */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-report-menu { display: flex !important; }
          .reports-container { height: auto !important; min-height: 100vh; }
        }
      `}</style>
    </div>
  );
}

// --- STYLES ---
const inputStyle = { padding: "6px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "0.9rem" };
const btnStyle = { padding: "6px 14px", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "500" };
const printBtnStyle = { padding: "6px 14px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer", fontWeight: "500", color: "#374151" };
const thStyle = { padding: "12px 10px", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap", fontWeight: "600", color: "#475569" };
const tdStyle = { padding: "10px", whiteSpace: "nowrap", color: "#334155" };