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
      const res = await getVaccine(); 
      
      // 🔥 FIX: Handle API Wrapper Object
      let rawData = [];
      if (res && res.data && Array.isArray(res.data)) {
          rawData = res.data;
      } else if (Array.isArray(res)) {
          rawData = res;
      }

      const normalised = rawData.map((raw) => ({
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
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0, color: "#111827" }}>Vaccination & Deworming</h1>
        
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
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: "900px" }}>
            <thead style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
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
              {loading ? ( <tr><td colSpan="6" style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading...</td></tr> ) : 
               filteredRows.length === 0 ? ( <tr><td colSpan="6" style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>No entries for this month.</td></tr> ) : (
               filteredRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                  <td style={tdStyle}><strong>{formatDisplayDate(row.date)}</strong></td>
                  <td style={tdStyle}>
                    <span style={{
                        background: row.category === "Vaccination" ? "#ecfdf5" : "#fff7ed",
                        color: row.category === "Vaccination" ? "#047857" : "#c2410c",
                        padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold"
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
                        <button onClick={() => setSelectedEntry(row)} style={iconBtnStyle}>👁️</button>
                        <button onClick={() => openFormForEdit(row)} style={iconBtnStyle}>✏️</button>
                    </div>
                  </td>
                </tr>
              ))
             )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {showForm && (
        <div style={overlayStyle} onClick={() => setShowForm(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem", color:"#111827" }}>{isEditMode ? "Edit" : "Add"} Entry</h2>
            
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <div className="responsive-grid">
                 <Field label="Category *">
                    <select name="category" value={form.category} onChange={handleChange} className="form-select" required>
                       <option value="">Select...</option>
                       <option value="Vaccination">Vaccination</option>
                       <option value="Deworming">Deworming</option>
                    </select>
                 </Field>
                 <Field label="Date *">
                    <input type="date" name="date" value={form.date} onChange={handleChange} className="form-input" required />
                 </Field>
              </div>

              <Field label="Disease Targeted / Vaccine Type">
                 <input type="text" name="vaccineType" value={form.vaccineType} onChange={handleChange} className="form-input" placeholder="e.g. FMD, Brucellosis" />
              </Field>

              <div className="responsive-grid">
                 <Field label="Medicine Brand">
                    <input type="text" name="medicine" value={form.medicine} onChange={handleChange} className="form-input" placeholder="e.g. Ivermectin" />
                 </Field>
                 <Field label="Dosage Per Cow">
                    <input type="text" name="dosage" value={form.dosage} onChange={handleChange} className="form-input" placeholder="e.g. 5ml" />
                 </Field>
              </div>

              <Field label="Target Group">
                 <input type="text" name="targetGroup" value={form.targetGroup} onChange={handleChange} className="form-input" placeholder="e.g. All Cows, Calves Only" />
              </Field>

              <div className="responsive-grid">
                 <Field label="Cows Count">
                    <input type="number" name="cowsCount" value={form.cowsCount} onChange={handleChange} className="form-input" placeholder="0" />
                 </Field>
                 <Field label="Next Due Date">
                    <input type="date" name="nextDueDate" value={form.nextDueDate} onChange={handleChange} className="form-input" />
                 </Field>
              </div>

              <Field label="Doctor Name">
                 <input type="text" name="doctorName" value={form.doctorName} onChange={handleChange} className="form-input" />
              </Field>

              <Field label="Remarks">
                 <input type="text" name="remarks" value={form.remarks} onChange={handleChange} className="form-input" />
              </Field>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary btn-full-mobile">Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary btn-full-mobile">{isEditMode ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {selectedEntry && (
        <div style={overlayStyle} onClick={() => setSelectedEntry(null)}>
           <div style={modalStyle} onClick={e => e.stopPropagation()}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #eee", paddingBottom:"10px", marginBottom:"15px"}}>
                  <h2 style={{ margin:0, fontSize:"1.2rem" }}>Details</h2>
                  <button onClick={() => setSelectedEntry(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", color: "#6b7280", cursor: "pointer" }}>&times;</button>
              </div>
              
              <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:"1rem"}}>
                 <DetailItem label="Date" value={formatDisplayDate(selectedEntry.date)} />
                 <DetailItem label="Category" value={selectedEntry.category} isBold />
                 
                 <DetailItem label="Disease / Vaccine" value={selectedEntry.vaccineType} />
                 <DetailItem label="Medicine Brand" value={selectedEntry.medicine} />
                 
                 <DetailItem label="Target Group" value={selectedEntry.targetGroup} />
                 <DetailItem label="Cows Count" value={selectedEntry.cowsCount} />
                 
                 <DetailItem label="Dosage" value={selectedEntry.dosage} />
                 <DetailItem label="Next Due Date" value={formatDisplayDate(selectedEntry.nextDueDate)} style={{color:"#d97706", fontWeight:"bold"}} />
                 
                 <DetailItem label="Doctor" value={selectedEntry.doctorName} />
                 <div style={{ gridColumn: "1 / -1" }}>
                    <DetailItem label="Remarks" value={selectedEntry.remarks} />
                 </div>
              </div>
              
              <div style={{marginTop:"20px", display:"flex", justifyContent:"flex-end"}}>
                  <button onClick={() => { setSelectedEntry(null); openFormForEdit(selectedEntry); }} className="btn btn-primary">Edit This Entry</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES & COMPONENTS ---
const thStyle = { padding: "1rem", textAlign: "left", fontWeight: "600", fontSize: "0.8rem", color: "#4b5563", textTransform: "uppercase" };
const tdStyle = { padding: "0.8rem 1rem", borderBottom: "1px solid #f3f4f6", color: "#1f2937" };
const iconBtnStyle = { background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "0 0.3rem" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50, padding: "1rem" };
const modalStyle = { background: "white", padding: "1.5rem", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight:"90vh", overflowY:"auto", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };

function Field({ label, children }) { 
    return <div style={{ marginBottom: "0.5rem" }}><label style={{ display: "block", fontSize: "0.85rem", color: "#374151", marginBottom: "0.3rem", fontWeight:"600" }}>{label}</label>{children}</div>; 
}

function DetailItem({ label, value, isBold, style }) { 
    return (
        <div style={{borderBottom:"1px dashed #eee", paddingBottom:"5px"}}>
            <div style={{fontSize:"0.75rem", color:"#6b7280", textTransform:"uppercase", fontWeight: "bold"}}>{label}</div>
            <div style={{fontWeight: isBold ? "700" : "500", fontSize: isBold ? "1.1rem" : "1rem", color: "#111", ...style}}>{value || "-"}</div>
        </div>
    ); 
}