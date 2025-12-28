// src/pages/BioWaste.jsx
import React, { useEffect, useState, useRef } from "react";
import { getBioWaste, addBioWaste, updateBioWaste } from "../api/masterApi";

// --- HELPERS ---
function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatDisplayDate(val) {
  if (!val) return "";
  if (String(val).match(/^\d{2}-\d{2}-\d{4}$/)) return val; 
  
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  
  const day = String(d.getDate()).padStart(2, '0');
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${mon}-${year}`;
}

// Master List of Sheds
const SHED_OPTIONS = [
  "Govardhanagiri",
  "Govardhana",
  "Kamadhenu Nilaya",
  "Surabhi Nilaya",
  "Kaveri Nilaya",
  "Jayadeva Nilaya",
  "Nandini-Old",
  "Nandini-New",
  "K K S",
  "Quarantine"
];

function getEmptyForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    sourceShed: [], // Changed to Array for Multi-Select
    wasteType: "Dung (Gomaya)",
    quantity: "",
    unit: "Tractor Load", // Updated default for practicality
    destination: "", 
    receiver: "",
    sender: "",
    remarks: ""
  };
}

export default function BioWaste() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [selectedEntry, setSelectedEntry] = useState(null); 

  // --- FETCH DATA ---
  useEffect(() => {
    loadData();
  }, [month]);

  async function loadData() {
    setLoading(true);
    try {
      const [y, m] = month.split('-');
      const fromDate = `${y}-${m}-01`;
      const toDate = `${y}-${m}-31`; 
      
      const data = await getBioWaste({ fromDate, toDate });
      
      const sorted = (Array.isArray(data) ? data : []).sort((a,b) => {
         const dA = a.date.split('-').reverse().join('-');
         const dB = b.date.split('-').reverse().join('-');
         return new Date(dB) - new Date(dA);
      });
      
      setRows(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // --- HANDLERS ---
  function openAddModal() {
    setIsEditMode(false);
    setForm(getEmptyForm());
    setShowModal(true);
  }

  function openEditModal(row) {
    setIsEditMode(true);
    
    // 1. Handle Date
    let dateStr = row.date;
    if (dateStr && dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
       const [d, m, y] = dateStr.split('-');
       dateStr = `${y}-${m}-${d}`;
    }

    // 2. Handle Multi-Select Sheds (Convert String "A, B" -> Array ["A", "B"])
    let shedArray = [];
    if (row.sourceShed) {
      shedArray = row.sourceShed.split(',').map(s => s.trim()).filter(Boolean);
    }

    setForm({ 
        ...row, 
        date: dateStr,
        sourceShed: shedArray, 
        quantity: row.quantity || "" 
    });
    setShowModal(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  // Special Handler for Multi-Select
  function handleShedChange(newShedArray) {
    setForm(prev => ({ ...prev, sourceShed: newShedArray }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert Array back to String for Backend
      const payload = {
        ...form,
        sourceShed: form.sourceShed.join(", ") 
      };

      if(isEditMode) await updateBioWaste(payload);
      else await addBioWaste(payload);
      
      setShowModal(false);
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
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0, color: "#111827" }}>Bio Waste Management</h1>
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
          <button onClick={openAddModal} style={addBtnStyle}>+ Add Entry</button>
        </div>
      </header>

      {/* TABLE */}
      <div style={{ background: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        {loading ? (
            <div style={emptyStyle}>Loading...</div>
        ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead style={{ background: "#f1f5f9", textAlign: "left" }}>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Source Shed(s)</th>
                  <th style={thStyle}>Waste Type</th>
                  <th style={thStyle}>Quantity</th>
                  <th style={thStyle}>Destination</th>
                  <th style={thStyle}>Sender &rarr; Receiver</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan="7" style={emptyStyle}>No records found for this month.</td></tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                      <td style={tdStyle}><strong>{formatDisplayDate(row.date)}</strong></td>
                      <td style={tdStyle}>{row.sourceShed}</td>
                      <td style={tdStyle}>
                        <span style={badgeStyle}>{row.wasteType}</span>
                      </td>
                      <td style={tdStyle}><strong>{row.quantity}</strong> {row.unit}</td>
                      <td style={tdStyle}>{row.destination}</td>
                      <td style={tdStyle}>
                        <div style={{fontSize:"0.8rem", color:"#4b5563"}}>{row.sender || "-"}</div>
                        <div style={{fontSize:"0.8rem", fontWeight:"bold"}}>&darr; {row.receiver || "-"}</div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <div style={{display:"flex", gap:"5px", justifyContent:"center"}}>
                            <button onClick={() => setSelectedEntry(row)} style={viewBtnStyle}>👁️ View</button>
                            <button onClick={() => openEditModal(row)} style={editBtnStyle}>✏️ Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div style={overlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem", color:"#111827" }}>{isEditMode ? "Edit" : "Add"} Bio Waste</h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field label="Date">
                   <input type="date" name="date" value={form.date} onChange={handleChange} style={inputStyle} required />
                </Field>
                
                {/* 🔥 CUSTOM MULTI-SELECT COMPONENT */}
                <Field label="Source Shed(s)">
                   <ShedMultiSelect 
                      options={SHED_OPTIONS} 
                      selected={form.sourceShed} 
                      onChange={handleShedChange} 
                   />
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                 <Field label="Waste Type">
                    <select name="wasteType" value={form.wasteType} onChange={handleChange} style={inputStyle}>
                       <option value="Dung (Gomaya)">Dung (Gomaya)</option>
                       <option value="Urine (Gomutra)">Urine (Gomutra)</option>
                       <option value="Slurry">Slurry</option>
                       <option value="Leftover Feed">Leftover Feed</option>
                       <option value="Compost (Gobbara)">Compost (Gobbara)</option>
                       <option value="Others">Others</option>
                    </select>
                 </Field>
                 <div style={{display:"flex", gap:"0.5rem"}}>
                    <div style={{flex: 1}}>
                        <Field label="Quantity">
                           <input type="number" step="0.01" name="quantity" value={form.quantity} onChange={handleChange} style={inputStyle} required />
                        </Field>
                    </div>
                    <div style={{width: "110px"}}>
                        <Field label="Unit">
                           <select name="unit" value={form.unit} onChange={handleChange} style={inputStyle}>
                              {/* 🔥 Added practical units */}
                              <option value="Tractor Load">Tractor</option>
                              <option value="Wheelbarrow">Barrow</option>
                              <option value="Kg">Kg</option>
                              <option value="Liters">L</option>
                              <option value="Tank">Tank</option>
                           </select>
                        </Field>
                    </div>
                 </div>
              </div>

              <Field label="Destination (Destination Unit)">
                  <input type="text" name="destination" value={form.destination} onChange={handleChange} style={inputStyle} placeholder="e.g. Biogas Plant, Compost Pit" />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                 <Field label="Sender (From Incharge)">
                    <input type="text" name="sender" value={form.sender} onChange={handleChange} style={inputStyle} />
                 </Field>
                 <Field label="Receiver (To Incharge)">
                    <input type="text" name="receiver" value={form.receiver} onChange={handleChange} style={inputStyle} />
                 </Field>
              </div>

              <Field label="Remarks">
                 <input type="text" name="remarks" value={form.remarks} onChange={handleChange} style={inputStyle} />
              </Field>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowModal(false)} style={btnCancelStyle}>Cancel</button>
                <button type="submit" disabled={loading} style={btnSaveStyle}>{isEditMode ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedEntry && (
        <div style={overlayStyle} onClick={() => setSelectedEntry(null)}>
          <div style={viewModalStyle} onClick={(e) => e.stopPropagation()}>
             <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #eee", paddingBottom:"10px", marginBottom:"15px"}}>
                <h2 style={{ margin:0, fontSize:"1.25rem" }}>Details: {formatDisplayDate(selectedEntry.date)}</h2>
                <button onClick={() => setSelectedEntry(null)} style={closeBtnStyle}>✕</button>
             </div>

             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize:"0.95rem" }}>
                <DetailItem label="Source Shed(s)" value={selectedEntry.sourceShed} fullWidth />
                <DetailItem label="Waste Type" value={selectedEntry.wasteType} />
                <DetailItem label="Quantity" value={`${selectedEntry.quantity} ${selectedEntry.unit}`} isBold />
                <DetailItem label="Destination" value={selectedEntry.destination} />
                <DetailItem label="Sender" value={selectedEntry.sender} />
                <DetailItem label="Receiver" value={selectedEntry.receiver} />
                <DetailItem label="Remarks" value={selectedEntry.remarks} fullWidth />
             </div>

             <div style={{marginTop:"20px", display:"flex", justifyContent:"flex-end"}}>
                <button onClick={() => { setSelectedEntry(null); openEditModal(selectedEntry); }} style={editBtnStyle}>Edit This Entry</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- NEW COMPONENT: Multi-Select Dropdown ---
function ShedMultiSelect({ options, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* The "Box" that looks like a select input */}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        style={{
          ...inputStyle,
          cursor: "pointer",
          background: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: "38px"
        }}
      >
        <span style={{ 
            color: selected.length ? "#111" : "#9ca3af", 
            whiteSpace: "nowrap", 
            overflow: "hidden", 
            textOverflow: "ellipsis",
            maxWidth: "90%"
        }}>
          {selected.length > 0 ? selected.join(", ") : "-- Select Sheds --"}
        </span>
        <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>▼</span>
      </div>

      {/* The Dropdown List */}
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          zIndex: 10,
          background: "white",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          marginTop: "4px",
          maxHeight: "200px",
          overflowY: "auto",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
        }}>
          {options.map(option => (
            <div 
              key={option} 
              onClick={() => toggleOption(option)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderBottom: "1px solid #f3f4f6",
                background: selected.includes(option) ? "#eff6ff" : "white"
              }}
            >
              <input 
                type="checkbox" 
                checked={selected.includes(option)} 
                onChange={() => {}} // Handled by div click
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: "0.9rem", color: "#374151" }}>{option}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- STYLES & COMPONENTS ---
const headerInputStyle = { padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem" };
const addBtnStyle = { padding: "0.45rem 0.95rem", borderRadius: "999px", border: "none", background: "#16a34a", color: "#ffffff", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" };
const thStyle = { padding: "0.6rem 1rem", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", color: "#475569" };
const tdStyle = { padding: "0.55rem 1rem", borderBottom: "1px solid #e5e7eb", color: "#111827" };
const emptyStyle = { padding: "2rem", textAlign: "center", color: "#6b7280" };
const badgeStyle = { background: "#e0f2fe", color: "#0369a1", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" };

const viewBtnStyle = { border: "none", borderRadius: "6px", padding: "0.3rem 0.6rem", background: "#eff6ff", color: "#1d4ed8", fontSize: "0.9rem", cursor: "pointer" };
const editBtnStyle = { border: "none", borderRadius: "6px", padding: "0.3rem 0.6rem", background: "#fff7ed", color: "#c2410c", fontSize: "0.9rem", cursor: "pointer" };

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50 };
const modalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "95%", maxWidth: "550px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", maxHeight:"90vh", overflowY:"auto" };
const viewModalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "95%", maxWidth: "600px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };
const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.95rem" };
const btnCancelStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontWeight: "500" };
const btnSaveStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "none", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" };
const closeBtnStyle = { background:"none", border:"none", fontSize:"1.2rem", cursor:"pointer", color:"#666" };

function Field({ label, children }) { 
    return <div><label style={{ display: "block", fontSize: "0.85rem", color: "#374151", marginBottom: "0.25rem", fontWeight:"500" }}>{label}</label>{children}</div>; 
}

function DetailItem({ label, value, isBold, fullWidth }) {
    return (
        <div style={{ gridColumn: fullWidth ? "span 2" : "span 1", padding:"5px 0", borderBottom:"1px dashed #f0f0f0" }}>
            <div style={{fontSize:"0.75rem", color:"#666", textTransform:"uppercase"}}>{label}</div>
            <div style={{fontWeight: isBold ? "700" : "500", color:"#111", fontSize: isBold ? "1.1rem" : "1rem"}}>{value || "-"}</div>
        </div>
    );
}