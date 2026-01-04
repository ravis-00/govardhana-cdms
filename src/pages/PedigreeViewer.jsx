import React, { useState, useEffect, useMemo } from "react";
import { getPedigree, getPedigreeList } from "../api/masterApi"; 

export default function PedigreeViewer() {
  // --- STATE ---
  const [cattleList, setCattleList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Tree State
  const [selectedId, setSelectedId] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState(null);

  // Responsive State
  const [mobileView, setMobileView] = useState("list"); // 'list' or 'tree'

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

  const handleRefresh = () => {
    setSearchTerm(""); 
    loadList();        
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    setMobileView("tree"); 
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
    <div className="pedigree-layout">
      
      {/* --- CSS STYLES (Scoped) --- */}
      <style>{`
        .pedigree-layout { display: flex; height: 100vh; overflow: hidden; background: #f3f4f6; position: relative; }
        
        /* SIDEBAR (List) */
        .pedigree-sidebar { 
          width: 340px; 
          background: white; 
          border-right: 1px solid #e5e7eb; 
          display: flex; 
          flex-direction: column; 
          z-index: 10;
          transition: transform 0.3s ease;
        }

        /* MAIN (Tree) */
        .pedigree-main { 
          flex: 1; 
          display: flex; 
          flex-direction: column; 
          height: 100vh; 
          overflow: hidden; /* Prevent body scroll, handle inside */
        }

        .tree-scroll-area {
          flex: 1;
          overflow: auto; /* Allow scrolling in both directions */
          padding: 2rem;
          display: flex;
          justify-content: center; /* Center chart on large screens */
        }

        .pedigree-tree-wrapper {
          min-width: 900px; /* 🔥 Force width so lines don't break */
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .back-btn { display: none; } 

        /* PRINT STYLES */
        @media print {
          body * { visibility: hidden; }
          .pedigree-printable, .pedigree-printable * { visibility: visible; }
          .pedigree-printable {
            position: fixed; left: 0; top: 0; width: 100%; height: 100%;
            background: white; padding: 20px;
            display: flex; flex-direction: column; align-items: center;
          }
          aside, header, nav, .no-print { display: none !important; }
          .print-header { display: block !important; margin-bottom: 20px; text-align: center; width: 100%; border-bottom: 2px solid #333; }
          @page { size: landscape; margin: 5mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }

        /* --- MOBILE RESPONSIVENESS (< 768px) --- */
        @media (max-width: 768px) {
          .pedigree-sidebar { 
            width: 100%; 
            position: absolute; top: 0; bottom: 0; height: 100%;
            z-index: 20;
          }
          
          /* Hide sidebar when viewing tree */
          .pedigree-sidebar.hidden { transform: translateX(-100%); }

          .pedigree-main { 
            width: 100%; 
            position: absolute; top: 0; bottom: 0;
            background: #f3f4f6;
            z-index: 10;
          }

          .tree-scroll-area {
            justify-content: flex-start; /* 🔥 Align left to prevent clipping on mobile */
            padding: 1rem;
          }

          .pedigree-tree-wrapper {
             /* Keep min-width to ensure chart looks correct, user scrolls X */
             min-width: 800px; 
             padding-bottom: 50px;
          }

          .back-btn { 
            display: inline-flex; 
            align-items: center; 
            justify-content: center;
            width: 36px; height: 36px;
            background: white; border: 1px solid #d1d5db;
            color: #374151;
            border-radius: 50%; margin-right: 10px; cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      {/* --- SIDEBAR --- */}
      <aside className={`pedigree-sidebar no-print ${mobileView === 'tree' ? 'hidden' : ''}`}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#111827" }}>🧬 Pedigree Viewer</h2>
             <button onClick={handleRefresh} style={{ border:"none", background:"transparent", cursor:"pointer", fontSize:"1.2rem" }} title="Refresh List">🔄</button>
          </div>
          <div style={{ position: "relative", width: "100%" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "1rem" }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search Name, Tag or ID..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "12px 10px 12px 36px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem", outline: "none" }}
            />
          </div>
        </div>

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
                onClick={() => handleSelect(cow.id)}
                style={{
                  padding: "14px", marginBottom: "8px", borderRadius: "8px", cursor: "pointer",
                  border: selectedId === cow.id ? "1px solid #3b82f6" : "1px solid transparent",
                  background: selectedId === cow.id ? "#eff6ff" : "transparent",
                  transition: "background 0.2s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: "600", color: "#374151", fontSize: "1rem" }}>
                      {cow.name && cow.name !== "Unknown" ? cow.name : "Unknown"}
                      <span style={{ fontSize: "0.85rem", color: "#9ca3af", marginLeft: "6px", fontWeight: "normal" }}>({cow.id})</span>
                    </span>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "#6b7280", background: "#f3f4f6", padding: "4px 8px", borderRadius: "4px", whiteSpace: "nowrap" }}>
                    {cow.tag || "-"}
                  </span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "4px" }}>
                  {cow.breed || "Unknown Breed"} • <span style={{ color: cow.status === "Active" ? "#10b981" : "#ef4444" }}>{cow.status || "Unknown"}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* --- MAIN PANEL (Tree) --- */}
      <main className="pedigree-main">
        
        {/* Placeholder / Welcome */}
        {!treeData && !treeLoading && !treeError && (
           <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af", padding: "20px" }}>
             <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>👈</div>
             <div style={{ fontSize: "1.2rem", textAlign: "center" }}>
               {mobileView === 'list' ? 'Select from the list.' : 'Select an animal to view lineage.'}
             </div>
           </div>
        )}

        {treeLoading && (
           <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>Generating Tree...</div>
        )}

        {treeError && (
           <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>⚠️ {treeError}</div>
        )}

        {treeData && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* STICKY HEADER */}
            <div className="no-print" style={{ 
                display: "flex", justifyContent: "space-between", alignItems: "center", 
                padding: "1rem 2rem", background: "white", borderBottom: "1px solid #e5e7eb",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)", zIndex: 5
            }}>
              <div style={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
                 {/* Mobile Back Button */}
                 <button className="back-btn" onClick={() => setMobileView("list")}>←</button>
                 
                 <div style={{ display: "flex", flexDirection: "column" }}>
                    <h1 style={{ fontSize: "1.4rem", margin: 0, color: "#111827", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {treeData.name} 
                    </h1>
                    <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>ID: {treeData.id}</span>
                 </div>
              </div>
              <button onClick={handlePrint} style={secondaryButtonStyle}>🖨️ Print</button>
            </div>

            {/* SCROLLABLE TREE AREA */}
            <div className="tree-scroll-area pedigree-printable">
              
              <div className="print-header" style={{ display: "none" }}>
                <h1>PEDIGREE CERTIFICATE</h1>
                <p>Rashtrotthana Goshala • Native Breed Conservation</p>
              </div>

              {/* THE TREE DIAGRAM */}
              <div className="pedigree-tree-wrapper">
                
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

                <div className="no-print" style={{ marginTop: "20px", fontSize: "0.8rem", color: "#9ca3af", textAlign: "center", width: "100%" }}>
                  Generated on: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

// --- CARD COMPONENT ---
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
  cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap"
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