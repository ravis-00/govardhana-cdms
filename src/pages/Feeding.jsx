import React, { useEffect, useMemo, useState } from "react";
import { getFeeding, addFeeding, updateFeeding } from "../api/masterApi"; 

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
  return `${d}-${m}-${y}`; 
}

function getEmptyForm() {
  return {
    date: "",
    feedType: "General Mix",
    recordedBy: "",
    nandini: "", surabhi: "", kaveri: "", 
    kamadhenu: "", jayadeva: "", nandiniOld: "",
    totalKg: "", remarks: "",
  };
}

export default function Feeding() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [selectedEntry, setSelectedEntry] = useState(null);
  
  useEffect(() => {
    loadData();
  }, [month]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await getFeeding(); 
      
      // 🔥 FIX: Handle API Wrapper Object
      let rawData = [];
      if (res && res.data && Array.isArray(res.data)) {
          rawData = res.data;
      } else if (Array.isArray(res)) {
          rawData = res;
      }

      // Group by Date logic
      const grouped = {};
      rawData.forEach(item => {
          const dateKey = item.date ? item.date.split('T')[0] : "unknown";
          
          if (!grouped[dateKey]) {
              grouped[dateKey] = { 
                  id: dateKey, date: dateKey, 
                  feedType: item.feedType || "", 
                  recordedBy: item.recordedBy || "", 
                  nandini: 0, surabhi: 0, kaveri: 0, kamadhenu: 0, jayadeva: 0, nandiniOld: 0, 
                  totalKg: 0, remarks: item.remarks || "" 
              };
          }
          
          const shed = (item.shedName || "").toLowerCase().trim();
          const qty = Number(item.quantityKg || 0);
          
          if (shed.includes("nandini") && !shed.includes("old")) grouped[dateKey].nandini += qty;
          else if (shed.includes("surabhi")) grouped[dateKey].surabhi += qty;
          else if (shed.includes("kaveri")) grouped[dateKey].kaveri += qty;
          else if (shed.includes("kamadhenu")) grouped[dateKey].kamadhenu += qty;
          else if (shed.includes("jayadeva")) grouped[dateKey].jayadeva += qty;
          else if (shed.includes("old")) grouped[dateKey].nandiniOld += qty;
          
          grouped[dateKey].totalKg += qty;
          
          // Preserve last non-empty metadata
          if(!grouped[dateKey].feedType && item.feedType) grouped[dateKey].feedType = item.feedType;
          if(!grouped[dateKey].recordedBy && item.recordedBy) grouped[dateKey].recordedBy = item.recordedBy;
      });

      const processedRows = Object.values(grouped).sort((a,b) => new Date(b.date) - new Date(a.date));
      setRows(processedRows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = useMemo(
    () => rows.filter((r) => (r.date || "").startsWith(month)),
    [rows, month]
  );

  function openAddForm() {
    setIsEditMode(false);
    setForm({ ...getEmptyForm(), date: month + "-01" });
    setShowForm(true);
  }

  function openEditForm(row) {
    setIsEditMode(true);
    setForm({
      date: row.date,
      feedType: row.feedType || "General Mix",
      recordedBy: row.recordedBy || "",
      nandini: row.nandini, surabhi: row.surabhi, kaveri: row.kaveri,
      kamadhenu: row.kamadhenu, jayadeva: row.jayadeva, nandiniOld: row.nandiniOld,
      totalKg: row.totalKg, remarks: row.remarks
    });
    setShowForm(true);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      const numericFields = ["nandini", "surabhi", "kaveri", "kamadhenu", "jayadeva", "nandiniOld"];
      if (numericFields.includes(name)) {
        updated.totalKg = numericFields.reduce((sum, key) => sum + Number(updated[key] || 0), 0);
      }
      return updated;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (isEditMode) {
        await updateFeeding(form); 
        alert("Feeding Data Updated!");
      } else {
        await addFeeding(form);
        alert("Feeding Data Saved!");
      }
      setShowForm(false);
      loadData(); 
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0, color: "#1f2937" }}>Nutrition & Feeding</h1>
        
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <input 
            type="month" 
            value={month} 
            onChange={(e) => setMonth(e.target.value)} 
            className="form-input"
            style={{ width: "auto", padding: "0.5rem" }} 
          />
          <button type="button" onClick={openAddForm} className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>+ Add Entry</button>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}> {/* 🔥 SCROLLABLE CONTAINER */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: "900px" }}>
            <thead style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Nandini (kg)</th> 
                <th style={thStyle}>Surabhi (kg)</th> 
                <th style={thStyle}>Kaveri (kg)</th>
                <th style={thStyle}>Kamadhenu (kg)</th> 
                <th style={thStyle}>Jayadeva (kg)</th> 
                <th style={thStyle}>Old Shed (kg)</th>
                <th style={thStyle}>Total (kg)</th> 
                <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? ( <tr><td colSpan={9} style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading...</td></tr> ) : 
               filteredRows.length === 0 ? ( <tr><td colSpan={9} style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>No entries found for {month}.</td></tr> ) : (
               filteredRows.map((row, idx) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={tdStyle}><strong>{formatDisplayDate(row.date)}</strong></td>
                  <td style={tdStyle}>{row.nandini}</td> 
                  <td style={tdStyle}>{row.surabhi}</td> 
                  <td style={tdStyle}>{row.kaveri}</td>
                  <td style={tdStyle}>{row.kamadhenu}</td> 
                  <td style={tdStyle}>{row.jayadeva}</td> 
                  <td style={tdStyle}>{row.nandiniOld}</td>
                  <td style={{...tdStyle, fontWeight:"bold", color:"#166534"}}>{row.totalKg}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <div style={{display:"flex", gap:"5px", justifyContent:"center"}}>
                        <button type="button" onClick={() => setSelectedEntry(row)} style={iconBtnStyle}>👁️</button>
                        <button type="button" onClick={() => openEditForm(row)} style={iconBtnStyle}>✏️</button>
                    </div>
                  </td>
                </tr>
              ))
             )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div style={overlayStyle} onClick={() => setShowForm(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem" }}>{isEditMode ? "Edit" : "Add"} Feeding Entry</h2>
            
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <div className="responsive-grid">
                  <Field label="Date *"><input type="date" name="date" value={form.date} onChange={handleFormChange} className="form-input" required disabled={isEditMode} /></Field>
                  <Field label="Feed Type"><input type="text" name="feedType" value={form.feedType} placeholder="e.g. TMR / Green" onChange={handleFormChange} className="form-input" /></Field>
              </div>
              
              <Field label="Recorded By"><input type="text" name="recordedBy" value={form.recordedBy} placeholder="Enter Name" onChange={handleFormChange} className="form-input" /></Field>
              
              <div style={{ borderTop: "1px solid #eee", paddingTop: "1rem", marginTop: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#2563eb", marginBottom: "0.8rem", display: "block" }}>SHED QUANTITIES (KG)</label>
                {/* 🔥 RESPONSIVE GRID FOR INPUTS */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
                    <NumberField label="Nandini" name="nandini" value={form.nandini} onChange={handleFormChange} />
                    <NumberField label="Surabhi" name="surabhi" value={form.surabhi} onChange={handleFormChange} />
                    <NumberField label="Kaveri" name="kaveri" value={form.kaveri} onChange={handleFormChange} />
                    <NumberField label="Kamadhenu" name="kamadhenu" value={form.kamadhenu} onChange={handleFormChange} />
                    <NumberField label="Jayadeva" name="jayadeva" value={form.jayadeva} onChange={handleFormChange} />
                    <NumberField label="Nandini Old" name="nandiniOld" value={form.nandiniOld} onChange={handleFormChange} />
                </div>
              </div>

              <div style={{ background: "#f0fdf4", padding: "1rem", borderRadius: "8px", marginTop: "0.5rem" }}>
                 <NumberField label="Total Feeding (Auto Calculated)" name="totalKg" value={form.totalKg} onChange={handleFormChange} disabled />
              </div>

              <Field label="Remarks"><input type="text" name="remarks" value={form.remarks} onChange={handleFormChange} className="form-input" /></Field>
              
              <div style={{display:"flex", justifyContent:"flex-end", gap:"1rem", marginTop:"1rem"}}>
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary btn-full-mobile">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-full-mobile">{isEditMode ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {selectedEntry && (
        <div style={overlayStyle} onClick={() => setSelectedEntry(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #eee", paddingBottom:"10px", marginBottom:"15px"}}>
                <h2 style={{ margin:0, fontSize: "1.2rem" }}>Details: {formatDisplayDate(selectedEntry.date)}</h2>
                <button onClick={() => setSelectedEntry(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", color: "#6b7280", cursor: "pointer" }}>&times;</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", fontSize:"0.9rem" }}>
               <DetailItem label="Feed Type" value={selectedEntry.feedType} />
               <DetailItem label="Recorded By" value={selectedEntry.recordedBy} />
               
               <DetailItem label="Nandini Shed" value={selectedEntry.nandini} />
               <DetailItem label="Surabhi Shed" value={selectedEntry.surabhi} />
               <DetailItem label="Kaveri Shed" value={selectedEntry.kaveri} />
               <DetailItem label="Kamadhenu Shed" value={selectedEntry.kamadhenu} />
               <DetailItem label="Jayadeva Shed" value={selectedEntry.jayadeva} />
               <DetailItem label="Nandini Old Shed" value={selectedEntry.nandiniOld} />
               
               <div style={{ gridColumn: "1 / -1", background: "#f9fafb", padding: "0.5rem", borderRadius: "6px" }}>
                 <DetailItem label="Total Quantity" value={selectedEntry.totalKg} isBold={true} />
               </div>
               <div style={{ gridColumn: "1 / -1" }}>
                 <DetailItem label="Remarks" value={selectedEntry.remarks} />
               </div>
            </div>
            
            <div style={{marginTop:"1.5rem", display:"flex", justifyContent:"flex-end", gap: "1rem"}}>
                <button onClick={() => setSelectedEntry(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES & COMPONENTS ---
function Field({ label, children }) { return <div style={{ marginBottom: "0.5rem" }}><label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.3rem", fontWeight:"600", color: "#374151" }}>{label}</label>{children}</div>; }
function NumberField({ label, name, value, onChange, disabled }) { return <Field label={label}><input type="number" step="0.01" name={name} value={value} onChange={onChange} className="form-input" disabled={disabled} /></Field>; }
function DetailItem({ label, value, isBold }) { return <div><div style={{fontSize:"0.75rem", color:"#6b7280", textTransform:"uppercase", fontWeight: "bold"}}>{label}</div><div style={{fontWeight: isBold ? "700" : "500", color:"#111", fontSize: isBold ? "1.1rem" : "1rem"}}>{value || "-"} {Number(value) ? "kg" : ""}</div></div>; }

const thStyle = { padding: "1rem", textAlign: "left", fontWeight: "600", color: "#4b5563", fontSize: "0.8rem", textTransform: "uppercase" };
const tdStyle = { padding: "0.8rem 1rem", color: "#1f2937", borderBottom: "1px solid #f3f4f6" };
const iconBtnStyle = { background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "0 0.3rem" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50, padding: "1rem" };
const modalStyle = { background: "white", padding: "1.5rem", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };