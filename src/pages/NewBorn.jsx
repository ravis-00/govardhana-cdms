// src/pages/NewBorn.jsx
import React, { useMemo, useState } from "react";

function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`; // e.g. 2025-12
}

// TEMP sample data – later load from backend / sheet
const SAMPLE_NEWBORN = [
  {
    id: 1,
    birthDate: "2025-12-01",
    cattleId: "630668",
    calfId: "NB-2025-001",
    calfName: "Ganga Calf",
    shed: "Punyakoti",
    gender: "Female",
    colour: "White",
    breed: "Hallikar",
    birthType: "Single",
    deliveryType: "Normal",
    healthyAtBirth: "Yes",
    remarks: "Active and feeding well",
  },
  {
    id: 2,
    birthDate: "2025-12-03",
    cattleId: "631491",
    calfId: "NB-2025-002",
    calfName: "Shiva Calf",
    shed: "Samrakshana",
    gender: "Male",
    colour: "Brown",
    breed: "Gir",
    birthType: "Single",
    deliveryType: "Assisted",
    healthyAtBirth: "Yes",
    remarks: "",
  },
];

export default function NewBorn() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState(SAMPLE_NEWBORN);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [nextId, setNextId] = useState(SAMPLE_NEWBORN.length + 1);

  const [selectedEntry, setSelectedEntry] = useState(null);

  const filteredRows = useMemo(
    () => rows.filter((r) => r.birthDate.startsWith(month)),
    [rows, month]
  );

  function openForm() {
    setForm({
      ...getEmptyForm(),
      birthDate: month + "-01",
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
          New Born
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
              <th style={thStyle}>Birth Date</th>
              <th style={thStyle}>Mother Cattle ID</th>
              <th style={thStyle}>Calf ID</th>
              <th style={thStyle}>Calf Name</th>
              <th style={thStyle}>Shed</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Breed</th>
              <th style={thStyle}>Healthy at Birth</th>
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
                  No new born entries for this month.
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
                  <td style={tdStyle}>{row.birthDate}</td>
                  <td style={tdStyle}>{row.cattleId}</td>
                  <td style={tdStyle}>{row.calfId}</td>
                  <td style={tdStyle}>{row.calfName}</td>
                  <td style={tdStyle}>{row.shed}</td>
                  <td style={tdStyle}>{row.gender}</td>
                  <td style={tdStyle}>{row.breed}</td>
                  <td style={tdStyle}>{row.healthyAtBirth}</td>
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
                New Born Form
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
                  form="new-born-form"
                  style={headerButtonPrimary}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Form body */}
            <form
              id="new-born-form"
              onSubmit={handleSubmit}
              style={{ display: "grid", gap: "0.85rem" }}
            >
              <Field label="Birth Date *">
                <input
                  type="date"
                  name="birthDate"
                  value={form.birthDate}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Mother Cattle ID *">
                <input
                  type="text"
                  name="cattleId"
                  value={form.cattleId}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Calf ID *">
                <input
                  type="text"
                  name="calfId"
                  value={form.calfId}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Calf Name">
                <input
                  type="text"
                  name="calfName"
                  value={form.calfName}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Shed">
                <select
                  name="shed"
                  value={form.shed}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="">Select Shed</option>
                  <option value="Punyakoti">Punyakoti</option>
                  <option value="Samrakshana">Samrakshana</option>
                  <option value="Kaveri">Kaveri</option>
                  <option value="Nandini">Nandini</option>
                  <option value="Others">Others</option>
                </select>
              </Field>

              <Field label="Gender">
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </Field>

              <Field label="Colour">
                <input
                  type="text"
                  name="colour"
                  value={form.colour}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Breed">
                <select
                  name="breed"
                  value={form.breed}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="">Select Breed</option>
                  <option value="Hallikar">Hallikar</option>
                  <option value="Bargur">Bargur</option>
                  <option value="Deoni">Deoni</option>
                  <option value="Ongole">Ongole</option>
                  <option value="Malenadu Gidda">Malenadu Gidda</option>
                  <option value="Rati">Rati</option>
                  <option value="Kankrej">Kankrej</option>
                  <option value="Gir">Gir</option>
                  <option value="Krishna Valley">Krishna Valley</option>
                  <option value="Sahiwal">Sahiwal</option>
                  <option value="Punganur">Punganur</option>
                  <option value="Mix">Mix</option>
                </select>
              </Field>

              <Field label="Birth Type">
                <select
                  name="birthType"
                  value={form.birthType}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="">Select Birth Type</option>
                  <option value="Single">Single</option>
                  <option value="Twins">Twins</option>
                  <option value="Triplets">Triplets</option>
                </select>
              </Field>

              <Field label="Delivery Type">
                <select
                  name="deliveryType"
                  value={form.deliveryType}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="">Select Delivery Type</option>
                  <option value="Normal">Normal</option>
                  <option value="Assisted">Assisted</option>
                  <option value="Caesarean">Caesarean</option>
                </select>
              </Field>

              <Field label="Healthy at Birth?">
                <select
                  name="healthyAtBirth"
                  value={form.healthyAtBirth}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
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
                  New Born Details
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  }}
                >
                  {selectedEntry.birthDate} – {selectedEntry.calfId}
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
              <DetailItem label="Birth Date" value={selectedEntry.birthDate} />
              <DetailItem
                label="Mother Cattle ID"
                value={selectedEntry.cattleId}
              />
              <DetailItem label="Calf ID" value={selectedEntry.calfId} />
              <DetailItem label="Calf Name" value={selectedEntry.calfName} />
              <DetailItem label="Shed" value={selectedEntry.shed} />
              <DetailItem label="Gender" value={selectedEntry.gender} />
              <DetailItem label="Colour" value={selectedEntry.colour} />
              <DetailItem label="Breed" value={selectedEntry.breed} />
              <DetailItem label="Birth Type" value={selectedEntry.birthType} />
              <DetailItem
                label="Delivery Type"
                value={selectedEntry.deliveryType}
              />
              <DetailItem
                label="Healthy at Birth"
                value={selectedEntry.healthyAtBirth}
              />
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
    birthDate: "",
    cattleId: "",
    calfId: "",
    calfName: "",
    shed: "",
    gender: "",
    colour: "",
    breed: "",
    birthType: "",
    deliveryType: "",
    healthyAtBirth: "",
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
