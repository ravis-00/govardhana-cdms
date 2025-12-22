// src/pages/MilkYield.jsx
import React, { useEffect, useState } from "react";
import { 
  getMilkProduction, addMilkProduction, updateMilkProduction,
  getMilkDistribution, addMilkDistribution, updateMilkDistribution
} from "../api/masterApi";

// --- HELPERS ---
function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB");
}

export default function MilkYield() {
  const [activeTab, setActiveTab] = useState("production"); 
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [prodRows, setProdRows] = useState([]);
  const [distRows, setDistRows] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState({});

  // View Modal State
  const [viewData, setViewData] = useState(null);

  // --- FETCH DATA ---
  useEffect(() => {
    loadData();
  }, [month, activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      const [y, m] = month.split('-');
      const fromDate = `${y}-${m}-01`;
      const toDate = `${y}-${m}-31`; 

      if (activeTab === "production") {
        const data = await getMilkProduction({ fromDate, toDate });
        setProdRows(Array.isArray(data) ? data : []);
      } else {
        const data = await getMilkDistribution({ fromDate, toDate });
        setDistRows(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // --- FORM HANDLERS ---

  function openAddModal() {
    setIsEditMode(false);
    const today = new Date().toISOString().slice(0, 10);
    
    if (activeTab === "production") {
      setForm({
        date: today, shedId: "Goshala-1", 
        amGood: "", amColostrum: "", 
        pmGood: "", pmColostrum: "", 
        remarks: ""
      });
    } else {
      setForm({
        date: today, 
        amByProd: "", amTemple: "", 
        pmByProd: "", toBulls: "", 
        toWorkers: "", toCanteen: "", 
        toEvents: "", outPassQty: "", outPassNum: "",
        remarks: ""
      });
    }
    setShowModal(true);
  }

  function openEditModal(row) {
    setIsEditMode(true);
    const dateStr = row.date ? row.date.split('T')[0] : "";
    setForm({ ...row, date: dateStr });
    setShowModal(true);
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (activeTab === "production") {
        isEditMode ? await updateMilkProduction(form) : await addMilkProduction(form);
      } else {
        isEditMode ? await updateMilkDistribution(form) : await addMilkDistribution(form);
      }
      setShowModal(false);
      loadData(); 
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- RENDER ---

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1f2937" }}>Milk Operations</h1>
        
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <input 
            type="month" 
            value={month} 
            onChange={e => setMonth(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }} 
          />
          <button onClick={openAddModal} style={btnAddStyle}>+ Add Entry</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb", marginBottom: "1rem" }}>
        <TabButton label="🏭 Production (Shed-wise)" active={activeTab === "production"} onClick={() => setActiveTab("production")} />
        <TabButton label="🚚 Distribution (Usage)" active={activeTab === "distribution"} onClick={() => setActiveTab("distribution")} />
      </div>

      {/* TABLE AREA */}
      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading data...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead style={{ background: "#f9fafb", color: "#374151", textTransform: "uppercase", fontSize: "0.75rem" }}>
              <tr>
                <th style={thStyle}>Date</th>
                {activeTab === "production" ? (
                  <>
                    <th style={thStyle}>Shed</th>
                    <th style={thStyle}>AM Good</th>
                    <th style={thStyle}>AM Colos.</th>
                    <th style={thStyle}>PM Good</th>
                    <th style={thStyle}>PM Colos.</th>
                  </>
                ) : (
                  <>
                    <th style={thStyle}>AM ByProd</th>
                    <th style={thStyle}>Temple</th>
                    <th style={thStyle}>Workers</th>
                    <th style={thStyle}>OutPass</th>
                  </>
                )}
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === "production" ? prodRows : distRows).length === 0 ? (
                <tr><td colSpan="7" style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No records found.</td></tr>
              ) : (
                (activeTab === "production" ? prodRows : distRows).map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={tdStyle}>{formatDate(row.date)}</td>
                    
                    {activeTab === "production" ? (
                      <>
                        <td style={tdStyle}>{row.shedId}</td>
                        <td style={tdStyle}>{row.amGood}</td>
                        <td style={tdStyle}>{row.amColostrum}</td>
                        <td style={tdStyle}>{row.pmGood}</td>
                        <td style={tdStyle}>{row.pmColostrum}</td>
                      </>
                    ) : (
                      <>
                        <td style={tdStyle}>{row.amByProd}</td>
                        <td style={tdStyle}>{row.amTemple}</td>
                        <td style={tdStyle}>{row.toWorkers}</td>
                        <td style={tdStyle}>{row.outPassQty} (No: {row.outPassNum})</td>
                      </>
                    )}
                    
                    <td style={tdStyle}>
                      <button onClick={() => setViewData(row)} style={iconBtnStyle} title="View">👁️</button>
                      <button onClick={() => openEditModal(row)} style={iconBtnStyle} title="Edit">✏️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {showModal && (
        <div style={overlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: "1rem" }}>{isEditMode ? "Edit" : "Add"} {activeTab}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <Field label="Date">
                  <input type="date" name="date" value={form.date} onChange={handleInputChange} style={inputStyle} required />
              </Field>

              {activeTab === "production" ? (
                <>
                  <Field label="Shed ID">
                    <select name="shedId" value={form.shedId} onChange={handleInputChange} style={inputStyle}>
                      <option value="Goshala-1">Goshala-1</option>
                      <option value="Goshala-2">Goshala-2</option>
                      <option value="Quarantine">Quarantine</option>
                    </select>
                  </Field>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <Field label="AM Good Qty"><input type="number" step="0.1" name="amGood" value={form.amGood} onChange={handleInputChange} style={inputStyle} /></Field>
                    <Field label="AM Colostrum"><input type="number" step="0.1" name="amColostrum" value={form.amColostrum} onChange={handleInputChange} style={inputStyle} /></Field>
                    <Field label="PM Good Qty"><input type="number" step="0.1" name="pmGood" value={form.pmGood} onChange={handleInputChange} style={inputStyle} /></Field>
                    <Field label="PM Colostrum"><input type="number" step="0.1" name="pmColostrum" value={form.pmColostrum} onChange={handleInputChange} style={inputStyle} /></Field>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <Field label="AM to ByProducts"><input type="number" step="0.1" name="amByProd" value={form.amByProd} onChange={handleInputChange} style={inputStyle} /></Field>
                    <Field label="AM to Temple"><input type="number" step="0.1" name="amTemple" value={form.amTemple} onChange={handleInputChange} style={inputStyle} /></Field>
                    <Field label="PM to ByProducts"><input type="number" step="0.1" name="pmByProd" value={form.pmByProd} onChange={handleInputChange} style={inputStyle} /></Field>
                    <Field label="To Bulls"><input type="number" step="0.1" name="toBulls" value={form.toBulls} onChange={handleInputChange} style={inputStyle} /></Field>
                    <Field label="To Workers"><input type="number" step="0.1" name="toWorkers" value={form.toWorkers} onChange={handleInputChange} style={inputStyle} /></Field>
                    <Field label="To Canteen"><input type="number" step="0.1" name="toCanteen" value={form.toCanteen} onChange={handleInputChange} style={inputStyle} /></Field>
                    <Field label="To Events"><input type="number" step="0.1" name="toEvents" value={form.toEvents} onChange={handleInputChange} style={inputStyle} /></Field>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <Field label="Out Pass Qty"><input type="number" step="0.1" name="outPassQty" value={form.outPassQty} onChange={handleInputChange} style={inputStyle} /></Field>
                    <Field label="Out Pass Number"><input type="text" name="outPassNum" value={form.outPassNum} onChange={handleInputChange} style={inputStyle} /></Field>
                  </div>
                </>
              )}

              <Field label="Remarks">
                <input type="text" name="remarks" value={form.remarks} onChange={handleInputChange} style={inputStyle} />
              </Field>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowModal(false)} style={btnCancelStyle}>Cancel</button>
                <button type="submit" disabled={loading} style={btnSaveStyle}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW MODAL --- */}
      {viewData && (
        <div style={overlayStyle} onClick={() => setViewData(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: "1rem", borderBottom:"1px solid #eee", paddingBottom:"0.5rem" }}>Details</h2>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", fontSize:"0.9rem" }}>
                <ViewItem label="Date" value={formatDate(viewData.date)} />
                {activeTab === "production" ? (
                    <>
                        <ViewItem label="Shed ID" value={viewData.shedId} />
                        <ViewItem label="AM Good" value={viewData.amGood} />
                        <ViewItem label="AM Colos." value={viewData.amColostrum} />
                        <ViewItem label="PM Good" value={viewData.pmGood} />
                        <ViewItem label="PM Colos." value={viewData.pmColostrum} />
                    </>
                ) : (
                    <>
                        <ViewItem label="AM ByProd" value={viewData.amByProd} />
                        <ViewItem label="Temple" value={viewData.amTemple} />
                        <ViewItem label="Workers" value={viewData.toWorkers} />
                        <ViewItem label="Canteen" value={viewData.toCanteen} />
                        <ViewItem label="OutPass Qty" value={viewData.outPassQty} />
                        <ViewItem label="OutPass Num" value={viewData.outPassNum} />
                    </>
                )}
                <ViewItem label="Remarks" value={viewData.remarks} />
            </div>
            <div style={{ marginTop:"1.5rem", textAlign:"right" }}>
                <button onClick={() => setViewData(null)} style={btnCancelStyle}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES & COMPONENTS ---
function TabButton({ label, active, onClick }) {
    return <button onClick={onClick} style={{ padding: "0.75rem 1.5rem", cursor: "pointer", border: "none", background: "none", borderBottom: active ? "3px solid #2563eb" : "3px solid transparent", color: active ? "#2563eb" : "#6b7280", fontWeight: active ? "600" : "500", fontSize: "1rem" }}>{label}</button>;
}
function Field({ label, children }) { return <div><label style={{ display: "block", fontSize: "0.85rem", color: "#374151", marginBottom: "0.25rem" }}>{label}</label>{children}</div>; }
function ViewItem({ label, value }) { return <div><div style={{ fontSize:"0.75rem", color:"#6b7280" }}>{label}</div><div style={{ fontWeight:"500" }}>{value || "-"}</div></div>; }

const btnAddStyle = { background: "#16a34a", color: "white", padding: "0.5rem 1rem", borderRadius: "20px", border: "none", fontWeight: "600", cursor: "pointer" };
const thStyle = { padding: "1rem", textAlign: "left", fontWeight: "600", color: "#4b5563" };
const tdStyle = { padding: "0.8rem 1rem", color: "#1f2937" };
const iconBtnStyle = { background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "0 0.3rem" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50 };
const modalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };
const inputStyle = { width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.95rem" };
const btnCancelStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", cursor: "pointer" };
const btnSaveStyle = { padding: "0.6rem 1.2rem", borderRadius: "6px", border: "none", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" };