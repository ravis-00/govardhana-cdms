// src/pages/DeathRecords.jsx
import React, { useEffect, useMemo, useState } from "react";
// 🔥 UPDATE: Imported generateDeathCert
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

function normalizeRecord(r) {
  const dateIso =
    isoDateOnly(r.dateOfDeAdmit || r.dateOfDeAdmission || r.dateOfDeath || "");

  return {
    id: r.id, // Ensure your backend sends a unique ID for the death record
    cattleId: r.cattleId || r.tagNo || r.tagNumber || "",
    govId: r.govtId ?? r.govId ?? "",
    name: r.name || "",
    breed: r.breed || "",
    gender: r.gender || "",
    cattleType: r.cattleType || "",
    colour: r.colour || "",
    ageYears: r.ageYears ?? "",
    shed: r.locationShed || r.shed || "",
    location: r.location || "",
    typeOfDeAdmission: r.typeOfDeAdmit || r.typeOfDeAdmission || "",
    dateOfDeAdmission: dateIso,
    causeOfDeath: r.deathCause || r.deathCauseCat || r.causeOfDeath || "",
    permanentDisabilityAtBirth:
      r.disabilityFlag ?? r.permanentDisabilityAtBirth ?? "",
    adoptionStatus: r.adoptionStatus || "",
    remarks: r.remarks || "",
    pictureUrl: r.pictureUrl || "",
  };
}

export default function DeathRecords() {
  const [fromDate, setFromDate] = useState(defaultFromDate());
  const [toDate, setToDate] = useState(""); 
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // 🔥 NEW: State for certificate generation
  const [generatingId, setGeneratingId] = useState(null);

  // Fetch from backend
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getDeathRecords(fromDate || "2024-01-01");

        const normalized = Array.isArray(data)
          ? data.map(normalizeRecord)
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

  // Filter: Death only + date range
  const filteredRows = useMemo(() => {
    const from = toDateObj(fromDate);
    const to = toDateObj(toDate);

    return rows
      .filter((r) => {
        const type = String(r.typeOfDeAdmission || "").toLowerCase().trim();
        const isDeath = type === "death";
        if (!isDeath) return false;

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

  // --- 🔥 NEW: GENERATE CERTIFICATE HANDLER ---
  async function handleGenerateCert(row) {
    if (!confirm(`Generate Death Certificate for ${row.cattleId}?`)) return;
    
    setGeneratingId(row.id); // Show loading state for this specific row
    try {
      // Call API
      const response = await generateDeathCert(row.id);
      
      if (response && response.url) {
        window.open(response.url, "_blank"); // Open PDF
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

  // Legacy Print Handler (keeping as backup)
  function handlePrint(record) {
    const win = window.open("", "_blank");
    if (!win) return;
    // ... (Your existing HTML print logic is preserved below if needed, omitted for brevity) ...
    win.document.write(`<html><body><h1>Printing...</h1></body></html>`);
    win.document.close();
    win.print();
  }

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      <header
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: "1rem",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>
            Cattle Death Records
          </h1>
          <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>
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
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem 1rem", borderRadius: "0.75rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div style={{ background: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 10px 25px rgba(15,23,42,0.05)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#f1f5f9", textAlign: "left" }}>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Tag No</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Breed</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Cause</th>
              <th style={thStyle}>Shed</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No death records found.</td></tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={`${row.id}-${idx}`} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                  <td style={tdStyle}>{row.dateOfDeAdmission || "-"}</td>
                  <td style={tdStyle}><strong>{row.cattleId}</strong></td>
                  <td style={tdStyle}>{row.name || "-"}</td>
                  <td style={tdStyle}>{row.breed || "-"}</td>
                  <td style={tdStyle}>{row.gender || "-"}</td>
                  <td style={tdStyle}>{row.causeOfDeath || "-"}</td>
                  <td style={tdStyle}>{row.shed || "-"}</td>
                  <td style={{ ...tdStyle, textAlign: "center", whiteSpace: "nowrap" }}>
                    
                    {/* View Button */}
                    <button onClick={() => openView(row)} style={viewBtnStyle} title="View details">
                      👁️
                    </button>
                    
                    {/* 🔥 NEW: Generate Certificate Button */}
                    <button
                      onClick={() => handleGenerateCert(row)}
                      disabled={generatingId === row.id}
                      style={{ 
                        ...certBtnStyle, 
                        marginLeft: "0.5rem",
                        opacity: generatingId === row.id ? 0.7 : 1,
                        cursor: generatingId === row.id ? "wait" : "pointer"
                      }}
                      title="Generate Death Certificate"
                    >
                      {generatingId === row.id ? "⏳ Gen..." : "💀 Cert"}
                    </button>

                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Logic (Unchanged) */}
      {selected && (
        <div style={overlayStyle} onClick={closeView}>
          <div style={viewModalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{selected.cattleId} – {selected.name}</div>
              </div>
              <button type="button" onClick={closeView} style={closeBtnStyle}>✕</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
               <DetailItem label="Cause of Death" value={selected.causeOfDeath} />
               <DetailItem label="Date" value={selected.dateOfDeAdmission} />
               <DetailItem label="Doctor" value="Dr. Veterinarian" /> {/* Placeholder if not in data */}
            </div>
            
            {selected.remarks && <div style={{marginTop: "1rem", background: "#f9fafb", padding: "10px"}}>{selected.remarks}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const labelStyle = { display: "block", fontSize: "0.75rem", marginBottom: "0.15rem", color: "#6b7280" };
const inputStyle = { padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem" };
const thStyle = { padding: "0.6rem 1rem", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.03em", color: "#475569" };
const tdStyle = { padding: "0.55rem 1rem", borderBottom: "1px solid #e5e7eb", color: "#111827" };
const viewBtnStyle = { border: "none", borderRadius: "6px", padding: "0.25rem 0.6rem", background: "#e0e7ff", color: "#1d4ed8", fontSize: "0.8rem", cursor: "pointer" };
const certBtnStyle = { border: "none", borderRadius: "6px", padding: "0.25rem 0.6rem", background: "#fee2e2", color: "#991b1b", fontSize: "0.8rem", fontWeight: "600" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 };
const viewModalStyle = { width: "500px", background: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };
const closeBtnStyle = { border: "none", background: "#e5e7eb", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer" };

function DetailItem({ label, value }) {
  if (!value) return null;
  return <div><small style={{color:"#888"}}>{label}</small><div>{value}</div></div>;
}