// src/pages/Treatment.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getTreatments,
  addTreatment,
  updateTreatment,
} from "../api/masterApi";

/** Month helper (YYYY-MM) */
function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`; // e.g. 2025-12
}

/** Display date as dd/mm/yyyy (from YYYY-MM-DD or sheet formats) */
function formatDateDisplay(value) {
  if (!value) return "";
  // handle 2025-10-31 or 2025-10-31T00:00:00Z
  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d}/${m}/${y}`;
  }
  // handle 31-10-2025 or 31/10/2025
  const parts = String(value).split(/[\/\-]/);
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${String(d).padStart(2, "0")}/${String(m).padStart(
      2,
      "0"
    )}/${y}`;
  }
  return String(value);
}

/** Disease / Symptom EnumList options (from AppSheet) */
const DISEASE_OPTIONS = [
  "Anemic",
  "Back Left Leg fracture",
  "Back Right Leg fracture",
  "Bloating",
  "Broken Horn",
  "Bronchitis",
  "Fever",
  "Front Left Leg fracture",
  "Front Right Leg fracture",
  "Indigestion",
  "Inflammation",
  "Injury",
  "Pneumonia",
  "Skin Infection",
  "Sprain, Limping",
  "Weakness",
  "Wound",
];

export default function Treatment() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [mode, setMode] = useState("add"); // "add" | "edit"
  const [editingId, setEditingId] = useState(null);

  const [selectedEntry, setSelectedEntry] = useState(null);

  // ───────────────── Fetch from backend ─────────────────
  useEffect(() => {
    loadTreatments();
  }, []);

  async function loadTreatments() {
    try {
      setLoading(true);
      setError("");
      const data = await getTreatments(); // from masterApi.js
      // normalise: ensure we have 'date' as YYYY-MM-DD
      const normalised = (data || []).map((row) => ({
        id: row.id,
        cattleId: row.cattleId || row["Cattle ID"],
        date: row.date || row.treatmentDate || row["Treatment Date"],
        diseaseSymptoms:
          row.diseaseSymptoms || row["Decease/Symptom"] || row.deceaseSymptom,
        medicine: row.medicine || row["Medicine"],
        doctorName: row.doctorName || row["Doctor Name"],
        photoUrl: row.photoUrl || row["Photo"],
        remarks: row.remarks || row["Remarks"],
      }));
      setRows(normalised);
    } catch (err) {
      console.error("Error loading treatments", err);
      setError("Could not load medical treatment data.");
    } finally {
      setLoading(false);
    }
  }

  // filter by month (YYYY-MM)
  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        if (!r.date) return false;
        const str = String(r.date);
        // expect YYYY-MM-DD or similar
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          return str.startsWith(month);
        }
        // if dd-mm-yyyy: convert
        const parts = str.split(/[\/\-]/);
        if (parts.length === 3) {
          const [d, m, y] = parts;
          const mm = String(m).padStart(2, "0");
          return `${y}-${mm}` === month;
        }
        return false;
      }),
    [rows, month]
  );

  // ───────────────── Form helpers ─────────────────
  function openFormForAdd() {
    setMode("add");
    setEditingId(null);
    setForm({
      ...getEmptyForm(),
      date: month + "-01",
    });
    setShowForm(true);
  }

  function openFormForEdit(entry) {
    setMode("edit");
    setEditingId(entry.id);
    setForm({
      cattleId: entry.cattleId || "",
      date: entry.date && String(entry.date).slice(0, 10),
      // split string → array for multi-select
      diseaseSymptoms: entry.diseaseSymptoms
        ? String(entry.diseaseSymptoms)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      medicine: entry.medicine || "",
      doctorName: entry.doctorName || "",
      photoUrl: entry.photoUrl || "",
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

  // for multi-select Disease/Symptom
  function handleDiseaseChange(e) {
    const selected = Array.from(e.target.selectedOptions).map(
      (opt) => opt.value
    );
    setForm((prev) => ({ ...prev, diseaseSymptoms: selected }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      id: editingId,
      cattleId: form.cattleId || "",
      date: form.date || "",
      diseaseSymptoms: (form.diseaseSymptoms || []).join(", "),
      medicine: form.medicine || "",
      doctorName: form.doctorName || "",
      photoUrl: form.photoUrl || "",
      remarks: form.remarks || "",
    };

    try {
      setLoading(true);
      setError("");

      if (mode === "add") {
        await addTreatment(payload);
      } else {
        await updateTreatment(payload);
      }

      await loadTreatments();
      setShowForm(false);
    } catch (err) {
      console.error("Error saving treatment", err);
      setError("Could not save treatment entry.");
    } finally {
      setLoading(false);
    }
  }

  function openView(entry) {
    setSelectedEntry(entry);
  }

  function closeView() {
    setSelectedEntry(null);
  }

  // ───────────────── Render ─────────────────
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
          Medical Treatment
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
            onClick={openFormForAdd}
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

      {error && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            background: "#fee2e2",
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
              <th style={thStyle}>Cattle ID</th>
              <th style={thStyle}>Disease / Symptom</th>
              <th style={thStyle}>Medicine</th>
              <th style={thStyle}>Doctor</th>
              <th style={thStyle}>Remarks</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "0.9rem 1rem",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Loading medical treatment entries…
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
                  No medical treatment entries for this month.
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
                  <td style={tdStyle}>{formatDateDisplay(row.date)}</td>
                  <td style={tdStyle}>{row.cattleId}</td>
                  <td style={tdStyle}>{row.diseaseSymptoms}</td>
                  <td style={tdStyle}>{row.medicine}</td>
                  <td style={tdStyle}>{row.doctorName}</td>
                  <td style={tdStyle}>
                    {row.remarks || (
                      <span style={{ color: "#9ca3af" }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
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
                      onClick={() => openFormForEdit(row)}
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

      {/* Centered Form Modal */}
      {showForm && (
        <div style={overlayStyle} onClick={closeForm}>
          <div
            style={formModalStyle}
            onClick={(e) => e.stopPropagation()}
          >
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
                {mode === "add"
                  ? "Add Medical Treatment"
                  : "Edit Medical Treatment"}
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
                  form="treatment-form"
                  style={headerButtonPrimary}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Form body */}
            <form
              id="treatment-form"
              onSubmit={handleSubmit}
              style={{ display: "grid", gap: "0.85rem" }}
            >
              <Field label="Cattle ID">
                <input
                  type="text"
                  name="cattleId"
                  value={form.cattleId}
                  onChange={handleFormChange}
                  style={inputStyle}
                  placeholder="Enter Cattle ID"
                />
              </Field>

              <Field label="Treatment Date *">
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Disease / Symptom (EnumList)">
                <select
                  multiple
                  name="diseaseSymptoms"
                  value={form.diseaseSymptoms}
                  onChange={handleDiseaseChange}
                  style={{
                    ...inputStyle,
                    minHeight: "140px",
                  }}
                >
                  {DISEASE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    marginTop: "0.25rem",
                    fontSize: "0.75rem",
                    color: "#6b7280",
                  }}
                >
                  Hold <strong>Ctrl</strong> (Cmd on Mac) to select multiple.
                </div>
              </Field>

              <Field label="Medicine *">
                <textarea
                  name="medicine"
                  value={form.medicine}
                  onChange={handleFormChange}
                  style={{
                    ...inputStyle,
                    minHeight: "70px",
                    resize: "vertical",
                  }}
                  placeholder="Example: Antigas bolus, Antibiotic"
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

              <Field label="Photo (URL – placeholder)">
                <input
                  type="text"
                  name="photoUrl"
                  value={form.photoUrl}
                  onChange={handleFormChange}
                  style={inputStyle}
                  placeholder="Later we can support uploads"
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
                  Medical Treatment Details
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  }}
                >
                  {formatDateDisplay(selectedEntry.date)} – Cattle{" "}
                  {selectedEntry.cattleId}
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
                label="Treatment Date"
                value={formatDateDisplay(selectedEntry.date)}
              />
              <DetailItem label="Cattle ID" value={selectedEntry.cattleId} />
              <DetailItem
                label="Disease / Symptom"
                value={selectedEntry.diseaseSymptoms}
              />
              <DetailItem label="Medicine" value={selectedEntry.medicine} />
              <DetailItem
                label="Doctor Name"
                value={selectedEntry.doctorName}
              />
              <DetailItem label="Photo URL" value={selectedEntry.photoUrl} />
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
    cattleId: "",
    date: "",
    diseaseSymptoms: [],
    medicine: "",
    doctorName: "",
    photoUrl: "",
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
  marginRight: "0.35rem",
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
  maxWidth: "520px",
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
