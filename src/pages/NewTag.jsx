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
  const [loadError, setLoadError] = useState("");
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
  let isMounted = true;

  async function loadData() {
    setLoading(true);
    setLoadError("");

    try {
      const [cattleResponse, historyResponse] =
        await Promise.all([
          getCattle(),
          getAllTagHistory(),
        ]);

      let cattleRows = [];

      if (
        cattleResponse?.data &&
        Array.isArray(cattleResponse.data)
      ) {
        cattleRows = cattleResponse.data;
      } else if (
        Array.isArray(cattleResponse)
      ) {
        cattleRows = cattleResponse;
      }

      if (!isMounted) {
        return;
      }

      setCattleList(
        cattleRows.map(normalizeCattle)
      );

      if (
        historyResponse?.success &&
        Array.isArray(historyResponse.data)
      ) {
        setAllTagHistoryRows(
          historyResponse.data
        );
      } else if (
        Array.isArray(historyResponse)
      ) {
        setAllTagHistoryRows(
          historyResponse
        );
      } else {
        setAllTagHistoryRows([]);
      }
    } catch (error) {
      console.error(
        "Failed to load cattle/tag history:",
        error
      );

      if (isMounted) {
        setLoadError(
          error?.message ||
            "Unable to load cattle and tag history."
        );
        setCattleList([]);
        setAllTagHistoryRows([]);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }

  loadData();

  return () => {
    isMounted = false;
  };
}, []);

  // ---------------------------------------------------------------------------
  // ACTIVE CATTLE
  // ---------------------------------------------------------------------------

  const activeCattle = useMemo(() => {
    return cattleList.filter(
      (animal) =>
        String(animal.status || "")
          .trim()
          .toLowerCase() === "active"
    );
  }, [cattleList]);

  // ---------------------------------------------------------------------------
  // FILTER DROPDOWN OPTIONS
  // ---------------------------------------------------------------------------

  const filterOptions = useMemo(() => {
    return {
      categories: uniqueOptions(
        activeCattle,
        "category"
      ),

      genders: uniqueOptions(
        activeCattle,
        "gender"
      ),

      breeds: uniqueOptions(
        activeCattle,
        "breed"
      ),

      colors: uniqueOptions(
        activeCattle,
        "color"
      ),

      sheds: uniqueOptions(
        activeCattle,
        "shed"
      ),
    };
  }, [activeCattle]);

  // ---------------------------------------------------------------------------
  // FILTERED CATTLE
  // Includes matches against old tag numbers from tag history.
  // ---------------------------------------------------------------------------

  const filteredCattle = useMemo(() => {
    const historicalMatchedIds =
      new Set();

    const tagSearch = String(
      filters.tagNo || ""
    )
      .trim()
      .toLowerCase();

    if (tagSearch) {
      allTagHistoryRows.forEach(
        (historyRow) => {
          const oldTag = String(
            historyRow.old_tag_number || ""
          ).toLowerCase();

          const newTag = String(
            historyRow.new_tag_number || ""
          ).toLowerCase();

          if (
            oldTag.includes(tagSearch) ||
            newTag.includes(tagSearch)
          ) {
            historicalMatchedIds.add(
              String(
                historyRow.internal_id || ""
              ).trim()
            );
          }
        }
      );
    }

    return activeCattle.filter(
      (animal) => {
        const matchExact = (
          field,
          filterValue
        ) => {
          if (!filterValue) {
            return true;
          }

          return (
            String(animal[field] || "")
              .trim()
              .toLowerCase() ===
            String(filterValue)
              .trim()
              .toLowerCase()
          );
        };

        const matchContains = (
          field,
          filterValue
        ) => {
          if (!filterValue) {
            return true;
          }

          return String(
            animal[field] || ""
          )
            .toLowerCase()
            .includes(
              String(filterValue)
                .trim()
                .toLowerCase()
            );
        };

        const currentTagMatches =
          matchContains(
            "tagNo",
            filters.tagNo
          );

        const historicalTagMatches =
          historicalMatchedIds.has(
            String(
              animal.internalId || ""
            ).trim()
          );

        return (
          matchExact(
            "category",
            filters.category
          ) &&
          matchExact(
            "gender",
            filters.gender
          ) &&
          matchExact(
            "breed",
            filters.breed
          ) &&
          matchExact(
            "color",
            filters.color
          ) &&
          matchExact(
            "shed",
            filters.shed
          ) &&
          matchContains(
            "name",
            filters.name
          ) &&
          (
            currentTagMatches ||
            historicalTagMatches
          )
        );
      }
    );
  }, [
    activeCattle,
    filters,
    allTagHistoryRows,
  ]);

  // ---------------------------------------------------------------------------
  // SELECTED ACTIVE ANIMAL
  // ---------------------------------------------------------------------------

  const selectedAnimal = useMemo(() => {
    if (!selectedAnimalId) {
      return null;
    }

    return (
      activeCattle.find(
        (animal) =>
          String(animal.internalId) ===
          String(selectedAnimalId)
      ) || null
    );
  }, [
    selectedAnimalId,
    activeCattle,
  ]);

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

  function handleSubmit(event) {
  event.preventDefault();

  if (!selectedAnimal) {
    alert("Please select cattle first.");
    return;
  }

  const newTagNo = String(form.newTagNo || "").trim();
  const changedBy = String(form.changedBy || "").trim();

  if (!newTagNo) {
    alert("Please enter the new tag number.");
    return;
  }

  if (!form.changeDate) {
    alert("Please select the change date.");
    return;
  }

  if (!changedBy) {
    alert("Please enter Changed By name.");
    return;
  }

  if (
    String(selectedAnimal.tagNo || "").trim().toLowerCase() ===
    newTagNo.toLowerCase()
  ) {
    alert("The new tag number must be different from the current tag number.");
    return;
  }

  const duplicateAnimal = cattleList.find(
    (animal) =>
      String(animal.internalId) !==
        String(selectedAnimal.internalId) &&
      String(animal.tagNo || "").trim().toLowerCase() ===
        newTagNo.toLowerCase()
  );

  if (duplicateAnimal) {
    alert(
      `Tag number ${newTagNo} is already assigned to ${
        duplicateAnimal.name || duplicateAnimal.internalId
      }.`
    );
    return;
  }

  setPendingPayload({
    internalId: selectedAnimal.internalId,
    newTagNo,
    changeDate: form.changeDate,
    reason: String(form.reason || "").trim(),
    changedBy,
    remarks: String(form.remarks || "").trim(),
  });

  setShowConfirm(true);
}
async function confirmTagChange() {
  if (!pendingPayload || saving) {
    return;
  }

  const animalId = pendingPayload.internalId;
  const newTagNo = pendingPayload.newTagNo;

  setShowConfirm(false);
  setSaving(true);

  try {
    const response = await updateCattleTag(
      pendingPayload
    );

    if (!response?.success) {
      throw new Error(
        response?.error ||
          "The tag update was not completed."
      );
    }

    setCattleList((previousRows) =>
      previousRows.map((animal) =>
        String(animal.internalId) ===
        String(animalId)
          ? {
              ...animal,
              tagNo: newTagNo,
              raw: {
                ...animal.raw,
                tagNo: newTagNo,
                tag_number: newTagNo,
              },
            }
          : animal
      )
    );

    const [
      cattleHistoryResponse,
      allHistoryResponse,
    ] = await Promise.all([
      getTagHistoryByCattle(animalId),
      getAllTagHistory(),
    ]);

    if (
      cattleHistoryResponse?.success &&
      Array.isArray(
        cattleHistoryResponse.data
      )
    ) {
      setTagHistoryRows(
        sortHistoryLatestFirst(
          cattleHistoryResponse.data
        )
      );
    } else if (
      Array.isArray(cattleHistoryResponse)
    ) {
      setTagHistoryRows(
        sortHistoryLatestFirst(
          cattleHistoryResponse
        )
      );
    }

    if (
      allHistoryResponse?.success &&
      Array.isArray(allHistoryResponse.data)
    ) {
      setAllTagHistoryRows(
        allHistoryResponse.data
      );
    } else if (
      Array.isArray(allHistoryResponse)
    ) {
      setAllTagHistoryRows(
        allHistoryResponse
      );
    }

    resetForm();
    alert("Tag updated successfully.");
  } catch (error) {
    console.error(
      "Tag update failed:",
      error
    );

    alert(
      error?.message ||
        "Error updating the tag."
    );
  } finally {
    setSaving(false);
    setPendingPayload(null);
  }
}


  return (
    <div className="new-tag-page">
      <style>{`
  .new-tag-page {
    width: 100%;
    max-width: 1200px;
    min-width: 0;
    margin: 0 auto;
  }

  .tag-layout {
    min-width: 0;
    display: grid;
    grid-template-columns:
      minmax(320px, 360px)
      minmax(0, 1fr);
    align-items: start;
    gap: 1.5rem;
  }

  .tag-list-column {
    min-width: 0;
    height: calc(
      100dvh -
      var(--header-height) -
      7.5rem
    );
    min-height: 520px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .tag-list-column > div {
    min-height: 0;
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
  }

  .tag-filter-section {
    flex-shrink: 0;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .tag-filter-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
  }

  .tag-name-filter {
    margin-top: 0.6rem;
  }

  .tag-match-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  .tag-cattle-list {
    flex: 1;
    min-height: 180px;
    margin-top: 0.75rem;
    padding-right: 0.25rem;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }

  .tag-cattle-list::-webkit-scrollbar {
    width: 6px;
  }

  .tag-cattle-list::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(100, 116, 139, 0.45);
  }

  .tag-cattle-button {
    width: 100%;
    min-height: 74px;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-bottom: 0.5rem;
    padding: 0.65rem;
    border: 1px solid #f3f4f6;
    border-radius: 10px;
    background: #ffffff;
    text-align: left;
    cursor: pointer;
    transition:
      background-color 0.18s ease,
      border-color 0.18s ease;
  }

  .tag-cattle-button:hover {
    border-color: #fdba74;
    background: #fff7ed;
  }

  .tag-cattle-button.selected {
    border-color: #93c5fd;
    background: #eff6ff;
  }

  .tag-form-panel {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .tag-form-grid {
    min-width: 0;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .selected-cattle-card {
    min-width: 0;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .selected-cattle-info {
    min-width: 0;
    flex: 1;
  }

  .selected-cattle-details {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 0.5rem 1rem;
    margin-top: 0.75rem;
    font-size: 0.85rem;
  }

  .tag-history-table-wrap {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    -webkit-overflow-scrolling: touch;
  }

  .tag-history-table {
    width: 100%;
    min-width: 720px;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  @media (max-width: 1024px) {
    .tag-layout {
      grid-template-columns: minmax(0, 1fr);
    }

    .tag-list-column {
      height: auto;
      min-height: 0;
      overflow: visible;
    }

    .tag-list-column > div {
      overflow: visible;
    }

    .tag-cattle-list {
      flex: none;
      height: 320px;
      min-height: 240px;
      max-height: 360px;
    }

    .selected-cattle-details {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .tag-layout {
      gap: 1rem;
    }

    .tag-filter-grid,
    .tag-form-grid {
      grid-template-columns: minmax(0, 1fr);
    }

    .tag-cattle-list {
      height: 300px;
      min-height: 260px;
      max-height: 340px;
      padding-right: 0.15rem;
    }

    .selected-cattle-card {
      flex-direction: column;
    }

    .selected-cattle-photo {
      width: 100% !important;
      height: 180px !important;
    }

    .selected-cattle-details {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      width: 100%;
    }
  }

  @media (max-width: 380px) {
    .tag-cattle-list {
      height: 280px;
    }

    .selected-cattle-details {
      grid-template-columns:
        minmax(0, 1fr);
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
        <div className="tag-list-column">
  <SectionCard title="Find Cattle">
          <div className="tag-filter-section">
            

            <div className="tag-filter-grid">
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

            <div className="tag-name-filter">
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

            <div className="tag-match-summary">
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

          <div className="tag-cattle-list">
            {loading ? (
  <div
    style={{
      padding: "1rem",
      textAlign: "center",
      color: "#9ca3af",
    }}
  >
    Loading cattle...
  </div>
) : loadError ? (
  <div
    style={{
      padding: "1.25rem",
      textAlign: "center",
      color: "#b91c1c",
      fontSize: "0.85rem",
    }}
  >
    ⚠️ {loadError}
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
  onClick={() =>
    handleSelectAnimal(c.internalId)
  }
  className={
    isActive
      ? "tag-cattle-button selected"
      : "tag-cattle-button"
  }
  aria-pressed={isActive}
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
</div>

        <section className="tag-form-panel">
         <SectionCard>
  {selectedAnimal ? (
    <div className="selected-cattle-card">
      <div
  className="selected-cattle-photo"
  style={selectedPhotoBoxStyle}
>
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

      <div className="selected-cattle-info">
        <div style={selectedLabelStyle}>Selected Cattle</div>

        <div style={selectedTitleStyle}>
          {selectedAnimal.name || "Unnamed"}
        </div>

        <div style={selectedSubTextStyle}>
          Tag: <strong>{selectedAnimal.tagNo || "No Tag"}</strong> · Internal ID:{" "}
          <strong>{selectedAnimal.internalId || "-"}</strong>
        </div>

        <div className="selected-cattle-details">
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
    <div className="tag-form-grid">
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

    <div className="tag-form-grid">
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

    <div className="tag-form-grid">
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
    <div className="tag-history-table-wrap">
  <table className="tag-history-table">
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



const emptySelectedStyle = {
  padding: "1rem",
  textAlign: "center",
  color: "#94a3b8",
  fontStyle: "italic",
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