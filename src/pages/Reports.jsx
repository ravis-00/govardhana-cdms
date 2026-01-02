import React, { useState, useEffect } from "react";
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
      { label: "Mother Cow Breed", key: "momBreed" },
      { label: "Mother Tag Number", key: "momTag" },
      { label: "Father Bull Breed", key: "dadBreed" },
      { label: "Father Tag Number", key: "dadTag" },
      { label: "Status", key: "status" }
    ] 
  },
  { 
    id: "death", 
    label: "Death Report", 
    columns: [
      { label: "Sl.No", key: "slno" },
      { label: "Death Date", key: "date" },
      { label: "Death Time", key: "time" },
      { label: "Name", key: "name" },
      { label: "Breed", key: "breed" },
      { label: "Tag Number", key: "tag" },
      { label: "DOB/Admission", key: "dob" },
      { label: "Teeth", key: "teeth" },
      { label: "Age", key: "age" },
      { label: "Colour", key: "color" },
      { label: "Gender", key: "gender" },
      { label: "Mother Cow Breed", key: "momBreed" },
      { label: "Mother Tag No", key: "momTag" },
      { label: "Father Bull Breed", key: "dadBreed" },
      { label: "Father Tag No", key: "dadTag" },
      { label: "Reason for Death", key: "reason" }
    ] 
  },
  { id: "sales", label: "Sales Report", columns: [{label:"Date", key:"date"}, {label:"Tag", key:"tag"}] },
  { id: "incoming", label: "Incoming Report", columns: [{label:"Date", key:"date"}, {label:"Tag", key:"tag"}] },
  { id: "dattu", label: "Dattu Yojana Report", columns: [{label:"Date", key:"date"}, {label:"Donor", key:"donor"}] },
  { id: "milk", label: "Milk Yield Report", columns: [{label:"Date", key:"date"}, {label:"Total", key:"total"}] },
  { id: "bio", label: "Bio-Waste Report", columns: [{label:"Date", key:"date"}, {label:"Item", key:"item"}] },
];

export default function Reports() {
  const [activeReport, setActiveReport] = useState(REPORT_TYPES[0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Default Dates: Jan 1st of current year to Today
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().slice(0,10);
  const currentDay = today.toISOString().slice(0,10);
  
  const [fromDate, setFromDate] = useState(firstDay);
  const [toDate, setToDate] = useState(currentDay);

  useEffect(() => {
    setRows([]); // Clear old data when switching tabs
    loadReport();
  }, [activeReport]); 

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await getReportData(activeReport.id, fromDate, toDate);
      const rawData = Array.isArray(res) ? res : (res?.data || []);
      
      // Add Sl.No to every row
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

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const fmtDate = (d) => d ? d.split('-').reverse().join('-') : ""; 
    const uniqueTitle = `${activeReport.label} ${fmtDate(fromDate)} to ${fmtDate(toDate)}`;

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
            
            .footer { display: flex; justify-content: space-between; margin-top: 60px; padding: 0 40px; }
            .signature-block { text-align: center; width: 200px; }
            .signature-line { border-top: 1px solid #000; padding-top: 5px; font-weight: bold; font-size: 12px; }

            @media print { @page { size: landscape; margin: 10mm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="main-title">Madhava Srusti Rashtrotthana Goshala</div>
            <div class="sub-title">${activeReport.label} Period: ${fmtDate(fromDate)} to ${fmtDate(toDate)}</div>
          </div>
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
    <div style={{ display: "flex", height: "100vh", background: "#f3f4f6" }}>
      {/* Sidebar */}
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
                display: "block", width: "100%", textAlign: "left", padding: "10px 15px", marginBottom: "5px",
                borderRadius: "6px", border: "none", cursor: "pointer",
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

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: "white", padding: "1rem 2rem", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.4rem" }}>{activeReport.label}</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <div><label style={{fontSize:"0.75rem", display:"block", color:"#666"}}>From</label><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{padding:"6px", borderRadius:"4px", border:"1px solid #ccc"}} /></div>
            <div><label style={{fontSize:"0.75rem", display:"block", color:"#666"}}>To</label><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{padding:"6px", borderRadius:"4px", border:"1px solid #ccc"}} /></div>
            <button onClick={loadReport} style={{padding:"6px 12px", background:"#2563eb", color:"white", border:"none", borderRadius:"4px", cursor:"pointer"}}>Apply</button>
            <button onClick={handlePrint} style={{padding:"6px 12px", background:"#f3f4f6", border:"1px solid #ccc", borderRadius:"4px", cursor:"pointer"}}>🖨️ Print</button>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
          <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead style={{ background: "#f9fafb", textAlign: "left" }}>
                <tr>{activeReport.columns.map((col) => <th key={col.key} style={{padding:"10px", borderBottom:"1px solid #eee"}}>{col.label}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={activeReport.columns.length} style={{padding:"2rem", textAlign:"center"}}>Loading...</td></tr> : 
                 rows.length === 0 ? <tr><td colSpan={activeReport.columns.length} style={{padding:"2rem", textAlign:"center", color:"#999"}}>No records found.</td></tr> :
                 rows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      {activeReport.columns.map((col) => <td key={col.key} style={{padding:"10px"}}>{row[col.key] || "-"}</td>)}
                    </tr>
                 ))}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:"10px", textAlign:"right", color:"#666", fontSize:"0.8rem"}}>Total: {rows.length}</div>
        </div>
      </div>
    </div>
  );
}