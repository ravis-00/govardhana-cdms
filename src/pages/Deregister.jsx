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

  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    const lower = searchText.toLowerCase();
    return rows.filter(r => 
      String(r.tag || "").toLowerCase().includes(lower) || // 🔥 FIXED: tag instead of tagNo
      String(r.name || "").toLowerCase().includes(lower) ||
      String(r.id || "").toLowerCase().includes(lower) ||
      String(r.shed || "").toLowerCase().includes(lower)
    );
  }, [rows, searchText]);

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "#b91c1c" }}>Herd Exit (Deregister)</h1>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", marginTop: "4px" }}>
              Mark cattle as Dead, Sold, or Donated.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
           <input 
             type="text" 
             placeholder="Search Tag / Name..." 
             value={searchText}
             onChange={e => setSearchText(e.target.value)}
             style={searchInputStyle}
           />
           <button onClick={loadData} style={refreshBtnStyle}>Refresh</button>
        </div>
      </div>

      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#fef2f2", borderBottom: "2px solid #fecaca" }}>
            <tr>
              <th style={thStyle}>Tag No</th> 
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Breed</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Shed</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center" }}>Loading...</td></tr> : 
             filteredRows.length === 0 ? <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color:"#999" }}>No active cattle found.</td></tr> :
             filteredRows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fffaf0" }}>
                  <td style={tdStyle}><strong>{row.tag}</strong></td> {/* 🔥 FIXED: tag */}
                  <td style={tdStyle}>{row.name}</td>
                  <td style={tdStyle}>{row.breed}</td>
                  <td style={tdStyle}>{row.gender}</td>
                  <td style={tdStyle}>{row.shed || "-"}</td>
                  <td style={tdStyle}><span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold" }}>{row.status}</span></td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button onClick={() => setSelected(row)} style={dangerBtnStyle}>⛔ Deregister</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {selected && <DeregisterModal selected={selected} onClose={() => setSelected(null)} onSuccess={() => { setSelected(null); loadData(); }} />}
    </div>
  );
}

function DeregisterModal({ selected, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    type: "Death",
    date: new Date().toISOString().slice(0, 10),
    time: "",
    category: "Old Age",
    specificCause: "",
    doctorName: "", 
    teethDetails: "",
    teethAge: "",
    pregnancyStatus: "No",
    marketValue: "",
    buyerName: "", buyerContact: "", buyerAddress: "", salePrice: "", gatePass: "", paymentRef: "", receiptNo: "",
    receiverName: "", receiverContact: "", receiverAddress: "",
    remarks: ""
  });
  
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // --- MANDATORY FIELD VALIDATION ---
    if (!formData.date) return alert("Please select an Exit Date.");

    if (formData.type === "Death") {
        if (!formData.doctorName) return alert("⚠️ Doctor Name is required.");
        if (!formData.time) return alert("⚠️ Time of Death is required.");
        if (!formData.teethDetails || !formData.teethAge) return alert("⚠️ Teeth details are required.");
        if (!formData.marketValue) return alert("⚠️ Market Value is required.");
        if (!formData.specificCause) return alert("⚠️ Specific Cause is required.");
    }

    if (formData.type === "Sold") {
        if (!formData.buyerName) return alert("Buyer Name is required.");
        if (!formData.salePrice) return alert("Sale Price is required.");
    }

    if (!window.confirm(`Mark ${selected.tag} as ${formData.type}? This cannot be undone.`)) return;

    setSubmitting(true);
    try {
      const payload = {
        action: "deregisterCattle",
        id: selected.id, // Internal ID
        tagNumber: selected.tag, // 🔥 FIXED: tag
        
        exitType: formData.type,
        exitDate: formData.date,
        exitTime: formData.time,
        remarks: formData.remarks,
        
        category: formData.type === "Death" ? formData.category : "",
        specificCause: formData.type === "Death" ? formData.specificCause : "",
        
        partyName: formData.type === "Death" ? formData.doctorName : (formData.type === "Sold" ? formData.buyerName : formData.receiverName),
        partyContact: formData.type === "Sold" ? formData.buyerContact : formData.receiverContact,
        partyAddress: formData.type === "Sold" ? formData.buyerAddress : formData.receiverAddress,
        
        amount: formData.type === "Sold" ? formData.salePrice : "",
        gatePass: formData.type === "Sold" ? formData.gatePass : "",
        receiptNo: formData.type === "Sold" ? formData.receiptNo : "", 
        referenceNumber: formData.type === "Sold" ? formData.paymentRef : "",

        teethDetails: formData.type === "Death" ? formData.teethDetails : "",
        teethAge: formData.type === "Death" ? formData.teethAge : "",
        pregnancyStatus: formData.type === "Death" ? formData.pregnancyStatus : "",
        marketValue: formData.type === "Death" ? formData.marketValue : ""
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
        <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between" }}>
          <div>
             <div style={{ fontSize: "0.85rem", color: "#6b7280", textTransform: "uppercase", fontWeight: "bold" }}>De-Admission / Herd Exit</div>
             <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827", marginTop: "4px" }}>
               {selected.name}
             </div>
             {/* 🔥 NEW HEADER DETAILS */}
             <div style={{ marginTop: "8px", fontSize: "0.9rem", color: "#4b5563", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
                <div><strong>Internal ID:</strong> {selected.id}</div>
                <div><strong>Tag No:</strong> {selected.tag}</div>
                <div><strong>Colour:</strong> {selected.color || "-"}</div>
                <div><strong>Breed:</strong> {selected.breed}</div>
             </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
           <div style={{ gridColumn: "span 1" }}>
             <label style={labelStyle}>Reason / Type *</label>
             <select name="type" style={inputStyle} value={formData.type} onChange={handleChange}>
               <option value="Death">Death</option>
               <option value="Sold">Sold</option>
               <option value="Donated">Donated</option>
               <option value="Lost">Lost</option>
             </select>
           </div>
           <div style={{ gridColumn: "span 1" }}>
             <label style={labelStyle}>Exit Date *</label>
             <input type="date" name="date" style={inputStyle} value={formData.date} onChange={handleChange} />
           </div>

           {/* --- DEATH FIELDS --- */}
           {formData.type === "Death" && (
             <div style={{ gridColumn: "span 2", background: "#fef2f2", padding: "12px", borderRadius: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", border: "1px solid #fee2e2" }}>
               <div style={{ gridColumn: "span 2", fontSize: "0.8rem", fontWeight: "bold", color: "#991b1b" }}>CERTIFICATE DETAILS (REQUIRED)</div>
               
               <div><label style={labelStyle}>Cause Category *</label>
                 <select name="category" style={inputStyle} value={formData.category} onChange={handleChange}>
                   <option value="Old Age">Old Age</option>
                   <option value="Disease">Disease / Illness</option>
                   <option value="Accident">Accident</option>
                   <option value="Natural Calamity">Natural Calamity</option>
                 </select>
               </div>
               <div><label style={labelStyle}>Specific Cause *</label><input type="text" name="specificCause" style={inputStyle} value={formData.specificCause} onChange={handleChange} /></div>
               
               <div><label style={labelStyle}>Time of Death *</label><input type="time" name="time" style={inputStyle} value={formData.time} onChange={handleChange} /></div>
               <div><label style={labelStyle}>Certified By (Doctor) *</label><input type="text" name="doctorName" placeholder="Dr. Name" style={inputStyle} value={formData.doctorName} onChange={handleChange} /></div>
               
               <div><label style={labelStyle}>Teeth Details *</label><input type="text" name="teethDetails" placeholder="e.g. 7" style={inputStyle} value={formData.teethDetails} onChange={handleChange} /></div>
               <div><label style={labelStyle}>Teeth Age *</label><input type="text" name="teethAge" placeholder="e.g. 6" style={inputStyle} value={formData.teethAge} onChange={handleChange} /></div>
               
               <div><label style={labelStyle}>Pregnancy Status</label>
                 <select name="pregnancyStatus" style={inputStyle} value={formData.pregnancyStatus} onChange={handleChange}>
                   <option value="No">No</option>
                   <option value="Yes">Yes</option>
                   <option value="Unknown">Unknown</option>
                 </select>
               </div>
               <div><label style={labelStyle}>Market Value (₹) *</label><input type="number" name="marketValue" placeholder="45000" style={inputStyle} value={formData.marketValue} onChange={handleChange} /></div>
             </div>
           )}

           {/* --- SOLD FIELDS --- */}
           {formData.type === "Sold" && (
             <div style={{ gridColumn: "span 2", background: "#f0fdf4", padding: "10px", borderRadius: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", border: "1px solid #dcfce7" }}>
                <div style={{ gridColumn: "span 2", fontSize: "0.8rem", fontWeight: "bold", color: "#166534" }}>SALE DETAILS</div>
                <div><label style={labelStyle}>Buyer Name *</label><input type="text" name="buyerName" style={inputStyle} value={formData.buyerName} onChange={handleChange} /></div>
                <div><label style={labelStyle}>Sale Price (₹) *</label><input type="number" name="salePrice" style={inputStyle} value={formData.salePrice} onChange={handleChange} /></div>
                <div><label style={labelStyle}>Buyer Contact</label><input type="text" name="buyerContact" style={inputStyle} value={formData.buyerContact} onChange={handleChange} /></div>
                <div><label style={labelStyle}>Buyer Address</label><input type="text" name="buyerAddress" style={inputStyle} value={formData.buyerAddress} onChange={handleChange} /></div>
                <div><label style={labelStyle}>Gate Pass</label><input type="text" name="gatePass" style={inputStyle} value={formData.gatePass} onChange={handleChange} /></div>
                <div><label style={labelStyle}>Receipt No</label><input type="text" name="receiptNo" style={inputStyle} value={formData.receiptNo} onChange={handleChange} /></div>
             </div>
           )}

           {/* --- DONATED --- */}
           {formData.type === "Donated" && (
             <div style={{ gridColumn: "span 2", background: "#eff6ff", padding: "10px", borderRadius: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", border: "1px solid #dbeafe" }}>
                <div><label style={labelStyle}>Receiver Name</label><input type="text" name="receiverName" style={inputStyle} value={formData.receiverName} onChange={handleChange} /></div>
                <div><label style={labelStyle}>Contact</label><input type="text" name="receiverContact" style={inputStyle} value={formData.receiverContact} onChange={handleChange} /></div>
                <div style={{gridColumn:"span 2"}}><label style={labelStyle}>Address</label><input type="text" name="receiverAddress" style={inputStyle} value={formData.receiverAddress} onChange={handleChange} /></div>
             </div>
           )}

           <div style={{ gridColumn: "span 2" }}>
             <label style={labelStyle}>Remarks</label>
             <textarea name="remarks" rows="2" style={inputStyle} value={formData.remarks} onChange={handleChange} placeholder="Optional notes..." />
           </div>
        </div>

        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
           <button onClick={onClose} style={cancelBtnStyle} disabled={submitting}>Cancel</button>
           <button onClick={handleSubmit} style={confirmBtnStyle} disabled={submitting}>{submitting ? "Processing..." : "Confirm Exit"}</button>
        </div>
      </div>
    </div>
  );
}

// STYLES
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