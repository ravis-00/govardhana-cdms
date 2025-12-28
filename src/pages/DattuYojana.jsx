// src/pages/DattuYojana.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getDattuYojana, addDattuYojana, updateDattuYojana } from "../api/masterApi";
import { useAuth } from "../context/AuthContext";

function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function toInputDate(isoStr) {
  if (!isoStr) return "";
  return isoStr.split("T")[0];
}

function formatDisplayDate(isoStr) {
  if (!isoStr) return "";
  const [y, m, d] = isoStr.split("T")[0].split("-");
  return `${d}-${m}-${y}`;
}

export default function DattuYojana() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [month, setMonth] = useState(getCurrentYearMonth());
  
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [editingRow, setEditingRow] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getDattuYojana();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = useMemo(() => rows.filter((r) => {
      if(!r.date) return false;
      return r.date.startsWith(month);
  }), [rows, month]);

  function getEmptyForm() {
    return {
      id: "", 
      date: month + "-01", // Payment Date
      startDate: month + "-01", 
      endDate: "",
      cattleId: "", 
      donorName: "", 
      phone: "", 
      email: "", 
      address: "", 
      pan: "",
      scheme: "", 
      schemeStatus: "Active",
      amount: "", 
      paymentMode: "",
      chequeNumber: "", 
      referenceNumber: "", 
      receiptNo: "", 
      remarks: ""
    };
  }

  function openAddForm() {
    setEditingRow(null);
    setForm(getEmptyForm());
    setShowForm(true);
  }

  function openEditForm(row) {
    setEditingRow(row);
    setForm({
      id: row.id,
      date: toInputDate(row.date),
      startDate: toInputDate(row.startDate) || toInputDate(row.date),
      endDate: toInputDate(row.endDate),
      cattleId: row.cattleId,
      donorName: row.donorName,
      phone: row.phone,
      email: row.email,
      address: row.address,
      pan: row.pan || "",
      scheme: row.scheme,
      schemeStatus: row.schemeStatus,
      amount: row.amount,
      paymentMode: row.paymentMode,
      chequeNumber: row.chequeNumber || "", 
      referenceNumber: row.referenceNumber,
      receiptNo: row.receiptNo,
      remarks: row.remarks
    });
    setShowForm(true);
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (editingRow) await updateDattuYojana(payload);
      else await addDattuYojana(payload);
      
      await loadData();
      setShowForm(false);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* HEADER - Updated to Match Standard */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0, color: "#111827" }}>Dattu Yojana</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.15rem", color: "#6b7280" }}>Month</label>
            <input 
              type="month" 
              value={month} 
              onChange={e => setMonth(e.target.value)} 
              style={headerInputStyle} 
            />
          </div>
          {user?.role !== "Viewer" && (
            <button onClick={openAddForm} style={addBtnStyle}>+ Add Entry</button>
          )}
        </div>
      </header>

      {/* TABLE */}
      <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#f9fafb", textAlign: "left" }}>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Donor</th>
              <th style={thStyle}>Mobile</th>
              <th style={thStyle}>Scheme</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Receipt</th>
              <th style={thStyle}>Status</th>
              <th style={{...thStyle, textAlign:"center"}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? <tr><td colSpan={8} style={emptyStyle}>No entries found for this month.</td></tr> : 
             filteredRows.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={tdStyle}>{formatDisplayDate(row.date)}</td>
                <td style={tdStyle}>
                    <div style={{fontWeight:"600"}}>{row.donorName}</div>
                    <div style={{fontSize:"0.8rem", color:"#666"}}>{row.cattleId ? `Cattle: ${row.cattleId}` : "General"}</div>
                </td>
                <td style={tdStyle}>{row.phone}</td>
                <td style={tdStyle}>{row.scheme}</td>
                <td style={{...tdStyle, fontWeight:"bold"}}>{row.amount}</td>
                <td style={tdStyle}>{row.receiptNo}</td>
                <td style={tdStyle}>
                    <span style={{
                        background: row.schemeStatus === "Active" ? "#ecfdf5" : "#fef2f2",
                        color: row.schemeStatus === "Active" ? "#047857" : "#b91c1c",
                        padding: "2px 8px", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "600"
                    }}>
                        {row.schemeStatus}
                    </span>
                </td>
                <td style={{...tdStyle, textAlign:"center"}}>
                   <button onClick={() => setSelectedEntry(row)} style={viewBtnStyle}>👁️</button>
                   {user?.role !== "Viewer" && <button onClick={() => openEditForm(row)} style={editBtnStyle}>✏️</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div style={overlayStyle} onClick={() => setShowForm(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: "1rem" }}>{editingRow ? "Edit" : "Add"} Dattu Entry</h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
               
               {/* 1. Donor Details */}
               <div style={{background:"#f8fafc", padding:"10px", borderRadius:"8px"}}>
                   <div style={{fontWeight:"bold", marginBottom:"8px", color:"#334155"}}>Donor Details</div>
                   <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                       <Field label="Donor Name *"><input type="text" name="donorName" value={form.donorName} onChange={handleChange} style={inputStyle} required /></Field>
                       <Field label="Mobile"><input type="tel" name="phone" value={form.phone} onChange={handleChange} style={inputStyle} /></Field>
                   </div>
                   <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginTop:"10px"}}>
                       <Field label="Email"><input type="email" name="email" value={form.email} onChange={handleChange} style={inputStyle} /></Field>
                       <Field label="PAN Number"><input type="text" name="pan" value={form.pan} onChange={handleChange} style={inputStyle} placeholder="ABCDE1234F" /></Field>
                   </div>
                   <Field label="Address" style={{marginTop:"10px"}}><input type="text" name="address" value={form.address} onChange={handleChange} style={inputStyle} /></Field>
               </div>

               {/* 2. Scheme Details */}
               <div style={{background:"#f8fafc", padding:"10px", borderRadius:"8px"}}>
                   <div style={{fontWeight:"bold", marginBottom:"8px", color:"#334155"}}>Scheme Info</div>
                   <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                       <Field label="Scheme *">
                          <select name="scheme" value={form.scheme} onChange={handleChange} style={inputStyle} required>
                              <option value="">Select...</option>
                              <option value="Punyakoti">Punyakoti</option>
                              <option value="Samrakshana">Samrakshana</option>
                              <option value="Go Dana">Go Dana</option>
                              <option value="Shashwatha">Shashwatha</option>
                          </select>
                       </Field>
                       <Field label="Cattle ID (Internal)"><input type="text" name="cattleId" value={form.cattleId} onChange={handleChange} style={inputStyle} /></Field>
                   </div>
                   <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginTop:"10px"}}>
                       <Field label="Start Date"><input type="date" name="startDate" value={form.startDate} onChange={handleChange} style={inputStyle} /></Field>
                       <Field label="End Date"><input type="date" name="endDate" value={form.endDate} onChange={handleChange} style={inputStyle} /></Field>
                   </div>
                   <Field label="Status" style={{marginTop:"10px"}}>
                      <select name="schemeStatus" value={form.schemeStatus} onChange={handleChange} style={inputStyle}>
                          <option value="Active">Active</option>
                          <option value="Expired">Expired</option>
                          <option value="Stopped">Stopped</option>
                      </select>
                   </Field>
               </div>

               {/* 3. Payment Details */}
               <div style={{background:"#f8fafc", padding:"10px", borderRadius:"8px"}}>
                   <div style={{fontWeight:"bold", marginBottom:"8px", color:"#334155"}}>Payment Info</div>
                   <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                       <Field label="Payment Date *"><input type="date" name="date" value={form.date} onChange={handleChange} style={inputStyle} required /></Field>
                       <Field label="Amount (₹)"><input type="number" name="amount" value={form.amount} onChange={handleChange} style={inputStyle} /></Field>
                   </div>
                   <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginTop:"10px"}}>
                       <Field label="Mode">
                           <select name="paymentMode" value={form.paymentMode} onChange={handleChange} style={inputStyle}>
                               <option value="Online">Online</option>
                               <option value="Cash">Cash</option>
                               <option value="Cheque">Cheque</option>
                               <option value="RTGS/NEFT">RTGS/NEFT</option>
                           </select>
                       </Field>
                       <Field label="Receipt No"><input type="text" name="receiptNo" value={form.receiptNo} onChange={handleChange} style={inputStyle} /></Field>
                   </div>
                   <Field label="Reference / Cheque No" style={{marginTop:"10px"}}><input type="text" name="referenceNumber" value={form.referenceNumber} onChange={handleChange} style={inputStyle} /></Field>
               </div>

               <Field label="Remarks"><input type="text" name="remarks" value={form.remarks} onChange={handleChange} style={inputStyle} /></Field>
               
               <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                  <button type="button" onClick={() => setShowForm(false)} style={btnCancelStyle}>Cancel</button>
                  <button type="submit" disabled={loading} style={btnSaveStyle}>Save</button>
               </div>
            </form>
          </div>
        </div>
      )}
      
      {/* View Modal */}
      {selectedEntry && (
        <div style={overlayStyle} onClick={() => setSelectedEntry(null)}>
           <div style={viewModalStyle} onClick={e => e.stopPropagation()}>
              <h2 style={{ marginBottom:"1rem", borderBottom:"1px solid #eee" }}>Details: {selectedEntry.donorName}</h2>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", fontSize:"0.9rem"}}>
                 <DetailItem label="Payment Date" value={formatDisplayDate(selectedEntry.date)} />
                 <DetailItem label="Amount" value={selectedEntry.amount} isBold />
                 
                 <DetailItem label="Donor Name" value={selectedEntry.donorName} />
                 <DetailItem label="Mobile" value={selectedEntry.phone} />
                 <DetailItem label="Email" value={selectedEntry.email} />
                 <DetailItem label="PAN" value={selectedEntry.pan} />
                 <DetailItem label="Address" value={selectedEntry.address} />
                 
                 <DetailItem label="Scheme" value={selectedEntry.scheme} />
                 <DetailItem label="Status" value={selectedEntry.schemeStatus} />
                 <DetailItem label="Start Date" value={formatDisplayDate(selectedEntry.startDate)} />
                 <DetailItem label="End Date" value={formatDisplayDate(selectedEntry.endDate)} />
                 
                 <DetailItem label="Cattle ID" value={selectedEntry.cattleId} />
                 <DetailItem label="Receipt No" value={selectedEntry.receiptNo} />
                 <DetailItem label="Reference" value={selectedEntry.referenceNumber} />
              </div>
              <div style={{marginTop:"1rem", padding:"10px", background:"#f9f9f9", borderRadius:"6px"}}>
                  <strong>Remarks:</strong> {selectedEntry.remarks}
              </div>
              <div style={{marginTop:"1rem", textAlign:"right"}}>
                 <button onClick={() => setSelectedEntry(null)} style={btnCancelStyle}>Close</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- Styles ---
const headerInputStyle = { padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.85rem" };
const addBtnStyle = { padding: "0.45rem 0.95rem", borderRadius: "999px", border: "none", background: "#16a34a", color: "#ffffff", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" };
const thStyle = { padding: "0.8rem 1rem", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: "0.8rem", color: "#475569" };
const tdStyle = { padding: "0.8rem 1rem", borderBottom: "1px solid #e5e7eb", color: "#111827" };
const emptyStyle = { padding: "2rem", textAlign: "center", color: "#6b7280" };
const viewBtnStyle = { border: "none", borderRadius: "6px", padding: "0.3rem 0.6rem", background: "#eff6ff", color: "#1d4ed8", fontSize: "0.9rem", cursor: "pointer", marginRight:"5px" };
const editBtnStyle = { border: "none", borderRadius: "6px", padding: "0.3rem 0.6rem", background: "#fff7ed", color: "#c2410c", fontSize: "0.9rem", cursor: "pointer" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50 };
const modalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "95%", maxWidth: "500px", maxHeight:"90vh", overflowY:"auto" };
const viewModalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "95%", maxWidth: "600px" };
const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.95rem" };
const btnCancelStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", cursor: "pointer" };
const btnSaveStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "none", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" };
function Field({ label, children, style }) { return <div style={style}><label style={{ display: "block", fontSize: "0.85rem", color: "#374151", marginBottom: "0.25rem" }}>{label}</label>{children}</div>; }
function DetailItem({ label, value, isBold }) { return <div style={{borderBottom:"1px dashed #eee", paddingBottom:"5px"}}><div style={{fontSize:"0.75rem", color:"#666"}}>{label}</div><div style={{fontWeight: isBold ? "700" : "500"}}>{value || "-"}</div></div>; }