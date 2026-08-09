import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchUsers,
  addUser,
  updateUser,
} from "../api/masterApi";

import { useAuth } from "../context/AuthContext";
import MetricCard from "../components/common/MetricCard";
import ProgressToast from "../components/common/ProgressToast";

const EMPTY_FORM = {
  id: "",
  fullName: "",
  email: "",
  password: "",
  mobile: "",
  role: "User",
  status: "Active",
  remarks: "",
};

export default function UserManagement() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [form, setForm] = useState(EMPTY_FORM);

  const [toast, setToast] = useState({
    open: false,
    type: "info",
    message: "",
  });

  useEffect(() => {
  if (!toast.open) return;

  // Keep progress/info messages visible until the operation
  // replaces them with success or error.
  if (toast.type === "info") return;

  const timer = setTimeout(() => {
    setToast((prev) => ({
      ...prev,
      open: false,
    }));
  }, 3500);

  return () => clearTimeout(timer);
}, [toast.open, toast.type]);

  const role = user?.role
    ? String(user.role).trim().toLowerCase()
    : "";

  const canAccess = role === "super admin";

  async function loadUsers(options = {}) {
    if (!canAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetchUsers(options);

      const dataList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setUsers(dataList);
    } catch (err) {
      console.error("Unable to load users:", err);

      setToast({
        open: true,
        type: "error",
        message:
          err?.message ||
          "Unable to load users.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canAccess) {
      setLoading(false);
      return;
    }

    loadUsers();
  }, [canAccess]);

  const filteredUsers = useMemo(() => {
    const search =
      searchText.trim().toLowerCase();

    return users.filter((row) => {
      const rowRole =
        String(row.role || "").trim();

      const rowStatus =
        String(row.status || "").trim();

      const matchesRole =
        roleFilter === "All" ||
        rowRole === roleFilter;

      const matchesStatus =
        statusFilter === "All" ||
        rowStatus === statusFilter;

      const haystack = `
        ${row.fullName || ""}
        ${row.name || ""}
        ${row.email || ""}
        ${row.mobile || ""}
        ${row.phone || ""}
      `.toLowerCase();

      const matchesSearch =
        !search ||
        haystack.includes(search);

      return (
        matchesRole &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    users,
    searchText,
    roleFilter,
    statusFilter,
  ]);

  const summary = useMemo(() => {
    const active = users.filter(
      (row) =>
        String(row.status || "")
          .trim()
          .toLowerCase() === "active"
    ).length;

    const administrators = users.filter((row) => {
      const r = String(row.role || "")
        .trim()
        .toLowerCase();

      return (
        r === "admin" ||
        r === "super admin"
      );
    }).length;

    return {
      total: users.length,
      active,
      administrators,
    };
  }, [users]);

  function openAddForm() {
    setEditingUser(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEditForm(row) {
    setEditingUser(row);

    setForm({
      id: row.id || "",
      fullName:
        row.fullName ||
        row.name ||
        "",
      email:
        row.email ||
        "",
      password: "",
      mobile:
        row.mobile ||
        row.phone ||
        "",
      role:
        row.role ||
        "User",
      status:
        row.status ||
        "Active",
      remarks:
        row.remarks ||
        "",
    });

    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingUser(null);
    setForm({ ...EMPTY_FORM });
  }

  function handleChange(event) {
    const { name, value } =
      event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleClearFilters() {
    setSearchText("");
    setRoleFilter("All");
    setStatusFilter("All");
  }

  async function handleStatusToggle(row) {
  const userId = row.id || "";
  const currentStatus =
    String(row.status || "Active").trim();

  const nextStatus =
    currentStatus === "Active"
      ? "Inactive"
      : "Active";

  if (!userId || statusUpdatingId) return;

  const payload = {
    id: userId,
    fullName:
      row.fullName ||
      row.name ||
      "",
    email: row.email || "",
    password: "",
    mobile:
      row.mobile ||
      row.phone ||
      "",
    role: row.role || "User",
    status: nextStatus,
    remarks: row.remarks || "",
  };

  try {
    setStatusUpdatingId(userId);

    setToast({
      open: true,
      type: "info",
      message:
        nextStatus === "Active"
          ? "Activating user..."
          : "Deactivating user...",
    });

    const result =
      await updateUser(payload);

    if (
      result &&
      result.success === false
    ) {
      throw new Error(
        result.error ||
        result.message ||
        "Unable to update user status."
      );
    }

    await loadUsers({
      forceRefresh: true,
    });

    setToast({
      open: true,
      type: "success",
      message:
        nextStatus === "Active"
          ? "User activated successfully."
          : "User deactivated successfully.",
    });
  } catch (err) {
    console.error(
      "Status update failed:",
      err
    );

    setToast({
      open: true,
      type: "error",
      message:
        err?.message ||
        "Unable to update user status.",
    });
  } finally {
    setStatusUpdatingId(null);
  }
}

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    const payload = {
      ...form,
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      mobile: form.mobile.trim(),
      remarks: form.remarks.trim(),
    };

    try {
      setSaving(true);

      setToast({
        open: true,
        type: "info",
        message: editingUser
          ? "Updating user..."
          : "Creating user...",
      });

      let result;

      if (editingUser) {
        result =
          await updateUser(payload);
      } else {
        result =
          await addUser(payload);
      }

      if (
        result &&
        result.success === false
      ) {
        throw new Error(
          result.error ||
          result.message ||
          "Unable to save user."
        );
      }

      await loadUsers({
        forceRefresh: true,
      });

      setToast({
        open: true,
        type: "success",
        message: editingUser
          ? payload.password
            ? "User updated and password reset successfully."
            : "User updated successfully."
          : "User created successfully.",
      });

      setShowForm(false);
      setEditingUser(null);
      setForm({ ...EMPTY_FORM });

    } catch (err) {
      console.error(
        "User save failed:",
        err
      );

      setToast({
        open: true,
        type: "error",
        message:
          err?.message ||
          "Unable to save user.",
      });

    } finally {
      setSaving(false);
    }
  }

  if (!canAccess) {
    return (
      <div style={accessDeniedStyle}>
        <h1
          style={{
            fontSize: "2rem",
            marginBottom: "1rem",
          }}
        >
          🚫 Access Denied
        </h1>

        <p>
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {toast.open && (
        <ProgressToast
          show={toast.open}
          type={toast.type}
          message={toast.message}
        />
      )}

      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            User Management
          </h1>

          <div style={subtitleStyle}>
            Manage CDMS users, roles,
            account status and admin password resets.
          </div>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          style={addBtnStyle}
        >
          + Add User
        </button>
      </div>

      {/* SUMMARY */}
      <div style={metricsGridStyle}>
        <MetricCard
          label="Total Users"
          value={summary.total}
          color="#2563eb"
        />

        <MetricCard
          label="Active Users"
          value={summary.active}
          color="#16a34a"
        />

        <MetricCard
          label="Administrators"
          value={summary.administrators}
          color="#ea580c"
        />
      </div>

      {/* FILTERS */}
      <div style={filterPanelStyle}>
        <div style={filterGridStyle}>
          <input
            type="text"
            placeholder="Search name, email or mobile..."
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
            style={filterInputStyle}
          />

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value
              )
            }
            style={filterInputStyle}
          >
            <option value="All">
              All Roles
            </option>
            <option value="Super Admin">
              Super Admin
            </option>
            <option value="Admin">
              Admin
            </option>
            <option value="User">
              User
            </option>
            <option value="Viewer">
              Viewer
            </option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            style={filterInputStyle}
          >
            <option value="All">
              All Status
            </option>
            <option value="Active">
              Active
            </option>
            <option value="Inactive">
              Inactive
            </option>
          </select>
        </div>

        <div style={filterFooterStyle}>
          <span style={recordCountStyle}>
            Showing{" "}
            <strong>
              {filteredUsers.length}
            </strong>{" "}
            of{" "}
            <strong>
              {users.length}
            </strong>{" "}
            users
          </span>

          <button
            type="button"
            onClick={handleClearFilters}
            style={clearBtnStyle}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* DESKTOP / TABLET TABLE */}
      <div
        className="user-management-desktop-table"
        style={tableCardStyle}
      >
        <div style={tableScrollStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>
                  Full Name
                </th>
                <th style={thStyle}>
                  Role
                </th>
                <th style={thStyle}>
                  Email
                </th>
                <th style={thStyle}>
                  Mobile
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
                  Actions
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
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={emptyStateStyle}
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(
                  (row) => (
                    <tr
                      key={
                        row.id ||
                        row.email
                      }
                    >
                      <td style={tdStyle}>
                        <strong>
                          {row.fullName ||
                            "-"}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        <RoleBadge
                          role={row.role}
                        />
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {row.email || "-"}
                      </td>

                      <td style={tdStyle}>
                        {row.mobile || "-"}
                      </td>

                      <td style={tdStyle}>
  <StatusToggle
    status={row.status}
    disabled={
      statusUpdatingId === row.id
    }
    onChange={() =>
      handleStatusToggle(row)
    }
  />
</td>

                      <td
                        style={{
                          ...tdStyle,
                          textAlign: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(
                              row
                            )
                          }
                          style={
                            editBtnStyle
                          }
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div
        className="user-management-mobile-list"
        style={{
          display: "none",
        }}
      >
        {loading ? (
          <div style={mobileEmptyStyle}>
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={mobileEmptyStyle}>
            No users found.
          </div>
        ) : (
          filteredUsers.map((row) => (
            <div
              key={
                row.id ||
                row.email
              }
              style={mobileCardStyle}
            >
              <div style={mobileCardHeaderStyle}>
                <div>
                  <div style={mobileNameStyle}>
                    {row.fullName || "-"}
                  </div>

                  <div
                    style={{
                      marginTop: "5px",
                    }}
                  >
                    <RoleBadge
                      role={row.role}
                    />
                  </div>
                </div>

                <StatusToggle
  status={row.status}
  disabled={
    statusUpdatingId === row.id
  }
  onChange={() =>
    handleStatusToggle(row)
  }
/>
              </div>

              <div style={mobileDetailGridStyle}>
                <MobileDetail
                  label="Email"
                  value={
                    row.email || "-"
                  }
                />

                <MobileDetail
                  label="Mobile"
                  value={
                    row.mobile || "-"
                  }
                />
              </div>

              <div style={mobileActionsStyle}>
                <button
                  type="button"
                  onClick={() =>
                    openEditForm(row)
                  }
                  style={editBtnStyle}
                >
                  ✏️ Edit User
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div
          style={overlayStyle}
          onClick={closeForm}
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
                  {editingUser
                    ? "Edit User"
                    : "Add New User"}
                </h2>

                <div style={modalSubtitleStyle}>
                  {editingUser
                    ? "Leave password blank unless you want to reset it."
                    : "Create a CDMS user and assign initial access credentials."}
                </div>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                style={closeBtnStyle}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              style={formStyle}
            >
              <div style={formGridStyle}>
                <Field label="Full Name *">
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Role *">
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    disabled={saving}
                    style={inputStyle}
                  >
                    <option value="Super Admin">
                      Super Admin
                    </option>
                    <option value="Admin">
                      Admin
                    </option>
                    <option value="User">
                      User
                    </option>
                    <option value="Viewer">
                      Viewer
                    </option>
                  </select>
                </Field>

                <Field label="Email *">
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    autoComplete="email"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Mobile">
                  <input
                    type="tel"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    disabled={saving}
                    inputMode="numeric"
                    autoComplete="tel"
                    style={inputStyle}
                  />
                </Field>

                <Field
                  label={
                    editingUser
                      ? "New Password"
                      : "Password *"
                  }
                  helpText={
                    editingUser
                      ? "Leave blank to keep the existing password."
                      : "Admin must share this initial password with the user."
                  }
                >
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required={
                      !editingUser
                    }
                    disabled={saving}
                    autoComplete="new-password"
                    style={inputStyle}
                  />
                </Field>

                
              </div>

              <Field label="Remarks">
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  disabled={saving}
                  style={{
                    ...inputStyle,
                    minHeight: "80px",
                    resize: "vertical",
                  }}
                />
              </Field>

              <div style={modalFooterStyle}>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  style={{
                    ...cancelBtnStyle,
                    opacity:
                      saving
                        ? 0.6
                        : 1,
                  }}
                >
                  Cancel
                </button>

                <button
  type="submit"
  disabled={saving}
  style={{
    ...saveBtnStyle,
    opacity: saving ? 0.7 : 1,
    cursor: saving
      ? "not-allowed"
      : "pointer",
  }}
>
  {saving
    ? "Saving..."
    : editingUser
      ? "Update User"
      : "Save User"}
</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>
        {`
          @media (max-width: 640px) {
            .user-management-desktop-table {
              display: none !important;
            }

            .user-management-mobile-list {
              display: grid !important;
              gap: 0.75rem;
            }
          }
        `}
      </style>
    </div>
  );
}

function RoleBadge({ role }) {
  const value =
    String(role || "User");

  const normalized =
    value.toLowerCase();

  let background = "#f1f5f9";
  let color = "#475569";

  if (
    normalized === "admin" ||
    normalized === "super admin"
  ) {
    background = "#eff6ff";
    color = "#1d4ed8";
  }

  return (
    <span
      style={{
        background,
        color,
        padding: "3px 8px",
        borderRadius: "5px",
        fontSize: "0.75rem",
        fontWeight: 700,
        display: "inline-flex",
      }}
    >
      {value}
    </span>
  );
}

function StatusBadge({ status }) {
  const active =
    String(status || "")
      .trim()
      .toLowerCase() === "active";

  return (
    <span
      style={{
        color: active
          ? "#166534"
          : "#991b1b",
        background: active
          ? "#dcfce7"
          : "#fee2e2",
        padding: "3px 9px",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 800,
        display: "inline-flex",
        whiteSpace: "nowrap",
      }}
    >
      {status || "-"}
    </span>
  );
}

function StatusToggle({
  status,
  disabled,
  onChange,
}) {
  const active =
    String(status || "")
      .trim()
      .toLowerCase() === "active";

  return (
    <div style={statusToggleRowStyle}>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={
          active
            ? "Deactivate user"
            : "Activate user"
        }
        disabled={disabled}
        onClick={onChange}
        style={{
          ...statusToggleStyle,
          background: active
            ? "#16a34a"
            : "#cbd5e1",
          opacity: disabled
            ? 0.6
            : 1,
          cursor: disabled
            ? "not-allowed"
            : "pointer",
        }}
      >
        <span
          style={{
            ...statusToggleKnobStyle,
            transform: active
              ? "translateX(22px)"
              : "translateX(0)",
          }}
        />
      </button>

      <span
        style={{
          ...statusToggleLabelStyle,
          color: active
            ? "#166534"
            : "#991b1b",
        }}
      >
        {disabled
          ? "Updating..."
          : active
            ? "Active"
            : "Inactive"}
      </span>
    </div>
  );
}


function Field({
  label,
  children,
  helpText,
}) {
  return (
    <div style={fieldStyle}>
      <label style={fieldLabelStyle}>
        {label}
      </label>

      {children}

      {helpText && (
        <div style={helpTextStyle}>
          {helpText}
        </div>
      )}
    </div>
  );
}

function MobileDetail({
  label,
  value,
}) {
  return (
    <div>
      <div style={mobileLabelStyle}>
        {label}
      </div>

      <div style={mobileValueStyle}>
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const pageStyle = {
  padding:
    "clamp(0.75rem, 2vw, 1.5rem)",
  maxWidth: "1200px",
  width: "100%",
  margin: "0 auto",
  boxSizing: "border-box",
  minWidth: 0,
};

const headerStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "1rem",
  marginBottom: "1rem",
};

const titleStyle = {
  margin: 0,
  fontSize: "1.5rem",
  color: "#1e293b",
  fontWeight: 800,
};

const subtitleStyle = {
  fontSize: "0.85rem",
  color: "#64748b",
  marginTop: "4px",
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "0.75rem",
  marginBottom: "1rem",
};

const filterPanelStyle = {
  background: "#ffffff",
  border:
    "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "1rem",
  marginBottom: "1rem",
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "0.75rem",
};

const filterInputStyle = {
  width: "100%",
  minWidth: 0,
  minHeight: "44px",
  padding: "0.65rem 0.75rem",
  border:
    "1px solid #cbd5e1",
  borderRadius: "8px",
  boxSizing: "border-box",
  background: "#ffffff",
  fontSize: "0.9rem",
};

const filterFooterStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "0.75rem",
  marginTop: "0.75rem",
};

const recordCountStyle = {
  fontSize: "0.82rem",
  color: "#64748b",
};

const clearBtnStyle = {
  minHeight: "44px",
  padding: "0.6rem 1rem",
  background: "#ffffff",
  border:
    "1px solid #cbd5e1",
  borderRadius: "8px",
  color: "#334155",
  cursor: "pointer",
  fontWeight: 600,
};

const tableCardStyle = {
  background: "#ffffff",
  borderRadius: "10px",
  boxShadow:
    "0 2px 5px rgba(0,0,0,0.08)",
  overflow: "hidden",
  border:
    "1px solid #e2e8f0",
};

const tableScrollStyle = {
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  minWidth: "800px",
  borderCollapse:
    "collapse",
  fontSize: "0.9rem",
};

const thStyle = {
  padding: "0.9rem 1rem",
  textAlign: "left",
  fontSize: "0.75rem",
  color: "#64748b",
  fontWeight: 700,
  textTransform:
    "uppercase",
  background: "#f8fafc",
  borderBottom:
    "1px solid #e2e8f0",
};

const tdStyle = {
  padding: "0.8rem 1rem",
  color: "#334155",
  borderBottom:
    "1px solid #f1f5f9",
  verticalAlign:
    "middle",
};

const emptyStateStyle = {
  padding: "3rem",
  textAlign: "center",
  color: "#64748b",
};

const addBtnStyle = {
  minHeight: "44px",
  background: "#2563eb",
  color: "#ffffff",
  border: "none",
  padding:
    "0.65rem 1.2rem",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "0.9rem",
  whiteSpace: "nowrap",
};

const editBtnStyle = {
  minHeight: "40px",
  background: "#eff6ff",
  color: "#2563eb",
  border: "none",
  padding:
    "0.5rem 0.85rem",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "0.82rem",
};

const mobileCardStyle = {
  background: "#ffffff",
  border:
    "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "1rem",
  boxShadow:
    "0 1px 3px rgba(15,23,42,0.06)",
};

const mobileCardHeaderStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems:
    "flex-start",
  gap: "0.75rem",
};

const mobileNameStyle = {
  fontSize: "1rem",
  fontWeight: 800,
  color: "#0f172a",
};

const mobileDetailGridStyle = {
  display: "grid",
  gap: "0.75rem",
  marginTop: "1rem",
};

const mobileLabelStyle = {
  fontSize: "0.7rem",
  color: "#94a3b8",
  fontWeight: 800,
  textTransform:
    "uppercase",
};

const mobileValueStyle = {
  fontSize: "0.88rem",
  color: "#334155",
  marginTop: "2px",
  overflowWrap: "anywhere",
};

const mobileActionsStyle = {
  display: "flex",
  justifyContent:
    "flex-end",
  marginTop: "1rem",
};

const mobileEmptyStyle = {
  background: "#ffffff",
  padding: "2rem",
  borderRadius: "10px",
  border:
    "1px solid #e2e8f0",
  textAlign: "center",
  color: "#64748b",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background:
    "rgba(0,0,0,0.55)",
  display: "flex",
  justifyContent:
    "center",
  alignItems: "center",
  zIndex: 1200,
  padding:
    "clamp(0.5rem, 2vw, 1rem)",
};

const modalStyle = {
  background: "#ffffff",
  width: "100%",
  maxWidth: "650px",
  maxHeight: "94dvh",
  overflowY: "auto",
  padding:
    "clamp(1rem, 3vw, 2rem)",
  borderRadius: "12px",
  boxShadow:
    "0 15px 35px rgba(0,0,0,0.18)",
  boxSizing: "border-box",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems:
    "flex-start",
  gap: "1rem",
  borderBottom:
    "1px solid #e2e8f0",
  paddingBottom: "1rem",
  marginBottom: "1rem",
};

const modalTitleStyle = {
  margin: 0,
  fontSize: "1.2rem",
  color: "#1e293b",
  fontWeight: 800,
};

const modalSubtitleStyle = {
  fontSize: "0.8rem",
  color: "#64748b",
  marginTop: "4px",
  lineHeight: 1.4,
};

const closeBtnStyle = {
  minWidth: "44px",
  minHeight: "44px",
  background:
    "transparent",
  border: "none",
  fontSize: "1.6rem",
  color: "#64748b",
  cursor: "pointer",
};

const formStyle = {
  display: "grid",
  gap: "1rem",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  minWidth: 0,
};

const fieldLabelStyle = {
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "#475569",
};

const helpTextStyle = {
  fontSize: "0.72rem",
  color: "#64748b",
  lineHeight: 1.35,
};

const inputStyle = {
  width: "100%",
  minWidth: 0,
  minHeight: "44px",
  padding: "0.65rem",
  borderRadius: "7px",
  border:
    "1px solid #cbd5e1",
  fontSize: "0.95rem",
  boxSizing: "border-box",
};

const modalFooterStyle = {
  display: "flex",
  justifyContent:
    "flex-end",
  flexWrap: "wrap",
  gap: "0.75rem",
  marginTop: "0.5rem",
  borderTop:
    "1px solid #e2e8f0",
  paddingTop: "1rem",
};

const cancelBtnStyle = {
  minHeight: "44px",
  padding:
    "0.65rem 1.2rem",
  background: "#ffffff",
  border:
    "1px solid #cbd5e1",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: 600,
};

const saveBtnStyle = {
  minHeight: "44px",
  padding:
    "0.65rem 1.2rem",
  background: "#2563eb",
  color: "#ffffff",
  border: "none",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: 700,
};

const accessDeniedStyle = {
  padding: "4rem",
  textAlign: "center",
  color: "#1e40af",
  background: "#eff6ff",
  minHeight: "100vh",
};

const statusToggleRowStyle = {
  minHeight: "44px",
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
};

const statusToggleStyle = {
  width: "48px",
  height: "26px",
  border: "none",
  borderRadius: "999px",
  padding: "3px",
  position: "relative",
  transition: "background 0.2s ease",
  flexShrink: 0,
};

const statusToggleKnobStyle = {
  width: "20px",
  height: "20px",
  display: "block",
  borderRadius: "50%",
  background: "#ffffff",
  boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
  transition: "transform 0.2s ease",
};

const statusToggleLabelStyle = {
  fontSize: "0.88rem",
  fontWeight: 700,
};