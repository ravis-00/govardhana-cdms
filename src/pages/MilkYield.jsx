// src/pages/MilkYield.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getMilkYield } from "../api/masterApi";

function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`; // e.g. 2025-12
}

/**
 * Format any date-ish value as dd/mm/yyyy.
 */
function formatDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Convert a date value into yyyy-mm-dd for <input type="date" />.
 */
function toInputDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (!Number.isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  // Fallback – if already a string like 2025-10-02T...
  return String(value).slice(0, 10);
}

export default function MilkYield() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [formMode, setFormMode] = useState("add"); // "add" | "edit"
  const [editingIndex, setEditingIndex] = useState(null);
  const [nextId, setNextId] = useState(1);

  // for view-details popup
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Load from backend
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await getMilkYield();
        const safe = Array.isArray(data) ? data : [];
        setRows(safe);
        setNextId((safe.length || 0) + 1);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load milk yield data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        const d = String(r.date || "");
        return d.startsWith(month); // underlying date is ISO-like
      }),
    [rows, month]
  );

  // === Add / Edit form helpers ===

  function openFormAdd() {
    setFormMode("add");
    setEditingIndex(null);
    setForm({
      ...getEmptyForm(),
      date: month + "-01",
    });
    setShowForm(true);
  }

  function openFormEdit(row, index) {
    setFormMode("edit");
    setEditingIndex(index);
    setForm({
      date: toInputDate(row.date),
      shed: row.shed || "",
      morningYield: row.morningYield ?? "",
      eveningYield: row.eveningYield ?? "",
      dayTotalYield: row.dayTotalYield ?? "",
      outPass: row.outPass ?? "",
      outPassNumber: row.outPassNumber ?? "",
      leftToByProducts: row.leftToByProducts ?? "",
      milkToWorkers: row.milkToWorkers ?? "",
      milkToTemple: row.milkToTemple ?? "",
      milkToGuests: row.milkToGuests ?? "",
      milkToStaffCanteen: row.milkToStaffCanteen ?? "",
      milkToEvents: row.milkToEvents ?? "",
      remarks: row.remarks ?? "",
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

    const prepared = {
      ...form,
      // keep date as yyyy-mm-dd from input
      morningYield: Number(form.morningYield || 0),
      eveningYield: Number(form.eveningYield || 0),
      dayTotalYield: Number(form.dayTotalYield || 0),
      outPass: Number(form.outPass || 0),
      leftToByProducts: Number(form.leftToByProducts || 0),
      milkToWorkers: Number(form.milkToWorkers || 0),
      milkToTemple: Number(form.milkToTemple || 0),
      milkToGuests: Number(form.milkToGuests || 0),
      milkToStaffCanteen: Number(form.milkToStaffCanteen || 0),
      milkToEvents: Number(form.milkToEvents || 0),
    };

    if (formMode === "add") {
      const newRow = {
        ...prepared,
        id: nextId,
      };
      setRows((prev) => [...prev, newRow]);
      setNextId((id) => id + 1);
    } else if (formMode === "edit" && editingIndex !== null) {
      setRows((prev) =>
        prev.map((row, idx) => (idx === editingIndex ? { ...row, ...prepared } : row))
      );
    }

    setShowForm(false);
  }

  // === View modal helpers ===

  function openView(entry) {
    setSelectedEntry(entry);
  }

  function closeView() {
    setSelectedEntry(null);
  }

  // === Loading / error states ===

  if (loading) {
    return (
      <div style={{ padding: "1.5rem 2rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Milk Yield
        </h1>
        <div>Loading milk yield data…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1.5rem 2rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Milk Yield
        </h1>
        <div style={{ color: "red" }}>{error}</div>
      </div>
    );
  }

  // === Main UI ===

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
          Milk Yield
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
            onClick={openFormAdd}
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
              <th style={thStyle}>Shed</th>
              <th style={thStyle}>Morning (L)</th>
              <th style={thStyle}>Evening (L)</th>
              <th style={thStyle}>Day Total (L)</th>
              <th style={thStyle}>Out Pass (L)</th>
              <th style={thStyle}>Left to By-products</th>
              <th style={thStyle}>Milk to Workers</th>
              <th style={thStyle}>Milk to Temple</th>
              <th style={thStyle}>Staff Canteen</th>
              <th style={thStyle}>Events</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  style={{
                    padding: "0.9rem 1rem",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  No milk yield entries for this month.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                  }}
                >
                  <td style={tdStyle}>{formatDate(row.date)}</td>
                  <td style={tdStyle}>{row.shed}</td>
                  <td style={tdStyle}>{row.morningYield}</td>
                  <td style={tdStyle}>{row.eveningYield}</td>
                  <td style={tdStyle}>{row.dayTotalYield}</td>
                  <td style={tdStyle}>{row.outPass}</td>
                  <td style={tdStyle}>{row.leftToByProducts}</td>
                  <td style={tdStyle}>{row.milkToWorkers}</td>
                  <td style={tdStyle}>{row.milkToTemple}</td>
                  <td style={tdStyle}>{row.milkToStaffCanteen}</td>
                  <td style={tdStyle}>{row.milkToEvents}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        gap: "0.35rem",
                        alignItems: "center",
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
                        onClick={() => openFormEdit(row, idx)}
                        style={editBtnStyle}
                        title="Edit entry"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Centered Form Modal (Add + Edit) */}
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
                {formMode === "add" ? "Add Milk Yield Entry" : "Edit Milk Yield Entry"}
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
                  form="milk-yield-form"
                  style={headerButtonPrimary}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Form body */}
            <form
              id="milk-yield-form"
              onSubmit={handleSubmit}
              style={{ display: "grid", gap: "0.85rem" }}
            >
              <Field label="Date *">
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Shed *">
                <select
                  name="shed"
                  value={form.shed}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="">Select Shed</option>
                  <option value="Punyakoti">Punyakoti</option>
                  <option value="Samrakshana">Samrakshana</option>
                  <option value="Go Dana">Go Dana</option>
                  <option value="Shashwatha Dattu Sweekara">
                    Shashwatha Dattu Sweekara
                  </option>
                </select>
              </Field>

              <NumberField
                label="Morning Milk Yield (L)"
                name="morningYield"
                value={form.morningYield}
                onChange={handleFormChange}
              />

              <NumberField
                label="Evening Milk Yield (L)"
                name="eveningYield"
                value={form.eveningYield}
                onChange={handleFormChange}
              />

              <NumberField
                label="Day Total Yield (L)"
                name="dayTotalYield"
                value={form.dayTotalYield}
                onChange={handleFormChange}
              />

              <NumberField
                label="Out Pass (L)"
                name="outPass"
                value={form.outPass}
                onChange={handleFormChange}
              />

              <Field label="Out Pass Number">
                <input
                  type="text"
                  name="outPassNumber"
                  value={form.outPassNumber}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <NumberField
                label="Left to By-products (L)"
                name="leftToByProducts"
                value={form.leftToByProducts}
                onChange={handleFormChange}
              />

              <NumberField
                label="Milk to Workers (L)"
                name="milkToWorkers"
                value={form.milkToWorkers}
                onChange={handleFormChange}
              />

              <NumberField
                label="Milk to Temple (L)"
                name="milkToTemple"
                value={form.milkToTemple}
                onChange={handleFormChange}
              />

              <NumberField
                label="Milk to Guests (L)"
                name="milkToGuests"
                value={form.milkToGuests}
                onChange={handleFormChange}
              />

              <NumberField
                label="Milk to Staff Canteen (L)"
                name="milkToStaffCanteen"
                value={form.milkToStaffCanteen}
                onChange={handleFormChange}
              />

              <NumberField
                label="Milk to Events (L)"
                name="milkToEvents"
                value={form.milkToEvents}
                onChange={handleFormChange}
              />

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
                  Milk Yield Details
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  }}
                >
                  {formatDate(selectedEntry.date)} – {selectedEntry.shed}
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
              <DetailItem label="Date" value={formatDate(selectedEntry.date)} />
              <DetailItem label="Shed" value={selectedEntry.shed} />
              <DetailItem
                label="Morning Milk Yield (L)"
                value={selectedEntry.morningYield}
              />
              <DetailItem
                label="Evening Milk Yield (L)"
                value={selectedEntry.eveningYield}
              />
              <DetailItem
                label="Day Total Yield (L)"
                value={selectedEntry.dayTotalYield}
              />
              <DetailItem
                label="Out Pass (L)"
                value={selectedEntry.outPass}
              />
              <DetailItem
                label="Out Pass Number"
                value={selectedEntry.outPassNumber}
              />
              <DetailItem
                label="Left to By-products (L)"
                value={selectedEntry.leftToByProducts}
              />
              <DetailItem
                label="Milk to Workers (L)"
                value={selectedEntry.milkToWorkers}
              />
              <DetailItem
                label="Milk to Temple (L)"
                value={selectedEntry.milkToTemple}
              />
              <DetailItem
                label="Milk to Guests (L)"
                value={selectedEntry.milkToGuests}
              />
              <DetailItem
                label="Milk to Staff Canteen (L)"
                value={selectedEntry.milkToStaffCanteen}
              />
              <DetailItem
                label="Milk to Events (L)"
                value={selectedEntry.milkToEvents}
              />
              <DetailItem
                label="Remarks"
                value={selectedEntry.remarks}
              />
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
    date: "",
    shed: "",
    morningYield: "",
    eveningYield: "",
    dayTotalYield: "",
    outPass: "",
    outPassNumber: "",
    leftToByProducts: "",
    milkToWorkers: "",
    milkToTemple: "",
    milkToGuests: "",
    milkToStaffCanteen: "",
    milkToEvents: "",
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
};

const editBtnStyle = {
  border: "none",
  borderRadius: "999px",
  padding: "0.25rem 0.7rem",
  background: "#dcfce7",
  color: "#166534",
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

function NumberField({ label, name, value, onChange }) {
  return (
    <Field label={label}>
      <input
        type="number"
        step="0.01"
        name={name}
        value={value}
        onChange={onChange}
        style={inputStyle}
      />
    </Field>
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
      <div style={{ color: "#111827" }}>{String(value)}</div>
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
