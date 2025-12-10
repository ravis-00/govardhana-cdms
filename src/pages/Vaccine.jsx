// src/pages/Vaccine.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getVaccine } from "../api/masterApi";

function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`; // e.g. 2025-12
}

/**
 * Convert any value from the sheet (Date object, "dd-mm-yyyy" string, ISO, etc.)
 * into a normal "YYYY-MM-DD" string so we can filter by month.
 */
function toIsoDateString(value) {
  if (!value) return "";

  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const str = String(value).trim();

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);

  // DD/MM/YYYY or DD-MM-YYYY
  const m = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    const year = m[3];
    return `${year}-${month}-${day}`;
  }

  // Fallback – let Date parse
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }

  return "";
}

/**
 * Display date as DD/MM/YYYY
 */
function formatDisplayDate(value) {
  const iso = toIsoDateString(value);
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/* ====== React Component ====== */

export default function Vaccine() {
  const [month, setMonth] = useState(getCurrentYearMonth());

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [isEditMode, setIsEditMode] = useState(false);
  const [nextLocalId, setNextLocalId] = useState(1);

  const [selectedEntry, setSelectedEntry] = useState(null);

  // ---- Load from Google Sheet via API ----
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const data = await getVaccine(); // from masterApi.js

        const normalised = (Array.isArray(data) ? data : []).map(
          (raw, index) => ({
            id: raw.id || index + 1,
            date: toIsoDateString(raw.date),
            type: raw.category || raw.type || "", // "Vaccination / Deworming"
            vaccineType: raw.vaccineType || raw.vaccine_type || "",
            medicine: raw.medicine || "",
            doctorName: raw.doctor || raw.doctorName || "",
            remarks: raw.remarks || "",
          })
        );

        setRows(normalised);
        setNextLocalId(normalised.length + 1);
      } catch (err) {
        console.error("Error loading vaccine data", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        if (!r.date) return false;
        const iso = toIsoDateString(r.date);
        return iso.startsWith(month); // YYYY-MM
      }),
    [rows, month]
  );

  function openForm() {
    setIsEditMode(false);
    setForm({
      ...getEmptyForm(),
      date: month + "-01",
    });
    setShowForm(true);
  }

  function openEdit(entry) {
    setIsEditMode(true);
    setForm({
      id: entry.id,
      type: entry.type || "",
      vaccineType: entry.vaccineType || "",
      date: toIsoDateString(entry.date),
      medicine: entry.medicine || "",
      doctorName: entry.doctorName || "",
      remarks: entry.remarks || "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.date || !form.type) {
      alert("Please select date and Vaccination / Deworming type.");
      return;
    }

    const normalised = {
      id: form.id || nextLocalId,
      date: toIsoDateString(form.date),
      type: form.type || "",
      vaccineType: form.vaccineType || "",
      medicine: form.medicine || "",
      doctorName: form.doctorName || "",
      remarks: form.remarks || "",
    };

    if (isEditMode) {
      setRows((prev) =>
        prev.map((r) => (String(r.id) === String(normalised.id) ? normalised : r))
      );
    } else {
      setRows((prev) => [...prev, normalised]);
      setNextLocalId((id) => id + 1);
    }

    setShowForm(false);
  }

  function openView(entry) {
    setSelectedEntry(entry);
  }

  function closeView() {
    setSelectedEntry(null);
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
          Vaccination & Deworming
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

          <button
            type="button"
            onClick={openForm}
            style={{
              padding: "0.45rem 0.95rem",
              borderRadius: "999px",
              border: "none",
              background: "#16a34a",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            + Add Entry
          </button>
        </div>
      </header>

      {/* Error state */}
      {error && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.6rem 0.9rem",
            borderRadius: "0.5rem",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}

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
              <th style={thStyle}>Vaccination / Deworming</th>
              <th style={thStyle}>Vaccine Type</th>
              <th style={thStyle}>Medicine</th>
              <th style={thStyle}>Doctor</th>
              <th style={thStyle}>Remarks</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "0.9rem 1rem",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Loading…
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "0.9rem 1rem",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  No vaccination / deworming entries for this month.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                  }}
                >
                  <td style={tdStyle}>{formatDisplayDate(row.date)}</td>
                  <td style={tdStyle}>{row.type}</td>
                  <td style={tdStyle}>{row.vaccineType}</td>
                  <td style={tdStyle}>{row.medicine}</td>
                  <td style={tdStyle}>{row.doctorName}</td>
                  <td style={tdStyle}>
                    {row.remarks || <span style={{ color: "#9ca3af" }}>—</span>}
                  </td>
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
                      onClick={() => openEdit(row)}
                      style={editBtnStyle}
                      title="Edit entry"
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Centered Form Modal (Add / Edit) */}
      {showForm && (
        <div style={overlayStyle} onClick={closeForm}>
          <div style={formModalStyle} onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                }}
              >
                {isEditMode
                  ? "Edit Vaccination / Deworming"
                  : "Vaccine / Deworming Form"}
              </h2>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={closeForm}
                  style={headerButtonSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="vaccine-form"
                  style={headerButtonPrimary}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Form body */}
            <form
              id="vaccine-form"
              onSubmit={handleSubmit}
              style={{ display: "grid", gap: "0.85rem" }}
            >
              <Field label="Vaccination / Deworming *">
                <select
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="">Select type</option>
                  <option value="Vaccination">Vaccination</option>
                  <option value="Deworming">Deworming</option>
                  <option value="Tick Controlling">Tick Controlling</option>
                  <option value="Skin Infection">Skin Infection</option>
                </select>
              </Field>

              <Field label="Date *">
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Vaccine Type">
                <input
                  type="text"
                  name="vaccineType"
                  value={form.vaccineType}
                  onChange={handleFormChange}
                  style={inputStyle}
                  placeholder="e.g., FMD, HS, Dewormer type"
                />
              </Field>

              <Field label="Medicine">
                <input
                  type="text"
                  name="medicine"
                  value={form.medicine}
                  onChange={handleFormChange}
                  style={inputStyle}
                  placeholder="Enter medicine name"
                />
              </Field>

              <Field label="Doctor Name">
                <input
                  type="text"
                  name="doctorName"
                  value={form.doctorName}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Remarks">
                <input
                  type="text"
                  name="remarks"
                  value={form.remarks}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedEntry && (
        <div style={overlayStyle} onClick={closeView}>
          <div style={viewModalStyle} onClick={(e) => e.stopPropagation()}>
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
                  Vaccination / Deworming Details
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  }}
                >
                  {formatDisplayDate(selectedEntry.date)} – {selectedEntry.type}
                </div>
              </div>
              <button type="button" onClick={closeView} style={closeBtnStyle}>
                ✕
              </button>
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
                label="Date"
                value={formatDisplayDate(selectedEntry.date)}
              />
              <DetailItem
                label="Vaccination / Deworming"
                value={selectedEntry.type}
              />
              <DetailItem
                label="Vaccine Type"
                value={selectedEntry.vaccineType}
              />
              <DetailItem label="Medicine" value={selectedEntry.medicine} />
              <DetailItem label="Doctor Name" value={selectedEntry.doctorName} />
              <DetailItem label="Remarks" value={selectedEntry.remarks} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* helpers and styles */

function getEmptyForm() {
  return {
    id: "",
    type: "",
    date: "",
    vaccineType: "",
    medicine: "",
    doctorName: "",
    remarks: "",
  };
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
  marginRight: "0.25rem",
};

const editBtnStyle = {
  border: "none",
  borderRadius: "999px",
  padding: "0.25rem 0.7rem",
  background: "#fee2e2",
  color: "#b91c1c",
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

const formModalStyle = {
  width: "100%",
  maxWidth: "480px",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#ffffff",
  borderRadius: "1rem",
  padding: "1.25rem 1.5rem 1.5rem",
  boxShadow: "0 25px 60px rgba(15,23,42,0.25)",
};

const viewModalStyle = {
  width: "100%",
  maxWidth: "640px",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#ffffff",
  borderRadius: "1rem",
  padding: "1.25rem 1.5rem 1.5rem",
  boxShadow: "0 25px 60px rgba(15,23,42,0.25)",
};

const headerButtonPrimary = {
  padding: "0.35rem 0.9rem",
  borderRadius: "999px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: "0.85rem",
  cursor: "pointer",
};

const headerButtonSecondary = {
  padding: "0.35rem 0.9rem",
  borderRadius: "999px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#374151",
  fontWeight: 500,
  fontSize: "0.85rem",
  cursor: "pointer",
};

const inputStyle = {
  width: "100%",
  padding: "0.5rem 0.6rem",
  borderRadius: "0.5rem",
  border: "1px solid #d1d5db",
  fontSize: "0.9rem",
};

function Field({ label, children }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "0.85rem",
          marginBottom: "0.25rem",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

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

const closeBtnStyle = {
  border: "none",
  borderRadius: "999px",
  padding: "0.25rem 0.6rem",
  background: "#e5e7eb",
  cursor: "pointer",
  fontSize: "0.85rem",
};
