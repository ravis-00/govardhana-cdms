// src/pages/DeathRecords.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getDeathRecords, generateDeathCert } from "../api/masterApi.js";

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

export default function DeathRecords() {
  const [fromDate, setFromDate] = useState(defaultFromDate());
  const [toDate, setToDate] = useState(""); 
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [generatingId, setGeneratingId] = useState(null);

  // Fetch from backend
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getDeathRecords(fromDate || "2024-01-01");
        
        // Backend now returns sanitized data, so we can use it directly
        // But let's ensure dates are formatted correctly just in case
        const normalized = Array.isArray(data)
          ? data.map(r => ({
              ...r,
              dateOfDeAdmission: isoDateOnly(r.dateOfDeAdmission)
            }))
          : [];

        if (alive) setRows(normalized);
      } catch (e) {
        if (alive) setError(e?.message || "Failed to load death records");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [fromDate]);

  // Filter Logic (Frontend Date Filter)
  const filteredRows = useMemo(() => {
    const from = toDateObj(fromDate);
    const to = toDateObj(toDate);

    return rows
      .filter((r) => {
        // Backend already filters for "Death", but double check if needed
        // r.typeOfDeAdmission is usually "Death"
        
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

  function openView(row) {
    setSelected(row);
  }

  function closeView() {
    setSelected(null);
  }

  // --- GENERATE CERTIFICATE HANDLER ---
  async function handleGenerateCert(row) {
    if (!window.confirm(`Generate Death Certificate for ${row.cattleId}?`)) return;
    
    setGeneratingId(row.id); // row.id is the Exit Log ID (e.g. EXIT2025...)
    try {
      const response = await generateDeathCert(row.id);
      
      if (response && response.url) {
        window.open(response.url, "_blank"); 
      } else {
        alert("Certificate generated, but no URL returned.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate certificate: " + err.message);
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "#1f2937" }}>
            Cattle Death Records
          </h1>
          <div style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "0.25rem" }}>
            Showing: {filteredRows.length} record(s)
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={labelStyle}>From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>To (optional)</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </header>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem 1rem", borderRadius: "0.5rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div style={{ background: "#ffffff", borderRadius: "0.5rem", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)", overflow: "hidden", border: "1px solid #e5e7eb" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#f9fafb", textAlign: "left" }}>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Tag No</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Breed</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Cause</th>
              <th style={thStyle}>Doctor / Party</th> {/* Added Column */}
              <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading records...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No death records found for the selected range.</td></tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={`${row.id}-${idx}`} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                  <td style={tdStyle}>{row.dateOfDeAdmission || "-"}</td>
                  <td style={tdStyle}>
                    <div style={{fontWeight:"600", color:"#111827"}}>{row.cattleId}</div>
                    <div style={{fontSize:"0.75rem", color:"#9ca3af"}}>{row.id}</div>
                  </td>
                  <td style={tdStyle}>{row.name || "-"}</td>
                  <td style={tdStyle}>{row.breed || "-"}</td>
                  <td style={tdStyle}>{row.gender || "-"}</td>
                  <td style={tdStyle}>{row.causeOfDeath || "-"}</td>
                  <td style={tdStyle}>{row.doctor || "-"}</td> {/* Display Doctor Name */}
                  
                  <td style={{ ...tdStyle, textAlign: "center", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                        <button onClick={() => openView(row)} style={viewBtnStyle} title="View details">
                        👁 View
                        </button>
                        
                        <button
                        onClick={() => handleGenerateCert(row)}
                        disabled={generatingId === row.id}
                        style={{ 
                            ...certBtnStyle, 
                            opacity: generatingId === row.id ? 0.7 : 1,
                            cursor: generatingId === row.id ? "wait" : "pointer"
                        }}
                        title="Generate Death Certificate"
                        >
                        {generatingId === row.id ? "⏳ Gen..." : "📜 Cert"}
                        </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Logic */}
      {selected && (
        <div style={overlayStyle} onClick={closeView}>
          <div style={viewModalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.75rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#6b7280", fontWeight: "bold" }}>Death Record Detail</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1f2937" }}>{selected.cattleId} – {selected.name}</div>
              </div>
              <button type="button" onClick={closeView} style={closeBtnStyle}>✕</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", fontSize: "0.9rem" }}>
               <DetailItem label="Date of Death" value={selected.dateOfDeAdmission} />
               <DetailItem label="Cause" value={selected.causeOfDeath} />
               <DetailItem label="Doctor / Certified By" value={selected.doctor} />
               <DetailItem label="Shed / Location" value={selected.shed} />
               <DetailItem label="Breed" value={selected.breed} />
               <DetailItem label="Gender" value={selected.gender} />
            </div>
            
            {selected.remarks && (
                <div style={{marginTop: "1.5rem", background: "#f9fafb", padding: "12px", borderRadius: "6px", border: "1px solid #e5e7eb"}}>
                    <div style={{fontSize: "0.75rem", color: "#6b7280", fontWeight: "bold", marginBottom: "4px"}}>REMARKS</div>
                    <div style={{color: "#374151"}}>{selected.remarks}</div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const labelStyle = { display: "block", fontSize: "0.75rem", marginBottom: "0.25rem", color: "#4b5563", fontWeight: "500" };
const inputStyle = { padding: "0.4rem 0.6rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", fontSize: "0.875rem", color: "#1f2937" };
const thStyle = { padding: "0.75rem 1rem", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" };
const tdStyle = { padding: "0.75rem 1rem", color: "#1f2937", verticalAlign: "middle" };
const viewBtnStyle = { border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.3rem 0.7rem", background: "#ffffff", color: "#374151", fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" };
const certBtnStyle = { border: "1px solid #fecaca", borderRadius: "6px", padding: "0.3rem 0.7rem", background: "#fef2f2", color: "#991b1b", fontSize: "0.8rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 };
const viewModalStyle = { width: "100%", maxWidth: "550px", background: "white", borderRadius: "0.75rem", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" };
const closeBtnStyle = { border: "none", background: "#f3f4f6", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", color: "#6b7280" };

function DetailItem({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.025em", color: "#9ca3af", marginBottom: "0.15rem" }}>{label}</div>
      <div style={{ color: "#111827", fontWeight: "500" }}>{value}</div>
    </div>
  );
}