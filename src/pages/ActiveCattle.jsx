// src/pages/ActiveCattle.jsx
import React, { useMemo, useState } from "react";

const SAMPLE_CATTLE = [
  {
    id: "1db95b2d",
    cattleId: "632643",
    name: "Vasundara",
    breed: "Hallikar",
    gender: "Female",
    location: "Jayadeva",
  },
  {
    id: "1db95b2e",
    cattleId: "868135",
    name: "Shanthi",
    breed: "Mix",
    gender: "Female",
    location: "Kamadhenu",
  },
  // ... keep / add more sample rows or replace with real data
];

export default function ActiveCattle() {
  const [breedFilter, setBreedFilter] = useState("All");
  const [nameFilter, setNameFilter] = useState("");

  // 🧠 Derive unique breed list from data
  const breedOptions = useMemo(() => {
    const set = new Set();
    SAMPLE_CATTLE.forEach((c) => {
      if (c.breed) set.add(c.breed);
    });
    return ["All", ...Array.from(set)];
  }, []);

  const rows = useMemo(() => {
    return SAMPLE_CATTLE.filter((row) => {
      const byBreed =
        breedFilter === "All" || row.breed === breedFilter;
      const byName =
        !nameFilter ||
        row.name.toLowerCase().includes(nameFilter.toLowerCase());
      return byBreed && byName;
    });
  }, [breedFilter, nameFilter]);

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
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

        {/* Filter bar */}
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
              {/* ID column intentionally removed (hidden) */}
              <th style={thStyle}>Cattle ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Breed</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Location</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
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
                  {/* ID column removed */}
                  <td style={tdStyle}>{row.cattleId}</td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>
                    {row.name}
                  </td>
                  <td style={tdStyle}>{row.breed}</td>
                  <td style={tdStyle}>{row.gender}</td>
                  <td style={tdStyle}>{row.location}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
