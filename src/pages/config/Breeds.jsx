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
  breed_id: "",
  breed_name: "",
  origin: "",
  description: "",
  is_active: "Yes",
};

export default function Breeds() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [originFilter, setOriginFilter] =
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
        await fetchMaster("breeds");

      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const normalizedRows = data
        .map((row) => ({
          id: String(
            row.id ||
              row.breed_id ||
              ""
          )
            .trim()
            .toUpperCase(),

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

          origin: String(
            row.origin || ""
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
            row.breed_id ||
            row.breed_name
        )
        .sort((a, b) => {
          const originCompare =
            a.origin.localeCompare(
              b.origin
            );

          if (originCompare !== 0) {
            return originCompare;
          }

          return a.breed_name.localeCompare(
            b.breed_name
          );
        });

      setRows(normalizedRows);
    } catch (error) {
      console.error(
        "Failed to load Breeds:",
        error
      );

      setRows([]);

      showToast(
        "error",
        error?.message ||
          "Unable to load Breeds."
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

  const origins = useMemo(() => {
    const uniqueOrigins = new Set();

    rows.forEach((row) => {
  const origin = String(
    row.origin || ""
  ).trim();

  const isActive =
    String(row.is_active || "Yes")
      .trim()
      .toLowerCase() !== "no";

  if (origin && isActive) {
    uniqueOrigins.add(origin);
  }
});

    const currentFormOrigin = String(
      form.origin || ""
    ).trim();

    if (currentFormOrigin) {
      uniqueOrigins.add(
        currentFormOrigin
      );
    }

    return Array.from(
      uniqueOrigins
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [rows, form.origin]);

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
          row.breed_id,
          row.breed_name,
          row.origin,
          row.description,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesOrigin =
        originFilter === "All" ||
        row.origin === originFilter;

      const rowStatus =
        row.is_active === "No"
          ? "Inactive"
          : "Active";

      const matchesStatus =
        statusFilter === "All" ||
        rowStatus === statusFilter;

      return (
        matchesSearch &&
        matchesOrigin &&
        matchesStatus
      );
    });
  }, [
    rows,
    searchText,
    originFilter,
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
        row.breed_id ||
        "",

      breed_id:
        row.breed_id ||
        row.id ||
        "",

      breed_name:
        row.breed_name || "",

      origin:
        row.origin || "",

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
    setOriginFilter("All");
    setStatusFilter("All");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const breedName = String(
      form.breed_name || ""
    )
      .trim()
      .replace(/\s+/g, " ");

    const origin = String(
      form.origin || ""
    )
      .trim()
      .replace(/\s+/g, " ");

    const description = String(
      form.description || ""
    ).trim();

    if (!breedName) {
      showToast(
        "error",
        "Breed Name is required."
      );
      return;
    }

    if (breedName.length > 100) {
      showToast(
        "error",
        "Breed Name cannot exceed 100 characters."
      );
      return;
    }

    if (!origin) {
      showToast(
        "error",
        "Breed Group / Type is required."
      );
      return;
    }

    if (origin.length > 50) {
      showToast(
        "error",
        "Breed Group / Type cannot exceed 50 characters."
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
          form.breed_id ||
          ""
      )
        .trim()
        .toUpperCase(),

      breed_id: String(
        form.breed_id ||
          form.id ||
          ""
      )
        .trim()
        .toUpperCase(),

      breed_name: breedName,
      origin,
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
          ? "Please wait while the Breed is saved..."
          : "Please wait while the Breed is updated..."
      );

      const response =
        mode === "add"
          ? await addMaster(
              "breeds",
              payload
            )
          : await updateMaster(
              "breeds",
              payload.breed_id,
              payload
            );

      if (response?.success === false) {
        throw new Error(
          response.error ||
            response.message ||
            "Unable to save Breed."
        );
      }

      await loadData();

      setShowModal(false);
      setForm(EMPTY_FORM);

      showToast(
        "success",
        response?.message ||
          (mode === "add"
            ? "Breed added successfully."
            : "Breed updated successfully.")
      );
    } catch (error) {
      console.error(
        "Breed save failed:",
        error
      );

      showToast(
        "error",
        error?.message ||
          "Unable to save Breed."
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

    const breedId = String(
      row.breed_id ||
        row.id ||
        ""
    )
      .trim()
      .toUpperCase();

    try {
      setStatusUpdatingId(breedId);

      showToast(
        "info",
        newStatus === "No"
          ? "Please wait while the Breed is deactivated..."
          : "Please wait while the Breed is activated..."
      );

      let response;

      if (newStatus === "No") {
        response = await deleteMaster(
          "breeds",
          breedId
        );
      } else {
        response = await updateMaster(
          "breeds",
          breedId,
          {
            id: breedId,
            breed_id: breedId,
            breed_name:
              row.breed_name,
            origin:
              row.origin,
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
            "Unable to change Breed status."
        );
      }

      await loadData();

      setPendingStatusChange(null);

      showToast(
        "success",
        newStatus === "Yes"
          ? "Breed activated successfully."
          : "Breed deactivated successfully."
      );
    } catch (error) {
      console.error(
        "Breed status update failed:",
        error
      );

      showToast(
        "error",
        error?.message ||
          "Unable to change Breed status."
      );
    } finally {
      setStatusUpdatingId("");
    }
  }

  const hasActiveFilters =
    Boolean(searchText.trim()) ||
    originFilter !== "All" ||
    statusFilter !== "All";

  return (
    <div style={pageStyle}>
      <PageHeader
        title="Breeds Master"
        description="Manage approved cattle and buffalo breeds used across registration, breeding and pedigree records."
        countText={`${filteredRows.length} of ${rows.length} breed${
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
            + Add Breed
          </button>
        }
      />

      <div style={metricsWrapperStyle}>
        <MetricCard
          label="Total Breeds"
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
              placeholder="Search ID, breed, type or description"
            />
          </div>

          <div>
            <label style={fieldLabelStyle}>
              Breed Group / Type
            </label>

            <select
              value={originFilter}
              onChange={(event) =>
                setOriginFilter(
                  event.target.value
                )
              }
              className="form-select"
            >
              <option value="All">
                All Groups / Types
              </option>

              {origins.map((origin) => (
                <option
                  key={origin}
                  value={origin}
                >
                  {origin}
                </option>
              ))}
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
              Active breeds are available in
              registration, breeding and pedigree
              workflows.
            </div>
          </div>

          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Historical Records
            </div>

            <div style={informationValueStyle}>
              Existing cattle and birth records retain
              the breed name saved at the time of entry.
            </div>
          </div>

          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Deactivation Rule
            </div>

            <div style={informationValueStyle}>
              Breeds should be deactivated instead of
              permanently deleted.
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
                  Breed ID
                </th>

                <th style={thStyle}>
                  Breed Name
                </th>

                <th style={thStyle}>
                  Breed Group / Type
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
                    Loading Breeds...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={emptyStateStyle}
                  >
                    No Breeds found.
                  </td>
                </tr>
              ) : (
                filteredRows.map(
                  (row, index) => {
                    const isActive =
                      row.is_active !== "No";

                    const isStatusUpdating =
                      statusUpdatingId ===
                      row.breed_id;

                    return (
                      <tr
                        key={
                          row.breed_id ||
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
                            {row.breed_id ||
                              "-"}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          <strong>
                            {row.breed_name ||
                              "-"}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          <OriginBadge
                            value={
                              row.origin
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
                                  ? "Deactivate breed"
                                  : "Activate breed"
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
                    ? "Add Breed"
                    : "Edit Breed"}
                </h2>

                <p
                  style={
                    modalDescriptionStyle
                  }
                >
                  Create or update an approved
                  cattle or buffalo breed.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={closeButtonStyle}
                disabled={saving}
                aria-label="Close breed form"
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
              <SectionCard title="Breed Details">
                {mode === "edit" && (
                  <Field label="Breed ID">
                    <input
                      type="text"
                      value={
                        form.breed_id
                      }
                      className="form-input"
                      disabled
                    />
                  </Field>
                )}

                <Field label="Breed Name *">
                  <input
                    type="text"
                    name="breed_name"
                    value={
                      form.breed_name
                    }
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Example: Hallikar"
                    maxLength={100}
                    required
                    disabled={saving}
                    autoComplete="off"
                  />
                </Field>

                <Field label="Breed Group / Type *">
                  <input
                    type="text"
                    name="origin"
                    value={form.origin}
                    onChange={handleChange}
                    className="form-input"
                    list="breed-origin-options"
                    placeholder="Example: Cow"
                    maxLength={50}
                    required
                    disabled={saving}
                    autoComplete="off"
                  />

                  <datalist id="breed-origin-options">
                    {origins.map(
                      (origin) => (
                        <option
                          key={origin}
                          value={origin}
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
                    placeholder="Describe the breed and its key characteristics"
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
                      form.breed_name ||
                        ""
                    ).trim() ||
                    !String(
                      form.origin || ""
                    ).trim()
                  }
                >
                  {saving
                    ? mode === "add"
                      ? "Saving..."
                      : "Updating..."
                    : mode === "add"
                      ? "Save Breed"
                      : "Update Breed"}
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
                ? "Deactivate Breed?"
                : "Activate Breed?"}
            </h2>

            <p style={confirmMessageStyle}>
              {pendingStatusChange
                .newStatus === "No"
                ? `This will prevent "${pendingStatusChange.row.breed_name}" from being selected in new records. Historical cattle and breeding records will remain unchanged.`
                : `This will make "${pendingStatusChange.row.breed_name}" available for new registration and breeding records.`}
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

function OriginBadge({ value }) {
  return (
    <span style={originBadgeStyle}>
      {value || "Unspecified"}
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

const originBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.2rem 0.55rem",
  borderRadius: "999px",
  fontSize: "0.72rem",
  fontWeight: 700,
  color: "#0369a1",
  background: "#e0f2fe",
  border: "1px solid #bae6fd",
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