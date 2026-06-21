import React, { useMemo, useState, useEffect } from "react";
import {
  getCattle,
  updateCattleTag,
  getTagHistoryByCattle,
  getAllTagHistory,
} from "../api/masterApi";
import ConfirmDialog from "../components/common/ConfirmDialog";

function getToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDDMMYYYY(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
}

function getValue(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }
  return "";
}

function normalizeCattle(c) {
  return {
    raw: c,
    internalId: getValue(c, ["internalId", "internal_id"]),
    tagNo: getValue(c, ["tagNo", "tag_number"]),
    name: getValue(c, ["name", "cattle_name"]),
    gender: getValue(c, ["gender"]),
    category: getValue(c, ["category", "type", "cattleType"]),
    breed: getValue(c, ["breed"]),
    color: getValue(c, ["color", "colour"]),
    shed: getValue(c, ["shed", "shed_id", "location"]),
    status: getValue(c, ["status"]),
    photo: getValue(c, ["photo", "photo_url"]),
  };
}

function uniqueOptions(list, field) {
  return Array.from(
    new Set(list.map((item) => String(item[field] || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

function sortHistoryLatestFirst(rows) {
  return [...rows].sort((a, b) => {
    return new Date(b.change_date || 0) - new Date(a.change_date || 0);
  });
}

export default function NewTag() {
  const [selectedAnimalId, setSelectedAnimalId] = useState(null);
  const [cattleList, setCattleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
const [pendingPayload, setPendingPayload] = useState(null);

  const [tagHistoryRows, setTagHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [allTagHistoryRows, setAllTagHistoryRows] = useState([]);

  const [filters, setFilters] = useState({
    category: "",
    gender: "",
    breed: "",
    color: "",
    shed: "",
    name: "",
    tagNo: "",
  });

  const [form, setForm] = useState({
    newTagNo: "",
    changeDate: getToday(),
    reason: "",
    changedBy: "",
    remarks: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getCattle();

        let rows = [];
        if (res?.data && Array.isArray(res.data)) {
          rows = res.data;
        } else if (Array.isArray(res)) {
          rows = res;
        }

        setCattleList(rows.map(normalizeCattle));

        const historyRes = await getAllTagHistory();
        if (historyRes?.success && Array.isArray(historyRes.data)) {
          setAllTagHistoryRows(historyRes.data);
        }
      } catch (e) {
        console.error("Failed to load cattle/tag history", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const activeCattle = useMemo(() => {
    return cattleList.filter(
      (c) => String(c.status || "").toLowerCase().trim() === "active"
    );
  }, [cattleList]);

  const filterOptions = useMemo(() => {
    return {
      categories: uniqueOptions(activeCattle, "category"),
      genders: uniqueOptions(activeCattle, "gender"),
      breeds: uniqueOptions(activeCattle, "breed"),
      colors: uniqueOptions(activeCattle, "color"),
      sheds: uniqueOptions(activeCattle, "shed"),
    };
  }, [activeCattle]);

  const filteredCattle = useMemo(() => {
    const historicalMatchedIds = new Set();

    if (filters.tagNo) {
      const tagSearch = filters.tagNo.toLowerCase().trim();

      allTagHistoryRows.forEach((h) => {
        const oldTag = String(h.old_tag_number || "").toLowerCase();
        const newTag = String(h.new_tag_number || "").toLowerCase();

        if (oldTag.includes(tagSearch) || newTag.includes(tagSearch)) {
          historicalMatchedIds.add(String(h.internal_id || "").trim());
        }
      });
    }

    return activeCattle.filter((c) => {
      const matchExact = (field, value) => {
        if (!value) return true;
        return (
          String(c[field] || "").toLowerCase().trim() ===
          value.toLowerCase().trim()
        );
      };

      const matchContains = (field, value) => {
        if (!value) return true;
        return String(c[field] || "")
          .toLowerCase()
          .includes(value.toLowerCase().trim());
      };

      return (
        matchExact("category", filters.category) &&
        matchExact("gender", filters.gender) &&
        matchExact("breed", filters.breed) &&
        matchExact("color", filters.color) &&
        matchExact("shed", filters.shed) &&
        matchContains("name", filters.name) &&
        (matchContains("tagNo", filters.tagNo) ||
          historicalMatchedIds.has(String(c.internalId)))
      );
    });
  }, [activeCattle, filters, allTagHistoryRows]);

  const selectedAnimal = useMemo(() => {
    return (
      cattleList.find((c) => String(c.internalId) === String(selectedAnimalId)) ||
      null
    );
  }, [selectedAnimalId, cattleList]);

  useEffect(() => {
    async function loadTagHistory() {
      if (!selectedAnimal?.internalId) {
        setTagHistoryRows([]);
        return;
      }

      setHistoryLoading(true);

      try {
        const res = await getTagHistoryByCattle(selectedAnimal.internalId);

        if (res?.success && Array.isArray(res.data)) {
          setTagHistoryRows(sortHistoryLatestFirst(res.data));
        } else if (Array.isArray(res)) {
          setTagHistoryRows(sortHistoryLatestFirst(res));
        } else {
          setTagHistoryRows([]);
        }
      } catch (err) {
        console.error("Failed to load tag history", err);
        setTagHistoryRows([]);
      } finally {
        setHistoryLoading(false);
      }
    }

    loadTagHistory();
  }, [selectedAnimal?.internalId]);

  function resetForm() {
    setForm({
      newTagNo: "",
      changeDate: getToday(),
      reason: "",
      changedBy: "",
      remarks: "",
    });
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function clearFilters() {
    setFilters({
      category: "",
      gender: "",
      breed: "",
      color: "",
      shed: "",
      name: "",
      tagNo: "",
    });
  }

  function handleSelectAnimal(id) {
    setSelectedAnimalId(id);
    resetForm();
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedAnimal) return alert("Please select cattle first.");
    if (!form.newTagNo) return alert("Please enter the new tag number.");
    if (!form.changeDate) return alert("Please select the change date.");
    if (!form.changedBy) return alert("Please enter Changed By name.");

    setPendingPayload({
  internalId: selectedAnimal.internalId,
  newTagNo: form.newTagNo,
  changeDate: form.changeDate,
  reason: form.reason,
  changedBy: form.changedBy,
  remarks: form.remarks,
});

setShowConfirm(true);
return;

    setSaving(true);

    try {
      const payload = {
        internalId: selectedAnimal.internalId,
        newTagNo: form.newTagNo,
        changeDate: form.changeDate,
        reason: form.reason,
        changedBy: form.changedBy,
        remarks: form.remarks,
      };

      const res = await updateCattleTag(payload);

      if (res.success) {
        alert("Tag updated successfully!");

        setCattleList((prev) =>
          prev.map((c) =>
            String(c.internalId) === String(selectedAnimal.internalId)
              ? {
                  ...c,
                  tagNo: form.newTagNo,
                  raw: { ...c.raw, tag_number: form.newTagNo },
                }
              : c
          )
        );

        resetForm();

        const historyRes = await getTagHistoryByCattle(selectedAnimal.internalId);
        if (historyRes?.success && Array.isArray(historyRes.data)) {
          setTagHistoryRows(sortHistoryLatestFirst(historyRes.data));
        }

        const allHistoryRes = await getAllTagHistory();
        if (allHistoryRes?.success && Array.isArray(allHistoryRes.data)) {
          setAllTagHistoryRows(allHistoryRes.data);
        }
      } else {
        alert("Failed: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error updating tag.");
    } finally {
      setSaving(false);
    }
  }
async function confirmTagChange() {
  if (!pendingPayload) return;

  setShowConfirm(false);
  setSaving(true);

  try {
    const res = await updateCattleTag(pendingPayload);

    if (res.success) {
      alert("Tag updated successfully!");

      setCattleList((prev) =>
        prev.map((c) =>
          String(c.internalId) === String(selectedAnimal.internalId)
            ? {
                ...c,
                tagNo: pendingPayload.newTagNo,
                raw: {
                  ...c.raw,
                  tag_number: pendingPayload.newTagNo,
                },
              }
            : c
        )
      );

      resetForm();

      const historyRes = await getTagHistoryByCattle(
        selectedAnimal.internalId
      );

      if (historyRes?.success && Array.isArray(historyRes.data)) {
        setTagHistoryRows(sortHistoryLatestFirst(historyRes.data));
      }
    } else {
      alert("Failed: " + (res.error || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("Error updating tag.");
  } finally {
    setSaving(false);
    setPendingPayload(null);
  }
}


  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        .tag-layout {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 1.5rem;
          align-items: start;
        }
        .tag-list-panel {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          padding: 1rem;
          height: calc(100vh - 140px);
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
        }
        .tag-form-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .scrollable-list {
          flex: 1;
          overflow-y: auto;
          margin-top: 0.75rem;
          padding-right: 0.25rem;
        }
        .filter-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
        }
        .form-input,
        .form-select {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 0.6rem;
          font-size: 0.85rem;
          box-sizing: border-box;
          background: white;
        }
        .card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          padding: 1rem;
        }
        .section-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #ea580c;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid #fdba74;
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
        }
        .responsive-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }
        @media (max-width: 1024px) {
          .tag-layout {
            grid-template-columns: 1fr;
          }
          .tag-list-panel {
            height: auto;
            max-height: 520px;
          }
        }
        @media (max-width: 640px) {
          .filter-grid,
          .responsive-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700, color: "#111827" }}>
          Tag Management
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "#6b7280" }}>
          Identify cattle using details and assign a new ear tag.
        </p>
      </header>

      <div className="tag-layout">
        <section className="tag-list-panel">
          <div style={{ paddingBottom: "0.75rem", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>
              Find Cattle
            </div>

            <div className="filter-grid">
              <FilterField label="Breed">
                <select name="breed" value={filters.breed} onChange={handleFilterChange} className="form-select">
                  <option value="">All</option>
                  {filterOptions.breeds.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Gender">
                <select name="gender" value={filters.gender} onChange={handleFilterChange} className="form-select">
                  <option value="">All</option>
                  {filterOptions.genders.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Colour">
                <select name="color" value={filters.color} onChange={handleFilterChange} className="form-select">
                  <option value="">All</option>
                  {filterOptions.colors.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Category">
                <select name="category" value={filters.category} onChange={handleFilterChange} className="form-select">
                  <option value="">All</option>
                  {filterOptions.categories.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Shed">
                <select name="shed" value={filters.shed} onChange={handleFilterChange} className="form-select">
                  <option value="">All</option>
                  {filterOptions.sheds.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Tag Number">
                <input
                  type="text"
                  name="tagNo"
                  value={filters.tagNo}
                  onChange={handleFilterChange}
                  placeholder="Old/current tag"
                  className="form-input"
                />
              </FilterField>
            </div>

            <div style={{ marginTop: "0.6rem" }}>
              <FilterField label="Cattle Name">
                <input
                  type="text"
                  name="name"
                  value={filters.name}
                  onChange={handleFilterChange}
                  placeholder="Search by name..."
                  className="form-input"
                />
              </FilterField>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                Matches: <strong>{filteredCattle.length}</strong>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                style={{
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  borderRadius: "999px",
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  color: "#374151",
                }}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="scrollable-list">
            {loading ? (
              <div style={{ padding: "1rem", textAlign: "center", color: "#9ca3af" }}>
                Loading...
              </div>
            ) : filteredCattle.length === 0 ? (
              <div style={{ padding: "2rem", fontSize: "0.85rem", color: "#6b7280", textAlign: "center" }}>
                🔍 No matching active cattle found.
              </div>
            ) : (
              filteredCattle.map((c) => {
                const isActive = String(c.internalId) === String(selectedAnimalId);

                return (
                  <button
                    key={c.internalId}
                    type="button"
                    onClick={() => handleSelectAnimal(c.internalId)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "1px solid",
                      background: isActive ? "#eff6ff" : "#ffffff",
                      borderColor: isActive ? "#93c5fd" : "#f3f4f6",
                      padding: "0.65rem",
                      borderRadius: "10px",
                      cursor: "pointer",
                      marginBottom: "0.5rem",
                      display: "flex",
                      gap: "0.65rem",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "8px",
                        background: "#f3f4f6",
                        overflow: "hidden",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {c.photo ? (
                        <img src={c.photo} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "1.3rem" }}>🐄</span>
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: isActive ? "#1e40af" : "#111827" }}>
                        {c.name || "Unnamed"}
                      </div>

                      <div style={{ fontSize: "0.78rem", color: "#374151", marginTop: "2px" }}>
                        Tag: {c.tagNo || "No Tag"}
                      </div>

                      <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "2px" }}>
                        {c.breed || "-"} • {c.gender || "-"} • {c.category || "-"}
                      </div>

                      <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "2px" }}>
                        {c.color || "-"} • {c.shed || "-"}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="tag-form-panel">
          <div className="card">
            {selectedAnimal ? (
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div
                  style={{
                    width: "110px",
                    height: "85px",
                    background: "#f3f4f6",
                    borderRadius: "10px",
                    overflow: "hidden",
                    flexShrink: 0,
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selectedAnimal.photo ? (
                    <img src={selectedAnimal.photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={selectedAnimal.name} />
                  ) : (
                    <span style={{ fontSize: "2rem" }}>🐄</span>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", fontWeight: "bold" }}>
                    Selected Cattle
                  </div>

                  <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827" }}>
                    {selectedAnimal.name || "Unnamed"}{" "}
                    <span style={{ fontWeight: 400, color: "#6b7280" }}>
                      ({selectedAnimal.tagNo || "No Tag"})
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.35rem 1rem", marginTop: "0.5rem", fontSize: "0.8rem" }}>
                    <Detail label="Internal ID" value={selectedAnimal.internalId} />
                    <Detail label="Breed" value={selectedAnimal.breed} />
                    <Detail label="Gender" value={selectedAnimal.gender} />
                    <Detail label="Category" value={selectedAnimal.category} />
                    <Detail label="Colour" value={selectedAnimal.color} />
                    <Detail label="Shed" value={selectedAnimal.shed} />
                    <Detail label="Status" value={selectedAnimal.status} />
                    <Detail label="Tag Changes" value={tagHistoryRows.length} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "1rem", textAlign: "center", color: "#9ca3af", fontStyle: "italic" }}>
                👈 Use filters and select cattle from the list.
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="section-title" style={{ marginTop: 0 }}>
              Update Tag Details
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="responsive-grid" style={{ marginBottom: "1rem" }}>
                <Field label="Current Tag Number">
                  <input
                    type="text"
                    value={selectedAnimal ? selectedAnimal.tagNo : ""}
                    readOnly
                    className="form-input"
                    style={{ backgroundColor: "#f9fafb", color: "#6b7280" }}
                    placeholder="Auto-filled"
                  />
                </Field>

                <Field label="New Tag Number *">
                  <input
                    type="text"
                    name="newTagNo"
                    value={form.newTagNo}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="Enter new tag"
                    disabled={!selectedAnimal}
                  />
                </Field>
              </div>

              <div className="responsive-grid" style={{ marginBottom: "1rem" }}>
                <Field label="Change Date *">
                  <input
                    type="date"
                    name="changeDate"
                    value={form.changeDate}
                    onChange={handleFormChange}
                    className="form-input"
                    disabled={!selectedAnimal}
                  />
                </Field>

                <Field label="Reason">
                  <select
                    name="reason"
                    value={form.reason}
                    onChange={handleFormChange}
                    className="form-select"
                    disabled={!selectedAnimal}
                  >
                    <option value="">Select reason</option>
                    <option value="Lost tag">Lost tag</option>
                    <option value="Damaged tag">Damaged tag</option>
                    <option value="Govt re-tag">Govt re-tag</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
              </div>

              <div className="responsive-grid" style={{ marginBottom: "1rem" }}>
                <Field label="Changed By *">
                  <input
                    type="text"
                    name="changedBy"
                    value={form.changedBy}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="Enter staff name"
                    disabled={!selectedAnimal}
                  />
                </Field>
              </div>

              <Field label="Remarks">
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleFormChange}
                  rows={2}
                  className="form-input"
                  placeholder="Optional details..."
                  disabled={!selectedAnimal}
                />
              </Field>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button
                  type="submit"
                  disabled={saving || !selectedAnimal}
                  className="btn btn-primary"
                  style={{ minWidth: "140px" }}
                >
                  {saving ? "Saving..." : "Save New Tag"}
                </button>
              </div>
            </form>
          </div>

          <div className="card" style={{ overflow: "hidden", padding: 0 }}>
            <div style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", fontWeight: 600, color: "#374151" }}>
              Tag History Log
            </div>

            {historyLoading ? (
              <div style={{ padding: "2rem", textAlign: "center", fontSize: "0.85rem", color: "#9ca3af" }}>
                Loading tag history...
              </div>
            ) : selectedAnimal && tagHistoryRows.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Old Tag</th>
                      <th style={thStyle}>New Tag</th>
                      <th style={thStyle}>Reason</th>
                      <th style={thStyle}>Changed By</th>
                      <th style={thStyle}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tagHistoryRows.map((row, idx) => (
                      <tr key={row.history_id || idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={tdStyle}>{formatDateDDMMYYYY(row.change_date)}</td>
                        <td style={tdStyle}>{row.old_tag_number || "-"}</td>
                        <td style={tdStyle}>{row.new_tag_number || "-"}</td>
                        <td style={tdStyle}>{row.reason || "-"}</td>
                        <td style={tdStyle}>{row.changed_by || "-"}</td>
                        <td style={tdStyle}>{row.remarks || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", fontSize: "0.85rem", color: "#9ca3af" }}>
                {selectedAnimal ? "No previous tag history." : "Select cattle to view history."}
              </div>
            )}
          </div>
                </section>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Confirm Tag Change"
        message={
          selectedAnimal
            ? `Cattle: ${selectedAnimal.name}

Internal ID: ${selectedAnimal.internalId}

Old Tag: ${selectedAnimal.tagNo}

New Tag: ${pendingPayload?.newTagNo || ""}

Reason: ${pendingPayload?.reason || ""}

Changed By: ${pendingPayload?.changedBy || ""}

Proceed with tag update?`
            : ""
        }
        confirmText="Update Tag"
        cancelText="Cancel"
        onConfirm={confirmTagChange}
        onCancel={() => {
          setShowConfirm(false);
          setPendingPayload(null);
        }}
      />
    </div>
  );
}

    

const thStyle = {
  padding: "0.7rem 1rem",
  textAlign: "left",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#6b7280",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "0.75rem 1rem",
  color: "#374151",
  fontSize: "0.82rem",
  whiteSpace: "nowrap",
};

function FilterField({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.25rem" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#374151" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div style={{ color: "#6b7280", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ color: "#111827", fontWeight: 600 }}>
        {value || "-"}
      </div>
      
    </div>
  );
}