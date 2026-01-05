import React, { useEffect, useState, useRef } from "react";
import { getBioWaste, addBioWaste, updateBioWaste, getSheds } from "../api/masterApi";

// --- HELPERS ---
function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatDisplayDate(val) {
  if (!val) return "";
  if (String(val).match(/^\d{2}-\d{2}-\d{4}$/)) return val; 
  
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  
  const day = String(d.getDate()).padStart(2, '0');
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${mon}-${year}`;
}

function getEmptyForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    sourceShed: [], 
    wasteType: "Dung (Gomaya)",
    quantity: "",
    unit: "Tractor Load",
    destination: "", 
    receiver: "",
    sender: "",
    remarks: ""
  };
}

export default function BioWaste() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shedOptions, setShedOptions] = useState([]); // 🔥 Dynamic Sheds
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [selectedEntry, setSelectedEntry] = useState(null); 

  // --- FETCH DATA ---
  useEffect(() => {
    loadData();
    loadSheds();
  }, [month]);

  async function loadSheds() {
    try {
      if(typeof getSheds === 'function') {
        const res = await getSheds();
        if(res && res.success && Array.isArray(res.data)) {
           setShedOptions(res.data.map(s => typeof s === 'object' ? s.name : s));
        } else {
           // Fallback
           setShedOptions(["Govardhanagiri", "Nandini-Old", "Nandini-New", "Quarantine"]);
        }
      }
    } catch(e) { console.warn("Shed load failed", e); }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [y, m] = month.split('-');
      const fromDate = `${y}-${m}-01`;
      const toDate = `${y}-${m}-31`; 
      
      const res = await getBioWaste({ fromDate, toDate });
      
      // 🔥 FIX: Handle API Wrapper
      let rawData = [];
      if (res && res.data && Array.isArray(res.data)) {
          rawData = res.data;
      } else if (Array.isArray(res)) {
          rawData = res;
      }
      
      const sorted = rawData.sort((a,b) => {
         // Sort logic handling dd-mm-yyyy or yyyy-mm-dd
         const dateA = a.date.includes('-') && a.date.split('-')[0].length === 2 
             ? a.date.split('-').reverse().join('-') : a.date;
         const dateB = b.date.includes('-') && b.date.split('-')[0].length === 2 
             ? b.date.split('-').reverse().join('-') : b.date;
         return new Date(dateB) - new Date(dateA);
      });
      
      setRows(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // --- HANDLERS ---
  function openAddModal() {
    setIsEditMode(false);
    setForm(getEmptyForm());
    setShowModal(true);
  }

  function openEditModal(row) {
    setIsEditMode(true);
    
    // 1. Handle Date
    let dateStr = row.date;
    if (dateStr && dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
       const [d, m, y] = dateStr.split('-');
       dateStr = `${y}-${m}-${d}`;
    }

    // 2. Handle Multi-Select Sheds
    let shedArray = [];
    if (row.sourceShed) {
      shedArray = row.sourceShed.split(',').map(s => s.trim()).filter(Boolean);
    }

    setForm({ 
        ...row, 
        date: dateStr,
        sourceShed: shedArray, 
        quantity: row.quantity || "" 
    });
    setShowModal(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleShedChange(newShedArray) {
    setForm(prev => ({ ...prev, sourceShed: newShedArray }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        sourceShed: form.sourceShed.join(", ") 
      };

      if(isEditMode) await updateBioWaste(payload);
      else await addBioWaste(payload);
      
      setShowModal(false);
      loadData(); 
      alert(isEditMode ? "Updated successfully" : "Added successfully");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0, color: "#111827" }}>Bio Waste Management</h1>
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

      {/* TABLE CARD */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}> {/* 🔥 SCROLLABLE CONTAINER */}
          {loading ? (
             <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading...</div>
          ) : (
             <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: "900px" }}>
               <thead style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                 <tr>
                   <th style={thStyle}>Date</th>
                   <th style={thStyle}>Source Shed(s)</th>
                   <th style={thStyle}>Waste Type</th>
                   <th style={thStyle}>Quantity</th>
                   <th style={thStyle}>Destination</th>
                   <th style={thStyle}>Sender &rarr; Receiver</th>
                   <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {rows.length === 0 ? (
                   <tr><td colSpan="7" style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>No records found for this month.</td></tr>
                 ) : (
                   rows.map((row, i) => (
                     <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                       <td style={tdStyle}><strong>{formatDisplayDate(row.date)}</strong></td>
                       <td style={tdStyle}>{row.sourceShed}</td>
                       <td style={tdStyle}>
                         <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" }}>{row.wasteType}</span>
                       </td>
                       <td style={tdStyle}><strong>{row.quantity}</strong> {row.unit}</td>
                       <td style={tdStyle}>{row.destination}</td>
                       <td style={tdStyle}>
                         <div style={{fontSize:"0.8rem", color:"#4b5563"}}>{row.sender || "-"}</div>
                         <div style={{fontSize:"0.8rem", fontWeight:"bold"}}>&darr; {row.receiver || "-"}</div>
                       </td>
                       <td style={{ ...tdStyle, textAlign: "center" }}>
                         <div style={{display:"flex", gap:"5px", justifyContent:"center"}}>
                             <button onClick={() => setSelectedEntry(row)} style={iconBtnStyle}>👁️</button>
                             <button onClick={() => openEditModal(row)} style={iconBtnStyle}>✏️</button>
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

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div style={overlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem", color:"#111827" }}>{isEditMode ? "Edit" : "Add"} Bio Waste</h2>
            
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <div className="responsive-grid">
                <Field label="Date">
                   <input type="date" name="date" value={form.date} onChange={handleChange} className="form-input" required />
                </Field>
                
                <Field label="Source Shed(s)">
                   {/* 🔥 Uses Dynamic Shed List */}
                   <ShedMultiSelect 
                      options={shedOptions} 
                      selected={form.sourceShed} 
                      onChange={handleShedChange} 
                   />
                </Field>
              </div>

              <div className="responsive-grid">
                 <Field label="Waste Type">
                    <select name="wasteType" value={form.wasteType} onChange={handleChange} className="form-select">
                       <option value="Dung (Gomaya)">Dung (Gomaya)</option>
                       <option value="Urine (Gomutra)">Urine (Gomutra)</option>
                       <option value="Slurry">Slurry</option>
                       <option value="Leftover Feed">Leftover Feed</option>
                       <option value="Compost (Gobbara)">Compost (Gobbara)</option>
                       <option value="Others">Others</option>
                    </select>
                 </Field>
                 <div style={{display:"flex", gap:"0.5rem"}}>
                    <div style={{flex: 1}}>
                        <Field label="Quantity">
                           <input type="number" step="0.01" name="quantity" value={form.quantity} onChange={handleChange} className="form-input" required />
                        </Field>
                    </div>
                    <div style={{width: "110px"}}>
                        <Field label="Unit">
                           <select name="unit" value={form.unit} onChange={handleChange} className="form-select">
                              <option value="Tractor Load">Tractor</option>
                              <option value="Wheelbarrow">Barrow</option>
                              <option value="Kg">Kg</option>
                              <option value="Liters">L</option>
                              <option value="Tank">Tank</option>
                           </select>
                        </Field>
                    </div>
                 </div>
              </div>

              <Field label="Destination (Destination Unit)">
                  <input type="text" name="destination" value={form.destination} onChange={handleChange} className="form-input" placeholder="e.g. Biogas Plant, Compost Pit" />
              </Field>

              <div className="responsive-grid">
                 <Field label="Sender (From Incharge)">
                    <input type="text" name="sender" value={form.sender} onChange={handleChange} className="form-input" />
                 </Field>
                 <Field label="Receiver (To Incharge)">
                    <input type="text" name="receiver" value={form.receiver} onChange={handleChange} className="form-input" />
                 </Field>
              </div>

              <Field label="Remarks">
                  <input type="text" name="remarks" value={form.remarks} onChange={handleChange} className="form-input" />
              </Field>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-full-mobile">Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary btn-full-mobile">{isEditMode ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedEntry && (
        <div style={overlayStyle} onClick={() => setSelectedEntry(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
             <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #eee", paddingBottom:"10px", marginBottom:"15px"}}>
                <h2 style={{ margin:0, fontSize:"1.25rem" }}>Details: {formatDisplayDate(selectedEntry.date)}</h2>
                <button onClick={() => setSelectedEntry(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", color: "#6b7280", cursor: "pointer" }}>&times;</button>
             </div>

             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", fontSize:"0.95rem" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                    <DetailItem label="Source Shed(s)" value={selectedEntry.sourceShed} />
                </div>
                <DetailItem label="Waste Type" value={selectedEntry.wasteType} />
                <DetailItem label="Quantity" value={`${selectedEntry.quantity} ${selectedEntry.unit}`} isBold />
                <DetailItem label="Destination" value={selectedEntry.destination} />
                <DetailItem label="Sender" value={selectedEntry.sender} />
                <DetailItem label="Receiver" value={selectedEntry.receiver} />
                <div style={{ gridColumn: "1 / -1" }}>
                    <DetailItem label="Remarks" value={selectedEntry.remarks} />
                </div>
             </div>

             <div style={{marginTop:"20px", display:"flex", justifyContent:"flex-end"}}>
                <button onClick={() => { setSelectedEntry(null); openEditModal(selectedEntry); }} className="btn btn-primary">Edit This Entry</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- NEW COMPONENT: Multi-Select Dropdown ---
function ShedMultiSelect({ options, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* The "Box" that looks like a select input */}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="form-input"
        style={{
          cursor: "pointer",
          background: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: "38px"
        }}
      >
        <span style={{ 
            color: selected.length ? "#111" : "#9ca3af", 
            whiteSpace: "nowrap", 
            overflow: "hidden", 
            textOverflow: "ellipsis",
            maxWidth: "90%"
        }}>
          {selected.length > 0 ? selected.join(", ") : "-- Select Sheds --"}
        </span>
        <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>▼</span>
      </div>

      {/* The Dropdown List */}
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          zIndex: 10,
          background: "white",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          marginTop: "4px",
          maxHeight: "200px",
          overflowY: "auto",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
        }}>
          {options.map(option => (
            <div 
              key={option} 
              onClick={() => toggleOption(option)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderBottom: "1px solid #f3f4f6",
                background: selected.includes(option) ? "#eff6ff" : "white"
              }}
            >
              <input 
                type="checkbox" 
                checked={selected.includes(option)} 
                onChange={() => {}} // Handled by div click
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: "0.9rem", color: "#374151" }}>{option}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- STYLES & COMPONENTS ---
const thStyle = { padding: "1rem", textAlign: "left", fontWeight: "600", color: "#4b5563", fontSize: "0.8rem", textTransform: "uppercase" };
const tdStyle = { padding: "0.8rem 1rem", color: "#1f2937", borderBottom: "1px solid #f3f4f6" };
const iconBtnStyle = { background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "0 0.3rem" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50, padding: "1rem" };
const modalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };

function Field({ label, children }) { 
    return <div style={{ marginBottom: "0.5rem" }}><label style={{ display: "block", fontSize: "0.85rem", color: "#374151", marginBottom: "0.3rem", fontWeight:"600" }}>{label}</label>{children}</div>; 
}

function DetailItem({ label, value, isBold }) {
    return (
        <div style={{ padding:"5px 0", borderBottom:"1px dashed #f0f0f0" }}>
            <div style={{fontSize:"0.75rem", color:"#6b7280", textTransform:"uppercase", fontWeight: "bold"}}>{label}</div>
            <div style={{fontWeight: isBold ? "700" : "500", color:"#111", fontSize: isBold ? "1.1rem" : "1rem"}}>{value || "-"}</div>
        </div>
    );
}