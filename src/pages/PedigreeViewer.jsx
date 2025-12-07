// src/pages/PedigreeViewer.jsx
import React, { useMemo, useState } from "react";

/**
 * Mock data: very small animal master with simple parent links.
 * In real app we will fetch this via code.gs from CattleMaster sheet.
 */
const MOCK_ANIMALS = [
  {
    animalId: "A-631228",
    tagNo: "631228",
    name: "Vasundara",
    breed: "Hallikar",
    sex: "Cow",
    sireId: "A-420001",
    damId: "A-410010",
  },
  {
    animalId: "A-420001",
    tagNo: "420001",
    name: "Rudra",
    breed: "Hallikar",
    sex: "Bull",
    sireId: "A-300101",
    damId: "A-300102",
  },
  {
    animalId: "A-410010",
    tagNo: "410010",
    name: "Ganga",
    breed: "Hallikar",
    sex: "Cow",
    sireId: "A-300103",
    damId: "A-300104",
  },
  {
    animalId: "A-300101",
    name: "Mahadeva",
    breed: "Hallikar",
    sex: "Bull",
  },
  {
    animalId: "A-300102",
    name: "Bhavani",
    breed: "Hallikar",
    sex: "Cow",
  },
  {
    animalId: "A-300103",
    name: "Keshava",
    breed: "Hallikar",
    sex: "Bull",
  },
  {
    animalId: "A-300104",
    name: "Kamakshi",
    breed: "Hallikar",
    sex: "Cow",
  },
];

function findById(id) {
  return MOCK_ANIMALS.find((a) => a.animalId === id) || null;
}

export default function PedigreeViewer() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("A-631228");

  const selectedAnimal = useMemo(
    () => findById(selectedId),
    [selectedId]
  );

  const filteredList = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return MOCK_ANIMALS;
    return MOCK_ANIMALS.filter((a) => {
      return (
        a.name.toLowerCase().includes(term) ||
        (a.tagNo && a.tagNo.toLowerCase().includes(term)) ||
        a.animalId.toLowerCase().includes(term)
      );
    });
  }, [search]);

  // Build ancestors (up to grandparents)
  const sire = selectedAnimal ? findById(selectedAnimal.sireId) : null;
  const dam = selectedAnimal ? findById(selectedAnimal.damId) : null;
  const sireSire = sire ? findById(sire.sireId) : null;
  const sireDam = sire ? findById(sire.damId) : null;
  const damSire = dam ? findById(dam.sireId) : null;
  const damDam = dam ? findById(dam.damId) : null;

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Pedigree Viewer</h1>
          <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
            View 3-generation family tree for any cattle.
          </div>
        </div>
        <button style={primaryButtonStyle}>Back to Profile</button>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px minmax(0, 1fr)",
          gap: "1.25rem",
        }}
      >
        {/* Left: Search + list */}
        <aside style={leftPanelStyle}>
          <div style={{ marginBottom: "0.75rem" }}>
            <label
              style={{
                fontSize: "0.8rem",
                color: "#6b7280",
                display: "block",
                marginBottom: "0.2rem",
              }}
            >
              Search cattle
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, tag, or ID"
              style={searchInputStyle}
            />
          </div>

          <div style={listHeaderStyle}>
            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
              {filteredList.length} animals
            </span>
          </div>

          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {filteredList.map((animal) => {
              const isActive = animal.animalId === selectedId;
              return (
                <button
                  key={animal.animalId}
                  type="button"
                  onClick={() => setSelectedId(animal.animalId)}
                  style={
                    isActive ? listItemActiveStyle : listItemStyle
                  }
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    {animal.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: isActive ? "#e5e7eb" : "#6b7280",
                    }}
                  >
                    {animal.tagNo ? `Tag ${animal.tagNo}` : "No tag"} •{" "}
                    {animal.animalId}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: isActive ? "#e5e7eb" : "#6b7280",
                    }}
                  >
                    {animal.breed} • {animal.sex}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right: Tree */}
        <main style={treePanelStyle}>
          {!selectedAnimal ? (
            <div style={emptyStateStyle}>
              Select a cattle from the left list to view pedigree.
            </div>
          ) : (
            <>
              {/* Selected animal card */}
              <section style={{ marginBottom: "1rem" }}>
                <h2 style={cardTitleStyle}>
                  Selected Animal
                </h2>
                <div style={selectedCardStyle}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "999px",
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "0.75rem",
                    }}
                  >
                    <span style={{ fontSize: "1.8rem" }}>🐄</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 600 }}>
                      {selectedAnimal.name}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                      {selectedAnimal.breed} • {selectedAnimal.sex}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      {selectedAnimal.tagNo
                        ? `Tag ${selectedAnimal.tagNo}`
                        : "No tag"}{" "}
                      • {selectedAnimal.animalId}
                    </div>
                  </div>
                </div>
              </section>

              {/* Tree layout */}
              <section>
                <h2 style={cardTitleStyle}>3-Generation Tree</h2>
                <p style={mutedTextStyle}>
                  This is a static visual built from mock data. Later we will
                  generate it dynamically using the CattleMaster and
                  CalvingHistory data in Sheets.
                </p>

                <div style={treeGridStyle}>
                  {/* Grandparents row */}
                  <div style={treeRowStyle}>
                    <TreeCard title="Sire's Sire" animal={sireSire} />
                    <TreeCard title="Sire's Dam" animal={sireDam} />
                    <TreeCard title="Dam's Sire" animal={damSire} />
                    <TreeCard title="Dam's Dam" animal={damDam} />
                  </div>

                  {/* Parents row */}
                  <div style={treeRowStyle}>
                    <TreeCard title="Sire" animal={sire} highlight />
                    <TreeCard title="Dam" animal={dam} highlight />
                  </div>

                  {/* Selected in tree */}
                  <div style={treeRowCenter}>
                    <TreeCard title="Selected" animal={selectedAnimal} strong />
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function TreeCard({ title, animal, highlight, strong }) {
  if (!animal) {
    return (
      <div style={treeCardStyle}>
        <div style={treeTitleStyle}>{title}</div>
        <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Unknown</div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...treeCardStyle,
        borderColor: highlight || strong ? "#60a5fa" : "#e5e7eb",
        background: strong ? "#eff6ff" : "#f9fafb",
      }}
    >
      <div style={treeTitleStyle}>{title}</div>
      <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>
        {animal.name}
      </div>
      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
        {animal.breed} • {animal.sex}
      </div>
      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
        {animal.tagNo ? `Tag ${animal.tagNo}` : "No tag"}
      </div>
      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
        {animal.animalId}
      </div>
      <button style={{ ...linkButtonStyle, marginTop: "0.3rem" }}>
        Open profile
      </button>
    </div>
  );
}

/* ---- STYLES ---- */

const primaryButtonStyle = {
  padding: "0.4rem 0.9rem",
  borderRadius: "999px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontSize: "0.85rem",
  fontWeight: 600,
  cursor: "pointer",
};

const leftPanelStyle = {
  background: "#ffffff",
  borderRadius: "0.75rem",
  padding: "0.9rem",
  boxShadow: "0 10px 25px rgba(15,23,42,0.03)",
};

const searchInputStyle = {
  width: "100%",
  padding: "0.45rem 0.55rem",
  borderRadius: "0.5rem",
  border: "1px solid #d1d5db",
  fontSize: "0.85rem",
};

const listHeaderStyle = {
  paddingBottom: "0.3rem",
  borderBottom: "1px solid #e5e7eb",
  marginBottom: "0.4rem",
};

const listItemStyle = {
  width: "100%",
  textAlign: "left",
  padding: "0.45rem 0.5rem",
  borderRadius: "0.45rem",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  marginBottom: "0.15rem",
};

const listItemActiveStyle = {
  ...listItemStyle,
  background: "#2563eb",
  color: "#ffffff",
};

const treePanelStyle = {
  background: "#ffffff",
  borderRadius: "0.75rem",
  padding: "1rem 1.25rem",
  boxShadow: "0 10px 25px rgba(15,23,42,0.03)",
};

const emptyStateStyle = {
  padding: "2rem 1rem",
  textAlign: "center",
  fontSize: "0.9rem",
  color: "#6b7280",
};

const selectedCardStyle = {
  display: "flex",
  alignItems: "center",
  borderRadius: "0.75rem",
  border: "1px solid #e5e7eb",
  padding: "0.6rem 0.7rem",
  background: "#f9fafb",
};

const cardTitleStyle = {
  margin: 0,
  marginBottom: "0.4rem",
  fontSize: "1rem",
  fontWeight: 600,
};

const mutedTextStyle = {
  fontSize: "0.8rem",
  color: "#6b7280",
  marginBottom: "0.6rem",
};

const treeGridStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.9rem",
  marginTop: "0.5rem",
};

const treeRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "0.6rem",
};

const treeRowCenter = {
  display: "flex",
  justifyContent: "center",
};

const treeCardStyle = {
  borderRadius: "0.75rem",
  border: "1px solid #e5e7eb",
  padding: "0.5rem 0.6rem",
  background: "#f9fafb",
  minWidth: 0,
};

const treeTitleStyle = {
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#6b7280",
  marginBottom: "0.15rem",
};

const linkButtonStyle = {
  border: "none",
  background: "none",
  color: "#2563eb",
  fontSize: "0.8rem",
  cursor: "pointer",
  padding: 0,
};
