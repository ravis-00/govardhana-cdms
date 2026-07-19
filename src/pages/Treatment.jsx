import React, { useEffect, useMemo, useState } from "react";
import {
  getTreatments,
  addTreatment,
  updateTreatment,
  getMedicines,
  getCattle,
} from "../api/masterApi";
import PageHeader from "../components/common/PageHeader";
import MetricCard from "../components/common/MetricCard";
import SectionCard from "../components/common/SectionCard";

// --- HELPERS ---
function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getCurrentMonthDateRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const toIsoDate = (date) => {
    const dateYear = date.getFullYear();
    const dateMonth = String(date.getMonth() + 1).padStart(2, "0");
    const dateDay = String(date.getDate()).padStart(2, "0");

    return `${dateYear}-${dateMonth}-${dateDay}`;
  };

  return {
    fromDate: toIsoDate(firstDay),
    toDate: toIsoDate(lastDay),
  };
}

function formatDateDisplay(value) {
  if (!value) return "";
  // Check if it's already ISO Date string
  const d = new Date(value);
  if (!isNaN(d.getTime())) {
     const day = String(d.getDate()).padStart(2, '0');
     const mon = String(d.getMonth() + 1).padStart(2, '0');
     const year = d.getFullYear();
     return `${day}-${mon}-${year}`;
  }
  return String(value);
}

const DISEASE_OPTIONS = [
  "Anemic", "Back Left Leg fracture", "Back Right Leg fracture", "Bloating",
  "Broken Horn", "Bronchitis", "Fever", "Front Left Leg fracture",
  "Front Right Leg fracture", "Indigestion", "Inflammation", "Injury",
  "Pneumonia", "Skin Infection", "Sprain, Limping", "Weakness", "Wound",
  "Lumpy Skin Disease (LSD)", "Mastitis", "Metritis / Pyometra",
  "Retained Placenta", "Udder Edema"
];

export default function Treatment() {
  const initialDateRange = getCurrentMonthDateRange();

const [fromDate, setFromDate] = useState(initialDateRange.fromDate);
const [toDate, setToDate] = useState(initialDateRange.toDate);
  const [rows, setRows] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]); 
  const [cattleList, setCattleList] = useState([]);
const [validatedCattle, setValidatedCattle] = useState(null);
const [cattleValidationError, setCattleValidationError] = useState("");
const [validatingCattle, setValidatingCattle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
  visible: false,
  type: "info",
  message: "",
});
const [error, setError] = useState("");

const [searchTerm, setSearchTerm] = useState("");
const [diseaseFilter, setDiseaseFilter] = useState("");
const [doctorFilter, setDoctorFilter] = useState("");


  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm());
  const [mode, setMode] = useState("add"); 
  const [editingId, setEditingId] = useState(null);
  const [originalCattleId, setOriginalCattleId] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [diseaseSearch, setDiseaseSearch] = useState("");
const [medicineSearch, setMedicineSearch] = useState("");

  // --- FETCH DATA ---
  useEffect(() => {
    loadData();
  }, []); 

  async function loadData() {
  try {
    setLoading(true);
    setError("");

    // Medicines and treatments are independent, so load them together.
    const [medicinesResult, treatmentsResult, cattleResult] =
  await Promise.allSettled([
    getMedicines(),
    getTreatments(),
    getCattle(),
  ]);

    if (medicinesResult.status === "fulfilled") {
      const response = medicinesResult.value;

      const medicines = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setMedicinesList(medicines);
    } else {
      console.warn(
        "Medicines master could not be loaded:",
        medicinesResult.reason
      );
      setMedicinesList([]);
    }

if (cattleResult.status === "fulfilled") {
  const cattleResponse = cattleResult.value;

  const cattleData = Array.isArray(cattleResponse)
    ? cattleResponse
    : Array.isArray(cattleResponse?.data)
      ? cattleResponse.data
      : [];

  setCattleList(cattleData);
} else {
  console.warn(
    "Cattle master could not be loaded:",
    cattleResult.reason
  );
  setCattleList([]);
}

    if (treatmentsResult.status === "rejected") {
      throw treatmentsResult.reason;
    }

    const response = treatmentsResult.value;

    const rawList = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

    const normalised = rawList.map((row) => ({
      id: row.id || row.record_id || row.treatment_id || "",

      cattleId:
        row.cattleId ||
        row.cattle_id ||
        row.tag_number ||
        row.tagNumber ||
        "",

      date:
        row.date ||
        row.visit_date ||
        row.treatment_date ||
        "",

      diseaseSymptoms:
        row.diseaseSymptoms ||
        row.disease_symptoms ||
        row.disease ||
        row.symptoms ||
        "",

      medicine:
        row.medicine ||
        row.medicines ||
        row.medicine_name ||
        "",

      doctorName:
        row.doctorName ||
        row.doctor_name ||
        row.doctor ||
        "",

      photoUrl:
        row.photoUrl ||
        row.photo_url ||
        "",

      remarks:
        row.remarks ||
        row.notes ||
        "",
    }));

    normalised.sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    );

    setRows(normalised);
  } catch (err) {
    console.error("Clinical records load failed:", err);
    setRows([]);
    setError(err?.message || "Unable to load clinical records");
  } finally {
    setLoading(false);
  }
}

      

  const dateRangeRows = useMemo(() => {
  return rows.filter((row) => {
    const rowDate = String(row.date || "").slice(0, 10);

    if (!rowDate) return false;
    if (fromDate && rowDate < fromDate) return false;
    if (toDate && rowDate > toDate) return false;

    return true;
  });
}, [rows, fromDate, toDate]);

const diseaseOptions = useMemo(() => {
  const values = new Set(DISEASE_OPTIONS);

  rows.forEach((row) => {
    String(row.diseaseSymptoms || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => values.add(item));
  });

  return Array.from(values).sort((a, b) => a.localeCompare(b));
}, [rows]);

const doctorOptions = useMemo(() => {
  return Array.from(
    new Set(
      rows
        .map((row) => String(row.doctorName || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}, [rows]);

const cattleOptions = useMemo(() => {
  return Array.from(
    new Set(
      rows
        .map((row) => String(row.cattleId || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}, [rows]);

const medicineOptions = useMemo(() => {
  return Array.from(
    new Set(
      medicinesList
        .map((medicine) =>
          typeof medicine === "object"
            ? medicine.name ||
              medicine.medicine_name ||
              medicine.medicineName ||
              ""
            : medicine
        )
        .map((medicine) => String(medicine || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}, [medicinesList]);

const filteredDiseaseOptions = useMemo(() => {
  const query = diseaseSearch.trim().toLowerCase();

  if (!query) return diseaseOptions;

  return diseaseOptions.filter((option) =>
    option.toLowerCase().includes(query)
  );
}, [diseaseOptions, diseaseSearch]);

const filteredMedicineOptions = useMemo(() => {
  const query = medicineSearch.trim().toLowerCase();

  if (!query) return medicineOptions;

  return medicineOptions.filter((option) =>
    option.toLowerCase().includes(query)
  );
}, [medicineOptions, medicineSearch]);

const filteredRows = useMemo(() => {
  const query = searchTerm.trim().toLowerCase();

  return dateRangeRows.filter((row) => {
    const cattleText = String(row.cattleId || "").toLowerCase();
    const diseaseText = String(row.diseaseSymptoms || "").toLowerCase();
    const medicineText = String(row.medicine || "").toLowerCase();
    const doctorText = String(row.doctorName || "").toLowerCase();

    const matchesSearch =
      !query ||
      cattleText.includes(query) ||
      diseaseText.includes(query) ||
      medicineText.includes(query) ||
      doctorText.includes(query);

    const matchesDisease =
      !diseaseFilter ||
      String(row.diseaseSymptoms || "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .includes(diseaseFilter.toLowerCase());

    const matchesDoctor =
      !doctorFilter ||
      doctorText === doctorFilter.toLowerCase();

    return matchesSearch && matchesDisease && matchesDoctor;
  });
}, [
  dateRangeRows,
  searchTerm,
  diseaseFilter,
  doctorFilter,
]);

const metrics = useMemo(() => {
  const today = new Date().toISOString().slice(0, 10);

  return {
    total: rows.length,

    selectedPeriod: dateRangeRows.length,

    today: rows.filter(
      (row) => String(row.date || "").slice(0, 10) === today
    ).length,

    animals: new Set(
      dateRangeRows
        .map((row) => String(row.cattleId || "").trim())
        .filter(Boolean)
    ).size,

    doctors: new Set(
      dateRangeRows
        .map((row) => String(row.doctorName || "").trim())
        .filter(Boolean)
    ).size,
  };
}, [rows, dateRangeRows]);

const selectedRecordCattle = useMemo(() => {
  if (!selectedEntry?.cattleId) return null;

  return findCattleByEnteredId(selectedEntry.cattleId);
}, [selectedEntry, cattleList]);

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

function showTemporaryToast(message, type = "success", duration = 3000) {
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
  setDiseaseFilter("");
  setDoctorFilter("");
}

function normaliseLookupValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normaliseNumericIdentifier(value) {
  const text = String(value || "").trim();

  if (!/^\d+$/.test(text)) {
    return "";
  }

  // Allows historical IDs whose leading zero was removed by Google Sheets.
  return text.replace(/^0+/, "") || "0";
}

function findCattleByEnteredId(value) {
  const lookup = normaliseLookupValue(value);

  if (!lookup) return null;

  return (
    cattleList.find((cattle) => {
      const directCandidates = [
        cattle.internalId,
        cattle.internal_id,
        cattle.id,

        cattle.tag,
        cattle.tagNo,
        cattle.tag_number,
        cattle.tagNumber,
        cattle.cattleId,

        cattle.govtUid,
        cattle.govt_uid,
      ];

      const lookupNumeric = normaliseNumericIdentifier(value);

const directMatch = directCandidates.some((candidate) => {
  const exactMatch =
    normaliseLookupValue(candidate) === lookup;

  if (exactMatch) return true;

  const candidateNumeric =
    normaliseNumericIdentifier(candidate);

  return (
    lookupNumeric &&
    candidateNumeric &&
    candidateNumeric === lookupNumeric
  );
});

      if (directMatch) return true;

      /*
       * Historical treatment entries may contain an older tag.
       * Match against previous-tag fields as well.
       */
      const previousTagsValue =
        cattle.prevTagNumbers ||
        cattle.prev_tag_numbers ||
        cattle.previousTags ||
        cattle.previous_tags ||
        "";

      const previousTags = Array.isArray(previousTagsValue)
        ? previousTagsValue
        : String(previousTagsValue)
            .split(/[,;|/]+/)
            .map((item) => item.trim())
            .filter(Boolean);

      return previousTags.some((previousTag) => {
  const exactMatch =
    normaliseLookupValue(previousTag) === lookup;

  if (exactMatch) return true;

  const previousTagNumeric =
    normaliseNumericIdentifier(previousTag);

  return (
    lookupNumeric &&
    previousTagNumeric &&
    previousTagNumeric === lookupNumeric
  );
});
    }) || null
  );
}

function validateCattleId(value = form.cattleId) {
  const enteredValue = String(value || "").trim();

  setCattleValidationError("");
  setValidatedCattle(null);

  if (!enteredValue) {
    setCattleValidationError("Cattle ID is required.");
    return false;
  }

  if (cattleList.length === 0) {
    setCattleValidationError(
      "Cattle master is unavailable. Please reload the page."
    );
    return false;
  }

  setValidatingCattle(true);

  const matchedCattle = findCattleByEnteredId(enteredValue);

  setValidatingCattle(false);

  if (!matchedCattle) {
    setCattleValidationError(
      "Cattle ID not found. Please check and enter a valid registered cattle ID."
    );
    return false;
  }

  const status = String(
    matchedCattle.status || ""
  ).toLowerCase();

  if (status && status !== "active") {
    setCattleValidationError(
      `This cattle is currently ${matchedCattle.status}. Clinical records can be added only for active cattle.`
    );
    return false;
  }

  setValidatedCattle(matchedCattle);
  setCattleValidationError("");

  return true;
}

  function getEmptyForm() {
    return {
      cattleId: "",
      date: new Date().toISOString().slice(0, 10),
      diseaseSymptoms: [],
      medicine: [],
      doctorName: "",
      photoUrl: "",
      remarks: "",
    };
  }

  function openFormForAdd() {
  setMode("add");
  setEditingId(null);
  setOriginalCattleId("");
  setForm(getEmptyForm());

  setValidatedCattle(null);
  setCattleValidationError("");
  setValidatingCattle(false);

  setDiseaseSearch("");
  setMedicineSearch("");
  setShowForm(true);
}

  function openFormForEdit(entry) {
  setMode("edit");
  setEditingId(entry.id);

  setOriginalCattleId(
    String(entry.cattleId || "").trim()
  );

  const toArray = (value) =>
    value
      ? String(value)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  setForm({
    cattleId: entry.cattleId || "",
    date: entry.date || "",
    diseaseSymptoms: toArray(entry.diseaseSymptoms),
    medicine: toArray(entry.medicine),
    doctorName: entry.doctorName || "",
    photoUrl: entry.photoUrl || "",
    remarks: entry.remarks || "",
  });

  const matchedCattle = findCattleByEnteredId(
    entry.cattleId
  );

  setValidatedCattle(matchedCattle);

  // Do not show an error simply because an older saved record
  // cannot be matched to the current Master Cattle list.
  setCattleValidationError("");

  setDiseaseSearch("");
  setMedicineSearch("");
  setShowForm(true);
}

  

  function toggleMultiValue(field, value) {
  setForm((previous) => {
    const currentValues = Array.isArray(previous[field])
      ? previous[field]
      : [];

    const exists = currentValues.includes(value);

    return {
      ...previous,
      [field]: exists
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value],
    };
  });
}

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
  event.preventDefault();

  const enteredCattleId = String(
    form.cattleId || ""
  ).trim();

  const isUnchangedHistoricalEdit =
    mode === "edit" &&
    enteredCattleId === originalCattleId;

  const matchedCattle =
    validatedCattle ||
    findCattleByEnteredId(enteredCattleId);

  if (!matchedCattle && !isUnchangedHistoricalEdit) {
    setValidatedCattle(null);
    setCattleValidationError(
      "Cattle ID not found. Please check and enter a valid registered cattle ID."
    );

    showTemporaryToast(
      "Please enter a valid registered cattle ID.",
      "error",
      4000
    );

    return;
  }

  if (matchedCattle) {
    const cattleStatus = String(
      matchedCattle.status || ""
    ).toLowerCase();

    if (
      cattleStatus &&
      cattleStatus !== "active" &&
      !isUnchangedHistoricalEdit
    ) {
      setValidatedCattle(null);

      setCattleValidationError(
        `This cattle is currently ${matchedCattle.status}. Clinical records can be added only for active cattle.`
      );

      showTemporaryToast(
        "Clinical records can be added only for active cattle.",
        "error",
        4000
      );

      return;
    }

    setValidatedCattle(matchedCattle);
  }

  setCattleValidationError("");
  setLoading(true);

  showToast(
    mode === "add"
      ? "Please wait... Saving clinical record."
      : "Please wait... Updating clinical record.",
    "loading"
  );

  const payload = {
    id: editingId,
    ...form,
    cattleId: enteredCattleId,
    diseaseSymptoms: form.diseaseSymptoms.join(", "),
    medicine: form.medicine.join(", "),
  };

  try {
    if (mode === "add") {
      await addTreatment(payload);
    } else {
      await updateTreatment(payload);
    }

    setShowForm(false);
    await loadData();

    showTemporaryToast(
      mode === "add"
        ? "Clinical record saved successfully."
        : "Clinical record updated successfully.",
      "success",
      3500
    );
  } catch (err) {
    console.error("Clinical record save failed:", err);

    showTemporaryToast(
      err?.message ||
        "Unable to save the clinical record. Please try again.",
      "error",
      5000
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {toast.visible && (
  <div
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
    @keyframes clinical-toast-spin {
      from {
        transform: rotate(0deg);
      }

      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 640px) {
      .clinical-toast-mobile {
        left: 16px;
        right: 16px;
        min-width: 0;
      }
    }
  `}
</style>
      
      {/* HEADER */}
      <PageHeader
  title="Clinical Records"
  description="Record, review and manage veterinary treatment history."
  countText={`Showing ${filteredRows.length} of ${rows.length} records`}
  action={
    <button
      type="button"
      onClick={openFormForAdd}
      className="btn btn-primary"
      style={{ whiteSpace: "nowrap" }}
    >
      + Add Clinical Record
    </button>
  }
/>

<div
  style={{
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    marginBottom: "1rem",
  }}
>
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
    label="Today's Cases"
    value={metrics.today}
    color="#16a34a"
  />

  <MetricCard
  label="Cattle Treated"
    value={metrics.animals}
    color="#7c3aed"
  />

  <MetricCard
    label="Doctors"
    value={metrics.doctors}
    color="#0891b2"
  />
</div>

<SectionCard title="Search & Filters">
  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "0.85rem",
      alignItems: "end",
    }}
  >
    <Field label="Search">
      <input
        type="text"
        value={searchTerm}
        onChange={(event) =>
          setSearchTerm(event.target.value)
        }
        className="form-input"
        placeholder="Cattle ID, disease, medicine or doctor"
      />
    </Field>

    <Field label="From Date">
  <input
    type="date"
    value={fromDate}
    onChange={(event) => setFromDate(event.target.value)}
    className="form-input"
    max={toDate || undefined}
  />
</Field>

<Field label="To Date">
  <input
    type="date"
    value={toDate}
    onChange={(event) => setToDate(event.target.value)}
    className="form-input"
    min={fromDate || undefined}
  />
</Field>

    <Field label="Disease / Symptom">
      <select
        value={diseaseFilter}
        onChange={(event) =>
          setDiseaseFilter(event.target.value)
        }
        className="form-select"
      >
        <option value="">All Diseases</option>

        {diseaseOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>

    <Field label="Doctor">
      <select
        value={doctorFilter}
        onChange={(event) =>
          setDoctorFilter(event.target.value)
        }
        className="form-select"
      >
        <option value="">All Doctors</option>

        {doctorOptions.map((doctor) => (
          <option key={doctor} value={doctor}>
            {doctor}
          </option>
        ))}
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
  <div
    style={{
      marginBottom: "1rem",
      padding: "0.75rem 1rem",
      borderRadius: "8px",
      border: "1px solid #fecaca",
      background: "#fef2f2",
      color: "#b91c1c",
      fontSize: "0.9rem",
    }}
  >
    {error}
  </div>
)}

<div
  className="card"
  style={{
    padding: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: "380px",
    maxHeight: "calc(100vh - 390px)",
  }}
>
  <div
    style={{
      flex: 1,
      overflowY: "auto",
      overflowX: "auto",
    }}
  >
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "0.9rem",
        minWidth: "900px",
      }}
    >
      <thead
        style={{
          background: "#f8fafc",
          borderBottom: "2px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <tr>
          <th style={thStyle}>Date</th>
          <th style={thStyle}>Cattle ID</th>
          <th style={thStyle}>Diagnosis / Symptoms</th>
          <th style={thStyle}>Doctor</th>
          <th style={thStyle}>Medicines</th>

          <th style={{ ...thStyle, textAlign: "center" }}>
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td
              colSpan={6}
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              Loading clinical records...
            </td>
          </tr>
        ) : filteredRows.length === 0 ? (
          <tr>
            <td
              colSpan={6}
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              No clinical records match the selected filters.
            </td>
          </tr>
        ) : (
          filteredRows.map((row, index) => {
            const medicineCount = String(row.medicine || "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean).length;

            return (
              <tr
  key={
    row.id ||
    `${row.cattleId}-${row.date}-${index}`
  }
  onClick={() => setSelectedEntry(row)}
  style={{
    borderBottom: "1px solid #f1f5f9",
    backgroundColor:
      index % 2 === 0 ? "#ffffff" : "#f8fafc",
    cursor: "pointer",
  }}
  title="Click to view clinical record details"
>
                <td style={tdStyle}>
                  {formatDateDisplay(row.date)}
                </td>

                <td style={tdStyle}>
                  <strong style={{ color: "#0f172a" }}>
                    {row.cattleId || "-"}
                  </strong>
                </td>

                <td style={tdStyle}>
                  <div
                    style={{
                      maxWidth: "320px",
                      lineHeight: 1.4,
                    }}
                  >
                    {row.diseaseSymptoms || "-"}
                  </div>
                </td>

                <td style={tdStyle}>
                  {row.doctorName || "-"}
                </td>

                <td style={tdStyle}>
                  {medicineCount > 0
                    ? `${medicineCount} medicine${
                        medicineCount > 1 ? "s" : ""
                      }`
                    : "-"}
                </td>

                <td
                  style={{
                    ...tdStyle,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "0.35rem",
                      justifyContent: "center",
                    }}
                  >
                    

                    <button
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    openFormForEdit(row);
  }}
  style={iconBtnStyle}
  title="Edit record"
  aria-label="Edit clinical record"
>
  ✏️
</button>
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

      {/* Add/Edit Modal */}
      {/* Add/Edit Clinical Record Modal */}
{showForm && (
  <div
    style={overlayStyle}
    onClick={() => {
      if (!loading) setShowForm(false);
    }}
  >
    <div
      style={{
        ...modalStyle,
        maxWidth: "760px",
        padding: "1.25rem",
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div style={modalHeaderStyle}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.3rem", color: "#0f172a" }}>
            {mode === "add"
              ? "Add Clinical Record"
              : "Edit Clinical Record"}
          </h2>

          <p
            style={{
              margin: "4px 0 0",
              color: "#64748b",
              fontSize: "0.85rem",
            }}
          >
            Record the cattle condition, treatment and veterinary notes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(false)}
          style={closeButtonStyle}
          disabled={loading}
          aria-label="Close clinical record form"
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
        <SectionCard title="Cattle & Visit">
  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "1rem",
    }}
  >
    <Field label="Cattle ID *">
      <input
        type="text"
        name="cattleId"
        value={form.cattleId}
        onChange={(event) => {
          handleChange(event);
          setValidatedCattle(null);
          setCattleValidationError("");
        }}
        onBlur={(event) =>
          validateCattleId(event.target.value)
        }
        className="form-input"
        placeholder="Enter Tag Number, Internal ID or Govt UID"
        required
        disabled={loading}
        autoComplete="off"
      />

      <div
        style={{
          marginTop: "0.35rem",
          fontSize: "0.76rem",
          color: cattleValidationError
            ? "#b91c1c"
            : validatedCattle
              ? "#15803d"
              : "#64748b",
        }}
      >
        {validatingCattle
          ? "Checking cattle ID..."
          : cattleValidationError
            ? cattleValidationError
            : validatedCattle
              ? "✓ Valid cattle record"
              : "Enter ID and press Tab to validate."}
      </div>
    </Field>

    <Field label="Visit Date *">
      <input
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
        className="form-input"
        required
        disabled={loading}
      />
    </Field>
  </div>

  {validatedCattle && (
    <div style={cattleSummaryStyle}>
      <div style={cattleSummaryTitleStyle}>
        ✓ Cattle Found
      </div>

      <div style={cattleSummaryGridStyle}>
        <SummaryItem
          label="Tag Number"
          value={
            validatedCattle.tagNumber ||
            validatedCattle.tag_number ||
            validatedCattle.tag ||
            validatedCattle.cattleId ||
            ""
          }
        />

        <SummaryItem
          label="Internal ID"
          value={
            validatedCattle.internalId ||
            validatedCattle.internal_id ||
            validatedCattle.id ||
            ""
          }
        />

        <SummaryItem
          label="Name"
          value={
            validatedCattle.name ||
            validatedCattle.cattleName ||
            validatedCattle.cattle_name ||
            ""
          }
        />

        <SummaryItem
          label="Breed"
          value={validatedCattle.breed || ""}
        />

        <SummaryItem
          label="Gender"
          value={validatedCattle.gender || ""}
        />

        <SummaryItem
          label="Category"
          value={validatedCattle.category || ""}
        />

        <SummaryItem
          label="Shed"
          value={
            validatedCattle.shed ||
            validatedCattle.shedId ||
            validatedCattle.shed_id ||
            ""
          }
        />

        <SummaryItem
          label="Status"
          value={validatedCattle.status || ""}
        />
      </div>
    </div>
  )}
</SectionCard>

        <SectionCard title="Clinical Assessment">
          <Field label="Disease / Symptoms *">
            <input
              type="text"
              value={diseaseSearch}
              onChange={(event) =>
                setDiseaseSearch(event.target.value)
              }
              className="form-input"
              placeholder="Search symptoms or disease"
              disabled={loading}
              style={{ marginBottom: "0.65rem" }}
            />

            <MultiSelectChecklist
              options={filteredDiseaseOptions}
              selectedValues={form.diseaseSymptoms}
              onToggle={(value) =>
                toggleMultiValue("diseaseSymptoms", value)
              }
              emptyMessage="No matching disease or symptom found."
              disabled={loading}
            />

            {form.diseaseSymptoms.length > 0 && (
              <div style={selectedItemsWrapperStyle}>
                {form.diseaseSymptoms.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      toggleMultiValue("diseaseSymptoms", item)
                    }
                    style={selectedChipStyle}
                    disabled={loading}
                    title="Click to remove"
                  >
                    {item} ×
                  </button>
                ))}
              </div>
            )}
          </Field>
        </SectionCard>

        <SectionCard title="Treatment">
          <Field label="Medicines">
            <input
              type="text"
              value={medicineSearch}
              onChange={(event) =>
                setMedicineSearch(event.target.value)
              }
              className="form-input"
              placeholder="Search medicine"
              disabled={loading}
              style={{ marginBottom: "0.65rem" }}
            />

            <MultiSelectChecklist
              options={filteredMedicineOptions}
              selectedValues={form.medicine}
              onToggle={(value) =>
                toggleMultiValue("medicine", value)
              }
              emptyMessage={
                medicinesList.length === 0
                  ? "Medicines master is unavailable."
                  : "No matching medicine found."
              }
              disabled={loading}
            />

            {form.medicine.length > 0 && (
              <div style={selectedItemsWrapperStyle}>
                {form.medicine.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      toggleMultiValue("medicine", item)
                    }
                    style={selectedChipStyle}
                    disabled={loading}
                    title="Click to remove"
                  >
                    {item} ×
                  </button>
                ))}
              </div>
            )}
          </Field>
        </SectionCard>

        <SectionCard title="Veterinarian & Notes">
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <Field label="Doctor Name">
              <input
                type="text"
                name="doctorName"
                value={form.doctorName}
                onChange={handleChange}
                className="form-input"
                list="clinical-doctor-options"
                placeholder="Enter doctor name"
                disabled={loading}
              />

              
            </Field>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <Field label="Remarks / Treatment Instructions">
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                className="form-input"
                rows={4}
                placeholder="Enter observations, treatment instructions or follow-up notes"
                disabled={loading}
                style={{
                  resize: "vertical",
                  minHeight: "90px",
                }}
              />
            </Field>
          </div>
        </SectionCard>

        <div style={modalActionsStyle}>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="btn btn-secondary btn-full-mobile"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
  loading ||
  validatingCattle ||
  !String(form.cattleId || "").trim() ||
  (
    !validatedCattle &&
    !(
      mode === "edit" &&
      String(form.cattleId || "").trim() ===
        originalCattleId
    )
  ) ||
  !form.date ||
  form.diseaseSymptoms.length === 0
}
            className="btn btn-primary btn-full-mobile"
          >
            {loading
  ? mode === "add"
    ? "Saving..."
    : "Updating..."
  : mode === "add"
    ? "Save Clinical Record"
    : "Update Clinical Record"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      {/* Clinical Record Details Modal */}
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
          <h2
            style={{
              margin: 0,
              fontSize: "1.25rem",
              color: "#0f172a",
            }}
          >
            Clinical Record Details
          </h2>

          <div
            style={{
              marginTop: "4px",
              fontSize: "0.85rem",
              color: "#64748b",
            }}
          >
            Cattle ID:{" "}
            <strong style={{ color: "#0f172a" }}>
              {selectedEntry.cattleId || "-"}
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSelectedEntry(null)}
          style={closeButtonStyle}
          aria-label="Close clinical record details"
        >
          &times;
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gap: "1rem",
        }}
      >
        <SectionCard title="Cattle Details">
          {selectedRecordCattle ? (
            <div style={cattleDetailsViewStyle}>
              <div style={cattleSummaryTitleStyle}>
                ✓ Registered Cattle
              </div>

              <div style={cattleSummaryGridStyle}>
                <SummaryItem
                  label="Tag Number"
                  value={
                    selectedRecordCattle.tagNumber ||
                    selectedRecordCattle.tag_number ||
                    selectedRecordCattle.tag ||
                    selectedRecordCattle.cattleId ||
                    ""
                  }
                />

                <SummaryItem
                  label="Internal ID"
                  value={
                    selectedRecordCattle.internalId ||
                    selectedRecordCattle.internal_id ||
                    selectedRecordCattle.id ||
                    ""
                  }
                />

                <SummaryItem
                  label="Name"
                  value={
                    selectedRecordCattle.name ||
                    selectedRecordCattle.cattleName ||
                    selectedRecordCattle.cattle_name ||
                    ""
                  }
                />

                <SummaryItem
                  label="Breed"
                  value={selectedRecordCattle.breed || ""}
                />

                <SummaryItem
                  label="Gender"
                  value={selectedRecordCattle.gender || ""}
                />

                <SummaryItem
                  label="Category"
                  value={selectedRecordCattle.category || ""}
                />

                <SummaryItem
                  label="Shed"
                  value={
                    selectedRecordCattle.shed ||
                    selectedRecordCattle.shedId ||
                    selectedRecordCattle.shed_id ||
                    ""
                  }
                />

                <SummaryItem
                  label="Status"
                  value={selectedRecordCattle.status || ""}
                />
              </div>
            </div>
          ) : (
            <div style={historicalCattleNoticeStyle}>
              <div style={{ fontWeight: 800 }}>
                Cattle details are not available in the current Master Cattle list.
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "0.8rem",
                }}
              >
                This may be an older clinical record saved against a previous tag
                number.
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Visit Details">
          <div style={detailGridStyle}>
            <DetailItem
              label="Visit Date"
              value={formatDateDisplay(selectedEntry.date)}
            />

            <DetailItem
              label="Doctor"
              value={selectedEntry.doctorName}
            />
          </div>
        </SectionCard>

        <SectionCard title="Clinical Assessment">
          <DetailItem
            label="Disease / Symptoms"
            value={selectedEntry.diseaseSymptoms}
          />
        </SectionCard>

        <SectionCard title="Treatment">
          <DetailItem
            label="Medicines"
            value={selectedEntry.medicine}
          />
        </SectionCard>

        <SectionCard title="Remarks & Instructions">
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

// --- Styles & Components ---
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
const iconBtnStyle = {
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "1rem",
  padding: "0.25rem 0.45rem",
};

const checklistStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "0.45rem",
  maxHeight: "190px",
  overflowY: "auto",
  padding: "0.5rem",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  background: "#f8fafc",
};

const checklistItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  border: "1px solid #e2e8f0",
  borderRadius: "7px",
  padding: "0.5rem 0.6rem",
  cursor: "pointer",
  fontSize: "0.85rem",
  color: "#1f2937",
};

const checklistEmptyStyle = {
  gridColumn: "1 / -1",
  padding: "1rem",
  textAlign: "center",
  color: "#64748b",
  fontSize: "0.85rem",
};

const selectedItemsWrapperStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.4rem",
  marginTop: "0.65rem",
};

const selectedChipStyle = {
  border: "1px solid #fdba74",
  background: "#fff7ed",
  color: "#c2410c",
  borderRadius: "999px",
  padding: "0.3rem 0.65rem",
  fontSize: "0.78rem",
  fontWeight: 700,
  cursor: "pointer",
};
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50, padding: "1rem" };
const modalStyle = { background: "white", padding: "1.5rem", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight:"90vh", overflowY:"auto", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };
const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "1rem",
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: "0.85rem",
  marginBottom: "1rem",
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "1rem",
  marginTop: "0.5rem",
  flexWrap: "wrap",
};
const detailGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "1rem",
  fontSize: "0.95rem",
};

const closeButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "1.5rem",
  color: "#64748b",
  cursor: "pointer",
};

const cattleSummaryStyle = {
  marginTop: "1rem",
  padding: "0.85rem",
  border: "1px solid #bbf7d0",
  background: "#f0fdf4",
  borderRadius: "9px",
};

const cattleSummaryTitleStyle = {
  fontSize: "0.82rem",
  fontWeight: 800,
  color: "#15803d",
  marginBottom: "0.7rem",
};

const cattleSummaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "0.7rem 1rem",
};

const summaryLabelStyle = {
  fontSize: "0.68rem",
  color: "#64748b",
  fontWeight: 800,
  textTransform: "uppercase",
  marginBottom: "0.15rem",
};

const summaryValueStyle = {
  fontSize: "0.85rem",
  color: "#0f172a",
  fontWeight: 700,
};

const cattleDetailsViewStyle = {
  padding: "0.85rem",
  border: "1px solid #bbf7d0",
  background: "#f0fdf4",
  borderRadius: "9px",
};

const historicalCattleNoticeStyle = {
  padding: "0.85rem",
  border: "1px solid #fde68a",
  background: "#fffbeb",
  borderRadius: "9px",
  color: "#92400e",
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
  animation: "clinical-toast-spin 0.8s linear infinite",
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

function MultiSelectChecklist({
  options,
  selectedValues,
  onToggle,
  emptyMessage,
  disabled,
}) {
  return (
    <div style={checklistStyle}>
      {options.length === 0 ? (
        <div style={checklistEmptyStyle}>{emptyMessage}</div>
      ) : (
        options.map((option) => {
          const checked = selectedValues.includes(option);

          return (
            <label
              key={option}
              style={{
                ...checklistItemStyle,
                background: checked ? "#fff7ed" : "#ffffff",
                borderColor: checked ? "#fb923c" : "#e2e8f0",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option)}
                disabled={disabled}
              />

              <span>{option}</span>
            </label>
          );
        })
      )}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <div style={summaryLabelStyle}>{label}</div>
      <div style={summaryValueStyle}>{value || "-"}</div>
    </div>
  );
}

function Field({ label, children }) { 
    return <div style={{ marginBottom: "0.5rem" }}><label style={{ display: "block", fontSize: "0.8rem", color: "#374151", marginBottom: "0.3rem", fontWeight:"600" }}>{label}</label>{children}</div>; 
}

function DetailItem({ label, value, isBold }) { 
    return (
        <div style={{borderBottom:"1px dashed #eee", paddingBottom:"5px"}}>
            <div style={{fontSize:"0.75rem", color:"#6b7280", textTransform:"uppercase", fontWeight: "bold"}}>{label}</div>
            <div style={{ fontWeight: isBold ? "700" : "500", fontSize: isBold ? "1.1rem" : "1rem", color: "#111" }}>{value || "-"}</div>
        </div>
    ); 
}