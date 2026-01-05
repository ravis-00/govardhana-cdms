import React, { useEffect, useMemo, useState } from "react";
import {
  getTreatments,
  addTreatment,
  updateTreatment,
  getMedicines
} from "../api/masterApi";

// --- HELPERS ---
function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatDateDisplay(value) {
  if (!value) return "";
  // Check if it's already ISO Date string
  const d = new Date(value);
  if (!isNaN(d.getTime())) {
     const day = String(d.getDate()).padStart(2, '0');
     const mon = String(d.getMonth() + 1).padStart(2, '0');
     const year = d.getFullYear();
     return `${day}-${mon}-${year}`;
  }
  return String(value);
}

const DISEASE_OPTIONS = [
  "Anemic", "Back Left Leg fracture", "Back Right Leg fracture", "Bloating",
  "Broken Horn", "Bronchitis", "Fever", "Front Left Leg fracture",
  "Front Right Leg fracture", "Indigestion", "Inflammation", "Injury",
  "Pneumonia", "Skin Infection", "Sprain, Limping", "Weakness", "Wound",
  "Lumpy Skin Disease (LSD)", "Mastitis", "Metritis / Pyometra",
  "Retained Placenta", "Udder Edema"
];

export default function Treatment() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]); 
  const [loading, setLoading] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [mode, setMode] = useState("add"); 
  const [editingId, setEditingId] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // --- FETCH DATA ---
  useEffect(() => {
    loadData();
  }, []); 

  async function loadData() {
    try {
      setLoading(true);
      
      // 1. Fetch Medicines List
      const mData = await getMedicines();
      // Handle Wrapper
      if (mData && mData.data && Array.isArray(mData.data)) {
         setMedicinesList(mData.data);
      } else if (Array.isArray(mData)) {
         setMedicinesList(mData);
      }

      // 2. Fetch Treatments
      const tData = await getTreatments();
      
      // 🔥 FIX: Handle Wrapper Object
      let rawList = [];
      if (tData && tData.data && Array.isArray(tData.data)) {
          rawList = tData.data;
      } else if (Array.isArray(tData)) {
          rawList = tData;
      }

      const normalised = rawList.map((row) => ({
        id: row.id,
        cattleId: row.cattleId,
        date: row.date,
        diseaseSymptoms: row.diseaseSymptoms,
        medicine: row.medicine,
        doctorName: row.doctorName,
        photoUrl: row.photoUrl,
        remarks: row.remarks,
      }));
      
      normalised.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRows(normalised);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Filter by Month
  const filteredRows = useMemo(() => rows.filter((r) => {
      if (!r.date) return false;
      return String(r.date).startsWith(month);
  }), [rows, month]);

  function getEmptyForm() {
    return {
      cattleId: "",
      date: month + "-01", 
      diseaseSymptoms: [],
      medicine: [],
      doctorName: "",
      photoUrl: "",
      remarks: "",
    };
  }

  function openFormForAdd() {
    setMode("add");
    setEditingId(null);
    setForm(getEmptyForm());
    setShowForm(true);
  }

  function openFormForEdit(entry) {
    setMode("edit");
    setEditingId(entry.id);
    
    const toArray = (str) => str ? String(str).split(",").map(s=>s.trim()).filter(Boolean) : [];

    setForm({
      cattleId: entry.cattleId || "",
      date: entry.date,
      diseaseSymptoms: toArray(entry.diseaseSymptoms),
      medicine: toArray(entry.medicine),
      doctorName: entry.doctorName || "",
      photoUrl: entry.photoUrl || "",
      remarks: entry.remarks || "",
    });
    setShowForm(true);
  }

  function handleMultiChange(e, field) {
    const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
    setForm(prev => ({ ...prev, [field]: selected }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      id: editingId,
      ...form,
      diseaseSymptoms: form.diseaseSymptoms.join(", "),
      medicine: form.medicine.join(", ")
    };

    try {
      if (mode === "add") await addTreatment(payload);
      else await updateTreatment(payload);
      
      setShowForm(false);
      loadData(); 
      alert("Saved Successfully!");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0, color: "#1f2937" }}>Medical Treatment</h1>
        
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <input 
            type="month" 
            value={month} 
            onChange={e => setMonth(e.target.value)} 
            className="form-input"
            style={{ width: "auto", padding: "0.5rem" }} 
          />
          <button onClick={openFormForAdd} className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>+ Add Entry</button>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}> {/* 🔥 SCROLLABLE */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: "800px" }}>
            <thead style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Cattle ID</th>
                <th style={thStyle}>Disease</th>
                <th style={thStyle}>Medicine</th>
                <th style={thStyle}>Doctor</th>
                <th style={{...thStyle, textAlign:"center"}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? ( <tr><td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading...</td></tr> ) : 
               filteredRows.length === 0 ? ( <tr><td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>No entries for this month</td></tr> ) : (
               filteredRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                  <td style={tdStyle}>{formatDateDisplay(row.date)}</td>
                  <td style={tdStyle}><strong>{row.cattleId}</strong></td>
                  <td style={tdStyle}>{row.diseaseSymptoms}</td>
                  <td style={tdStyle}>{row.medicine}</td>
                  <td style={tdStyle}>{row.doctorName}</td>
                  <td style={{...tdStyle, textAlign:"center"}}>
                     <div style={{display:"flex", gap:"5px", justifyContent:"center"}}>
                         <button onClick={() => setSelectedEntry(row)} style={iconBtnStyle} title="View Details">👁️</button>
                         <button onClick={() => openFormForEdit(row)} style={iconBtnStyle} title="Edit Entry">✏️</button>
                     </div>
                  </td>
                </tr>
              ))
             )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={overlayStyle} onClick={() => setShowForm(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem", color:"#111827" }}>{mode === "add" ? "Add" : "Edit"} Treatment</h2>
            
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
               <div className="responsive-grid">
                  <Field label="Cattle ID">
                     <input type="text" name="cattleId" value={form.cattleId} onChange={handleChange} className="form-input" required />
                  </Field>
                  <Field label="Date">
                     <input type="date" name="date" value={form.date} onChange={handleChange} className="form-input" required />
                  </Field>
               </div>

               <Field label="Disease / Symptoms (Hold Ctrl to select multiple)">
                  <select multiple value={form.diseaseSymptoms} onChange={e => handleMultiChange(e, 'diseaseSymptoms')} className="form-select" style={{ height:"120px" }}>
                     {DISEASE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
               </Field>

               <Field label="Medicines (Hold Ctrl to select multiple)">
                  <select multiple value={form.medicine} onChange={e => handleMultiChange(e, 'medicine')} className="form-select" style={{ height:"120px" }}>
                     {medicinesList.length > 0 ? (
                        medicinesList.map((med, i) => <option key={i} value={typeof med === 'object' ? med.name : med}>{typeof med === 'object' ? med.name : med}</option>)
                     ) : (
                        <option disabled>Loading medicines...</option>
                     )}
                  </select>
               </Field>

               <Field label="Doctor Name">
                  <input type="text" name="doctorName" value={form.doctorName} onChange={handleChange} className="form-input" />
               </Field>
               
               <Field label="Remarks">
                  <input type="text" name="remarks" value={form.remarks} onChange={handleChange} className="form-input" />
               </Field>

               <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary btn-full-mobile">Cancel</button>
                  <button type="submit" disabled={loading} className="btn btn-primary btn-full-mobile">Save</button>
               </div>
            </form>
          </div>
        </div>
      )}
      
      {/* View Modal */}
      {selectedEntry && (
        <div style={overlayStyle} onClick={() => setSelectedEntry(null)}>
           <div style={modalStyle} onClick={e => e.stopPropagation()}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #eee", paddingBottom:"10px", marginBottom:"15px"}}>
                  <h2 style={{ margin:0, fontSize:"1.2rem" }}>Details: {selectedEntry.cattleId}</h2>
                  <button onClick={() => setSelectedEntry(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", color: "#6b7280", cursor: "pointer" }}>&times;</button>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", fontSize:"0.95rem" }}>
                 <DetailItem label="Date" value={formatDateDisplay(selectedEntry.date)} />
                 <DetailItem label="Cattle ID" value={selectedEntry.cattleId} isBold />
                 <div style={{ gridColumn: "1 / -1" }}>
                    <DetailItem label="Disease" value={selectedEntry.diseaseSymptoms} />
                 </div>
                 <div style={{ gridColumn: "1 / -1" }}>
                    <DetailItem label="Medicine" value={selectedEntry.medicine} />
                 </div>
                 <DetailItem label="Doctor" value={selectedEntry.doctorName} />
                 <div style={{ gridColumn: "1 / -1" }}>
                    <DetailItem label="Remarks" value={selectedEntry.remarks} />
                 </div>
              </div>
              
              <div style={{marginTop:"20px", display:"flex", justifyContent:"flex-end", gap: "1rem"}}>
                  <button onClick={() => { setSelectedEntry(null); openFormForEdit(selectedEntry); }} className="btn btn-primary">Edit This Entry</button>
                  <button onClick={() => setSelectedEntry(null)} className="btn btn-secondary">Close</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- Styles & Components ---
const thStyle = { padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.8rem", color: "#4b5563", textTransform: "uppercase" };
const tdStyle = { padding: "0.8rem 1rem", borderBottom: "1px solid #f3f4f6", color: "#1f2937" };
const iconBtnStyle = { background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "0 0.3rem" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50, padding: "1rem" };
const modalStyle = { background: "white", padding: "1.5rem", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight:"90vh", overflowY:"auto", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };

function Field({ label, children }) { 
    return <div style={{ marginBottom: "0.5rem" }}><label style={{ display: "block", fontSize: "0.8rem", color: "#374151", marginBottom: "0.3rem", fontWeight:"600" }}>{label}</label>{children}</div>; 
}

function DetailItem({ label, value, isBold }) { 
    return (
        <div style={{borderBottom:"1px dashed #eee", paddingBottom:"5px"}}>
            <div style={{fontSize:"0.75rem", color:"#6b7280", textTransform:"uppercase", fontWeight: "bold"}}>{label}</div>
            <div style={{ fontWeight: isBold ? "700" : "500", fontSize: isBold ? "1.1rem" : "1rem", color: "#111" }}>{value || "-"}</div>
        </div>
    ); 
}