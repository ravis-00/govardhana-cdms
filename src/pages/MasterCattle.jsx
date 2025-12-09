// src/pages/MasterCattle.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getCattle } from "../api/masterApi";

// Status options used in the filter dropdown
const STATUS_OPTIONS = ["All", "Active", "Deactive"];

export default function MasterCattle() {
  const [rows, setRows] = useState([]); // data from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState(null);

  // Load data once when the page mounts
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await getCattle(); // calls Apps Script
        // data is an array of objects with keys from CATTLE_FIELDS in code.gs
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load Master data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const status = String(row.status || "").toLowerCase().trim();

      const matchStatus =
        statusFilter === "All" || status === statusFilter.toLowerCase();

      // Reason from TypeOfDeAdmission
      const reasonRaw =
        row.typeOfDeAdmit ||
        row.typeOfDeAdmission ||
        row.TypeOfDeAdmit ||
        "";
      const reason = String(reasonRaw).trim();

      const haystack = (
        `${row.cattleId || row.tagNumber || ""} ` +
        `${row.name || ""} ` +
        `${row.breed || ""} ` +
        `${row.status || ""} ` +
        `${reason || ""}`
      )
        .toString()
        .toLowerCase();

      const matchSearch = haystack.includes(searchText.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [rows, statusFilter, searchText]);

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
          Master Cattle Data
        </h1>
        <div>Loading data from Master sheet…</div>
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
          Master Cattle Data
        </h1>
        <div style={{ color: "red" }}>{error}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1.5rem 2rem",
        height: "100%",
        display: "flex",
        gap: "1.5rem",
      }}
    >
      {/* LEFT: list */}
      <div style={{ flex: 2, minWidth: 0 }}>
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
            Master Cattle Data
          </h1>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-end",
            }}
          >
            {/* Status filter */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  marginBottom: "0.15rem",
                  color: "#6b7280",
                }}
              >
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "0.35rem 0.6rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #d1d5db",
                  fontSize: "0.85rem",
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
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
                placeholder="Tag no / name / breed / reason (Sold, Dead...)"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  padding: "0.35rem 0.6rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #d1d5db",
                  fontSize: "0.85rem",
                  minWidth: "260px",
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
                <th style={thStyle}>Tag No</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Breed</th>
                <th style={thStyle}>Sex</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Reason</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "0.9rem 1rem",
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    No cattle records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const reason =
                    row.typeOfDeAdmit ||
                    row.typeOfDeAdmission ||
                    row.TypeOfDeAdmit ||
                    "";

                  return (
                    <tr
                      key={row.id || idx}
                      style={{
                        backgroundColor:
                          idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                      }}
                    >
                      <td style={tdStyle}>
                        {row.cattleId || row.tagNumber}
                      </td>
                      <td style={tdStyle}>{row.name}</td>
                      <td style={tdStyle}>{row.breed}</td>
                      <td style={tdStyle}>{row.gender}</td>
                      <td style={tdStyle}>
                        <StatusPill status={row.status} />
                      </td>
                      <td style={tdStyle}>{reason || "-"}</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => setSelected(row)}
                          style={viewBtnStyle}
                          title="View full details"
                        >
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT: detail panel */}
      <div
        style={{
          flex: 1,
          minWidth: "260px",
          maxWidth: "360px",
        }}
      >
        {selected ? (
          <CattleDetailsPanel selected={selected} />
        ) : (
          <div
            style={{
              height: "100%",
              borderRadius: "0.75rem",
              border: "1px dashed #d1d5db",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.9rem",
              color: "#6b7280",
            }}
          >
            Select a cattle from the list to view details.
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------ Details panel component ------------ */

function CattleDetailsPanel({ selected }) {
  const isActive =
    String(selected.status || "").toLowerCase().trim() === "active";

  const reason =
    selected.typeOfDeAdmit ||
    selected.typeOfDeAdmission ||
    selected.TypeOfDeAdmit ||
    "";

  const ageText = formatAge(selected);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "0.75rem",
        boxShadow: "0 10px 25px rgba(15,23,42,0.05)",
        padding: "1rem 1.25rem",
        height: "100%",
      }}
    >
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
            {(selected.cattleId || selected.tagNumber) +
              " – " +
              (selected.name || "")}
          </div>
        </div>
        <StatusPill status={selected.status} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "0.5rem 1.25rem",
          fontSize: "0.85rem",
        }}
      >
        <DetailItem
          label="Tag No"
          value={selected.cattleId || selected.tagNumber}
        />
        <DetailItem label="Name" value={selected.name} />
        <DetailItem label="Breed" value={selected.breed} />
        <DetailItem label="Sex" value={selected.gender} />
        <DetailItem
          label="Colour"
          value={selected.colour || selected.color}
        />
        <DetailItem label="Location / Shed" value={selected.locationShed} />

        <DetailItem
          label="Date of Admission"
          value={formatDate(selected.dateOfAdmission)}
        />
        <DetailItem
          label="Type of Admission"
          value={selected.typeOfAdmission}
        />

        {/* Age + Weight only for Active cattle */}
        {isActive && (
          <>
            <DetailItem label="Age" value={ageText} />
            <DetailItem
              label="Cattle Weight (Kgs)"
              value={selected.weightKgs}
            />
          </>
        )}

        {/* De-Admission details only for Deactive cattle */}
        {!isActive && (
          <>
            <DetailItem
              label="Date of De-Admission"
              value={formatDate(selected.dateOfDeAdmit)}
            />
            <DetailItem
              label="Type of De-Admission"
              value={reason}
            />
          </>
        )}

        <DetailItem
          label="Adoption Status"
          value={selected.adoptionStatus}
        />
      </div>
    </div>
  );
}

/* ------------ helper components & styles ------------ */

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

const viewBtnStyle = {
  border: "none",
  borderRadius: "999px",
  padding: "0.25rem 0.7rem",
  background: "#e0e7ff",
  color: "#1d4ed8",
  fontSize: "0.8rem",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.2rem",
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

function StatusPill({ status }) {
  const normalized = (status || "").toLowerCase();
  let bg = "#e5e7eb";
  let fg = "#374151";

  if (normalized === "active") {
    bg = "#dcfce7";
    fg = "#166534";
  } else if (normalized === "deactive") {
    bg = "#f3f4f6";
    fg = "#4b5563";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "999px",
        padding: "0.15rem 0.6rem",
        background: bg,
        color: fg,
        fontSize: "0.75rem",
        fontWeight: 500,
      }}
    >
      {status}
    </span>
  );
}

/* ------------ formatting helpers ------------ */

function formatDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value); // fallback if invalid
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatAge(c) {
  // AgeMonths_cal in Master = total age in MONTHS
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

      // If both 0, still return something meaningful
      if (parts.length === 0) return "0 months";
      return parts.join(" ");
    }
  }

  // 🔙 Fallbacks if AgeMonths_cal is not set or invalid
  if (c.ageYears) {
    return `${c.ageYears} yr${c.ageYears > 1 ? "s" : ""}`;
  }

  if (c.ageAtAdmission) return String(c.ageAtAdmission);

  return "";
}

