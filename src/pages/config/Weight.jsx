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
  weight_standard_id: "",
  breed: "",
  age_1: "",
  age_2: "",
  age_3: "",
  age_4: "",
  age_5_plus: "",
  is_active: "Yes",
};

const RANGE_FIELDS = [
  {
    name: "age_1",
    label: "1 Year Reference Range (kg)",
  },
  {
    name: "age_2",
    label: "2 Years Reference Range (kg)",
  },
  {
    name: "age_3",
    label: "3 Years Reference Range (kg)",
  },
  {
    name: "age_4",
    label: "4 Years Reference Range (kg)",
  },
  {
    name: "age_5_plus",
    label: "5+ Years Reference Range (kg)",
  },
];

export default function Weight() {
  const [rows, setRows] = useState([]);
  const [breedRows, setBreedRows] = useState([]);

  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
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

      const [
        weightResponse,
        breedResponse,
      ] = await Promise.all([
        fetchMaster("weight"),
        fetchMaster("breeds"),
      ]);

      const weightData = Array.isArray(
        weightResponse
      )
        ? weightResponse
        : Array.isArray(weightResponse?.data)
          ? weightResponse.data
          : [];

      const breedsData = Array.isArray(
        breedResponse
      )
        ? breedResponse
        : Array.isArray(breedResponse?.data)
          ? breedResponse.data
          : [];

      const normalizedWeightRows =
        weightData
          .map((row) => {
            const standardId = String(
              row.weight_standard_id ||
                row.id ||
                ""
            )
              .trim()
              .toUpperCase();

            return {
              id: standardId,
              weight_standard_id:
                standardId,

              breed: String(
                row.breed || ""
              ).trim(),

              age_1: normalizeRangeText(
                row.age_1
              ),

              age_2: normalizeRangeText(
                row.age_2
              ),

              age_3: normalizeRangeText(
                row.age_3
              ),

              age_4: normalizeRangeText(
                row.age_4
              ),

              age_5_plus:
                normalizeRangeText(
                  row.age_5_plus ||
                    row["age_>5"]
                ),

              is_active:
                String(
                  row.is_active || "Yes"
                )
                  .trim()
                  .toLowerCase() === "no"
                  ? "No"
                  : "Yes",
            };
          })
          .filter(
            (row) =>
              row.weight_standard_id ||
              row.breed
          )
          .sort((a, b) =>
            a.breed.localeCompare(
              b.breed
            )
          );

      const normalizedBreedRows =
        breedsData
          .map((row) => ({
            breed_id: String(
              row.breed_id ||
                row.id ||
                ""
            )
              .trim()
              .toUpperCase(),

            breed_name: String(
              row.breed_name || ""
            ).trim(),

            is_active:
              String(
                row.is_active || "Yes"
              )
                .trim()
                .toLowerCase() === "no"
                ? "No"
                : "Yes",
          }))
          .filter(
            (row) =>
              row.breed_name
          )
          .sort((a, b) =>
            a.breed_name.localeCompare(
              b.breed_name
            )
          );

      setRows(normalizedWeightRows);
      setBreedRows(normalizedBreedRows);
    } catch (error) {
      console.error(
        "Failed to load Weight Standards:",
        error
      );

      setRows([]);
      setBreedRows([]);

      showToast(
        "error",
        error?.message ||
          "Unable to load Weight Standards."
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
        row.is_active === "Yes"
    ).length;

    return {
      total: rows.length,
      active,
      inactive: rows.length - active,
    };
  }, [rows]);

  const activeBreedOptions = useMemo(() => {
  const configuredBreeds = new Set(
    rows.map((row) =>
      String(row.breed || "")
        .trim()
        .toLowerCase()
    )
  );

  const currentBreed = String(
    form.breed || ""
  ).trim();

  const names = new Set();

  breedRows.forEach((row) => {
    const breedName = String(
      row.breed_name || ""
    ).trim();

    if (
      row.is_active !== "Yes" ||
      !breedName
    ) {
      return;
    }

    const alreadyConfigured =
      configuredBreeds.has(
        breedName.toLowerCase()
      );

    if (
      mode === "add" &&
      alreadyConfigured
    ) {
      return;
    }

    names.add(breedName);
  });

  /*
   * Preserve the existing breed while editing,
   * including an inactive breed.
   */
  if (currentBreed) {
    names.add(currentBreed);
  }

  return Array.from(names).sort(
    (a, b) => a.localeCompare(b)
  );
}, [
  breedRows,
  rows,
  form.breed,
  mode,
]);

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
          row.weight_standard_id,
          row.breed,
          row.age_1,
          row.age_2,
          row.age_3,
          row.age_4,
          row.age_5_plus,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const rowStatus =
        row.is_active === "No"
          ? "Inactive"
          : "Active";

      const matchesStatus =
        statusFilter === "All" ||
        rowStatus === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    rows,
    searchText,
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
        row.weight_standard_id ||
        row.id ||
        "",

      weight_standard_id:
        row.weight_standard_id ||
        row.id ||
        "",

      breed:
        row.breed || "",

      age_1:
        row.age_1 || "",

      age_2:
        row.age_2 || "",

      age_3:
        row.age_3 || "",

      age_4:
        row.age_4 || "",

      age_5_plus:
        row.age_5_plus || "",

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
    setStatusFilter("All");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const breed = String(
      form.breed || ""
    )
      .trim()
      .replace(/\s+/g, " ");

    if (!breed) {
      showToast(
        "error",
        "Breed is required."
      );
      return;
    }

    if (breed.length > 100) {
      showToast(
        "error",
        "Breed cannot exceed 100 characters."
      );
      return;
    }

    const normalizedRanges = {};

    for (
      let index = 0;
      index < RANGE_FIELDS.length;
      index += 1
    ) {
      const field =
        RANGE_FIELDS[index];

      const validation =
        validateRangeValue(
          form[field.name],
          field.label
        );

      if (!validation.valid) {
        showToast(
          "error",
          validation.message
        );
        return;
      }

      normalizedRanges[field.name] =
        validation.value;
    }

    const standardId = String(
      form.weight_standard_id ||
        form.id ||
        ""
    )
      .trim()
      .toUpperCase();

    const payload = {
      id: standardId,
      weight_standard_id:
        standardId,
      breed,

      age_1:
        normalizedRanges.age_1,

      age_2:
        normalizedRanges.age_2,

      age_3:
        normalizedRanges.age_3,

      age_4:
        normalizedRanges.age_4,

      age_5_plus:
        normalizedRanges.age_5_plus,

      is_active:
        form.is_active === "No"
          ? "No"
          : "Yes",
    };

    try {
      setSaving(true);

      showToast(
        "info",
        mode === "add"
          ? "Please wait while the Weight Standard is saved..."
          : "Please wait while the Weight Standard is updated..."
      );

      const response =
        mode === "add"
          ? await addMaster(
              "weight",
              payload
            )
          : await updateMaster(
              "weight",
              standardId,
              payload
            );

      if (response?.success === false) {
        throw new Error(
          response.error ||
            response.message ||
            "Unable to save Weight Standard."
        );
      }

      await loadData();

      setShowModal(false);
      setForm(EMPTY_FORM);

      showToast(
        "success",
        response?.message ||
          (mode === "add"
            ? "Weight Standard added successfully."
            : "Weight Standard updated successfully.")
      );
    } catch (error) {
      console.error(
        "Weight Standard save failed:",
        error
      );

      showToast(
        "error",
        error?.message ||
          "Unable to save Weight Standard."
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

    const standardId = String(
      row.weight_standard_id ||
        row.id ||
        ""
    )
      .trim()
      .toUpperCase();

    try {
      setStatusUpdatingId(
        standardId
      );

      showToast(
        "info",
        newStatus === "No"
          ? "Please wait while the Weight Standard is deactivated..."
          : "Please wait while the Weight Standard is activated..."
      );

      let response;

      if (newStatus === "No") {
        response = await deleteMaster(
          "weight",
          standardId
        );
      } else {
        response = await updateMaster(
          "weight",
          standardId,
          {
            id: standardId,
            weight_standard_id:
              standardId,
            breed: row.breed,
            age_1: row.age_1,
            age_2: row.age_2,
            age_3: row.age_3,
            age_4: row.age_4,
            age_5_plus:
              row.age_5_plus,
            is_active: "Yes",
          }
        );
      }

      if (response?.success === false) {
        throw new Error(
          response.error ||
            response.message ||
            "Unable to change Weight Standard status."
        );
      }

      await loadData();

      setPendingStatusChange(null);

      showToast(
        "success",
        newStatus === "Yes"
          ? "Weight Standard activated successfully."
          : "Weight Standard deactivated successfully."
      );
    } catch (error) {
      console.error(
        "Weight Standard status update failed:",
        error
      );

      showToast(
        "error",
        error?.message ||
          "Unable to change Weight Standard status."
      );
    } finally {
      setStatusUpdatingId("");
    }
  }

  const hasActiveFilters =
    Boolean(searchText.trim()) ||
    statusFilter !== "All";

  return (
    <div style={pageStyle}>
      <PageHeader
        title="Weight Standards Master"
        description="Manage breed-wise approximate reference weight ranges used when actual cattle weighing is not practical."
        countText={`${filteredRows.length} of ${rows.length} standard${
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
            + Add Standard
          </button>
        }
      />

      <div style={metricsWrapperStyle}>
        <MetricCard
          label="Total Standards"
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
              placeholder="Search standard ID, breed or weight range"
            />
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

      <SectionCard title="Reference Rules">
        <div style={informationGridStyle}>
          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Purpose
            </div>

            <div style={informationValueStyle}>
              Values provide an approximate weight range
              based on breed and cattle age.
            </div>
          </div>

          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Usage
            </div>

            <div style={informationValueStyle}>
              Use these ranges when actual weighing is
              difficult or not operationally necessary.
            </div>
          </div>

          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Important
            </div>

            <div style={informationValueStyle}>
              These are reference estimates, not actual
              measured cattle weights.
            </div>
          </div>

          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Range Format
            </div>

            <div style={informationValueStyle}>
              Enter every range as minimum-maximum,
              for example 150-200.
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
                  Standard ID
                </th>

                <th style={thStyle}>
                  Breed
                </th>

                <th style={thStyle}>
                  1 Year
                </th>

                <th style={thStyle}>
                  2 Years
                </th>

                <th style={thStyle}>
                  3 Years
                </th>

                <th style={thStyle}>
                  4 Years
                </th>

                <th style={thStyle}>
                  5+ Years
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
                    colSpan={9}
                    style={emptyStateStyle}
                  >
                    Loading Weight Standards...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={emptyStateStyle}
                  >
                    No Weight Standards found.
                  </td>
                </tr>
              ) : (
                filteredRows.map(
                  (row, index) => {
                    const isActive =
                      row.is_active !== "No";

                    const isStatusUpdating =
                      statusUpdatingId ===
                      row.weight_standard_id;

                    return (
                      <tr
                        key={
                          row.weight_standard_id
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
                            {row.weight_standard_id ||
                              "-"}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          <strong>
                            {row.breed || "-"}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          <RangeBadge
                            value={row.age_1}
                          />
                        </td>

                        <td style={tdStyle}>
                          <RangeBadge
                            value={row.age_2}
                          />
                        </td>

                        <td style={tdStyle}>
                          <RangeBadge
                            value={row.age_3}
                          />
                        </td>

                        <td style={tdStyle}>
                          <RangeBadge
                            value={row.age_4}
                          />
                        </td>

                        <td style={tdStyle}>
                          <RangeBadge
                            value={
                              row.age_5_plus
                            }
                          />
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
                                  ? "Deactivate standard"
                                  : "Activate standard"
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
                    ? "Add Weight Standard"
                    : "Edit Weight Standard"}
                </h2>

                <p
                  style={
                    modalDescriptionStyle
                  }
                >
                  Define approximate breed-wise
                  reference weight ranges by age.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={closeButtonStyle}
                disabled={saving}
                aria-label="Close weight standard form"
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
              <SectionCard title="Standard Details">
                {mode === "edit" && (
                  <Field label="Standard ID">
                    <input
                      type="text"
                      value={
                        form.weight_standard_id
                      }
                      className="form-input"
                      disabled
                    />
                  </Field>
                )}

                <Field label="Breed *">
                  <select
                    name="breed"
                    value={form.breed}
                    onChange={handleChange}
                    className="form-select"
                    required
                    disabled={saving}
                  >
                    <option value="">
                      Select Breed
                    </option>

                    {activeBreedOptions.map(
                      (breedName) => (
                        <option
                          key={breedName}
                          value={breedName}
                        >
                          {breedName}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <div style={rangeGridStyle}>
                  {RANGE_FIELDS.map(
                    (field) => (
                      <Field
                        key={field.name}
                        label={`${field.label} *`}
                      >
                        <input
                          type="text"
                          name={field.name}
                          value={
                            form[field.name]
                          }
                          onChange={
                            handleChange
                          }
                          className="form-input"
                          placeholder="Example: 150-200"
                          inputMode="numeric"
                          maxLength={20}
                          required
                          disabled={saving}
                          autoComplete="off"
                        />
                      </Field>
                    )
                  )}
                </div>

                <div style={referenceNoteStyle}>
                  Enter an approximate minimum and maximum
                  range in kilograms. Example:{" "}
                  <strong>150-200</strong>.
                </div>

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

              <div style={modalActionsStyle}>
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
                      form.breed || ""
                    ).trim() ||
                    RANGE_FIELDS.some(
                      (field) =>
                        !String(
                          form[field.name] ||
                            ""
                        ).trim()
                    )
                  }
                >
                  {saving
                    ? mode === "add"
                      ? "Saving..."
                      : "Updating..."
                    : mode === "add"
                      ? "Save Standard"
                      : "Update Standard"}
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
                ? "Deactivate Weight Standard?"
                : "Activate Weight Standard?"}
            </h2>

            <p style={confirmMessageStyle}>
              {pendingStatusChange
                .newStatus === "No"
                ? `This will prevent the "${pendingStatusChange.row.breed}" reference standard from being used for new approximate weight calculations. Existing records will remain unchanged.`
                : `This will make the "${pendingStatusChange.row.breed}" reference standard available for approximate weight calculations.`}
            </p>

            <div style={confirmActionsStyle}>
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
                        .newStatus === "No"
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

function RangeBadge({ value }) {
  const normalizedValue =
    normalizeRangeText(value);

  return (
    <span style={rangeBadgeStyle}>
      {normalizedValue || "-"}
    </span>
  );
}

function normalizeRangeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "");
}

function validateRangeValue(
  value,
  label
) {
  const text =
    normalizeRangeText(value);

  if (!text) {
    return {
      valid: false,
      message: `${label} is required.`,
      value: "",
    };
  }

  const match =
    text.match(/^(\d+)-(\d+)$/);

  if (!match) {
    return {
      valid: false,
      message: `${label} must use the format min-max, for example 150-200.`,
      value: "",
    };
  }

  const minimum =
    Number(match[1]);

  const maximum =
    Number(match[2]);

  if (
    !Number.isInteger(minimum) ||
    !Number.isInteger(maximum)
  ) {
    return {
      valid: false,
      message: `${label} must contain whole numbers only.`,
      value: "",
    };
  }

  if (
    minimum < 0 ||
    maximum < 0 ||
    minimum > 2000 ||
    maximum > 2000
  ) {
    return {
      valid: false,
      message: `${label} values must be between 0 and 2000 kg.`,
      value: "",
    };
  }

  if (maximum < minimum) {
    return {
      valid: false,
      message: `${label} maximum weight cannot be less than minimum weight.`,
      value: "",
    };
  }

  return {
    valid: true,
    message: "",
    value: `${minimum}-${maximum}`,
  };
}

const pageStyle = {
  padding: "2.25rem 1.5rem 1.5rem",
  maxWidth: "1250px",
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
    "minmax(280px, 2fr) minmax(180px, 1fr) auto",
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
  minHeight: "380px",
  maxHeight: "calc(100vh - 520px)",
};

const tableScrollStyle = {
  flex: 1,
  overflowY: "auto",
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.88rem",
  minWidth: "1180px",
};

const tableHeadStyle = {
  background: "#f8fafc",
  borderBottom: "2px solid #e2e8f0",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const thStyle = {
  padding: "0.8rem 0.9rem",
  textAlign: "left",
  fontWeight: 700,
  fontSize: "0.7rem",
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "0.72rem 0.9rem",
  color: "#1f2937",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "middle",
};

const emptyStateStyle = {
  padding: "3rem",
  textAlign: "center",
  color: "#64748b",
};

const rangeBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "62px",
  padding: "0.2rem 0.5rem",
  borderRadius: "6px",
  fontSize: "0.76rem",
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
  maxWidth: "820px",
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

const rangeGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "0 1rem",
};

const referenceNoteStyle = {
  marginBottom: "1rem",
  padding: "0.75rem",
  borderRadius: "8px",
  border: "1px solid #bfdbfe",
  background: "#eff6ff",
  color: "#1e3a8a",
  fontSize: "0.8rem",
  lineHeight: 1.45,
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
  maxWidth: "500px",
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
  maxWidth: "440px",
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