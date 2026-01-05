import React, { useEffect, useState } from "react";
import { fetchMaster, addMaster, updateMaster, deleteMaster } from "../../api/masterApi";

export default function Medicines() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState(getEmptyForm());

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch specifically for "medicines"
      const res = await fetchMaster("medicines");
      
      // Handle Response Wrapper
      let data = [];
      if (res && res.data && Array.isArray(res.data)) {
        data = res.data;
      } else if (Array.isArray(res)) {
        data = res;
      }
      
      setRows(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getEmptyForm() {
    return { id: "", medicine_name: "", type: "Antibiotic", unit: "ml" };
  }

  function openAdd() {
    setIsEdit(false);
    setForm(getEmptyForm());
    setShowModal(true);
  }

  function openEdit(row) {
    setIsEdit(true);
    setForm({ ...row });
    setShowModal(true);
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine?")) return;
    try {
      await deleteMaster("medicines", id);
      loadData();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateMaster("medicines", form.id, form);
      } else {
        await addMaster("medicines", form);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: "700", color: "#1f2937", margin: 0 }}>Medicine Inventory</h1>
        <button onClick={openAdd} style={addBtnStyle}>+ Add Medicine</button>
      </div>

      {/* TABLE CARD */}
      <div style={cardStyle}>
        <div style={{ overflowX: "auto" }}> {/* 🔥 SCROLLABLE */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: "600px" }}>
            <thead style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
              <tr>
                <th style={thStyle}>Medicine Name</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Unit</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No medicines found.</td></tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={tdStyle}><strong>{row.medicine_name}</strong></td>
                    <td style={tdStyle}>
                      <span style={{ 
                        background: row.type === "Vaccine" ? "#dcfce7" : "#e0f2fe", 
                        color: row.type === "Vaccine" ? "#166534" : "#0369a1", 
                        padding: "2px 8px", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "600" 
                      }}>
                        {row.type}
                      </span>
                    </td>
                    <td style={tdStyle}>{row.unit}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button onClick={() => openEdit(row)} style={editBtnStyle}>Edit</button>
                        <button onClick={() => handleDelete(row.id)} style={deleteBtnStyle}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={overlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem", color: "#111827" }}>
              {isEdit ? "Edit Medicine" : "Add New Medicine"}
            </h2>
            
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Medicine Name *</label>
                <input type="text" name="medicine_name" value={form.medicine_name} onChange={handleChange} style={inputStyle} required placeholder="e.g. Ivermectin" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select name="type" value={form.type} onChange={handleChange} style={inputStyle}>
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Vaccine">Vaccine</option>
                    <option value="Supplement">Supplement</option>
                    <option value="Painkiller">Painkiller</option>
                    <option value="Dewormer">Dewormer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Unit</label>
                  <select name="unit" value={form.unit} onChange={handleChange} style={inputStyle}>
                    <option value="ml">ml</option>
                    <option value="mg">mg</option>
                    <option value="g">g</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Bolus">Bolus</option>
                    <option value="Vial">Vial</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowModal(false)} style={btnCancelStyle}>Cancel</button>
                <button type="submit" disabled={loading} style={btnSaveStyle}>{isEdit ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const cardStyle = { background: "#ffffff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden", border: "1px solid #e5e7eb" };
const addBtnStyle = { padding: "0.5rem 1rem", borderRadius: "6px", border: "none", background: "#2563eb", color: "#fff", fontWeight: "600", cursor: "pointer" };
const thStyle = { padding: "0.75rem 1rem", textAlign: "left", fontWeight: "600", color: "#4b5563", fontSize: "0.85rem", textTransform: "uppercase" };
const tdStyle = { padding: "0.75rem 1rem", color: "#1f2937", borderBottom: "1px solid #f3f4f6" };
const editBtnStyle = { padding: "4px 10px", borderRadius: "4px", border: "none", background: "#eff6ff", color: "#1d4ed8", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500" };
const deleteBtnStyle = { padding: "4px 10px", borderRadius: "4px", border: "none", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" };
const modalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" };
const labelStyle = { display: "block", fontSize: "0.8rem", color: "#374151", marginBottom: "0.3rem", fontWeight: "600" };
const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.95rem", boxSizing: "border-box" };
const btnCancelStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontWeight: "500" };
const btnSaveStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "none", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" };