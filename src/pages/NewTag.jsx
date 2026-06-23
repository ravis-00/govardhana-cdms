import React, { useMemo, useState, useEffect } from "react";
import {
  getCattle,
  updateCattleTag,
  getTagHistoryByCattle,
  getAllTagHistory,
} from "../api/masterApi";
import ConfirmDialog from "../components/common/ConfirmDialog";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";
import FormActions from "../components/common/FormActions";
import StatusBadge from "../components/common/StatusBadge";

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

      <PageHeader
  title="🏷️ Tag Management"
  description="Identify cattle using filters and assign a new ear tag."
  countText={
    <>
      Matches: <strong>{filteredCattle.length}</strong> active cattle
    </>
  }
/>

      <div className="tag-layout">
        <SectionCard title="Find Cattle" style={tagListPanelStyle}>
          <div style={{ paddingBottom: "0.75rem", borderBottom: "1px solid #f3f4f6" }}>
            

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
        </SectionCard>

        <section className="tag-form-panel">
         <SectionCard>
  {selectedAnimal ? (
    <div style={selectedCardStyle}>
      <div style={selectedPhotoBoxStyle}>
        {selectedAnimal.photo ? (
          <img
            src={selectedAnimal.photo}
            style={selectedPhotoStyle}
            alt={selectedAnimal.name}
          />
        ) : (
          <span style={{ fontSize: "2rem" }}>🐄</span>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div style={selectedLabelStyle}>Selected Cattle</div>

        <div style={selectedTitleStyle}>
          {selectedAnimal.name || "Unnamed"}
        </div>

        <div style={selectedSubTextStyle}>
          Tag: <strong>{selectedAnimal.tagNo || "No Tag"}</strong> · Internal ID:{" "}
          <strong>{selectedAnimal.internalId || "-"}</strong>
        </div>

        <div style={selectedInfoGridStyle}>
          <Detail label="Breed" value={selectedAnimal.breed} />
          <Detail label="Gender" value={<GenderText gender={selectedAnimal.gender} />} />
          <Detail label="Category" value={selectedAnimal.category} />
          <Detail label="Shed" value={selectedAnimal.shed} />
          <Detail label="Colour" value={selectedAnimal.color} />
          
          <Detail label="Tag Changes" value={tagHistoryRows.length} />
        </div>
      </div>
    </div>
  ) : (
    <div style={emptySelectedStyle}>
      👈 Use filters and select cattle from the list.
    </div>
  )}
</SectionCard>

<SectionCard title="Update Tag Details">
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

    <FormActions
  submitText="Save New Tag"
  loading={saving}
/>
  </form>
</SectionCard>

<SectionCard title="Tag History Log">
  {historyLoading ? (
    <div style={historyEmptyStyle}>Loading tag history...</div>
  ) : selectedAnimal && tagHistoryRows.length > 0 ? (
    <div style={historyTableWrapStyle}>
      <table style={historyTableStyle}>
        <thead>
          <tr>
            <th style={historyThStyle}>Date</th>
            <th style={historyThStyle}>Old Tag</th>
            <th style={historyThStyle}>New Tag</th>
            <th style={historyThStyle}>Reason</th>
            <th style={historyThStyle}>Changed By</th>
            <th style={historyThStyle}>Remarks</th>
          </tr>
        </thead>

        <tbody>
          {tagHistoryRows.map((row, idx) => (
            <tr
              key={row.history_id || idx}
              style={{
                background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <td style={historyTdStyle}>{formatDateDDMMYYYY(row.change_date)}</td>
              <td style={historyTdStyle}>{row.old_tag_number || "-"}</td>
              <td style={{ ...historyTdStyle, fontWeight: 800, color: "#0f172a" }}>
                {row.new_tag_number || "-"}
              </td>
              <td style={historyTdStyle}>{row.reason || "-"}</td>
              <td style={historyTdStyle}>{row.changed_by || "-"}</td>
              <td style={{ ...historyTdStyle, whiteSpace: "normal" }}>
                {row.remarks || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div style={historyEmptyStyle}>
      {selectedAnimal ? "No previous tag history." : "Select cattle to view history."}
    </div>
  )}
</SectionCard>
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

    const selectedCardStyle = {
  display: "flex",
  gap: "1rem",
  alignItems: "flex-start",
};

const selectedPhotoBoxStyle = {
  width: "120px",
  height: "95px",
  background: "#f3f4f6",
  borderRadius: "12px",
  overflow: "hidden",
  flexShrink: 0,
  border: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const selectedPhotoStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const selectedLabelStyle = {
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#64748b",
  fontWeight: 800,
};

const selectedTitleStyle = {
  fontSize: "1.2rem",
  fontWeight: 800,
  color: "#0f172a",
  marginTop: "2px",
};

const selectedSubTextStyle = {
  fontSize: "0.85rem",
  color: "#475569",
  marginTop: "4px",
};

const selectedInfoGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "0.5rem 1rem",
  marginTop: "0.75rem",
  fontSize: "0.85rem",
};

const emptySelectedStyle = {
  padding: "1rem",
  textAlign: "center",
  color: "#94a3b8",
  fontStyle: "italic",
};

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

const tagListPanelStyle = {
  height: "calc(100vh - 140px)",
  display: "flex",
  flexDirection: "column",
};

const historyTableWrapStyle = {
  overflowX: "auto",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
};

const historyTableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.85rem",
};

const historyThStyle = {
  background: "#f8fafc",
  color: "#475569",
  fontSize: "0.72rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  padding: "0.75rem",
  borderBottom: "1px solid #e2e8f0",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const historyTdStyle = {
  padding: "0.75rem",
  color: "#334155",
  fontSize: "0.82rem",
  whiteSpace: "nowrap",
};

const historyEmptyStyle = {
  padding: "2rem",
  textAlign: "center",
  fontSize: "0.85rem",
  color: "#94a3b8",
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

function GenderText({ gender }) {
  const g = String(gender || "").toLowerCase();

  let color = "#0f172a";
  if (g.startsWith("f")) color = "#ec4899";
  if (g.startsWith("m")) color = "#2563eb";

  return (
    <span style={{ color, fontWeight: 800 }}>
      {gender || "-"}
    </span>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div
        style={{
          color: "#64748b",
          fontSize: "0.68rem",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 800,
          marginBottom: "2px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#0f172a",
          fontWeight: 700,
          fontSize: "0.86rem",
          lineHeight: 1.25,
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}