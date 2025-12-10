// src/pages/Feeding.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getFeeding, addFeeding, updateFeeding } from "../api/masterApi";

function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`; // e.g. 2025-10
}

// Format yyyy-MM-dd -> dd/MM/yyyy for display
function formatDisplayDate(isoDate) {
  if (!isoDate) return "";
  const parts = String(isoDate).split("T")[0].split("-");
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

function getEmptyForm() {
  return {
    date: "",
    nandini: "",
    surabhi: "",
    kaveri: "",
    kamadhenu: "",
    jayadeva: "",
    nandiniOld: "",
    totalKg: "",
    remarks: "",
  };
}

export default function Feeding() {
  const [month, setMonth] = useState(getCurrentYearMonth());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null); // ← track edit vs add

  // Load data from backend
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getFeeding();

        const normalised = (data || []).map((item, idx) => ({
          id: item.id || `${item.date || ""}#${idx}`,
          date: item.date || "",
          nandini: Number(item.nandini || 0),
          surabhi: Number(item.surabhi || 0),
          kaveri: Number(item.kaveri || 0),
          kamadhenu: Number(item.kamadhenu || 0),
          jayadeva: Number(item.jayadeva || 0),
          nandiniOld: Number(item.nandiniOld || 0),
          totalKg: Number(item.totalKg || 0),
          remarks: item.remarks || "",
          rowIndex: item.rowIndex || null, // sheet row index for updates
        }));

        setRows(normalised);
      } catch (err) {
        console.error("Failed to load feeding data", err);
        setError("Unable to load feeding data. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredRows = useMemo(
    () => rows.filter((r) => (r.date || "").startsWith(month)),
    [rows, month]
  );

  function openForm() {
    setEditingEntry(null); // new entry
    setForm({
      ...getEmptyForm(),
      date: month + "-01",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  function recalcTotal(updated) {
    const nandini = Number(updated.nandini || 0);
    const surabhi = Number(updated.surabhi || 0);
    const kaveri = Number(updated.kaveri || 0);
    const kamadhenu = Number(updated.kamadhenu || 0);
    const jayadeva = Number(updated.jayadeva || 0);
    const nandiniOld = Number(updated.nandiniOld || 0);

    return (
      nandini +
      surabhi +
      kaveri +
      kamadhenu +
      jayadeva +
      nandiniOld
    );
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      const numericFields = [
        "nandini",
        "surabhi",
        "kaveri",
        "kamadhenu",
        "jayadeva",
        "nandiniOld",
      ];
      if (numericFields.includes(name)) {
        updated.totalKg = recalcTotal(updated);
      }

      return updated;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      date: form.date,
      nandini: Number(form.nandini || 0),
      surabhi: Number(form.surabhi || 0),
      kaveri: Number(form.kaveri || 0),
      kamadhenu: Number(form.kamadhenu || 0),
      jayadeva: Number(form.jayadeva || 0),
      nandiniOld: Number(form.nandiniOld || 0),
      totalKg: Number(form.totalKg || 0),
      remarks: form.remarks || "",
    };

    try {
      if (editingEntry && editingEntry.rowIndex) {
        // ---- UPDATE EXISTING ROW ----
        const body = {
          ...payload,
          rowIndex: editingEntry.rowIndex,
        };
        await updateFeeding(body);

        const updatedRow = {
          ...editingEntry,
          ...payload,
        };

        setRows((prev) =>
          prev.map((r) =>
            r.rowIndex === editingEntry.rowIndex ? updatedRow : r
          )
        );
      } else {
        // ---- ADD NEW ROW ----
        const res = await addFeeding(payload);
        const newId = res.id || `${form.date}#${rows.length + 1}`;
        const rowIndex = res.rowIndex || null;

        const newRow = {
          id: newId,
          rowIndex,
          ...payload,
        };

        setRows((prev) => [...prev, newRow]);
      }

      setShowForm(false);
      setEditingEntry(null);
    } catch (err) {
      console.error("Error saving feeding entry", err);
      alert("Error saving feeding entry: " + err.message);
    }
  }

  function openView(entry) {
    setSelectedEntry(entry);
  }

  function closeView() {
    setSelectedEntry(null);
  }

  function openEdit(entry) {
    setEditingEntry(entry);
    setForm({
      date: entry.date || "",
      nandini: entry.nandini ?? "",
      surabhi: entry.surabhi ?? "",
      kaveri: entry.kaveri ?? "",
      kamadhenu: entry.kamadhenu ?? "",
      jayadeva: entry.jayadeva ?? "",
      nandiniOld: entry.nandiniOld ?? "",
      totalKg: entry.totalKg ?? recalcTotal(entry),
      remarks: entry.remarks || "",
    });
    setShowForm(true);
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
          Feeding
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

      {/* Error / Loading */}
      {error && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.5rem 0.75rem",
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
              <th style={thStyle}>Nandini Shed (kg)</th>
              <th style={thStyle}>Surabhi Shed (kg)</th>
              <th style={thStyle}>Kaveri Shed (kg)</th>
              <th style={thStyle}>Kamadhenu Shed (kg)</th>
              <th style={thStyle}>Jayadeva Shed (kg)</th>
              <th style={thStyle}>Nandini Old Shed (kg)</th>
              <th style={thStyle}>Total Feeding (kg)</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
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
                  colSpan={9}
                  style={{
                    padding: "0.9rem 1rem",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  No feeding entries for this month.
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
                  <td style={tdStyle}>{formatDisplayDate(row.date)}</td>
                  <td style={tdStyle}>{row.nandini}</td>
                  <td style={tdStyle}>{row.surabhi}</td>
                  <td style={tdStyle}>{row.kaveri}</td>
                  <td style={tdStyle}>{row.kamadhenu}</td>
                  <td style={tdStyle}>{row.jayadeva}</td>
                  <td style={tdStyle}>{row.nandiniOld}</td>
                  <td style={tdStyle}>{row.totalKg}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        gap: "0.4rem",
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
                        onClick={() => openEdit(row)}
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
                {editingEntry ? "Edit Feeding Entry" : "Feeding Form"}
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
                  form="feeding-form"
                  style={headerButtonPrimary}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Form body */}
            <form
              id="feeding-form"
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

              <NumberField
                label="Nandini Shed (kg)"
                name="nandini"
                value={form.nandini}
                onChange={handleFormChange}
              />

              <NumberField
                label="Surabhi Shed (kg)"
                name="surabhi"
                value={form.surabhi}
                onChange={handleFormChange}
              />

              <NumberField
                label="Kaveri Shed (kg)"
                name="kaveri"
                value={form.kaveri}
                onChange={handleFormChange}
              />

              <NumberField
                label="Kamadhenu Shed (kg)"
                name="kamadhenu"
                value={form.kamadhenu}
                onChange={handleFormChange}
              />

              <NumberField
                label="Jayadeva Shed (kg)"
                name="jayadeva"
                value={form.jayadeva}
                onChange={handleFormChange}
              />

              <NumberField
                label="Nandini Old Shed (kg)"
                name="nandiniOld"
                value={form.nandiniOld}
                onChange={handleFormChange}
              />

              <NumberField
                label="Total Feeding in Kgs (mixed with water)"
                name="totalKg"
                value={form.totalKg}
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
                  Feeding Details
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  }}
                >
                  {formatDisplayDate(selectedEntry.date)}
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
                label="Date"
                value={formatDisplayDate(selectedEntry.date)}
              />
              <DetailItem
                label="Nandini Shed (kg)"
                value={selectedEntry.nandini}
              />
              <DetailItem
                label="Surabhi Shed (kg)"
                value={selectedEntry.surabhi}
              />
              <DetailItem
                label="Kaveri Shed (kg)"
                value={selectedEntry.kaveri}
              />
              <DetailItem
                label="Kamadhenu Shed (kg)"
                value={selectedEntry.kamadhenu}
              />
              <DetailItem
                label="Jayadeva Shed (kg)"
                value={selectedEntry.jayadeva}
              />
              <DetailItem
                label="Nandini Old Shed (kg)"
                value={selectedEntry.nandiniOld}
              />
              <DetailItem
                label="Total Feeding (kg)"
                value={selectedEntry.totalKg}
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
  background: "#fef3c7",
  color: "#b45309",
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
