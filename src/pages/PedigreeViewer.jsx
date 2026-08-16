import React, { useState, useEffect, useMemo, useRef } from "react";
import { getPedigree, getPedigreeList } from "../api/masterApi"; 

function getPedigreeStatus(status) {
  const rawStatus = String(status || "")
    .trim();

  const normalizedStatus =
    rawStatus.toLowerCase();

  if (normalizedStatus === "active") {
    return {
      label: "Active",
      rawStatus,
      background: "#dcfce7",
      color: "#166534",
      border: "#bbf7d0",
    };
  }

  if (!normalizedStatus) {
    return {
      label: "Status unknown",
      rawStatus: "",
      background: "#f1f5f9",
      color: "#64748b",
      border: "#cbd5e1",
    };
  }

  return {
    label: "Inactive",
    rawStatus,
    background: "#fee2e2",
    color: "#b91c1c",
    border: "#fecaca",
  };
}

function PedigreeStatusBadge({ status }) {
  const displayStatus =
    getPedigreeStatus(status);

  return (
    <span
      title={
        displayStatus.rawStatus
          ? `Recorded status: ${displayStatus.rawStatus}`
          : "Status not recorded"
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        width: "fit-content",
        marginTop: "0.3rem",
        padding: "0.12rem 0.4rem",
        border: `1px solid ${displayStatus.border}`,
        borderRadius: "999px",
        background: displayStatus.background,
        color: displayStatus.color,
        fontSize: "0.62rem",
        fontWeight: 700,
        lineHeight: 1.25,
        whiteSpace: "nowrap",
      }}
    >
      {displayStatus.label}
    </span>
  );
}

export default function PedigreeViewer() {
  // --- STATE ---
  const requestedCattleIdRef = useRef(
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("cattleId") || ""
      : ""
  );
  const [cattleList, setCattleList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768
  );
  const initialLoadStartedRef = useRef(false);
  const treeCacheRef = useRef(new Map());
  const treeRequestRef = useRef(0);
  
  // Tree State
  const [selectedId, setSelectedId] = useState(
    requestedCattleIdRef.current || null
  );
  const [treeData, setTreeData] = useState(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState(null);

  // Responsive State
  const [mobileView, setMobileView] = useState(
    requestedCattleIdRef.current ? "tree" : "list"
  ); // 'list' or 'tree'

  // --- EFFECTS ---
  useEffect(() => {
    if (initialLoadStartedRef.current) return;
    initialLoadStartedRef.current = true;
    loadList();
  }, []);

  useEffect(() => {
  const handleResize = () => {
    setIsCompact(window.innerWidth <= 768);
    if (
      window.innerWidth <= 768 &&
      !selectedId
    ) {
      setMobileView("list");
    }
  };

  handleResize();

  window.addEventListener(
    "resize",
    handleResize
  );

  return () => {
    window.removeEventListener(
      "resize",
      handleResize
    );
  };
}, [selectedId]);

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
    setCurrentPage(1);
    treeCacheRef.current.clear();
    loadList();        
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    setMobileView("tree"); 
  };

  useEffect(() => {
    if (!selectedId) return;
    const cached = treeCacheRef.current.get(selectedId);
    if (cached) {
      setTreeData(cached);
      setTreeError(null);
      setTreeLoading(false);
      return;
    }
    const requestId = ++treeRequestRef.current;
    async function loadTree() {
      setTreeLoading(true);
      setTreeData(null);
      setTreeError(null);
      try {
        const res = await getPedigree(selectedId);
        if (requestId !== treeRequestRef.current) return;
        if (res.success) {
           treeCacheRef.current.set(selectedId, res.data);
           setTreeData(res.data);
        } else {
           setTreeError(res.error || "Could not load pedigree.");
        }
      } catch (err) {
        if (requestId !== treeRequestRef.current) return;
        setTreeError(err.message || "Network error loading tree.");
      } finally {
        if (requestId === treeRequestRef.current) setTreeLoading(false);
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

  const pageSize = isCompact ? 12 : 40;
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const pagedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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
  .pedigree-layout {
  width: 100%;
  height: calc(
    100dvh -
    var(--header-height) -
    3rem
  );
  min-height: 520px;
  display: flex;
  position: relative;
  overflow: hidden;
  background: #f3f4f6;
}

  /* =====================================================
     CATTLE LIST
     ===================================================== */

  .pedigree-sidebar {
    flex: 0 0 340px;
    width: 340px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-right: 1px solid #e5e7eb;
    z-index: 10;
    transition: transform 0.3s ease;
  }

  /* =====================================================
     TREE PANEL
     ===================================================== */

  .pedigree-main {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #f3f4f6;
  }

  .pedigree-tree-screen {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .pedigree-tree-header {
    flex-shrink: 0;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 2rem;
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    z-index: 5;
  }

  .pedigree-tree-header-left {
    min-width: 0;
    display: flex;
    align-items: center;
  }

  .pedigree-tree-heading {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .pedigree-tree-name {
    max-width: 100%;
    margin: 0;
    color: #111827;
    font-size: 1.4rem;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pedigree-tree-id {
    margin-top: 0.15rem;
    color: #6b7280;
    font-size: 0.85rem;
  }

  .tree-scroll-area {
    flex: 1;
    min-width: 0;
    min-height: 0;
    padding: 2rem;
    overflow: auto;
    display: flex;
    justify-content: center;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  .pedigree-tree-wrapper {
    width: 100%;
    min-width: 900px;
    max-width: 1200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  .pedigree-tree-row {
    width: 100%;
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: 2rem;
  }

  .pedigree-parent-row {
    width: 60%;
  }

  .pedigree-focus-row {
    display: flex;
    justify-content: center;
  }

  .pedigree-horizontal-connector {
    width: 80%;
    height: 2px;
    flex-shrink: 0;
    background: #d1d5db;
  }

  .pedigree-vertical-connector {
    width: 2px;
    height: 40px;
    flex-shrink: 0;
    background: #9ca3af;
  }

  .pedigree-tree-card {
    flex: 1 1 0;
    min-width: 190px;
    max-width: 240px;
    padding: 1rem;
    border-style: solid;
    border-radius: 12px;
    transition: all 0.2s;
  }

  .pedigree-tree-card-placeholder {
    border: 1px dashed #e5e7eb;
    background: transparent;
    opacity: 0.6;
  }

  .back-btn {
    display: none;
  }

  /* =====================================================
     TABLET
     ===================================================== */

  @media (max-width: 1024px) and (min-width: 769px) {
    .pedigree-sidebar {
      flex-basis: 290px;
      width: 290px;
    }

    .tree-scroll-area {
      justify-content: flex-start;
      padding: 1.5rem;
    }

    .pedigree-tree-wrapper {
      min-width: 780px;
    }

    .pedigree-tree-row {
      gap: 1rem;
    }

    .pedigree-tree-card {
      min-width: 175px;
      padding: 0.85rem;
    }
  }

  /* =====================================================
     MOBILE
     ===================================================== */

  @media (max-width: 768px) {
    .pedigree-layout {
  width: 100%;
  height: calc(
    100dvh -
    var(--header-height) -
    1.7rem
  );
  min-height: 480px;
  overflow: hidden;
}

    .pedigree-sidebar {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex-basis: auto;
  border-right: none;
  transform: translateX(0);
  z-index: 20;
}

    .pedigree-sidebar.hidden {
      pointer-events: none;
      transform: translateX(-105%);
    }

    .pedigree-list-header {
      padding: 1rem !important;
    }

    .pedigree-list-item {
      min-height: 64px;
      padding: 0.8rem !important;
      border: 1px solid #e5e7eb !important;
      background: #ffffff !important;
    }

    .pedigree-main {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  z-index: 10;
}

    .pedigree-tree-header {
      padding: 0.75rem;
      gap: 0.65rem;
    }

    .pedigree-tree-header-left {
      flex: 1;
    }

    .pedigree-tree-name {
      font-size: 1.15rem;
    }

    .pedigree-tree-id {
      font-size: 0.75rem;
    }

    .back-btn {
      width: 44px;
      height: 44px;
      min-width: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.65rem;
      padding: 0;
      border: 1px solid #d1d5db;
      border-radius: 50%;
      background: #ffffff;
      color: #374151;
      font-size: 1.15rem;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .pedigree-print-btn {
      min-width: 44px;
      min-height: 44px;
      padding: 0.6rem 0.75rem !important;
    }

    .tree-scroll-area {
      display: block;
      width: 100%;
      padding: 1rem;
      overflow-x: hidden;
      overflow-y: auto;
    }

    .pedigree-tree-wrapper {
      width: 100%;
      min-width: 0;
      max-width: none;
      gap: 1rem;
      padding-bottom: 2rem;
    }

    .pedigree-tree-row {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .pedigree-parent-row {
      width: 100%;
    }

    .pedigree-focus-row {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .pedigree-horizontal-connector {
      width: 70%;
      margin: 0 auto;
    }

    .pedigree-vertical-connector {
      height: 24px;
    }

    .pedigree-tree-card {
      width: 100%;
      min-width: 0;
      max-width: none;
      padding: 0.75rem;
      border-radius: 10px;
    }

    .pedigree-focus-row .pedigree-tree-card {
      width: min(100%, 300px);
      flex: 0 1 300px;
    }
  }

  /* =====================================================
     SMALL MOBILE
     ===================================================== */

  @media (max-width: 430px) {
    .pedigree-tree-header {
      padding: 0.65rem;
    }

    .pedigree-tree-name {
      font-size: 1.05rem;
    }

    .pedigree-print-btn {
      font-size: 0;
    }

    .pedigree-print-btn::before {
      content: "🖨️";
      font-size: 1rem;
    }

    .tree-scroll-area {
      padding: 0.75rem;
    }

    .pedigree-tree-row {
      gap: 0.6rem;
    }

    .pedigree-tree-card {
      padding: 0.65rem;
    }

    .pedigree-card-photo {
      width: 34px !important;
      height: 34px !important;
    }

    .pedigree-card-name {
      font-size: 0.8rem !important;
    }

    .pedigree-card-tag {
      font-size: 0.68rem !important;
    }

    .pedigree-card-breed {
      font-size: 0.65rem !important;
    }

    .pedigree-card-title {
      font-size: 0.58rem !important;
    }
  }

  /* =====================================================
     PRINT
     ===================================================== */

  @media print {
    body * {
      visibility: hidden;
    }

    .pedigree-printable,
    .pedigree-printable * {
      visibility: visible;
    }

    .pedigree-printable {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      overflow: visible;
      background: #ffffff;
    }

    .pedigree-tree-wrapper {
      min-width: 900px;
    }

    aside,
    header,
    nav,
    .no-print {
      display: none !important;
    }

    .print-header {
      display: block !important;
      width: 100%;
      margin-bottom: 20px;
      border-bottom: 2px solid #333333;
      text-align: center;
    }

    @page {
      size: landscape;
      margin: 5mm;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`}</style>

      {/* --- SIDEBAR --- */}
      <aside className={`pedigree-sidebar no-print ${mobileView === 'tree' ? 'hidden' : ''}`}>
        <div className="pedigree-list-header" style={{ padding: "1.5rem", borderBottom: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: "12px" }}>
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
          {!listLoading && !listError && (
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", padding: "0 0.25rem 0.65rem", color: "#6b7280", fontSize: "0.75rem" }}>
              <span>{filteredList.length} cattle</span>
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          )}
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
            pagedList.map((cow) => (
              <div 
                key={cow.id} 
                className="pedigree-list-item"
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

        {!listLoading && !listError && filteredList.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", padding: "0.75rem 1rem", borderTop: "1px solid #e5e7eb", background: "#ffffff" }}>
            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(page => Math.max(1, page - 1))} style={{ ...paginationButtonStyle, opacity: currentPage === 1 ? 0.45 : 1 }}>Prev</button>
            <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>{(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredList.length)} of {filteredList.length}</span>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} style={{ ...paginationButtonStyle, opacity: currentPage === totalPages ? 0.45 : 1 }}>Next</button>
          </div>
        )}
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
          <div className="pedigree-tree-screen">
            
            {/* STICKY HEADER */}
<div className="pedigree-tree-header no-print">
  <div className="pedigree-tree-header-left">
    <button
      type="button"
      className="back-btn"
      onClick={() => setMobileView("list")}
      aria-label="Return to cattle list"
    >
      ←
    </button>

    <div className="pedigree-tree-heading">
      <h1 className="pedigree-tree-name">
        {treeData.name}
      </h1>

            <span className="pedigree-tree-id">
        Tag: {treeData.tag || "Not recorded"}
        {" • "}
        Internal ID: {treeData.id || "Not recorded"}
      </span>
    </div>
  </div>

  <button
    type="button"
    onClick={handlePrint}
    className="pedigree-print-btn"
    style={secondaryButtonStyle}
    aria-label="Print pedigree"
  >
    🖨️ Print
  </button>
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
                <div className="pedigree-tree-row">
  <TreeCard
    title="Paternal Grand Sire"
    animal={sireSire}
  />

  <TreeCard
    title="Paternal Grand Dam"
    animal={sireDam}
    isFemale
  />

  <TreeCard
    title="Maternal Grand Sire"
    animal={damSire}
  />

  <TreeCard
    title="Maternal Grand Dam"
    animal={damDam}
    isFemale
  />
</div>

                {/* Connector Lines */}
                <div className="pedigree-horizontal-connector" />

                {/* LEVEL 2: PARENTS */}
                <div className="pedigree-tree-row pedigree-parent-row">
  <TreeCard
    title="Sire (Father)"
    animal={sire}
    highlight
  />

  <TreeCard
    title="Dam (Mother)"
    animal={dam}
    highlight
    isFemale
  />
</div>

                <div className="pedigree-vertical-connector" />

                {/* LEVEL 1: FOCUS ANIMAL */}
                <div className="pedigree-focus-row">
  <TreeCard
    title="Focus Animal"
    animal={child}
    strong
    isFemale={
      child.gender === "Female" ||
      child.gender === "Cow"
    }
  />
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
function TreeCard({
  title,
  animal,
  highlight,
  strong,
  isFemale,
}) {
  if (!animal) {
    return (
      <div className="pedigree-tree-card pedigree-tree-card-placeholder">
        <div className="pedigree-card-title" style={treeTitleStyle}>
          {title}
        </div>

        <div
          style={{
            color: "#9ca3af",
            fontSize: "0.85rem",
            fontStyle: "italic",
          }}
        >
          Unknown
        </div>
      </div>
    );
  }

  const genderColor = isFemale
    ? "#ec4899"
    : "#3b82f6";

  const borderColor = strong
    ? genderColor
    : highlight
      ? "#9ca3af"
      : "#e5e7eb";

  const backgroundColor = strong
    ? "#ffffff"
    : "#f9fafb";

  const shadow = strong
    ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
    : "none";

  return (
    <div
      className="pedigree-tree-card"
      style={{
        borderColor,
        background: backgroundColor,
        boxShadow: shadow,
        borderWidth: strong ? "2px" : "1px",
      }}
    >
      <div
        className="pedigree-card-title"
        style={treeTitleStyle}
      >
        {title}
      </div>

      <div
        style={{
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: "0.65rem",
        }}
      >
        <div
          className="pedigree-card-photo"
          style={{
            width: "40px",
            height: "40px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            border: `1px solid ${genderColor}`,
            borderRadius: "50%",
            background: "#f3f4f6",
          }}
        >
          {animal.photo ? (
            <img
              src={animal.photo}
              alt={animal.name || "Cattle"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span style={{ fontSize: "1.2rem" }}>
              {isFemale ? "🐄" : "🐂"}
            </span>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            className="pedigree-card-name"
            style={{
              color: "#1f2937",
              fontSize: "0.9rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {animal.name &&
            animal.name !== "Unknown"
              ? animal.name
              : animal.tag || animal.id}
          </div>

          <div
            className="pedigree-card-tag"
            style={{
              color: "#4b5563",
              fontSize: "0.75rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {animal.tag || "No Tag"}
          </div>

                    <div
            className="pedigree-card-breed"
            style={{
              color: "#6b7280",
              fontSize: "0.7rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {animal.breed || "Unknown breed"}
          </div>

          <PedigreeStatusBadge
            status={animal.status}
          />
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

const paginationButtonStyle = {
  minWidth: "64px",
  minHeight: "38px",
  padding: "0.45rem 0.75rem",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#374151",
  fontSize: "0.78rem",
  fontWeight: 650,
  cursor: "pointer",
};


const treeTitleStyle = {
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#9ca3af",
  marginBottom: "0.5rem",
  fontWeight: 600,
};
