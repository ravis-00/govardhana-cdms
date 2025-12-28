// src/pages/Vaccine.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getVaccine, addVaccine, updateVaccine } from "../api/masterApi";

// --- HELPERS ---
function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatDisplayDate(value) {
  if (!value) return "";
  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d}-${m}-${y}`;
  }
  return String(value);
}

export default function Vaccine() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [selectedEntry, setSelectedEntry] = useState(null);

  // --- FETCH DATA ---
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getVaccine(); 
      const normalised = (Array.isArray(data) ? data : []).map((raw) => ({
        id: raw.id,
        date: raw.date, 
        category: raw.category || "", 
        vaccineType: raw.vaccineType || "", 
        medicine: raw.medicine || "",
        // New Fields
        targetGroup: raw.targetGroup || "",
        cowsCount: raw.cowsCount || "",
        dosage: raw.dosage || "",
        nextDueDate: raw.nextDueDate || "",
        doctorName: raw.doctorName || "",
        remarks: raw.remarks || ""
      }));
      
      // Sort desc by date
      normalised.sort((a,b) => new Date(b.date) - new Date(a.date));
      setRows(normalised);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = useMemo(() => rows.filter((r) => {
      if (!r.date) return false;
      return String(r.date).startsWith(month);
  }), [rows, month]);

  function getEmptyForm() {
    return {
      id: "",
      category: "", 
      date: month + "-01",
      vaccineType: "",
      medicine: "",
      targetGroup: "",
      cowsCount: "",
      dosage: "",
      nextDueDate: "",
      doctorName: "",
      remarks: "",
    };
  }

  function openFormForAdd() {
    setIsEditMode(false);
    setForm(getEmptyForm());
    setShowForm(true);
  }

  function openFormForEdit(entry) {
    setIsEditMode(true);
    setForm({
      id: entry.id,
      category: entry.category,
      date: entry.date,
      vaccineType: entry.vaccineType,
      medicine: entry.medicine,
      targetGroup: entry.targetGroup,
      cowsCount: entry.cowsCount,
      dosage: entry.dosage,
      nextDueDate: entry.nextDueDate,
      doctorName: entry.doctorName,
      remarks: entry.remarks,
    });
    setShowForm(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode) await updateVaccine(form);
      else await addVaccine(form);
      
      setShowForm(false);
      loadData(); 
      alert(isEditMode ? "Updated successfully" : "Added successfully");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* HEADER */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0, color: "#111827" }}>Vaccination & Deworming</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.15rem", color: "#6b7280" }}>Month</label>
            <input 
              type="month" 
              value={month} 
              onChange={e => setMonth(e.target.value)} 
              style={headerInputStyle} 
            />
          </div>
          <button onClick={openFormForAdd} style={addBtnStyle}>+ Add Entry</button>
        </div>
      </header>

      {/* TABLE */}
      <div style={{ background: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#f1f5f9", textAlign: "left" }}>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Disease / Vaccine</th>
              <th style={thStyle}>Target Group</th>
              <th style={thStyle}>Next Due</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr><td colSpan="6" style={emptyStyle}>No entries for this month.</td></tr>
            ) : (
              filteredRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                  <td style={tdStyle}><strong>{formatDisplayDate(row.date)}</strong></td>
                  <td style={tdStyle}>
                    <span style={{
                        background: row.category === "Vaccination" ? "#ecfdf5" : "#fff7ed",
                        color: row.category === "Vaccination" ? "#047857" : "#c2410c",
                        padding: "2px 8px", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "600"
                    }}>
                        {row.category}
                    </span>
                  </td>
                  <td style={tdStyle}>
                     <div>{row.vaccineType}</div>
                     <div style={{fontSize:"0.8rem", color:"#666"}}>{row.medicine}</div>
                  </td>
                  <td style={tdStyle}>
                     <div>{row.targetGroup || "-"}</div>
                     {row.cowsCount && <div style={{fontSize:"0.8rem", color:"#666"}}>Count: {row.cowsCount}</div>}
                  </td>
                  <td style={tdStyle}>{formatDisplayDate(row.nextDueDate) || "-"}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <div style={{display:"flex", gap:"5px", justifyContent:"center"}}>
                        <button onClick={() => setSelectedEntry(row)} style={viewBtnStyle}>👁️</button>
                        <button onClick={() => openFormForEdit(row)} style={editBtnStyle}>✏️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD/EDIT MODAL */}
      {showForm && (
        <div style={overlayStyle} onClick={() => setShowForm(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem", color:"#111827" }}>{isEditMode ? "Edit" : "Add"} Entry</h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                 <Field label="Category *">
                    <select name="category" value={form.category} onChange={handleChange} style={inputStyle} required>
                       <option value="">Select...</option>
                       <option value="Vaccination">Vaccination</option>
                       <option value="Deworming">Deworming</option>
                    </select>
                 </Field>
                 <Field label="Date *">
                    <input type="date" name="date" value={form.date} onChange={handleChange} style={inputStyle} required />
                 </Field>
              </div>

              <Field label="Disease Targeted / Vaccine Type">
                 <input type="text" name="vaccineType" value={form.vaccineType} onChange={handleChange} style={inputStyle} placeholder="e.g. FMD, Brucellosis" />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                 <Field label="Medicine Brand">
                    <input type="text" name="medicine" value={form.medicine} onChange={handleChange} style={inputStyle} placeholder="e.g. Ivermectin" />
                 </Field>
                 <Field label="Dosage Per Cow">
                    <input type="text" name="dosage" value={form.dosage} onChange={handleChange} style={inputStyle} placeholder="e.g. 5ml" />
                 </Field>
              </div>

              <Field label="Target Group">
                 <input type="text" name="targetGroup" value={form.targetGroup} onChange={handleChange} style={inputStyle} placeholder="e.g. All Cows, Calves Only" />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                 <Field label="Cows Count">
                    <input type="number" name="cowsCount" value={form.cowsCount} onChange={handleChange} style={inputStyle} placeholder="0" />
                 </Field>
                 <Field label="Next Due Date">
                    <input type="date" name="nextDueDate" value={form.nextDueDate} onChange={handleChange} style={inputStyle} />
                 </Field>
              </div>

              <Field label="Doctor Name">
                 <input type="text" name="doctorName" value={form.doctorName} onChange={handleChange} style={inputStyle} />
              </Field>

              <Field label="Remarks">
                 <input type="text" name="remarks" value={form.remarks} onChange={handleChange} style={inputStyle} />
              </Field>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowForm(false)} style={btnCancelStyle}>Cancel</button>
                <button type="submit" disabled={loading} style={btnSaveStyle}>{isEditMode ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {selectedEntry && (
        <div style={overlayStyle} onClick={() => setSelectedEntry(null)}>
           <div style={viewModalStyle} onClick={e => e.stopPropagation()}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #eee", paddingBottom:"10px", marginBottom:"15px"}}>
                  <h2 style={{ margin:0, fontSize:"1.25rem" }}>Details: {selectedEntry.id}</h2>
                  <button onClick={() => setSelectedEntry(null)} style={closeBtnStyle}>✕</button>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                 <DetailItem label="Date" value={formatDisplayDate(selectedEntry.date)} />
                 <DetailItem label="Category" value={selectedEntry.category} isBold />
                 
                 <DetailItem label="Disease / Vaccine" value={selectedEntry.vaccineType} />
                 <DetailItem label="Medicine Brand" value={selectedEntry.medicine} />
                 
                 <DetailItem label="Target Group" value={selectedEntry.targetGroup} />
                 <DetailItem label="Cows Count" value={selectedEntry.cowsCount} />
                 
                 <DetailItem label="Dosage" value={selectedEntry.dosage} />
                 <DetailItem label="Next Due Date" value={formatDisplayDate(selectedEntry.nextDueDate)} style={{color:"#d97706"}} />
                 
                 <DetailItem label="Doctor" value={selectedEntry.doctorName} />
                 <DetailItem label="Remarks" value={selectedEntry.remarks} />
              </div>
              <div style={{marginTop:"20px", display:"flex", justifyContent:"flex-end"}}>
                  <button onClick={() => { setSelectedEntry(null); openFormForEdit(selectedEntry); }} style={editBtnStyle}>Edit This Entry</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const headerInputStyle = { padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem" };
const addBtnStyle = { padding: "0.45rem 0.95rem", borderRadius: "999px", border: "none", background: "#16a34a", color: "#ffffff", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" };
const thStyle = { padding: "0.6rem 1rem", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: "0.8rem", color: "#475569", textTransform: "uppercase" };
const tdStyle = { padding: "0.55rem 1rem", borderBottom: "1px solid #e5e7eb", color: "#111827" };
const emptyStyle = { padding: "2rem", textAlign: "center", color: "#6b7280" };
const viewBtnStyle = { border: "none", borderRadius: "6px", padding: "0.3rem 0.6rem", background: "#eff6ff", color: "#1d4ed8", fontSize: "0.9rem", cursor: "pointer", marginRight:"5px" };
const editBtnStyle = { border: "none", borderRadius: "6px", padding: "0.3rem 0.6rem", background: "#fff7ed", color: "#c2410c", fontSize: "0.9rem", cursor: "pointer" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50 };
const modalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "95%", maxWidth: "550px", maxHeight:"90vh", overflowY:"auto", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };
const viewModalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "95%", maxWidth: "600px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };
const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.95rem" };
const btnCancelStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontWeight: "500" };
const btnSaveStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "none", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" };
const closeBtnStyle = { background:"none", border:"none", fontSize:"1.2rem", cursor:"pointer", color:"#666" };

function Field({ label, children }) { return <div><label style={{ display: "block", fontSize: "0.85rem", color: "#374151", marginBottom: "0.25rem", fontWeight:"500" }}>{label}</label>{children}</div>; }
function DetailItem({ label, value, isBold, style }) { return <div style={{borderBottom:"1px dashed #eee", paddingBottom:"5px"}}><div style={{fontSize:"0.75rem", color:"#666", textTransform:"uppercase"}}>{label}</div><div style={{fontWeight: isBold ? "700" : "500", color:"#111", fontSize: isBold ? "1.1rem" : "1rem", ...style}}>{value || "-"}</div></div>; }