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
    color: "", 
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

  function handleRegister(entry) {
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

  const needsRegistration = (entry) => {
     if(!entry) return false;
     const status = entry.status || "Pending";
     const id = entry.calfId || "";
     if(["Died after Birth", "Archived", "Stillborn", "Abortion", "Dead"].includes(status)) return false;
     return status === "Pending" || status === "Active" || status === "Tagged" || !id || id === "CREATE NEW ID";
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0, color: "#111827" }}>New Born Log</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: "600" }}>Month:</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="form-input" style={{ width: "auto", padding: "0.4rem" }} />
          </div>
          <button type="button" onClick={openAddForm} className="btn btn-primary">+ Add Event</button>
        </div>
      </div>

      {error && <div style={{ padding: "1rem", background: "#fee2e2", color: "#b91c1c", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}

      {/* TABLE CONTAINER (Scrollable) */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: "800px" }}>
            <thead style={{ background: "#f8fafc", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
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
                <tr><td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading...</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>No entries for {month}.</td></tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
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
                      <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                        <button onClick={() => openView(row)} style={viewBtnStyle} title="View Details">👁️ View</button>
                        {needsRegistration(row) && (
                            <button onClick={() => handleRegister(row)} style={registerBtnStyle} title="Induct to Master">® Register</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- VIEW MODAL --- */}
      {showView && selectedEntry && (
        <div style={overlayStyle} onClick={() => setShowView(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem", borderBottom:"1px solid #eee", paddingBottom:"10px"}}>
               <h2 style={{margin:0, color:"#1e293b", fontSize:"1.2rem"}}>Transaction: {selectedEntry.id}</h2>
               <button onClick={() => setShowView(false)} style={closeBtn}>✕</button>
            </div>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
               {/* Left: Photo & Status */}
               <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                   <div style={{ width: "100%", aspectRatio: "4/3", background: "#f1f5f9", borderRadius: "12px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                       {selectedEntry.photo ? (
                           <img src={selectedEntry.photo} alt="Calf" style={{width:"100%", height:"100%", objectFit:"contain"}}/>
                       ) : (
                           <span style={{color:"#94a3b8", fontWeight: "500"}}>No Photo</span>
                       )}
                   </div>
                   <div style={{padding:"12px", background:"#f8fafc", borderRadius:"8px", border:"1px solid #e2e8f0"}}>
                       <div style={labelStyle}>Workflow Stage</div>
                       <StatusBadge status={selectedEntry.status} />
                   </div>
                   
                   {needsRegistration(selectedEntry) && (
                       <button onClick={() => handleRegister(selectedEntry)} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                           ® Register to Master
                       </button>
                   )}
               </div>

               {/* Right: Details Grid */}
               <div style={{ flex: "2 1 400px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                   <div className="responsive-grid">
                       <Detail label="Birth Date" value={formatDisplayDate(selectedEntry.dateOfBirth)} />
                       <Detail label="Time of Birth" value={selectedEntry.timeOfBirth} />
                   </div>
                   
                   <div style={{ borderTop:"1px dashed #e2e8f0", paddingTop:"1rem" }}>
                     <div style={{fontSize:"0.8rem", fontWeight:"bold", color:"#3b82f6", marginBottom:"10px", textTransform:"uppercase"}}>Parentage</div>
                     <div className="responsive-grid">
                        <Detail label="Mother Tag" value={selectedEntry.motherTag} />
                        <Detail label="Mother Breed" value={selectedEntry.motherBreed || "Unknown"} />
                        <Detail label="Father Tag" value={selectedEntry.fatherTag || "-"} />
                        <Detail label="Father Breed" value={selectedEntry.fatherBreed || "Unknown"} />
                     </div>
                   </div>

                   <div style={{ borderTop:"1px dashed #e2e8f0", paddingTop:"1rem" }}>
                     <div style={{fontSize:"0.8rem", fontWeight:"bold", color:"#10b981", marginBottom:"10px", textTransform:"uppercase"}}>Calf Details</div>
                     <div className="responsive-grid">
                        <Detail label="Gender" value={selectedEntry.calfSex} />
                        <Detail label="Breed" value={selectedEntry.calfBreed} />
                        <Detail label="Color" value={selectedEntry.color} />
                        <Detail label="Weight" value={selectedEntry.calfWeight ? `${selectedEntry.calfWeight} Kg` : "-"} />
                        <Detail label="Health" value={selectedEntry.birthStatus} />
                     </div>
                   </div>

                   {selectedEntry.calfId && selectedEntry.calfId !== "CREATE NEW ID" && (
                     <div style={{padding:"10px", background:"#dcfce7", borderRadius:"6px", border:"1px solid #bbf7d0"}}>
                        <div style={{fontSize:"0.7rem", color:"#166534", fontWeight:"bold", textTransform:"uppercase"}}>Registered Internal ID</div>
                        <div style={{fontWeight:"bold", color:"#14532d"}}>{selectedEntry.calfId}</div>
                     </div>
                   )}
                   
                   <div>
                       <Detail label="Remarks" value={selectedEntry.remarks} />
                   </div>
               </div>
            </div>
            
            <div style={{marginTop:"2rem", textAlign:"right", paddingTop:"1rem", borderTop:"1px solid #f1f5f9"}}>
                <button onClick={() => { setShowView(false); openEdit(selectedEntry); }} className="btn btn-secondary">Edit Raw Data</button>
            </div>
          </div>
        </div>
      )}

      {/* --- FORM MODAL --- */}
      {showForm && (
        <div style={overlayStyle} onClick={() => setShowForm(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>{editingEntry ? "Edit Birth Record" : "Add New Birth"}</h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              
              <div className="responsive-grid">
                  <Field label="Birth Date *">
                    <input type="date" name="birthDate" value={form.birthDate} onChange={handleFormChange} className="form-input" required />
                  </Field>
                  <Field label="Time of Birth">
                    <input type="time" name="timeOfBirth" value={form.timeOfBirth} onChange={handleFormChange} className="form-input" />
                  </Field>
              </div>

              {/* MOTHER SECTION */}
              <div style={{background:"#f8fafc", padding:"1rem", borderRadius:"8px", border:"1px solid #e2e8f0"}}>
                  <div className="responsive-grid">
                      <Field label="Mother Tag/ID *">
                        <input type="text" name="motherTag" value={form.motherTag} onChange={handleFormChange} className="form-input" required placeholder="Enter Tag to Auto-fill" />
                      </Field>
                      <Field label="Mother Breed">
                        <input type="text" name="motherBreed" value={form.motherBreed} readOnly className="form-input" style={{background:"#f1f5f9", color:"#64748b"}} tabIndex={-1} />
                      </Field>
                  </div>
              </div>

              {/* FATHER SECTION */}
              <div style={{background:"#f8fafc", padding:"1rem", borderRadius:"8px", border:"1px solid #e2e8f0"}}>
                  <div className="responsive-grid">
                      <Field label="Father Tag/ID (Optional)">
                        <input type="text" name="fatherTag" value={form.fatherTag} onChange={handleFormChange} className="form-input" placeholder="Enter Tag (if known)" />
                      </Field>
                      <Field label="Father Breed *">
                         {form.fatherTag && cattleMap[form.fatherTag.trim().toUpperCase()] ? (
                             <input type="text" name="fatherBreed" value={form.fatherBreed} readOnly className="form-input" style={{background:"#f1f5f9", color:"#64748b"}} />
                         ) : (
                             <select name="fatherBreed" value={form.fatherBreed} onChange={handleFormChange} className="form-select" required>
                                <option value="">Select (Manual)</option>
                                {breedOptions.map(b=><option key={b} value={b}>{b}</option>)}
                             </select>
                         )}
                      </Field>
                  </div>
              </div>

              {/* CALF SECTION */}
              <div className="responsive-grid">
                  <Field label="Calf Gender *">
                    <select name="calfSex" value={form.calfSex} onChange={handleFormChange} className="form-select" required>
                      <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                    </select>
                  </Field>
                  <Field label="Calf Breed (Result) *">
                    <select name="calfBreed" value={form.calfBreed} onChange={handleFormChange} className="form-select" required>
                      <option value="">Select</option>
                      {breedOptions.map(b=><option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
              </div>

              <div className="responsive-grid">
                   <Field label="Calf Color *">
                     <input type="text" name="color" value={form.color} onChange={handleFormChange} className="form-input" required placeholder="e.g. White, Black, Brown" />
                   </Field>
                   <Field label="Weight (Kg)">
                    <input type="number" name="calfWeight" value={form.calfWeight} onChange={handleFormChange} className="form-input" />
                  </Field>
              </div>

              <div className="responsive-grid">
                  <Field label="Delivery Type">
                     <select name="deliveryType" value={form.deliveryType} onChange={handleFormChange} className="form-select">
                        <option value="">Select</option><option value="Normal">Normal</option><option value="Assisted">Assisted</option><option value="Caesarean">Caesarean</option>
                     </select>
                  </Field>
                  <Field label="Health Status">
                     <select name="birthStatus" value={form.birthStatus} onChange={handleFormChange} className="form-select">
                        <option value="">Select</option><option value="Healthy">Healthy</option><option value="Weak">Weak</option><option value="Stillborn">Stillborn</option><option value="Abortion">Abortion</option>
                     </select>
                  </Field>
              </div>
              
              <Field label="Workflow Status">
                  <select name="status" value={form.status} onChange={handleFormChange} className="form-select" disabled={form.status === "Archived"}>
                    <option value="Pending">Pending (Untagged)</option>
                    <option value="Registered">Registered (Tagged)</option>
                    <option value="Died after Birth">Died after Birth</option>
                    <option value="Archived">Archived (Stillborn)</option>
                  </select>
              </Field>
              
              {/* UPLOAD BUTTON (Drop Zone) */}
              <div 
                className="photo-upload-box"
                onClick={() => !uploading && fileInputRef.current.click()}
                style={{ padding: "1.5rem", minHeight: "100px" }}
              >
                 {uploading ? (
                    <span style={{color:"#2563eb", fontWeight:"bold"}}>Uploading...</span>
                 ) : form.photo ? (
                    <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                        <img src={form.photo} alt="Preview" style={{height:"60px", borderRadius:"4px"}} />
                        <span style={{color:"#16a34a", fontWeight:"600"}}>Photo Attached</span>
                    </div>
                 ) : (
                    <div style={{display:"flex", alignItems:"center", gap:"10px", color:"#64748b"}}>
                        <span style={{fontSize:"1.5rem"}}>📷</span>
                        <span>Tap to upload photo</span>
                    </div>
                 )}
                 <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileSelect} style={{display:"none"}} />
              </div>

              <Field label="Remarks">
                <input type="text" name="remarks" value={form.remarks} onChange={handleFormChange} className="form-input" />
              </Field>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary btn-full-mobile">Cancel</button>
                <button type="submit" className="btn btn-primary btn-full-mobile">Save Entry</button>
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

const Detail = ({label, value}) => (
  <div>
    <div style={{fontSize:"0.75rem", color:"#64748b", fontWeight:"bold", textTransform:"uppercase"}}>{label}</div>
    <div style={{fontSize:"0.95rem", color:"#0f172a", fontWeight: "500"}}>{value || "-"}</div>
  </div>
);

const thStyle = { padding: "1rem", borderBottom: "1px solid #e2e8f0", fontWeight: 600, color: "#64748b", textTransform: "uppercase", fontSize: "0.75rem" };
const tdStyle = { padding: "1rem", borderBottom: "1px solid #f1f5f9", color: "#334155", verticalAlign:"middle" };
const viewBtnStyle = { border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", marginRight:"6px", fontSize: "0.85rem", fontWeight: "600" };
const registerBtnStyle = { border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", display:"inline-flex", alignItems:"center", gap:"4px", fontSize: "0.85rem", fontWeight: "600" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" };
const modalStyle = { background: "#fff", padding: "1.5rem", borderRadius: "12px", width: "800px", maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" };
const closeBtn = { background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#9ca3af", lineHeight: 1 };
const labelStyle = { fontSize: "0.75rem", color: "#64748b", fontWeight: "bold", textTransform: "uppercase", marginBottom: "4px" };
const Field = ({ label, children }) => <div className="form-group"><label className="form-label">{label}</label>{children}</div>;