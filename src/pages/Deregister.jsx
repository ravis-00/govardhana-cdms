// src/pages/Deregister.jsx
import React, { useEffect, useState, useMemo } from "react";
import { fetchCattle, updateCattle } from "../api/masterApi"; // Re-using Master API
import { useAuth } from "../context/AuthContext";

export default function Deregister() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState(null); // The cow selected for deregistering

  // Load ONLY Active Cattle
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchCattle();
      if (res && (Array.isArray(res) || Array.isArray(res.data))) {
        const allData = Array.isArray(res) ? res : res.data;
        // Filter: We only want to deregister cattle that are currently ACTIVE
        const activeOnly = allData.filter(c => String(c.status).toLowerCase() === 'active');
        setRows(activeOnly);
      } else {
        setRows([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Logic
  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    const lower = searchText.toLowerCase();
    return rows.filter(r => 
      (r.tag || "").toLowerCase().includes(lower) || 
      (r.name || "").toLowerCase().includes(lower) ||
      (r.internalId || "").toLowerCase().includes(lower) ||
      (r.shed || "").toLowerCase().includes(lower)
    );
  }, [rows, searchText]);

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "#b91c1c" }}>Herd Exit (Deregister)</h1>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", marginTop: "4px" }}>
             Mark cattle as Dead, Sold, or Donated. This removes them from the Active list.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
           <input 
             type="text" 
             placeholder="Search Tag / Name / Shed..." 
             value={searchText}
             onChange={e => setSearchText(e.target.value)}
             style={searchInputStyle}
           />
           <button onClick={loadData} style={refreshBtnStyle}>Refresh</button>
        </div>
      </div>

      {/* Table */}
      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#fef2f2", borderBottom: "2px solid #fecaca" }}>
            <tr>
              <th style={thStyle}>Tag No</th> {/* UPDATED LABEL */}
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Breed</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Location / Shed</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center" }}>Loading Active Cattle...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No active cattle found.</td></tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fffaf0" }}>
                  <td style={tdStyle}><strong>{row.tag}</strong></td> {/* SHOW TAG HERE */}
                  <td style={tdStyle}>{row.name}</td>
                  <td style={tdStyle}>{row.breed}</td>
                  <td style={tdStyle}>{row.gender}</td>
                  <td style={tdStyle}>{row.shed || "-"}</td>
                  <td style={tdStyle}>
                    <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold" }}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button 
                      onClick={() => setSelected(row)}
                      style={dangerBtnStyle}
                    >
                      ⛔ Deregister
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selected && (
        <DeregisterModal 
          selected={selected} 
          onClose={() => setSelected(null)} 
          onSuccess={() => { setSelected(null); loadData(); }} 
        />
      )}

    </div>
  );
}

/* ------------ MODAL COMPONENT ------------ */

function DeregisterModal({ selected, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    typeOfDeAdmit: "Death", // Default
    dateOfDeAdmit: new Date().toISOString().slice(0, 10),
    causeCategory: "Old age",
    causeDetails: "",
    timeOfDeath: "", // Optional
    remarks: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!window.confirm(`Are you sure you want to mark ${selected.tag} as ${formData.typeOfDeAdmit}? This cannot be undone.`)) return;

    setSubmitting(true);
    try {
      // We are actually calling 'updateCattle' but changing status and adding De-Admit fields
      // NOTE: In a real backend, you might have a dedicated 'deregisterCattle' endpoint.
      // Here we simulate it by updating the row in Master with new Status + Origins data.
      
      const payload = {
        id: selected.internalId, // Use Internal ID for lookup
        status: formData.typeOfDeAdmit === "Sold" ? "Sold" : "Dead", // Simple status update
        
        // Fields to save (These need to exist in your Repo_Cattle.gs logic or be handled)
        // Since our current updateCattle might only handle basic fields, 
        // ideally we should have a specific 'deregister' API. 
        // For now, let's assume updateCattle can handle these extra fields 
        // OR we just update the Status and Remarks.
        
        remarks: `[${formData.typeOfDeAdmit}] ${formData.dateOfDeAdmit}: ${formData.causeDetails}. ${formData.remarks}`,
        
        // If your backend supports these specific fields in update:
        dateOfDeAdmit: formData.dateOfDeAdmit,
        typeOfDeAdmit: formData.typeOfDeAdmit
      };

      const res = await updateCattle(payload); 
      
      if (res && res.success) {
        alert("Cattle Deregistered Successfully");
        onSuccess();
      } else {
        alert("Failed: " + (res.error || "Unknown Error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting data");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Modal Header */}
        <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between" }}>
          <div>
             <div style={{ fontSize: "0.85rem", color: "#6b7280", textTransform: "uppercase", fontWeight: "bold" }}>
               De-Admission / Herd Exit
             </div>
             {/* UPDATED HEADER: Shows Tag AND Internal ID */}
             <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827", marginTop: "4px" }}>
               Tag: {selected.tag} <span style={{color:"#9ca3af", fontWeight:"normal"}}>|</span> {selected.name}
             </div>
             <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
               Internal ID: {selected.internalId} • Breed: {selected.breed}
             </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        </div>

        {/* Form */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
           
           <div style={{ gridColumn: "span 1" }}>
             <label style={labelStyle}>Reason / Type</label>
             <select 
               style={inputStyle} 
               value={formData.typeOfDeAdmit}
               onChange={e => setFormData({...formData, typeOfDeAdmit: e.target.value})}
             >
               <option value="Death">Death</option>
               <option value="Sold">Sold</option>
               <option value="Donated">Donated / Gifted</option>
               <option value="Lost">Lost / Stolen</option>
             </select>
           </div>

           <div style={{ gridColumn: "span 1" }}>
             <label style={labelStyle}>Date</label>
             <input 
                type="date" 
                style={inputStyle}
                value={formData.dateOfDeAdmit}
                onChange={e => setFormData({...formData, dateOfDeAdmit: e.target.value})}
             />
           </div>

           {formData.typeOfDeAdmit === "Death" && (
             <>
               <div style={{ gridColumn: "span 1" }}>
                 <label style={labelStyle}>Cause Category</label>
                 <select 
                   style={inputStyle}
                   value={formData.causeCategory}
                   onChange={e => setFormData({...formData, causeCategory: e.target.value})}
                 >
                   <option value="Old age">Old age</option>
                   <option value="Disease">Disease / Illness</option>
                   <option value="Accident">Accident</option>
                   <option value="Natural Calamity">Natural Calamity</option>
                 </select>
               </div>
               <div style={{ gridColumn: "span 1" }}>
                 <label style={labelStyle}>Time (Optional)</label>
                 <input 
                   type="time" 
                   style={inputStyle}
                   value={formData.timeOfDeath}
                   onChange={e => setFormData({...formData, timeOfDeath: e.target.value})}
                 />
               </div>
             </>
           )}

           <div style={{ gridColumn: "span 2" }}>
             <label style={labelStyle}>Details / Buyer Name</label>
             <input 
                type="text" 
                placeholder={formData.typeOfDeAdmit === "Death" ? "Specific cause of death..." : "Name of Buyer / Receiver..."}
                style={inputStyle}
                value={formData.causeDetails}
                onChange={e => setFormData({...formData, causeDetails: e.target.value})}
             />
           </div>

           <div style={{ gridColumn: "span 2" }}>
             <label style={labelStyle}>Remarks</label>
             <textarea 
               rows="3"
               style={inputStyle}
               placeholder="Any additional notes..."
               value={formData.remarks}
               onChange={e => setFormData({...formData, remarks: e.target.value})}
             />
           </div>

        </div>

        {/* Footer */}
        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
           <button onClick={onClose} style={cancelBtnStyle} disabled={submitting}>Cancel</button>
           <button onClick={handleSubmit} style={confirmBtnStyle} disabled={submitting}>
             {submitting ? "Processing..." : "Confirm Exit"}
           </button>
        </div>

      </div>
    </div>
  );
}

/* ------------ STYLES ------------ */

const cardStyle = { background: "#ffffff", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", overflow: "hidden", border: "1px solid #e5e7eb" };
const thStyle = { padding: "1rem", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", color: "#7f1d1d", letterSpacing: "0.05em", textAlign: "left" }; // Reddish header
const tdStyle = { padding: "0.75rem 1rem", color: "#1e293b", borderBottom: "1px solid #f3f4f6" };
const searchInputStyle = { padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid #d1d5db", width: "250px" };
const refreshBtnStyle = { padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontWeight: "600", color: "#374151" };
const dangerBtnStyle = { padding: "6px 12px", borderRadius: "6px", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca", cursor: "pointer", fontWeight: "600", fontSize: "0.8rem" };

const overlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 };
const modalStyle = { backgroundColor: "#fff", padding: "1.5rem", borderRadius: "12px", width: "600px", maxWidth: "90%", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" };
const labelStyle = { display: "block", fontSize: "0.75rem", marginBottom: "4px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" };
const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", boxSizing: "border-box" };
const closeBtnStyle = { background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#9ca3af" };
const cancelBtnStyle = { padding: "8px 16px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontWeight: "600" };
const confirmBtnStyle = { padding: "8px 16px", borderRadius: "6px", border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: "600" };