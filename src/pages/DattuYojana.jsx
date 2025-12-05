// src/pages/DattuYojana.jsx
import React, { useMemo, useState } from "react";

function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`; // e.g. 2025-12
}

// TEMP sample data – later we will load from backend / Google Sheet
const SAMPLE_DATTU = [
  {
    id: 1,
    date: "2025-12-01",
    cattleId: "630668",
    donorName: "Sharma Family",
    address: "Bengaluru",
    phone: "9876543210",
    email: "sharma@example.com",
    scheme: "Punyakoti",
    paymentMode: "Online",
    receiptNo: "R-2025-001",
    birthDate: "2018-05-10",
    remarks: "Monthly contribution",
  },
  {
    id: 2,
    date: "2025-12-03",
    cattleId: "631491",
    donorName: "Ravi Kumar",
    address: "Mysuru",
    phone: "9876501234",
    email: "ravi@example.com",
    scheme: "Samrakshana",
    paymentMode: "Cash",
    receiptNo: "R-2025-002",
    birthDate: "2019-02-18",
    remarks: "",
  },
];

export default function DattuYojana() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState(SAMPLE_DATTU);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [nextId, setNextId] = useState(SAMPLE_DATTU.length + 1);

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
          Dattu Yojana
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
              <th style={thStyle}>Cattle ID</th>
              <th style={thStyle}>Donor Name</th>
              <th style={thStyle}>Scheme</th>
              <th style={thStyle}>Payment Mode</th>
              <th style={thStyle}>Receipt No.</th>
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
                  No Dattu Yojana entries for this month.
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
                  <td style={tdStyle}>{row.cattleId}</td>
                  <td style={tdStyle}>{row.donorName}</td>
                  <td style={tdStyle}>{row.scheme}</td>
                  <td style={tdStyle}>{row.paymentMode}</td>
                  <td style={tdStyle}>{row.receiptNo}</td>
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
                Dattu Yojana Form
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
                  form="dattu-yojana-form"
                  style={headerButtonPrimary}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Form body */}
            <form
              id="dattu-yojana-form"
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

              <Field label="Cattle ID">
                <input
                  type="text"
                  name="cattleId"
                  value={form.cattleId}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Donor Name *">
                <input
                  type="text"
                  name="donorName"
                  value={form.donorName}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Address">
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Phone Number">
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Scheme *">
                <select
                  name="scheme"
                  value={form.scheme}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="">Select Scheme</option>
                  <option value="Punyakoti">Punyakoti</option>
                  <option value="Samrakshana">Samrakshana</option>
                  <option value="Go Dana">Go Dana</option>
                  <option value="Shashwatha Dattu Sweekara">
                    Shashwatha Dattu Sweekara
                  </option>
                </select>
              </Field>

              <Field label="Payment Mode">
                <select
                  name="paymentMode"
                  value={form.paymentMode}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="">Select Mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                  <option value="Cheque">Cheque</option>
                  <option value="RTGS/NEFT">RTGS/NEFT</option>
                </select>
              </Field>

              <Field label="Receipt Number">
                <input
                  type="text"
                  name="receiptNo"
                  value={form.receiptNo}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Birth Date of Cattle">
                <input
                  type="date"
                  name="birthDate"
                  value={form.birthDate}
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

              {/* Photo upload will be handled in a later phase */}
              {/* <Field label="Photo">
                <input type="file" name="photo" />
              </Field> */}
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
                  Dattu Yojana Details
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  }}
                >
                  {selectedEntry.date} – {selectedEntry.donorName}
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
              <DetailItem label="Cattle ID" value={selectedEntry.cattleId} />
              <DetailItem label="Donor Name" value={selectedEntry.donorName} />
              <DetailItem label="Address" value={selectedEntry.address} />
              <DetailItem label="Phone" value={selectedEntry.phone} />
              <DetailItem label="Email" value={selectedEntry.email} />
              <DetailItem label="Scheme" value={selectedEntry.scheme} />
              <DetailItem
                label="Payment Mode"
                value={selectedEntry.paymentMode}
              />
              <DetailItem label="Receipt No." value={selectedEntry.receiptNo} />
              <DetailItem
                label="Birth Date"
                value={selectedEntry.birthDate}
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
    cattleId: "",
    donorName: "",
    address: "",
    phone: "",
    email: "",
    scheme: "",
    paymentMode: "",
    receiptNo: "",
    birthDate: "",
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
