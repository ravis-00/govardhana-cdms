import React, { useEffect, useState } from "react";
import { getSheds, addShed, updateShed, deleteShed } from "../../api/masterApi";

export default function ShedConfig() {
  const [sheds, setSheds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  
  const [form, setForm] = useState({ name: "", capacity: "", status: "Active", rowIndex: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getSheds();
      if (res && res.success && Array.isArray(res.data)) {
        setSheds(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateShed(form);
      } else {
        await addShed(form);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert("Error saving shed: " + err.message);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Deactivate shed "${row.name}"?`)) return;
    try {
      await deleteShed({ rowIndex: row.rowIndex });
      loadData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const openEdit = (row) => {
    setForm({ ...row });
    setIsEdit(true);
    setShowModal(true);
  };

  const openAdd = () => {
    setForm({ name: "", capacity: "", status: "Active", rowIndex: null });
    setIsEdit(false);
    setShowModal(true);
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1f2937", margin: 0 }}>Shed Configuration</h1>
        <button onClick={openAdd} className="btn btn-primary">+ Add Shed</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: "600px" }}>
            <thead style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Shed Name</th>
                <th style={thStyle}>Capacity</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</td></tr>
              ) : sheds.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No sheds found.</td></tr>
              ) : (
                sheds.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={tdStyle}><span style={{background:"#f3f4f6", padding:"2px 6px", borderRadius:"4px", fontSize:"0.8rem"}}>{row.id}</span></td>
                    <td style={{ ...tdStyle, fontWeight: "600" }}>{row.name}</td>
                    <td style={tdStyle}>{row.capacity} Head</td>
                    <td style={tdStyle}>
                      <span style={{ 
                        background: row.status === "Active" ? "#dcfce7" : "#fee2e2",
                        color: row.status === "Active" ? "#166534" : "#991b1b",
                        padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold"
                      }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <button onClick={() => openEdit(row)} style={iconBtnStyle} title="Edit">✏️</button>
                      <button onClick={() => handleDelete(row)} style={{ ...iconBtnStyle, color: "#dc2626" }} title="Deactivate">✕</button>
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
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>{isEdit ? "Edit Shed" : "Add New Shed"}</h2>
            <form onSubmit={handleSave} style={{ display: "grid", gap: "1rem" }}>
              
              <div className="form-group">
                <label className="form-label">Shed Name *</label>
                <input type="text" className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. Krishna Shed" />
              </div>

              <div className="responsive-grid">
                <div className="form-group">
                  <label className="form-label">Capacity (Head)</label>
                  <input type="number" className="form-input" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Shed</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const thStyle = { padding: "1rem", textAlign: "left", fontWeight: "600", color: "#4b5563", fontSize: "0.85rem", textTransform: "uppercase" };
const tdStyle = { padding: "0.8rem 1rem", color: "#1f2937" };
const iconBtnStyle = { background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "0 0.5rem" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100, padding: "1rem" };
const modalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "500px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };