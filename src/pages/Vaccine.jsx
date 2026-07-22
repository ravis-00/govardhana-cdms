import React, { useEffect, useMemo, useState } from "react";
import {
  getPreventiveCareLog,
  addPreventiveCare,
  updatePreventiveCare,
  getPreventiveCareTypes,
  getMedicines,
} from "../api/masterApi";

import PageHeader from "../components/common/PageHeader";
import MetricCard from "../components/common/MetricCard";
import SectionCard from "../components/common/SectionCard";

// =============================================================================
// CONSTANTS
// =============================================================================

const DOSAGE_UNITS = [
  "ml",
  "mg",
  "gm",
  "kg",
  "tablet",
  "capsule",
  "dose",
  "sachet",
  "drop",
  "other",
];

const ADMINISTRATION_ROUTES = [
  "Oral",
  "Intramuscular",
  "Subcutaneous",
  "Intravenous",
  "Topical Spray",
  "Topical Application",
  "Nasal",
  "In Feed",
  "In Water",
  "Other",
];

const STATUS_OPTIONS = [
  "Draft",
  "Completed",
  "Cancelled",
];

const DEFAULT_PAGE_SIZE = 10;

// =============================================================================
// DATE HELPERS
// =============================================================================

function toIsoDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normaliseIsoDate(value) {
  if (!value) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toIsoDate(value);
  }

  const text = String(value).trim();

  const isoMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const displayMatch = text.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/
  );

  if (displayMatch) {
    return [
      displayMatch[3],
      String(displayMatch[2]).padStart(2, "0"),
      String(displayMatch[1]).padStart(2, "0"),
    ].join("-");
  }

  const parsed = new Date(text);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return toIsoDate(parsed);
}

function formatDisplayDate(value) {
  const isoDate = normaliseIsoDate(value);

  if (!isoDate) return "-";

  const [year, month, day] = isoDate.split("-");

  return `${day}-${month}-${year}`;
}

function getCurrentMonthDateRange() {
  const today = new Date();

  const firstDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  const lastDay = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  );

  return {
    fromDate: toIsoDate(firstDay),
    toDate: toIsoDate(lastDay),
  };
}

function getDueStatus(nextDueDate, recordStatus) {
  const status = String(
    recordStatus || ""
  )
    .trim()
    .toLowerCase();

  if (status === "cancelled") {
    return {
      key: "cancelled",
      label: "Cancelled",
    };
  }

  if (status === "draft") {
    return {
      key: "draft",
      label: "Not Finalised",
    };
  }

  const dueDate =
    normaliseIsoDate(nextDueDate);

  if (!dueDate) {
    return {
      key: "not-scheduled",
      label: "Not Scheduled",
    };
  }

  const today =
    toIsoDate(new Date());

  if (dueDate === today) {
    return {
      key: "due-today",
      label: "Due Today",
    };
  }

  if (dueDate < today) {
    return {
      key: "overdue",
      label: "Next Dose Overdue",
    };
  }

  return {
    key: "upcoming",
    label: "Next Due",
  };
}

// =============================================================================
// GENERAL HELPERS
// =============================================================================

function getLoggedInUser() {
  try {
    const storedUser =
      localStorage.getItem("user") ||
      localStorage.getItem("loggedInUser");

    if (storedUser) {
      const parsed = JSON.parse(storedUser);

      return (
        parsed?.email ||
        parsed?.name ||
        parsed?.username ||
        "System"
      );
    }

    return (
      localStorage.getItem("userEmail") ||
      localStorage.getItem("email") ||
      "System"
    );
  } catch {
    return "System";
  }
}

function toSafeNumber(value, fallback = 0) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const numberValue = Number(value);

  return Number.isNaN(numberValue)
    ? fallback
    : numberValue;
}

function getExcludedCount(
  eligibleCount,
  administeredCount
) {
  const eligible =
    toSafeNumber(eligibleCount, 0);

  const administered =
    toSafeNumber(administeredCount, 0);

  return Math.max(
    eligible - administered,
    0
  );
}

function normaliseCareType(raw) {
  return {
    careTypeId: String(
      raw?.care_type_id ||
      raw?.careTypeId ||
      raw?.id ||
      ""
    ).trim(),

    careTypeName: String(
      raw?.care_type_name ||
      raw?.careTypeName ||
      raw?.name ||
      ""
    ).trim(),

    description: String(
      raw?.description || ""
    ).trim(),

    displayOrder:
      raw?.display_order ??
      raw?.displayOrder ??
      "",

    isActive: String(
      raw?.is_active ||
      raw?.isActive ||
      "Yes"
    ).trim(),
  };
}

function normaliseMedicine(raw, index) {
  if (typeof raw === "string") {
    return {
      medicineId: "",
      medicineName: raw.trim(),
      key: `medicine-${index}-${raw}`,
    };
  }

  return {
    medicineId: String(
      raw?.medicine_id ||
      raw?.medicineId ||
      raw?.id ||
      ""
    ).trim(),

    medicineName: String(
      raw?.medicine_name ||
      raw?.medicineName ||
      raw?.name ||
      raw?.medicine ||
      ""
    ).trim(),

    key:
      String(
        raw?.medicine_id ||
        raw?.medicineId ||
        raw?.id ||
        ""
      ).trim() ||
      `medicine-${index}`,
  };
}

function normalisePreventiveCareRow(raw) {
  const eventId = String(
    raw?.event_id ||
    raw?.eventId ||
    raw?.id ||
    ""
  ).trim();

  const eventDate =
    normaliseIsoDate(
      raw?.event_date ||
      raw?.eventDate ||
      raw?.date
    );

  const careTypeId = String(
    raw?.care_type_id ||
    raw?.careTypeId ||
    ""
  ).trim();

  const careTypeName = String(
    raw?.care_type_name ||
    raw?.careTypeName ||
    raw?.category ||
    ""
  ).trim();

  const medicineId = String(
    raw?.medicine_id ||
    raw?.medicineId ||
    ""
  ).trim();

  const medicineName = String(
    raw?.medicine_name ||
    raw?.medicineName ||
    raw?.medicine ||
    ""
  ).trim();

  const nextDueDate =
    normaliseIsoDate(
      raw?.next_due_date ||
      raw?.nextDueDate
    );

  const status = String(
    raw?.status || "Completed"
  ).trim();

  return {
    eventId,
    eventDate,

    careTypeId,
    careTypeName,

    medicineId,
    medicineName,

    medicineBatchNo: String(
      raw?.medicine_batch_no ||
      raw?.medicineBatchNo ||
      ""
    ).trim(),

    medicineExpiryDate:
      normaliseIsoDate(
        raw?.medicine_expiry_date ||
        raw?.medicineExpiryDate
      ),

    dosage:
      raw?.dosage ?? "",

    dosageUnit: String(
      raw?.dosage_unit ||
      raw?.dosageUnit ||
      ""
    ).trim(),

    administrationRoute: String(
      raw?.administration_route ||
      raw?.administrationRoute ||
      ""
    ).trim(),

    targetGroup: String(
      raw?.target_group ||
      raw?.targetGroup ||
      ""
    ).trim(),

    eligibleCount:
      toSafeNumber(
        raw?.eligible_count ??
        raw?.eligibleCount,
        0
      ),

    administeredCount:
      toSafeNumber(
        raw?.administered_count ??
        raw?.administeredCount,
        0
      ),

    excludedCount:
      toSafeNumber(
        raw?.excluded_count ??
        raw?.excludedCount,
        0
      ),

    nextDueDate,

    doctorName: String(
      raw?.doctor_name ||
      raw?.doctorName ||
      ""
    ).trim(),

    status,

    remarks: String(
      raw?.remarks || ""
    ).trim(),

    createdBy: String(
      raw?.created_by ||
      raw?.createdBy ||
      ""
    ).trim(),

    createdAt: String(
      raw?.created_at ||
      raw?.createdAt ||
      ""
    ).trim(),

    updatedBy: String(
      raw?.updated_by ||
      raw?.updatedBy ||
      ""
    ).trim(),

    updatedAt: String(
      raw?.updated_at ||
      raw?.updatedAt ||
      ""
    ).trim(),

    dueStatus: getDueStatus(
      nextDueDate,
      status
    ),
  };
}

function getEmptyForm() {
  return {
    eventId: "",
    eventDate: toIsoDate(new Date()),

    careTypeId: "",
    careTypeName: "",

    medicineId: "",
    medicineName: "",

    medicineBatchNo: "",
    medicineExpiryDate: "",

    dosage: "",
    dosageUnit: "ml",

    administrationRoute: "",

    targetGroup: "",

    eligibleCount: "",
    administeredCount: "",
    excludedCount: 0,

    nextDueDate: "",
    doctorName: "",

    status: "Completed",
    remarks: "",
  };
}

function buildPayload(form, mode) {
  const user = getLoggedInUser();

  const payload = {
    event_id: form.eventId,
    event_date: form.eventDate,

    care_type_id: form.careTypeId,
    care_type_name: form.careTypeName,

    medicine_id: form.medicineId,
    medicine_name: form.medicineName,

    medicine_batch_no:
      form.medicineBatchNo,

    medicine_expiry_date:
      form.medicineExpiryDate,

    dosage: form.dosage,
    dosage_unit: form.dosageUnit,

    administration_route:
      form.administrationRoute,

    target_group: form.targetGroup,

    eligible_count:
      Number(form.eligibleCount || 0),

    administered_count:
      Number(form.administeredCount || 0),

    excluded_count:
      getExcludedCount(
        form.eligibleCount,
        form.administeredCount
      ),

    next_due_date: form.nextDueDate,

    doctor_name: form.doctorName,

    status: form.status,
    remarks: form.remarks,
  };

  if (mode === "add") {
    payload.created_by = user;
  } else {
    payload.updated_by = user;
  }

  return payload;
}

// =============================================================================
// PAGE
// =============================================================================

export default function Vaccine() {
  const initialRange =
    getCurrentMonthDateRange();

  const [rows, setRows] =
    useState([]);

  const [careTypes, setCareTypes] =
    useState([]);

  const [medicines, setMedicines] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [fromDate, setFromDate] =
    useState(initialRange.fromDate);

  const [toDate, setToDate] =
    useState(initialRange.toDate);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    careTypeFilter,
    setCareTypeFilter,
  ] = useState("");

  const [
    medicineFilter,
    setMedicineFilter,
  ] = useState("");

  const [
    recordStatusFilter,
    setRecordStatusFilter,
  ] = useState("");

  const [
    dueStatusFilter,
    setDueStatusFilter,
  ] = useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(DEFAULT_PAGE_SIZE);

  const [showForm, setShowForm] =
    useState(false);

  const [mode, setMode] =
    useState("add");

  const [form, setForm] =
    useState(getEmptyForm());

  const [
    selectedEntry,
    setSelectedEntry,
  ] = useState(null);

  const [toast, setToast] =
    useState({
      visible: false,
      type: "info",
      message: "",
    });

  useEffect(() => {
    loadPageData();
  }, []);

  async function loadPageData() {
    try {
      setLoading(true);
      setError("");

      const [
        preventiveCareResponse,
        careTypeResponse,
        medicineResponse,
      ] = await Promise.all([
        getPreventiveCareLog(),
        getPreventiveCareTypes(),
        getMedicines(),
      ]);

      const rawRecords =
        Array.isArray(
          preventiveCareResponse
        )
          ? preventiveCareResponse
          : Array.isArray(
                preventiveCareResponse?.data
              )
            ? preventiveCareResponse.data
            : [];

      const rawCareTypes =
        Array.isArray(careTypeResponse)
          ? careTypeResponse
          : Array.isArray(
                careTypeResponse?.data
              )
            ? careTypeResponse.data
            : [];

      const rawMedicines =
        Array.isArray(medicineResponse)
          ? medicineResponse
          : Array.isArray(
                medicineResponse?.data
              )
            ? medicineResponse.data
            : [];

      const normalisedRows =
        rawRecords
          .map(
            normalisePreventiveCareRow
          )
          .sort((a, b) => {
            if (
              a.eventDate !==
              b.eventDate
            ) {
              return b.eventDate.localeCompare(
                a.eventDate
              );
            }

            return b.eventId.localeCompare(
              a.eventId
            );
          });

      const normalisedCareTypes =
        rawCareTypes
          .map(normaliseCareType)
          .filter(
            (careType) =>
              careType.careTypeName &&
              careType.isActive.toLowerCase() !==
                "no"
          )
          .sort((a, b) => {
            const orderA =
              Number(
                a.displayOrder || 999999
              );

            const orderB =
              Number(
                b.displayOrder || 999999
              );

            if (orderA !== orderB) {
              return orderA - orderB;
            }

            return a.careTypeName.localeCompare(
              b.careTypeName
            );
          });

      const normalisedMedicines =
        rawMedicines
          .map(normaliseMedicine)
          .filter(
            (medicine) =>
              medicine.medicineName
          )
          .sort((a, b) =>
            a.medicineName.localeCompare(
              b.medicineName
            )
          );

      setRows(normalisedRows);
      setCareTypes(
        normalisedCareTypes
      );
      setMedicines(
        normalisedMedicines
      );
    } catch (err) {
      console.error(
        "Preventive care load failed:",
        err
      );

      setRows([]);
      setError(
        err?.message ||
          "Unable to load preventive care records."
      );
    } finally {
      setLoading(false);
    }
  }

  // ===========================================================================
  // FILTERS
  // ===========================================================================

  const dateRangeRows = useMemo(() => {
    return rows.filter((row) => {
      if (
        fromDate &&
        row.eventDate < fromDate
      ) {
        return false;
      }

      if (
        toDate &&
        row.eventDate > toDate
      ) {
        return false;
      }

      return true;
    });
  }, [
    rows,
    fromDate,
    toDate,
  ]);

  const medicineOptions = useMemo(() => {
  const medicineMap = new Map();

  medicines.forEach((medicine) => {
    const name = String(
      medicine.medicineName || ""
    ).trim();

    if (!name) return;

    medicineMap.set(name.toLowerCase(), {
      medicineId: String(
        medicine.medicineId || ""
      ).trim(),
      medicineName: name,
      key:
        medicine.key ||
        medicine.medicineId ||
        name,
    });
  });

  rows.forEach((row) => {
    const name = String(
      row.medicineName || ""
    ).trim();

    if (!name) return;

    const key = name.toLowerCase();
    const existing = medicineMap.get(key);

    medicineMap.set(key, {
      medicineId:
        existing?.medicineId ||
        String(row.medicineId || "").trim(),

      medicineName: name,

      key:
        existing?.key ||
        row.medicineId ||
        name,
    });
  });

  return Array.from(
    medicineMap.values()
  ).sort((a, b) =>
    a.medicineName.localeCompare(
      b.medicineName
    )
  );
}, [medicines, rows]);

  const filteredRows = useMemo(() => {
    const query =
      searchTerm
        .trim()
        .toLowerCase();

    return dateRangeRows.filter(
      (row) => {
        const searchableText = [
          row.eventId,
          row.careTypeId,
          row.careTypeName,
          row.medicineId,
          row.medicineName,
          row.medicineBatchNo,
          row.dosage,
          row.dosageUnit,
          row.administrationRoute,
          row.targetGroup,
          row.eligibleCount,
          row.administeredCount,
          row.excludedCount,
          row.doctorName,
          row.status,
          row.remarks,
        ]
          .map((value) =>
            String(
              value ?? ""
            ).toLowerCase()
          )
          .join(" ");

        const matchesSearch =
          !query ||
          searchableText.includes(
            query
          );

       const matchesCareType =
  !careTypeFilter ||
  row.careTypeName
    .trim()
    .toLowerCase() ===
    careTypeFilter
      .trim()
      .toLowerCase();

        const matchesMedicine =
          !medicineFilter ||
          row.medicineName ===
            medicineFilter;

        const matchesRecordStatus =
          !recordStatusFilter ||
          row.status ===
            recordStatusFilter;

        const matchesDueStatus =
          !dueStatusFilter ||
          row.dueStatus.key ===
            dueStatusFilter;

        return (
          matchesSearch &&
          matchesCareType &&
          matchesMedicine &&
          matchesRecordStatus &&
          matchesDueStatus
        );
      }
    );
  }, [
    dateRangeRows,
    searchTerm,
    careTypeFilter,
    medicineFilter,
    recordStatusFilter,
    dueStatusFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    fromDate,
    toDate,
    searchTerm,
    careTypeFilter,
    medicineFilter,
    recordStatusFilter,
    dueStatusFilter,
    pageSize,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRows.length /
        pageSize
    )
  );

  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginatedRows = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      pageSize;

    return filteredRows.slice(
      startIndex,
      startIndex + pageSize
    );
  }, [
    filteredRows,
    currentPage,
    pageSize,
  ]);

  const firstVisibleRecord =
    filteredRows.length === 0
      ? 0
      : (currentPage - 1) *
          pageSize +
        1;

  const lastVisibleRecord =
    Math.min(
      currentPage * pageSize,
      filteredRows.length
    );

  // ===========================================================================
  // METRICS
  // ===========================================================================

  const metrics = useMemo(() => {
    const countType = (
      careTypeName
    ) =>
      dateRangeRows.filter(
        (row) =>
          row.careTypeName
            .toLowerCase() ===
          careTypeName.toLowerCase()
      ).length;

    return {
      total:
        rows.length,

      selectedPeriod:
        dateRangeRows.length,

      vaccination:
        countType(
          "Vaccination"
        ),

      deworming:
        countType(
          "Deworming"
        ),

      vitamin:
        countType(
          "Vitamin Supplementation"
        ),

      mineral:
        countType(
          "Mineral Supplementation"
        ),

      upcoming:
        dateRangeRows.filter(
          (row) =>
            row.dueStatus.key ===
            "upcoming"
        ).length,

      overdue:
        dateRangeRows.filter(
          (row) =>
            row.dueStatus.key ===
            "overdue"
        ).length,
    };
  }, [
    rows,
    dateRangeRows,
  ]);

  // ===========================================================================
  // TOAST
  // ===========================================================================

  function showToast(
    message,
    type = "info"
  ) {
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
    showToast(
      message,
      type
    );

    window.setTimeout(
      hideToast,
      duration
    );
  }

  // ===========================================================================
  // FORM HANDLERS
  // ===========================================================================

  function openFormForAdd() {
    setMode("add");
    setForm(
      getEmptyForm()
    );
    setShowForm(true);
  }

  function openFormForEdit(entry) {
    setMode("edit");

    setForm({
      eventId:
        entry.eventId,

      eventDate:
        entry.eventDate,

      careTypeId:
        entry.careTypeId,

      careTypeName:
        entry.careTypeName,

      medicineId:
        entry.medicineId,

      medicineName:
        entry.medicineName,

      medicineBatchNo:
        entry.medicineBatchNo,

      medicineExpiryDate:
        entry.medicineExpiryDate,

      dosage:
        entry.dosage,

      dosageUnit:
        entry.dosageUnit ||
        "ml",

      administrationRoute:
        entry.administrationRoute,

      targetGroup:
        entry.targetGroup,

      eligibleCount:
        entry.eligibleCount,

      administeredCount:
        entry.administeredCount,

      excludedCount:
        entry.excludedCount,

      nextDueDate:
        entry.nextDueDate,

      doctorName:
        entry.doctorName,

      status:
        entry.status,

      remarks:
        entry.remarks,
    });

    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      };

      if (
        name ===
        "eligibleCount" ||
        name ===
        "administeredCount"
      ) {
        updated.excludedCount =
          getExcludedCount(
            name ===
              "eligibleCount"
              ? value
              : previous.eligibleCount,
            name ===
              "administeredCount"
              ? value
              : previous.administeredCount
          );
      }

      return updated;
    });
  }

  function handleCareTypeChange(
    event
  ) {
    const careTypeId =
      event.target.value;

    const selectedCareType =
      careTypes.find(
        (item) =>
          item.careTypeId ===
          careTypeId
      );

    setForm((previous) => ({
      ...previous,
      careTypeId,
      careTypeName:
        selectedCareType
          ?.careTypeName || "",
    }));
  }

  function handleMedicineChange(event) {
  const selectedValue =
    event.target.value;

  const selectedMedicine =
    medicineOptions.find(
      (item) =>
        `${item.medicineId}||${item.medicineName}` ===
        selectedValue
    );

  setForm((previous) => ({
    ...previous,

    medicineId:
      selectedMedicine?.medicineId || "",

    medicineName:
      selectedMedicine?.medicineName || "",
  }));
}

  function validateForm() {
    if (!form.eventDate) {
      return "Administration Date is required.";
    }

    if (
      !form.careTypeId ||
      !form.careTypeName
    ) {
      return "Please select a Preventive Care Type.";
    }

    if (
      !form.medicineName.trim()
    ) {
      return "Please select a Medicine.";
    }

    if (
      !form.targetGroup.trim()
    ) {
      return "Target Group is required.";
    }

    const eligible =
      Number(
        form.eligibleCount
      );

    const administered =
      Number(
        form.administeredCount
      );

    if (
      !Number.isInteger(
        eligible
      ) ||
      eligible <= 0
    ) {
      return "Eligible Count must be greater than zero.";
    }

    if (
      !Number.isInteger(
        administered
      ) ||
      administered < 0
    ) {
      return "Administered Count must be zero or greater.";
    }

    if (
      administered >
      eligible
    ) {
      return "Administered Count cannot exceed Eligible Count.";
    }

    if (
      form.dosage !== "" &&
      Number(
        form.dosage
      ) <= 0
    ) {
      return "Dosage must be greater than zero.";
    }

    if (
      form.nextDueDate &&
      form.nextDueDate <
        form.eventDate
    ) {
      return "Next Due Date cannot be earlier than Administration Date.";
    }

    if (
      form.medicineExpiryDate &&
      form.medicineExpiryDate <
        form.eventDate
    ) {
      return "Medicine is expired on the Administration Date.";
    }

    return "";
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      showTemporaryToast(
        validationError,
        "error",
        4500
      );
      return;
    }

    try {
      setSaving(true);

      showToast(
        mode === "add"
          ? "Please wait... Saving preventive care record."
          : "Please wait... Updating preventive care record.",
        "loading"
      );

      const payload =
        buildPayload(
          form,
          mode
        );

      if (mode === "add") {
        await addPreventiveCare(
          payload
        );
      } else {
        await updatePreventiveCare(
          payload
        );
      }

      setShowForm(false);

      await loadPageData();

      showTemporaryToast(
        mode === "add"
          ? "Preventive care record saved successfully."
          : "Preventive care record updated successfully.",
        "success",
        3500
      );
    } catch (err) {
      console.error(
        "Preventive care save failed:",
        err
      );

      showTemporaryToast(
        err?.message ||
          "Unable to save preventive care record.",
        "error",
        5000
      );
    } finally {
      setSaving(false);
    }
  }

  function clearFilters() {
    const range =
      getCurrentMonthDateRange();

    setFromDate(
      range.fromDate
    );

    setToDate(
      range.toDate
    );

    setSearchTerm("");
    setCareTypeFilter("");
    setMedicineFilter("");
    setRecordStatusFilter("");
    setDueStatusFilter("");
  }

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div style={pageStyle}>
      {toast.visible && (
        <div
          className="preventive-toast-mobile"
          style={{
            ...toastStyle,

            ...(toast.type ===
            "success"
              ? toastSuccessStyle
              : toast.type ===
                  "error"
                ? toastErrorStyle
                : toast.type ===
                    "loading"
                  ? toastLoadingStyle
                  : toastInfoStyle),
          }}
          role="status"
          aria-live="polite"
        >
          {toast.type ===
            "loading" && (
            <span
              style={
                toastSpinnerStyle
              }
            />
          )}

          {toast.type ===
            "success" && (
            <span
              style={
                toastIconStyle
              }
            >
              ✓
            </span>
          )}

          {toast.type ===
            "error" && (
            <span
              style={
                toastIconStyle
              }
            >
              !
            </span>
          )}

          <span>
            {toast.message}
          </span>

          {toast.type !==
            "loading" && (
            <button
              type="button"
              onClick={hideToast}
              style={
                toastCloseStyle
              }
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

            .preventive-modal-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>

      <PageHeader
        title="Preventive Care"
        description="Manage vaccinations, deworming, supplementation and other preventive treatment events."
        countText={`Showing ${filteredRows.length} of ${rows.length} records`}
        action={
          <button
            type="button"
            onClick={
              openFormForAdd
            }
            className="btn btn-primary"
            style={{
              whiteSpace:
                "nowrap",
            }}
          >
            + Add Preventive Care
          </button>
        }
      />

      <div
        style={
          metricsWrapperStyle
        }
      >
        <MetricCard
          label="Total Events"
          value={metrics.total}
          color="#2563eb"
        />

        <MetricCard
          label="Selected Period"
          value={
            metrics.selectedPeriod
          }
          color="#ea580c"
        />

        <MetricCard
          label="Vaccination"
          value={
            metrics.vaccination
          }
          color="#16a34a"
        />

        <MetricCard
          label="Deworming"
          value={
            metrics.deworming
          }
          color="#7c3aed"
        />

        <MetricCard
          label="Vitamin"
          value={
            metrics.vitamin
          }
          color="#0891b2"
        />

        <MetricCard
          label="Mineral"
          value={
            metrics.mineral
          }
          color="#9333ea"
        />

        <MetricCard
          label="Upcoming"
          value={
            metrics.upcoming
          }
          color="#d97706"
        />

        <MetricCard
          label="Overdue"
          value={
            metrics.overdue
          }
          color="#dc2626"
        />
      </div>

      <SectionCard title="Search & Filters">
        <div
          style={
            filtersGridStyle
          }
        >
          <Field label="Search">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target
                    .value
                )
              }
              className="form-input"
              placeholder="Event, medicine, target group or doctor"
            />
          </Field>

          <Field label="From Date">
            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(
                  event.target
                    .value
                )
              }
              className="form-input"
              max={
                toDate ||
                undefined
              }
            />
          </Field>

          <Field label="To Date">
            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(
                  event.target
                    .value
                )
              }
              className="form-input"
              min={
                fromDate ||
                undefined
              }
            />
          </Field>

          <Field label="Care Type">
            <select
              value={
                careTypeFilter
              }
              onChange={(event) =>
                setCareTypeFilter(
                  event.target
                    .value
                )
              }
              className="form-select"
            >
              <option value="">
                All Care Types
              </option>

              {careTypes.map((careType) => (
  <option
    key={
      careType.careTypeId ||
      careType.careTypeName
    }
    value={careType.careTypeName}
  >
    {careType.careTypeName}
  </option>
))}
            </select>
          </Field>

          <Field label="Medicine">
            <select
              value={
                medicineFilter
              }
              onChange={(event) =>
                setMedicineFilter(
                  event.target
                    .value
                )
              }
              className="form-select"
            >
              <option value="">
                All Medicines
              </option>

              {medicineOptions.map(
  (medicine, index) => (
    <option
      key={
        medicine.key ||
        `${medicine.medicineName}-${index}`
      }
      value={medicine.medicineName}
    >
      {medicine.medicineName}
    </option>
  )
)}
            </select>
          </Field>

          <Field label="Record Status">
            <select
              value={
                recordStatusFilter
              }
              onChange={(event) =>
                setRecordStatusFilter(
                  event.target
                    .value
                )
              }
              className="form-select"
            >
              <option value="">
                All Statuses
              </option>

              {STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                )
              )}
            </select>
          </Field>

          <Field label="Due Status">
            <select
              value={
                dueStatusFilter
              }
              onChange={(event) =>
                setDueStatusFilter(
                  event.target
                    .value
                )
              }
              className="form-select"
            >
              <option value="">
                All Due Statuses
              </option>

              <option value="upcoming">
                Upcoming
              </option>

              <option value="due-today">
                Due Today
              </option>

              <option value="overdue">
                Overdue
              </option>

              <option value="not-scheduled">
                Not Scheduled
              </option>

              <option value="cancelled">
                Cancelled
              </option><option value="">
  All Due Statuses
</option>

<option value="upcoming">
  Next Due
</option>

<option value="due-today">
  Due Today
</option>

<option value="overdue">
  Next Dose Overdue
</option>

<option value="not-scheduled">
  Not Scheduled
</option>

<option value="draft">
  Not Finalised
</option>

<option value="cancelled">
  Cancelled
</option>
            </select>
          </Field>

          <div
            style={{
              display: "flex",
              alignItems:
                "flex-end",
            }}
          >
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </SectionCard>

      {error && (
        <div
          style={
            errorBannerStyle
          }
        >
          {error}
        </div>
      )}

      <div
        style={
          tableToolbarStyle
        }
      >
        <div
          style={
            tableRecordCountStyle
          }
        >
          Showing{" "}
          {firstVisibleRecord}-
          {lastVisibleRecord} of{" "}
          {filteredRows.length}{" "}
          filtered records

          {filteredRows.length !==
            rows.length && (
            <span
              style={
                tableRecordTotalStyle
              }
            >
              {" "}
              ({rows.length} total)
            </span>
          )}
        </div>

        <div
          style={
            paginationControlsStyle
          }
        >
          <label
            style={
              pageSizeLabelStyle
            }
          >
            Rows per page

            <select
              value={pageSize}
              onChange={(event) =>
                setPageSize(
                  Number(
                    event.target
                      .value
                  )
                )
              }
              className="form-select"
              style={
                pageSizeSelectStyle
              }
            >
              <option value={10}>
                10
              </option>

              <option value={15}>
                15
              </option>

              <option value={25}>
                25
              </option>

              <option value={50}>
                50
              </option>
            </select>
          </label>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setCurrentPage(
                (page) =>
                  Math.max(
                    1,
                    page - 1
                  )
              )
            }
            disabled={
              currentPage <= 1
            }
            style={
              paginationButtonStyle
            }
          >
            Previous
          </button>

          <span
            style={
              pageIndicatorStyle
            }
          >
            Page{" "}
            {filteredRows.length ===
            0
              ? 0
              : currentPage}{" "}
            of{" "}
            {filteredRows.length ===
            0
              ? 0
              : totalPages}
          </span>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setCurrentPage(
                (page) =>
                  Math.min(
                    totalPages,
                    page + 1
                  )
              )
            }
            disabled={
              filteredRows.length ===
                0 ||
              currentPage >=
                totalPages
            }
            style={
              paginationButtonStyle
            }
          >
            Next
          </button>
        </div>
      </div>

      <div
        style={tableCardStyle}
        className="card"
      >
        <div
          style={
            tableScrollStyle
          }
        >
          <table
            style={tableStyle}
          >
            <thead
              style={
                tableHeadStyle
              }
            >
              <tr>
                <th
                  style={{
                    ...thStyle,
                    ...dateColumnHeaderStyle,
                  }}
                >
                  Date
                </th>

                <th style={thStyle}>
                  Care Type
                </th>

                <th style={thStyle}>
                  Medicine
                </th>

                <th style={thStyle}>
                  Target Group
                </th>

                <th
                  style={{
                    ...thStyle,
                    textAlign:
                      "center",
                  }}
                >
                  Eligible
                </th>

                <th
                  style={{
                    ...thStyle,
                    textAlign:
                      "center",
                  }}
                >
                  Administered
                </th>

                <th
                  style={{
                    ...thStyle,
                    textAlign:
                      "center",
                  }}
                >
                  Excluded
                </th>

                <th style={thStyle}>
  Next Schedule
</th>

<th style={thStyle}>
  Event Status
</th>

                <th
                  style={{
                    ...thStyle,
                    textAlign:
                      "center",
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
                    colSpan={10}
                    style={
                      emptyStateStyle
                    }
                  >
                    Loading preventive care records...
                  </td>
                </tr>
              ) : filteredRows.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={
                      emptyStateStyle
                    }
                  >
                    No preventive care records match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map(
                  (
                    row,
                    index
                  ) => (
                    <tr
                      key={
                        row.eventId ||
                        `${row.eventDate}-${index}`
                      }
                      onClick={() =>
                        setSelectedEntry(
                          row
                        )
                      }
                      style={{
                        borderBottom:
                          "1px solid #f1f5f9",

                        backgroundColor:
                          index % 2 ===
                          0
                            ? "#ffffff"
                            : "#f8fafc",

                        cursor:
                          "pointer",
                      }}
                      title="Click to view preventive care details"
                    >
                      <td
                        style={{
                          ...tdStyle,
                          ...dateColumnCellStyle,
                        }}
                      >
                        <strong
                          style={{
                            color:
                              "#0f172a",
                          }}
                        >
                          {formatDisplayDate(
                            row.eventDate
                          )}
                        </strong>

                        <div
                          style={
                            secondaryCellTextStyle
                          }
                        >
                          {row.eventId}
                        </div>
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        <CareTypeBadge
                          value={
                            row.careTypeName
                          }
                        />
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        <div
                          style={
                            primaryCellTextStyle
                          }
                        >
                          {row.medicineName ||
                            "-"}
                        </div>

                        {(row.dosage ||
                          row.dosageUnit) && (
                          <div
                            style={
                              secondaryCellTextStyle
                            }
                          >
                            Dose:{" "}
                            {row.dosage ||
                              "-"}{" "}
                            {row.dosageUnit ||
                              ""}
                          </div>
                        )}

                        {row.medicineBatchNo && (
                          <div
                            style={
                              secondaryCellTextStyle
                            }
                          >
                            Batch:{" "}
                            {
                              row.medicineBatchNo
                            }
                          </div>
                        )}
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        <div
                          style={
                            primaryCellTextStyle
                          }
                        >
                          {row.targetGroup ||
                            "-"}
                        </div>

                        {row.administrationRoute && (
                          <div
                            style={
                              secondaryCellTextStyle
                            }
                          >
                            {
                              row.administrationRoute
                            }
                          </div>
                        )}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          textAlign:
                            "center",
                        }}
                      >
                        {
                          row.eligibleCount
                        }
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          textAlign:
                            "center",
                        }}
                      >
                        {
                          row.administeredCount
                        }
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          textAlign:
                            "center",
                        }}
                      >
                        <CountBadge
                          value={
                            row.excludedCount
                          }
                        />
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {formatDisplayDate(
                          row.nextDueDate
                        )}

                        <div
                          style={{
                            marginTop:
                              "0.3rem",
                          }}
                        >
                          <DueStatusBadge
                            status={
                              row.dueStatus
                            }
                          />
                        </div>
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        <RecordStatusBadge
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
                        <button
                          type="button"
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();

                            openFormForEdit(
                              row
                            );
                          }}
                          style={
                            iconBtnStyle
                          }
                          title="Edit preventive care record"
                          aria-label="Edit preventive care record"
                        >
                          ✏️
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

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div
          style={overlayStyle}
          onClick={
            closeForm
          }
        >
          <div
            style={{
              ...modalStyle,
              maxWidth:
                "900px",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              style={
                modalHeaderStyle
              }
            >
              <div>
                <h2
                  style={
                    modalTitleStyle
                  }
                >
                  {mode === "add"
                    ? "Add Preventive Care"
                    : "Edit Preventive Care"}
                </h2>

                <p
                  style={
                    modalDescriptionStyle
                  }
                >
                  Record preventive treatment, medicine, target group and follow-up information.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                style={
                  closeButtonStyle
                }
                disabled={
                  saving
                }
                aria-label="Close preventive care form"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              style={{
                display:
                  "grid",
                gap: "1rem",
              }}
            >
              <SectionCard title="Event Details">
                <div
                  className="preventive-modal-grid"
                  style={
                    threeColumnGridStyle
                  }
                >
                  <Field label="Administration Date *">
                    <input
                      type="date"
                      name="eventDate"
                      value={
                        form.eventDate
                      }
                      onChange={
                        handleChange
                      }
                      className="form-input"
                      required
                      disabled={
                        saving
                      }
                    />
                  </Field>

                  <Field label="Preventive Care Type *">
                    <select
                      name="careTypeId"
                      value={
                        form.careTypeId
                      }
                      onChange={
                        handleCareTypeChange
                      }
                      className="form-select"
                      required
                      disabled={
                        saving
                      }
                    >
                      <option value="">
                        Select Care Type
                      </option>

                      {careTypes.map(
                        (
                          careType
                        ) => (
                          <option
                            key={
                              careType.careTypeId
                            }
                            value={
                              careType.careTypeId
                            }
                          >
                            {
                              careType.careTypeName
                            }
                          </option>
                        )
                      )}
                    </select>
                  </Field>

                  <Field label="Status *">
                    <select
                      name="status"
                      value={
                        form.status
                      }
                      onChange={
                        handleChange
                      }
                      className="form-select"
                      required
                      disabled={
                        saving
                      }
                    >
                      {STATUS_OPTIONS.map(
                        (
                          status
                        ) => (
                          <option
                            key={
                              status
                            }
                            value={
                              status
                            }
                          >
                            {status}
                          </option>
                        )
                      )}
                    </select>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="Medicine & Administration">
                <div
                  className="preventive-modal-grid"
                  style={
                    twoColumnGridStyle
                  }
                >
                  <Field label="Medicine *">
                    <select
                      value={`${form.medicineId}||${form.medicineName}`}
                      onChange={
                        handleMedicineChange
                      }
                      className="form-select"
                      required
                      disabled={
                        saving
                      }
                    >
                      <option value="||">
                        Select Medicine
                      </option>

                      {medicineOptions.map(
                        (
                          medicine,
                          index
                        ) => (
                          <option
                            key={
                              medicine.key ||
                              index
                            }
                            value={`${medicine.medicineId}||${medicine.medicineName}`}
                          >
                            {
                              medicine.medicineName
                            }
                          </option>
                        )
                      )}
                    </select>
                  </Field>

                  <Field label="Medicine Batch Number">
                    <input
                      type="text"
                      name="medicineBatchNo"
                      value={
                        form.medicineBatchNo
                      }
                      onChange={
                        handleChange
                      }
                      className="form-input"
                      placeholder="Example: FMD250101"
                      disabled={
                        saving
                      }
                    />
                  </Field>

                  <Field label="Medicine Expiry Date">
                    <input
                      type="date"
                      name="medicineExpiryDate"
                      value={
                        form.medicineExpiryDate
                      }
                      onChange={
                        handleChange
                      }
                      className="form-input"
                      min={
                        form.eventDate ||
                        undefined
                      }
                      disabled={
                        saving
                      }
                    />
                  </Field>

                  <Field label="Administration Route">
                    <select
                      name="administrationRoute"
                      value={
                        form.administrationRoute
                      }
                      onChange={
                        handleChange
                      }
                      className="form-select"
                      disabled={
                        saving
                      }
                    >
                      <option value="">
                        Select Route
                      </option>

                      {ADMINISTRATION_ROUTES.map(
                        (
                          route
                        ) => (
                          <option
                            key={
                              route
                            }
                            value={
                              route
                            }
                          >
                            {route}
                          </option>
                        )
                      )}
                    </select>
                  </Field>

                  <Field label="Dosage">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="dosage"
                      value={
                        form.dosage
                      }
                      onChange={
                        handleChange
                      }
                      className="form-input"
                      placeholder="Example: 2"
                      disabled={
                        saving
                      }
                    />
                  </Field>

                  <Field label="Dosage Unit">
                    <select
                      name="dosageUnit"
                      value={
                        form.dosageUnit
                      }
                      onChange={
                        handleChange
                      }
                      className="form-select"
                      disabled={
                        saving
                      }
                    >
                      <option value="">
                        Select Unit
                      </option>

                      {DOSAGE_UNITS.map(
                        (
                          unit
                        ) => (
                          <option
                            key={
                              unit
                            }
                            value={
                              unit
                            }
                          >
                            {unit}
                          </option>
                        )
                      )}
                    </select>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="Target Group & Coverage">
                <Field label="Target Group *">
                  <input
                    type="text"
                    name="targetGroup"
                    value={
                      form.targetGroup
                    }
                    onChange={
                      handleChange
                    }
                    className="form-input"
                    placeholder="Example: All Adult Cattle, Calves 0–12 Months or Shed 2"
                    required
                    disabled={
                      saving
                    }
                  />
                </Field>

                <div
                  className="preventive-modal-grid"
                  style={
                    threeColumnGridStyle
                  }
                >
                  <Field label="Eligible Count *">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      name="eligibleCount"
                      value={
                        form.eligibleCount
                      }
                      onChange={
                        handleChange
                      }
                      className="form-input"
                      placeholder="0"
                      required
                      disabled={
                        saving
                      }
                    />
                  </Field>

                  <Field label="Administered Count *">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="administeredCount"
                      value={
                        form.administeredCount
                      }
                      onChange={
                        handleChange
                      }
                      className="form-input"
                      placeholder="0"
                      required
                      disabled={
                        saving
                      }
                    />
                  </Field>

                  <Field label="Excluded Count">
                    <input
                      type="number"
                      value={
                        form.excludedCount
                      }
                      className="form-input"
                      disabled
                      readOnly
                    />

                    <div
                      style={
                        helperTextStyle
                      }
                    >
                      Automatically calculated as Eligible minus Administered.
                    </div>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="Follow-up & Notes">
                <div
                  className="preventive-modal-grid"
                  style={
                    twoColumnGridStyle
                  }
                >
                  <Field label="Next Due Date">
                    <input
                      type="date"
                      name="nextDueDate"
                      value={
                        form.nextDueDate
                      }
                      onChange={
                        handleChange
                      }
                      className="form-input"
                      min={
                        form.eventDate ||
                        undefined
                      }
                      disabled={
                        saving
                      }
                    />
                  </Field>

                  <Field label="Doctor / Administered By">
                    <input
                      type="text"
                      name="doctorName"
                      value={
                        form.doctorName
                      }
                      onChange={
                        handleChange
                      }
                      className="form-input"
                      placeholder="Enter doctor or staff name"
                      disabled={
                        saving
                      }
                    />
                  </Field>
                </div>

                <Field label="Remarks">
                  <textarea
                    name="remarks"
                    value={
                      form.remarks
                    }
                    onChange={
                      handleChange
                    }
                    className="form-input"
                    rows={4}
                    placeholder="Enter observations, exclusions, instructions or follow-up notes"
                    disabled={
                      saving
                    }
                    style={{
                      resize:
                        "vertical",
                      minHeight:
                        "90px",
                    }}
                  />
                </Field>
              </SectionCard>

              <div
                style={
                  modalActionsStyle
                }
              >
                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  className="btn btn-secondary btn-full-mobile"
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
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
          onClick={() =>
            setSelectedEntry(
              null
            )
          }
        >
          <div
            style={{
              ...modalStyle,
              maxWidth:
                "900px",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              style={
                modalHeaderStyle
              }
            >
              <div>
                <h2
                  style={
                    modalTitleStyle
                  }
                >
                  Preventive Care Details
                </h2>

                <p
                  style={
                    modalDescriptionStyle
                  }
                >
                  Event ID:{" "}
                  <strong
                    style={{
                      color:
                        "#0f172a",
                    }}
                  >
                    {selectedEntry.eventId ||
                      "-"}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedEntry(
                    null
                  )
                }
                style={
                  closeButtonStyle
                }
                aria-label="Close preventive care details"
              >
                &times;
              </button>
            </div>

            <div
              style={{
                display:
                  "grid",
                gap: "1rem",
              }}
            >
              <SectionCard title="Event Details">
                <div
                  style={
                    detailGridStyle
                  }
                >
                  <DetailItem
                    label="Administration Date"
                    value={formatDisplayDate(
                      selectedEntry.eventDate
                    )}
                  />

                  <DetailItem
                    label="Care Type"
                    value={
                      selectedEntry.careTypeName
                    }
                  />

                  <DetailItem
                    label="Status"
                    value={
                      selectedEntry.status
                    }
                  />

                  <DetailItem
                    label="Doctor / Administered By"
                    value={
                      selectedEntry.doctorName
                    }
                  />
                </div>
              </SectionCard>

              <SectionCard title="Medicine & Administration">
                <div
                  style={
                    detailGridStyle
                  }
                >
                  <DetailItem
                    label="Medicine"
                    value={
                      selectedEntry.medicineName
                    }
                  />

                  <DetailItem
                    label="Medicine ID"
                    value={
                      selectedEntry.medicineId
                    }
                  />

                  <DetailItem
                    label="Batch Number"
                    value={
                      selectedEntry.medicineBatchNo
                    }
                  />

                  <DetailItem
                    label="Expiry Date"
                    value={formatDisplayDate(
                      selectedEntry.medicineExpiryDate
                    )}
                  />

                  <DetailItem
                    label="Dosage"
                    value={
                      selectedEntry.dosage
                        ? `${selectedEntry.dosage} ${selectedEntry.dosageUnit || ""}`
                        : "-"
                    }
                  />

                  <DetailItem
                    label="Administration Route"
                    value={
                      selectedEntry.administrationRoute
                    }
                  />
                </div>
              </SectionCard>

              <SectionCard title="Target Group & Coverage">
                <div
                  style={
                    detailGridStyle
                  }
                >
                  <DetailItem
                    label="Target Group"
                    value={
                      selectedEntry.targetGroup
                    }
                  />

                  <DetailItem
                    label="Eligible Count"
                    value={
                      selectedEntry.eligibleCount
                    }
                  />

                  <DetailItem
                    label="Administered Count"
                    value={
                      selectedEntry.administeredCount
                    }
                  />

                  <DetailItem
                    label="Excluded Count"
                    value={
                      selectedEntry.excludedCount
                    }
                  />
                </div>
              </SectionCard>

              <SectionCard title="Follow-up">
                <div
                  style={
                    detailGridStyle
                  }
                >
                  <DetailItem
                    label="Next Due Date"
                    value={formatDisplayDate(
                      selectedEntry.nextDueDate
                    )}
                  />

                  <div>
                    <div
                      style={
                        detailLabelStyle
                      }
                    >
                      Due Status
                    </div>

                    <div
                      style={{
                        marginTop:
                          "0.3rem",
                      }}
                    >
                      <DueStatusBadge
                        status={
                          selectedEntry.dueStatus
                        }
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Remarks">
                <DetailItem
                  label="Remarks"
                  value={
                    selectedEntry.remarks
                  }
                />
              </SectionCard>

              <SectionCard title="Audit Information">
                <div
                  style={
                    detailGridStyle
                  }
                >
                  <DetailItem
                    label="Created By"
                    value={
                      selectedEntry.createdBy
                    }
                  />

                  <DetailItem
                    label="Created At"
                    value={
                      selectedEntry.createdAt
                    }
                  />

                  <DetailItem
                    label="Updated By"
                    value={
                      selectedEntry.updatedBy
                    }
                  />

                  <DetailItem
                    label="Updated At"
                    value={
                      selectedEntry.updatedAt
                    }
                  />
                </div>
              </SectionCard>
            </div>

            <div
              style={
                modalActionsStyle
              }
            >
              <button
                type="button"
                onClick={() => {
                  const entry =
                    selectedEntry;

                  setSelectedEntry(
                    null
                  );

                  openFormForEdit(
                    entry
                  );
                }}
                className="btn btn-primary"
              >
                Edit This Entry
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedEntry(
                    null
                  )
                }
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

function Field({
  label,
  children,
}) {
  return (
    <div
      style={{
        marginBottom:
          "0.5rem",
      }}
    >
      <label
        style={
          fieldLabelStyle
        }
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function DetailItem({
  label,
  value,
}) {
  const displayValue =
    value === 0
      ? 0
      : value || "-";

  return (
    <div
      style={
        detailItemStyle
      }
    >
      <div
        style={
          detailLabelStyle
        }
      >
        {label}
      </div>

      <div
        style={
          detailValueStyle
        }
      >
        {displayValue}
      </div>
    </div>
  );
}

function CareTypeBadge({
  value,
}) {
  const key = String(
    value || ""
  ).toLowerCase();

  let style =
    careTypeDefaultStyle;

  if (
    key === "vaccination"
  ) {
    style =
      careTypeVaccinationStyle;
  } else if (
    key === "deworming"
  ) {
    style =
      careTypeDewormingStyle;
  } else if (
    key.includes("vitamin")
  ) {
    style =
      careTypeVitaminStyle;
  } else if (
    key.includes("mineral")
  ) {
    style =
      careTypeMineralStyle;
  } else if (
    key.includes("other")
  ) {
    style =
      careTypeOtherStyle;
  }

  return (
    <span
      style={{
        ...badgeBaseStyle,
        ...style,
      }}
    >
      {value ||
        "Not Recorded"}
    </span>
  );
}

function RecordStatusBadge({
  value,
}) {
  const key = String(
    value || ""
  ).toLowerCase();

  const style =
    key === "completed"
      ? recordCompletedStyle
      : key === "draft"
        ? recordDraftStyle
        : key === "cancelled"
          ? recordCancelledStyle
          : recordDefaultStyle;

  return (
    <span
      style={{
        ...badgeBaseStyle,
        ...style,
      }}
    >
      {value ||
        "Not Recorded"}
    </span>
  );
}

function DueStatusBadge({
  status,
}) {
  const safeStatus =
    status || {
      key:
        "not-scheduled",
      label:
        "Not Scheduled",
    };

  const style =
    safeStatus.key ===
    "upcoming"
      ? dueUpcomingStyle
      : safeStatus.key ===
          "due-today"
        ? dueTodayStyle
        : safeStatus.key ===
            "overdue"
          ? dueOverdueStyle
          : safeStatus.key ===
              "cancelled"
            ? dueCancelledStyle
            : dueNotScheduledStyle;

  return (
    <span
      style={{
        ...badgeBaseStyle,
        ...style,
      }}
    >
      {safeStatus.label}
    </span>
  );
}

function CountBadge({
  value,
}) {
  const numericValue =
    Number(value || 0);

  const style =
    numericValue > 0
      ? excludedCountStyle
      : zeroCountStyle;

  return (
    <span
      style={{
        ...countBadgeBaseStyle,
        ...style,
      }}
    >
      {numericValue}
    </span>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const pageStyle = {
  padding: "1.5rem",
  maxWidth: "1400px",
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
    "repeat(auto-fit, minmax(175px, 1fr))",
  gap: "0.85rem",
  alignItems: "end",
};

const twoColumnGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "1rem",
};

const threeColumnGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
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
  minHeight: "390px",
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
  fontSize: "0.88rem",
  minWidth: "1320px",
};

const tableHeadStyle = {
  background: "#f8fafc",
  borderBottom: "2px solid #e2e8f0",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const thStyle = {
  padding: "0.8rem 0.85rem",
  textAlign: "left",
  fontWeight: 700,
  fontSize: "0.7rem",
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "0.75rem 0.85rem",
  borderBottom: "1px solid #f1f5f9",
  color: "#1f2937",
  verticalAlign: "top",
};

const dateColumnHeaderStyle = {
  width: "120px",
  minWidth: "120px",
};

const dateColumnCellStyle = {
  width: "120px",
  minWidth: "120px",
  whiteSpace: "nowrap",
};

const primaryCellTextStyle = {
  maxWidth: "250px",
  lineHeight: 1.4,
  fontWeight: 600,
  color: "#0f172a",
};

const secondaryCellTextStyle = {
  marginTop: "0.25rem",
  fontSize: "0.76rem",
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
  background: "rgba(15, 23, 42, 0.55)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 50,
  padding: "1rem",
};

const modalStyle = {
  background: "#ffffff",
  padding: "1.25rem",
  borderRadius: "12px",
  width: "100%",
  maxHeight: "92vh",
  overflowY: "auto",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.28)",
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

const fieldLabelStyle = {
  display: "block",
  fontSize: "0.8rem",
  color: "#374151",
  marginBottom: "0.3rem",
  fontWeight: 600,
};

const helperTextStyle = {
  marginTop: "0.3rem",
  fontSize: "0.72rem",
  color: "#64748b",
  lineHeight: 1.35,
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

const badgeBaseStyle = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "0.24rem 0.55rem",
  fontSize: "0.71rem",
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

const careTypeVitaminStyle = {
  background: "#ecfeff",
  border: "1px solid #67e8f9",
  color: "#0e7490",
};

const careTypeMineralStyle = {
  background: "#faf5ff",
  border: "1px solid #d8b4fe",
  color: "#7e22ce",
};

const careTypeOtherStyle = {
  background: "#fefce8",
  border: "1px solid #fde047",
  color: "#a16207",
};

const careTypeDefaultStyle = {
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
  color: "#475569",
};

const recordCompletedStyle = {
  background: "#ecfdf5",
  border: "1px solid #86efac",
  color: "#047857",
};

const recordDraftStyle = {
  background: "#eff6ff",
  border: "1px solid #93c5fd",
  color: "#1d4ed8",
};

const recordCancelledStyle = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#b91c1c",
};

const recordDefaultStyle = {
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

const dueCancelledStyle = {
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
  color: "#64748b",
};

const dueNotScheduledStyle = {
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  color: "#64748b",
};

const countBadgeBaseStyle = {
  display: "inline-flex",
  minWidth: "30px",
  justifyContent: "center",
  borderRadius: "999px",
  padding: "0.18rem 0.45rem",
  fontSize: "0.75rem",
  fontWeight: 800,
};

const excludedCountStyle = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#b91c1c",
};

const zeroCountStyle = {
  background: "#f0fdf4",
  border: "1px solid #86efac",
  color: "#166534",
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