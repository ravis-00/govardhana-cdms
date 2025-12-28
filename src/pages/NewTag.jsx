// src/pages/NewTag.jsx
import React, { useMemo, useState, useEffect } from "react";
import { getCattle, updateCattleTag } from "../api/masterApi"; // 🔥 Import API

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
        const data = await getCattle();
        if (Array.isArray(data)) {
          setCattleList(data);
        }
      } catch (e) {
        console.error("Failed to load cattle", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // --- 2. FILTER & SELECT (Updated: ACTIVE ONLY) ---
  const filteredCattle = useMemo(() => {
    return cattleList.filter((c) => {
      // 1. STRICT FILTER: Hide Deactive/Sold/Dead cattle
      if (c.status !== "Active") return false;

      // 2. SEARCH FILTER: If active, check search terms
      const q = search.trim().toLowerCase();
      if (!q) return true; // Show all Active if no search

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

  // --- 3. PARSE HISTORY STRING FOR TABLE ---
  const parsedHistory = useMemo(() => {
    if (!selectedAnimal || !selectedAnimal.tagHistory) return [];
    
    // Backend sends: "1001 (Changed 2025-01-01: Lost)\n1002 (Changed...)"
    // We split by newline and parse
    return String(selectedAnimal.tagHistory).split("\n").map((entry, idx) => {
      // Regex to extract: Tag (Changed Date: Reason)
      // Simple parse for now: just show the full string or try to split
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

  // --- 4. SUBMIT TO BACKEND ---
  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedAnimal) return alert("Please select a cattle first.");
    if (!form.newTagNo) return alert("Please enter the new tag number.");
    
    setSaving(true);
    try {
        const payload = {
            internalId: selectedAnimal.internalId, // The Key
            newTagNo: form.newTagNo,
            changeDate: form.changeDate,
            reason: form.reason,
            remarks: form.remarks
        };

        const res = await updateCattleTag(payload);
        
        if (res.success) {
            alert("Tag Updated Successfully!");
            window.location.reload(); // Reload to refresh list & history
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
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* HEADER */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700 }}>Tag Management</h1>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "#6b7280" }}>
            Assign a new ear tag to an existing active cattle and maintain full history.
          </p>
        </div>
      </header>

      {/* LAYOUT */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr)", gap: "1rem" }}>
        
        {/* LEFT PANEL – SEARCH LIST */}
        <section style={{ background: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 10px 25px rgba(15,23,42,0.06)", padding: "0.75rem", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 180px)" }}>
          <div style={{ padding: "0 0.25rem 0.5rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.2rem", color: "#6b7280" }}>Search Cattle (Tag / Name / Breed)</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g., 632643 or Vasundara"
              style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.9rem" }} />
          </div>

          <div style={{ overflowY: "auto", marginTop: "0.25rem" }}>
            {loading ? <div style={{padding:"1rem", textAlign:"center"}}>Loading...</div> : 
             filteredCattle.length === 0 ? (
              <div style={{ padding: "0.75rem", fontSize: "0.85rem", color: "#6b7280" }}>No cattle match your search.</div>
            ) : (
              filteredCattle.map((c) => {
                const isActive = c.internalId === selectedAnimalId;
                return (
                  <button key={c.internalId} type="button" onClick={() => handleSelectAnimal(c.internalId)}
                    style={{
                      width: "100%", textAlign: "left", border: "none", background: isActive ? "#eff6ff" : "transparent",
                      padding: "0.55rem 0.6rem", borderRadius: "0.6rem", cursor: "pointer", marginBottom:"2px"
                    }}
                  >
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#111827" }}>{c.tagNo || "No Tag"} • {c.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.1rem" }}>{c.breed} • {c.shed} • {c.status}</div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT PANEL – FORM & HISTORY */}
        <section style={{ display: "grid", gridTemplateRows: "auto auto 1fr", gap: "0.75rem" }}>
          
          {/* Selected Card */}
          <div style={{ background: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 10px 25px rgba(15,23,42,0.06)", padding: "0.75rem 0.9rem" }}>
            {selectedAnimal ? (
              <div style={{ display: "flex", gap:"1rem" }}>
                {/* Photo Preview */}
                <div style={{width:"80px", height:"80px", background:"#eee", borderRadius:"8px", overflow:"hidden"}}>
                    {selectedAnimal.photo ? <img src={selectedAnimal.photo} style={{width:"100%", height:"100%", objectFit:"cover"}} /> : <div style={{padding:"10px", fontSize:"0.6rem", textAlign:"center", color:"#999"}}>No Photo</div>}
                </div>
                <div style={{flex:1}}>
                  <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>Selected Cattle</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{selectedAnimal.name} – {selectedAnimal.tagNo}</div>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.15rem" }}>
                    Breed: {selectedAnimal.breed} • Shed: {selectedAnimal.shed} • Status: {selectedAnimal.status}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: "0.8rem", color: "#6b7280" }}>
                  <div>Internal ID</div>
                  <div style={{ fontWeight: 600, color:"#333" }}>{selectedAnimal.internalId}</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Select a cattle from the left list to assign a new tag.</div>
            )}
          </div>

          {/* New Tag Form */}
          <div style={{ background: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 10px 25px rgba(15,23,42,0.06)", padding: "0.9rem 1rem 1rem" }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem" }}>New Tag Details</div>
            
            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem 1rem", alignItems: "flex-start" }}>
              <Field label="Current Tag Number">
                <input type="text" value={selectedAnimal ? selectedAnimal.tagNo : ""} readOnly
                  style={{ ...inputStyle, backgroundColor: "#f9fafb" }} placeholder="Select cattle..." />
              </Field>

              <Field label="New Tag Number *">
                <input type="text" name="newTagNo" value={form.newTagNo} onChange={handleFormChange}
                  style={inputStyle} placeholder="Enter new ear tag number" />
              </Field>

              <Field label="Change Date *">
                <input type="date" name="changeDate" value={form.changeDate} onChange={handleFormChange} style={inputStyle} />
              </Field>

              <Field label="Reason">
                <select name="reason" value={form.reason} onChange={handleFormChange} style={inputStyle}>
                  <option value="">Select reason</option>
                  <option value="Lost tag">Lost tag</option>
                  <option value="Damaged tag">Damaged tag</option>
                  <option value="Govt re-tag">Govt re-tag</option>
                  <option value="Other">Other</option>
                </select>
              </Field>

              <Field label="Remarks" fullWidth>
                <textarea name="remarks" value={form.remarks} onChange={handleFormChange} rows={2}
                  style={{ ...inputStyle, resize: "vertical" }} placeholder="Any additional information..." />
              </Field>

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="submit" disabled={saving || !selectedAnimal} style={{...primaryButton, opacity: saving?0.7:1}}>
                  {saving ? "Saving..." : "Save New Tag"}
                </button>
              </div>
            </form>
          </div>

          {/* History Table */}
          <div style={{ background: "#ffffff", borderRadius: "0.75rem", boxShadow: "0 10px 25px rgba(15,23,42,0.06)", padding: "0.75rem 1rem", overflow: "hidden" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>Tag History</div>
            
            {selectedAnimal && parsedHistory.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      <th style={thStyle}>History Log</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedHistory.map((row) => (
                      <tr key={row.id}>
                        <td style={tdStyle}>{row.raw}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                {selectedAnimal ? "No tag history available." : "Select a cattle to view its tag history."}
              </div>
            )}
          </div>

        </section>
      </div>
    </div>
  );
}

// ----- STYLES -----
function Field({ label, children, fullWidth }) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : "auto" }}>
      <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.2rem", color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", padding: "0.45rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", fontSize: "0.9rem" };
const thStyle = { padding: "0.4rem 0.5rem", textAlign: "left", borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: "0.75rem", color: "#6b7280" };
const tdStyle = { padding: "0.6rem 0.5rem", borderBottom: "1px solid #e5e7eb", color: "#444" };
const primaryButton = { padding: "0.45rem 0.9rem", borderRadius: "999px", border: "none", background: "#2563eb", color: "#ffffff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" };