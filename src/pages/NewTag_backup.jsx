// src/pages/NewTag.jsx
import React, { useMemo, useState } from "react";

// ---- TEMP SAMPLE DATA (to be replaced with Google Sheet data later) ----
const SAMPLE_CATTLE = [
  {
    animalId: "A001",
    tagNo: "632643",
    name: "Vasundara",
    breed: "Hallikar",
    shed: "Punyakoti",
    status: "Active",
  },
  {
    animalId: "A002",
    tagNo: "868135",
    name: "Shanthi",
    breed: "Mix",
    shed: "Kamadhenu",
    status: "Active",
  },
];

const SAMPLE_TAG_HISTORY = [
  {
    id: 1,
    animalId: "A001",
    tagNo: "632643",
    fromDate: "2023-06-01",
    toDate: "",
    reason: "Original tag",
  },
  {
    id: 2,
    animalId: "A002",
    tagNo: "700001",
    fromDate: "2022-01-01",
    toDate: "2024-03-15",
    reason: "Damaged",
  },
  {
    id: 3,
    animalId: "A002",
    tagNo: "868135",
    fromDate: "2024-03-16",
    toDate: "",
    reason: "Re-tag after damage",
  },
];

function getToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ----------------------------------------------------------------

export default function NewTag() {
  const [search, setSearch] = useState("");
  const [selectedAnimalId, setSelectedAnimalId] = useState(null);

  const [form, setForm] = useState({
    newTagNo: "",
    changeDate: getToday(),
    reason: "",
    remarks: "",
  });

  // Filter list based on search
  const filteredCattle = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SAMPLE_CATTLE;
    return SAMPLE_CATTLE.filter((c) => {
      return (
        c.tagNo.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.breed.toLowerCase().includes(q)
      );
    });
  }, [search]);

  const selectedAnimal = useMemo(
    () => SAMPLE_CATTLE.find((c) => c.animalId === selectedAnimalId) || null,
    [selectedAnimalId]
  );

  const tagHistory = useMemo(
    () => SAMPLE_TAG_HISTORY.filter((t) => t.animalId === selectedAnimalId),
    [selectedAnimalId]
  );

  function handleSelectAnimal(animalId) {
    setSelectedAnimalId(animalId);
    // reset form when changing animal
    setForm({
      newTagNo: "",
      changeDate: getToday(),
      reason: "",
      remarks: "",
    });
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedAnimal) {
      alert("Please select a cattle first.");
      return;
    }
    if (!form.newTagNo) {
      alert("Please enter the new tag number.");
      return;
    }
    if (!form.changeDate) {
      alert("Please select the change date.");
      return;
    }

    // For now just show a preview – later this will call Apps Script
    console.log("New tag request:", {
      animalId: selectedAnimal.animalId,
      currentTag: selectedAnimal.tagNo,
      ...form,
    });
    alert(
      `New tag saved (demo only)\n\nAnimal: ${selectedAnimal.name}\nOld Tag: ${selectedAnimal.tagNo}\nNew Tag: ${form.newTagNo}`
    );

    // reset but keep selected animal
    setForm({
      newTagNo: "",
      changeDate: getToday(),
      reason: "",
      remarks: "",
    });
  }

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.6rem",
              fontWeight: 700,
            }}
          >
            New Tag Number
          </h1>
          <p
            style={{
              margin: "0.25rem 0 0",
              fontSize: "0.9rem",
              color: "#6b7280",
            }}
          >
            Assign a new ear tag to an existing active cattle and maintain full
            history.
          </p>
        </div>
      </header>

      {/* LAYOUT: LEFT = list, RIGHT = details + form */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr)",
          gap: "1rem",
        }}
      >
        {/* LEFT PANEL – cattle list + search */}
        <section
          style={{
            background: "#ffffff",
            borderRadius: "0.75rem",
            boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
            padding: "0.75rem 0.75rem 0.5rem",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 180px)",
          }}
        >
          <div style={{ padding: "0 0.25rem 0.5rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                marginBottom: "0.2rem",
                color: "#6b7280",
              }}
            >
              Search Cattle (Tag / Name / Breed)
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g., 632643 or Vasundara"
              style={{
                width: "100%",
                padding: "0.45rem 0.6rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                fontSize: "0.9rem",
              }}
            />
          </div>

          <div
            style={{
              overflowY: "auto",
              marginTop: "0.25rem",
            }}
          >
            {filteredCattle.length === 0 ? (
              <div
                style={{
                  padding: "0.75rem",
                  fontSize: "0.85rem",
                  color: "#6b7280",
                }}
              >
                No cattle match your search.
              </div>
            ) : (
              filteredCattle.map((c) => {
                const isActive = c.animalId === selectedAnimalId;
                return (
                  <button
                    key={c.animalId}
                    type="button"
                    onClick={() => handleSelectAnimal(c.animalId)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      background: isActive ? "#eff6ff" : "transparent",
                      padding: "0.55rem 0.6rem",
                      borderRadius: "0.6rem",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {c.tagNo} • {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6b7280",
                        marginTop: "0.1rem",
                      }}
                    >
                      {c.breed} • {c.shed} • {c.status}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT PANEL – detail + form + history */}
        <section
          style={{
            display: "grid",
            gridTemplateRows: "auto auto 1fr",
            gap: "0.75rem",
          }}
        >
          {/* Selected cattle card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "0.75rem",
              boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
              padding: "0.75rem 0.9rem",
            }}
          >
            {selectedAnimal ? (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#6b7280",
                      marginBottom: "0.15rem",
                    }}
                  >
                    Selected Cattle
                  </div>
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    {selectedAnimal.name} – {selectedAnimal.tagNo}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#6b7280",
                      marginTop: "0.15rem",
                    }}
                  >
                    Breed: {selectedAnimal.breed} • Shed: {selectedAnimal.shed} •
                    Status: {selectedAnimal.status}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    textAlign: "right",
                  }}
                >
                  <div>Animal ID</div>
                  <div style={{ fontWeight: 600 }}>{selectedAnimal.animalId}</div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#6b7280",
                }}
              >
                Select a cattle from the left list to assign a new tag.
              </div>
            )}
          </div>

          {/* New Tag Form */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "0.75rem",
              boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
              padding: "0.9rem 1rem 1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 600,
                }}
              >
                New Tag Details
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "0.75rem 1rem",
                alignItems: "flex-start",
              }}
            >
              <Field label="Current Tag Number">
                <input
                  type="text"
                  value={selectedAnimal ? selectedAnimal.tagNo : ""}
                  readOnly
                  placeholder="Select cattle from left"
                  style={{ ...inputStyle, backgroundColor: "#f9fafb" }}
                />
              </Field>

              <Field label="New Tag Number *">
                <input
                  type="text"
                  name="newTagNo"
                  value={form.newTagNo}
                  onChange={handleFormChange}
                  placeholder="Enter new ear tag number"
                  style={inputStyle}
                />
              </Field>

              <Field label="Change Date *">
                <input
                  type="date"
                  name="changeDate"
                  value={form.changeDate}
                  onChange={handleFormChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Reason">
                <select
                  name="reason"
                  value={form.reason}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="">Select reason</option>
                  <option value="Lost tag">Lost tag</option>
                  <option value="Damaged tag">Damaged tag</option>
                  <option value="Govt re-tag">Govt re-tag</option>
                  <option value="Transfer / re-allocation">
                    Transfer / re-allocation
                  </option>
                  <option value="Other">Other</option>
                </select>
              </Field>

              <Field
                label="Remarks"
                fullWidth
              >
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleFormChange}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="Any additional information..."
                />
              </Field>

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      newTagNo: "",
                      changeDate: getToday(),
                      reason: "",
                      remarks: "",
                    })
                  }
                  style={secondaryButton}
                >
                  Reset
                </button>
                <button type="submit" style={primaryButton}>
                  Save New Tag
                </button>
              </div>
            </form>
          </div>

          {/* Tag history table */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "0.75rem",
              boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
              padding: "0.75rem 1rem",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                marginBottom: "0.5rem",
              }}
            >
              Tag History
            </div>

            {selectedAnimal && tagHistory.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.8rem",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      <th style={thStyle}>Tag No</th>
                      <th style={thStyle}>From Date</th>
                      <th style={thStyle}>To Date</th>
                      <th style={thStyle}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tagHistory.map((row) => (
                      <tr key={row.id}>
                        <td style={tdStyle}>{row.tagNo}</td>
                        <td style={tdStyle}>{row.fromDate}</td>
                        <td style={tdStyle}>{row.toDate || "Active"}</td>
                        <td style={tdStyle}>{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : selectedAnimal ? (
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                No tag history available for this cattle.
              </div>
            ) : (
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                Select a cattle to view its tag history.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// ----- Small UI helpers -----

function Field({ label, children, fullWidth }) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : "auto" }}>
      <label
        style={{
          display: "block",
          fontSize: "0.8rem",
          marginBottom: "0.2rem",
          color: "#374151",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "0.45rem 0.6rem",
  borderRadius: "0.5rem",
  border: "1px solid #d1d5db",
  fontSize: "0.9rem",
};

const thStyle = {
  padding: "0.4rem 0.5rem",
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
  fontSize: "0.75rem",
  color: "#6b7280",
};

const tdStyle = {
  padding: "0.4rem 0.5rem",
  borderBottom: "1px solid #e5e7eb",
};

const primaryButton = {
  padding: "0.45rem 0.9rem",
  borderRadius: "999px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: "0.85rem",
  cursor: "pointer",
};

const secondaryButton = {
  padding: "0.45rem 0.9rem",
  borderRadius: "999px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#374151",
  fontWeight: 500,
  fontSize: "0.85rem",
  cursor: "pointer",
};
