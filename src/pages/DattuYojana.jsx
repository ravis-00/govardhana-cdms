// src/pages/DattuYojana.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getDattuYojana,
  addDattuYojana,
  updateDattuYojana,
} from "../api/masterApi";

function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`; // e.g. 2025-12
}

/**
 * Convert a date string (dd/MM/yyyy or yyyy-MM-dd) to yyyy-MM for month filter.
 */
function extractYearMonth(dateStr) {
  if (!dateStr) return "";
  if (dateStr.includes("/")) {
    const [dd, mm, yyyy] = dateStr.split("/");
    if (!yyyy || !mm) return "";
    return `${yyyy}-${String(mm).padStart(2, "0")}`;
  }
  if (dateStr.includes("-")) {
    const [yyyy, mm] = dateStr.split("-");
    if (!yyyy || !mm) return "";
    return `${yyyy}-${String(mm).padStart(2, "0")}`;
  }
  return "";
}

/**
 * For <input type="date"> from display date.
 * Accepts dd/MM/yyyy or yyyy-MM-dd (returns yyyy-MM-dd).
 */
function toInputDate(dateStr) {
  if (!dateStr) return "";
  if (dateStr.includes("/")) {
    const [dd, mm, yyyy] = dateStr.split("/");
    return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(
      2,
      "0"
    )}`;
  }
  // assume already yyyy-MM-dd
  return dateStr;
}

/**
 * For table display from <input type="date"> value (yyyy-MM-dd)
 * -> dd/MM/yyyy
 */
function toDisplayDateFromInput(isoStr) {
  if (!isoStr) return "";
  const [yyyy, mm, dd] = isoStr.split("-");
  if (!yyyy || !mm || !dd) return isoStr;
  return `${dd}/${mm}/${yyyy}`;
}

/* ------------------------------------------------------------------ */

export default function DattuYojana() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [editingRow, setEditingRow] = useState(null);

  const [selectedEntry, setSelectedEntry] = useState(null);

  // --- Load data from backend once on mount ---
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await getDattuYojana();
        // data is expected as array of objects from Apps Script
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load Dattu Yojana data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredRows = useMemo(
    () => rows.filter((r) => extractYearMonth(r.date) === month),
    [rows, month]
  );

  function openAddForm() {
    setEditingRow(null);
    setForm({
      ...getEmptyForm(),
      date: month + "-01",
    });
    setShowForm(true);
  }

  function openEditForm(row) {
    setEditingRow(row);
    setForm({
      id: row.id || "",
      date: toInputDate(row.date),
      cattleId: row.cattleId || "",
      donorName: row.donorName || "",
      address: row.address || "",
      phone: row.phone || "",
      email: row.email || "",
      scheme: row.scheme || "",
      amount: row.amount || "",
      paymentMode: row.paymentMode || "",
      chequeNumber: row.chequeNumber || "",
      referenceNumber: row.referenceNumber || "",
      receiptNo: row.receiptNo || row.receiptNumber || "",
      schemeStatus: row.schemeStatus || "",
      expiryDate: row.expiryDate ? toInputDate(row.expiryDate) : "",
      remarks: row.remarks || "",
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

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      id: editingRow?.id || form.id || undefined,
      date: form.date, // yyyy-MM-dd
      cattleId: form.cattleId,
      donorName: form.donorName,
      address: form.address,
      phone: form.phone,
      email: form.email,
      scheme: form.scheme,
      amount: form.amount,
      paymentMode: form.paymentMode,
      chequeNumber: form.chequeNumber,
      referenceNumber: form.referenceNumber,
      receiptNumber: form.receiptNo,
      schemeStatus: form.schemeStatus,
      expiryDate: form.expiryDate,
      remarks: form.remarks,
    };

    try {
      setLoading(true);
      setError("");
      if (editingRow) {
        await updateDattuYojana(payload);
      } else {
        await addDattuYojana(payload);
      }

      // Reload list from backend so UI is in sync
      const data = await getDattuYojana();
      setRows(Array.isArray(data) ? data : []);
      setShowForm(false);
      setEditingRow(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save Dattu Yojana entry");
      // keep modal open so user doesn’t lose data
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

  const isEditMode = Boolean(editingRow);

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
            onClick={openAddForm}
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
              <th style={thStyle}>Donor Name</th>
              <th style={thStyle}>Scheme</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Payment Mode</th>
              <th style={thStyle}>Receipt No.</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: "0.9rem 1rem",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Loading...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
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
                  key={row.id || `${row.date}-${idx}`}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                  }}
                >
                  <td style={tdStyle}>{row.date}</td>
                  <td style={tdStyle}>{row.cattleId}</td>
                  <td style={tdStyle}>{row.donorName}</td>
                  <td style={tdStyle}>{row.scheme}</td>
                  <td style={tdStyle}>{row.amount}</td>
                  <td style={tdStyle}>{row.paymentMode}</td>
                  <td style={tdStyle}>{row.receiptNo || row.receiptNumber}</td>
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
                      style={{ ...viewBtnStyle, marginRight: "0.4rem" }}
                      title="View details"
                    >
                      👁️ View
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditForm(row)}
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
                {isEditMode ? "Edit Dattu Entry" : "Dattu Yojana Form"}
              </h2>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={closeForm}
                  style={headerButtonSecondary}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="dattu-yojana-form"
                  style={headerButtonPrimary}
                  disabled={loading}
                >
                  {isEditMode ? "Update" : "Save"}
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
                  required
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
                  required
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
                  required
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

              <Field label="Amount">
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleFormChange}
                  style={inputStyle}
                  step="0.01"
                />
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

              <Field label="Cheque Number">
                <input
                  type="text"
                  name="chequeNumber"
                  value={form.chequeNumber}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Reference Number">
                <input
                  type="text"
                  name="referenceNumber"
                  value={form.referenceNumber}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
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

              <Field label="Scheme Status">
                <input
                  type="text"
                  name="schemeStatus"
                  value={form.schemeStatus}
                  onChange={handleFormChange}
                  style={inputStyle}
                  placeholder="Active / Expired / Stopped..."
                />
              </Field>

              <Field label="Expiry Date">
                <input
                  type="date"
                  name="expiryDate"
                  value={form.expiryDate}
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

              {/* Picture columns will be handled later */}
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
              <DetailItem label="Amount" value={selectedEntry.amount} />
              <DetailItem
                label="Payment Mode"
                value={selectedEntry.paymentMode}
              />
              <DetailItem
                label="Receipt No."
                value={selectedEntry.receiptNo || selectedEntry.receiptNumber}
              />
              <DetailItem
                label="Cheque Number"
                value={selectedEntry.chequeNumber}
              />
              <DetailItem
                label="Reference Number"
                value={selectedEntry.referenceNumber}
              />
              <DetailItem
                label="Scheme Status"
                value={selectedEntry.schemeStatus}
              />
              <DetailItem label="Expiry Date" value={selectedEntry.expiryDate} />
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
    date: "",
    cattleId: "",
    donorName: "",
    address: "",
    phone: "",
    email: "",
    scheme: "",
    amount: "",
    paymentMode: "",
    chequeNumber: "",
    referenceNumber: "",
    receiptNo: "",
    schemeStatus: "",
    expiryDate: "",
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
