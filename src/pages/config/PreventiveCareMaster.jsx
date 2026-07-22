import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import MetricCard from "../../components/common/MetricCard";
import SectionCard from "../../components/common/SectionCard";
import {
  getPreventiveCareTypes,
  addPreventiveCareType,
  updatePreventiveCareType,
} from "../../api/masterApi";

const EMPTY_CARE_TYPE_FORM = {
  care_type_id: "",
  care_type_name: "",
  description: "",
  display_order: "",
  is_active: "Yes",
  remarks: "",
};

export default function PreventiveCareMaster() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add");
  const [form, setForm] = useState(EMPTY_CARE_TYPE_FORM);

  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const showToast = (type, message) => {
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
  };

  const loadCareTypes = async () => {
    try {
      setLoading(true);

      const response = await getPreventiveCareTypes();

      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const normalizedRows = data
        .map((row) => ({
          care_type_id: String(row.care_type_id || "").trim(),
          care_type_name: String(row.care_type_name || "").trim(),
          description: String(row.description || "").trim(),
          display_order:
            row.display_order === "" ||
            row.display_order === null ||
            row.display_order === undefined
              ? ""
              : Number(row.display_order),
          is_active:
            String(row.is_active || "Yes")
              .trim()
              .toLowerCase() === "no"
              ? "No"
              : "Yes",
          remarks: String(row.remarks || "").trim(),
        }))
        .sort((a, b) => {
          const orderA =
            a.display_order === "" ? 999999 : Number(a.display_order);

          const orderB =
            b.display_order === "" ? 999999 : Number(b.display_order);

          if (orderA !== orderB) {
            return orderA - orderB;
          }

          return a.care_type_name.localeCompare(b.care_type_name);
        });

      setRows(normalizedRows);
    } catch (error) {
      console.error("Failed to load Preventive Care Types:", error);

      setRows([]);

      showToast(
        "error",
        error?.message || "Unable to load Preventive Care Types."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCareTypes();
  }, []);

  const getNextDisplayOrder = () => {
    if (rows.length === 0) {
      return 1;
    }

    const highestOrder = rows.reduce((highest, row) => {
      const current = Number(row.display_order);

      if (!Number.isFinite(current)) {
        return highest;
      }

      return Math.max(highest, current);
    }, 0);

    return Math.min(highestOrder + 1, 99);
  };

  // metrics block remains below for now

   const metrics = useMemo(() => {
    const active = rows.filter(
      (row) =>
        String(row.is_active || "")
          .trim()
          .toLowerCase() === "yes"
    ).length;

    return {
      total: rows.length,
      active,
      inactive: rows.length - active,
    };
  }, [rows]);

    function openAddModal() {
    setMode("add");

    setForm({
      ...EMPTY_CARE_TYPE_FORM,
      display_order: String(getNextDisplayOrder()),
      is_active: "Yes",
    });

    setShowModal(true);
  }

  function openEditModal(row) {
    setMode("edit");

    setForm({
      care_type_id: row.care_type_id || "",
      care_type_name: row.care_type_name || "",
      description: row.description || "",
      display_order: row.display_order || "",
      is_active: row.is_active || "Yes",
      remarks: row.remarks || "",
    });

    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

    async function handleSubmit(event) {
    event.preventDefault();

    const careTypeName = String(
      form.care_type_name || ""
    ).trim();

    const displayOrder = Number(form.display_order);

    if (!careTypeName) {
      showToast("error", "Care Type Name is required.");
      return;
    }

    if (
      !Number.isInteger(displayOrder) ||
      displayOrder < 1 ||
      displayOrder > 99
    ) {
      showToast(
        "error",
        "Display Order must be a whole number between 1 and 99."
      );
      return;
    }

    const payload = {
      care_type_id: String(form.care_type_id || "").trim(),
      care_type_name: careTypeName,
      description: String(form.description || "").trim(),
      display_order: displayOrder,
      is_active:
        String(form.is_active || "Yes")
          .trim()
          .toLowerCase() === "no"
          ? "No"
          : "Yes",
      remarks: String(form.remarks || "").trim(),
    };

    try {
      setSaving(true);

      showToast(
        "info",
        mode === "add"
          ? "Please wait while the Care Type is saved..."
          : "Please wait while the Care Type is updated..."
      );

      const response =
        mode === "add"
          ? await addPreventiveCareType(payload)
          : await updatePreventiveCareType(payload);

      if (response?.success === false) {
        throw new Error(
          response.error ||
            response.message ||
            "Unable to save Preventive Care Type."
        );
      }

      await loadCareTypes();

      setShowModal(false);
      setForm(EMPTY_CARE_TYPE_FORM);

      showToast(
        "success",
        response?.message ||
          (mode === "add"
            ? "Preventive Care Type added successfully."
            : "Preventive Care Type updated successfully.")
      );
    } catch (error) {
      console.error("Care Type save failed:", error);

      showToast(
        "error",
        error?.message ||
          "Unable to save Preventive Care Type."
      );
    } finally {
      setSaving(false);
    }
  }

    async function handleStatusChange(row) {
    const isCurrentlyActive =
      String(row.is_active || "")
        .trim()
        .toLowerCase() === "yes";

    const newStatus = isCurrentlyActive ? "No" : "Yes";

    try {
      setSaving(true);

      showToast(
        "info",
        isCurrentlyActive
          ? "Please wait while the Care Type is deactivated..."
          : "Please wait while the Care Type is activated..."
      );

      const response = await updatePreventiveCareType({
        care_type_id: row.care_type_id,
        care_type_name: row.care_type_name,
        description: row.description || "",
        display_order: Number(row.display_order),
        is_active: newStatus,
        remarks: row.remarks || "",
      });

      if (response?.success === false) {
        throw new Error(
          response.error ||
            response.message ||
            "Unable to change Care Type status."
        );
      }

      await loadCareTypes();

      showToast(
        "success",
        newStatus === "Yes"
          ? "Preventive Care Type activated successfully."
          : "Preventive Care Type deactivated successfully."
      );
    } catch (error) {
      console.error("Care Type status update failed:", error);

      showToast(
        "error",
        error?.message ||
          "Unable to change Care Type status."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={pageStyle}>
      <PageHeader
        title="Preventive Care Master"
        description="Manage approved preventive-care categories used in preventive treatment records."
        countText={`${rows.length} care type${
          rows.length === 1 ? "" : "s"
        }`}
        action={
          <button
            type="button"
            onClick={openAddModal}
            className="btn btn-primary"
            style={{ whiteSpace: "nowrap" }}
          >
            + Add Care Type
          </button>
        }
      />

      <div style={metricsWrapperStyle}>
        <MetricCard
          label="Total Care Types"
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

      <SectionCard title="Care Type Configuration">
        <div style={informationGridStyle}>
          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>Purpose</div>

            <div style={informationValueStyle}>
              These categories will appear in the Preventive Care entry
              form.
            </div>
          </div>

          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>Status Rule</div>

            <div style={informationValueStyle}>
              Only active care types will be available for new records.
            </div>
          </div>

          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>Deletion Rule</div>

            <div style={informationValueStyle}>
              Care types should be deactivated instead of permanently
              deleted.
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="card" style={tableCardStyle}>
        <div style={tableScrollStyle}>
          <table style={tableStyle}>
            <thead style={tableHeadStyle}>
              <tr>
                <th style={thStyle}>Care Type ID</th>
                <th style={thStyle}>Care Type Name</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Display Order</th>
                <th style={thStyle}>Status</th>

                <th style={{ ...thStyle, textAlign: "center" }}>
                  Actions / Status
                </th>
              </tr>
            </thead>

                        <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={emptyStateStyle}>
                    Loading Preventive Care Types...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={emptyStateStyle}>
                    No Preventive Care Types found.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const isActive =
                    String(row.is_active || "")
                      .trim()
                      .toLowerCase() === "yes";

                  return (
                    <tr
                      key={
                        row.care_type_id ||
                        `${row.care_type_name}-${index}`
                      }
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background:
                          index % 2 === 0 ? "#ffffff" : "#f8fafc",
                      }}
                    >
                      <td style={tdStyle}>
                        <strong style={{ color: "#0f172a" }}>
                          {row.care_type_id || "-"}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        {row.care_type_name || "-"}
                      </td>

                      <td style={tdStyle}>
                        <div style={{ maxWidth: "420px" }}>
                          {row.description || "-"}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        {row.display_order || "-"}
                      </td>

                      <td style={tdStyle}>
                        <StatusBadge value={row.is_active} />
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          textAlign: "center",
                        }}
                      >
                        <div style={actionButtonsStyle}>
  <button
    type="button"
    onClick={() => openEditModal(row)}
    style={editButtonStyle}
    disabled={saving}
  >
    Edit
  </button>

  <label style={switchStyle}>
    <input
      type="checkbox"
      checked={isActive}
      disabled={saving}
      onChange={() => handleStatusChange(row)}
      style={{ display: "none" }}
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
          transform: isActive
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
      {showModal && (
        <div style={overlayStyle} onClick={closeModal}>
          <div
            style={modalStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>
                  {mode === "add"
                    ? "Add Care Type"
                    : "Edit Care Type"}
                </h2>

                <p style={modalDescriptionStyle}>
                  Create or update an approved preventive-care
                  category.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={closeButtonStyle}
                disabled={saving}
                aria-label="Close care type form"
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
              <SectionCard title="Care Type Details">
                {mode === "edit" && (
                  <Field label="Care Type ID">
                    <input
                      type="text"
                      value={form.care_type_id}
                      className="form-input"
                      disabled
                    />
                  </Field>
                )}

                <Field label="Care Type Name *">
                  <input
                    type="text"
                    name="care_type_name"
                    value={form.care_type_name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Example: Vaccination"
                    required
                    disabled={saving}
                    autoComplete="off"
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="form-input"
                    rows={3}
                    placeholder="Enter a brief description"
                    disabled={saving}
                    style={{
                      resize: "vertical",
                      minHeight: "80px",
                    }}
                  />
                </Field>

                <div style={twoColumnGridStyle}>
                  <Field label="Display Order *">
                    <input
                      type="number"
                      name="display_order"
                      value={form.display_order}
                      onChange={handleChange}
                      className="form-input"
                      min="1"
                      step="1"
                      max="99"
                      placeholder="1"
                      required
                      disabled={saving}
                    />
                  </Field>

                  <Field label="Status *">
                    <select
                      name="is_active"
                      value={form.is_active}
                      onChange={handleChange}
                      className="form-select"
                      required
                      disabled={saving}
                    >
                      <option value="Yes">Active</option>
                      <option value="No">Inactive</option>
                    </select>
                  </Field>
                </div>

                <Field label="Remarks">
                  <textarea
                    name="remarks"
                    value={form.remarks}
                    onChange={handleChange}
                    className="form-input"
                    rows={3}
                    placeholder="Enter optional remarks"
                    disabled={saving}
                    style={{
                      resize: "vertical",
                      minHeight: "80px",
                    }}
                  />
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
                    !String(form.care_type_name || "").trim() ||
                    !form.display_order
                  }
                >
                  {saving
                    ? mode === "add"
                      ? "Saving..."
                      : "Updating..."
                    : mode === "add"
                      ? "Save Care Type"
                      : "Update Care Type"}
                </button>
              </div>
            </form>
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
    <div style={{ marginBottom: "0.5rem" }}>
      <label style={fieldLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ value }) {
  const isActive =
    String(value || "").trim().toLowerCase() === "yes";

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
  maxHeight: "calc(100vh - 420px)",
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
  minWidth: "900px",
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
  boxShadow: "0 20px 40px rgba(15,23,42,0.2)",
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

const twoColumnGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};

const fieldLabelStyle = {
  display: "block",
  fontSize: "0.8rem",
  color: "#374151",
  marginBottom: "0.3rem",
  fontWeight: 600,
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
  cursor: "pointer",
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
  boxShadow: "0 2px 5px rgba(0,0,0,0.25)",
};





const toastStyle = {
  position: "fixed",
  top: "1.25rem",
  right: "1.25rem",
  zIndex: 9999,
  maxWidth: "420px",
  padding: "0.85rem 1rem",
  borderRadius: "8px",
  boxShadow: "0 10px 30px rgba(15,23,42,0.18)",
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