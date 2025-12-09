// src/pages/ActiveCattle.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getActiveCattle } from "../api/masterApi";

export default function ActiveCattle() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [breedFilter, setBreedFilter] = useState("All");
  const [nameFilter, setNameFilter] = useState("");
  const [selectedCattle, setSelectedCattle] = useState(null);

  // Load active cattle from backend
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await getActiveCattle();
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load active cattle");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Breed options based on data
  const breedOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((c) => c.breed && set.add(String(c.breed)));
    return ["All", ...Array.from(set)];
  }, [rows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    const term = nameFilter.toLowerCase().trim();
    return rows.filter((row) => {
      const byBreed = breedFilter === "All" || row.breed === breedFilter;

      if (!term) return byBreed;

      const haystack = (
        `${row.cattleId || row.tagNumber || ""} ` +
        `${row.name || ""} ` +
        `${row.breed || ""} ` +
        `${row.locationShed || row.location || ""}`
      )
        .toString()
        .toLowerCase();

      const bySearch = haystack.includes(term);
      return byBreed && bySearch;
    });
  }, [rows, breedFilter, nameFilter]);

  function openDetails(cattle) {
    setSelectedCattle(cattle);
  }

  function closeDetails() {
    setSelectedCattle(null);
  }

  // Loading / error states
  if (loading) {
    return (
      <div style={{ padding: "1.5rem 2rem" }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          Active Cattle
        </h1>
        <div>Loading active cattle data…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1.5rem 2rem" }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          Active Cattle
        </h1>
        <div style={{ color: "red" }}>{error}</div>
      </div>
    );
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
              Search
            </label>
            <input
              type="text"
              placeholder="Name / tag / breed / location"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              style={{
                padding: "0.35rem 0.6rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                fontSize: "0.85rem",
                minWidth: "220px",
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
              <th style={thStyle}>Cattle ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Breed</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Age</th>
              <th style={thStyle}>Weight (Kgs)</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Adoption</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
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
              filteredRows.map((row, idx) => (
                <tr
                  key={row.id || row.cattleId || row.tagNumber || idx}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                  }}
                >
                  <td style={tdStyle}>{row.cattleId || row.tagNumber}</td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>
                    {row.name}
                  </td>
                  <td style={tdStyle}>{row.breed}</td>
                  <td style={tdStyle}>{row.gender}</td>
                  <td style={tdStyle}>{formatAge(row)}</td>
                  <td style={tdStyle}>{row.weightKgs || "-"}</td>
                  <td style={tdStyle}>
                    {row.locationShed || row.location || "-"}
                  </td>
                  <td style={tdStyle}>{row.adoptionStatus || "-"}</td>
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
                    ({selectedCattle.cattleId || selectedCattle.tagNumber})
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
                background: selectedCattle.pictureUrl
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
              <DetailItem
                label="Cattle ID"
                value={selectedCattle.cattleId || selectedCattle.tagNumber}
              />
              <DetailItem label="Govt ID" value={selectedCattle.govtId} />
              <DetailItem label="Breed" value={selectedCattle.breed} />
              <DetailItem label="Gender" value={selectedCattle.gender} />
              <DetailItem
                label="Colour"
                value={selectedCattle.colour || selectedCattle.color}
              />
              <DetailItem
                label="Age"
                value={formatAge(selectedCattle)}
              />
              <DetailItem
                label="Weight (Kgs)"
                value={selectedCattle.weightKgs}
              />
              <DetailItem
                label="Location / Shed"
                value={selectedCattle.locationShed || selectedCattle.location}
              />
              <DetailItem
                label="Date of Admission"
                value={formatDate(selectedCattle.dateOfAdmission)}
              />
              <DetailItem
                label="Type of Admission"
                value={selectedCattle.typeOfAdmission}
              />
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

/* ---- styles & helpers ---- */

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
      <div style={{ color: "#111827" }}>{String(value)}</div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// AgeMonths_cal → "X yrs Y months"
function formatAge(c) {
  const raw = c.ageMonthsCal;

  if (raw !== undefined && raw !== null && raw !== "") {
    const totalMonths = Number(raw);
    if (!isNaN(totalMonths) && totalMonths >= 0) {
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;

      const parts = [];
      if (years > 0) {
        parts.push(`${years} yr${years > 1 ? "s" : ""}`);
      }
      if (months > 0) {
        parts.push(`${months} month${months > 1 ? "s" : ""}`);
      }
      if (parts.length === 0) return "0 months";
      return parts.join(" ");
    }
  }

  if (c.ageYears) {
    return `${c.ageYears} yr${c.ageYears > 1 ? "s" : ""}`;
  }

  if (c.ageAtAdmission) return String(c.ageAtAdmission);

  return "";
}
