// src/pages/MasterCattle.jsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchCattle, updateCattle } from "../api/masterApi"; // Added updateCattle
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Configuration
const ITEMS_PER_PAGE = 20;
const STATUS_OPTIONS = ["All", "Active", "Deactive"];

export default function MasterCattle() {
  const { user } = useAuth(); // Get User Role
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("Active"); // Default to Active
  const [searchText, setSearchText] = useState("");
  
  // Selection (Modal)
  const [selected, setSelected] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
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
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Logic
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

  // Pagination Logic
  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const displayedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, searchText]);

  const handleNext = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrev = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  // Permission Check
  const isAdmin = user?.role === "Admin" || user?.role === "Super Admin";

  if (loading) return <div style={{ padding: "2rem" }}>Loading Master Data...</div>;
  if (error) return <div style={{ padding: "2rem", color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* --- HEADER --- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "#1f2937" }}>Master Cattle Data</h1>
          <div style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "4px" }}>
            Total Records: <strong>{filteredRows.length}</strong>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
           {isAdmin && (
             <Link to="/cattle/register" style={primaryBtnStyle}>+ Add New</Link>
           )}

           <div>
             <label style={labelStyle}>Status</label>
             <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
               {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>

           <div>
             <label style={labelStyle}>Search</label>
             <input 
               type="text" 
               placeholder="Tag / Name / Breed..." 
               value={searchText} 
               onChange={e => setSearchText(e.target.value)} 
               style={{ ...inputStyle, width: "220px" }}
             />
           </div>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
            <tr>
              <th style={thStyle}>Tag No</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Breed</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>No cattle found matching your filters.</td></tr>
            ) : (
              displayedRows.map((row, idx) => (
                <tr key={row.id || idx} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={tdStyle}><strong>{row.tag}</strong></td>
                  <td style={tdStyle}>{row.name}</td>
                  <td style={tdStyle}>{row.breed || "-"}</td>
                  <td style={tdStyle}>{row.gender || "-"}</td>
                  <td style={tdStyle}><StatusPill status={row.status} /></td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button onClick={() => setSelected(row)} style={viewBtnStyle}>
                      👁️ View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        {filteredRows.length > 0 && (
          <div style={paginationStyle}>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Showing <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredRows.length)}</strong> of <strong>{filteredRows.length}</strong>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={handlePrev} disabled={currentPage === 1} style={pageBtnStyle}>Previous</button>
              <span style={pageNumberStyle}>Page {currentPage} of {totalPages}</span>
              <button onClick={handleNext} disabled={currentPage === totalPages} style={pageBtnStyle}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* --- DETAILS & EDIT MODAL --- */}
      {selected && (
        <div style={modalOverlayStyle} onClick={() => setSelected(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
             <CattleDetailsPanel 
                selected={selected} 
                onClose={() => setSelected(null)} 
                canEdit={isAdmin} // Pass Permission
                refreshData={loadData} // Allow modal to refresh table
             />
          </div>
        </div>
      )}

    </div>
  );
}

/* ------------ DETAILS / EDIT PANEL ------------ */

function CattleDetailsPanel({ selected, onClose, canEdit, refreshData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize form data when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setFormData({ ...selected });
    }
  }, [isEditing, selected]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        id: formData.internalId, // CRITICAL: Use Internal ID for updates
        ...formData
      };
      
      const res = await updateCattle(payload);
      if (res && res.success) {
        alert("Cattle updated successfully!");
        setIsEditing(false);
        refreshData(); // Refresh the main table
        onClose(); // Close modal
      } else {
        alert("Update failed: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error saving data");
    } finally {
      setSaving(false);
    }
  };

  const isActive = String(selected.status || "").toLowerCase().trim() === "active";
  const ageText = formatAge(selected.dob);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem", flexShrink: 0 }}>
        <div>
           {isEditing ? (
             <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#ea580c" }}>Editing: {selected.tag}</div>
           ) : (
             <>
               <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827" }}>{selected.tag} – {selected.name}</div>
               <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>UID: {selected.govtUid || "N/A"} | Internal ID: {selected.internalId}</div>
             </>
           )}
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Edit/Save Buttons */}
          {canEdit && !isEditing && (
            <button onClick={() => setIsEditing(true)} style={editBtnStyle}>✎ Edit</button>
          )}
          {isEditing && (
            <>
              <button onClick={() => setIsEditing(false)} style={cancelBtnStyle} disabled={saving}>Cancel</button>
              <button onClick={handleSave} style={saveBtnStyle} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
          <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={scrollableAreaStyle}>
        
        {/* Photo Banner */}
        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", background: "#f9fafb", padding: "1rem", borderRadius: "8px", marginTop: "1rem" }}>
           <div style={photoContainerStyle}>
             {selected.photo ? <img src={selected.photo} alt="Cattle" style={photoStyle} /> : <span style={{fontSize:"0.7rem", color:"#999"}}>No Photo</span>}
           </div>
           <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.5rem" }}>
              {isEditing ? (
                 <>
                   <EditInput label="Status" name="status" value={formData.status} onChange={handleChange} type="select" options={["Active", "Sold", "Dead"]} />
                   <EditInput label="Location (Shed)" name="shed" value={formData.shed} onChange={handleChange} />
                   <EditInput label="Photo URL" name="photo" value={formData.photo} onChange={handleChange} placeholder="Paste Drive Link..." />
                 </>
              ) : (
                 <>
                   <DetailItem label="Status" value={<StatusPill status={selected.status} />} />
                   <DetailItem label="Location" value={selected.shed} />
                   <DetailItem label="Category" value={selected.category} />
                 </>
              )}
           </div>
        </div>

        <SectionTitle>Basic Information</SectionTitle>
        <div style={gridStyle}>
          {isEditing ? (
            <>
              <EditInput label="Name" name="name" value={formData.name} onChange={handleChange} />
              <EditInput label="Tag No" name="tag" value={formData.tag} onChange={handleChange} />
              <EditInput label="Breed" name="breed" value={formData.breed} onChange={handleChange} />
              <EditInput label="Gender" name="gender" value={formData.gender} onChange={handleChange} type="select" options={["Female", "Male"]} />
              <EditInput label="Color" name="color" value={formData.color} onChange={handleChange} />
              <EditInput label="Category" name="category" value={formData.category} onChange={handleChange} />
              <EditInput label="DOB (YYYY-MM-DD)" name="dob" value={formData.dob} onChange={handleChange} type="date" />
              <EditInput label="Adoption Status" name="adoptionStatus" value={formData.adoptionStatus} onChange={handleChange} />
            </>
          ) : (
            <>
              <DetailItem label="Breed" value={selected.breed} />
              <DetailItem label="Gender" value={selected.gender} />
              <DetailItem label="Color" value={selected.color} />
              <DetailItem label="Category" value={selected.category} />
              <DetailItem label="DOB" value={formatDate(selected.dob)} />
              {isActive && <DetailItem label="Current Age" value={ageText} />}
              <DetailItem label="Prev Tag" value={selected.prevTag} />
              <DetailItem label="Adoption Status" value={selected.adoptionStatus} />
            </>
          )}
        </div>

        <SectionTitle>Origins & Source</SectionTitle>
        <div style={gridStyle}>
          {isEditing ? (
             <>
                <EditInput label="Source Name" name="sourceName" value={formData.sourceName} onChange={handleChange} />
                <EditInput label="Purchase Price" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} />
             </>
          ) : (
             <>
                <DetailItem label="Admission Date" value={formatDate(selected.admissionDate)} />
                <DetailItem label="Admission Type" value={selected.admissionType} />
                <DetailItem label="Age at Admission" value={selected.admissionAge} />
                <DetailItem label="Source Name" value={selected.sourceName} />
                <DetailItem label="Purchase Price" value={selected.purchasePrice} />
             </>
          )}
        </div>

        <SectionTitle>Health & Other</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
           {isEditing ? (
              <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
                 <label style={labelStyle}>Remarks</label>
                 <textarea 
                    name="remarks" 
                    value={formData.remarks} 
                    onChange={handleChange} 
                    style={{...inputStyle, minHeight: "80px"}} 
                 />
              </div>
           ) : (
              <>
                <DetailItem label="Is Disabled?" value={selected.isDisabled ? "Yes" : "No"} />
                <div style={{ marginTop: "5px" }}>
                  <div style={labelItemStyle}>Remarks</div>
                  <div style={{ background: "#f3f4f6", padding: "10px", borderRadius: "6px", fontSize: "0.85rem", color: "#374151", fontStyle: "italic" }}>
                    "{selected.remarks || "No remarks."}"
                  </div>
                </div>
              </>
           )}
        </div>

      </div>
    </div>
  );
}

/* ------------ HELPER COMPONENTS ------------ */

const EditInput = ({ label, name, value, onChange, type = "text", options = [], placeholder = "" }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {type === "select" ? (
      <select name={name} value={value || ""} onChange={onChange} style={{...inputStyle, width: "100%"}}>
        <option value="">- Select -</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <input 
        type={type} 
        name={name} 
        value={value || ""} 
        onChange={onChange} 
        placeholder={placeholder}
        style={{...inputStyle, width: "100%", boxSizing: "border-box"}} 
      />
    )}
  </div>
);

// ... (KEEP ALL OTHER STYLES & HELPERS EXACTLY THE SAME AS BEFORE)
// Re-listing core styles needed for the new buttons

const editBtnStyle = { background: "#f59e0b", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem" };
const saveBtnStyle = { background: "#16a34a", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem" };
const cancelBtnStyle = { background: "#fff", color: "#666", border: "1px solid #ccc", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem" };

// ... (Paste the rest of the styles from previous turn: cardStyle, paginationStyle, etc.)
// For brevity, assuming you have the styles block. If not, let me know.
const cardStyle = { background: "#ffffff", borderRadius: "10px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", overflow: "hidden", border: "1px solid #e5e7eb" };
const paginationStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderTop: "1px solid #e2e8f0", background: "#f8fafc" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, backdropFilter: "blur(4px)" };
const modalContentStyle = { backgroundColor: "#fff", borderRadius: "12px", width: "650px", maxWidth: "90vw", maxHeight: "85vh", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", display: "flex", flexDirection: "column", position: "relative" };
const scrollableAreaStyle = { overflowY: "auto", paddingRight: "0.5rem", flex: 1, marginTop: "0.5rem" };
const inputStyle = { padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", outline: "none" };
const labelStyle = { display: "block", fontSize: "0.75rem", marginBottom: "0.25rem", color: "#6b7280", fontWeight: "600" };
const sectionTitleStyle = { fontSize: "0.85rem", fontWeight: "bold", color: "#0369a1", borderBottom: "2px solid #e0f2fe", paddingBottom: "6px", marginBottom: "12px", marginTop: "20px", textTransform: "uppercase", letterSpacing: "0.05em" };
const thStyle = { padding: "1rem", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", color: "#64748b", letterSpacing: "0.05em" };
const tdStyle = { padding: "0.75rem 1rem", color: "#1e293b" };
const primaryBtnStyle = { background: "#2563eb", color: "#fff", padding: "8px 16px", borderRadius: "6px", textDecoration: "none", fontSize: "0.9rem", fontWeight: "600", border: "none", cursor: "pointer", transition: "background 0.2s" };
const viewBtnStyle = { border: "1px solid #bfdbfe", borderRadius: "6px", padding: "6px 12px", background: "#eff6ff", color: "#1d4ed8", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer" };
const pageBtnStyle = { padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontSize: "0.85rem", color: "#334155" };
const closeBtnStyle = { background: "none", border: "none", fontSize: "2rem", cursor: "pointer", color: "#9ca3af", lineHeight: "1", padding: "0 0.5rem" };
const pageNumberStyle = { padding: "6px 10px", fontSize: "0.9rem", fontWeight: "600", color: "#334155" };
const SectionTitle = ({ children }) => <div style={sectionTitleStyle}>{children}</div>;
const DetailItem = ({ label, value, style }) => { if (value === undefined || value === null || value === "") return null; return <div style={style}><div style={labelItemStyle}>{label}</div><div style={{ color: "#111827", fontSize: "0.95rem", fontWeight: "500" }}>{value}</div></div>; };
const labelItemStyle = { fontSize: "0.7rem", textTransform: "uppercase", color: "#94a3b8", marginBottom: "2px", fontWeight: "600" };
const photoContainerStyle = { width: "100px", height: "100px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "4px solid #fff", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" };
const photoStyle = { width: "100%", height: "100%", objectFit: "cover" };
const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", marginBottom: "1rem" };
function StatusPill({ status }) { const normalized = (status || "").toLowerCase(); let bg = "#f1f5f9", fg = "#64748b"; if (normalized === "active") { bg = "#dcfce7"; fg = "#166534"; } else if (normalized.includes("dead")) { bg = "#fee2e2"; fg = "#991b1b"; } else if (normalized.includes("sold")) { bg = "#fef9c3"; fg = "#854d0e"; } return <span style={{ display: "inline-flex", borderRadius: "99px", padding: "4px 10px", background: bg, color: fg, fontSize: "0.75rem", fontWeight: "700" }}>{status}</span>; }
function formatDate(value) { if (!value || value === "-") return "-"; const d = new Date(value); if (isNaN(d.getTime())) return value; return d.toLocaleDateString('en-GB'); }
function formatAge(dobString) { if (!dobString) return "Unknown"; const dob = new Date(dobString); if (isNaN(dob.getTime())) return "-"; const diffMs = Date.now() - dob.getTime(); const ageDate = new Date(diffMs); const years = Math.abs(ageDate.getUTCFullYear() - 1970); const months = ageDate.getUTCMonth(); if (years > 0) return `${years} yr ${months} mo`; return `${months} months`; }