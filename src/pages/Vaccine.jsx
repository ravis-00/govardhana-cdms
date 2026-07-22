import React, { useEffect, useMemo, useState } from "react";
import {
  getVaccine,
  addVaccine,
  updateVaccine,
} from "../api/masterApi";
import PageHeader from "../components/common/PageHeader";
import MetricCard from "../components/common/MetricCard";
import SectionCard from "../components/common/SectionCard";

// =============================================================================
// HELPERS
// =============================================================================

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthDateRange() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    fromDate: toIsoDate(firstDay),
    toDate: toIsoDate(lastDay),
  };
}

function formatDisplayDate(value) {
  if (!value) return "";

  const text = String(value).trim();

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}-${month}-${year}`;
  }

  const displayMatch = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (displayMatch) return text;

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return `${String(parsed.getDate()).padStart(2, "0")}-${String(
      parsed.getMonth() + 1
    ).padStart(2, "0")}-${parsed.getFullYear()}`;
  }

  return text;
}

function normaliseIsoDate(value) {
  if (!value) return "";

  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const displayMatch = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (displayMatch) {
    return `${displayMatch[3]}-${displayMatch[2]}-${displayMatch[1]}`;
  }

  const parsed = new Date(text);

  if (Number.isNaN(parsed.getTime())) return "";

  return toIsoDate(parsed);
}

function getDueStatus(nextDueDate) {
  const dueDate = normaliseIsoDate(nextDueDate);

  if (!dueDate) {
    return {
      label: "Not Scheduled",
      key: "not-scheduled",
    };
  }

  const today = toIsoDate(new Date());

  if (dueDate === today) {
    return {
      label: "Due Today",
      key: "due-today",
    };
  }

  if (dueDate < today) {
    return {
      label: "Overdue",
      key: "overdue",
    };
  }

  return {
    label: "Upcoming",
    key: "upcoming",
  };
}

function getEmptyForm() {
  return {
    id: "",
    category: "",
    date: toIsoDate(new Date()),
    vaccineType: "",
    medicine: "",
    targetGroup: "",
    cowsCount: "",
    dosage: "",
    nextDueDate: "",
    doctorName: "",
    remarks: "",
  };
}

// =============================================================================
// PAGE
// =============================================================================

export default function Vaccine() {
  const initialDateRange = getCurrentMonthDateRange();

  const [fromDate, setFromDate] = useState(initialDateRange.fromDate);
  const [toDate, setToDate] = useState(initialDateRange.toDate);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dueStatusFilter, setDueStatusFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("add");
  const [form, setForm] = useState(getEmptyForm());
  const [selectedEntry, setSelectedEntry] = useState(null);

  const [toast, setToast] = useState({
    visible: false,
    type: "info",
    message: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const response = await getVaccine();

      const rawData = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const normalised = rawData.map((raw) => {
        const nextDueDate =
          raw.nextDueDate ||
          raw.next_due_date ||
          raw.next_due ||
          "";

        return {
          id:
            raw.id ||
            raw.batch_id ||
            raw.batchId ||
            "",

          date:
            raw.date ||
            raw.event_date ||
            "",

          category:
            raw.category ||
            raw.type ||
            raw.preventiveCareType ||
            raw.preventive_care_type ||
            "",

          vaccineType:
            raw.vaccineType ||
            raw.disease_targeted ||
            raw.disease ||
            raw.treatmentName ||
            raw.treatment_name ||
            "",

          medicine:
            raw.medicine ||
            raw.medicine_brand ||
            raw.medicineBrand ||
            "",

          targetGroup:
            raw.targetGroup ||
            raw.target_group ||
            raw.target ||
            "",

          cowsCount:
            raw.cowsCount ??
            raw.cows_count ??
            raw.count ??
            "",

          dosage:
            raw.dosage ||
            raw.dosage_per_cow ||
            raw.dose ||
            "",

          nextDueDate,

          doctorName:
            raw.doctorName ||
            raw.doctor_name ||
            raw.doctor ||
            raw.administeredBy ||
            raw.administered_by ||
            "",

          remarks:
            raw.remarks ||
            raw.notes ||
            "",

          dueStatus: getDueStatus(nextDueDate),
        };
      });

      normalised.sort((a, b) => {
        const dateA = normaliseIsoDate(a.date) || "";
        const dateB = normaliseIsoDate(b.date) || "";
        return dateB.localeCompare(dateA);
      });

      setRows(normalised);
    } catch (err) {
      console.error("Preventive care load failed:", err);
      setRows([]);
      setError(err?.message || "Unable to load preventive care records.");
    } finally {
      setLoading(false);
    }
  }

  const dateRangeRows = useMemo(() => {
    return rows.filter((row) => {
      const rowDate = normaliseIsoDate(row.date);

      if (!rowDate) return false;
      if (fromDate && rowDate < fromDate) return false;
      if (toDate && rowDate > toDate) return false;

      return true;
    });
  }, [rows, fromDate, toDate]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(
        rows
          .map((row) => String(row.category || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return dateRangeRows.filter((row) => {
      const searchableText = [
        row.id,
        row.category,
        row.vaccineType,
        row.medicine,
        row.targetGroup,
        row.cowsCount,
        row.dosage,
        row.doctorName,
        row.remarks,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesCategory =
        !categoryFilter ||
        String(row.category || "").toLowerCase() ===
          categoryFilter.toLowerCase();

      const matchesDueStatus =
        !dueStatusFilter ||
        row.dueStatus.key === dueStatusFilter;

      return matchesSearch && matchesCategory && matchesDueStatus;
    });
  }, [
    dateRangeRows,
    searchTerm,
    categoryFilter,
    dueStatusFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    fromDate,
    toDate,
    searchTerm,
    categoryFilter,
    dueStatusFilter,
    pageSize,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / pageSize)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const firstVisibleRecord =
    filteredRows.length === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;

  const lastVisibleRecord = Math.min(
    currentPage * pageSize,
    filteredRows.length
  );

  const metrics = useMemo(() => {
    return {
      total: rows.length,
      selectedPeriod: dateRangeRows.length,
      vaccinations: dateRangeRows.filter(
        (row) =>
          String(row.category || "").toLowerCase() ===
          "vaccination"
      ).length,
      deworming: dateRangeRows.filter(
        (row) =>
          String(row.category || "").toLowerCase() ===
          "deworming"
      ).length,
      upcoming: dateRangeRows.filter(
        (row) => row.dueStatus.key === "upcoming"
      ).length,
      dueToday: dateRangeRows.filter(
        (row) => row.dueStatus.key === "due-today"
      ).length,
      overdue: dateRangeRows.filter(
        (row) => row.dueStatus.key === "overdue"
      ).length,
    };
  }, [rows, dateRangeRows]);

  function showToast(message, type = "info") {
    setToast({
      visible: true,
      type,
      message,
    });
  }

  function hideToast() {
    setToast((previous) => ({
      ...previous,
      visible: false,
    }));
  }

  function showTemporaryToast(
    message,
    type = "success",
    duration = 3500
  ) {
    showToast(message, type);

    window.setTimeout(() => {
      hideToast();
    }, duration);
  }

  function clearFilters() {
    const currentRange = getCurrentMonthDateRange();

    setFromDate(currentRange.fromDate);
    setToDate(currentRange.toDate);
    setSearchTerm("");
    setCategoryFilter("");
    setDueStatusFilter("");
  }

  function openFormForAdd() {
    setMode("add");
    setForm(getEmptyForm());
    setShowForm(true);
  }

  function openFormForEdit(entry) {
    setMode("edit");

    setForm({
      id: entry.id || "",
      category: entry.category || "",
      date: normaliseIsoDate(entry.date),
      vaccineType: entry.vaccineType || "",
      medicine: entry.medicine || "",
      targetGroup: entry.targetGroup || "",
      cowsCount: entry.cowsCount ?? "",
      dosage: entry.dosage || "",
      nextDueDate: normaliseIsoDate(entry.nextDueDate),
      doctorName: entry.doctorName || "",
      remarks: entry.remarks || "",
    });

    setShowForm(true);
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

    if (!form.category) {
      showTemporaryToast(
        "Please select a preventive care type.",
        "error",
        4000
      );
      return;
    }

    if (!form.date) {
      showTemporaryToast(
        "Administration date is required.",
        "error",
        4000
      );
      return;
    }

    setSaving(true);

    showToast(
      mode === "add"
        ? "Please wait... Saving preventive care record."
        : "Please wait... Updating preventive care record.",
      "loading"
    );

    try {
      if (mode === "add") {
        await addVaccine(form);
      } else {
        await updateVaccine(form);
      }

      setShowForm(false);
      await loadData();

      showTemporaryToast(
        mode === "add"
          ? "Preventive care record saved successfully."
          : "Preventive care record updated successfully.",
        "success",
        3500
      );
    } catch (err) {
      console.error("Preventive care save failed:", err);

      showTemporaryToast(
        err?.message ||
          "Unable to save the preventive care record.",
        "error",
        5000
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={pageStyle}>
      {toast.visible && (
        <div
          className="preventive-toast-mobile"
          style={{
            ...toastStyle,
            ...(toast.type === "success"
              ? toastSuccessStyle
              : toast.type === "error"
                ? toastErrorStyle
                : toast.type === "loading"
                  ? toastLoadingStyle
                  : toastInfoStyle),
          }}
          role="status"
          aria-live="polite"
        >
          {toast.type === "loading" && (
            <span style={toastSpinnerStyle} />
          )}

          {toast.type === "success" && (
            <span style={toastIconStyle}>✓</span>
          )}

          {toast.type === "error" && (
            <span style={toastIconStyle}>!</span>
          )}

          <span>{toast.message}</span>

          {toast.type !== "loading" && (
            <button
              type="button"
              onClick={hideToast}
              style={toastCloseStyle}
              aria-label="Close notification"
            >
              ×
            </button>
          )}
        </div>
      )}

      <style>
        {`
          @keyframes preventive-toast-spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 640px) {
            .preventive-toast-mobile {
              left: 16px;
              right: 16px;
              min-width: 0;
            }
          }
        `}
      </style>

      <PageHeader
        title="Preventive Care"
        description="Manage vaccinations, deworming and scheduled preventive treatments."
        countText={`Showing ${filteredRows.length} of ${rows.length} records`}
        action={
          <button
            type="button"
            onClick={openFormForAdd}
            className="btn btn-primary"
            style={{ whiteSpace: "nowrap" }}
          >
            + Add Preventive Care
          </button>
        }
      />

      <div style={metricsWrapperStyle}>
        <MetricCard
          label="Total Records"
          value={metrics.total}
          color="#2563eb"
        />

        <MetricCard
          label="Selected Period"
          value={metrics.selectedPeriod}
          color="#ea580c"
        />

        <MetricCard
          label="Vaccinations"
          value={metrics.vaccinations}
          color="#16a34a"
        />

        <MetricCard
          label="Deworming"
          value={metrics.deworming}
          color="#7c3aed"
        />

        <MetricCard
          label="Upcoming"
          value={metrics.upcoming}
          color="#0891b2"
        />

        <MetricCard
          label="Due Today"
          value={metrics.dueToday}
          color="#d97706"
        />

        <MetricCard
          label="Overdue"
          value={metrics.overdue}
          color="#dc2626"
        />
      </div>

      <SectionCard title="Search & Filters">
        <div style={filtersGridStyle}>
          <Field label="Search">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              className="form-input"
              placeholder="Disease, medicine, target group or doctor"
            />
          </Field>

          <Field label="From Date">
            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(event.target.value)
              }
              className="form-input"
              max={toDate || undefined}
            />
          </Field>

          <Field label="To Date">
            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(event.target.value)
              }
              className="form-input"
              min={fromDate || undefined}
            />
          </Field>

          <Field label="Preventive Care Type">
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="form-select"
            >
              <option value="">All Types</option>

              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Due Status">
            <select
              value={dueStatusFilter}
              onChange={(event) =>
                setDueStatusFilter(event.target.value)
              }
              className="form-select"
            >
              <option value="">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="due-today">Due Today</option>
              <option value="overdue">Overdue</option>
              <option value="not-scheduled">
                Not Scheduled
              </option>
            </select>
          </Field>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </SectionCard>

      {error && (
        <div style={errorBannerStyle}>
          {error}
        </div>
      )}

      <div style={tableToolbarStyle}>
        <div style={tableRecordCountStyle}>
          Showing {firstVisibleRecord}-{lastVisibleRecord} of{" "}
          {filteredRows.length} filtered records
          {filteredRows.length !== rows.length && (
            <span style={tableRecordTotalStyle}>
              {" "}
              ({rows.length} total)
            </span>
          )}
        </div>

        <div style={paginationControlsStyle}>
          <label style={pageSizeLabelStyle}>
            Rows per page
            <select
              value={pageSize}
              onChange={(event) =>
                setPageSize(Number(event.target.value))
              }
              className="form-select"
              style={pageSizeSelectStyle}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setCurrentPage((page) => Math.max(1, page - 1))
            }
            disabled={currentPage <= 1}
            style={paginationButtonStyle}
          >
            Previous
          </button>

          <span style={pageIndicatorStyle}>
            Page {filteredRows.length === 0 ? 0 : currentPage} of{" "}
            {filteredRows.length === 0 ? 0 : totalPages}
          </span>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(totalPages, page + 1)
              )
            }
            disabled={
              filteredRows.length === 0 ||
              currentPage >= totalPages
            }
            style={paginationButtonStyle}
          >
            Next
          </button>
        </div>
      </div>

      <div style={tableCardStyle} className="card">
        <div style={tableScrollStyle}>
          <table style={tableStyle}>
            <thead style={tableHeadStyle}>
              <tr>
                <th style={{ ...thStyle, ...dateColumnHeaderStyle }}>
                  Date
                </th>
                <th style={thStyle}>Care Type</th>
                <th style={thStyle}>Disease / Vaccine</th>
                <th style={thStyle}>Medicine</th>
                <th style={thStyle}>Target Group</th>
                <th style={thStyle}>Next Due</th>
                <th style={thStyle}>Due Status</th>
                <th style={{ ...thStyle, textAlign: "center" }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={emptyStateStyle}>
                    Loading preventive care records...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={emptyStateStyle}>
                    No preventive care records match the selected
                    filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, index) => (
                  <tr
                    key={
                      row.id ||
                      `${row.date}-${row.category}-${row.vaccineType}-${index}`
                    }
                    onClick={() => setSelectedEntry(row)}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      backgroundColor:
                        index % 2 === 0
                          ? "#ffffff"
                          : "#f8fafc",
                      cursor: "pointer",
                    }}
                    title="Click to view preventive care details"
                  >
                    <td style={{ ...tdStyle, ...dateColumnCellStyle }}>
                      <strong style={{ color: "#0f172a" }}>
                        {formatDisplayDate(row.date) || "-"}
                      </strong>
                    </td>

                    <td style={tdStyle}>
                      <CareTypeBadge value={row.category} />
                    </td>

                    <td style={tdStyle}>
                      <div style={primaryCellTextStyle}>
                        {row.vaccineType || "-"}
                      </div>
                    </td>

                    <td style={tdStyle}>
                      {row.medicine || "-"}
                    </td>

                    <td style={tdStyle}>
                      <div style={primaryCellTextStyle}>
                        {row.targetGroup || "-"}
                      </div>

                      {row.cowsCount !== "" &&
                        row.cowsCount !== null &&
                        row.cowsCount !== undefined && (
                          <div style={secondaryCellTextStyle}>
                            Cattle Count: {row.cowsCount}
                          </div>
                        )}
                    </td>

                    <td style={tdStyle}>
                      {formatDisplayDate(row.nextDueDate) || "-"}
                    </td>

                    <td style={tdStyle}>
                      <DueStatusBadge status={row.dueStatus} />
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openFormForEdit(row);
                        }}
                        style={iconBtnStyle}
                        title="Edit preventive care record"
                        aria-label="Edit preventive care record"
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div
          style={overlayStyle}
          onClick={() => {
            if (!saving) setShowForm(false);
          }}
        >
          <div
            style={{
              ...modalStyle,
              maxWidth: "760px",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>
                  {mode === "add"
                    ? "Add Preventive Care"
                    : "Edit Preventive Care"}
                </h2>

                <p style={modalDescriptionStyle}>
                  Record vaccination, deworming and follow-up
                  information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={closeButtonStyle}
                disabled={saving}
                aria-label="Close preventive care form"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: "grid", gap: "1rem" }}
            >
              <SectionCard title="Preventive Care Details">
                <div style={twoColumnGridStyle}>
                  <Field label="Preventive Care Type *">
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="form-select"
                      required
                      disabled={saving}
                    >
                      <option value="">Select Type</option>
                      <option value="Vaccination">
                        Vaccination
                      </option>
                      <option value="Deworming">
                        Deworming
                      </option>
                    </select>
                  </Field>

                  <Field label="Administration Date *">
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      className="form-input"
                      required
                      disabled={saving}
                    />
                  </Field>
                </div>

                <Field label="Disease Targeted / Vaccine Type">
                  <input
                    type="text"
                    name="vaccineType"
                    value={form.vaccineType}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Example: FMD, Brucellosis or deworming treatment"
                    disabled={saving}
                  />
                </Field>

                <div style={twoColumnGridStyle}>
                  <Field label="Medicine / Vaccine Brand">
                    <input
                      type="text"
                      name="medicine"
                      value={form.medicine}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Example: Raksha-Ovac or Ivermectin"
                      disabled={saving}
                    />
                  </Field>

                  <Field label="Dosage Per Cow">
                    <input
                      type="text"
                      name="dosage"
                      value={form.dosage}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Example: 5 ml"
                      disabled={saving}
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="Target Group">
                <div style={twoColumnGridStyle}>
                  <Field label="Target Group">
                    <input
                      type="text"
                      name="targetGroup"
                      value={form.targetGroup}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Example: All cows, calves or a named shed"
                      disabled={saving}
                    />
                  </Field>

                  <Field label="Cattle Count">
                    <input
                      type="number"
                      min="0"
                      name="cowsCount"
                      value={form.cowsCount}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="0"
                      disabled={saving}
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="Follow-up & Notes">
                <div style={twoColumnGridStyle}>
                  <Field label="Next Due Date">
                    <input
                      type="date"
                      name="nextDueDate"
                      value={form.nextDueDate}
                      onChange={handleChange}
                      className="form-input"
                      min={form.date || undefined}
                      disabled={saving}
                    />
                  </Field>

                  <Field label="Doctor / Administered By">
                    <input
                      type="text"
                      name="doctorName"
                      value={form.doctorName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter doctor or staff name"
                      disabled={saving}
                    />
                  </Field>
                </div>

                <Field label="Remarks">
                  <textarea
                    name="remarks"
                    value={form.remarks}
                    onChange={handleChange}
                    className="form-input"
                    rows={4}
                    placeholder="Enter observations, instructions or follow-up notes"
                    disabled={saving}
                    style={{
                      resize: "vertical",
                      minHeight: "90px",
                    }}
                  />
                </Field>
              </SectionCard>

              <div style={modalActionsStyle}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary btn-full-mobile"
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !form.category ||
                    !form.date
                  }
                  className="btn btn-primary btn-full-mobile"
                >
                  {saving
                    ? mode === "add"
                      ? "Saving..."
                      : "Updating..."
                    : mode === "add"
                      ? "Save Preventive Care"
                      : "Update Preventive Care"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedEntry && (
        <div
          style={overlayStyle}
          onClick={() => setSelectedEntry(null)}
        >
          <div
            style={{
              ...modalStyle,
              maxWidth: "760px",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>
                  Preventive Care Details
                </h2>

                <p style={modalDescriptionStyle}>
                  Transaction ID:{" "}
                  <strong style={{ color: "#0f172a" }}>
                    {selectedEntry.id || "-"}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                style={closeButtonStyle}
                aria-label="Close preventive care details"
              >
                &times;
              </button>
            </div>

            <div style={{ display: "grid", gap: "1rem" }}>
              <SectionCard title="Administration">
                <div style={detailGridStyle}>
                  <DetailItem
                    label="Administration Date"
                    value={formatDisplayDate(
                      selectedEntry.date
                    )}
                  />

                  <DetailItem
                    label="Preventive Care Type"
                    value={selectedEntry.category}
                  />

                  <DetailItem
                    label="Disease / Vaccine"
                    value={selectedEntry.vaccineType}
                  />

                  <DetailItem
                    label="Medicine / Brand"
                    value={selectedEntry.medicine}
                  />

                  <DetailItem
                    label="Dosage Per Cow"
                    value={selectedEntry.dosage}
                  />

                  <DetailItem
                    label="Doctor / Administered By"
                    value={selectedEntry.doctorName}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Target Group">
                <div style={detailGridStyle}>
                  <DetailItem
                    label="Target Group"
                    value={selectedEntry.targetGroup}
                  />

                  <DetailItem
                    label="Cattle Count"
                    value={selectedEntry.cowsCount}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Follow-up">
                <div style={detailGridStyle}>
                  <DetailItem
                    label="Next Due Date"
                    value={formatDisplayDate(
                      selectedEntry.nextDueDate
                    )}
                  />

                  <div>
                    <div style={detailLabelStyle}>
                      Due Status
                    </div>
                    <div style={{ marginTop: "0.3rem" }}>
                      <DueStatusBadge
                        status={selectedEntry.dueStatus}
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Remarks">
                <DetailItem
                  label="Remarks"
                  value={selectedEntry.remarks}
                />
              </SectionCard>
            </div>

            <div style={modalActionsStyle}>
              <button
                type="button"
                onClick={() => {
                  const entryToEdit = selectedEntry;
                  setSelectedEntry(null);
                  openFormForEdit(entryToEdit);
                }}
                className="btn btn-primary"
              >
                Edit This Entry
              </button>

              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SMALL COMPONENTS
// =============================================================================

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <label style={fieldLabelStyle}>
        {label}
      </label>
      {children}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div style={detailItemStyle}>
      <div style={detailLabelStyle}>{label}</div>
      <div style={detailValueStyle}>{value || "-"}</div>
    </div>
  );
}

function CareTypeBadge({ value }) {
  const category = String(value || "").toLowerCase();

  const style =
    category === "vaccination"
      ? careTypeVaccinationStyle
      : category === "deworming"
        ? careTypeDewormingStyle
        : careTypeDefaultStyle;

  return (
    <span style={{ ...badgeBaseStyle, ...style }}>
      {value || "Not Recorded"}
    </span>
  );
}

function DueStatusBadge({ status }) {
  const safeStatus =
    status || {
      label: "Not Scheduled",
      key: "not-scheduled",
    };

  const style =
    safeStatus.key === "upcoming"
      ? dueUpcomingStyle
      : safeStatus.key === "due-today"
        ? dueTodayStyle
        : safeStatus.key === "overdue"
          ? dueOverdueStyle
          : dueNotScheduledStyle;

  return (
    <span style={{ ...badgeBaseStyle, ...style }}>
      {safeStatus.label}
    </span>
  );
}

// =============================================================================
// STYLES
// =============================================================================

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
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "0.85rem",
  alignItems: "end",
};

const twoColumnGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};

const tableToolbarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "0.75rem",
  flexWrap: "wrap",
  marginBottom: "0.65rem",
  padding: "0 0.1rem",
};

const tableRecordCountStyle = {
  fontSize: "0.82rem",
  color: "#475569",
  fontWeight: 700,
};

const tableRecordTotalStyle = {
  color: "#64748b",
  fontWeight: 600,
};

const paginationControlsStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "0.5rem",
  flexWrap: "wrap",
};

const pageSizeLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.45rem",
  fontSize: "0.78rem",
  color: "#475569",
  fontWeight: 700,
};

const pageSizeSelectStyle = {
  width: "74px",
  minWidth: "74px",
  padding: "0.38rem 0.5rem",
};

const paginationButtonStyle = {
  padding: "0.42rem 0.7rem",
  minHeight: "34px",
};

const pageIndicatorStyle = {
  minWidth: "88px",
  textAlign: "center",
  fontSize: "0.8rem",
  color: "#334155",
  fontWeight: 700,
};

const tableCardStyle = {
  padding: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  minHeight: "380px",
  maxHeight: "calc(100vh - 410px)",
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
  minWidth: "1120px",
};

const tableHeadStyle = {
  background: "#f8fafc",
  borderBottom: "2px solid #e2e8f0",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const dateColumnHeaderStyle = {
  width: "112px",
  minWidth: "112px",
  whiteSpace: "nowrap",
};

const dateColumnCellStyle = {
  width: "112px",
  minWidth: "112px",
  whiteSpace: "nowrap",
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
  borderBottom: "1px solid #f1f5f9",
  color: "#1f2937",
  verticalAlign: "top",
};

const primaryCellTextStyle = {
  maxWidth: "280px",
  lineHeight: 1.4,
};

const secondaryCellTextStyle = {
  marginTop: "0.25rem",
  fontSize: "0.78rem",
  color: "#64748b",
};

const iconBtnStyle = {
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "1rem",
  padding: "0.25rem 0.45rem",
};

const emptyStateStyle = {
  padding: "3rem",
  textAlign: "center",
  color: "#64748b",
};

const errorBannerStyle = {
  marginBottom: "1rem",
  padding: "0.75rem 1rem",
  borderRadius: "8px",
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  fontSize: "0.9rem",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 50,
  padding: "1rem",
};

const modalStyle = {
  background: "white",
  padding: "1.25rem",
  borderRadius: "12px",
  width: "100%",
  maxWidth: "600px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
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
  color: "#64748b",
  fontSize: "0.85rem",
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "1rem",
  marginTop: "0.5rem",
  flexWrap: "wrap",
};

const closeButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "1.5rem",
  color: "#64748b",
  cursor: "pointer",
};

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "1rem",
  fontSize: "0.95rem",
};

const detailItemStyle = {
  borderBottom: "1px dashed #e5e7eb",
  paddingBottom: "0.4rem",
};

const detailLabelStyle = {
  fontSize: "0.72rem",
  color: "#64748b",
  textTransform: "uppercase",
  fontWeight: 800,
};

const detailValueStyle = {
  marginTop: "0.2rem",
  fontWeight: 600,
  fontSize: "0.95rem",
  color: "#0f172a",
  lineHeight: 1.45,
};

const fieldLabelStyle = {
  display: "block",
  fontSize: "0.8rem",
  color: "#374151",
  marginBottom: "0.3rem",
  fontWeight: 600,
};

const badgeBaseStyle = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "0.24rem 0.55rem",
  fontSize: "0.72rem",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const careTypeVaccinationStyle = {
  background: "#ecfdf5",
  border: "1px solid #86efac",
  color: "#047857",
};

const careTypeDewormingStyle = {
  background: "#fff7ed",
  border: "1px solid #fdba74",
  color: "#c2410c",
};

const careTypeDefaultStyle = {
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
  color: "#475569",
};

const dueUpcomingStyle = {
  background: "#eff6ff",
  border: "1px solid #93c5fd",
  color: "#1d4ed8",
};

const dueTodayStyle = {
  background: "#fffbeb",
  border: "1px solid #fcd34d",
  color: "#b45309",
};

const dueOverdueStyle = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#b91c1c",
};

const dueNotScheduledStyle = {
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  color: "#64748b",
};

const toastStyle = {
  position: "fixed",
  top: "76px",
  right: "24px",
  zIndex: 200,
  display: "flex",
  alignItems: "center",
  gap: "0.65rem",
  minWidth: "280px",
  maxWidth: "420px",
  padding: "0.85rem 1rem",
  borderRadius: "10px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.18)",
  fontSize: "0.88rem",
  fontWeight: 700,
};

const toastSuccessStyle = {
  background: "#f0fdf4",
  border: "1px solid #86efac",
  color: "#166534",
};

const toastErrorStyle = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#b91c1c",
};

const toastLoadingStyle = {
  background: "#fff7ed",
  border: "1px solid #fdba74",
  color: "#c2410c",
};

const toastInfoStyle = {
  background: "#eff6ff",
  border: "1px solid #93c5fd",
  color: "#1d4ed8",
};

const toastIconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "22px",
  height: "22px",
  borderRadius: "50%",
  border: "1px solid currentColor",
  fontSize: "0.78rem",
  flexShrink: 0,
};

const toastSpinnerStyle = {
  width: "18px",
  height: "18px",
  border: "2px solid rgba(194, 65, 12, 0.25)",
  borderTopColor: "#c2410c",
  borderRadius: "50%",
  animation: "preventive-toast-spin 0.8s linear infinite",
  flexShrink: 0,
};

const toastCloseStyle = {
  marginLeft: "auto",
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  fontSize: "1.2rem",
  lineHeight: 1,
  padding: 0,
  };