import React, { useEffect, useMemo, useState } from "react";
import { getDeathRecords } from "../api/masterApi.js"; 

// --- HELPERS ---

// 1. Keeps date as YYYY-MM-DD for Logic & Sorting
function isoDateOnly(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (Object.prototype.toString.call(value) === "[object Date]") {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
}

// 2. Converts YYYY-MM-DD to DD-MM-YYYY for Display
function formatDateDisplay(isoDate) {
  if (!isoDate) return "";
  const parts = isoDate.split("-"); // Expecting yyyy-mm-dd
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // Returns dd-mm-yyyy
  }
  return isoDate;
}

function toDateObj(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function defaultFromDate() {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Normalize Backend Data
function normalizeRecord(r) {
  // We keep this as ISO (yyyy-mm-dd) for sorting logic to work
  const dateIso = isoDateOnly(r.dateOfDeAdmit || r.dateOfDeAdmission || r.dateOfDeath || r.date || "");

  return {
    id: r.id, 
    cattleId: r.cattleId || r.tagNo || r.tagNumber || "",
    name: r.name || "",
    breed: r.breed || "",
    gender: r.gender || "",
    dob: r.dateOfBirth || r.dob || "",
    colour: r.colour || r.color || "",
    shed: r.locationShed || r.shed || "",
    
    // Death Details
    dateOfDeAdmission: dateIso,
    time: r.time || "",
    causeOfDeath: r.causeOfDeath || r.cause || r.cause_details || "",
    doctor: r.doctor || r.partyName || r.doctorName || "-", 
    
    // Certificate Specifics
    teeth: r.teethDetails || r.teeth || "-",
    age: r.teethAge || r.age || "-",
    pregnancy: r.pregnancy || r.pregnancyStatus || "No",
    marketValue: r.marketValue || "-",

    photoUrl: r.photoUrl || "", 
    remarks: r.remarks || "",
  };
}

export default function DeathRecords() {
  const [fromDate, setFromDate] = useState(defaultFromDate());
  const [toDate, setToDate] = useState(""); 
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch Data
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getDeathRecords(fromDate || "2024-01-01");
        
        // 🔥 FIX: Handle API Wrapper Object
        let rawData = [];
        if (res && res.data && Array.isArray(res.data)) {
            rawData = res.data;
        } else if (Array.isArray(res)) {
            rawData = res;
        }

        const normalized = rawData.map(normalizeRecord);
        if (alive) setRows(normalized);
      } catch (e) {
        if (alive) setError(e?.message || "Failed to load records");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [fromDate]);

  // Filter Logic
  const filteredRows = useMemo(() => {
    const from = toDateObj(fromDate);
    const to = toDateObj(toDate);
    return rows.filter((r) => {
        const d = toDateObj(r.dateOfDeAdmission);
        if (!d) return true; 
        if (from && d < from) return false;
        if (to) {
          const toInclusive = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
          if (d >= toInclusive) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const da = toDateObj(a.dateOfDeAdmission)?.getTime() || 0;
        const db = toDateObj(b.dateOfDeAdmission)?.getTime() || 0;
        return db - da;
      });
  }, [rows, fromDate, toDate]);

  // --- HTML CERTIFICATE GENERATOR ---
  function printCertificate(row) {
    const formattedDeathDate = formatDateDisplay(row.dateOfDeAdmission);
    const formattedDob = formatDateDisplay(row.dob);
    const PRINT_H1 = "MADHAVA SRUSTI RASHTROTTHANA GOSHALA";

    const html = `
      <html>
      <head>
        <title>Death Certificate - ${row.name}</title>
        <style>
          body { font-family: "Times New Roman", serif; padding: 20px; text-align: center; }
          .container { border: 3px solid #000; padding: 15px; max-width: 800px; margin: 0 auto; box-sizing: border-box; }
          .header h1 { font-size: 22px; font-weight: 800; margin: 0; text-decoration: underline; }
          .header h2 { font-size: 16px; font-weight: 700; margin: 5px 0; }
          .cert-title { border: 2px solid #000; padding: 6px; font-size: 18px; font-weight: 800; display: inline-block; width: 100%; margin-top: 10px; background: #eee; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; border: 2px solid #000; }
          td { border: 1px solid #000; padding: 8px 10px; text-align: left; width: 50%; font-size: 14px; vertical-align: middle; }
          .label { font-weight: 800; text-transform: uppercase; margin-right: 5px; }
          .value { font-weight: 500; text-transform: uppercase; }
          .certification-text { text-align: left; margin: 20px 0; font-size: 14px; line-height: 1.6; font-weight: 700; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; padding: 0 10px; align-items: flex-end; }
          .sign-box { text-align: center; margin-bottom: 10px; }
          .sign-line { width: 160px; border-bottom: 1px solid #000; margin-bottom: 5px; }
          .sign-label { font-weight: 700; font-size: 11px; text-transform: uppercase; }
          @media print { @page { size: A4; margin: 10mm; } body { padding: 0; } .container { height: 95vh; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${PRINT_H1}</h1>
            <h2>SS GHATI DODDABALLAPURA</h2>
            <div class="cert-title">DEATH CERTIFICATE</div>
          </div>
          
          <div style="width:100%; height:250px; border:2px solid #000; margin:15px 0; display:flex; align-items:center; justify-content:center; background:#fafafa; overflow:hidden;">
             ${row.photoUrl ? `<img src="${row.photoUrl}" style="height:100%; width:auto; object-fit:contain;" alt="Cattle Photo" />` : `<div style="color:#999; font-style:italic;">[ Photo Not Provided ]</div>`}
          </div>

          <table>
            <tr><td><span class="label">DATE:</span> <span class="value">${formattedDeathDate}</span></td><td><span class="label">TIME:</span> <span class="value">${row.time}</span></td></tr>
            <tr><td><span class="label">NAME:</span> <span class="value">${row.name}</span></td><td><span class="label">EAR TAG NO:</span> <span class="value">${row.cattleId}</span></td></tr>
            <tr><td><span class="label">BREED NAME:</span> <span class="value">${row.breed}</span></td><td><span class="label">GENDER:</span> <span class="value">${row.gender}</span></td></tr>
            <tr><td><span class="label">DATE OF BIRTH:</span> <span class="value">${formattedDob}</span></td><td><span class="label">COLOUR:</span> <span class="value">${row.colour}</span></td></tr>
            <tr><td><span class="label">TEETH DETAILS:</span> <span class="value">${row.teeth}</span></td><td><span class="label">TEETH AGE:</span> <span class="value">${row.age}</span></td></tr>
            <tr><td><span class="label">PREGNANCY STATUS:</span> <span class="value">${row.pregnancy}</span></td><td><span class="label">MARKET VALUE:</span> <span class="value">${row.marketValue}</span></td></tr>
            <tr><td colspan="2"><span class="label">REASON FOR DEATH:</span> <span class="value">${row.causeOfDeath}</span></td></tr>
          </table>

          <div class="certification-text">
            THIS IS TO CERTIFY THAT THIS DAY THE ................................................................ I HAVE EXAMINED................................................................
          </div>

          <div class="footer">
            <div class="sign-box"><div class="sign-line"></div><div class="sign-label">SUPERVISOR SIGNATURE</div></div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:30px;">
                <div class="sign-box">
                    <div style="font-size:12px; font-weight:bold; margin-bottom:5px;">${row.doctor !== "-" ? row.doctor : ""}</div>
                    <div class="sign-line"></div>
                    <div class="sign-label">DOCTOR SIGNATURE & SEAL</div>
                </div>
                <div class="sign-box"><div class="sign-line"></div><div class="sign-label">PROJECT MANAGER SIGNATURE</div></div>
            </div>
          </div>
        </div>
        <script>setTimeout(function() { window.print(); }, 500);</script>
      </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=900,height=1100");
    if(win) { 
        win.document.write(html); 
        win.document.close(); 
    } else { 
        alert("Popup blocked. Please allow popups for this site."); 
    }
  }

  // --- RENDER ---
  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "#1f2937" }}>Cattle Death Records</h1>
          <div style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "0.25rem" }}>Showing: {filteredRows.length} record(s)</div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div><label style={labelStyle}>From</label><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>To</label><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={inputStyle} /></div>
        </div>
      </header>

      {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem 1rem", borderRadius: "0.5rem", marginBottom: "1rem" }}>{error}</div>}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}> {/* 🔥 SCROLLABLE TABLE */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: "900px" }}>
            <thead style={{ background: "#f9fafb", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Tag No</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Breed</th>
                <th style={thStyle}>Cause</th>
                <th style={thStyle}>Doctor</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading...</td></tr> :
               filteredRows.length === 0 ? <tr><td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>No records found.</td></tr> :
               filteredRows.map((row, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                  <td style={tdStyle}>{formatDateDisplay(row.dateOfDeAdmission)}</td>
                  
                  <td style={tdStyle}><strong>{row.cattleId}</strong></td>
                  <td style={tdStyle}>{row.name}</td>
                  <td style={tdStyle}>{row.breed}</td>
                  <td style={tdStyle}>{row.causeOfDeath ? row.causeOfDeath.split("-")[0] : "-"}</td>
                  <td style={tdStyle}>{row.doctor}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                      <button onClick={() => setSelected(row)} style={viewBtnStyle}>👁️ View</button>
                      <button onClick={() => printCertificate(row)} style={certBtnStyle}>📜 Cert</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View */}
      {selected && (
        <div style={overlayStyle} onClick={() => setSelected(null)}>
          <div style={viewModalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom:"1px solid #eee", paddingBottom:"10px" }}>
              <div>
                  <div style={{ fontWeight: "bold", fontSize: "1.3rem" }}>{selected.cattleId} | {selected.name}</div>
                  <div style={{ color:"#666", fontSize:"0.9rem"}}>{selected.breed} • {selected.gender}</div>
              </div>
              <button onClick={() => setSelected(null)} style={closeBtnStyle}>✕</button>
            </div>
            
            {/* 🔥 RESPONSIVE MODAL GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignContent: "start" }}>
                   <DetailItem label="Date of Death" value={formatDateDisplay(selected.dateOfDeAdmission)} />
                   
                   <DetailItem label="Time of Death" value={selected.time} />
                   <DetailItem label="Cause" value={selected.causeOfDeath} fullWidth />
                   <DetailItem label="Certified By" value={selected.doctor} fullWidth />
                   <DetailItem label="Shed" value={selected.shed} />
                   <DetailItem label="Date of Birth" value={formatDateDisplay(selected.dob)} />
                   
                   <div style={{ gridColumn: "1 / -1", borderTop:"1px solid #eee", paddingTop:"10px", marginTop:"5px", fontWeight:"bold", color:"#444" }}>Certificate Details</div>
                   <DetailItem label="Teeth" value={selected.teeth} />
                   <DetailItem label="Age" value={selected.age} />
                   <DetailItem label="Pregnancy" value={selected.pregnancy} />
                   <DetailItem label="Value" value={selected.marketValue} />
               </div>

               <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                   <div style={{ border: "1px solid #ddd", borderRadius: "8px", height: "250px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", overflow: "hidden" }}>
                       {selected.photoUrl ? 
                         <img src={selected.photoUrl} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> :
                         <span style={{ color: "#9ca3af", fontStyle: "italic" }}>No Photo Available</span>
                       }
                   </div>
                   {selected.remarks && (
                     <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", padding: "10px", borderRadius: "6px", fontSize:"0.9rem" }}>
                        <div style={{fontWeight:"bold", color:"#92400e", marginBottom:"4px"}}>Remarks</div>
                        <div style={{color:"#78350f"}}>{selected.remarks}</div>
                     </div>
                   )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const labelStyle = { display: "block", fontSize: "0.75rem", color: "#4b5563", fontWeight: "500", marginBottom: "0.2rem" };
const inputStyle = { padding: "0.4rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" };
const thStyle = { padding: "0.75rem 1rem", borderBottom: "1px solid #e5e7eb", fontWeight: 600, color: "#6b7280" };
const tdStyle = { padding: "0.75rem 1rem", color: "#1f2937" };
const viewBtnStyle = { border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.3rem 0.7rem", background: "#fff", cursor: "pointer" };
const certBtnStyle = { border: "1px solid #fecaca", borderRadius: "6px", padding: "0.3rem 0.7rem", background: "#fef2f2", color: "#991b1b", fontWeight: "600", cursor: "pointer" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" };
const viewModalStyle = { width: "700px", maxWidth: "100%", background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" };
const closeBtnStyle = { border: "none", background: "#eee", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize:"1.1rem" };
function DetailItem({ label, value, fullWidth }) { return <div style={{ gridColumn: fullWidth ? "span 2" : "span 1" }}><div style={{fontSize:"0.75rem", color:"#999", textTransform:"uppercase"}}>{label}</div><div style={{fontWeight:"500"}}>{value || "-"}</div></div>; }