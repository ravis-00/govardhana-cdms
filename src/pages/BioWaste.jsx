// src/pages/BioWaste.jsx
import React, { useEffect, useState } from "react";
// Ensure these are correctly exported from your masterApi.js
import { getBioWaste, addBioWaste, updateBioWaste } from "../api/masterApi";

// --- HELPERS ---
function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB"); // dd/mm/yyyy
}

export default function BioWaste() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState({});

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
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      // alert("Failed to load data"); 
    } finally {
      setLoading(false);
    }
  }

  // --- HANDLERS ---
  function openAddModal() {
    setIsEditMode(false);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      sourceShed: "",
      wasteType: "Dung (Gomaya)", // Default
      quantity: "",
      unit: "Kg",
      destination: "", // e.g. "Compost Unit"
      receiver: "",
      sender: "",
      remarks: ""
    });
    setShowModal(true);
  }

  function openEditModal(row) {
    setIsEditMode(true);
    // Handle date format for input
    const dateStr = row.date ? row.date.split('T')[0] : "";
    setForm({ ...row, date: dateStr });
    setShowModal(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if(isEditMode) await updateBioWaste(form);
      else await addBioWaste(form);
      
      setShowModal(false);
      loadData(); // Refresh table
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1f2937" }}>Bio Waste Management</h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <input 
            type="month" 
            value={month} 
            onChange={e => setMonth(e.target.value)} 
            style={inputStyle} 
          />
          <button onClick={openAddModal} style={btnAddStyle}>+ Add Entry</button>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</div>
        ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead style={{ background: "#f9fafb", color: "#374151", textTransform: "uppercase", fontSize: "0.75rem" }}>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Source Shed</th>
                  <th style={thStyle}>Waste Type</th>
                  <th style={thStyle}>Quantity</th>
                  <th style={thStyle}>Destination</th>
                  <th style={thStyle}>Sender &rarr; Receiver</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No records found.</td></tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={tdStyle}>{formatDate(row.date)}</td>
                      <td style={tdStyle}>{row.sourceShed}</td>
                      <td style={tdStyle}>
                        <span style={badgeStyle}>{row.wasteType}</span>
                      </td>
                      <td style={tdStyle}>{row.quantity} {row.unit}</td>
                      <td style={tdStyle}>{row.destination}</td>
                      <td style={tdStyle}>
                        <div style={{fontSize:"0.8rem", color:"#4b5563"}}>{row.sender || "-"}</div>
                        <div style={{fontSize:"0.8rem", fontWeight:"bold"}}>&darr; {row.receiver || "-"}</div>
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => openEditModal(row)} style={iconBtnStyle} title="Edit">✏️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        )}
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div style={overlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: "1rem", color:"#111827" }}>{isEditMode ? "Edit" : "Add"} Bio Waste</h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field label="Date">
                   <input type="date" name="date" value={form.date} onChange={handleChange} style={inputStyle} required />
                </Field>
                <Field label="Source Shed">
                   <select name="sourceShed" value={form.sourceShed} onChange={handleChange} style={inputStyle}>
                      <option value="">-- Select --</option>
                      <option value="Goshala-1">Goshala-1</option>
                      <option value="Goshala-2">Goshala-2</option>
                      <option value="Quarantine">Quarantine</option>
                   </select>
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
                    <div style={{width: "90px"}}>
                        <Field label="Unit">
                           <select name="unit" value={form.unit} onChange={handleChange} style={inputStyle}>
                              <option value="Kg">Kg</option>
                              <option value="Liters">L</option>
                              <option value="Load">Load</option>
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
                <button type="submit" disabled={loading} style={btnSaveStyle}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES & COMPONENTS
const btnAddStyle = { background: "#16a34a", color: "white", padding: "0.5rem 1rem", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600" };
const thStyle = { padding: "1rem", textAlign: "left", fontWeight: "600", color: "#4b5563" };
const tdStyle = { padding: "0.8rem 1rem", color: "#1f2937", borderBottom: "1px solid #f3f4f6" };
const iconBtnStyle = { background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" };
const badgeStyle = { background: "#e0f2fe", color: "#0369a1", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50 };
const modalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "550px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };
const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.95rem" };
const btnCancelStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", cursor: "pointer" };
const btnSaveStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "none", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" };

function Field({ label, children }) { 
    return <div><label style={{ display: "block", fontSize: "0.85rem", color: "#374151", marginBottom: "0.25rem" }}>{label}</label>{children}</div>; 
}