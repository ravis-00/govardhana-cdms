import React, { useEffect, useState } from "react";
import { fetchMaster, addMaster, updateMaster, deleteMaster } from "../../api/masterApi";

export default function Symptoms() {
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
      // Fetch specifically for "symptoms"
      const res = await fetchMaster("symptoms");
      
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
    return { id: "", symptom_name: "", category: "General", description: "" };
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
    if (!window.confirm("Are you sure you want to delete this symptom?")) return;
    try {
      await deleteMaster("symptoms", id);
      loadData();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateMaster("symptoms", form.id, form);
      } else {
        await addMaster("symptoms", form);
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
        <h1 style={{ fontSize: "1.6rem", fontWeight: "700", color: "#1f2937", margin: 0 }}>Disease & Symptoms</h1>
        <button onClick={openAdd} style={addBtnStyle}>+ Add Symptom</button>
      </div>

      {/* TABLE CARD */}
      <div style={cardStyle}>
        <div style={{ overflowX: "auto" }}> {/* 🔥 SCROLLABLE */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: "600px" }}>
            <thead style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
              <tr>
                <th style={thStyle}>Symptom / Disease</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Description</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No symptoms found.</td></tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={tdStyle}><strong>{row.symptom_name}</strong></td>
                    <td style={tdStyle}>
                      <span style={{ 
                        background: "#f3f4f6", color: "#374151", 
                        padding: "2px 8px", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "600",
                        border: "1px solid #d1d5db"
                      }}>
                        {row.category}
                      </span>
                    </td>
                    <td style={tdStyle}>{row.description || "-"}</td>
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
              {isEdit ? "Edit Symptom" : "Add New Symptom"}
            </h2>
            
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Symptom / Disease Name *</label>
                <input type="text" name="symptom_name" value={form.symptom_name} onChange={handleChange} style={inputStyle} required placeholder="e.g. Foot and Mouth Disease" />
              </div>

              <div>
                <label style={labelStyle}>Category</label>
                <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
                  <option value="General">General</option>
                  <option value="Viral">Viral</option>
                  <option value="Bacterial">Bacterial</option>
                  <option value="Fungal">Fungal</option>
                  <option value="Parasitic">Parasitic</option>
                  <option value="Metabolic">Metabolic</option>
                  <option value="Injury">Injury</option>
                  <option value="Reproductive">Reproductive</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Description / Standard Protocol</label>
                <textarea name="description" rows="3" value={form.description} onChange={handleChange} style={inputStyle} placeholder="Describe symptoms or standard treatment protocol..." />
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
const modalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" };
const labelStyle = { display: "block", fontSize: "0.8rem", color: "#374151", marginBottom: "0.3rem", fontWeight: "600" };
const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.95rem", boxSizing: "border-box" };
const btnCancelStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontWeight: "500" };
const btnSaveStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "none", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" };