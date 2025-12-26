// src/pages/NewBorn.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getNewBorn, addNewBorn, updateNewBorn } from "../api/masterApi"; 

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
    motherTag: "",     // Was cattleId
    calfId: "",        // child_internal_id
    calfSex: "",       // Was gender
    calfBreed: "",     // Was breed
    calfWeight: "",    // NEW: Matches sheet
    deliveryType: "",
    birthStatus: "",   // Was healthyAtBirth
    remarks: "",
  };
}

export default function NewBorn() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(getEmptyForm());
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [error, setError] = useState("");

  // LOAD DATA
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getNewBorn(); // Calls backend
      setRows(data || []);
    } catch (err) {
      console.error("Failed to load", err);
      setError("Unable to load data. Ensure Repo_NewBorn.gs is saved.");
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => 
    rows.filter((r) => (r.dateOfBirth || "").startsWith(month)),
    [rows, month]
  );

  function openForm() {
    setEditingEntry(null);
    setForm({ ...getEmptyForm(), birthDate: month + "-01" });
    setShowForm(true);
  }

  function openEdit(entry) {
    setEditingEntry(entry);
    // Map backend row back to form state
    setForm({
        id: entry.id,
        birthDate: entry.dateOfBirth,
        motherTag: entry.motherTag,
        calfId: entry.calfId,
        calfSex: entry.calfSex,
        calfBreed: entry.calfBreed,
        calfWeight: entry.calfWeight,
        deliveryType: entry.deliveryType,
        birthStatus: entry.birthStatus,
        remarks: entry.remarks
    });
    setShowForm(true);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

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
      loadData(); // Reload to get fresh data
    } catch (err) {
      console.error("Error saving", err);
      alert("Error saving: " + err.message);
    }
  }

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* HEADER */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>New Born Log</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.15rem", color: "#6b7280" }}>Month</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={inputStyle} />
          </div>
          <button type="button" onClick={openForm} style={btnPrimary}>+ Add Entry</button>
        </div>
      </header>

      {error && <div style={errorStyle}>{error}</div>}

      {/* TABLE */}
      <div style={tableContainerStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#f1f5f9", textAlign: "left" }}>
            <tr>
              <th style={thStyle}>Birth Date</th>
              <th style={thStyle}>Mother ID</th>
              <th style={thStyle}>Calf ID</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Breed</th>
              <th style={thStyle}>Weight</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center" }}>Loading...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No entries for {month}.</td></tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                  <td style={tdStyle}>{formatDisplayDate(row.dateOfBirth)}</td>
                  <td style={tdStyle}>{row.motherTag}</td>
                  <td style={tdStyle}>{row.calfId}</td>
                  <td style={tdStyle}>{row.calfSex}</td>
                  <td style={tdStyle}>{row.calfBreed}</td>
                  <td style={tdStyle}>{row.calfWeight}</td>
                  <td style={tdStyle}>{row.birthStatus}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button onClick={() => openEdit(row)} style={editBtnStyle}>✏️ Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div style={overlayStyle} onClick={() => setShowForm(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2>{editingEntry ? "Edit Birth Record" : "Add New Birth"}</h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.85rem", marginTop:"1rem" }}>
              
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                  <Field label="Birth Date *">
                    <input type="date" name="birthDate" value={form.birthDate} onChange={handleFormChange} style={inputStyle} required />
                  </Field>
                  <Field label="Mother Tag/ID *">
                    <input type="text" name="motherTag" value={form.motherTag} onChange={handleFormChange} style={inputStyle} required placeholder="Mother's Tag" />
                  </Field>
              </div>

              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                  <Field label="Calf Internal ID *">
                    <input type="text" name="calfId" value={form.calfId} onChange={handleFormChange} style={inputStyle} required />
                  </Field>
                  <Field label="Calf Weight (Kg)">
                    <input type="number" name="calfWeight" value={form.calfWeight} onChange={handleFormChange} style={inputStyle} />
                  </Field>
              </div>

              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                  <Field label="Gender *">
                    <select name="calfSex" value={form.calfSex} onChange={handleFormChange} style={inputStyle} required>
                      <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                    </select>
                  </Field>
                  <Field label="Breed *">
                    <select name="calfBreed" value={form.calfBreed} onChange={handleFormChange} style={inputStyle} required>
                      <option value="">Select</option>
                      {["Hallikar", "Gir", "Jersey", "HF", "Mix", "Sahiwal", "Punganur", "Kankrej"].map(b=><option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
              </div>

              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                  <Field label="Delivery Type">
                     <select name="deliveryType" value={form.deliveryType} onChange={handleFormChange} style={inputStyle}>
                        <option value="">Select</option><option value="Normal">Normal</option><option value="Assisted">Assisted</option><option value="Caesarean">Caesarean</option>
                     </select>
                  </Field>
                  <Field label="Birth Status (Health)">
                     <select name="birthStatus" value={form.birthStatus} onChange={handleFormChange} style={inputStyle}>
                        <option value="">Select</option><option value="Healthy">Healthy</option><option value="Weak">Weak</option><option value="Died">Died</option>
                     </select>
                  </Field>
              </div>

              <Field label="Remarks">
                <input type="text" name="remarks" value={form.remarks} onChange={handleFormChange} style={inputStyle} />
              </Field>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
                <button type="submit" style={btnPrimary}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const btnPrimary = { padding: "0.5rem 1rem", borderRadius: "99px", border: "none", background: "#16a34a", color: "#fff", fontWeight: 600, cursor: "pointer" };
const btnSecondary = { padding: "0.5rem 1rem", borderRadius: "99px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" };
const inputStyle = { width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc", boxSizing:"border-box" };
const thStyle = { padding: "0.8rem", borderBottom: "1px solid #ddd", fontWeight: 600, color: "#555" };
const tdStyle = { padding: "0.8rem", borderBottom: "1px solid #eee", color: "#333" };
const editBtnStyle = { border: "none", background: "#fee2e2", color: "#b91c1c", borderRadius: "20px", padding: "4px 10px", cursor: "pointer" };
const errorStyle = { padding: "10px", background: "#fee2e2", color: "#b91c1c", borderRadius: "6px", marginBottom: "1rem" };
const tableContainerStyle = { background: "#fff", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", overflow: "hidden" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 };
const modalStyle = { background: "#fff", padding: "2rem", borderRadius: "10px", width: "500px", maxWidth: "95%" };
const Field = ({ label, children }) => <div style={{marginBottom:"5px"}}><label style={{display:"block", fontSize:"0.8rem", fontWeight:600, marginBottom:"3px", color:"#555"}}>{label}</label>{children}</div>;