// src/pages/NewBorn.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import { getNewBorn, addNewBorn, updateNewBorn, getCattle } from "../api/masterApi"; 

const CLOUD_NAME = "dvcwgkszp";       
const UPLOAD_PRESET = "cattle_upload"; 

function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`; 
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return "";
  const parts = String(isoDate).split("T")[0].split("-");
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

function getEmptyForm() {
  return {
    id: "",
    birthDate: "",
    timeOfBirth: "",
    motherTag: "",
    motherBreed: "",
    fatherTag: "",
    fatherBreed: "",
    calfId: "",        
    calfSex: "",
    calfBreed: "",
    calfWeight: "",
    deliveryType: "",
    birthStatus: "",
    remarks: "",
    photo: "",
    status: "Pending"
  };
}

export default function NewBorn() {
  const navigate = useNavigate(); 
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState([]);
  const [cattleMap, setCattleMap] = useState({}); 
  
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(getEmptyForm());
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [error, setError] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { 
    loadData(); 
    loadCattleDirectory(); 
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getNewBorn();
      setRows(data || []);
    } catch (err) {
      console.error("Failed to load", err);
      setError("Unable to load data.");
    } finally {
      setLoading(false);
    }
  };

  const loadCattleDirectory = async () => {
    try {
      const allCattle = await getCattle(); 
      if (allCattle && Array.isArray(allCattle)) {
        const map = {};
        allCattle.forEach(c => {
           const breed = c.breed || c.breed_name || ""; 
           if (!breed) return;
           if(c.tag) map[c.tag.toString().trim().toUpperCase()] = breed;
           if(c.cattleId) map[c.cattleId.toString().trim().toUpperCase()] = breed; 
           if(c.internalId) map[c.internalId.toString().trim().toUpperCase()] = breed;
        });
        setCattleMap(map);
      }
    } catch(e) { console.error("Could not load cattle directory", e); }
  };

  const filteredRows = useMemo(() => 
    rows.filter((r) => (r.dateOfBirth || "").startsWith(month)),
    [rows, month]
  );

  function openAddForm() {
    setEditingEntry(null);
    setForm({ ...getEmptyForm(), birthDate: month + "-01" });
    setShowForm(true);
  }

  function openEdit(entry) {
    setEditingEntry(entry);
    setForm({ ...entry }); 
    setShowForm(true);
  }

  function openView(entry) {
    setSelectedEntry(entry);
    setShowView(true);
  }

  // In src/pages/NewBorn.jsx

function handleRegister(entry) {
  // 🔥 FIXED: Matches the path in your App.jsx
  navigate("/cattle/register", { 
    state: { 
      source: "birth_log",
      birthData: entry 
    } 
  });
}

  function handleFormChange(e) {
    const { name, value } = e.target;
    
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      const lookupKey = value ? value.toString().trim().toUpperCase() : "";

      // 1. Auto-Fill Breeds
      if (name === "motherTag" && lookupKey && cattleMap[lookupKey]) {
        updated.motherBreed = cattleMap[lookupKey];
      }
      if (name === "fatherTag" && lookupKey && cattleMap[lookupKey]) {
        updated.fatherBreed = cattleMap[lookupKey];
      }

      // 2. Auto-Set Workflow Status based on Health
      if (name === "birthStatus") {
        if (["Stillborn", "Abortion"].includes(value)) {
          updated.status = "Archived"; 
        } else if (["Healthy", "Weak"].includes(value)) {
          if (updated.status === "Archived" || !updated.status) {
            updated.status = "Pending";
          }
        }
      }

      return updated;
    });
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
    data.append("folder", "newborn_photos"); 

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      });
      const fileData = await res.json();
      if (fileData.secure_url) {
        setForm(prev => ({ ...prev, photo: fileData.secure_url }));
      }
    } catch (err) {
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingEntry) {
        await updateNewBorn(form);
      } else {
        await addNewBorn(form);
      }
      alert("Saved Successfully!");
      setShowForm(false);
      loadData(); 
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  }

  const breedOptions = ["Hallikar", "Gir", "Jersey", "HF", "Mix", "Sahiwal", "Punganur", "Kankrej", "Deoni", "Malnad Gidda", "Krishna Valley", "Bargur", "Ongole", "Rathi"];

  // Helper to check if a row needs registration (Active/Pending but no Real ID)
  const needsRegistration = (entry) => {
     if(!entry) return false;
     const status = entry.status || "Pending";
     const id = entry.calfId || "";
     
     // Exclude Dead/Archived
     if(["Died after Birth", "Archived", "Stillborn", "Abortion", "Dead"].includes(status)) return false;

     // Show if Pending OR Active/Tagged but ID is missing/placeholder
     return status === "Pending" || status === "Active" || status === "Tagged" || !id || id === "CREATE NEW ID";
  };

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>New Born Log</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.15rem", color: "#6b7280" }}>Month</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={inputStyle} />
          </div>
          <button type="button" onClick={openAddForm} style={btnPrimary}>+ Add Birth Event</button>
        </div>
      </header>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={tableContainerStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#f1f5f9", textAlign: "left" }}>
            <tr>
              <th style={thStyle}>Transaction ID</th>
              <th style={thStyle}>Birth Date</th>
              <th style={thStyle}>Mother ID</th>
              <th style={thStyle}>Calf Sex</th>
              <th style={thStyle}>Calf Breed</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center" }}>Loading...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No entries for {month}.</td></tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                  <td style={tdStyle}>
                    <div style={{fontWeight:"bold", color:"#334155"}}>{row.id}</div>
                    {row.calfId && row.calfId !== "CREATE NEW ID" && <div style={{fontSize:"0.75rem", color:"#16a34a"}}>Linked: {row.calfId}</div>}
                  </td>
                  <td style={tdStyle}>{formatDisplayDate(row.dateOfBirth)}</td>
                  <td style={tdStyle}>{row.motherTag}</td>
                  <td style={tdStyle}>{row.calfSex}</td>
                  <td style={tdStyle}>{row.calfBreed}</td>
                  <td style={tdStyle}>
                    <StatusBadge status={row.status} />
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button onClick={() => openView(row)} style={viewBtnStyle} title="View Details">👁️ View</button>
                    {/* 🔥 REGISTER BUTTON: Uses smart check */}
                    {needsRegistration(row) && (
                        <button onClick={() => handleRegister(row)} style={registerBtnStyle} title="Induct to Master">® Register</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- VIEW MODAL --- */}
      {showView && selectedEntry && (
        <div style={overlayStyle} onClick={() => setShowView(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem", borderBottom:"1px solid #eee", paddingBottom:"10px"}}>
               <h2 style={{margin:0, color:"#1e293b"}}>Transaction: {selectedEntry.id}</h2>
               <button onClick={() => setShowView(false)} style={closeBtn}>✕</button>
            </div>
            
            <div style={{display:"flex", gap:"1.5rem"}}>
               <div style={{width:"35%", display:"flex", flexDirection:"column", gap:"10px"}}>
                   <div style={{width:"100%", aspectRatio:"4/3", background:"#000", borderRadius:"8px", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center"}}>
                       {selectedEntry.photo ? (
                           <img src={selectedEntry.photo} alt="Calf" style={{width:"100%", height:"100%", objectFit:"contain"}}/>
                       ) : (
                           <span style={{color:"#999"}}>No Photo</span>
                       )}
                   </div>
                   <div style={{padding:"10px", background:"#f8fafc", borderRadius:"8px", border:"1px solid #e2e8f0"}}>
                       <div style={labelStyle}>Workflow Stage</div>
                       <StatusBadge status={selectedEntry.status} />
                   </div>
                   
                   {/* Register Action in Modal too */}
                   {needsRegistration(selectedEntry) && (
                       <button onClick={() => handleRegister(selectedEntry)} style={{...registerBtnStyle, width:"100%", justifyContent:"center", padding:"8px"}}>
                           ® Register to Master
                       </button>
                   )}
               </div>

               <div style={{width:"65%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"15px", alignContent:"start"}}>
                   <Detail label="Birth Date" value={formatDisplayDate(selectedEntry.dateOfBirth)} />
                   <Detail label="Time of Birth" value={selectedEntry.timeOfBirth} />
                   
                   <div style={{gridColumn:"1 / -1", borderTop:"1px dashed #e2e8f0", marginTop:"5px", paddingTop:"10px"}}>
                     <div style={{fontSize:"0.75rem", fontWeight:"bold", color:"#3b82f6", marginBottom:"5px"}}>PARENTAGE</div>
                     <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"15px"}}>
                        <Detail label="Mother Tag" value={selectedEntry.motherTag} />
                        <Detail label="Mother Breed" value={selectedEntry.motherBreed || "Unknown"} />
                        <Detail label="Father Tag" value={selectedEntry.fatherTag || "-"} />
                        <Detail label="Father Breed" value={selectedEntry.fatherBreed || "Unknown"} />
                     </div>
                   </div>

                   <div style={{gridColumn:"1 / -1", borderTop:"1px dashed #e2e8f0", marginTop:"5px", paddingTop:"10px"}}>
                     <div style={{fontSize:"0.75rem", fontWeight:"bold", color:"#10b981", marginBottom:"5px"}}>CALF DETAILS</div>
                     <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"15px"}}>
                        <Detail label="Gender" value={selectedEntry.calfSex} />
                        <Detail label="Breed" value={selectedEntry.calfBreed} />
                        <Detail label="Weight" value={selectedEntry.calfWeight ? `${selectedEntry.calfWeight} Kg` : "-"} />
                        <Detail label="Health" value={selectedEntry.birthStatus} />
                     </div>
                   </div>

                   {selectedEntry.calfId && selectedEntry.calfId !== "CREATE NEW ID" && (
                     <div style={{gridColumn:"1 / -1", padding:"8px", background:"#dcfce7", borderRadius:"6px", border:"1px solid #bbf7d0", marginTop:"5px"}}>
                        <div style={{fontSize:"0.7rem", color:"#166534", fontWeight:"bold", textTransform:"uppercase"}}>Registered Internal ID</div>
                        <div style={{fontWeight:"bold", color:"#14532d"}}>{selectedEntry.calfId}</div>
                     </div>
                   )}
                   
                   <div style={{gridColumn:"1 / -1"}}>
                       <Detail label="Remarks" value={selectedEntry.remarks} />
                   </div>
               </div>
            </div>
            
            <div style={{marginTop:"1.5rem", textAlign:"right"}}>
                <button onClick={() => { setShowView(false); openEdit(selectedEntry); }} style={btnSecondary}>Edit Raw Data</button>
            </div>
          </div>
        </div>
      )}

      {/* --- FORM MODAL --- */}
      {showForm && (
        <div style={overlayStyle} onClick={() => setShowForm(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2>{editingEntry ? "Edit Birth Record" : "Add New Birth"}</h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.85rem", marginTop:"1rem" }}>
              
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                  <Field label="Birth Date *">
                    <input type="date" name="birthDate" value={form.birthDate} onChange={handleFormChange} style={inputStyle} required />
                  </Field>
                  <Field label="Time of Birth">
                    <input type="time" name="timeOfBirth" value={form.timeOfBirth} onChange={handleFormChange} style={inputStyle} />
                  </Field>
              </div>

              {/* MOTHER SECTION */}
              <div style={{background:"#f8fafc", padding:"10px", borderRadius:"8px", border:"1px solid #e2e8f0"}}>
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                      <Field label="Mother Tag/ID *">
                        <input type="text" name="motherTag" value={form.motherTag} onChange={handleFormChange} style={inputStyle} required placeholder="Enter Tag to Auto-fill" />
                      </Field>
                      <Field label="Mother Breed">
                        <input type="text" name="motherBreed" value={form.motherBreed} readOnly style={{...inputStyle, background:"#f1f5f9", color:"#64748b"}} tabIndex={-1} />
                      </Field>
                  </div>
              </div>

              {/* FATHER SECTION */}
              <div style={{background:"#f8fafc", padding:"10px", borderRadius:"8px", border:"1px solid #e2e8f0"}}>
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                      <Field label="Father Tag/ID (Optional)">
                        <input type="text" name="fatherTag" value={form.fatherTag} onChange={handleFormChange} style={inputStyle} placeholder="Enter Tag (if known)" />
                      </Field>
                      <Field label="Father Breed *">
                         {form.fatherTag && cattleMap[form.fatherTag.trim().toUpperCase()] ? (
                             <input type="text" name="fatherBreed" value={form.fatherBreed} readOnly style={{...inputStyle, background:"#f1f5f9", color:"#64748b"}} />
                         ) : (
                             <select name="fatherBreed" value={form.fatherBreed} onChange={handleFormChange} style={inputStyle} required>
                                <option value="">Select (Manual)</option>
                                {breedOptions.map(b=><option key={b} value={b}>{b}</option>)}
                             </select>
                         )}
                      </Field>
                  </div>
              </div>

              {/* CALF SECTION */}
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                  <Field label="Calf Gender *">
                    <select name="calfSex" value={form.calfSex} onChange={handleFormChange} style={inputStyle} required>
                      <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                    </select>
                  </Field>
                  <Field label="Calf Breed (Result) *">
                    <select name="calfBreed" value={form.calfBreed} onChange={handleFormChange} style={inputStyle} required>
                      <option value="">Select</option>
                      {breedOptions.map(b=><option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
              </div>

              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                   <Field label="Weight (Kg)">
                    <input type="number" name="calfWeight" value={form.calfWeight} onChange={handleFormChange} style={inputStyle} />
                  </Field>
                  <Field label="Delivery Type">
                     <select name="deliveryType" value={form.deliveryType} onChange={handleFormChange} style={inputStyle}>
                        <option value="">Select</option><option value="Normal">Normal</option><option value="Assisted">Assisted</option><option value="Caesarean">Caesarean</option>
                     </select>
                  </Field>
              </div>

              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                  <Field label="Health Status">
                     <select name="birthStatus" value={form.birthStatus} onChange={handleFormChange} style={inputStyle}>
                        <option value="">Select</option><option value="Healthy">Healthy</option><option value="Weak">Weak</option><option value="Stillborn">Stillborn</option><option value="Abortion">Abortion</option>
                     </select>
                  </Field>
                  <Field label="Workflow Status">
                     <select name="status" value={form.status} onChange={handleFormChange} style={inputStyle} disabled={form.status === "Archived"}>
                        <option value="Pending">Pending (Untagged)</option>
                        <option value="Registered">Registered (Tagged)</option>
                        <option value="Died after Birth">Died after Birth</option>
                        <option value="Archived">Archived (Stillborn)</option>
                     </select>
                  </Field>
              </div>
              
              {editingEntry && form.calfId && (
                <div style={{padding:"8px", background:"#dcfce7", borderRadius:"6px", marginBottom:"1rem", border:"1px solid #bbf7d0"}}>
                    <span style={{fontWeight:"bold", color:"#166534"}}>Linked ID: {form.calfId}</span>
                </div>
              )}

              {/* UPLOAD BUTTON */}
              <div style={{background: "#f0f9ff", padding: "10px", borderRadius: "8px", border: "1px solid #bae6fd"}}>
                  <label style={{display:"block", fontSize:"0.8rem", fontWeight:600, color:"#0369a1", marginBottom:"5px"}}>Newborn Photo</label>
                  <div style={{display:"flex", gap:"10px"}}>
                      <input type="text" value={form.photo || ""} readOnly placeholder="Image URL..." style={{flex:1, padding:"8px", borderRadius:"5px", border:"1px solid #ccc", background:"#fff"}} />
                      <button type="button" onClick={() => fileInputRef.current.click()} disabled={uploading} style={{background: uploading ? "#ccc" : "#0ea5e9", color: "#fff", border: "none", borderRadius: "5px", padding: "0 15px", fontWeight: "bold", cursor: "pointer"}}>
                        {uploading ? "..." : "📷 Upload"}
                      </button>
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} style={{display:"none"}} />
                  </div>
                  {form.photo && <img src={form.photo} alt="Preview" style={{marginTop: "8px", height:"60px", borderRadius:"4px", border:"1px solid #ccc"}} />}
              </div>

              <Field label="Remarks">
                <input type="text" name="remarks" value={form.remarks} onChange={handleFormChange} style={inputStyle} />
              </Field>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
                <button type="submit" style={btnPrimary}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES & HELPERS ---
const StatusBadge = ({status}) => {
  let bg = "#f3f4f6", col = "#6b7280";
  if(status === "Registered") { bg = "#dcfce7"; col = "#166534"; }
  if(status === "Pending") { bg = "#fef9c3"; col = "#854d0e"; }
  if(status === "Archived") { bg = "#e2e8f0"; col = "#64748b"; } 
  if(status && status.includes("Died")) { bg = "#fee2e2"; col = "#991b1b"; }
  return <span style={{background:bg, color:col, padding:"2px 8px", borderRadius:"10px", fontSize:"0.75rem", fontWeight:"bold"}}>{status || "Pending"}</span>;
};
const Detail = ({label, value}) => <div><div style={{fontSize:"0.75rem", color:"#64748b", fontWeight:"bold", textTransform:"uppercase"}}>{label}</div><div style={{fontSize:"0.95rem", color:"#0f172a"}}>{value || "-"}</div></div>;
const btnPrimary = { padding: "0.5rem 1rem", borderRadius: "6px", border: "none", background: "#16a34a", color: "#fff", fontWeight: 600, cursor: "pointer" };
const btnSecondary = { padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" };
const inputStyle = { width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc", boxSizing:"border-box" };
const thStyle = { padding: "0.8rem", borderBottom: "1px solid #ddd", fontWeight: 600, color: "#555" };
const tdStyle = { padding: "0.8rem", borderBottom: "1px solid #eee", color: "#333", verticalAlign:"middle" };
const viewBtnStyle = { border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", marginRight:"6px" };
const registerBtnStyle = { border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", display:"inline-flex", alignItems:"center", gap:"4px" };
const errorStyle = { padding: "10px", background: "#fee2e2", color: "#b91c1c", borderRadius: "6px", marginBottom: "1rem" };
const tableContainerStyle = { background: "#fff", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", overflow: "hidden" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 };
const modalStyle = { background: "#fff", padding: "2rem", borderRadius: "12px", width: "700px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" };
const closeBtn = { background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" };
const labelStyle = { fontSize: "0.75rem", color: "#64748b", fontWeight: "bold", textTransform: "uppercase", marginBottom: "2px" };
const Field = ({ label, children }) => <div style={{marginBottom:"5px"}}><label style={{display:"block", fontSize:"0.8rem", fontWeight:600, marginBottom:"3px", color:"#555"}}>{label}</label>{children}</div>;