// src/pages/MasterCattle.jsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchCattle } from "../api/masterApi";
import { Link } from "react-router-dom";

const STATUS_OPTIONS = ["All", "Active", "Deactive"];

export default function MasterCattle() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        console.log("Fetching Cattle Data...");
        const res = await fetchCattle(); 
        
        if (Array.isArray(res)) {
           setRows(res);
        } else if (res && res.success && Array.isArray(res.data)) {
           setRows(res.data);
        } else {
           setRows([]);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    
    return rows.filter((row) => {
      const status = String(row.status || "").toLowerCase().trim();
      const matchStatus = statusFilter === "All" || status === statusFilter.toLowerCase();

      const haystack = (
        `${row.tag || ""} ` +
        `${row.name || ""} ` +
        `${row.breed || ""} ` +
        `${row.status || ""} ` +
        `${row.shed || ""} `
      ).toString().toLowerCase();

      return matchStatus && haystack.includes(searchText.toLowerCase());
    });
  }, [rows, statusFilter, searchText]);

  if (loading) return <div style={{ padding: "2rem" }}>Loading Master Data...</div>;
  if (error) return <div style={{ padding: "2rem", color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "1.5rem 2rem", height: "100%", display: "flex", gap: "1.5rem" }}>
      
      {/* LEFT: List View */}
      <div style={{ flex: 2, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>Master Cattle Data</h1>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
            <Link to="/cattle/register" style={primaryBtnStyle}>+ Add New</Link>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Search</label>
              <input type="text" placeholder="Tag / Name / Breed..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ ...selectStyle, minWidth: "200px" }} />
            </div>
          </div>
        </header>

        <div style={cardStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead style={{ background: "#f1f5f9", textAlign: "left" }}>
              <tr>
                <th style={thStyle}>Tag No</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Breed</th>
                <th style={thStyle}>Gender</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No records found.</td></tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={row.id || idx} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                    <td style={tdStyle}><strong>{row.tag}</strong></td>
                    <td style={tdStyle}>{row.name}</td>
                    <td style={tdStyle}>{row.breed || "-"}</td>
                    <td style={tdStyle}>{row.gender || "-"}</td>
                    <td style={tdStyle}><StatusPill status={row.status} /></td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <button type="button" onClick={() => setSelected(row)} style={viewBtnStyle}>👁️ View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT: Detail Panel */}
      <div style={{ flex: 1, minWidth: "350px", maxWidth: "450px" }}>
        {selected ? (
          <CattleDetailsPanel selected={selected} onClose={() => setSelected(null)} />
        ) : (
          <div style={emptyPanelStyle}>Select a cattle to view details.</div>
        )}
      </div>
    </div>
  );
}

/* ------------ DETAILS PANEL ------------ */

function CattleDetailsPanel({ selected, onClose }) {
  const isActive = String(selected.status || "").toLowerCase().trim() === "active";
  
  // Calculate Age using the Smart Logic (DOB > Admission Fallback)
  const ageText = calculateSmartAge(selected.dob, selected.admissionDate, selected.admissionAge);

  return (
    <div style={detailCardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
        <div>
           <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{selected.tag} - {selected.name}</div>
           <div style={{ fontSize: "0.8rem", color: "#666" }}>UID: {selected.govtUid || "-"} | INT-ID: {selected.internalId}</div>
        </div>
        <button onClick={onClose} style={{ border: "none", background: "none", fontSize: "1.2rem", cursor: "pointer" }}>&times;</button>
      </div>

      <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 200px)", paddingRight: "5px" }}>
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "center" }}>
          <div style={photoContainerStyle}>
             {selected.photo ? (
               <img src={selected.photo} alt={selected.name} style={photoStyle} />
             ) : (
               <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>No Photo</span>
             )}
          </div>
        </div>

        <SectionTitle>Basic Information</SectionTitle>
        <div style={gridStyle}>
          <DetailItem label="Status" value={<StatusPill status={selected.status} />} />
          <DetailItem label="Shed" value={selected.shed} />
          <DetailItem label="Breed" value={selected.breed} />
          <DetailItem label="Gender" value={selected.gender} />
          <DetailItem label="Color" value={selected.color} />
          <DetailItem label="Category" value={selected.category} />
          <DetailItem label="DOB" value={formatDate(selected.dob)} />
          {isActive && <DetailItem label="Current Age" value={ageText} />}
          <DetailItem label="Prev Tag" value={selected.prevTag} />
          <DetailItem label="Adoption Status" value={selected.adoptionStatus} />
        </div>

        <SectionTitle>Origins & Source</SectionTitle>
        <div style={gridStyle}>
          <DetailItem label="Admission Date" value={formatDate(selected.admissionDate)} />
          <DetailItem label="Admission Type" value={selected.admissionType} />
          <DetailItem label="Age at Admission" value={selected.admissionAge ? `${selected.admissionAge} months` : ""} />
          <DetailItem label="Admission Weight" value={selected.admissionWeight} />
          <DetailItem label="Source Name" value={selected.sourceName} />
          <DetailItem label="Source Mobile" value={selected.sourceMobile} />
          <DetailItem label="Source Address" value={selected.sourceAddress} style={{ gridColumn: "span 2" }} />
          <DetailItem label="Purchase Price" value={selected.purchasePrice} />
        </div>

        <SectionTitle>Parentage (Mother & Father)</SectionTitle>
        <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px" }}>
           <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#64748b", marginBottom: "8px" }}>MOTHER (DAM)</div>
           <div style={gridStyle}>
              <DetailItem label="Dam ID" value={selected.damId || "-"} />
              <DetailItem label="Dam Breed" value={selected.damBreed || "-"} />
           </div>
           
           <div style={{ borderTop: "1px dashed #cbd5e1", margin: "8px 0" }}></div>

           <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#64748b", marginBottom: "8px" }}>FATHER (SIRE)</div>
           <div style={gridStyle}>
              <DetailItem label="Sire ID" value={selected.sireId || "-"} />
              <DetailItem label="Sire Breed" value={selected.sireBreed || "-"} />
           </div>
           
           <div style={{ borderTop: "1px dashed #cbd5e1", margin: "8px 0" }}></div>
           <DetailItem label="Birth Weight" value={selected.birthWeight} />
        </div>

        <SectionTitle>Health & Other</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
           <DetailItem label="Is Disabled?" value={selected.isDisabled ? "Yes" : "No"} />
           <DetailItem label="Disability Details" value={selected.disability || "None"} />
           <div style={{ marginTop: "5px" }}>
             <div style={labelItemStyle}>Remarks</div>
             <div style={{ background: "#f9fafb", padding: "8px", borderRadius: "4px", fontSize: "0.85rem", color: "#333" }}>
               {selected.remarks || "No remarks recorded."}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

/* ------------ LOGIC HELPERS ------------ */

// 🔥 SMART AGE CALCULATOR
function calculateSmartAge(dobString, admissionDateString, admissionAgeMonths) {
  // Strategy 1: Calculate from DOB
  if (dobString && dobString !== "" && dobString !== "-") {
    const dob = new Date(dobString);
    if (!isNaN(dob.getTime())) {
      return getAgeFromDates(dob, new Date());
    }
  }

  // Strategy 2: Calculate from Admission Date + Admission Age
  if (admissionDateString && admissionAgeMonths) {
    const adminDate = new Date(admissionDateString);
    const initialMonths = Number(admissionAgeMonths);
    
    if (!isNaN(adminDate.getTime()) && !isNaN(initialMonths)) {
      // Calculate months passed since admission
      const today = new Date();
      const monthsPassed = (today.getFullYear() - adminDate.getFullYear()) * 12 + (today.getMonth() - adminDate.getMonth());
      
      const totalMonths = initialMonths + monthsPassed;
      
      if (totalMonths > 0) {
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        return `${years} yr ${months} mo (Calculated)`;
      }
    }
  }

  return "Unknown";
}

function getAgeFromDates(startDate, endDate) {
  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();
  
  // Adjust if months are negative (e.g. Feb vs Jan)
  let finalYears = years;
  let finalMonths = months;
  if (months < 0) {
    finalYears--;
    finalMonths = 12 + months;
  }
  return `${finalYears} yr ${finalMonths} mo`;
}

function formatDate(value) {
  if (!value || value === "-") return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB'); 
}

/* ------------ STYLES (Kept Compact) ------------ */
const SectionTitle = ({ children }) => (
  <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#d97706", borderBottom: "1px solid #fed7aa", paddingBottom: "4px", marginBottom: "8px", marginTop: "16px", textTransform: "uppercase" }}>{children}</div>
);
const DetailItem = ({ label, value, style }) => {
  if (value === undefined || value === null || value === "") return null;
  return <div style={style}><div style={labelItemStyle}>{label}</div><div style={{ color: "#111827", fontSize: "0.9rem", fontWeight: "500" }}>{value}</div></div>;
};
const StatusPill = ({ status }) => {
  const normalized = (status || "").toLowerCase();
  let bg = "#e5e7eb", fg = "#374151";
  if (normalized === "active") { bg = "#dcfce7"; fg = "#166534"; }
  else if (normalized.includes("dead")) { bg = "#fee2e2"; fg = "#991b1b"; }
  else if (normalized.includes("sold")) { bg = "#fef9c3"; fg = "#854d0e"; }
  return <span style={{ display: "inline-flex", borderRadius: "12px", padding: "2px 8px", background: bg, color: fg, fontSize: "0.75rem", fontWeight: "bold" }}>{status}</span>;
};

const labelStyle = { display: "block", fontSize: "0.75rem", marginBottom: "0.15rem", color: "#6b7280" };
const selectStyle = { padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem" };
const thStyle = { padding: "0.6rem 1rem", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", color: "#475569" };
const tdStyle = { padding: "0.55rem 1rem", borderBottom: "1px solid #e5e7eb", color: "#111827" };
const viewBtnStyle = { border: "none", borderRadius: "999px", padding: "0.25rem 0.7rem", background: "#e0e7ff", color: "#1d4ed8", fontSize: "0.8rem", cursor: "pointer" };
const primaryBtnStyle = { background: "#2563eb", color: "#fff", padding: "6px 12px", borderRadius: "6px", textDecoration: "none", fontSize: "0.85rem", fontWeight: "600", marginBottom: "2px" };
const cardStyle = { background: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", overflow: "hidden" };
const emptyPanelStyle = { height: "100%", borderRadius: "0.75rem", border: "2px dashed #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", color: "#9ca3af", background: "#f9fafb" };
const detailCardStyle = { background: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", padding: "1.5rem", height: "100%", boxSizing: "border-box" };
const photoContainerStyle = { width: "120px", height: "120px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "4px solid #fff", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" };
const photoStyle = { width: "100%", height: "100%", objectFit: "cover" };
const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 15px", marginBottom: "1rem" };
const labelItemStyle = { fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", marginBottom: "2px" };