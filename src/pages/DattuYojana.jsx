// src/pages/DattuYojana.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getDattuYojana, addDattuYojana, updateDattuYojana, fetchCattle } from "../api/masterApi"; 
import { useAuth } from "../context/AuthContext";

// --- HELPERS ---
function toInputDate(isoStr) {
  if (!isoStr) return "";
  return isoStr.split("T")[0];
}

function formatDisplayDate(isoStr) {
  if (!isoStr) return "";
  const [y, m, d] = isoStr.split("T")[0].split("-");
  return `${d}-${m}-${y}`;
}

const ITEMS_PER_PAGE = 20;

export default function DattuYojana() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [cattleMap, setCattleMap] = useState({}); 
  
  // Filters & Pagination
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); 
  const [currentPage, setCurrentPage] = useState(1);

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
      const dattuData = await getDattuYojana();
      setRows(Array.isArray(dattuData) ? dattuData : []);

      const cattleData = await fetchCattle();
      if (Array.isArray(cattleData)) {
        const map = {};
        cattleData.forEach(c => {
          if(c.id) map[c.id.toString().toLowerCase()] = c;
          if(c.tag) map[c.tag.toString().toLowerCase()] = c;
        });
        setCattleMap(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // --- FILTERING LOGIC ---
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // 1. Status Filter
      const status = String(r.schemeStatus || "").toLowerCase();
      if (statusFilter !== "All" && status !== statusFilter.toLowerCase()) return false;

      // 2. Text Search (Donor, Cattle ID, Phone, Receipt)
      const search = searchText.toLowerCase();
      const haystack = `${r.donorName} ${r.cattleId} ${r.phone} ${r.receiptNo} ${r.scheme}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [rows, statusFilter, searchText]);

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const displayedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const handleNext = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrev = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  function getEmptyForm() {
    const today = new Date().toISOString().slice(0, 10);
    return {
      id: "", date: today, startDate: today, endDate: "", cattleId: "", 
      donorName: "", phone: "", email: "", address: "", pan: "",
      scheme: "", schemeStatus: "Active", amount: "", paymentMode: "",
      chequeNumber: "", referenceNumber: "", receiptNo: "", remarks: ""
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

  // --- CERTIFICATE GENERATOR ---
  const printCertificate = (row) => {
    const searchKey = String(row.cattleId || "").toLowerCase();
    const cattle = cattleMap[searchKey] || {};
    
    const certData = {
        donor: row.donorName || "-",
        address: row.address || "-",
        phone: row.phone || "-",
        email: row.email || "-",
        date: formatDisplayDate(row.date),
        scheme: row.scheme || "-",
        amount: row.amount || "-",
        receipt: row.receiptNo || "-",
        mode: row.paymentMode || "-",
        expiry: formatDisplayDate(row.endDate) || "-",
        cattleName: cattle.name || "-",
        tag: cattle.tag || row.cattleId || "-",
        breed: cattle.breed || "-",
        gender: cattle.gender || "-",
        photo: cattle.photo || null 
    };

    const html = `
      <html>
      <head>
        <title>Dattu Certificate - ${certData.donor}</title>
        <style>
          body { font-family: "Times New Roman", serif; padding: 20px; text-align: center; }
          .container { border: 3px solid #000; padding: 15px; max-width: 800px; margin: 0 auto; box-sizing: border-box; }
          .header h1 { font-size: 22px; font-weight: 800; margin: 0; text-decoration: underline; }
          .header h2 { font-size: 16px; font-weight: 700; margin: 5px 0; }
          .cert-title { border: 2px solid #000; padding: 6px; font-size: 18px; font-weight: 800; display: inline-block; width: 100%; margin-top: 10px; background: #eee; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; border: 2px solid #000; }
          td { border: 1px solid #000; padding: 8px 10px; text-align: left; width: 50%; font-size: 14px; vertical-align: middle; }
          .label { font-weight: 800; text-transform: uppercase; margin-right: 5px; font-size: 13px; }
          .value { font-weight: 500; text-transform: uppercase; font-size: 14px; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 30px; }
          .sign-line { width: 180px; border-bottom: 1px solid #000; margin-bottom: 8px; }
          .sign-label { font-weight: 700; font-size: 12px; text-transform: uppercase; }
          @media print { @page { size: A4; margin: 10mm; } body { padding: 0; } .container { height: 95vh; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MADHAVA SRUSTI RASHTROTTHANA GOSHALA</h1>
            <h2>SS GHATI DODDABALLAPURA</h2>
            <div class="cert-title">DATTU YOJANA CERTIFICATE</div>
          </div>
          <div style="width:100%; height:250px; border:2px solid #000; margin:15px 0; display:flex; align-items:center; justify-content:center; overflow:hidden; background:#fafafa;">
            ${certData.photo ? `<img src="${certData.photo}" style="height:100%; object-fit:contain;" />` : `<div style="color:#999; font-style:italic;">[ Photo Not Provided ]</div>`}
          </div>
          <table>
            <tr><td><span class="label">DATE:</span> <span class="value">${certData.date}</span></td><td><span class="label">BREED:</span> <span class="value">${certData.breed}</span></td></tr>
            <tr><td><span class="label">CATTLE NAME:</span> <span class="value">${certData.cattleName}</span></td><td><span class="label">GENDER:</span> <span class="value">${certData.gender}</span></td></tr>
            <tr><td><span class="label">EAR TAG NO:</span> <span class="value">${certData.tag}</span></td><td><span class="label">DONOR NAME:</span> <span class="value">${certData.donor}</span></td></tr>
            <tr><td colspan="2"><span class="label">ADDRESS:</span> <span class="value">${certData.address}</span></td></tr>
            <tr><td><span class="label">PHONE NO:</span> <span class="value">${certData.phone}</span></td><td><span class="label">SCHEME:</span> <span class="value">${certData.scheme}</span></td></tr>
            <tr><td><span class="label">AMOUNT:</span> <span class="value">₹${certData.amount}</span></td><td><span class="label">RECEIPT NO:</span> <span class="value">${certData.receipt}</span></td></tr>
            <tr><td><span class="label">PAYMENT MODE:</span> <span class="value">${certData.mode}</span></td><td><span class="label">EXPIRY ON:</span> <span class="value">${certData.expiry}</span></td></tr>
            <tr><td colspan="2"><span class="label">EMAIL ID:</span> <span class="value" style="text-transform:none;">${certData.email}</span></td></tr>
          </table>
          <div class="footer">
            <div style="text-align:center;"><div class="sign-line"></div><div class="sign-label">SUPERVISOR SIGNATURE</div></div>
            <div style="text-align:center;"><div class="sign-line"></div><div class="sign-label">PROJECT MANAGER SIGNATURE</div></div>
          </div>
        </div>
        <script>setTimeout(() => window.print(), 500);</script>
      </body>
      </html>
    `;
    const win = window.open("", "_blank", "width=900,height=1100");
    if (win) { win.document.write(html); win.document.close(); } else { alert("Popup blocked."); }
  };

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
           <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "#111827" }}>Dattu Yojana</h1>
           <div style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "4px" }}>
             Total Records: <strong>{filteredRows.length}</strong>
           </div>
        </div>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Status Filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={filterSelectStyle}>
             <option value="All">All Status</option>
             <option value="Active">Active</option>
             <option value="Expired">Expired</option>
          </select>

          {/* Search Input */}
          <input 
            type="text" 
            placeholder="Search Donor / Receipt..." 
            value={searchText} 
            onChange={e => setSearchText(e.target.value)} 
            style={searchInputStyle} 
          />

          {user?.role !== "Viewer" && (
            <button onClick={openAddForm} style={addBtnStyle}>+ Add</button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#f9fafb", textAlign: "left" }}>
            <tr>
              {/* Removed Date Column */}
              <th style={thStyle}>Donor</th>
              <th style={thStyle}>Mobile</th>
              <th style={thStyle}>Scheme</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>End Date</th>
              <th style={thStyle}>Status</th>
              <th style={{...thStyle, textAlign:"center"}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={emptyStyle}>Loading records...</td></tr> : 
             displayedRows.length === 0 ? <tr><td colSpan={7} style={emptyStyle}>No entries found.</td></tr> : 
             displayedRows.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                {/* Removed Date Cell */}
                <td style={tdStyle}>
                    <div style={{fontWeight:"600", color:"#1f2937"}}>{row.donorName}</div>
                    {row.cattleId && <div style={{fontSize:"0.75rem", color:"#6b7280"}}>Ref: {row.cattleId}</div>}
                </td>
                <td style={tdStyle}>{row.phone}</td>
                <td style={tdStyle}>{row.scheme}</td>
                <td style={{...tdStyle, fontWeight:"600"}}>₹{row.amount}</td>
                <td style={tdStyle}>{formatDisplayDate(row.endDate)}</td>
                <td style={tdStyle}>
                    <span style={{
                        background: String(row.schemeStatus).toLowerCase() === "active" ? "#dcfce7" : "#fee2e2",
                        color: String(row.schemeStatus).toLowerCase() === "active" ? "#166534" : "#991b1b",
                        padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold"
                    }}>
                        {row.schemeStatus}
                    </span>
                </td>
                <td style={{...tdStyle, textAlign:"center"}}>
                   <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                       <button onClick={() => setSelectedEntry(row)} style={viewBtnStyle} title="View Details">👁️</button>
                       {user?.role !== "Viewer" && <button onClick={() => openEditForm(row)} style={editBtnStyle} title="Edit">✏️</button>}
                       <button onClick={() => printCertificate(row)} style={certBtnStyle} title="Generate Certificate">📜</button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        {filteredRows.length > ITEMS_PER_PAGE && (
          <div style={paginationStyle}>
             <button onClick={handlePrev} disabled={currentPage === 1} style={pageBtnStyle}>Prev</button>
             <span style={pageNumberStyle}>Page {currentPage} of {totalPages}</span>
             <button onClick={handleNext} disabled={currentPage === totalPages} style={pageBtnStyle}>Next</button>
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div style={overlayStyle} onClick={() => setShowForm(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:"1rem", borderBottom:"1px solid #eee", paddingBottom:"10px"}}>
               <h2 style={{margin:0, fontSize:"1.2rem"}}>{editingRow ? "Edit" : "Add"} Dattu Entry</h2>
               <button onClick={() => setShowForm(false)} style={closeBtnStyle}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
               <div style={{background:"#f8fafc", padding:"15px", borderRadius:"8px", border:"1px solid #e2e8f0"}}>
                   <div style={{fontWeight:"bold", marginBottom:"10px", color:"#334155", fontSize:"0.9rem", textTransform:"uppercase"}}>Donor Details</div>
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

               <div style={{background:"#f8fafc", padding:"15px", borderRadius:"8px", border:"1px solid #e2e8f0"}}>
                   <div style={{fontWeight:"bold", marginBottom:"10px", color:"#334155", fontSize:"0.9rem", textTransform:"uppercase"}}>Scheme Info</div>
                   <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem"}}>
                       <Field label="Scheme *">
                          <select name="scheme" value={form.scheme} onChange={handleChange} style={inputStyle} required>
                              <option value="">Select...</option>
                              <option value="Punyakoti Dattu">Punyakoti Dattu</option>
                              <option value="Warehouse Scheme">Warehouse Scheme</option>
                              <option value="Kamadhenu Dattu">Kamadhenu Dattu</option>
                              <option value="Shashwatha Seva">Shashwatha Seva</option>
                          </select>
                       </Field>
                       <Field label="Cattle Internal ID"><input type="text" name="cattleId" value={form.cattleId} onChange={handleChange} style={inputStyle} placeholder="e.g. RPCAT0128" /></Field>
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

               <div style={{background:"#f8fafc", padding:"15px", borderRadius:"8px", border:"1px solid #e2e8f0"}}>
                   <div style={{fontWeight:"bold", marginBottom:"10px", color:"#334155", fontSize:"0.9rem", textTransform:"uppercase"}}>Payment Info</div>
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
                  <button type="submit" disabled={loading} style={btnSaveStyle}>Save Entry</button>
               </div>
            </form>
          </div>
        </div>
      )}
      
      {/* View Modal */}
      {selectedEntry && (
        <div style={overlayStyle} onClick={() => setSelectedEntry(null)}>
           <div style={viewModalStyle} onClick={e => e.stopPropagation()}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:"1rem", borderBottom:"1px solid #eee", paddingBottom:"10px"}}>
                 <h2 style={{margin:0, fontSize:"1.2rem"}}>Details: {selectedEntry.donorName}</h2>
                 <button onClick={() => setSelectedEntry(null)} style={closeBtnStyle}>✕</button>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.2rem", fontSize:"0.9rem"}}>
                 <DetailItem label="Payment Date" value={formatDisplayDate(selectedEntry.date)} />
                 <DetailItem label="Amount" value={selectedEntry.amount} isBold />
                 
                 <DetailItem label="Donor Name" value={selectedEntry.donorName} />
                 <DetailItem label="Mobile" value={selectedEntry.phone} />
                 <DetailItem label="Email" value={selectedEntry.email} />
                 <DetailItem label="PAN" value={selectedEntry.pan} />
                 <DetailItem label="Address" value={selectedEntry.address} fullWidth />
                 
                 <div style={{gridColumn:"span 2", borderTop:"1px dashed #eee", margin:"5px 0"}}></div>

                 <DetailItem label="Scheme" value={selectedEntry.scheme} />
                 <DetailItem label="Status" value={selectedEntry.schemeStatus} />
                 <DetailItem label="Start Date" value={formatDisplayDate(selectedEntry.startDate)} />
                 <DetailItem label="End Date" value={formatDisplayDate(selectedEntry.endDate)} />
                 
                 <div style={{gridColumn:"span 2", borderTop:"1px dashed #eee", margin:"5px 0"}}></div>

                 <DetailItem label="Cattle ID" value={selectedEntry.cattleId} />
                 <DetailItem label="Receipt No" value={selectedEntry.receiptNo} />
                 <DetailItem label="Reference" value={selectedEntry.referenceNumber} />
              </div>
              {selectedEntry.remarks && (
                  <div style={{marginTop:"1.5rem", padding:"10px", background:"#fffbeb", borderRadius:"6px", border:"1px solid #fcd34d"}}>
                      <div style={{fontSize:"0.75rem", fontWeight:"bold", color:"#92400e"}}>REMARKS</div>
                      <div style={{color:"#78350f"}}>{selectedEntry.remarks}</div>
                  </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

// --- Styles ---
const searchInputStyle = { padding: "0.4rem 0.8rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", width: "220px" };
const filterSelectStyle = { padding: "0.4rem 0.8rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", background: "white" };
const addBtnStyle = { padding: "0.5rem 1rem", borderRadius: "6px", border: "none", background: "#16a34a", color: "#ffffff", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" };
const thStyle = { padding: "0.8rem 1rem", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: "0.8rem", color: "#64748b" };
const tdStyle = { padding: "0.8rem 1rem", borderBottom: "1px solid #e5e7eb", color: "#1f2937" };
const emptyStyle = { padding: "3rem", textAlign: "center", color: "#6b7280" };
const viewBtnStyle = { border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.3rem 0.6rem", background: "#eff6ff", color: "#1d4ed8", fontSize: "0.9rem", cursor: "pointer" };
const editBtnStyle = { border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.3rem 0.6rem", background: "#fff7ed", color: "#c2410c", fontSize: "0.9rem", cursor: "pointer" };
const certBtnStyle = { border: "1px solid #bbf7d0", borderRadius: "6px", padding: "0.3rem 0.6rem", background: "#f0fdf4", color: "#15803d", fontSize: "0.9rem", cursor: "pointer", fontWeight:"bold" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 };
const modalStyle = { background: "white", padding: "0", borderRadius: "12px", width: "95%", maxWidth: "650px", maxHeight:"90vh", overflowY:"auto", padding: "1.5rem" };
const viewModalStyle = { background: "white", padding: "1.5rem", borderRadius: "12px", width: "95%", maxWidth: "600px" };
const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", boxSizing: "border-box" };
const btnCancelStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontWeight: "600" };
const btnSaveStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "none", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" };
const closeBtnStyle = { background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#6b7280" };
const paginationStyle = { display: "flex", justifyContent: "space-between", alignItems:"center", padding:"1rem", background:"#f9fafb", borderTop:"1px solid #e5e7eb" };
const pageBtnStyle = { padding: "6px 14px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", borderRadius:"6px", fontSize:"0.85rem", fontWeight: "500" };
const pageNumberStyle = { fontSize: "0.9rem", color: "#4b5563", fontWeight: "500" };

function Field({ label, children, style }) { return <div style={style}><label style={{ display: "block", fontSize: "0.8rem", color: "#4b5563", marginBottom: "0.3rem", fontWeight: "500" }}>{label}</label>{children}</div>; }
function DetailItem({ label, value, isBold, fullWidth }) { return <div style={{ gridColumn: fullWidth ? "span 2" : "span 1" }}><div style={{fontSize:"0.75rem", color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.02em"}}>{label}</div><div style={{fontWeight: isBold ? "700" : "500", color: "#111827", marginTop:"2px"}}>{value || "-"}</div></div>; }