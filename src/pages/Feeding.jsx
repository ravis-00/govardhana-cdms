import React, { useEffect, useMemo, useState } from "react";
import {
  getFeeding,
  addFeeding,
  updateFeeding,
} from "../api/masterApi";

const FEED_TYPES = [
  "Green Fodder",
  "Dry Fodder",
  "Concentrate",
  "Silage",
  "Mineral Mixture",
  "General Mix",
  "Other Feed",
];

const SHED_CONFIG = [
  {
    key: "nandini",
    label: "Nandini",
    backendName: "Nandini Shed",
  },
  {
    key: "surabhi",
    label: "Surabhi",
    backendName: "Surabhi Shed",
  },
  {
    key: "kaveri",
    label: "Kaveri",
    backendName: "Kaveri Shed",
  },
  {
    key: "kamadhenu",
    label: "Kamadhenu",
    backendName: "Kamadhenu Shed",
  },
  {
    key: "jayadeva",
    label: "Jayadeva",
    backendName: "Jayadeva Shed",
  },
  {
    key: "nandiniOld",
    label: "Nandini Old",
    backendName: "Nandini Old Shed",
  },
];

function getDefaultDateRange() {
  const today = new Date();

  const toIso = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const firstDayOfMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  return {
    fromDate: toIso(firstDayOfMonth),
    toDate: toIso(today),
  };
}

function getTodayIsoDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normaliseDate(value) {
  if (!value) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const stringValue = String(value).trim();

  if (!stringValue) return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(stringValue)) {
    return stringValue.slice(0, 10);
  }

  const displayDateMatch = stringValue.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
  );

  if (displayDateMatch) {
    const day = String(displayDateMatch[1]).padStart(2, "0");
    const month = String(displayDateMatch[2]).padStart(2, "0");
    const year = displayDateMatch[3];

    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(stringValue);

  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return "";
}

function formatDisplayDate(value) {
  const isoDate = normaliseDate(value);

  if (!isoDate) return "-";

  const [year, month, day] = isoDate.split("-");

  return `${day}-${month}-${year}`;
}

function toNumber(value) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function roundQuantity(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

function normaliseText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getShedKey(shedName) {
  const normalisedShed = normaliseText(shedName);

  if (
    normalisedShed.includes("nandini") &&
    normalisedShed.includes("old")
  ) {
    return "nandiniOld";
  }

  if (normalisedShed.includes("nandini")) {
    return "nandini";
  }

  if (normalisedShed.includes("surabhi")) {
    return "surabhi";
  }

  if (normalisedShed.includes("kaveri")) {
    return "kaveri";
  }

  if (normalisedShed.includes("kamadhenu")) {
    return "kamadhenu";
  }

  if (normalisedShed.includes("jayadeva")) {
    return "jayadeva";
  }

  return "";
}

function getEmptyTransactionIds() {
  return {
    nandini: "",
    surabhi: "",
    kaveri: "",
    kamadhenu: "",
    jayadeva: "",
    nandiniOld: "",
  };
}

function getEmptyForm() {
  return {
    date: getTodayIsoDate(),
    feedType: "",
    recordedBy: "",
    nandini: "",
    surabhi: "",
    kaveri: "",
    kamadhenu: "",
    jayadeva: "",
    nandiniOld: "",
    totalKg: 0,
    remarks: "",
    transactionIds: getEmptyTransactionIds(),
    originalDate: "",
    originalFeedType: "",
  };
}

function extractApiRows(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

function groupFeedingRows(rawRows) {
  const grouped = {};

  rawRows.forEach((item) => {
    const date = normaliseDate(item.date);

    const feedType = String(
      item.feedType ||
        item.feed_type ||
        "General Mix"
    ).trim();

    if (!date) return;

    /*
     * One frontend row represents:
     * date + feed type
     *
     * The six backend shed rows are merged into this one object.
     */
    const groupKey = `${date}__${normaliseText(feedType)}`;

    if (!grouped[groupKey]) {
      grouped[groupKey] = {
        id: groupKey,
        date,
        feedType,
        recordedBy: "",
        remarks: "",
        nandini: 0,
        surabhi: 0,
        kaveri: 0,
        kamadhenu: 0,
        jayadeva: 0,
        nandiniOld: 0,
        totalKg: 0,
        transactionIds: getEmptyTransactionIds(),
      };
    }

    const shedName =
      item.shedName ||
      item.shed_name ||
      "";

    const shedKey = getShedKey(shedName);

    const quantity = roundQuantity(
      item.quantityKg ??
        item.quantity_kg ??
        item.quantity ??
        0
    );

    const transactionId = String(
      item.transactionId ||
        item.transaction_id ||
        ""
    ).trim();

    if (shedKey) {
      grouped[groupKey][shedKey] = roundQuantity(
        grouped[groupKey][shedKey] + quantity
      );

      grouped[groupKey].transactionIds[shedKey] =
        transactionId;
    }

    grouped[groupKey].totalKg = roundQuantity(
      grouped[groupKey].totalKg + quantity
    );

    const recordedBy = String(
      item.recordedBy ||
        item.recorded_by ||
        ""
    ).trim();

    const remarks = String(item.remarks || "").trim();

    if (
      !grouped[groupKey].recordedBy &&
      recordedBy
    ) {
      grouped[groupKey].recordedBy =
        recordedBy;
    }

    if (
      !grouped[groupKey].remarks &&
      remarks
    ) {
      grouped[groupKey].remarks =
        remarks;
    }
  });

  return Object.values(grouped).sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1;
    }

    return String(a.feedType).localeCompare(
      String(b.feedType)
    );
  });
}

function calculateFormTotal(formData) {
  return roundQuantity(
    SHED_CONFIG.reduce((total, shed) => {
      return total + toNumber(formData[shed.key]);
    }, 0)
  );
}

export default function Feeding() {
 const defaultDateRange = getDefaultDateRange();

const [fromDate, setFromDate] = useState(
  defaultDateRange.fromDate
);

const [feedTypeFilter, setFeedTypeFilter] =
  useState("");

const [shedFilter, setShedFilter] =
  useState("");

const [toDate, setToDate] = useState(
  defaultDateRange.toDate
);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] =
    useState(false);

  const [form, setForm] = useState(
    getEmptyForm()
  );

  const [selectedEntry, setSelectedEntry] =
    useState(null);

  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  useEffect(() => {
  let active = true;

  async function initialise() {
    try {
      await loadData();
    } catch (error) {
      if (active) {
        showToast(
          "error",
          error?.message ||
            "Unable to load Feeding records."
        );
      }
    }
  }

  initialise();

  return () => {
    active = false;
  };
}, []);

  useEffect(() => {
    if (!toast.show) return undefined;

    const timer = window.setTimeout(() => {
      setToast((previous) => ({
        ...previous,
        show: false,
      }));
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [toast.show]);

  function showToast(type, message) {
    setToast({
      show: true,
      type,
      message,
    });
  }

  async function loadData(
  options = {}
) {
  const {
    preserveRows = false,
    retryOnAbort = true,
    forceRefresh = false,
  } = options;

  setLoading(true);
  setLoadError("");

  try {
    let response;

    try {
      response = await getFeeding({
        forceRefresh,
      });
    } catch (firstError) {
      const errorName =
        String(
          firstError?.name || ""
        ).toLowerCase();

      const errorMessage =
        String(
          firstError?.message || ""
        ).toLowerCase();

      const wasAborted =
        errorName === "aborterror" ||
        errorMessage.includes("abort") ||
        errorMessage.includes(
          "signal is aborted"
        );

      if (
        !retryOnAbort ||
        !wasAborted
      ) {
        throw firstError;
      }

      /*
       * Google Apps Script redirects can occasionally produce
       * a transient aborted GET. Retry once after a short pause.
       */
      await new Promise((resolve) => {
        window.setTimeout(
          resolve,
          1200
        );
      });

      response = await getFeeding({
        forceRefresh: true,
      });
    }

    const rawRows =
      extractApiRows(response);

    const groupedRows =
      groupFeedingRows(rawRows);

    setRows(groupedRows);
    setLoadError("");

    return groupedRows;
  } catch (error) {
    console.error(
      "Unable to load Feeding:",
      error
    );

    const message =
      error?.message ||
      "Unable to load Feeding records.";

    setLoadError(message);

    /*
     * During a post-save refresh, retain the previous table
     * instead of replacing it with an empty error state.
     */
    if (!preserveRows) {
      setRows([]);
    }

    throw error;
  } finally {
    setLoading(false);
  }
}
  const filteredRows = useMemo(() => {
  return rows.filter((row) => {
    const rowDate = normaliseDate(row.date);

    if (!rowDate) {
      return false;
    }

    if (fromDate && rowDate < fromDate) {
      return false;
    }

    if (toDate && rowDate > toDate) {
      return false;
    }

    if (
      feedTypeFilter &&
      normaliseText(row.feedType) !==
        normaliseText(feedTypeFilter)
    ) {
      return false;
    }

    /*
     * When a shed is selected, show only records
     * where that shed received a quantity greater than zero.
     */
    if (
      shedFilter &&
      toNumber(row[shedFilter]) <= 0
    ) {
      return false;
    }

    return true;
  });
}, [
  rows,
  fromDate,
  toDate,
  feedTypeFilter,
  shedFilter,
]);
  const feedMetrics = useMemo(() => {
  const metrics = {
    total: 0,
    greenFodder: 0,
    dryFodder: 0,
    concentrate: 0,
    others: 0,
  };

  filteredRows.forEach((row) => {
    const quantity = shedFilter
  ? toNumber(row[shedFilter])
  : toNumber(row.totalKg);
    const feedType = normaliseText(row.feedType);

    metrics.total += quantity;

    if (feedType === "green fodder") {
      metrics.greenFodder += quantity;
    } else if (feedType === "dry fodder") {
      metrics.dryFodder += quantity;
    } else if (feedType === "concentrate") {
      metrics.concentrate += quantity;
    } else {
      metrics.others += quantity;
    }
  });

  return {
    total: roundQuantity(metrics.total),
    greenFodder: roundQuantity(metrics.greenFodder),
    dryFodder: roundQuantity(metrics.dryFodder),
    concentrate: roundQuantity(metrics.concentrate),
    others: roundQuantity(metrics.others),
  };
}, [filteredRows, shedFilter]);

  function openAddForm() {
  setIsEditMode(false);

  setForm({
    ...getEmptyForm(),
    date: getTodayIsoDate(),
  });

  setShowForm(true);
}

  function openEditForm(row) {
    setIsEditMode(true);

    setForm({
      date: row.date,
      feedType:
        row.feedType || "General Mix",
      recordedBy:
        row.recordedBy || "",
      nandini:
        row.nandini || "",
      surabhi:
        row.surabhi || "",
      kaveri:
        row.kaveri || "",
      kamadhenu:
        row.kamadhenu || "",
      jayadeva:
        row.jayadeva || "",
      nandiniOld:
        row.nandiniOld || "",
      totalKg:
        row.totalKg || 0,
      remarks:
        row.remarks || "",
      transactionIds: {
        ...getEmptyTransactionIds(),
        ...(row.transactionIds || {}),
      },
      originalDate:
        row.date || "",
      originalFeedType:
        row.feedType || "",
    });

    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setIsEditMode(false);
    setForm(getEmptyForm());
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      };

      const isQuantityField =
        SHED_CONFIG.some(
          (shed) => shed.key === name
        );

      if (isQuantityField) {
        updated.totalKg =
          calculateFormTotal(updated);
      }

      return updated;
    });
  }

  function validateForm() {
    if (!form.date) {
      return "Date is required.";
    }

    if (!form.feedType) {
      return "Feed Type is required.";
    }

    if (!form.recordedBy.trim()) {
      return "Recorded By is required.";
    }

    for (const shed of SHED_CONFIG) {
      const quantity = toNumber(form[shed.key]);

      if (quantity < 0) {
        return `${shed.label} quantity cannot be negative.`;
      }
    }

    if (calculateFormTotal(form) <= 0) {
      return "Enter feeding quantity for at least one shed.";
    }

    return "";
  }

  async function handleSubmit(event) {
  event.preventDefault();

  if (saving) return;

  const validationMessage =
    validateForm();

  if (validationMessage) {
    showToast(
      "error",
      validationMessage
    );
    return;
  }

  const payload = {
    date: form.date,
    feedType: form.feedType,
    recordedBy:
      form.recordedBy.trim(),

    nandini:
      toNumber(form.nandini),

    surabhi:
      toNumber(form.surabhi),

    kaveri:
      toNumber(form.kaveri),

    kamadhenu:
      toNumber(form.kamadhenu),

    jayadeva:
      toNumber(form.jayadeva),

    nandiniOld:
      toNumber(form.nandiniOld),

    remarks:
      form.remarks.trim(),

    transactionIds: {
      ...getEmptyTransactionIds(),
      ...(form.transactionIds || {}),
    },

    originalDate:
      form.originalDate ||
      form.date,

    originalFeedType:
      form.originalFeedType ||
      form.feedType,
  };

  const wasEditMode =
    isEditMode;

  setSaving(true);

  showToast(
    "info",
    wasEditMode
      ? "Updating feeding entry..."
      : "Saving feeding entry..."
  );

  try {
    const response =
      wasEditMode
        ? await updateFeeding(payload)
        : await addFeeding(payload);

    if (
      response?.success === false
    ) {
      throw new Error(
        response.error ||
          response.message ||
          "Backend rejected the Feeding entry."
      );
    }

    /*
     * Backend save/update has completed successfully.
     */
    setShowForm(false);
    setIsEditMode(false);
    setForm(getEmptyForm());

    showToast(
      "info",
      wasEditMode
        ? "Update completed. Refreshing feeding records..."
        : "Save completed. Refreshing feeding records..."
    );

    /*
     * Refresh the table separately.
     * A refresh failure must not be reported as a save failure.
     */
    try {
      await loadData({
        preserveRows: true,
        retryOnAbort: true,
        forceRefresh: true,
      });

      showToast(
        "success",
        wasEditMode
          ? "Feeding entry updated successfully."
          : "Feeding entry saved successfully."
      );
    } catch (refreshError) {
      console.error(
        "Feeding saved, but refresh failed:",
        refreshError
      );

      showToast(
        "success",
        wasEditMode
          ? "Feeding entry was updated. Use Retry or refresh the page to verify the latest values."
          : "Feeding entry was saved. Use Retry or refresh the page to verify the latest values."
      );
    }
  } catch (error) {
    console.error(
      "Feeding save failed:",
      error
    );

    showToast(
      "error",
      error?.message ||
        "Unable to save Feeding entry."
    );
  } finally {
    setSaving(false);
  }
}

  function handleRowClick(row) {
    setSelectedEntry(row);
  }

  function handleEditClick(event, row) {
    event.stopPropagation();
    openEditForm(row);
  }

  return (
    <div style={pageStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <h1 style={pageTitleStyle}>
            Nutrition & Feeding
          </h1>

          <p style={pageSubtitleStyle}>
            Record daily shed-wise feed consumption
            by feed type.
          </p>
        </div>

        <div style={headerActionsStyle}>
          <div style={dateFilterGroupStyle}>
  <div style={dateFilterFieldStyle}>
    <label style={dateFilterLabelStyle}>
      From
    </label>

    <input
      type="date"
      value={fromDate}
      onChange={(event) =>
        setFromDate(event.target.value)
      }
      max={toDate || undefined}
      className="form-input"
      style={dateInputStyle}
      disabled={saving}
    />
  </div>

  <div style={dateFilterFieldStyle}>
    <label style={dateFilterLabelStyle}>
      To
    </label>

    <input
      type="date"
      value={toDate}
      onChange={(event) =>
        setToDate(event.target.value)
      }
      min={fromDate || undefined}
      className="form-input"
      style={dateInputStyle}
      disabled={saving}
    />
  </div>
</div>

          <button
            type="button"
            onClick={openAddForm}
            className="btn btn-primary"
            style={{ whiteSpace: "nowrap" }}
            disabled={saving}
          >
            + Add Entry
          </button>
        </div>
      </div>

{/* FILTERS */}
<div style={filterBarStyle}>
  <div style={filterFieldStyle}>
    <label style={filterLabelStyle}>
      Feed Type
    </label>

    <select
      value={feedTypeFilter}
      onChange={(event) =>
        setFeedTypeFilter(event.target.value)
      }
      className="form-input"
      style={filterSelectStyle}
    >
      <option value="">
        All Feed Types
      </option>

      {FEED_TYPES.map((feedType) => (
        <option
          key={feedType}
          value={feedType}
        >
          {feedType}
        </option>
      ))}
    </select>
  </div>

  <div style={filterFieldStyle}>
    <label style={filterLabelStyle}>
      Shed
    </label>

    <select
      value={shedFilter}
      onChange={(event) =>
        setShedFilter(event.target.value)
      }
      className="form-input"
      style={filterSelectStyle}
    >
      <option value="">
        All Sheds
      </option>

      {SHED_CONFIG.map((shed) => (
        <option
          key={shed.key}
          value={shed.key}
        >
          {shed.label}
        </option>
      ))}
    </select>
  </div>

  {(feedTypeFilter || shedFilter) && (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={() => {
        setFeedTypeFilter("");
        setShedFilter("");
      }}
      style={clearFiltersButtonStyle}
    >
      Clear Filters
    </button>
  )}
</div>


      {/* SUMMARY */}
      <div style={summaryGridStyle}>
  <SummaryCard
    label="Total Feed"
    value={`${feedMetrics.total} kg`}
  />

  <SummaryCard
    label="Green Fodder"
    value={`${feedMetrics.greenFodder} kg`}
  />

  <SummaryCard
    label="Dry Fodder"
    value={`${feedMetrics.dryFodder} kg`}
  />

  <SummaryCard
    label="Concentrate"
    value={`${feedMetrics.concentrate} kg`}
  />

  <SummaryCard
    label="Others"
    value={`${feedMetrics.others} kg`}
  />
</div>

      {/* TABLE */}
      <div style={tableCardStyle}>
        <div style={tableScrollStyle}>
          <table style={tableStyle}>
            <thead style={tableHeadStyle}>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>
                  Feed Type
                </th>
                <th style={thStyle}>
                  Nandini
                </th>
                <th style={thStyle}>
                  Surabhi
                </th>
                <th style={thStyle}>
                  Kaveri
                </th>
                <th style={thStyle}>
                  Kamadhenu
                </th>
                <th style={thStyle}>
                  Jayadeva
                </th>
                <th style={thStyle}>
                  Old Shed
                </th>
                <th style={thStyle}>
                  Total
                </th>
                <th
                  style={{
                    ...thStyle,
                    textAlign: "center",
                  }}
                >
                  Edit
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    style={emptyStateStyle}
                  >
                    <div style={loadingInlineStyle}>
                      
                      Loading feeding records...
                    </div>
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td
                    colSpan={10}
                    style={emptyStateStyle}
                  >
                    <div style={errorStateStyle}>
                      <div>{loadError}</div>

                      <button
  type="button"
  onClick={() => {
    loadData({
      forceRefresh: true,
    }).catch((error) => {
      showToast(
        "error",
        error?.message ||
          "Unable to refresh Feeding records."
      );
    });
  }}
  className="btn btn-secondary"
  style={{ marginTop: "0.75rem" }}
>
  Retry
</button>
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={emptyStateStyle}
                  >
                    No feeding entries found for the selected date range.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    style={tableRowStyle}
                    onClick={() =>
                      handleRowClick(row)
                    }
                    title="Click to view details"
                  >
                    <td style={tdStyle}>
                      <strong>
                        {formatDisplayDate(
                          row.date
                        )}
                      </strong>
                    </td>

                    <td style={tdStyle}>
                      <span style={feedTypeBadgeStyle}>
                        {row.feedType}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      {row.nandini}
                    </td>

                    <td style={tdStyle}>
                      {row.surabhi}
                    </td>

                    <td style={tdStyle}>
                      {row.kaveri}
                    </td>

                    <td style={tdStyle}>
                      {row.kamadhenu}
                    </td>

                    <td style={tdStyle}>
                      {row.jayadeva}
                    </td>

                    <td style={tdStyle}>
                      {row.nandiniOld}
                    </td>

                    <td style={totalTdStyle}>
                      {row.totalKg}
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={(event) =>
                          handleEditClick(
                            event,
                            row
                          )
                        }
                        style={editButtonStyle}
                        title="Edit Feeding Entry"
                        aria-label="Edit Feeding Entry"
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
                  {isEditMode
                    ? "Edit Feeding Entry"
                    : "Add Feeding Entry"}
                </h2>

                <p style={modalSubtitleStyle}>
                  Enter one feed type and its
                  quantity for each shed.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                style={closeButtonStyle}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={formStyle}
            >
              <div style={twoColumnGridStyle}>
                <Field label="Date *">
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleFormChange}
                    className="form-input"
                    required
                    disabled={
                      saving || isEditMode
                    }
                  />
                </Field>

                <Field label="Feed Type *">
                  <select
                    name="feedType"
                    value={form.feedType}
                    onChange={handleFormChange}
                    className="form-input"
                    required
                    disabled={saving}
                  >
                    <option value="">
                      Select Feed Type
                    </option>

                    {FEED_TYPES.map(
                      (feedType) => (
                        <option
                          key={feedType}
                          value={feedType}
                        >
                          {feedType}
                        </option>
                      )
                    )}
                  </select>
                </Field>
              </div>

              <Field label="Recorded By *">
                <input
                  type="text"
                  name="recordedBy"
                  value={form.recordedBy}
                  placeholder="Enter name"
                  onChange={handleFormChange}
                  className="form-input"
                  required
                  disabled={saving}
                />
              </Field>

              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  SHED QUANTITIES (KG)
                </div>

                <div style={shedGridStyle}>
                  {SHED_CONFIG.map((shed) => (
                    <NumberField
                      key={shed.key}
                      label={shed.label}
                      name={shed.key}
                      value={form[shed.key]}
                      onChange={handleFormChange}
                      disabled={saving}
                    />
                  ))}
                </div>
              </div>

              <div style={totalBoxStyle}>
                <Field label="Total Feeding — Auto Calculated">
                  <input
                    type="number"
                    value={form.totalKg}
                    className="form-input"
                    disabled
                  />
                </Field>
              </div>

              <Field label="Remarks">
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleFormChange}
                  className="form-input"
                  rows={3}
                  placeholder="Enter remarks, if any"
                  disabled={saving}
                  style={{
                    resize: "vertical",
                    minHeight: "80px",
                  }}
                />
              </Field>

              <div style={modalFooterStyle}>
                <button
                  type="button"
                  onClick={closeForm}
                  className="btn btn-secondary btn-full-mobile"
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary btn-full-mobile"
                  disabled={saving}
                  style={{
                    minWidth: "110px",
                    opacity: saving ? 0.75 : 1,
                    cursor: saving
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                 {saving
  ? isEditMode
    ? "Updating..."
    : "Saving..."
  : isEditMode
    ? "Update"
    : "Save"}
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
          onClick={() =>
            setSelectedEntry(null)
          }
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
                  Feeding Details
                </h2>

                <p style={modalSubtitleStyle}>
                  {formatDisplayDate(
                    selectedEntry.date
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedEntry(null)
                }
                style={closeButtonStyle}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div style={detailsGridStyle}>
              <DetailItem
                label="Feed Type"
                value={selectedEntry.feedType}
              />

              <DetailItem
                label="Recorded By"
                value={
                  selectedEntry.recordedBy
                }
              />

              {SHED_CONFIG.map((shed) => (
                <DetailItem
                  key={shed.key}
                  label={`${shed.label} Shed`}
                  value={`${selectedEntry[shed.key] || 0} kg`}
                />
              ))}

              <div style={detailsFullWidthStyle}>
                <DetailItem
                  label="Total Quantity"
                  value={`${selectedEntry.totalKg} kg`}
                  isBold
                />
              </div>

              <div style={detailsFullWidthStyle}>
                <DetailItem
                  label="Remarks"
                  value={
                    selectedEntry.remarks || "-"
                  }
                />
              </div>
            </div>

            <div style={modalFooterStyle}>
              <button
                type="button"
                onClick={() =>
                  setSelectedEntry(null)
                }
                className="btn btn-secondary"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const row = selectedEntry;

                  setSelectedEntry(null);
                  openEditForm(row);
                }}
                className="btn btn-primary"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
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
          
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={fieldLabelStyle}>
        {label}
      </label>

      {children}
    </div>
  );
}

function NumberField({
  label,
  name,
  value,
  onChange,
  disabled,
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        min="0"
        step="0.01"
        name={name}
        value={value}
        onChange={onChange}
        className="form-input"
        disabled={disabled}
        placeholder="0"
      />
    </Field>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div style={summaryCardStyle}>
      <div style={summaryLabelStyle}>
        {label}
      </div>

      <div style={summaryValueStyle}>
        {value}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  isBold = false,
}) {
  return (
    <div>
      <div style={detailLabelStyle}>
        {label}
      </div>

      <div
        style={{
          ...detailValueStyle,
          fontWeight: isBold ? 700 : 500,
          fontSize: isBold
            ? "1.1rem"
            : "0.95rem",
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

// =========================================================
// STYLES
// =========================================================

const pageStyle = {
  padding: "1.5rem",
  maxWidth: "1400px",
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box",
};

const headerStyle = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "1.25rem",
  gap: "1rem",
};

const pageTitleStyle = {
  fontSize: "1.6rem",
  fontWeight: 700,
  margin: 0,
  color: "#1f2937",
};

const pageSubtitleStyle = {
  margin: "0.35rem 0 0",
  color: "#6b7280",
  fontSize: "0.9rem",
};

const headerActionsStyle = {
  display: "flex",
  gap: "0.75rem",
  alignItems: "center",
  flexWrap: "wrap",
};

const dateFilterGroupStyle = {
  display: "flex",
  alignItems: "flex-end",
  gap: "0.65rem",
  flexWrap: "wrap",
};

const dateFilterFieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
};

const dateFilterLabelStyle = {
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "#6b7280",
};

const dateInputStyle = {
  width: "145px",
  padding: "0.55rem 0.7rem",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "1rem",
  marginBottom: "1rem",
};

const filterBarStyle = {
  display: "flex",
  alignItems: "flex-end",
  gap: "0.75rem",
  flexWrap: "wrap",
  marginBottom: "1rem",
  padding: "0.9rem 1rem",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
};

const filterFieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
};

const filterLabelStyle = {
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "#6b7280",
};

const filterSelectStyle = {
  width: "190px",
  minWidth: "170px",
};

const clearFiltersButtonStyle = {
  whiteSpace: "nowrap",
  minHeight: "38px",
};

const summaryCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "1rem",
  boxShadow:
    "0 1px 2px rgba(15, 23, 42, 0.04)",
};

const summaryLabelStyle = {
  color: "#6b7280",
  fontSize: "0.8rem",
  fontWeight: 600,
  textTransform: "uppercase",
};

const summaryValueStyle = {
  color: "#111827",
  fontSize: "1.35rem",
  fontWeight: 700,
  marginTop: "0.3rem",
};

const tableCardStyle = {
  padding: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 300px)",
  minHeight: "350px",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
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
  minWidth: "1100px",
};

const tableHeadStyle = {
  background: "#f9fafb",
  borderBottom: "2px solid #e5e7eb",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const thStyle = {
  padding: "0.85rem 0.9rem",
  textAlign: "left",
  fontWeight: 600,
  color: "#4b5563",
  fontSize: "0.74rem",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "0.8rem 0.9rem",
  color: "#1f2937",
  borderBottom: "1px solid #f3f4f6",
  whiteSpace: "nowrap",
};

const totalTdStyle = {
  ...tdStyle,
  fontWeight: 700,
  color: "#166534",
};

const tableRowStyle = {
  cursor: "pointer",
};

const feedTypeBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.22rem 0.55rem",
  borderRadius: "999px",
  background: "#fff7ed",
  color: "#c2410c",
  fontWeight: 600,
  fontSize: "0.78rem",
};

const editButtonStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "1rem",
  padding: "0.3rem",
};

const emptyStateStyle = {
  padding: "3rem",
  textAlign: "center",
  color: "#6b7280",
};

const errorStateStyle = {
  color: "#b91c1c",
};

const loadingInlineStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.65rem",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.58)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 50,
  padding: "1rem",
};

const modalStyle = {
  position: "relative",
  background: "#ffffff",
  padding: "1.5rem",
  borderRadius: "12px",
  width: "100%",
  maxWidth: "650px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow:
    "0 20px 40px rgba(0,0,0,0.24)",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "1rem",
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: "1rem",
  marginBottom: "1.25rem",
};

const modalTitleStyle = {
  margin: 0,
  fontSize: "1.25rem",
  color: "#1f2937",
};

const modalSubtitleStyle = {
  margin: "0.3rem 0 0",
  color: "#6b7280",
  fontSize: "0.85rem",
};

const closeButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "1.6rem",
  color: "#6b7280",
  cursor: "pointer",
  lineHeight: 1,
};

const formStyle = {
  display: "grid",
  gap: "1rem",
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
  marginBottom: "0.35rem",
  fontWeight: 600,
  color: "#374151",
};

const sectionStyle = {
  borderTop: "1px solid #e5e7eb",
  paddingTop: "1rem",
  marginTop: "0.25rem",
};

const sectionTitleStyle = {
  fontSize: "0.8rem",
  fontWeight: 700,
  color: "#2563eb",
  marginBottom: "0.8rem",
};

const shedGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "1rem",
};

const totalBoxStyle = {
  background: "#f0fdf4",
  padding: "1rem",
  borderRadius: "8px",
  border: "1px solid #bbf7d0",
};

const modalFooterStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.75rem",
  marginTop: "0.75rem",
  flexWrap: "wrap",
};


const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "1rem",
};

const detailsFullWidthStyle = {
  gridColumn: "1 / -1",
  background: "#f9fafb",
  padding: "0.75rem",
  borderRadius: "7px",
};

const detailLabelStyle = {
  fontSize: "0.72rem",
  color: "#6b7280",
  textTransform: "uppercase",
  fontWeight: 700,
  marginBottom: "0.25rem",
};

const detailValueStyle = {
  color: "#111827",
};

const toastStyle = {
  position: "fixed",
  right: "1.25rem",
  bottom: "1.25rem",
  zIndex: 100,
  minWidth: "280px",
  maxWidth: "420px",
  padding: "0.9rem 1rem",
  borderRadius: "9px",
  display: "flex",
  alignItems: "center",
  gap: "0.65rem",
  boxShadow:
    "0 12px 28px rgba(15, 23, 42, 0.2)",
  fontWeight: 600,
  fontSize: "0.88rem",
};

const successToastStyle = {
  background: "#dcfce7",
  border: "1px solid #86efac",
  color: "#166534",
};

const errorToastStyle = {
  background: "#fee2e2",
  border: "1px solid #fca5a5",
  color: "#991b1b",
};

const infoToastStyle = {
  background: "#eff6ff",
  border: "1px solid #93c5fd",
  color: "#1d4ed8",
};

