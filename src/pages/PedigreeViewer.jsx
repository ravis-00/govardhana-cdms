import React, { useState, useEffect, useMemo } from "react";
import { getPedigree, getPedigreeList } from "../api/masterApi"; 

export default function PedigreeViewer() {
  // --- STATE ---
  const [cattleList, setCattleList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Tree
  const [selectedId, setSelectedId] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState(null);

  // --- EFFECTS ---

  useEffect(() => {
    loadList();
  }, []);

  async function loadList() {
    setListLoading(true);
    setListError(null);
    try {
      const res = await getPedigreeList();
      if (res.success) {
        // Filter empty rows
        const validData = res.data.filter(c => c.id);
        setCattleList(validData);
      } else {
        setListError(res.error || "Failed to load list.");
      }
    } catch (err) {
      console.error("List Load Error:", err);
      setListError("Network or Server Error.");
    } finally {
      setListLoading(false);
    }
  }

  // 🔥 NEW: Handle Refresh (Clears Search + Reloads)
  const handleRefresh = () => {
    setSearchTerm(""); // Clear the search bar
    loadList();        // Reload the data
  };

  useEffect(() => {
    if (!selectedId) return;
    async function loadTree() {
      setTreeLoading(true);
      setTreeData(null);
      setTreeError(null);
      try {
        const res = await getPedigree(selectedId);
        if (res.success) {
           setTreeData(res.data);
        } else {
           setTreeError(res.error || "Could not load pedigree.");
        }
      } catch (err) {
        setTreeError(err.message || "Network error loading tree.");
      } finally {
        setTreeLoading(false);
      }
    }
    loadTree();
  }, [selectedId]);

  // --- SEARCH LOGIC ---
  const filteredList = useMemo(() => {
    if (!searchTerm) return cattleList;
    const lower = searchTerm.toLowerCase();
    return cattleList.filter(c => 
      (c.name && c.name.toLowerCase().includes(lower)) || 
      (c.tag && String(c.tag).toLowerCase().includes(lower)) ||
      (c.id && String(c.id).toLowerCase().includes(lower))
    );
  }, [cattleList, searchTerm]);

  const handlePrint = () => {
    if (treeData) {
      const originalTitle = document.title;
      document.title = `Pedigree_${treeData.name || "Unknown"}_${treeData.id}`;
      window.print();
      setTimeout(() => document.title = originalTitle, 1000);
    }
  };

  // Node Helpers
  const child = treeData;
  const sire = child?.sire;
  const dam = child?.dam;
  const sireSire = sire?.sire;
  const sireDam = sire?.dam;
  const damSire = dam?.sire;
  const damDam = dam?.dam;

  // --- RENDER ---
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f3f4f6" }}>
      
      {/* PRINT STYLES */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .pedigree-printable, .pedigree-printable * { visibility: visible; }
          .pedigree-printable {
            position: fixed; left: 0; top: 0; width: 100%; height: 100%;
            background: white; padding: 20px;
            display: flex; flex-direction: column; align-items: center;
          }
          aside, header, nav { display: none !important; }
          .print-header { display: block !important; margin-bottom: 20px; text-align: center; width: 100%; border-bottom: 2px solid #333; }
          .no-print { display: none !important; }
          @page { size: landscape; margin: 5mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* --- SIDEBAR --- */}
      <aside className="no-print" style={{ width: "340px", background: "white", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", zIndex: 10 }}>
        
        {/* Header & Search */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#111827" }}>🧬 Pedigree Viewer</h2>
             
             {/* REFRESH BUTTON (Uses handleRefresh now) */}
             <button 
               onClick={handleRefresh} 
               style={{ border:"none", background:"transparent", cursor:"pointer", fontSize:"1.2rem" }} 
               title="Refresh List"
             >
               🔄
             </button>
          </div>
          
          {/* SEARCH BOX WITH ICON */}
          <div style={{ position: "relative", width: "100%" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "1rem" }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search Name, Tag or ID..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ 
                width: "100%", padding: "10px 10px 10px 36px", 
                borderRadius: "8px", border: "1px solid #d1d5db", 
                fontSize: "0.9rem", outline: "none" 
              }}
            />
          </div>
        </div>

        {/* List Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          {listLoading ? (
            <div style={{ textAlign: "center", color: "#6b7280", marginTop: "20px" }}>Loading List...</div>
          ) : listError ? (
            <div style={{ textAlign: "center", color: "#ef4444", marginTop: "20px", padding: "0 10px" }}>
              ⚠️ {listError}
              <br/><button onClick={handleRefresh} style={{ marginTop: "10px", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "#3b82f6" }}>Try Again</button>
            </div>
          ) : filteredList.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9ca3af", marginTop: "20px" }}>No cattle found.</div>
          ) : (
            filteredList.map((cow) => (
              <div 
                key={cow.id} 
                onClick={() => setSelectedId(cow.id)}
                style={{
                  padding: "12px", marginBottom: "8px", borderRadius: "8px", cursor: "pointer",
                  border: selectedId === cow.id ? "1px solid #3b82f6" : "1px solid transparent",
                  background: selectedId === cow.id ? "#eff6ff" : "transparent",
                  transition: "background 0.2s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: "600", color: "#374151" }}>
                      {cow.name && cow.name !== "Unknown" ? cow.name : "Unknown"}
                      <span style={{ fontSize: "0.8rem", color: "#9ca3af", marginLeft: "6px", fontWeight: "normal" }}>
                        ({cow.id})
                      </span>
                    </span>
                  </div>

                  <span style={{ fontSize: "0.75rem", color: "#6b7280", background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap" }}>
                    {cow.tag || "-"}
                  </span>
                </div>
                
                <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "4px" }}>
                  {cow.breed || "Unknown Breed"} • <span style={{ color: cow.status === "Active" ? "#10b981" : "#ef4444" }}>{cow.status || "Unknown"}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* --- RIGHT PANEL --- */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto", padding: "2rem" }}>
        
        {!treeData && !treeLoading && !treeError && (
           <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
             <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>👈</div>
             <div style={{ fontSize: "1.2rem" }}>Select an animal from the list to view lineage.</div>
           </div>
        )}

        {treeLoading && (
           <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>Generating Tree...</div>
        )}

        {treeError && (
           <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>⚠️ {treeError}</div>
        )}

        {treeData && (
          <div className="pedigree-printable" style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
            
            {/* Header */}
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", width: "100%" }}>
              <h1 style={{ fontSize: "1.8rem", margin: 0, color: "#111827" }}>
                {treeData.name} 
                <span style={{ color: "#6b7280", fontSize: "1.2rem", fontWeight: "normal", marginLeft: "10px" }}>
                   ({treeData.id})
                </span>
              </h1>
              <button onClick={handlePrint} style={secondaryButtonStyle}>🖨️ Print Chart</button>
            </div>

            <div className="print-header" style={{ display: "none" }}>
              <h1>PEDIGREE CERTIFICATE</h1>
              <p>Rashtrotthana Goshala • Native Breed Conservation</p>
            </div>

            {/* TREE DIAGRAM */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
              
              {/* LEVEL 3: GRANDPARENTS */}
              <div style={treeRowStyle}>
                <TreeCard title="Paternal Grand Sire" animal={sireSire} />
                <TreeCard title="Paternal Grand Dam" animal={sireDam} isFemale />
                <TreeCard title="Maternal Grand Sire" animal={damSire} />
                <TreeCard title="Maternal Grand Dam" animal={damDam} isFemale />
              </div>

              {/* Connector Lines */}
              <div style={{ width: "80%", height: "2px", background: "#d1d5db" }}></div>

              {/* LEVEL 2: PARENTS */}
              <div style={{ ...treeRowStyle, width: "60%" }}>
                <TreeCard title="Sire (Father)" animal={sire} highlight />
                <TreeCard title="Dam (Mother)" animal={dam} highlight isFemale />
              </div>

              <div style={{ width: "2px", height: "40px", background: "#9ca3af" }}></div>

              {/* LEVEL 1: FOCUS ANIMAL */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <TreeCard title="Focus Animal" animal={child} strong isFemale={child.gender === "Female" || child.gender === "Cow"} />
              </div>

            </div>

            <div style={{ marginTop: "40px", fontSize: "0.8rem", color: "#9ca3af", textAlign: "center", width: "100%" }}>
               Generated on: {new Date().toLocaleDateString()}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

// --- CARD COMPONENT (Unchanged) ---
function TreeCard({ title, animal, highlight, strong, isFemale }) {
  if (!animal) {
    return (
      <div style={treeCardPlaceholderStyle}>
        <div style={treeTitleStyle}>{title}</div>
        <div style={{ fontSize: "0.85rem", color: "#9ca3af", fontStyle: "italic" }}>Unknown</div>
      </div>
    );
  }

  const genderColor = isFemale ? "#ec4899" : "#3b82f6"; 
  const borderColor = strong ? genderColor : (highlight ? "#9ca3af" : "#e5e7eb");
  const bgColor = strong ? "#ffffff" : "#f9fafb";
  const shadow = strong ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)" : "none";

  return (
    <div style={{
        ...treeCardStyle,
        borderColor: borderColor,
        background: bgColor,
        boxShadow: shadow,
        borderWidth: strong ? "2px" : "1px"
      }}
    >
      <div style={treeTitleStyle}>{title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ 
            width: "40px", height: "40px", borderRadius: "50%", 
            background: "#f3f4f6", overflow: "hidden", flexShrink: 0,
            display: "flex", justifyContent: "center", alignItems: "center",
            border: `1px solid ${genderColor}`
        }}>
          {animal.photo ? (
            <img src={animal.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "1.2rem" }}>{isFemale ? "🐄" : "🐂"}</span>
          )}
        </div>
        <div>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1f2937" }}>
            {animal.name && animal.name !== "Unknown" ? animal.name : animal.tag || animal.id}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#4b5563" }}>
            {animal.tag || "No Tag"}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>{animal.breed}</div>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const secondaryButtonStyle = {
  padding: "8px 16px", borderRadius: "8px", border: "1px solid #d1d5db",
  background: "#ffffff", color: "#374151", fontSize: "0.9rem", fontWeight: 600,
  cursor: "pointer", transition: "background 0.2s"
};

const treeRowStyle = { display: "flex", justifyContent: "center", gap: "2rem", width: "100%" };

const treeCardStyle = {
  borderRadius: "12px", borderStyle: "solid", padding: "1rem",
  minWidth: "220px", maxWidth: "240px", transition: "all 0.2s"
};

const treeCardPlaceholderStyle = { ...treeCardStyle, border: "1px dashed #e5e7eb", background: "transparent", opacity: 0.6 };

const treeTitleStyle = {
  fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em",
  color: "#9ca3af", marginBottom: "0.5rem", fontWeight: 600
};