// src/pages/Feeding.jsx
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
      const rawData = await getFeeding(); 
      const grouped = {};
      (rawData || []).forEach(item => {
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
    <div style={{ padding: "1.5rem 2rem" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>Feeding</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.15rem", color: "#6b7280" }}>Month</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={headerInputStyle} />
          </div>
          <button type="button" onClick={openAddForm} style={addBtnStyle}>+ Add Entry</button>
        </div>
      </header>
      <div style={{ background: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#f1f5f9", textAlign: "left" }}>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Nandini (kg)</th> <th style={thStyle}>Surabhi (kg)</th> <th style={thStyle}>Kaveri (kg)</th>
              <th style={thStyle}>Kamadhenu (kg)</th> <th style={thStyle}>Jayadeva (kg)</th> <th style={thStyle}>Old Shed (kg)</th>
              <th style={thStyle}>Total (kg)</th> <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? ( <tr><td colSpan={9} style={emptyStyle}>Loading...</td></tr> ) : 
             filteredRows.length === 0 ? ( <tr><td colSpan={9} style={emptyStyle}>No entries for this month.</td></tr> ) : (
              filteredRows.map((row, idx) => (
                <tr key={row.id} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                  <td style={tdStyle}><strong>{formatDisplayDate(row.date)}</strong></td>
                  <td style={tdStyle}>{row.nandini}</td> <td style={tdStyle}>{row.surabhi}</td> <td style={tdStyle}>{row.kaveri}</td>
                  <td style={tdStyle}>{row.kamadhenu}</td> <td style={tdStyle}>{row.jayadeva}</td> <td style={tdStyle}>{row.nandiniOld}</td>
                  <td style={{...tdStyle, fontWeight:"bold"}}>{row.totalKg}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <div style={{display:"flex", gap:"5px", justifyContent:"center"}}>
                        <button type="button" onClick={() => setSelectedEntry(row)} style={viewBtnStyle}>👁️</button>
                        <button type="button" onClick={() => openEditForm(row)} style={editBtnStyle}>✏️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div style={overlayStyle} onClick={() => setShowForm(false)}>
          <div style={formModalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem" }}>{isEditMode ? "Edit" : "Add"} Daily Feeding</h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.85rem" }}>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px"}}>
                  <Field label="Date *"><input type="date" name="date" value={form.date} onChange={handleFormChange} style={inputStyle} required disabled={isEditMode} /></Field>
                  <Field label="Feed Type"><input type="text" name="feedType" value={form.feedType} placeholder="e.g. TMR / Green" onChange={handleFormChange} style={inputStyle} /></Field>
              </div>
              <Field label="Recorded By"><input type="text" name="recordedBy" value={form.recordedBy} placeholder="Enter Name" onChange={handleFormChange} style={inputStyle} /></Field>
              <h4 style={{margin:"0.5rem 0 0", color:"#2563eb", borderBottom:"1px solid #eee", paddingBottom:"5px"}}>Shed Quantities (Kg)</h4>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px"}}>
                  <NumberField label="Nandini" name="nandini" value={form.nandini} onChange={handleFormChange} />
                  <NumberField label="Surabhi" name="surabhi" value={form.surabhi} onChange={handleFormChange} />
                  <NumberField label="Kaveri" name="kaveri" value={form.kaveri} onChange={handleFormChange} />
                  <NumberField label="Kamadhenu" name="kamadhenu" value={form.kamadhenu} onChange={handleFormChange} />
                  <NumberField label="Jayadeva" name="jayadeva" value={form.jayadeva} onChange={handleFormChange} />
                  <NumberField label="Nandini Old" name="nandiniOld" value={form.nandiniOld} onChange={handleFormChange} />
              </div>
              <NumberField label="Total Feeding (Auto Calculated)" name="totalKg" value={form.totalKg} onChange={handleFormChange} />
              <Field label="Remarks"><input type="text" name="remarks" value={form.remarks} onChange={handleFormChange} style={inputStyle} /></Field>
              <div style={{display:"flex", justifyContent:"flex-end", gap:"10px", marginTop:"10px"}}>
                  <button type="button" onClick={() => setShowForm(false)} style={cancelBtnStyle}>Cancel</button>
                  <button type="submit" style={saveBtnStyle}>{isEditMode ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedEntry && (
        <div style={overlayStyle} onClick={() => setSelectedEntry(null)}>
          <div style={viewModalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #eee", paddingBottom:"10px", marginBottom:"15px"}}>
                <h2 style={{ margin:0 }}>Details: {formatDisplayDate(selectedEntry.date)}</h2>
                <button onClick={() => setSelectedEntry(null)} style={closeBtnStyle}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize:"0.95rem" }}>
               <DetailItem label="Feed Type" value={selectedEntry.feedType} />
               <DetailItem label="Recorded By" value={selectedEntry.recordedBy} />
               <DetailItem label="Nandini Shed" value={selectedEntry.nandini} />
               <DetailItem label="Surabhi Shed" value={selectedEntry.surabhi} />
               <DetailItem label="Kaveri Shed" value={selectedEntry.kaveri} />
               <DetailItem label="Kamadhenu Shed" value={selectedEntry.kamadhenu} />
               <DetailItem label="Jayadeva Shed" value={selectedEntry.jayadeva} />
               <DetailItem label="Nandini Old Shed" value={selectedEntry.nandiniOld} />
               <DetailItem label="Total Quantity" value={selectedEntry.totalKg} isBold={true} />
               <DetailItem label="Remarks" value={selectedEntry.remarks} />
            </div>
            <div style={{marginTop:"20px", display:"flex", justifyContent:"flex-end"}}>
                <button onClick={() => { setSelectedEntry(null); openEditForm(selectedEntry); }} style={editBtnStyle}>Edit This Entry</button>
            </div>
            <button onClick={() => setSelectedEntry(null)} style={{...cancelBtnStyle, marginTop:"20px", float:"right"}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) { return <div><label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.2rem", fontWeight:"500" }}>{label}</label>{children}</div>; }
function NumberField({ label, name, value, onChange }) { return <Field label={label}><input type="number" step="0.01" name={name} value={value} onChange={onChange} style={inputStyle} /></Field>; }
function DetailItem({ label, value, isBold }) { return <div style={{padding:"5px 0", borderBottom:"1px dashed #f0f0f0"}}><div style={{fontSize:"0.75rem", color:"#666", textTransform:"uppercase"}}>{label}</div><div style={{fontWeight: isBold ? "700" : "500", color:"#111", fontSize: isBold ? "1.1rem" : "1rem"}}>{value || "-"} {Number(value) ? "kg" : ""}</div></div>; }
const headerInputStyle = { padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem" };
const addBtnStyle = { padding: "0.45rem 0.95rem", borderRadius: "999px", border: "none", background: "#16a34a", color: "#ffffff", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" };
const thStyle = { padding: "0.6rem 1rem", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", color: "#475569" };
const tdStyle = { padding: "0.55rem 1rem", borderBottom: "1px solid #e5e7eb", color: "#111827" };
const emptyStyle = { padding: "0.9rem 1rem", textAlign: "center", color: "#6b7280" };
const viewBtnStyle = { border: "none", borderRadius: "6px", padding: "0.3rem 0.6rem", background: "#eff6ff", color: "#1d4ed8", fontSize: "0.9rem", cursor: "pointer" };
const editBtnStyle = { border: "none", borderRadius: "6px", padding: "0.3rem 0.6rem", background: "#fff7ed", color: "#c2410c", fontSize: "0.9rem", cursor: "pointer" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 };
const formModalStyle = { width: "95%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", background: "#ffffff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" };
const viewModalStyle = { width: "95%", maxWidth: "600px", background: "#ffffff", borderRadius: "12px", padding: "2rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" };
const inputStyle = { width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.95rem" };
const cancelBtnStyle = { padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontWeight:"500" };
const saveBtnStyle = { padding: "0.5rem 1rem", borderRadius: "6px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight:"500" };
const closeBtnStyle = { background:"none", border:"none", fontSize:"1.2rem", cursor:"pointer", color:"#666" };