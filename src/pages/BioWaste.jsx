// src/pages/BioWaste.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchBioReport,
  addBioWaste,    // Ensure this is exported in masterApi.js
  updateBioWaste  // Ensure this is exported in masterApi.js
} from "../api/masterApi";
import { useAuth } from "../context/AuthContext"; // <--- 1. Import Auth

function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function extractYearMonth(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function BioWaste() {
  const { user } = useAuth(); // <--- 2. Get User Role
  const [rows, setRows] = useState([]);
  const [month, setMonth] = useState(getCurrentYearMonth());
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [editingRow, setEditingRow] = useState(null);

  // --- Load Data ---
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchBioReport();
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load Bio Waste data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // --- Filter by Month ---
  const filteredRows = useMemo(
    () => rows.filter((r) => extractYearMonth(r.date) === month),
    [rows, month]
  );

  // --- Form Actions ---
  function openAddForm() {
    setEditingRow(null);
    setForm({ ...getEmptyForm(), date: new Date().toISOString().split('T')[0] });
    setShowForm(true);
  }

  function openEditForm(row) {
    setEditingRow(row);
    setForm({
      id: row.id,
      date: row.date, // Ensure format is yyyy-MM-dd
      shed: row.shed || "",
      gaumaya: row.gaumaya || "",
      gomutra: row.gomutra || "",
      slurry: row.slurry || "",
      others: row.others || "",
      qty: row.qty || "",
      units: row.units || "",
      gobbara: row.gobbara || "",
      receiver: row.receiver || "",
      recIncharge: row.recIncharge || "",
      fromIncharge: row.fromIncharge || "",
      remarks: row.remarks || ""
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form };
    
    // Auto-generate ID if missing in add mode
    if (!editingRow) payload.id = new Date().getTime();

    try {
      setLoading(true);
      if (editingRow) {
        if(updateBioWaste) await updateBioWaste(payload);
      } else {
        if(addBioWaste) await addBioWaste(payload);
      }
      
      // Reload
      const data = await fetchBioReport();
      setRows(Array.isArray(data) ? data : []);
      closeForm();
    } catch (err) {
      console.error(err);
      setError("Failed to save entry. Check if API is implemented.");
    } finally {
      setLoading(false);
    }
  }

  const isEditMode = Boolean(editingRow);

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* HEADER */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>Bio Waste</h1>
        
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.15rem", color: "#6b7280" }}>Month</label>
            <input 
              type="month" 
              value={month} 
              onChange={(e) => setMonth(e.target.value)} 
              style={monthInputStyle}
            />
          </div>

          {/* HIDE ADD BUTTON FOR VIEWERS */}
          {user?.role !== "Viewer" && (
            <button onClick={openAddForm} style={addBtnStyle}>
              + Add Entry
            </button>
          )}
        </div>
      </header>

      {error && <div style={errorStyle}>{error}</div>}

      {/* TABLE */}
      <div style={tableContainerStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#f1f5f9", textAlign: "left" }}>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Shed</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Qty</th>
              <th style={thStyle}>Receiver</th>
              <th style={thStyle}>From Incharge</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr><td colSpan={7} style={emptyTdStyle}>Loading...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={7} style={emptyTdStyle}>No entries for this month.</td></tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                  <td style={tdStyle}>{row.date}</td>
                  <td style={tdStyle}>{row.shed}</td>
                  <td style={tdStyle}>
                    {[row.gaumaya, row.gomutra, row.slurry].filter(Boolean).join(", ") || row.others}
                  </td>
                  <td style={tdStyle}>{row.qty} {row.units}</td>
                  <td style={tdStyle}>{row.receiver}</td>
                  <td style={tdStyle}>{row.fromIncharge}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    {/* HIDE EDIT BUTTON FOR VIEWERS */}
                    {user?.role !== "Viewer" && (
                      <button onClick={() => openEditForm(row)} style={editBtnStyle}>
                        ✏️ Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div style={overlayStyle} onClick={closeForm}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h2>{isEditMode ? "Edit Bio Waste" : "Add Bio Waste"}</h2>
              <button onClick={closeForm} style={closeIconStyle}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.85rem", gridTemplateColumns: "1fr 1fr" }}>
              <Field label="Date"><input type="date" name="date" value={form.date} onChange={handleFormChange} style={inputStyle} required /></Field>
              <Field label="Shed"><input type="text" name="shed" value={form.shed} onChange={handleFormChange} style={inputStyle} /></Field>
              
              <Field label="Gaumaya"><input type="text" name="gaumaya" value={form.gaumaya} onChange={handleFormChange} style={inputStyle} /></Field>
              <Field label="Gomutra"><input type="text" name="gomutra" value={form.gomutra} onChange={handleFormChange} style={inputStyle} /></Field>
              
              <Field label="Slurry"><input type="text" name="slurry" value={form.slurry} onChange={handleFormChange} style={inputStyle} /></Field>
              <Field label="Others"><input type="text" name="others" value={form.others} onChange={handleFormChange} style={inputStyle} /></Field>
              
              <Field label="Quantity"><input type="number" name="qty" value={form.qty} onChange={handleFormChange} style={inputStyle} /></Field>
              <Field label="Units"><input type="text" name="units" value={form.units} onChange={handleFormChange} style={inputStyle} placeholder="Kg / Ltr" /></Field>
              
              <Field label="Gobbara"><input type="text" name="gobbara" value={form.gobbara} onChange={handleFormChange} style={inputStyle} /></Field>
              <Field label="Receiver Unit"><input type="text" name="receiver" value={form.receiver} onChange={handleFormChange} style={inputStyle} /></Field>
              
              <Field label="Receiver Incharge"><input type="text" name="recIncharge" value={form.recIncharge} onChange={handleFormChange} style={inputStyle} /></Field>
              <Field label="From Unit Incharge"><input type="text" name="fromIncharge" value={form.fromIncharge} onChange={handleFormChange} style={inputStyle} /></Field>
              
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Remarks"><input type="text" name="remarks" value={form.remarks} onChange={handleFormChange} style={inputStyle} /></Field>
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={closeForm} style={secondaryBtnStyle}>Cancel</button>
                <button type="submit" style={primaryBtnStyle} disabled={loading}>{isEditMode ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- HELPERS & STYLES ---

function getEmptyForm() {
  return { id: "", date: "", shed: "", gaumaya: "", gomutra: "", slurry: "", others: "", qty: "", units: "", gobbara: "", receiver: "", recIncharge: "", fromIncharge: "", remarks: "" };
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={{ fontSize: "0.85rem", marginBottom: "0.25rem", color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

const monthInputStyle = { padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem" };
const addBtnStyle = { padding: "0.45rem 0.95rem", borderRadius: "999px", border: "none", background: "#16a34a", color: "#ffffff", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" };
const errorStyle = { marginBottom: "0.75rem", padding: "0.5rem", borderRadius: "0.5rem", background: "#fee2e2", color: "#b91c1c", fontSize: "0.85rem" };
const tableContainerStyle = { background: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 10px 25px rgba(15,23,42,0.05)", overflow: "hidden" };
const thStyle = { padding: "0.6rem 1rem", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", color: "#475569" };
const tdStyle = { padding: "0.55rem 1rem", borderBottom: "1px solid #e5e7eb", color: "#111827" };
const emptyTdStyle = { padding: "0.9rem 1rem", textAlign: "center", color: "#6b7280" };
const editBtnStyle = { border: "none", borderRadius: "999px", padding: "0.25rem 0.7rem", background: "#fee2e2", color: "#b91c1c", fontSize: "0.8rem", cursor: "pointer" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 };
const modalStyle = { width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", background: "#ffffff", borderRadius: "1rem", padding: "1.5rem" };
const modalHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" };
const closeIconStyle = { background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer" };
const inputStyle = { width: "100%", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.9rem", boxSizing: "border-box" };
const primaryBtnStyle = { padding: "0.5rem 1rem", borderRadius: "999px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" };
const secondaryBtnStyle = { padding: "0.5rem 1rem", borderRadius: "999px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" };