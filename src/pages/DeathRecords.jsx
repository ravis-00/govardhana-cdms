// src/pages/DeathRecords.jsx
import React, { useMemo, useState } from "react";

function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`; // e.g. 2025-12
}

// TEMP sample data – later you can replace with API / DB data
const DEATH_RECORDS = [
  {
    id: 1,
    cattleId: "617335",
    govId: "105211",
    name: "RUDHRA",
    breed: "Malenadu Gidda",
    gender: "Male",
    cattleType: "Bull",
    colour: "Black",
    ageYears: 2,
    shed: "Jayadeva",
    location: "Farm Block 1",
    typeOfDeAdmission: "Death",
    dateOfDeAdmission: "2025-11-27",
    causeOfDeath: "Sudden illness",
    permanentDisabilityAtBirth: "N",
    adoptionStatus: "Not Adopted",
    remarks: "Found dead in shed in the morning.",
    pictureUrl:
      "https://via.placeholder.com/480x320.png?text=Cattle+Death+Photo",
  },
  {
    id: 2,
    cattleId: "700697",
    govId: "982211",
    name: "GANGA",
    breed: "Gir",
    gender: "Female",
    cattleType: "Cow",
    colour: "Brown",
    ageYears: 5,
    shed: "Kaveri",
    location: "Farm Block 2",
    typeOfDeAdmission: "Death",
    dateOfDeAdmission: "2025-11-02",
    causeOfDeath: "Old age",
    permanentDisabilityAtBirth: "N",
    adoptionStatus: "Not Adopted",
    remarks: "",
    pictureUrl:
      "https://via.placeholder.com/480x320.png?text=Cattle+Death+Photo",
  },
];

export default function DeathRecords() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [selected, setSelected] = useState(null);

  const filteredRows = useMemo(() => {
    const minDate = new Date("2024-01-01");

    return DEATH_RECORDS.filter((r) => {
      if (r.typeOfDeAdmission !== "Death") return false;
      const d = new Date(r.dateOfDeAdmission);
      if (!(d > minDate)) return false;
      return r.dateOfDeAdmission.startsWith(month);
    });
  }, [month]);

  function openView(row) {
    setSelected(row);
  }

  function closeView() {
    setSelected(null);
  }

  function handlePrint(record) {
    const win = window.open("", "_blank");
    if (!win) return;

    const html = `
      <html>
        <head>
          <title>Cattle Death Record - ${record.cattleId}</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            h2 { font-size: 18px; margin-top: 24px; margin-bottom: 8px; }
            .meta { color: #6b7280; margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 14px; }
            .label { font-weight: 600; color: #4b5563; }
            .value { color: #111827; }
            .photo { margin-top: 16px; }
            .photo img { max-width: 100%; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>Cattle Death Record</h1>
          <div class="meta">Date of De-Admission: ${record.dateOfDeAdmission}</div>

          <div class="grid">
            <div><span class="label">Cattle ID:</span> <span class="value">${record.cattleId}</span></div>
            <div><span class="label">Govt ID:</span> <span class="value">${record.govId || "-"}</span></div>

            <div><span class="label">Name:</span> <span class="value">${record.name}</span></div>
            <div><span class="label">Breed:</span> <span class="value">${record.breed}</span></div>

            <div><span class="label">Gender:</span> <span class="value">${record.gender}</span></div>
            <div><span class="label">Cattle Type:</span> <span class="value">${record.cattleType}</span></div>

            <div><span class="label">Colour:</span> <span class="value">${record.colour}</span></div>
            <div><span class="label">Age (Years):</span> <span class="value">${record.ageYears}</span></div>

            <div><span class="label">Shed:</span> <span class="value">${record.shed || "-"}</span></div>
            <div><span class="label">Location:</span> <span class="value">${record.location || "-"}</span></div>

            <div><span class="label">Cause of Death:</span> <span class="value">${record.causeOfDeath || "-"}</span></div>
            <div><span class="label">Adoption Status:</span> <span class="value">${record.adoptionStatus || "-"}</span></div>

            <div><span class="label">Disability at Birth:</span> <span class="value">${record.permanentDisabilityAtBirth || "-"}</span></div>
          </div>

          ${
            record.remarks
              ? `<h2>Remarks</h2><p>${record.remarks}</p>`
              : ""
          }

          ${
            record.pictureUrl
              ? `<div class="photo"><h2>Photo</h2><img src="${record.pictureUrl}" /></div>`
              : ""
          }
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Header */}
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
          Cattle Death Records
        </h1>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                marginBottom: "0.15rem",
                color: "#6b7280",
              }}
            >
              Month
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{
                padding: "0.35rem 0.6rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                fontSize: "0.85rem",
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
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Cattle ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Breed</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Age (Years)</th>
              <th style={thStyle}>Shed</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: "0.9rem 1rem",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  No cattle death records for this month.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr
                  key={row.id}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                  }}
                >
                  <td style={tdStyle}>{row.dateOfDeAdmission}</td>
                  <td style={tdStyle}>{row.cattleId}</td>
                  <td style={tdStyle}>{row.name}</td>
                  <td style={tdStyle}>{row.breed}</td>
                  <td style={tdStyle}>{row.gender}</td>
                  <td style={tdStyle}>{row.ageYears}</td>
                  <td style={tdStyle}>{row.shed}</td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openView(row)}
                      style={viewBtnStyle}
                      title="View details"
                    >
                      👁️ View
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrint(row)}
                      style={{ ...viewBtnStyle, marginLeft: "0.4rem" }}
                      title="Print death record"
                    >
                      🖨️ Print
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View modal */}
      {selected && (
        <div style={overlayStyle} onClick={closeView}>
          <div
            style={viewModalStyle}
            onClick={(e) => e.stopPropagation()}
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
                  Cattle Death Details
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  }}
                >
                  {selected.cattleId} – {selected.name}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  Date of De-Admission: {selected.dateOfDeAdmission}
                </div>
              </div>
              <button
                type="button"
                onClick={closeView}
                style={closeBtnStyle}
              >
                ✕
              </button>
            </div>

            {/* Layout: image on left, details on right (if picture present) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: selected.pictureUrl
                  ? "minmax(0, 1.1fr) minmax(0, 1.3fr)"
                  : "minmax(0, 1fr)",
                gap: "1.25rem",
              }}
            >
              {selected.pictureUrl && (
                <div>
                  <img
                    src={selected.pictureUrl}
                    alt={selected.name}
                    style={{
                      width: "100%",
                      borderRadius: "0.75rem",
                      objectFit: "cover",
                      maxHeight: "320px",
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "0.5rem 1.25rem",
                  fontSize: "0.85rem",
                }}
              >
                <DetailItem label="Cattle ID" value={selected.cattleId} />
                <DetailItem label="Govt ID" value={selected.govId} />
                <DetailItem label="Name" value={selected.name} />
                <DetailItem label="Breed" value={selected.breed} />
                <DetailItem label="Gender" value={selected.gender} />
                <DetailItem label="Cattle Type" value={selected.cattleType} />
                <DetailItem label="Colour" value={selected.colour} />
                <DetailItem label="Age (Years)" value={selected.ageYears} />
                <DetailItem label="Shed" value={selected.shed} />
                <DetailItem label="Location" value={selected.location} />
                <DetailItem
                  label="Cause of Death"
                  value={selected.causeOfDeath}
                />
                <DetailItem
                  label="Adoption Status"
                  value={selected.adoptionStatus}
                />
                <DetailItem
                  label="Disability at Birth"
                  value={selected.permanentDisabilityAtBirth}
                />
              </div>
            </div>

            {selected.remarks && (
              <div style={{ marginTop: "0.9rem", fontSize: "0.85rem" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#9ca3af",
                    marginBottom: "0.15rem",
                  }}
                >
                  Remarks
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{selected.remarks}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- helpers & styles ---------- */

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

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

const viewModalStyle = {
  width: "100%",
  maxWidth: "880px",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#ffffff",
  borderRadius: "1rem",
  padding: "1.25rem 1.5rem 1.5rem",
  boxShadow: "0 25px 60px rgba(15,23,42,0.25)",
};

const closeBtnStyle = {
  border: "none",
  borderRadius: "999px",
  padding: "0.25rem 0.6rem",
  background: "#e5e7eb",
  cursor: "pointer",
  fontSize: "0.85rem",
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
