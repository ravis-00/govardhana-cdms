// src/pages/ActiveCattle.jsx
import React, { useMemo, useState } from "react";

const SAMPLE_CATTLE = [
  {
    id: "1db95b2d",
    cattleId: "632643",
    govtId: "390020",
    name: "Vasundara",
    colour: "White",
    cattleType: "Cow",
    breed: "Hallikar",
    gender: "Female",
    ageYears: 7,
    location: "Jayadeva",
    adoptionStatus: "Punyakoti",
    pictureUrl: "", // later we will fill from sheet / Apps Script
    remarks: "Healthy, high milk yield",
  },
  {
    id: "1db95b2e",
    cattleId: "868135",
    govtId: "390021",
    name: "Shanthi",
    colour: "Brown",
    cattleType: "Cow",
    breed: "Mix",
    gender: "Female",
    ageYears: 5,
    location: "Kamadhenu",
    adoptionStatus: "Samrakshana",
    pictureUrl: "",
    remarks: "",
  },
  // ... keep / replace with real data later
];

export default function ActiveCattle() {
  const [breedFilter, setBreedFilter] = useState("All");
  const [nameFilter, setNameFilter] = useState("");
  const [selectedCattle, setSelectedCattle] = useState(null);

  // 🧠 Unique breed options
  const breedOptions = useMemo(() => {
    const set = new Set();
    SAMPLE_CATTLE.forEach((c) => c.breed && set.add(c.breed));
    return ["All", ...Array.from(set)];
  }, []);

  // Filtered rows
  const rows = useMemo(() => {
    return SAMPLE_CATTLE.filter((row) => {
      const byBreed = breedFilter === "All" || row.breed === breedFilter;
      const byName =
        !nameFilter ||
        row.name.toLowerCase().includes(nameFilter.toLowerCase());
      return byBreed && byName;
    });
  }, [breedFilter, nameFilter]);

  function openDetails(cattle) {
    setSelectedCattle(cattle);
  }

  function closeDetails() {
    setSelectedCattle(null);
  }

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Header + filters */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Active Cattle
        </h1>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                marginBottom: "0.15rem",
                color: "#6b7280",
              }}
            >
              Filter by Breed
            </label>
            <select
              value={breedFilter}
              onChange={(e) => setBreedFilter(e.target.value)}
              style={{
                padding: "0.35rem 0.6rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                fontSize: "0.85rem",
                backgroundColor: "#ffffff",
              }}
            >
              {breedOptions.map((b) => (
                <option key={b} value={b}>
                  {b === "All" ? "All Breeds" : b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                marginBottom: "0.15rem",
                color: "#6b7280",
              }}
            >
              Search by Name
            </label>
            <input
              type="text"
              placeholder="Type name…"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              style={{
                padding: "0.35rem 0.6rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                fontSize: "0.85rem",
                minWidth: "180px",
              }}
            />
          </div>
        </div>
      </header>

      {/* Table */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "0.75rem",
          boxShadow: "0 10px 25px rgba(15,23,42,0.05)",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9rem",
          }}
        >
          <thead
            style={{
              background: "#f1f5f9",
              textAlign: "left",
            }}
          >
            <tr>
              {/* internal ID hidden; no column */}
              <th style={thStyle}>Cattle ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Breed</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Location</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "0.9rem 1rem",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  No cattle match the selected filters.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id}
                  style={{
                    backgroundColor:
                      idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                  }}
                >
                  <td style={tdStyle}>{row.cattleId}</td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>
                    {row.name}
                  </td>
                  <td style={tdStyle}>{row.breed}</td>
                  <td style={tdStyle}>{row.gender}</td>
                  <td style={tdStyle}>{row.location}</td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openDetails(row)}
                      title="View details"
                      style={{
                        border: "none",
                        padding: "0.3rem 0.55rem",
                        borderRadius: "999px",
                        background: "#e5edff",
                        color: "#1d4ed8",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <span role="img" aria-label="view">
                        👁️
                      </span>
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedCattle && (
        <div style={modalOverlayStyle} onClick={closeDetails}>
          <div
            style={modalStyle}
            onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#6b7280",
                  }}
                >
                  Cattle Details
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  }}
                >
                  {selectedCattle.name}{" "}
                  <span style={{ color: "#6b7280", fontWeight: 400 }}>
                    ({selectedCattle.cattleId})
                  </span>
                </div>
              </div>
              <button
                onClick={closeDetails}
                style={{
                  border: "none",
                  borderRadius: "999px",
                  padding: "0.25rem 0.6rem",
                  background: "#e5e7eb",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                ✕
              </button>
            </div>

            {/* Picture (placeholder for now) */}
            <div
              style={{
                width: "100%",
                height: "180px",
                borderRadius: "0.75rem",
                background:
                  selectedCattle.pictureUrl
                    ? `url(${selectedCattle.pictureUrl}) center/cover`
                    : "#f3f4f6",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
                fontSize: "0.9rem",
              }}
            >
              {selectedCattle.pictureUrl
                ? ""
                : "Cattle photo (coming from sheet later)"}
            </div>

            {/* Details grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "0.5rem 1.25rem",
                fontSize: "0.85rem",
              }}
            >
              <DetailItem label="Cattle ID" value={selectedCattle.cattleId} />
              <DetailItem label="Govt ID" value={selectedCattle.govtId} />
              <DetailItem label="Colour" value={selectedCattle.colour} />
              <DetailItem label="Type" value={selectedCattle.cattleType} />
              <DetailItem label="Gender" value={selectedCattle.gender} />
              <DetailItem label="Breed" value={selectedCattle.breed} />
              <DetailItem
                label="Age (Years)"
                value={
                  selectedCattle.ageYears !== undefined
                    ? selectedCattle.ageYears
                    : ""
                }
              />
              <DetailItem label="Location / Shed" value={selectedCattle.location} />
              <DetailItem
                label="Adoption Status"
                value={selectedCattle.adoptionStatus}
              />
              <DetailItem label="Remarks" value={selectedCattle.remarks} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: "0.6rem 1rem",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
  fontSize: "0.8rem",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  color: "#475569",
};

const tdStyle = {
  padding: "0.55rem 1rem",
  borderBottom: "1px solid #e5e7eb",
  color: "#111827",
};

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

const modalStyle = {
  width: "100%",
  maxWidth: "720px",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#ffffff",
  borderRadius: "1rem",
  padding: "1.25rem 1.5rem 1.5rem",
  boxShadow: "0 25px 60px rgba(15,23,42,0.25)",
};

function DetailItem({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <div
        style={{
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#9ca3af",
          marginBottom: "0.1rem",
        }}
      >
        {label}
      </div>
      <div style={{ color: "#111827" }}>{value}</div>
    </div>
  );
}
