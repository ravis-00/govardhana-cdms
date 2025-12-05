// src/pages/Deregister.jsx
import React, { useMemo, useState } from "react";

// TEMP sample data – later replace with real API data
const SAMPLE_CATTLE = [
  {
    id: 1,
    cattleId: "630668",
    name: "Ganga",
    breed: "Hallikar",
    gender: "Female",
    location: "Jayadeva",
    status: "Active",
  },
  {
    id: 2,
    cattleId: "680284",
    name: "Gauri",
    breed: "Hallikar",
    gender: "Female",
    location: "Jayadeva",
    status: "Active",
  },
  {
    id: 3,
    cattleId: "632723",
    name: "Mamatha",
    breed: "Hallikar",
    gender: "Female",
    location: "Kamadhenu",
    status: "Inactive", // will not show in active list
  },
];

export default function Deregister() {
  const [cattle, setCattle] = useState(SAMPLE_CATTLE);
  const [selected, setSelected] = useState(null); // cattle selected for deregister
  const [form, setForm] = useState(getEmptyForm());
  const [showForm, setShowForm] = useState(false);

  const activeCattle = useMemo(
    () => cattle.filter((c) => c.status === "Active"),
    [cattle]
  );

  function openForm(row) {
    setSelected(row);
    setForm({
      ...getEmptyForm(),
      cattleId: row.cattleId,
      name: row.name,
      breed: row.breed,
      gender: row.gender,
      location: row.location,
      currentStatus: row.status,
      deregisterDate: new Date().toISOString().slice(0, 10),
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setSelected(null);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!selected) return;

    // Update cattle status to Inactive and attach deregister info
    setCattle((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              status: "Inactive",
              deregisterType: form.deregisterType,
              deregisterDate: form.deregisterDate,
              remarks: form.remarks,
            }
          : c
      )
    );

    closeForm();
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
          Deregister Cattle
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: "#6b7280",
          }}
        >
          Showing only <strong>Active</strong> cattle. Deregistering will mark
          them as <strong>Inactive</strong>.
        </p>
      </header>

      {/* Active cattle table */}
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
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {activeCattle.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "0.9rem 1rem",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  No active cattle available for deregistration.
                </td>
              </tr>
            ) : (
              activeCattle.map((row, idx) => (
                <tr
                  key={row.id}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                  }}
                >
                  <td style={tdStyle}>{row.cattleId}</td>
                  <td style={tdStyle}>{row.name}</td>
                  <td style={tdStyle}>{row.breed}</td>
                  <td style={tdStyle}>{row.gender}</td>
                  <td style={tdStyle}>{row.location}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "0.1rem 0.55rem",
                        borderRadius: "999px",
                        background: "#dcfce7",
                        color: "#166534",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => openForm(row)}
                      style={deregisterBtnStyle}
                      title="Deregister cattle"
                    >
                      🚫 Deregister
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Deregister form modal */}
      {showForm && selected && (
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
                Deregister Cattle
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
                  form="deregister-form"
                  style={headerButtonPrimary}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Form body */}
            <form
              id="deregister-form"
              onSubmit={handleSubmit}
              style={{ display: "grid", gap: "0.85rem" }}
            >
              <Field label="Cattle ID">
                <input
                  type="text"
                  name="cattleId"
                  value={form.cattleId}
                  readOnly
                  style={{ ...inputStyle, background: "#f9fafb" }}
                />
              </Field>

              <Field label="Cattle Name">
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  readOnly
                  style={{ ...inputStyle, background: "#f9fafb" }}
                />
              </Field>

              <Field label="Breed">
                <input
                  type="text"
                  name="breed"
                  value={form.breed}
                  readOnly
                  style={{ ...inputStyle, background: "#f9fafb" }}
                />
              </Field>

              <Field label="Gender">
                <input
                  type="text"
                  name="gender"
                  value={form.gender}
                  readOnly
                  style={{ ...inputStyle, background: "#f9fafb" }}
                />
              </Field>

              <Field label="Location / Shed">
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  readOnly
                  style={{ ...inputStyle, background: "#f9fafb" }}
                />
              </Field>

              <Field label="Current Status">
                <input
                  type="text"
                  name="currentStatus"
                  value={form.currentStatus}
                  readOnly
                  style={{ ...inputStyle, background: "#f9fafb" }}
                />
              </Field>

              <Field label="Type of De-admission *">
                <select
                  name="deregisterType"
                  value={form.deregisterType}
                  onChange={handleFormChange}
                  style={inputStyle}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Death">Death</option>
                  <option value="Sale">Sale</option>
                  <option value="Donation">Donation</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Missing">Missing</option>
                  <option value="Other">Other</option>
                </select>
              </Field>

              <Field label="Deregister Date *">
                <input
                  type="date"
                  name="deregisterDate"
                  value={form.deregisterDate}
                  onChange={handleFormChange}
                  style={inputStyle}
                  required
                />
              </Field>

              <Field label="Remarks / Details">
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleFormChange}
                  style={{
                    ...inputStyle,
                    minHeight: "80px",
                    resize: "vertical",
                  }}
                />
              </Field>

              <Field label="New Status after Deregister">
                <input
                  type="text"
                  value="Inactive"
                  readOnly
                  style={{ ...inputStyle, background: "#f9fafb" }}
                />
              </Field>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* helpers & styles */

function getEmptyForm() {
  return {
    cattleId: "",
    name: "",
    breed: "",
    gender: "",
    location: "",
    currentStatus: "",
    deregisterType: "",
    deregisterDate: "",
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

const deregisterBtnStyle = {
  border: "none",
  borderRadius: "999px",
  padding: "0.25rem 0.9rem",
  background: "#fee2e2",
  color: "#b91c1c",
  fontSize: "0.8rem",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25rem",
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
