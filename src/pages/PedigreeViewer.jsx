import React, { useState, useEffect } from "react";
import { getPedigree } from "../api/masterApi"; 

export default function PedigreeViewer() {
  const [search, setSearch] = useState("");
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initial load (optional)
  useEffect(() => {
    // handleSearch("RPCAT0001");
  }, []);

  const handleSearch = async (query) => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      // 🔥 FIX: masterApi returns the data directly (unwrapped).
      // It throws an error if success === false.
      const data = await getPedigree(query);
      
      // If we reach here, it means success is true
      setTreeData(data);
      
    } catch (err) {
      console.error("Pedigree Fetch Error:", err);
      // 🔥 FIX: Use the actual error message from the backend
      setError(err.message || "Animal not found");
      setTreeData(null);
    } finally {
      setLoading(false);
    }
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch(search);
  };

  // --- HELPERS TO EXTRACT NODES ---
  const child = treeData;
  const sire = child?.sire;
  const dam = child?.dam;
  
  const sireSire = sire?.sire;
  const sireDam = sire?.dam;
  const damSire = dam?.sire;
  const damDam = dam?.dam;

  return (
    <div style={{ padding: "1.5rem 2rem", background: "#f9fafb", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#111827" }}>🧬 Pedigree Viewer</h1>
        <div style={{ fontSize: "0.95rem", color: "#6b7280" }}>
          Trace lineage up to 3 generations (Parents & Grandparents).
        </div>
      </header>

      {/* Search Bar */}
      <div style={{ marginBottom: "2rem", display: "flex", gap: "10px", maxWidth: "600px" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Enter Tag Number (e.g., 631228) or ID (RPCAT...)"
          style={searchInputStyle}
          onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit(e)}
        />
        <button onClick={onSearchSubmit} style={primaryButtonStyle} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ padding: "1rem", background: "#fee2e2", color: "#b91c1c", borderRadius: "8px", marginBottom: "1rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !treeData && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
          Searching database...
        </div>
      )}

      {/* Tree Visualization */}
      {!loading && treeData && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", alignItems: "center" }}>
          
          {/* LEVEL 3: GRANDPARENTS */}
          <div style={treeRowStyle}>
            <TreeCard title="Paternal Grand Sire" animal={sireSire} onClick={() => handleSearch(sireSire?.tag || sireSire?.id)} />
            <TreeCard title="Paternal Grand Dam" animal={sireDam} isFemale onClick={() => handleSearch(sireDam?.tag || sireDam?.id)} />
            <TreeCard title="Maternal Grand Sire" animal={damSire} onClick={() => handleSearch(damSire?.tag || damSire?.id)} />
            <TreeCard title="Maternal Grand Dam" animal={damDam} isFemale onClick={() => handleSearch(damDam?.tag || damDam?.id)} />
          </div>

          {/* Connector Lines */}
          <div style={{ width: "100%", height: "1px", background: "#e5e7eb", maxWidth: "800px" }}></div>

          {/* LEVEL 2: PARENTS */}
          <div style={{ ...treeRowStyle, maxWidth: "600px" }}>
            <TreeCard title="Sire (Father)" animal={sire} highlight onClick={() => handleSearch(sire?.tag || sire?.id)} />
            <TreeCard title="Dam (Mother)" animal={dam} highlight isFemale onClick={() => handleSearch(dam?.tag || dam?.id)} />
          </div>

          {/* Connector */}
          <div style={{ width: "1px", height: "30px", background: "#9ca3af" }}></div>

          {/* LEVEL 1: FOCUS ANIMAL */}
          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <TreeCard title="Focus Animal" animal={child} strong isFemale={child.gender === "Female" || child.gender === "Cow"} />
          </div>

        </div>
      )}

      {/* Empty State */}
      {!loading && !treeData && !error && (
        <div style={emptyStateStyle}>
          Enter a Cattle Tag Number above to view its family tree.
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: CARD ---
function TreeCard({ title, animal, highlight, strong, isFemale, onClick }) {
  if (!animal) {
    return (
      <div style={treeCardPlaceholderStyle}>
        <div style={treeTitleStyle}>{title}</div>
        <div style={{ fontSize: "0.85rem", color: "#9ca3af", fontStyle: "italic" }}>Unknown</div>
      </div>
    );
  }

  // Border Color based on Gender (Blue for Male, Pink for Female)
  const genderColor = isFemale ? "#ec4899" : "#3b82f6"; 
  const borderColor = strong ? genderColor : (highlight ? "#9ca3af" : "#e5e7eb");
  const bgColor = strong ? "#ffffff" : "#f9fafb";
  const shadow = strong ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)" : "none";

  return (
    <div
      onClick={onClick}
      style={{
        ...treeCardStyle,
        borderColor: borderColor,
        background: bgColor,
        boxShadow: shadow,
        borderWidth: strong ? "2px" : "1px",
        cursor: onClick ? "pointer" : "default"
      }}
    >
      <div style={treeTitleStyle}>{title}</div>
      
      {/* Content */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Photo Thumbnail or Placeholder */}
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
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1f2937" }}>
            {animal.name}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#4b5563" }}>
            {animal.tag ? `Tag: ${animal.tag}` : "No Tag"}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>
            {animal.breed}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- STYLES ---- */

const searchInputStyle = {
  flex: 1,
  padding: "0.75rem 1rem",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "1rem",
  outline: "none",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
};

const primaryButtonStyle = {
  padding: "0 1.5rem",
  borderRadius: "8px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.2s"
};

const emptyStateStyle = {
  padding: "4rem 1rem",
  textAlign: "center",
  fontSize: "1rem",
  color: "#6b7280",
  background: "#ffffff",
  borderRadius: "12px",
  border: "1px dashed #e5e7eb",
  maxWidth: "600px",
  margin: "0 auto"
};

const treeRowStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "1.5rem",
  flexWrap: "wrap",
  width: "100%"
};

const treeCardStyle = {
  borderRadius: "12px",
  borderStyle: "solid",
  padding: "1rem",
  minWidth: "220px",
  maxWidth: "240px",
  transition: "transform 0.2s, box-shadow 0.2s",
};

const treeCardPlaceholderStyle = {
  ...treeCardStyle,
  border: "1px dashed #e5e7eb",
  background: "transparent",
  opacity: 0.7
};

const treeTitleStyle = {
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#9ca3af",
  marginBottom: "0.5rem",
  fontWeight: 600
};