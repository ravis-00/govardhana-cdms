import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import PageHeader from "../../components/common/PageHeader";
import MetricCard from "../../components/common/MetricCard";
import SectionCard from "../../components/common/SectionCard";
import {
  getSheds,
  addShed,
  updateShed,
  deleteShed,
} from "../../api/masterApi";

const EMPTY_FORM = {
  id: "",
  shed_id: "",
  name: "",
  shed_name: "",
  capacity: "",
  status: "Active",
};

export default function ShedConfig() {
  const [rows, setRows] = useState([]);
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

      const response = await getSheds();

      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const normalizedRows = data
        .map((row) => {
          const shedId = String(
            row.shed_id ||
              row.id ||
              ""
          )
            .trim()
            .toUpperCase();

          const shedName = String(
            row.shed_name ||
              row.name ||
              ""
          ).trim();

          const rawCapacity =
            row.capacity === undefined ||
            row.capacity === null
              ? ""
              : row.capacity;

          const capacity =
            String(rawCapacity).trim() === ""
              ? ""
              : Number(rawCapacity);

          const status =
            String(row.status || "Active")
              .trim()
              .toLowerCase() ===
            "inactive"
              ? "Inactive"
              : "Active";

          return {
            id: shedId,
            shed_id: shedId,
            name: shedName,
            shed_name: shedName,
            capacity:
              capacity === "" ||
              Number.isFinite(capacity)
                ? capacity
                : "",
            status,
          };
        })
        .filter(
          (row) =>
            row.shed_id ||
            row.shed_name
        )
        .sort((a, b) =>
          a.shed_name.localeCompare(
            b.shed_name
          )
        );

      setRows(normalizedRows);
    } catch (error) {
      console.error(
        "Failed to load Sheds:",
        error
      );

      setRows([]);

      showToast(
        "error",
        error?.message ||
          "Unable to load Sheds."
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
      (row) => row.status === "Active"
    ).length;

    return {
      total: rows.length,
      active,
      inactive: rows.length - active,
    };
  }, [rows]);

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
          row.shed_id,
          row.shed_name,
          row.capacity,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesStatus =
        statusFilter === "All" ||
        row.status === statusFilter;

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
      status: "Active",
    });

    setShowModal(true);
  }

  function openEditModal(row) {
    setMode("edit");

    setForm({
      id:
        row.shed_id ||
        row.id ||
        "",
      shed_id:
        row.shed_id ||
        row.id ||
        "",
      name:
        row.shed_name ||
        row.name ||
        "",
      shed_name:
        row.shed_name ||
        row.name ||
        "",
      capacity:
        row.capacity === undefined ||
        row.capacity === null
          ? ""
          : String(row.capacity),
      status:
        row.status === "Inactive"
          ? "Inactive"
          : "Active",
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

    const shedName = String(
      form.shed_name ||
        form.name ||
        ""
    )
      .trim()
      .replace(/\s+/g, " ");

    const capacityText = String(
      form.capacity ?? ""
    ).trim();

    if (!shedName) {
      showToast(
        "error",
        "Shed Name is required."
      );
      return;
    }

    if (shedName.length > 100) {
      showToast(
        "error",
        "Shed Name cannot exceed 100 characters."
      );
      return;
    }

    let capacity = "";

    if (capacityText) {
      capacity = Number(capacityText);

      if (
        !Number.isInteger(capacity) ||
        capacity < 1 ||
        capacity > 9999
      ) {
        showToast(
          "error",
          "Capacity must be a whole number between 1 and 9999."
        );
        return;
      }
    }

    const status =
      form.status === "Inactive"
        ? "Inactive"
        : "Active";

    const shedId = String(
      form.shed_id ||
        form.id ||
        ""
    )
      .trim()
      .toUpperCase();

    const payload = {
      id: shedId,
      shed_id: shedId,
      name: shedName,
      shed_name: shedName,
      capacity,
      status,
    };

    try {
      setSaving(true);

      showToast(
        "info",
        mode === "add"
          ? "Please wait while the Shed is saved..."
          : "Please wait while the Shed is updated..."
      );

      const response =
        mode === "add"
          ? await addShed(payload)
          : await updateShed(payload);

      if (response?.success === false) {
        throw new Error(
          response.error ||
            response.message ||
            "Unable to save Shed."
        );
      }

      await loadData();

      setShowModal(false);
      setForm(EMPTY_FORM);

      showToast(
        "success",
        response?.message ||
          (mode === "add"
            ? "Shed added successfully."
            : "Shed updated successfully.")
      );
    } catch (error) {
      console.error(
        "Shed save failed:",
        error
      );

      showToast(
        "error",
        error?.message ||
          "Unable to save Shed."
      );
    } finally {
      setSaving(false);
    }
  }

  function requestStatusChange(row) {
    const newStatus =
      row.status === "Active"
        ? "Inactive"
        : "Active";

    setPendingStatusChange({
      row,
      newStatus,
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

    const shedId = String(
      row.shed_id ||
        row.id ||
        ""
    )
      .trim()
      .toUpperCase();

    try {
      setStatusUpdatingId(shedId);

      showToast(
        "info",
        newStatus === "Inactive"
          ? "Please wait while the Shed is deactivated..."
          : "Please wait while the Shed is activated..."
      );

      let response;

      if (newStatus === "Inactive") {
        response = await deleteShed({
          id: shedId,
          shed_id: shedId,
        });
      } else {
        response = await updateShed({
          id: shedId,
          shed_id: shedId,
          name: row.shed_name,
          shed_name: row.shed_name,
          capacity: row.capacity,
          status: "Active",
        });
      }

      if (response?.success === false) {
        throw new Error(
          response.error ||
            response.message ||
            "Unable to change Shed status."
        );
      }

      await loadData();

      setPendingStatusChange(null);

      showToast(
        "success",
        newStatus === "Active"
          ? "Shed activated successfully."
          : "Shed deactivated successfully."
      );
    } catch (error) {
      console.error(
        "Shed status update failed:",
        error
      );

      showToast(
        "error",
        error?.message ||
          "Unable to change Shed status."
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
        title="Sheds Master"
        description="Manage goshala sheds used for cattle allocation and daily operations."
        countText={`${filteredRows.length} of ${rows.length} shed${
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
            + Add Shed
          </button>
        }
      />

      <div style={metricsWrapperStyle}>
        <MetricCard
          label="Total Sheds"
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
              placeholder="Search shed ID, name or capacity"
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

      <SectionCard title="Configuration Rules">
        <div style={informationGridStyle}>
          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Purpose
            </div>

            <div style={informationValueStyle}>
              Active sheds are available for cattle
              allocation and daily operational records.
            </div>
          </div>

          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Capacity
            </div>

            <div style={informationValueStyle}>
              Capacity is optional. When entered, it
              must be a whole number between 1 and 9999.
            </div>
          </div>

          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Deactivation Rule
            </div>

            <div style={informationValueStyle}>
              Sheds should be deactivated instead of
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
                  Shed ID
                </th>

                <th style={thStyle}>
                  Shed Name
                </th>

                <th style={thStyle}>
                  Capacity
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
                    colSpan={5}
                    style={emptyStateStyle}
                  >
                    Loading Sheds...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={emptyStateStyle}
                  >
                    No Sheds found.
                  </td>
                </tr>
              ) : (
                filteredRows.map(
                  (row, index) => {
                    const isActive =
                      row.status === "Active";

                    const isStatusUpdating =
                      statusUpdatingId ===
                      row.shed_id;

                    return (
                      <tr
                        key={row.shed_id}
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
                            {row.shed_id ||
                              "-"}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          <strong>
                            {row.shed_name ||
                              "-"}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          {row.capacity === "" ||
                          row.capacity === null ||
                          row.capacity === undefined
                            ? "-"
                            : row.capacity}
                        </td>

                        <td style={tdStyle}>
                          <StatusBadge
                            value={
                              row.status
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
                                  ? "Deactivate shed"
                                  : "Activate shed"
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
                    ? "Add Shed"
                    : "Edit Shed"}
                </h2>

                <p
                  style={
                    modalDescriptionStyle
                  }
                >
                  Create or update a shed used for
                  cattle allocation and operations.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={closeButtonStyle}
                disabled={saving}
                aria-label="Close shed form"
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
              <SectionCard title="Shed Details">
                {mode === "edit" && (
                  <Field label="Shed ID">
                    <input
                      type="text"
                      value={
                        form.shed_id
                      }
                      className="form-input"
                      disabled
                    />
                  </Field>
                )}

                <Field label="Shed Name *">
                  <input
                    type="text"
                    name="shed_name"
                    value={
                      form.shed_name
                    }
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Example: Punyakoti"
                    maxLength={100}
                    required
                    disabled={saving}
                    autoComplete="off"
                  />
                </Field>

                <Field label="Capacity">
                  <input
                    type="number"
                    name="capacity"
                    value={form.capacity}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Example: 100"
                    min="1"
                    max="9999"
                    step="1"
                    disabled={saving}
                  />

                  <div style={fieldHelpStyle}>
                    Leave blank if capacity is not yet defined.
                  </div>
                </Field>

                <Field label="Status *">
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="form-select"
                    required
                    disabled={saving}
                  >
                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
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
                      form.shed_name ||
                        form.name ||
                        ""
                    ).trim()
                  }
                >
                  {saving
                    ? mode === "add"
                      ? "Saving..."
                      : "Updating..."
                    : mode === "add"
                      ? "Save Shed"
                      : "Update Shed"}
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
                .newStatus === "Inactive"
                ? "Deactivate Shed?"
                : "Activate Shed?"}
            </h2>

            <p style={confirmMessageStyle}>
              {pendingStatusChange
                .newStatus === "Inactive"
                ? `This will prevent "${pendingStatusChange.row.shed_name}" from being selected for new cattle allocations and operational records. Historical records will remain unchanged.`
                : `This will make "${pendingStatusChange.row.shed_name}" available for new cattle allocations and operational records.`}
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
                      "Inactive"
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
      .toLowerCase() === "active";

  return (
    <span
      style={{
        ...statusBadgeStyle,
        ...(isActive
          ? activeStatusStyle
          : inactiveStatusStyle),
      }}
    >
      {isActive ? "Active" : "Inactive"}
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
    "minmax(260px, 2fr) minmax(180px, 1fr) auto",
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
  minWidth: "850px",
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
  maxWidth: "620px",
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

const fieldHelpStyle = {
  marginTop: "0.35rem",
  fontSize: "0.75rem",
  color: "#64748b",
  lineHeight: 1.4,
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