// src/components/MasterTable.jsx
import React, { useState, useEffect } from "react";
import { fetchMaster, addMaster, updateMaster, deleteMaster } from "../api/masterApi";
import "./MasterTable.css"; // 🔥 Import the new CSS file

export default function MasterTable({ title, masterType, columns }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);

  // Load Data on Mount
  useEffect(() => {
    loadData();
  }, [masterType]); // Reload if type changes

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching master data for: ${masterType}`);
      const result = await fetchMaster(masterType);
      
      if (Array.isArray(result)) {
        setData(result);
      } else {
        console.warn("API returned non-array:", result);
        setData([]);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data. Check console.");
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    setEditingItem(null);
    setFormData({});
    setShowModal(true);
  }

  function handleEdit(item) {
    setEditingItem(item);
    setFormData({ ...item }); // Pre-fill form
    setShowModal(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteMaster(masterType, id);
      loadData(); // Refresh table
    } catch (err) {
      alert("Failed to delete item");
    }
  }

  async function handleSave(e) {
    e.preventDefault(); // Stop page reload
    try {
      if (editingItem) {
        // Update Logic
        await updateMaster(masterType, editingItem.id, formData);
      } else {
        // Add Logic
        console.log("Adding new item:", formData);
        await addMaster(masterType, formData);
      }
      setShowModal(false);
      loadData(); // Refresh table
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save data. See console.");
    }
  }

  return (
    <div className="master-container">
      {/* HEADER */}
      <div className="master-header">
        <h2 className="master-title">{title}</h2>
        <button onClick={handleAdd} className="btn-primary">
          + Add New
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

      {/* TABLE */}
      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + 1} style={{ textAlign: "center", padding: "2rem" }}>Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length + 1} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>No records found. Click "Add New" to start.</td></tr>
            ) : (
              data.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key}>{row[col.key]}</td>
                  ))}
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => handleEdit(row)} style={{ marginRight: "10px", color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(row.id)} className="btn-danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginTop: 0, marginBottom: "1.5rem", color: "#1e293b" }}>
              {editingItem ? "Edit Item" : "Add New Item"}
            </h3>
            
            <form onSubmit={handleSave}>
              {columns.map((col) => (
                <div key={col.key} className="form-group">
                  <label className="form-label">{col.label}</label>
                  <input
                    type={col.type || "text"}
                    className="form-input"
                    value={formData[col.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                    required
                    placeholder={`Enter ${col.label}`}
                  />
                </div>
              ))}
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}