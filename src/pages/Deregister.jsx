// src/pages/Deregister.jsx
import React, { useEffect, useState, useMemo } from "react";
import { fetchCattle, updateCattle } from "../api/masterApi"; 
import { useAuth } from "../context/AuthContext";

export default function Deregister() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState(null); 

  // Load ONLY Active Cattle
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchCattle();
      if (res && (Array.isArray(res) || Array.isArray(res.data))) {
        const allData = Array.isArray(res) ? res : res.data;
        // Filter: Status is Active (case insensitive)
        const activeOnly = allData.filter(c => c.status && String(c.status).toLowerCase() === 'active');
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
      String(r.tagNo || "").toLowerCase().includes(lower) || 
      String(r.name || "").toLowerCase().includes(lower) ||
      String(r.internalId || "").toLowerCase().includes(lower) ||
      String(r.shed || "").toLowerCase().includes(lower)
    );
  }, [rows, searchText]);

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "#b91c1c" }}>Herd Exit (Deregister)</h1>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", marginTop: "4px" }}>
              Mark cattle as Dead, Sold, or Donated. This removes them from the Active list and logs the event.
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
              <th style={thStyle}>Tag No</th> 
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
              <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No active cattle found matching "{searchText}".</td></tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fffaf0" }}>
                  <td style={tdStyle}><strong>{row.tagNo}</strong></td> 
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

/* ------------ MODAL COMPONENT (UPDATED FOR EXIT LOG) ------------ */

function DeregisterModal({ selected, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    type: "Death",
    date: new Date().toISOString().slice(0, 10),
    time: "",
    
    // Death Specific
    category: "Old Age",
    specificCause: "",
    doctorName: "", 
    
    // Sold Specific
    buyerName: "",
    buyerContact: "",
    buyerAddress: "",
    salePrice: "",
    gatePass: "",
    paymentRef: "",
    
    // Donated Specific
    receiverName: "",
    receiverContact: "",
    receiverAddress: "",
    
    remarks: ""
  });
  
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.type || !formData.date) return alert("Please fill required fields (Type & Date)");
    
    if (!window.confirm(`Are you sure you want to mark ${selected.tagNo} as ${formData.type}? This cannot be undone.`)) return;

    setSubmitting(true);
    try {
      // 1. Prepare Base Payload for 'deregisterCattle' action
      const payload = {
        action: "deregisterCattle", // 🔥 IMPORTANT: Triggers the new backend logic
        id: selected.internalId,    // This ID maps to 'cattle_internal_id' in log
        tagNumber: selected.tagNo,
        
        // Common Fields
        exitType: formData.type,
        exitDate: formData.date,
        exitTime: formData.time,
        remarks: formData.remarks,
        
        // 2. Map Specific Fields to Generic Backend Columns
        // category & specificCause -> Used for Death
        category: formData.type === "Death" ? formData.category : "",
        specificCause: formData.type === "Death" ? formData.specificCause : "",
        
        // partyName -> Maps to Doctor (Death), Buyer (Sold), or Receiver (Donated)
        partyName: formData.type === "Death" ? formData.doctorName : (formData.type === "Sold" ? formData.buyerName : formData.receiverName),
        
        // partyContact -> Buyer/Receiver Contact
        partyContact: formData.type === "Sold" ? formData.buyerContact : formData.receiverContact,
        
        // partyAddress -> Buyer/Receiver Address
        partyAddress: formData.type === "Sold" ? formData.buyerAddress : formData.receiverAddress,
        
        // amount -> Sale Price
        amount: formData.type === "Sold" ? formData.salePrice : "",
        
        // referenceNumber -> Gate Pass + Payment Ref
        referenceNumber: formData.type === "Sold" ? `GP:${formData.gatePass} | Ref:${formData.paymentRef}` : ""
      };

      const res = await updateCattle(payload); 
      
      if (res && res.success) {
        alert("Cattle Deregistered & Logged Successfully");
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
             <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827", marginTop: "4px" }}>
               Tag: {selected.tagNo} <span style={{color:"#9ca3af", fontWeight:"normal"}}>|</span> {selected.name}
             </div>
             <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
               Internal ID: {selected.internalId} • Breed: {selected.breed}
             </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        </div>

        {/* --- MAIN FORM --- */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            
           {/* Row 1: Reason & Date */}
           <div style={{ gridColumn: "span 1" }}>
             <label style={labelStyle}>Reason / Type *</label>
             <select name="type" style={inputStyle} value={formData.type} onChange={handleChange}>
               <option value="Death">Death</option>
               <option value="Sold">Sold</option>
               <option value="Donated">Donated / Gifted</option>
               <option value="Lost">Lost / Stolen</option>
             </select>
           </div>

           <div style={{ gridColumn: "span 1" }}>
             <label style={labelStyle}>Exit Date *</label>
             <input type="date" name="date" style={inputStyle} value={formData.date} onChange={handleChange} />
           </div>

           {/* --- SCENARIO 1: DEATH --- */}
           {formData.type === "Death" && (
             <div style={{ gridColumn: "span 2", background: "#fef2f2", padding: "10px", borderRadius: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", border: "1px solid #fee2e2" }}>
               <div style={{ gridColumn: "span 2", fontSize: "0.8rem", fontWeight: "bold", color: "#991b1b" }}>DEATH DETAILS</div>
               
               <div style={{ gridColumn: "span 1" }}>
                 <label style={labelStyle}>Cause Category *</label>
                 <select name="category" style={inputStyle} value={formData.category} onChange={handleChange}>
                   <option value="Old Age">Old Age</option>
                   <option value="Disease">Disease / Illness</option>
                   <option value="Accident">Accident</option>
                   <option value="Natural Calamity">Natural Calamity</option>
                 </select>
               </div>
               <div style={{ gridColumn: "span 1" }}>
                 <label style={labelStyle}>Time (Optional)</label>
                 <input type="time" name="time" style={inputStyle} value={formData.time} onChange={handleChange} />
               </div>
               <div style={{ gridColumn: "span 1" }}>
                 <label style={labelStyle}>Certified By (Doctor)</label>
                 <input type="text" name="doctorName" placeholder="Dr. Name" style={inputStyle} value={formData.doctorName} onChange={handleChange} />
               </div>
               <div style={{ gridColumn: "span 1" }}>
                 <label style={labelStyle}>Specific Cause</label>
                 <input type="text" name="specificCause" placeholder="e.g. Heart Failure" style={inputStyle} value={formData.specificCause} onChange={handleChange} />
               </div>
             </div>
           )}

           {/* --- SCENARIO 2: SOLD --- */}
           {formData.type === "Sold" && (
             <div style={{ gridColumn: "span 2", background: "#f0fdf4", padding: "10px", borderRadius: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", border: "1px solid #dcfce7" }}>
                <div style={{ gridColumn: "span 2", fontSize: "0.8rem", fontWeight: "bold", color: "#166534" }}>SALE DETAILS</div>
                
                <div style={{ gridColumn: "span 1" }}>
                    <label style={labelStyle}>Sale Price (₹)</label>
                    <input type="number" name="salePrice" style={inputStyle} value={formData.salePrice} onChange={handleChange} />
                </div>
                <div style={{ gridColumn: "span 1" }}>
                    <label style={labelStyle}>Gate Pass Number</label>
                    <input type="text" name="gatePass" style={inputStyle} value={formData.gatePass} onChange={handleChange} />
                </div>
                <div style={{ gridColumn: "span 1" }}>
                    <label style={labelStyle}>Buyer Name</label>
                    <input type="text" name="buyerName" style={inputStyle} value={formData.buyerName} onChange={handleChange} />
                </div>
                <div style={{ gridColumn: "span 1" }}>
                    <label style={labelStyle}>Buyer Contact</label>
                    <input type="text" name="buyerContact" style={inputStyle} value={formData.buyerContact} onChange={handleChange} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                    <label style={labelStyle}>Buyer Address</label>
                    <input type="text" name="buyerAddress" style={inputStyle} value={formData.buyerAddress} onChange={handleChange} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                    <label style={labelStyle}>Payment Ref (Txn ID/Cheque)</label>
                    <input type="text" name="paymentRef" style={inputStyle} value={formData.paymentRef} onChange={handleChange} />
                </div>
             </div>
           )}

           {/* --- SCENARIO 3: DONATED --- */}
           {formData.type === "Donated" && (
             <div style={{ gridColumn: "span 2", background: "#eff6ff", padding: "10px", borderRadius: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", border: "1px solid #dbeafe" }}>
                <div style={{ gridColumn: "span 2", fontSize: "0.8rem", fontWeight: "bold", color: "#1e40af" }}>RECEIVER DETAILS</div>
                
                <div style={{ gridColumn: "span 1" }}>
                    <label style={labelStyle}>Receiver Name</label>
                    <input type="text" name="receiverName" style={inputStyle} value={formData.receiverName} onChange={handleChange} />
                </div>
                <div style={{ gridColumn: "span 1" }}>
                    <label style={labelStyle}>Receiver Contact</label>
                    <input type="text" name="receiverContact" style={inputStyle} value={formData.receiverContact} onChange={handleChange} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                    <label style={labelStyle}>Address / Village</label>
                    <input type="text" name="receiverAddress" style={inputStyle} value={formData.receiverAddress} onChange={handleChange} />
                </div>
             </div>
           )}

           {/* --- REMARKS --- */}
           <div style={{ gridColumn: "span 2" }}>
             <label style={labelStyle}>Remarks / Notes {formData.type === "Lost" && "*"}</label>
             <textarea 
               name="remarks"
               rows="2"
               style={inputStyle}
               placeholder={formData.type === "Lost" ? "Please provide details of incident..." : "Any additional notes..."}
               value={formData.remarks}
               onChange={handleChange}
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
const thStyle = { padding: "1rem", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", color: "#7f1d1d", letterSpacing: "0.05em", textAlign: "left" };
const tdStyle = { padding: "0.75rem 1rem", color: "#1e293b", borderBottom: "1px solid #f3f4f6" };
const searchInputStyle = { padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid #d1d5db", width: "250px" };
const refreshBtnStyle = { padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontWeight: "600", color: "#374151" };
const dangerBtnStyle = { padding: "6px 12px", borderRadius: "6px", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca", cursor: "pointer", fontWeight: "600", fontSize: "0.8rem" };
const overlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 };
const modalStyle = { backgroundColor: "#fff", padding: "1.5rem", borderRadius: "12px", width: "600px", maxWidth: "90%", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", maxHeight: "90vh", overflowY: "auto" };
const labelStyle = { display: "block", fontSize: "0.75rem", marginBottom: "4px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" };
const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", boxSizing: "border-box" };
const closeBtnStyle = { background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#9ca3af" };
const cancelBtnStyle = { padding: "8px 16px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontWeight: "600" };
const confirmBtnStyle = { padding: "8px 16px", borderRadius: "6px", border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: "600" };