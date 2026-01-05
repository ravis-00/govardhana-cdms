import React, { useMemo, useState, useEffect } from "react";
import { getCattle, updateCattleTag } from "../api/masterApi"; 

function getToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function NewTag() {
  const [search, setSearch] = useState("");
  const [selectedAnimalId, setSelectedAnimalId] = useState(null);
  
  // Real Data State
  const [cattleList, setCattleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    newTagNo: "",
    changeDate: getToday(),
    reason: "",
    remarks: "",
  });

  // --- 1. LOAD CATTLE ON MOUNT ---
  useEffect(() => {
    async function loadData() {
      try {
        const res = await getCattle();
        
        // 🔥 FIX: Check for res.data (The wrapper)
        if (res && res.data && Array.isArray(res.data)) {
          setCattleList(res.data);
        } else if (Array.isArray(res)) {
          // Fallback if backend sends raw array
          setCattleList(res);
        } else {
          console.error("Invalid API format:", res);
        }
      } catch (e) {
        console.error("Failed to load cattle", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // --- 2. FILTER & SELECT ---
  const filteredCattle = useMemo(() => {
    return cattleList.filter((c) => {
      // 1. ROBUST FILTER: Check for "active" (case-insensitive & trimmed)
      const status = String(c.status || "").toLowerCase().trim();
      if (status !== "active") return false;

      // 2. SEARCH FILTER
      const q = search.trim().toLowerCase();
      if (!q) return true; 

      const tag = c.tagNo ? String(c.tagNo).toLowerCase() : "";
      const name = c.name ? c.name.toLowerCase() : "";
      const breed = c.breed ? c.breed.toLowerCase() : "";
      return tag.includes(q) || name.includes(q) || breed.includes(q);
    });
  }, [search, cattleList]);

  const selectedAnimal = useMemo(
    () => cattleList.find((c) => c.internalId === selectedAnimalId) || null,
    [selectedAnimalId, cattleList]
  );

  // --- 3. PARSE HISTORY ---
  const parsedHistory = useMemo(() => {
    if (!selectedAnimal || !selectedAnimal.tagHistory) return [];
    return String(selectedAnimal.tagHistory).split("\n").map((entry, idx) => {
      return { id: idx, raw: entry };
    });
  }, [selectedAnimal]);

  function handleSelectAnimal(id) {
    setSelectedAnimalId(id);
    setForm({
      newTagNo: "",
      changeDate: getToday(),
      reason: "",
      remarks: "",
    });
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // --- 4. SUBMIT ---
  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedAnimal) return alert("Please select a cattle first.");
    if (!form.newTagNo) return alert("Please enter the new tag number.");
    
    setSaving(true);
    try {
        const payload = {
            internalId: selectedAnimal.internalId, 
            newTagNo: form.newTagNo,
            changeDate: form.changeDate,
            reason: form.reason,
            remarks: form.remarks
        };

        const res = await updateCattleTag(payload);
        
        if (res.success) {
            alert("Tag Updated Successfully!");
            window.location.reload(); 
        } else {
            alert("Failed: " + res.error);
        }
    } catch (err) {
        console.error(err);
        alert("Error updating tag.");
    } finally {
        setSaving(false);
    }
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      
      {/* --- RESPONSIVE STYLES --- */}
      <style>{`
        .tag-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 1.5rem;
          align-items: start;
        }
        .tag-list-panel {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          padding: 1rem;
          height: calc(100vh - 140px);
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
        }
        .tag-form-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .scrollable-list {
          flex: 1;
          overflow-y: auto;
          margin-top: 0.5rem;
        }

        /* TABLET & MOBILE (< 1024px) */
        @media (max-width: 1024px) {
          .tag-layout {
            grid-template-columns: 1fr; /* Stack vertically */
            gap: 1rem;
          }
          .tag-list-panel {
            height: 350px; /* Fixed height for list on mobile/tablet */
          }
        }
      `}</style>

      {/* HEADER */}
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700, color: "#111827" }}>Tag Management</h1>
        <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "#6b7280" }}>
          Assign new ear tags and track history.
        </p>
      </header>

      {/* LAYOUT */}
      <div className="tag-layout">
        
        {/* LEFT PANEL – SEARCH LIST */}
        <section className="tag-list-panel">
          <div style={{ paddingBottom: "0.5rem", borderBottom: "1px solid #f3f4f6" }}>
            <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.4rem", color: "#6b7280", fontWeight: "600" }}>Search Active Cattle</label>
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search Tag, Name or Breed..."
              className="form-input"
              style={{ fontSize: "0.9rem", padding: "0.6rem" }} 
            />
          </div>

          <div className="scrollable-list">
            {loading ? <div style={{padding:"1rem", textAlign:"center", color:"#9ca3af"}}>Loading...</div> : 
             filteredCattle.length === 0 ? (
              <div style={{ padding: "2rem", fontSize: "0.85rem", color: "#6b7280", textAlign:"center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                 <span style={{ fontSize: "2rem" }}>🔍</span>
                 <div>No active cattle found.</div>
                 <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Check "Master Data" to ensure Status is "Active".</div>
              </div>
            ) : (
              filteredCattle.map((c) => {
                const isActive = c.internalId === selectedAnimalId;
                return (
                  <button key={c.internalId} type="button" onClick={() => handleSelectAnimal(c.internalId)}
                    style={{
                      width: "100%", textAlign: "left", border: "1px solid transparent", 
                      background: isActive ? "#eff6ff" : "transparent",
                      borderColor: isActive ? "#bfdbfe" : "transparent",
                      padding: "0.75rem", borderRadius: "8px", cursor: "pointer", marginBottom:"4px",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: isActive ? "#1e40af" : "#111827" }}>
                        {c.tagNo || "No Tag"} • {c.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: isActive ? "#60a5fa" : "#6b7280", marginTop: "2px" }}>
                        {c.breed} • {c.shed}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT PANEL – FORM & HISTORY */}
        <section className="tag-form-panel">
          
          {/* Selected Card */}
          <div className="card" style={{ padding: "1rem" }}>
            {selectedAnimal ? (
              <div style={{ display: "flex", gap:"1rem", alignItems:"center" }}>
                <div style={{width:"60px", height:"60px", background:"#f3f4f6", borderRadius:"50%", overflow:"hidden", flexShrink:0, border:"2px solid #e5e7eb", display:"flex", alignItems:"center", justifyContent:"center"}}>
                    {selectedAnimal.photo ? <img src={selectedAnimal.photo} style={{width:"100%", height:"100%", objectFit:"cover"}} alt="" /> : <span style={{fontSize:"1.5rem"}}>🐄</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", fontWeight:"bold" }}>Selected Cattle</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>{selectedAnimal.name} <span style={{fontWeight:400, color:"#6b7280"}}>({selectedAnimal.tagNo})</span></div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>ID: {selectedAnimal.internalId}</div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "1rem", textAlign: "center", color: "#9ca3af", fontStyle: "italic" }}>
                 👈 Select a cattle from the list to begin.
              </div>
            )}
          </div>

          {/* New Tag Form */}
          <div className="card">
            <h3 className="section-title" style={{ marginTop: 0 }}>Update Tag Details</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="responsive-grid" style={{ marginBottom: "1rem" }}>
                  <Field label="Current Tag Number">
                    <input type="text" value={selectedAnimal ? selectedAnimal.tagNo : ""} readOnly className="form-input" style={{ backgroundColor: "#f9fafb", color: "#6b7280" }} placeholder="Auto-filled" />
                  </Field>

                  <Field label="New Tag Number *">
                    <input type="text" name="newTagNo" value={form.newTagNo} onChange={handleFormChange} className="form-input" placeholder="Enter new tag" disabled={!selectedAnimal} />
                  </Field>
              </div>

              <div className="responsive-grid" style={{ marginBottom: "1rem" }}>
                  <Field label="Change Date *">
                    <input type="date" name="changeDate" value={form.changeDate} onChange={handleFormChange} className="form-input" disabled={!selectedAnimal} />
                  </Field>

                  <Field label="Reason">
                    <select name="reason" value={form.reason} onChange={handleFormChange} className="form-select" disabled={!selectedAnimal}>
                      <option value="">Select reason</option>
                      <option value="Lost tag">Lost tag</option>
                      <option value="Damaged tag">Damaged tag</option>
                      <option value="Govt re-tag">Govt re-tag</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>
              </div>

              <Field label="Remarks">
                <textarea name="remarks" value={form.remarks} onChange={handleFormChange} rows={2} className="form-input" placeholder="Optional details..." disabled={!selectedAnimal} />
              </Field>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button type="submit" disabled={saving || !selectedAnimal} className="btn btn-primary" style={{ minWidth: "140px" }}>
                  {saving ? "Saving..." : "Save New Tag"}
                </button>
              </div>
            </form>
          </div>

          {/* History Table */}
          <div className="card" style={{ overflow: "hidden", padding: 0 }}>
            <div style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", fontWeight: 600, color: "#374151" }}>
                Tag History Log
            </div>
            
            {selectedAnimal && parsedHistory.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <tbody>
                    {parsedHistory.map((row) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "0.8rem 1rem", color: "#4b5563" }}>{row.raw}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", fontSize: "0.85rem", color: "#9ca3af" }}>
                {selectedAnimal ? "No previous tag history." : "Select a cattle to view history."}
              </div>
            )}
          </div>

        </section>
      </div>
    </div>
  );
}

// ----- STYLES -----
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}