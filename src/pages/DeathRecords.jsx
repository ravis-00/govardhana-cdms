// src/pages/DeathRecords.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getDeathRecords } from "../api/masterApi.js";

function isoDateOnly(value) {
  if (!value) return "";
  // If backend sends ISO string like "2025-02-25T18:30:00.000Z"
  if (typeof value === "string") return value.slice(0, 10);
  // If it is a Date object (unlikely in browser, but just in case)
  if (Object.prototype.toString.call(value) === "[object Date]") {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
}

function toDateObj(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function defaultFromDate() {
  // last 90 days
  const d = new Date();
  d.setDate(d.getDate() - 90);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeRecord(r) {
  const dateIso =
    isoDateOnly(r.dateOfDeAdmit || r.dateOfDeAdmission || r.dateOfDeath || "");

  return {
    id: r.id,
    cattleId: r.cattleId || r.tagNo || r.tagNumber || "",
    govId: r.govtId ?? r.govId ?? "",
    name: r.name || "",
    breed: r.breed || "",
    gender: r.gender || "",
    cattleType: r.cattleType || "",
    colour: r.colour || "",
    ageYears: r.ageYears ?? "",
    shed: r.locationShed || r.shed || "",
    location: r.location || "",
    typeOfDeAdmission: r.typeOfDeAdmit || r.typeOfDeAdmission || "",
    dateOfDeAdmission: dateIso,
    causeOfDeath: r.deathCause || r.deathCauseCat || r.causeOfDeath || "",
    permanentDisabilityAtBirth:
      r.disabilityFlag ?? r.permanentDisabilityAtBirth ?? "",
    adoptionStatus: r.adoptionStatus || "",
    remarks: r.remarks || "",
    pictureUrl: r.pictureUrl || "",
  };
}

export default function DeathRecords() {
  const [fromDate, setFromDate] = useState(defaultFromDate());
  const [toDate, setToDate] = useState(""); // optional
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch from backend
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        // Backend supports fromDate; we apply toDate filtering on frontend
        const data = await getDeathRecords(fromDate || "2024-01-01");

        const normalized = Array.isArray(data)
          ? data.map(normalizeRecord)
          : [];

        if (alive) setRows(normalized);
      } catch (e) {
        if (alive) setError(e?.message || "Failed to load death records");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [fromDate]);

  // Filter: Death only + date range (frontend)
  const filteredRows = useMemo(() => {
    const from = toDateObj(fromDate);
    const to = toDateObj(toDate);

    return rows
      .filter((r) => {
        const type = String(r.typeOfDeAdmission || "").toLowerCase().trim();
        const isDeath = type === "death";
        if (!isDeath) return false;

        const d = toDateObj(r.dateOfDeAdmission);
        if (!d) return true; // if date missing, don't hide

        if (from && d < from) return false;
        if (to) {
          // inclusive end date
          const toInclusive = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
          if (d >= toInclusive) return false;
        }
        return true;
      })
      // sort by date desc (latest first)
      .sort((a, b) => {
        const da = toDateObj(a.dateOfDeAdmission)?.getTime() || 0;
        const db = toDateObj(b.dateOfDeAdmission)?.getTime() || 0;
        return db - da;
      });
  }, [rows, fromDate, toDate]);

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
          <div class="meta">Date of De-Admission: ${record.dateOfDeAdmission || "-"}</div>

          <div class="grid">
            <div><span class="label">Cattle ID:</span> <span class="value">${record.cattleId}</span></div>
            <div><span class="label">Govt ID:</span> <span class="value">${record.govId || "-"}</span></div>

            <div><span class="label">Name:</span> <span class="value">${record.name || "-"}</span></div>
            <div><span class="label">Breed:</span> <span class="value">${record.breed || "-"}</span></div>

            <div><span class="label">Gender:</span> <span class="value">${record.gender || "-"}</span></div>
            <div><span class="label">Cattle Type:</span> <span class="value">${record.cattleType || "-"}</span></div>

            <div><span class="label">Colour:</span> <span class="value">${record.colour || "-"}</span></div>
            <div><span class="label">Age (Years):</span> <span class="value">${record.ageYears || "-"}</span></div>

            <div><span class="label">Shed:</span> <span class="value">${record.shed || "-"}</span></div>
            <div><span class="label">Location:</span> <span class="value">${record.location || "-"}</span></div>

            <div><span class="label">Cause of Death:</span> <span class="value">${record.causeOfDeath || "-"}</span></div>
            <div><span class="label">Adoption Status:</span> <span class="value">${record.adoptionStatus || "-"}</span></div>

            <div><span class="label">Disability at Birth:</span> <span class="value">${record.permanentDisabilityAtBirth || "-"}</span></div>
          </div>

          ${record.remarks ? `<h2>Remarks</h2><p>${record.remarks}</p>` : ""}

          ${record.pictureUrl ? `<div class="photo"><h2>Photo</h2><img src="${record.pictureUrl}" /></div>` : ""}
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
      <header
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: "1rem",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>
            Cattle Death Records
          </h1>
          <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>
            Showing: {filteredRows.length} record(s)
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={labelStyle}>From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>To (optional)</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </header>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: "#ffffff",
          borderRadius: "0.75rem",
          boxShadow: "0 10px 25px rgba(15,23,42,0.05)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#f1f5f9", textAlign: "left" }}>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Tag No</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Breed</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Age (Years)</th>
              <th style={thStyle}>Shed</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: "0.9rem 1rem", textAlign: "center", color: "#6b7280" }}>
                  Loading death records...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "0.9rem 1rem", textAlign: "center", color: "#6b7280" }}>
                  No cattle death records for the selected date range.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={`${row.id}-${idx}`} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                  <td style={tdStyle}>{row.dateOfDeAdmission || "-"}</td>
                  <td style={tdStyle}>{row.cattleId || "-"}</td>
                  <td style={tdStyle}>{row.name || "-"}</td>
                  <td style={tdStyle}>{row.breed || "-"}</td>
                  <td style={tdStyle}>{row.gender || "-"}</td>
                  <td style={tdStyle}>{row.ageYears || "-"}</td>
                  <td style={tdStyle}>{row.shed || "-"}</td>
                  <td style={{ ...tdStyle, textAlign: "center", whiteSpace: "nowrap" }}>
                    <button type="button" onClick={() => openView(row)} style={viewBtnStyle} title="View details">
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

      {selected && (
        <div style={overlayStyle} onClick={closeView}>
          <div style={viewModalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div>
                <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>
                  Cattle Death Details
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                  {selected.cattleId} – {selected.name}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  Date of De-Admission: {selected.dateOfDeAdmission || "-"}
                </div>
              </div>
              <button type="button" onClick={closeView} style={closeBtnStyle}>✕</button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: selected.pictureUrl ? "minmax(0, 1.1fr) minmax(0, 1.3fr)" : "minmax(0, 1fr)",
                gap: "1.25rem",
              }}
            >
              {selected.pictureUrl && (
                <div>
                  <img
                    src={selected.pictureUrl}
                    alt={selected.name}
                    style={{ width: "100%", borderRadius: "0.75rem", objectFit: "cover", maxHeight: "320px" }}
                  />
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.5rem 1.25rem", fontSize: "0.85rem" }}>
                <DetailItem label="Tag No" value={selected.cattleId} />
                <DetailItem label="Govt ID" value={selected.govId} />
                <DetailItem label="Name" value={selected.name} />
                <DetailItem label="Breed" value={selected.breed} />
                <DetailItem label="Gender" value={selected.gender} />
                <DetailItem label="Cattle Type" value={selected.cattleType} />
                <DetailItem label="Colour" value={selected.colour} />
                <DetailItem label="Age (Years)" value={selected.ageYears} />
                <DetailItem label="Shed" value={selected.shed} />
                <DetailItem label="Location" value={selected.location} />
                <DetailItem label="Cause of Death" value={selected.causeOfDeath} />
                <DetailItem label="Adoption Status" value={selected.adoptionStatus} />
              </div>
            </div>

            {selected.remarks && (
              <div style={{ marginTop: "0.9rem", fontSize: "0.85rem" }}>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", marginBottom: "0.15rem" }}>
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

const labelStyle = {
  display: "block",
  fontSize: "0.75rem",
  marginBottom: "0.15rem",
  color: "#6b7280",
};

const inputStyle = {
  padding: "0.35rem 0.6rem",
  borderRadius: "0.5rem",
  border: "1px solid #d1d5db",
  fontSize: "0.85rem",
};

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
      <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", marginBottom: "0.1rem" }}>
        {label}
      </div>
      <div style={{ color: "#111827" }}>{value}</div>
    </div>
  );
}
