// src/pages/MasterCattle.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { fetchCattle, updateCattle } from "../api/masterApi"; 
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// --- CLOUDINARY CONFIG ---
const CLOUD_NAME = "dvcwgkszp";       
const UPLOAD_PRESET = "cattle_upload"; // Reusing the preset you created!

// Configuration
const ITEMS_PER_PAGE = 20;
const STATUS_OPTIONS = ["All", "Active", "Deactive"];

export default function MasterCattle() {
  const { user } = useAuth(); 
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active"); 
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchCattle();
      if (Array.isArray(res)) setRows(res);
      else if (res && res.data) setRows(res.data);
      else setRows([]);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return rows.filter((row) => {
      const status = String(row.status || "").toLowerCase().trim();
      const matchStatus = statusFilter === "All" || status === statusFilter.toLowerCase();
      const haystack = (`${row.tag||""} ${row.name||""} ${row.breed||""} ${row.shed||""} ${row.internalId||""}`).toLowerCase();
      return matchStatus && haystack.includes(searchText.toLowerCase());
    });
  }, [rows, statusFilter, searchText]);

  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const displayedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, searchText]);
  const handleNext = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrev = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };
  const isAdmin = user?.role === "Admin" || user?.role === "Super Admin";

  if (loading) return <div style={{ padding: "2rem" }}>Loading Master Data...</div>;
  if (error) return <div style={{ padding: "2rem", color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
           <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0 }}>Master Cattle Data</h1>
           <div style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "4px" }}>
             Total Records: <strong>{filteredRows.length}</strong>
           </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
           {isAdmin && (
             <Link to="/cattle/register" style={primaryBtnStyle}>
               <span>+</span> Add New
             </Link>
           )}
           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
             <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#6b7280" }}>Status:</label>
             <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
               {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>
           <input type="text" placeholder="Search Tag / ID..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ ...inputStyle, minWidth: "220px" }} />
        </div>
      </div>

      {/* TABLE */}
      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
            <tr>
              <th style={thStyle}>Tag No / ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Breed</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.length === 0 ? (
               <tr><td colSpan={6} style={{padding:"2rem", textAlign:"center", color:"#999"}}>No records found.</td></tr>
            ) : (
              displayedRows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={tdStyle}>
                    <div style={{fontWeight:"bold", color:"#1f2937"}}>{row.tag}</div>
                    <div style={{fontSize:"0.75rem", color:"#6b7280", marginTop:"2px"}}>{row.internalId}</div>
                  </td>
                  <td style={tdStyle}>{row.name}</td>
                  <td style={tdStyle}>{row.breed}</td>
                  <td style={tdStyle}>{row.gender}</td>
                  <td style={tdStyle}><StatusPill status={row.status} /></td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button onClick={() => setSelected(row)} style={viewBtnStyle}>👁️ View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filteredRows.length > 0 && (
          <div style={paginationStyle}>
             <button onClick={handlePrev} disabled={currentPage === 1} style={pageBtnStyle}>Prev</button>
             <span style={pageNumberStyle}>Page {currentPage} of {totalPages}</span>
             <button onClick={handleNext} disabled={currentPage === totalPages} style={pageBtnStyle}>Next</button>
          </div>
        )}
      </div>

      {/* MODAL */}
      {selected && (
        <div style={modalOverlayStyle} onClick={() => setSelected(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
             <CattleDetailsPanel selected={selected} onClose={() => setSelected(null)} canEdit={isAdmin} refreshData={loadData} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------
   🔥 PHOTO COMPONENT
   ------------------------------------------------ */
function CattlePhoto({ url, imgStyle = largePhotoStyle }) {
  if (!url) return <div style={placeholderStyle}>No Photo</div>;
  if (url.includes("cloudinary.com")) return <img src={url} alt="Cattle" style={imgStyle} onError={(e) => e.target.style.display = 'none'} />;
  if (url.includes("drive.google.com")) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:"5px", background:"#fef2f2", width: "100%" }}>
        <span style={{fontSize:"0.75rem", color:"#b91c1c", fontWeight:"bold", textAlign:"center"}}>Drive Link (Cannot Embed)</span>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{fontSize:"0.8rem", color:"#fff", background:"#ef4444", padding:"6px 12px", borderRadius:"4px", textDecoration:"none"}}>Open Photo ↗</a>
      </div>
    );
  }
  return <img src={url} alt="Cattle" style={imgStyle} onError={(e) => e.target.style.display = 'none'} />;
}

/* ------------ DETAILS PANEL WITH UPLOAD ------------ */
function CattleDetailsPanel({ selected, onClose, canEdit, refreshData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null); // Reference to hidden file input

  useEffect(() => { if (isEditing) setFormData({ ...selected }); }, [isEditing, selected]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    const res = await updateCattle({ id: formData.internalId, ...formData });
    if (res && res.success) {
      alert("Updated Successfully!");
      setIsEditing(false);
      refreshData();
      onClose();
    } else {
      alert("Failed: " + res.error);
    }
  };

  // 🔥 UPLOAD LOGIC
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET); 
    data.append("folder", "cattle_photos"); // Organize in folder

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      });
      const fileData = await res.json();
      
      if (fileData.secure_url) {
        // Update form data with new URL automatically
        setFormData(prev => ({ ...prev, photo: fileData.secure_url }));
      } else {
        alert("Upload failed. Check console.");
        console.error(fileData);
      }
    } catch (err) {
      console.error("Error uploading:", err);
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const isActive = String(selected.status || "").toLowerCase() === "active";
  const ageText = calculateSmartAge(selected.dob, selected.admissionDate, selected.admissionAge);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem" }}>
        <div>
            {isEditing ? (
              <div style={{color:"#ea580c", fontWeight:"bold", fontSize:"1.1rem"}}>Editing: {selected.tag}</div>
            ) : (
              <>
                <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{selected.tag} – {selected.name}</div>
                <div style={{fontSize:"0.85rem", color:"#666", marginTop:"4px"}}>
                  Internal ID: <strong>{selected.internalId}</strong> | UID: {selected.govtUid || "N/A"}
                </div>
              </>
            )}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {canEdit && !isEditing && <button onClick={() => setIsEditing(true)} style={editBtnStyle}>✎ Edit</button>}
          {isEditing && (
            <>
              <button onClick={() => setIsEditing(false)} style={cancelBtnStyle}>Cancel</button>
              <button onClick={handleSave} style={saveBtnStyle}>Save</button>
            </>
          )}
          <button onClick={onClose} style={closeBtnStyle}>×</button>
        </div>
      </div>

      <div style={scrollableAreaStyle}>
        
        {/* LARGE PHOTO CONTAINER */}
        <div style={largePhotoContainerStyle}>
             {isEditing ? (
                // Show Preview of the URL in the text box, or the existing photo
                formData.photo ? <img src={formData.photo} style={largePhotoStyle} alt="Preview" /> : <div style={placeholderStyle}>No Photo Selected</div>
             ) : (
                <CattlePhoto url={selected.photo} />
             )}
        </div>

        {/* BASIC INFO SECTION */}
        <SectionTitle>Basic Information & Status</SectionTitle>
        <div style={gridStyle}>
          {isEditing ? (
             <>
                <EditInput label="Name" name="name" value={formData.name} onChange={handleChange} />
                <EditInput label="Tag No" name="tag" value={formData.tag} onChange={handleChange} />
                <EditInput label="Breed" name="breed" value={formData.breed} onChange={handleChange} />
                <EditInput label="Gender" name="gender" value={formData.gender} onChange={handleChange} type="select" options={["Female", "Male"]} />
                <EditInput label="DOB" name="dob" value={formData.dob} onChange={handleChange} type="date" />
                <EditInput label="Status" name="status" value={formData.status} onChange={handleChange} type="select" options={["Active", "Sold", "Dead"]} />
                <EditInput label="Shed (Location)" name="shed" value={formData.shed} onChange={handleChange} />
                <EditInput label="Category" name="category" value={formData.category} onChange={handleChange} type="select" options={["Milking", "Dry", "Heifer", "Calf", "Bull"]} />
                
                {/* 🔥 UPLOAD BUTTON CONTROL */}
                <div style={{ gridColumn: "1 / -1", background: "#f0f9ff", padding: "10px", borderRadius: "8px", border: "1px solid #bae6fd" }}>
                  <label style={{...labelStyle, color:"#0369a1"}}>Photo URL (Auto-filled on Upload)</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input 
                      type="text" 
                      name="photo" 
                      value={formData.photo || ""} 
                      onChange={handleChange} 
                      placeholder="Paste link or Upload ->" 
                      style={{...inputStyle, flex:1}} 
                    />
                    
                    {/* HIDDEN FILE INPUT */}
                    <input 
                       type="file" 
                       accept="image/*" 
                       ref={fileInputRef} 
                       onChange={handleFileSelect} 
                       style={{display:"none"}} 
                    />
                    
                    {/* TRIGGER BUTTON */}
                    <button 
                      onClick={() => fileInputRef.current.click()} 
                      disabled={uploading}
                      style={{
                        background: uploading ? "#ccc" : "#0ea5e9",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        padding: "0 15px",
                        fontWeight: "bold",
                        cursor: uploading ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: "5px", whiteSpace:"nowrap"
                      }}
                    >
                      {uploading ? "Uploading..." : "📷 Upload New"}
                    </button>
                  </div>
                </div>

             </>
          ) : (
             <>
               <DetailItem label="Breed" value={selected.breed} />
               <DetailItem label="Gender" value={selected.gender} />
               <DetailItem label="DOB" value={formatDate(selected.dob)} />
               {isActive && <DetailItem label="Current Age" value={ageText} />}
               <DetailItem label="Status" value={<StatusPill status={selected.status} />} />
               <DetailItem label="Location" value={selected.shed} />
               <DetailItem label="Category" value={selected.category} />
             </>
          )}
        </div>

        {/* ORIGINS */}
        <SectionTitle>Origins & Source</SectionTitle>
        <div style={gridStyle}>
           {isEditing ? (
             <>
               <EditInput label="Source" name="sourceName" value={formData.sourceName} onChange={handleChange} />
               <EditInput label="Purchase Price" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} />
             </>
           ) : (
             <>
               <DetailItem label="Admission Date" value={formatDate(selected.admissionDate)} />
               <DetailItem label="Type" value={selected.admissionType} />
               <DetailItem label="Age at Adm." value={selected.admissionAge ? `${String(selected.admissionAge).replace(/[^0-9]/g, '')} months` : "-"} />
               <DetailItem label="Source" value={selected.sourceName} />
               <DetailItem label="Price" value={selected.purchasePrice} />
             </>
           )}
        </div>

        {/* PARENTAGE */}
        <SectionTitle>Parentage</SectionTitle>
        <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "8px", border: "1px solid #ffedd5" }}>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
             <div>
               <div style={{ fontSize: "0.7rem", fontWeight: "bold", color: "#ea580c", marginBottom: "4px" }}>MOTHER (DAM)</div>
               {isEditing ? (
                  <EditInput label="ID / Tag" name="damId" value={formData.damId} onChange={handleChange} />
               ) : (
                  <div style={{ fontSize: "0.9rem" }}>
                    {selected.damId || "-"} 
                    {selected.damBreed && selected.damBreed.trim() && <span style={{ color: "#888", fontSize: "0.8rem", marginLeft: "4px" }}>({selected.damBreed})</span>}
                  </div>
               )}
             </div>
             <div>
               <div style={{ fontSize: "0.7rem", fontWeight: "bold", color: "#ea580c", marginBottom: "4px" }}>FATHER (SIRE)</div>
               {isEditing ? (
                  <EditInput label="ID / Tag" name="sireId" value={formData.sireId} onChange={handleChange} />
               ) : (
                  <div style={{ fontSize: "0.9rem" }}>
                    {selected.sireId || "-"} 
                    {selected.sireBreed && selected.sireBreed.trim() && <span style={{ color: "#888", fontSize: "0.8rem", marginLeft: "4px" }}>({selected.sireBreed})</span>}
                  </div>
               )}
             </div>
           </div>
        </div>

        {/* HEALTH */}
        <SectionTitle>Health & Other</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
           <DetailItem label="Is Disabled?" value={selected.isDisabled ? "Yes" : "No"} />
           {isEditing ? (
             <div>
                <label style={labelStyle}>Remarks</label>
                <textarea name="remarks" value={formData.remarks} onChange={handleChange} style={{...inputStyle, minHeight:"60px"}} />
             </div>
           ) : (
             <div style={{ marginTop: "5px" }}>
               <div style={labelItemStyle}>Remarks</div>
               <div style={{ background: "#f3f4f6", padding: "10px", borderRadius: "6px", fontSize: "0.85rem", fontStyle: "italic", color: "#374151" }}>
                 "{selected.remarks || "No remarks."}"
               </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}

// Logic & Helpers
function calculateSmartAge(dob, admissionDate, admissionAgeRaw) {
  const now = new Date();
  if (dob && dob !== "-" && dob !== "") {
    const d = new Date(dob);
    if (!isNaN(d.getTime())) {
      const diffMs = now - d;
      const ageDate = new Date(diffMs);
      const years = Math.abs(ageDate.getUTCFullYear() - 1970);
      const months = ageDate.getUTCMonth();
      return years > 0 ? `${years} yr ${months} mo` : `${months} months`;
    }
  }
  if (admissionDate && admissionAgeRaw) {
    const startAge = parseInt(String(admissionAgeRaw).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(startAge)) {
       let admDate = new Date(admissionDate);
       if (isNaN(admDate.getTime()) || String(admissionDate).includes("/")) {
         const parts = String(admissionDate).split(/[-/]/);
         if (parts.length === 3 && parts[2].length === 4) admDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
       }
       if (!isNaN(admDate.getTime())) {
         const monthsSince = (now.getFullYear() - admDate.getFullYear()) * 12 + (now.getMonth() - admDate.getMonth());
         const totalMonths = startAge + monthsSince;
         if (totalMonths > 0) {
           const years = Math.floor(totalMonths / 12);
           const months = totalMonths % 12;
           return years > 0 ? `${years} yr ${months} mo (Est)` : `${months} months (Est)`;
         }
       }
    }
  }
  return "Unknown";
}

const EditInput = ({ label, name, value, onChange, type="text", options=[], placeholder="" }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {type === "select" ? (
      <select name={name} value={value||""} onChange={onChange} style={inputStyle}>
         {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} name={name} value={value||""} onChange={onChange} style={inputStyle} placeholder={placeholder} />
    )}
  </div>
);

const DetailItem = ({ label, value }) => { if(!value) return null; return <div><div style={labelItemStyle}>{label}</div><div style={{fontWeight:500, fontSize:"0.9rem"}}>{value}</div></div>; };
const SectionTitle = ({ children }) => <div style={sectionTitleStyle}>{children}</div>;
const StatusPill = ({ status }) => <span style={{background:"#dcfce7", padding:"4px 8px", borderRadius:"12px", fontSize:"0.75rem", color:"#166534", fontWeight:"bold"}}>{status}</span>;
const formatDate = (v) => (!v || v==="-") ? "-" : new Date(v).toLocaleDateString('en-GB');

const cardStyle = { background: "#fff", borderRadius: "10px", padding: "0", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", overflow:"hidden", border:"1px solid #e5e7eb" };
const thStyle = { padding: "1rem", textAlign: "left", fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", background:"#f8fafc", borderBottom:"1px solid #e2e8f0" };
const tdStyle = { padding: "0.8rem 1rem", borderBottom: "1px solid #f1f5f9", fontSize:"0.9rem", verticalAlign: "middle" };
const inputStyle = { padding: "0.5rem", border: "1px solid #ccc", borderRadius: "5px", width: "100%", boxSizing:"border-box" };

const primaryBtnStyle = { 
  background: "#2563eb", 
  color: "#fff", 
  padding: "10px 24px", 
  borderRadius: "6px", 
  textDecoration: "none", 
  fontSize:"0.9rem", 
  fontWeight:600, 
  display: "flex", 
  alignItems: "center", 
  gap: "6px", 
  minWidth: "140px", 
  justifyContent: "center",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
};

const viewBtnStyle = { background: "#eff6ff", color: "#1d4ed8", padding: "6px 10px", borderRadius: "5px", border: "1px solid #bfdbfe", cursor: "pointer", fontSize:"0.8rem", fontWeight:600 };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 };
const modalContentStyle = { background: "#fff", width: "700px", maxWidth:"95%", padding: "1.5rem", borderRadius: "10px", maxHeight: "95vh", overflowY: "auto", display:"flex", flexDirection:"column" };
const scrollableAreaStyle = { overflowY: "auto", paddingRight: "0.5rem", flex: 1, marginTop: "0.5rem" };
const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" };
const labelStyle = { fontSize: "0.75rem", color: "#666", display: "block", marginBottom: "4px", fontWeight:600 };
const labelItemStyle = { fontSize: "0.7rem", color: "#94a3b8", fontWeight: "bold", textTransform: "uppercase" };
const sectionTitleStyle = { fontSize: "0.85rem", color: "#0369a1", fontWeight: "bold", borderBottom: "2px solid #e0f2fe", marginBottom: "12px", marginTop: "10px", paddingBottom: "5px", textTransform:"uppercase" };
const editBtnStyle = { background: "#f59e0b", color:"#fff", border:"none", padding:"6px 12px", borderRadius:"4px", cursor:"pointer", fontSize:"0.8rem", fontWeight:600 };
const saveBtnStyle = { background: "#16a34a", color:"#fff", border:"none", padding:"6px 12px", borderRadius:"4px", cursor:"pointer", fontSize:"0.8rem", fontWeight:600 };
const cancelBtnStyle = { background: "#fff", color:"#666", border:"1px solid #ccc", padding:"6px 12px", borderRadius:"4px", cursor:"pointer", fontSize:"0.8rem", fontWeight:600 };
const closeBtnStyle = { background: "none", border:"none", fontSize:"2rem", cursor:"pointer", color:"#9ca3af", lineHeight:1};
const paginationStyle = { display: "flex", justifyContent: "space-between", alignItems:"center", padding:"1rem", background:"#f8fafc", borderTop:"1px solid #e2e8f0" };
const pageBtnStyle = { padding: "6px 12px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", borderRadius:"4px", fontSize:"0.85rem" };
const pageNumberStyle = { padding: "6px 10px", fontWeight:600, color:"#334155" };

const largePhotoContainerStyle = { width: "100%", height: "300px", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: "12px", border: "1px solid #e5e7eb", marginBottom: "1.5rem" };
const largePhotoStyle = { width: "100%", height: "100%", objectFit: "contain" };
const placeholderStyle = { display:"flex", alignItems:"center", justifyContent:"center", height:"100%", fontSize:"0.9rem", color:"#999", textAlign:"center", width:"100%" };