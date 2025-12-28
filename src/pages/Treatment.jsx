// src/pages/Treatment.jsx
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
  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d}-${m}-${y}`;
  }
  return String(value);
}

const DISEASE_OPTIONS = [
  "Anemic", "Back Left Leg fracture", "Back Right Leg fracture", "Bloating",
  "Broken Horn", "Bronchitis", "Fever", "Front Left Leg fracture",
  "Front Right Leg fracture", "Indigestion", "Inflammation", "Injury",
  "Pneumonia", "Skin Infection", "Sprain, Limping", "Weakness", "Wound",
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
  }, []); // Initial Load

  async function loadData() {
    try {
      setLoading(true);
      
      // 1. Fetch Medicines List
      const mData = await getMedicines();
      if (Array.isArray(mData)) setMedicinesList(mData);

      // 2. Fetch Treatments
      const tData = await getTreatments();
      const normalised = (tData || []).map((row) => ({
        id: row.id,
        cattleId: row.cattleId,
        date: row.date,
        diseaseSymptoms: row.diseaseSymptoms,
        medicine: row.medicine,
        doctorName: row.doctorName,
        photoUrl: row.photoUrl,
        remarks: row.remarks,
      }));
      
      // Sort by Date Descending
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
    
    // Helper to split comma string to array
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
    <div style={{ padding: "1.5rem 2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>Medical Treatment</h1>
        <div style={{ display: "flex", gap: "1rem" }}>
           <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={inputStyle} />
           <button onClick={openFormForAdd} style={btnAddStyle}>+ Add Entry</button>
        </div>
      </header>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#f9fafb", textAlign: "left" }}>
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
            {filteredRows.length === 0 ? <tr><td colSpan={6} style={emptyStyle}>No entries for this month</td></tr> : 
             filteredRows.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={tdStyle}>{formatDateDisplay(row.date)}</td>
                <td style={tdStyle}>{row.cattleId}</td>
                <td style={tdStyle}>{row.diseaseSymptoms}</td>
                <td style={tdStyle}>{row.medicine}</td>
                <td style={tdStyle}>{row.doctorName}</td>
                <td style={{...tdStyle, textAlign:"center"}}>
                   <button onClick={() => setSelectedEntry(row)} style={viewBtnStyle}>👁️</button>
                   <button onClick={() => openFormForEdit(row)} style={editBtnStyle}>✏️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={overlayStyle} onClick={() => setShowForm(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: "1rem" }}>{mode === "add" ? "Add" : "Edit"} Treatment</h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
               <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                  <Field label="Cattle ID">
                     <input type="text" name="cattleId" value={form.cattleId} onChange={handleChange} style={inputStyle} required />
                  </Field>
                  <Field label="Date">
                     <input type="date" name="date" value={form.date} onChange={handleChange} style={inputStyle} required />
                  </Field>
               </div>

               <Field label="Disease / Symptoms (Select Multiple)">
                  <select multiple value={form.diseaseSymptoms} onChange={e => handleMultiChange(e, 'diseaseSymptoms')} style={{...inputStyle, height:"100px"}}>
                     {DISEASE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
               </Field>

               <Field label="Medicines (Select Multiple)">
                  <select multiple value={form.medicine} onChange={e => handleMultiChange(e, 'medicine')} style={{...inputStyle, height:"100px"}}>
                     {medicinesList.length > 0 ? (
                        medicinesList.map((med, i) => <option key={i} value={med}>{med}</option>)
                     ) : (
                        <option disabled>Loading medicines...</option>
                     )}
                  </select>
               </Field>

               <Field label="Doctor Name">
                  <input type="text" name="doctorName" value={form.doctorName} onChange={handleChange} style={inputStyle} />
               </Field>
               
               <Field label="Remarks">
                  <input type="text" name="remarks" value={form.remarks} onChange={handleChange} style={inputStyle} />
               </Field>

               <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                  <button type="button" onClick={() => setShowForm(false)} style={btnCancelStyle}>Cancel</button>
                  <button type="submit" disabled={loading} style={btnSaveStyle}>Save</button>
               </div>
            </form>
          </div>
        </div>
      )}
      
      {/* View Modal */}
      {selectedEntry && (
        <div style={overlayStyle} onClick={() => setSelectedEntry(null)}>
           <div style={viewModalStyle} onClick={e => e.stopPropagation()}>
              <h2 style={{ marginBottom:"1rem", borderBottom:"1px solid #eee", paddingBottom:"0.5rem" }}>
                 Details: {selectedEntry.cattleId}
              </h2>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                 <DetailItem label="Date" value={formatDateDisplay(selectedEntry.date)} />
                 <DetailItem label="Cattle ID" value={selectedEntry.cattleId} />
                 <DetailItem label="Disease" value={selectedEntry.diseaseSymptoms} />
                 <DetailItem label="Medicine" value={selectedEntry.medicine} />
                 <DetailItem label="Doctor" value={selectedEntry.doctorName} />
                 <DetailItem label="Remarks" value={selectedEntry.remarks} />
              </div>
              <div style={{marginTop:"1rem", textAlign:"right"}}>
                 <button onClick={() => setSelectedEntry(null)} style={btnCancelStyle}>Close</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- Styles ---
const btnAddStyle = { background: "#16a34a", color: "white", padding: "0.5rem 1rem", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600" };
const thStyle = { padding: "0.8rem 1rem", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: "0.8rem", color: "#475569" };
const tdStyle = { padding: "0.8rem 1rem", borderBottom: "1px solid #e5e7eb", color: "#111827" };
const emptyStyle = { padding: "2rem", textAlign: "center", color: "#6b7280" };
const viewBtnStyle = { border: "none", borderRadius: "6px", padding: "0.3rem 0.6rem", background: "#eff6ff", color: "#1d4ed8", fontSize: "0.9rem", cursor: "pointer", marginRight:"5px" };
const editBtnStyle = { border: "none", borderRadius: "6px", padding: "0.3rem 0.6rem", background: "#fff7ed", color: "#c2410c", fontSize: "0.9rem", cursor: "pointer" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50 };
const modalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "95%", maxWidth: "500px", maxHeight:"90vh", overflowY:"auto" };
const viewModalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "95%", maxWidth: "600px" };
const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.95rem" };
const btnCancelStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", cursor: "pointer" };
const btnSaveStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "none", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" };
function Field({ label, children }) { return <div><label style={{ display: "block", fontSize: "0.85rem", color: "#374151", marginBottom: "0.25rem" }}>{label}</label>{children}</div>; }
function DetailItem({ label, value }) { return <div style={{borderBottom:"1px dashed #eee", paddingBottom:"5px"}}><div style={{fontSize:"0.75rem", color:"#666"}}>{label}</div><div style={{fontWeight:"500"}}>{value || "-"}</div></div>; }