// src/pages/BioWaste.jsx
import React, { useMemo, useState } from "react";

function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// TEMP sample data – later we will load from backend / Google Sheet
const SAMPLE_BIOWASTE = [
  {
    id: 1,
    date: "2025-12-01",
    shed: "Surabhi Nivas",
    cowDungKg: 220,
    cowUrineL: 30,
    slurryTank: 3,
    othersType: "By product",
    unit: "Gunny bags",
    qty: 20,
    receiverUnit: "By product",
    remarks: "Regular collection",
  },
  {
    id: 2,
    date: "2025-12-02",
    shed: "Kamadhenu Nivas",
    cowDungKg: 240,
    cowUrineL: 28,
    slurryTank: 2,
    othersType: "By product",
    unit: "Gunny bags",
    qty: 18,
    receiverUnit: "By product",
    remarks: "",
  },
];

export default function BioWaste() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState(SAMPLE_BIOWASTE);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [nextId, setNextId] = useState(SAMPLE_BIOWASTE.length + 1);

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
      cowDungKg: Number(form.cowDungKg || 0),
      cowUrineL: Number(form.cowUrineL || 0),
      slurryTank: Number(form.slurryTank || 0),
      qty: Number(form.qty || 0),
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
          Bio Waste
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
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Shed</th>
              <th style={thStyle}>Gomaya (Kg)</th>
              <th style={thStyle}>Gomutra (L)</th>
              <th style={thStyle}>Slurry Tank</th>
              <th style={thStyle}>Qty</th>
              <th style={thStyle}>Unit</th>
              <th style={thStyle}>Receiver Unit</th>
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
                  No bio waste entries for this month.
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
                  <td style={tdStyle}>{row.cowDungKg}</td>
                  <td style={tdStyle}>{row.cowUrineL}</td>
                  <td style={tdStyle}>{row.slurryTank}</td>
                  <td style={tdStyle}>{row.qty}</td>
                  <td style={tdStyle}>{row.unit}</td>
                  <td style={tdStyle}>{row.receiverUnit}</td>
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
                Bio Waste Entry
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
                  form="bio-waste-form"
                  style={headerButtonPrimary}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Form body */}
            <form
              id="bio-waste-form"
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
                <input
                  type="text"
                  name="shed"
                  value={form.shed}
                  onChange={handleFormChange}
                  style={inputStyle}
                  placeholder="Enter shed / location"
                />
              </Field>

              <NumberField
                label="Gomaya (Cow Dung) in Kg"
                name="cowDungKg"
                value={form.cowDungKg}
                onChange={handleFormChange}
              />

              <NumberField
                label="Gomutra in Ltr"
                name="cowUrineL"
                value={form.cowUrineL}
                onChange={handleFormChange}
              />

              <NumberField
                label="Slurry Tank"
                name="slurryTank"
                value={form.slurryTank}
                onChange={handleFormChange}
              />

              <Field label="Others">
                <select
                  name="othersType"
                  value={form.othersType}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="">Select type</option>
                  <option value="By product">By product</option>
                  <option value="Manure">Manure</option>
                  <option value="Compost">Compost</option>
                </select>
              </Field>

              <Field label="Unit">
                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="">Select unit</option>
                  <option value="Gunny bags">Gunny bags</option>
                  <option value="Kg">Kg</option>
                  <option value="Ltr">Ltr</option>
                </select>
              </Field>

              <NumberField
                label="Quantity"
                name="qty"
                value={form.qty}
                onChange={handleFormChange}
              />

              <Field label="Receiver Unit">
                <select
                  name="receiverUnit"
                  value={form.receiverUnit}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="">Select receiver</option>
                  <option value="By product">By product</option>
                  <option value="External Vendor">External Vendor</option>
                  <option value="Internal Use">Internal Use</option>
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
                  Bio Waste Details
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
                label="Gomaya (Kg)"
                value={selectedEntry.cowDungKg}
              />
              <DetailItem
                label="Gomutra (L)"
                value={selectedEntry.cowUrineL}
              />
              <DetailItem
                label="Slurry Tank"
                value={selectedEntry.slurryTank}
              />
              <DetailItem
                label="Others"
                value={selectedEntry.othersType}
              />
              <DetailItem label="Unit" value={selectedEntry.unit} />
              <DetailItem label="Quantity" value={selectedEntry.qty} />
              <DetailItem
                label="Receiver Unit"
                value={selectedEntry.receiverUnit}
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
    date: "",
    shed: "",
    cowDungKg: "",
    cowUrineL: "",
    slurryTank: "",
    othersType: "",
    unit: "",
    qty: "",
    receiverUnit: "",
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
