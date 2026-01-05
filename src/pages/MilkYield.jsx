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
      const lastDay = new Date(y, m, 0).getDate();
      const toDate = `${y}-${m}-${lastDay}`; 

      if (activeTab === "production") {
        const res = await getMilkProduction({ fromDate, toDate });
        
        // 🔥 FIX: Handle API Wrapper Object ({ success: true, data: [] })
        let rawData = [];
        if (res && res.data && Array.isArray(res.data)) {
            rawData = res.data;
        } else if (Array.isArray(res)) {
            rawData = res;
        }

        const sorted = rawData.sort((a,b) => new Date(b.date) - new Date(a.date));
        setProdRows(sorted);

      } else {
        const res = await getMilkDistribution({ fromDate, toDate });
        
        // 🔥 FIX: Handle API Wrapper Object
        let rawData = [];
        if (res && res.data && Array.isArray(res.data)) {
            rawData = res.data;
        } else if (Array.isArray(res)) {
            rawData = res;
        }

        const sorted = rawData.sort((a,b) => new Date(b.date) - new Date(a.date));
        setDistRows(sorted);
      }
    } catch (err) {
      console.error("Load Error:", err);
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
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1f2937", margin: 0 }}>Milk Operations</h1>
        
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <input 
            type="month" 
            value={month} 
            onChange={e => setMonth(e.target.value)}
            className="form-input"
            style={{ width: "auto", padding: "0.5rem" }} 
          />
          <button onClick={openAddModal} className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>+ Add Entry</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", width: "100%", borderBottom: "2px solid #e5e7eb", marginBottom: "1rem" }}>
        <TabButton label="🏭 Production" active={activeTab === "production"} onClick={() => setActiveTab("production")} />
        <TabButton label="🚚 Distribution" active={activeTab === "distribution"} onClick={() => setActiveTab("distribution")} />
      </div>

      {/* TABLE AREA (Scrollable Container) */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading data...</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: "800px" }}>
              <thead style={{ background: "#f9fafb", color: "#374151", textTransform: "uppercase", fontSize: "0.75rem", borderBottom: "2px solid #e5e7eb" }}>
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
                  <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === "production" ? prodRows : distRows).length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>No records found for {month}.</td></tr>
                ) : (
                  (activeTab === "production" ? prodRows : distRows).map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={tdStyle}>{formatDate(row.date)}</td>
                      
                      {activeTab === "production" ? (
                        <>
                          <td style={tdStyle}>{row.shedId || row.shed}</td>
                          <td style={tdStyle}>{row.amGoodQty || row.amGood}</td>
                          <td style={tdStyle}>{row.amColostrumQty || row.amColostrum}</td>
                          <td style={tdStyle}>{row.pmGoodQty || row.pmGood}</td>
                          <td style={tdStyle}>{row.pmColostrumQty || row.pmColostrum}</td>
                        </>
                      ) : (
                        <>
                          <td style={tdStyle}>{row.amToByProducts || row.amByProd}</td>
                          <td style={tdStyle}>{row.amTemple}</td>
                          <td style={tdStyle}>{row.toWorkers}</td>
                          <td style={tdStyle}>{row.outPassQty} {row.outPassNumber || row.outPassNum ? `(#${row.outPassNumber || row.outPassNum})` : ""}</td>
                        </>
                      )}
                      
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                          <button onClick={() => setViewData(row)} style={iconBtnStyle} title="View">👁️</button>
                          <button onClick={() => openEditModal(row)} style={iconBtnStyle} title="Edit">✏️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {showModal && (
        <div style={overlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>{isEditMode ? "Edit" : "Add"} {activeTab === "production" ? "Production" : "Distribution"}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <div className="responsive-grid">
                  <Field label="Date">
                      <input type="date" name="date" value={form.date} onChange={handleInputChange} className="form-input" required />
                  </Field>
                  {activeTab === "production" && (
                    <Field label="Shed ID">
                        <select name="shedId" value={form.shedId} onChange={handleInputChange} className="form-select">
                        <option value="Goshala-1">Goshala-1</option>
                        <option value="Goshala-2">Goshala-2</option>
                        <option value="Quarantine">Quarantine</option>
                        </select>
                    </Field>
                  )}
              </div>

              {activeTab === "production" ? (
                <>
                  <div className="responsive-grid">
                    <Field label="AM Good Qty (L)"><input type="number" step="0.1" name="amGood" value={form.amGood} onChange={handleInputChange} className="form-input" /></Field>
                    <Field label="AM Colostrum (L)"><input type="number" step="0.1" name="amColostrum" value={form.amColostrum} onChange={handleInputChange} className="form-input" /></Field>
                  </div>
                  <div className="responsive-grid">
                    <Field label="PM Good Qty (L)"><input type="number" step="0.1" name="pmGood" value={form.pmGood} onChange={handleInputChange} className="form-input" /></Field>
                    <Field label="PM Colostrum (L)"><input type="number" step="0.1" name="pmColostrum" value={form.pmColostrum} onChange={handleInputChange} className="form-input" /></Field>
                  </div>
                </>
              ) : (
                <>
                  <div className="responsive-grid">
                    <Field label="AM to ByProducts"><input type="number" step="0.1" name="amByProd" value={form.amByProd} onChange={handleInputChange} className="form-input" /></Field>
                    <Field label="AM to Temple"><input type="number" step="0.1" name="amTemple" value={form.amTemple} onChange={handleInputChange} className="form-input" /></Field>
                  </div>
                  <div className="responsive-grid">
                    <Field label="PM to ByProducts"><input type="number" step="0.1" name="pmByProd" value={form.pmByProd} onChange={handleInputChange} className="form-input" /></Field>
                    <Field label="To Bulls"><input type="number" step="0.1" name="toBulls" value={form.toBulls} onChange={handleInputChange} className="form-input" /></Field>
                  </div>
                  <div className="responsive-grid">
                    <Field label="To Workers"><input type="number" step="0.1" name="toWorkers" value={form.toWorkers} onChange={handleInputChange} className="form-input" /></Field>
                    <Field label="To Canteen"><input type="number" step="0.1" name="toCanteen" value={form.toCanteen} onChange={handleInputChange} className="form-input" /></Field>
                  </div>
                  <div className="responsive-grid">
                    <Field label="Out Pass Qty"><input type="number" step="0.1" name="outPassQty" value={form.outPassQty} onChange={handleInputChange} className="form-input" /></Field>
                    <Field label="Out Pass Number"><input type="text" name="outPassNum" value={form.outPassNum} onChange={handleInputChange} className="form-input" /></Field>
                  </div>
                </>
              )}

              <Field label="Remarks">
                <input type="text" name="remarks" value={form.remarks} onChange={handleInputChange} className="form-input" />
              </Field>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-full-mobile">Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary btn-full-mobile">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW MODAL --- */}
      {viewData && (
        <div style={overlayStyle} onClick={() => setViewData(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.5rem" }}>
                <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Entry Details</h2>
                <button onClick={() => setViewData(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", color: "#6b7280", cursor: "pointer" }}>&times;</button>
            </div>
            
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", fontSize:"0.9rem" }}>
                <ViewItem label="Date" value={formatDate(viewData.date)} />
                {activeTab === "production" ? (
                    <>
                        <ViewItem label="Shed ID" value={viewData.shedId || viewData.shed} />
                        <ViewItem label="AM Good" value={viewData.amGood || viewData.amGoodQty} />
                        <ViewItem label="AM Colos." value={viewData.amColostrum || viewData.amColostrumQty} />
                        <ViewItem label="PM Good" value={viewData.pmGood || viewData.pmGoodQty} />
                        <ViewItem label="PM Colos." value={viewData.pmColostrum || viewData.pmColostrumQty} />
                    </>
                ) : (
                    <>
                        <ViewItem label="AM ByProd" value={viewData.amByProd || viewData.amToByProducts} />
                        <ViewItem label="Temple" value={viewData.amTemple} />
                        <ViewItem label="Workers" value={viewData.toWorkers} />
                        <ViewItem label="Canteen" value={viewData.toCanteen} />
                        <ViewItem label="OutPass Qty" value={viewData.outPassQty} />
                        <ViewItem label="OutPass Num" value={viewData.outPassNum || viewData.outPassNumber} />
                    </>
                )}
                <div style={{ gridColumn: "1 / -1" }}>
                    <ViewItem label="Remarks" value={viewData.remarks} />
                </div>
            </div>
            
            <div style={{ marginTop:"1.5rem", textAlign:"right" }}>
                <button onClick={() => setViewData(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES & COMPONENTS ---

function TabButton({ label, active, onClick }) {
    return (
      <button 
        onClick={onClick} 
        style={{ 
          flex: 1, 
          textAlign: "center",
          padding: "0.85rem 1rem", 
          cursor: "pointer", 
          border: "none", 
          background: "none", 
          borderBottom: active ? "3px solid #2563eb" : "3px solid transparent", 
          color: active ? "#2563eb" : "#6b7280", 
          fontWeight: active ? "600" : "500", 
          fontSize: "1rem",
          transition: "all 0.2s ease"
        }}
      >
        {label}
      </button>
    );
}

function Field({ label, children }) { 
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            {children}
        </div>
    ); 
}

function ViewItem({ label, value }) { 
    return (
        <div>
            <div style={{ fontSize:"0.75rem", color:"#6b7280", textTransform: "uppercase", fontWeight: "bold" }}>{label}</div>
            <div style={{ fontWeight:"500", fontSize: "1rem", color: "#1f2937" }}>{value || "-"}</div>
        </div>
    ); 
}

const thStyle = { padding: "1rem", textAlign: "left", fontWeight: "600", color: "#4b5563" };
const tdStyle = { padding: "0.8rem 1rem", color: "#1f2937" };
const iconBtnStyle = { background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "0 0.3rem" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50, padding: "1rem" };
const modalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };