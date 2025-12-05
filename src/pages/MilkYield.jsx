// src/pages/MilkYield.jsx
import React, { useMemo, useState } from "react";

function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`; // e.g. 2025-12
}

// TEMP sample data – later we will load from backend
const SAMPLE_YIELD = [
  {
    id: 1,
    date: "2025-12-01",
    shed: "Punyakoti",
    morningYield: 120,
    eveningYield: 100,
    calfShare: 20,
    calfNoseNumber: "C-001",
    vendor: 80,
    temple: 30,
    guests: 10,
    canteen: 50,
    hostel: 20,
    remarks: "Normal day",
  },
  {
    id: 2,
    date: "2025-12-02",
    shed: "Punyakoti",
    morningYield: 130,
    eveningYield: 105,
    calfShare: 25,
    calfNoseNumber: "C-002",
    vendor: 90,
    temple: 25,
    guests: 8,
    canteen: 55,
    hostel: 22,
    remarks: "",
  },
];

export default function MilkYield() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState(SAMPLE_YIELD);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [nextId, setNextId] = useState(SAMPLE_YIELD.length + 1);

  // for view-details popup
  const [selectedEntry, setSelectedEntry] = useState(null);

  const filteredRows = useMemo(
    () => rows.filter((r) => r.date.startsWith(month)),
    [rows, month]
  );

  function openForm() {
    setForm({
      ...getEmptyForm(),
      date: month + "-01",
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

    const newRow = {
      ...form,
      id: nextId,
      morningYield: Number(form.morningYield || 0),
      eveningYield: Number(form.eveningYield || 0),
      calfShare: Number(form.calfShare || 0),
      vendor: Number(form.vendor || 0),
      temple: Number(form.temple || 0),
      guests: Number(form.guests || 0),
      canteen: Number(form.canteen || 0),
      hostel: Number(form.hostel || 0),
    };

    setRows((prev) => [...prev, newRow]);
    setNextId((id) => id + 1);
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
                border: "1px solid #d1d5db",   // ✅ FIXED LINE
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
              <th style={thStyle}>Calf Share (L)</th>
              <th style={thStyle}>Vendor</th>
              <th style={thStyle}>Temple</th>
              <th style={thStyle}>Guests</th>
              <th style={thStyle}>Canteen</th>
              <th style={thStyle}>Hostel</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
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
                  key={row.id}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                  }}
                >
                  <td style={tdStyle}>{row.date}</td>
                  <td style={tdStyle}>{row.shed}</td>
                  <td style={tdStyle}>{row.morningYield}</td>
                  <td style={tdStyle}>{row.eveningYield}</td>
                  <td style={tdStyle}>{row.calfShare}</td>
                  <td style={tdStyle}>{row.vendor}</td>
                  <td style={tdStyle}>{row.temple}</td>
                  <td style={tdStyle}>{row.guests}</td>
                  <td style={tdStyle}>{row.canteen}</td>
                  <td style={tdStyle}>{row.hostel}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => openView(row)}
                      style={viewBtnStyle}
                      title="View details"
                    >
                      👁️ View
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
                Milk Yield Form
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
                label="Morning Milk (L)"
                name="morningYield"
                value={form.morningYield}
                onChange={handleFormChange}
              />

              <NumberField
                label="Evening Milk (L)"
                name="eveningYield"
                value={form.eveningYield}
                onChange={handleFormChange}
              />

              <NumberField
                label="Calf Share (L)"
                name="calfShare"
                value={form.calfShare}
                onChange={handleFormChange}
              />

              <Field label="Calf Nose Number">
                <input
                  type="text"
                  name="calfNoseNumber"
                  value={form.calfNoseNumber}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <NumberField
                label="Milk to Vendor (L)"
                name="vendor"
                value={form.vendor}
                onChange={handleFormChange}
              />

              <NumberField
                label="Milk to Temple (L)"
                name="temple"
                value={form.temple}
                onChange={handleFormChange}
              />

              <NumberField
                label="Milk to Guests (L)"
                name="guests"
                value={form.guests}
                onChange={handleFormChange}
              />

              <NumberField
                label="Milk to Canteen (L)"
                name="canteen"
                value={form.canteen}
                onChange={handleFormChange}
              />

              <NumberField
                label="Milk to Hostel (L)"
                name="hostel"
                value={form.hostel}
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
                  Milk Yield Details
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  }}
                >
                  {selectedEntry.date} – {selectedEntry.shed}
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
              <DetailItem label="Date" value={selectedEntry.date} />
              <DetailItem label="Shed" value={selectedEntry.shed} />
              <DetailItem
                label="Morning Milk (L)"
                value={selectedEntry.morningYield}
              />
              <DetailItem
                label="Evening Milk (L)"
                value={selectedEntry.eveningYield}
              />
              <DetailItem
                label="Calf Share (L)"
                value={selectedEntry.calfShare}
              />
              <DetailItem
                label="Calf Nose Number"
                value={selectedEntry.calfNoseNumber}
              />
              <DetailItem
                label="Milk to Vendor (L)"
                value={selectedEntry.vendor}
              />
              <DetailItem
                label="Milk to Temple (L)"
                value={selectedEntry.temple}
              />
              <DetailItem
                label="Milk to Guests (L)"
                value={selectedEntry.guests}
              />
              <DetailItem
                label="Milk to Canteen (L)"
                value={selectedEntry.canteen}
              />
              <DetailItem
                label="Milk to Hostel (L)"
                value={selectedEntry.hostel}
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
    calfShare: "",
    calfNoseNumber: "",
    vendor: "",
    temple: "",
    guests: "",
    canteen: "",
    hostel: "",
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
