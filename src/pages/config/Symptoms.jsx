import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import PageHeader from "../../components/common/PageHeader";
import MetricCard from "../../components/common/MetricCard";
import SectionCard from "../../components/common/SectionCard";
import {
  fetchMaster,
  addMaster,
  updateMaster,
  deleteMaster,
} from "../../api/masterApi";

const EMPTY_FORM = {
  id: "",
  symptom_id: "",
  symptom_name: "",
  category: "",
  description: "",
  is_active: "Yes",
};

export default function Symptoms() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("All");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [showModal, setShowModal] =
    useState(false);
  const [mode, setMode] = useState("add");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [
    statusUpdatingId,
    setStatusUpdatingId,
  ] = useState("");

  const [
    pendingStatusChange,
    setPendingStatusChange,
  ] = useState(null);

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  function showToast(type, message) {
    setToast({
      show: true,
      type,
      message,
    });

    window.setTimeout(() => {
      setToast((previous) => ({
        ...previous,
        show: false,
      }));
    }, 3500);
  }

  async function loadData() {
    try {
      setLoading(true);

      const response =
        await fetchMaster("symptoms");

      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const normalizedRows = data
        .map((row) => ({
          id: String(
            row.id ||
              row.symptom_id ||
              ""
          )
            .trim()
            .toUpperCase(),

          symptom_id: String(
            row.symptom_id ||
              row.id ||
              ""
          )
            .trim()
            .toUpperCase(),

          symptom_name: String(
            row.symptom_name || ""
          ).trim(),

          category: String(
            row.category || ""
          ).trim(),

          description: String(
            row.description || ""
          ).trim(),

          is_active:
            String(row.is_active || "Yes")
              .trim()
              .toLowerCase() === "no"
              ? "No"
              : "Yes",
        }))
        .filter(
          (row) =>
            row.symptom_id ||
            row.symptom_name
        )
        .sort((a, b) => {
          const categoryCompare =
            a.category.localeCompare(
              b.category
            );

          if (categoryCompare !== 0) {
            return categoryCompare;
          }

          return a.symptom_name.localeCompare(
            b.symptom_name
          );
        });

      setRows(normalizedRows);
    } catch (error) {
      console.error(
        "Failed to load Diseases & Symptoms:",
        error
      );

      setRows([]);

      showToast(
        "error",
        error?.message ||
          "Unable to load Diseases & Symptoms."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const metrics = useMemo(() => {
    const active = rows.filter(
      (row) =>
        String(row.is_active)
          .trim()
          .toLowerCase() === "yes"
    ).length;

    return {
      total: rows.length,
      active,
      inactive: rows.length - active,
    };
  }, [rows]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set();

    rows.forEach((row) => {
      const category = String(
        row.category || ""
      ).trim();

      if (category) {
        uniqueCategories.add(category);
      }
    });

    const currentFormCategory = String(
      form.category || ""
    ).trim();

    if (currentFormCategory) {
      uniqueCategories.add(
        currentFormCategory
      );
    }

    return Array.from(
      uniqueCategories
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [rows, form.category]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = String(
      searchText || ""
    )
      .trim()
      .toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          row.symptom_id,
          row.symptom_name,
          row.category,
          row.description,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesCategory =
        categoryFilter === "All" ||
        row.category === categoryFilter;

      const rowStatus =
        row.is_active === "No"
          ? "Inactive"
          : "Active";

      const matchesStatus =
        statusFilter === "All" ||
        rowStatus === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    rows,
    searchText,
    categoryFilter,
    statusFilter,
  ]);

  function openAddModal() {
    setMode("add");
    setForm({
      ...EMPTY_FORM,
      is_active: "Yes",
    });
    setShowModal(true);
  }

  function openEditModal(row) {
    setMode("edit");

    setForm({
      id:
        row.id ||
        row.symptom_id ||
        "",
      symptom_id:
        row.symptom_id ||
        row.id ||
        "",
      symptom_name:
        row.symptom_name || "",
      category: row.category || "",
      description:
        row.description || "",
      is_active:
        row.is_active === "No"
          ? "No"
          : "Yes",
    });

    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setForm(EMPTY_FORM);
  }

  function handleChange(event) {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function clearFilters() {
    setSearchText("");
    setCategoryFilter("All");
    setStatusFilter("All");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const symptomName = String(
      form.symptom_name || ""
    )
      .trim()
      .replace(/\s+/g, " ");

    const category = String(
      form.category || ""
    )
      .trim()
      .replace(/\s+/g, " ");

    const description = String(
      form.description || ""
    ).trim();

    if (!symptomName) {
      showToast(
        "error",
        "Disease / Symptom Name is required."
      );
      return;
    }

    if (symptomName.length > 100) {
      showToast(
        "error",
        "Disease / Symptom Name cannot exceed 100 characters."
      );
      return;
    }

    if (!category) {
      showToast(
        "error",
        "Category is required."
      );
      return;
    }

    if (category.length > 50) {
      showToast(
        "error",
        "Category cannot exceed 50 characters."
      );
      return;
    }

    if (description.length > 500) {
      showToast(
        "error",
        "Description cannot exceed 500 characters."
      );
      return;
    }

    const payload = {
      id: String(
        form.id ||
          form.symptom_id ||
          ""
      )
        .trim()
        .toUpperCase(),

      symptom_id: String(
        form.symptom_id ||
          form.id ||
          ""
      )
        .trim()
        .toUpperCase(),

      symptom_name: symptomName,
      category,
      description,

      is_active:
        String(form.is_active || "Yes")
          .trim()
          .toLowerCase() === "no"
          ? "No"
          : "Yes",
    };

    try {
      setSaving(true);

      showToast(
        "info",
        mode === "add"
          ? "Please wait while the Disease / Symptom is saved..."
          : "Please wait while the Disease / Symptom is updated..."
      );

      const response =
        mode === "add"
          ? await addMaster(
              "symptoms",
              payload
            )
          : await updateMaster(
              "symptoms",
              payload.symptom_id,
              payload
            );

      if (response?.success === false) {
        throw new Error(
          response.error ||
            response.message ||
            "Unable to save Disease / Symptom."
        );
      }

      await loadData();

      setShowModal(false);
      setForm(EMPTY_FORM);

      showToast(
        "success",
        response?.message ||
          (mode === "add"
            ? "Disease / Symptom added successfully."
            : "Disease / Symptom updated successfully.")
      );
    } catch (error) {
      console.error(
        "Disease / Symptom save failed:",
        error
      );

      showToast(
        "error",
        error?.message ||
          "Unable to save Disease / Symptom."
      );
    } finally {
      setSaving(false);
    }
  }

  function requestStatusChange(row) {
    const isActive =
      row.is_active !== "No";

    setPendingStatusChange({
      row,
      newStatus: isActive
        ? "No"
        : "Yes",
    });
  }

  function closeStatusConfirmation() {
    if (statusUpdatingId) return;

    setPendingStatusChange(null);
  }

  async function confirmStatusChange() {
    if (!pendingStatusChange) {
      return;
    }

    const {
      row,
      newStatus,
    } = pendingStatusChange;

    const symptomId = String(
      row.symptom_id ||
        row.id ||
        ""
    )
      .trim()
      .toUpperCase();

    try {
      setStatusUpdatingId(symptomId);

      showToast(
        "info",
        newStatus === "No"
          ? "Please wait while the Disease / Symptom is deactivated..."
          : "Please wait while the Disease / Symptom is activated..."
      );

      let response;

      if (newStatus === "No") {
        /*
         * deleteSymptomsMaster is retained for backward
         * compatibility, but the backend now performs
         * soft deactivation instead of deleting the row.
         */
        response = await deleteMaster(
          "symptoms",
          symptomId
        );
      } else {
        response = await updateMaster(
          "symptoms",
          symptomId,
          {
            id: symptomId,
            symptom_id: symptomId,
            symptom_name:
              row.symptom_name,
            category: row.category,
            description:
              row.description || "",
            is_active: "Yes",
          }
        );
      }

      if (response?.success === false) {
        throw new Error(
          response.error ||
            response.message ||
            "Unable to change status."
        );
      }

      await loadData();

      setPendingStatusChange(null);

      showToast(
        "success",
        newStatus === "Yes"
          ? "Disease / Symptom activated successfully."
          : "Disease / Symptom deactivated successfully."
      );
    } catch (error) {
      console.error(
        "Disease / Symptom status update failed:",
        error
      );

      showToast(
        "error",
        error?.message ||
          "Unable to change Disease / Symptom status."
      );
    } finally {
      setStatusUpdatingId("");
    }
  }

  const hasActiveFilters =
    Boolean(searchText.trim()) ||
    categoryFilter !== "All" ||
    statusFilter !== "All";

  return (
    <div style={pageStyle}>
      <PageHeader
        title="Diseases & Symptoms Master"
        description="Manage diseases, symptoms and clinical conditions used in treatment records."
        countText={`${filteredRows.length} of ${rows.length} condition${
          rows.length === 1 ? "" : "s"
        }`}
        action={
          <button
            type="button"
            onClick={openAddModal}
            className="btn btn-primary"
            style={{
              whiteSpace: "nowrap",
            }}
          >
            + Add Condition
          </button>
        }
      />

      <div style={metricsWrapperStyle}>
        <MetricCard
          label="Total Conditions"
          value={metrics.total}
          color="#2563eb"
        />

        <MetricCard
          label="Active"
          value={metrics.active}
          color="#16a34a"
        />

        <MetricCard
          label="Inactive"
          value={metrics.inactive}
          color="#dc2626"
        />
      </div>

      <SectionCard title="Search & Filters">
        <div style={filtersGridStyle}>
          <div>
            <label style={fieldLabelStyle}>
              Search
            </label>

            <input
              type="text"
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
              className="form-input"
              placeholder="Search ID, name, category or description"
            />
          </div>

          <div>
            <label style={fieldLabelStyle}>
              Category
            </label>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              className="form-select"
            >
              <option value="All">
                All Categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label style={fieldLabelStyle}>
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="form-select"
            >
              <option value="All">
                All Statuses
              </option>
              <option value="Active">
                Active
              </option>
              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>

          <div style={clearButtonWrapperStyle}>
            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-secondary"
              disabled={!hasActiveFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Configuration Rules">
        <div style={informationGridStyle}>
          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Purpose
            </div>

            <div style={informationValueStyle}>
              Active conditions are available
              in new Clinical Records.
            </div>
          </div>

          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Historical Records
            </div>

            <div style={informationValueStyle}>
              Existing treatment records retain
              the saved condition name.
            </div>
          </div>

          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Deactivation Rule
            </div>

            <div style={informationValueStyle}>
              Conditions should be deactivated
              instead of permanently deleted.
            </div>
          </div>
        </div>
      </SectionCard>

      <div
        className="card"
        style={tableCardStyle}
      >
        <div style={tableScrollStyle}>
          <table style={tableStyle}>
            <thead style={tableHeadStyle}>
              <tr>
                <th style={thStyle}>
                  Condition ID
                </th>

                <th style={thStyle}>
                  Disease / Symptom
                </th>

                <th style={thStyle}>
                  Category
                </th>

                <th style={thStyle}>
                  Description
                </th>

                <th style={thStyle}>
                  Status
                </th>

                <th
                  style={{
                    ...thStyle,
                    textAlign: "center",
                  }}
                >
                  Actions / Status
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={emptyStateStyle}
                  >
                    Loading Diseases & Symptoms...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={emptyStateStyle}
                  >
                    No Diseases or Symptoms found.
                  </td>
                </tr>
              ) : (
                filteredRows.map(
                  (row, index) => {
                    const isActive =
                      row.is_active !== "No";

                    const isStatusUpdating =
                      statusUpdatingId ===
                      row.symptom_id;

                    return (
                      <tr
                        key={
                          row.symptom_id ||
                          row.id
                        }
                        style={{
                          borderBottom:
                            "1px solid #f1f5f9",
                          background:
                            index % 2 === 0
                              ? "#ffffff"
                              : "#f8fafc",
                          opacity: isActive
                            ? 1
                            : 0.72,
                        }}
                      >
                        <td style={tdStyle}>
                          <strong
                            style={{
                              color:
                                "#0f172a",
                            }}
                          >
                            {row.symptom_id ||
                              "-"}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          <strong>
                            {row.symptom_name ||
                              "-"}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          <CategoryBadge
                            value={
                              row.category
                            }
                          />
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={{
                              maxWidth:
                                "420px",
                            }}
                          >
                            {row.description ||
                              "-"}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <StatusBadge
                            value={
                              row.is_active
                            }
                          />
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            textAlign:
                              "center",
                          }}
                        >
                          <div
                            style={
                              actionButtonsStyle
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  row
                                )
                              }
                              style={
                                editButtonStyle
                              }
                              disabled={
                                saving ||
                                Boolean(
                                  statusUpdatingId
                                )
                              }
                            >
                              Edit
                            </button>

                            <label
                              style={{
                                ...switchStyle,
                                cursor:
                                  isStatusUpdating
                                    ? "not-allowed"
                                    : "pointer",
                              }}
                              title={
                                isActive
                                  ? "Deactivate condition"
                                  : "Activate condition"
                              }
                            >
                              <input
                                type="checkbox"
                                checked={
                                  isActive
                                }
                                disabled={
                                  saving ||
                                  Boolean(
                                    statusUpdatingId
                                  )
                                }
                                onChange={() =>
                                  requestStatusChange(
                                    row
                                  )
                                }
                                style={{
                                  display:
                                    "none",
                                }}
                              />

                              <span
                                style={{
                                  ...switchSliderStyle,
                                  ...(isActive
                                    ? switchOnStyle
                                    : switchOffStyle),
                                }}
                              >
                                <span
                                  style={{
                                    ...switchKnobStyle,
                                    transform:
                                      isActive
                                        ? "translateX(18px)"
                                        : "translateX(0px)",
                                  }}
                                />
                              </span>
                            </label>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div
          style={overlayStyle}
          onClick={closeModal}
        >
          <div
            style={modalStyle}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>
                  {mode === "add"
                    ? "Add Disease / Symptom"
                    : "Edit Disease / Symptom"}
                </h2>

                <p
                  style={
                    modalDescriptionStyle
                  }
                >
                  Create or update a clinical
                  condition used in treatment
                  records.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={closeButtonStyle}
                disabled={saving}
                aria-label="Close condition form"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gap: "1rem",
              }}
            >
              <SectionCard title="Condition Details">
                {mode === "edit" && (
                  <Field label="Condition ID">
                    <input
                      type="text"
                      value={
                        form.symptom_id
                      }
                      className="form-input"
                      disabled
                    />
                  </Field>
                )}

                <Field label="Disease / Symptom Name *">
                  <input
                    type="text"
                    name="symptom_name"
                    value={
                      form.symptom_name
                    }
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Example: Foot and Mouth Disease"
                    maxLength={100}
                    required
                    disabled={saving}
                    autoComplete="off"
                  />
                </Field>

                <Field label="Category *">
                  <input
                    type="text"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="form-input"
                    list="symptom-category-options"
                    placeholder="Example: Viral"
                    maxLength={50}
                    required
                    disabled={saving}
                    autoComplete="off"
                  />

                  <datalist id="symptom-category-options">
                    {categories.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        />
                      )
                    )}
                  </datalist>
                </Field>

                <Field label="Description">
                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={handleChange}
                    className="form-input"
                    rows={4}
                    placeholder="Describe the disease, symptom or clinical condition"
                    maxLength={500}
                    disabled={saving}
                    style={{
                      resize: "vertical",
                      minHeight:
                        "100px",
                    }}
                  />
                </Field>

                <Field label="Status *">
                  <select
                    name="is_active"
                    value={
                      form.is_active
                    }
                    onChange={handleChange}
                    className="form-select"
                    required
                    disabled={saving}
                  >
                    <option value="Yes">
                      Active
                    </option>
                    <option value="No">
                      Inactive
                    </option>
                  </select>
                </Field>
              </SectionCard>

              <div
                style={modalActionsStyle}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary btn-full-mobile"
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary btn-full-mobile"
                  disabled={
                    saving ||
                    !String(
                      form.symptom_name ||
                        ""
                    ).trim() ||
                    !String(
                      form.category || ""
                    ).trim()
                  }
                >
                  {saving
                    ? mode === "add"
                      ? "Saving..."
                      : "Updating..."
                    : mode === "add"
                      ? "Save Condition"
                      : "Update Condition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingStatusChange && (
        <div
          style={overlayStyle}
          onClick={
            closeStatusConfirmation
          }
        >
          <div
            style={confirmDialogStyle}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2 style={confirmTitleStyle}>
              {pendingStatusChange
                .newStatus === "No"
                ? "Deactivate Condition?"
                : "Activate Condition?"}
            </h2>

            <p style={confirmMessageStyle}>
              {pendingStatusChange
                .newStatus === "No"
                ? `This will prevent "${pendingStatusChange.row.symptom_name}" from being selected in new Clinical Records. Historical records will remain unchanged.`
                : `This will make "${pendingStatusChange.row.symptom_name}" available for new Clinical Records.`}
            </p>

            <div
              style={
                confirmActionsStyle
              }
            >
              <button
                type="button"
                onClick={
                  closeStatusConfirmation
                }
                className="btn btn-secondary"
                disabled={Boolean(
                  statusUpdatingId
                )}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  confirmStatusChange
                }
                className="btn btn-primary"
                disabled={Boolean(
                  statusUpdatingId
                )}
              >
                {statusUpdatingId
                  ? "Updating..."
                  : pendingStatusChange
                        .newStatus ===
                      "No"
                    ? "Deactivate"
                    : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div
          style={{
            ...toastStyle,
            ...(toast.type === "success"
              ? successToastStyle
              : toast.type === "error"
                ? errorToastStyle
                : infoToastStyle),
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div
      style={{
        marginBottom: "0.75rem",
      }}
    >
      <label style={fieldLabelStyle}>
        {label}
      </label>
      {children}
    </div>
  );
}

function StatusBadge({ value }) {
  const isActive =
    String(value || "")
      .trim()
      .toLowerCase() !== "no";

  return (
    <span
      style={{
        ...statusBadgeStyle,
        ...(isActive
          ? activeStatusStyle
          : inactiveStatusStyle),
      }}
    >
      {isActive
        ? "Active"
        : "Inactive"}
    </span>
  );
}

function CategoryBadge({ value }) {
  return (
    <span style={categoryBadgeStyle}>
      {value || "Uncategorized"}
    </span>
  );
}

const pageStyle = {
  padding: "1.5rem",
  maxWidth: "1200px",
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box",
};

const metricsWrapperStyle = {
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap",
  marginBottom: "1rem",
};

const filtersGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(240px, 2fr) repeat(2, minmax(180px, 1fr)) auto",
  gap: "1rem",
  alignItems: "end",
};

const clearButtonWrapperStyle = {
  display: "flex",
  alignItems: "flex-end",
};

const informationGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};

const informationItemStyle = {
  padding: "0.75rem",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  background: "#f8fafc",
};

const informationLabelStyle = {
  marginBottom: "0.3rem",
  fontSize: "0.72rem",
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
};

const informationValueStyle = {
  fontSize: "0.85rem",
  lineHeight: 1.45,
  color: "#334155",
  fontWeight: 600,
};

const tableCardStyle = {
  padding: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  minHeight: "360px",
  maxHeight: "calc(100vh - 500px)",
};

const tableScrollStyle = {
  flex: 1,
  overflowY: "auto",
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.9rem",
  minWidth: "1000px",
};

const tableHeadStyle = {
  background: "#f8fafc",
  borderBottom: "2px solid #e2e8f0",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const thStyle = {
  padding: "0.8rem 1rem",
  textAlign: "left",
  fontWeight: 700,
  fontSize: "0.72rem",
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

const tdStyle = {
  padding: "0.75rem 1rem",
  color: "#1f2937",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top",
};

const emptyStateStyle = {
  padding: "3rem",
  textAlign: "center",
  color: "#64748b",
};

const categoryBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.2rem 0.55rem",
  borderRadius: "999px",
  fontSize: "0.72rem",
  fontWeight: 700,
  color: "#334155",
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  whiteSpace: "nowrap",
};

const statusBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.22rem 0.55rem",
  borderRadius: "999px",
  fontSize: "0.72rem",
  fontWeight: 800,
};

const activeStatusStyle = {
  background: "#f0fdf4",
  border: "1px solid #86efac",
  color: "#15803d",
};

const inactiveStatusStyle = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#b91c1c",
};

const editButtonStyle = {
  padding: "0.35rem 0.75rem",
  borderRadius: "6px",
  border: "1px solid #bfdbfe",
  background: "#eff6ff",
  color: "#1d4ed8",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 700,
};

const actionButtonsStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "0.5rem",
  flexWrap: "wrap",
};

const switchStyle = {
  display: "inline-flex",
  alignItems: "center",
};

const switchSliderStyle = {
  position: "relative",
  width: "42px",
  height: "24px",
  borderRadius: "999px",
  transition: "0.25s",
};

const switchOnStyle = {
  background: "#16a34a",
};

const switchOffStyle = {
  background: "#cbd5e1",
};

const switchKnobStyle = {
  position: "absolute",
  top: "3px",
  left: "3px",
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  background: "#ffffff",
  transition: "0.25s",
  boxShadow:
    "0 2px 5px rgba(0,0,0,0.25)",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 100,
  padding: "1rem",
};

const modalStyle = {
  background: "#ffffff",
  borderRadius: "12px",
  width: "100%",
  maxWidth: "650px",
  maxHeight: "90vh",
  overflowY: "auto",
  padding: "1.25rem",
  boxShadow:
    "0 20px 40px rgba(15,23,42,0.2)",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "1rem",
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: "0.85rem",
  marginBottom: "1rem",
};

const modalTitleStyle = {
  margin: 0,
  fontSize: "1.3rem",
  color: "#0f172a",
};

const modalDescriptionStyle = {
  margin: "4px 0 0",
  fontSize: "0.85rem",
  color: "#64748b",
};

const closeButtonStyle = {
  border: "none",
  background: "transparent",
  fontSize: "1.5rem",
  color: "#64748b",
  cursor: "pointer",
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
};

const fieldLabelStyle = {
  display: "block",
  fontSize: "0.8rem",
  color: "#374151",
  marginBottom: "0.3rem",
  fontWeight: 600,
};

const confirmDialogStyle = {
  width: "100%",
  maxWidth: "480px",
  background: "#ffffff",
  borderRadius: "12px",
  padding: "1.5rem",
  boxShadow:
    "0 20px 40px rgba(15,23,42,0.25)",
};

const confirmTitleStyle = {
  margin: "0 0 0.75rem",
  fontSize: "1.2rem",
  color: "#0f172a",
};

const confirmMessageStyle = {
  margin: 0,
  color: "#475569",
  fontSize: "0.9rem",
  lineHeight: 1.55,
};

const confirmActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.75rem",
  marginTop: "1.5rem",
  flexWrap: "wrap",
};

const toastStyle = {
  position: "fixed",
  top: "1.25rem",
  right: "1.25rem",
  zIndex: 9999,
  maxWidth: "420px",
  padding: "0.85rem 1rem",
  borderRadius: "8px",
  boxShadow:
    "0 10px 30px rgba(15,23,42,0.18)",
  fontSize: "0.88rem",
  fontWeight: 700,
};

const successToastStyle = {
  background: "#f0fdf4",
  border: "1px solid #86efac",
  color: "#166534",
};

const errorToastStyle = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#b91c1c",
};

const infoToastStyle = {
  background: "#eff6ff",
  border: "1px solid #93c5fd",
  color: "#1d4ed8",
};