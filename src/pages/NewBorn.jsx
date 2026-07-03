import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import { getNewBorn, addNewBorn, updateNewBorn, getCattle } from "../api/masterApi"; 

const CLOUD_NAME = "dvcwgkszp";       
const UPLOAD_PRESET = "cattle_upload"; 

function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`; 
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return "";
  const parts = String(isoDate).split("T")[0].split("-");
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

function parseBirthDate(value) {
  if (!value) return null;

  const s = String(value).split("T")[0].trim();

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  // dd/mm/yyyy or dd-mm-yyyy
  const parts = s.split(/[/-]/);
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    return new Date(y, m - 1, d);
  }

  const date = new Date(s);
  return isNaN(date.getTime()) ? null : date;
}

function getRegistrationEligibility(entry) {
  if (!entry) {
    return { showButton: false, eligible: false, overdue: false, message: "Invalid birth record" };
  }

  const status = String(entry.status || "Pending").toLowerCase();
  const birthStatus = String(entry.birthStatus || "").toLowerCase();

  if (["registered", "tagged"].includes(status)) {
    return { showButton: false, eligible: false, overdue: false, message: "Already registered" };
  }

  if (
    ["stillborn", "abortion"].includes(birthStatus) ||
    ["died after birth", "archived", "dead"].includes(status)
  ) {
    return { showButton: false, eligible: false, overdue: false, message: "No registration required" };
  }

  if (!["healthy", "weak"].includes(birthStatus)) {
    return { showButton: false, eligible: false, overdue: false, message: "Health status required" };
  }

  const birthDate = parseBirthDate(entry.dateOfBirth);
  if (!birthDate) {
    return { showButton: false, eligible: false, overdue: false, message: "Birth date missing" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  birthDate.setHours(0, 0, 0, 0);

  const ageDays = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24));

  if (ageDays < 21) {
    return {
      showButton: true,
      eligible: false,
      overdue: false,
      message: `Registration possible after ${21 - ageDays} day(s)`,
    };
  }

  if (ageDays > 30) {
    return {
      showButton: true,
      eligible: true,
      overdue: true,
      message: "Due for registration",
    };
  }

  return {
    showButton: true,
    eligible: true,
    overdue: false,
    message: "Eligible for registration",
  };
}

function validateMotherCalvingGap(form, rows, editingEntry) {
  if (!form.motherTag || !form.birthDate) return "";

  const currentBirthDate = parseBirthDate(form.birthDate);
  if (!currentBirthDate) return "";

  const currentId = editingEntry?.id || form.id || "";
  const motherTag = String(form.motherTag).trim();

  const recentBirth = rows.find((r) => {
    if (r.id === currentId) return false;

    const sameMother =
      String(r.motherTag || "").trim() === motherTag ||
      String(r.motherId || "").trim() === motherTag;

    if (!sameMother) return false;

    const oldBirthDate = parseBirthDate(r.dateOfBirth);
    if (!oldBirthDate) return false;

    const gapDays = Math.abs(
      (currentBirthDate - oldBirthDate) / (1000 * 60 * 60 * 24)
    );

    return gapDays < 270;
  });

  if (recentBirth) {
    return `This mother tag already has a birth record on ${formatDisplayDate(
      recentBirth.dateOfBirth
    )}. Please verify the mother tag or birth date. Minimum calving gap should be about 270 days.`;
  }

  return "";
}

function validateMotherEligibility(form, rows, cattleMap, editingEntry) {
  if (!form.motherTag || !form.birthDate) {
    return "Mother Tag and Birth Date are required.";
  }

  const lookupKey = String(form.motherTag).trim().toUpperCase();
  const mother = cattleMap[lookupKey];
  

  if (!mother) {
    return "Mother tag not found in Master Cattle. Please verify the tag number.";
  }

  if (String(mother.gender || "").toLowerCase() !== "female") {
    return "Selected mother tag belongs to a male cattle. Please verify the mother tag.";
  }

  if (String(mother.status || "").toLowerCase() !== "active") {
    return "Selected mother cattle is not Active. Only active female cattle can be used as mother.";
  }

  const dob = parseBirthDate(mother.dob);
  const birthDate = parseBirthDate(form.birthDate);

  if (dob && birthDate) {
    const ageMonths =
      (birthDate.getFullYear() - dob.getFullYear()) * 12 +
      (birthDate.getMonth() - dob.getMonth());

    if (ageMonths < 24) {
      return `Selected mother is only ${ageMonths} month(s) old. Minimum recommended age for calving is 24 months.`;
    }
  }

  const gapError = validateMotherCalvingGap(form, rows, editingEntry);
  if (gapError) return gapError;

  return "";
}

function getEmptyForm() {
  return {
    id: "",
    birthDate: "",
    timeOfBirth: "",
    motherTag: "",
    motherBreed: "",
    fatherTag: "",
fatherSource: "Unknown",
fatherOwner: "",
fatherBreed: "",
    calfId: "",        
    calfSex: "",
    calfBreed: "",
    color: "", 
    calfWeight: "",
    deliveryType: "",
    birthStatus: "",
    remarks: "",
    photo: "",
    status: "Pending"
  };
}

export default function NewBorn() {
  const navigate = useNavigate(); 
  const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");
const [searchText, setSearchText] = useState("");
const [healthFilter, setHealthFilter] = useState("All");
const [workflowFilter, setWorkflowFilter] = useState("All");
const [currentPage, setCurrentPage] = useState(1);
const recordsPerPage = 10;
  const [rows, setRows] = useState([]);
  const [cattleMap, setCattleMap] = useState({}); 
  
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(getEmptyForm());
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [error, setError] = useState("");
  const [openActionMenu, setOpenActionMenu] = useState(null);
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { 
    loadData(); 
    loadCattleDirectory(); 
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getNewBorn();
      setRows(data || []);
    } catch (err) {
      console.error("Failed to load", err);
      setError("Unable to load data.");
    } finally {
      setLoading(false);
    }
  };

  const loadCattleDirectory = async () => {
  try {
    const response = await getCattle();

    const allCattle = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
      ? response.data
      : [];

   
    if (allCattle.length > 0) {
      const map = {};
      allCattle.forEach((c) => {
        const breed = c.breed || c.breed_name || "";
const tagNo = c.tag || c.tagNo || c.tag_number || c.tagNumber || c.cattleId || "";
const internalId = c.internalId || c.internal_id || c.id || "";

const cattleInfo = {
  breed,
  gender: c.gender || "",
  status: c.status || "",
  dob: c.dob || "",
  category: c.category || "",
  tag: tagNo,
  internalId,
  name: c.name || c.cattle_name || "",
};

// Use only reliable identity keys
const keys = [tagNo, internalId];

keys.forEach((key) => {
  const cleanKey = String(key || "").trim().toUpperCase();
  if (!cleanKey) return;

  // Do not overwrite an existing exact match
  if (!map[cleanKey]) {
    map[cleanKey] = cattleInfo;
  }
});
      });

      

      setCattleMap(map);
    }
  } catch (e) {
    console.error("Could not load cattle directory", e);
    alert("Could not load cattle directory. Check console.");
  }
};

  const filteredRows = useMemo(() => {
  return [...rows]
    .filter((r) => {
      const q = searchText.toLowerCase().trim();

      const haystack = [
        r.id,
        r.motherTag,
        r.motherId,
        r.calfSex,
        r.calfBreed,
        r.birthStatus,
        r.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || haystack.includes(q);
      const matchesHealth =
        healthFilter === "All" || r.birthStatus === healthFilter;
      const matchesWorkflow =
        workflowFilter === "All" || r.status === workflowFilter;

      let matchesDateRange = true;
      const birthDt = parseBirthDate(r.dateOfBirth);

      if (fromDate && birthDt) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        matchesDateRange = matchesDateRange && birthDt >= from;
      }

      if (toDate && birthDt) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && birthDt <= to;
      }

      return (
        matchesSearch &&
        matchesHealth &&
        matchesWorkflow &&
        matchesDateRange
      );
    })
    .sort((a, b) => {
      const da = parseBirthDate(a.dateOfBirth)?.getTime() || 0;
      const db = parseBirthDate(b.dateOfBirth)?.getTime() || 0;
      return db - da;
    });
}, [rows, searchText, healthFilter, workflowFilter, fromDate, toDate]);

useEffect(() => {
  setCurrentPage(1);
}, [searchText, healthFilter, workflowFilter, fromDate, toDate]);

const summary = useMemo(() => {
  const total = rows.length;

  const pending = rows.filter((r) => {
    const reg = getRegistrationEligibility(r);
    return reg.showButton && !reg.eligible;
  }).length;

  const overdue = rows.filter((r) => getRegistrationEligibility(r).overdue).length;

  const registered = rows.filter((r) =>
    ["Registered", "Tagged"].includes(r.status)
  ).length;

  const closed = rows.filter((r) =>
    ["Archived", "Closed"].includes(r.status)
  ).length;

  return { total, pending, overdue, registered, closed };
}, [rows]);

const totalPages = Math.max(1, Math.ceil(filteredRows.length / recordsPerPage));

const paginatedRows = filteredRows.slice(
  (currentPage - 1) * recordsPerPage,
  currentPage * recordsPerPage
);
  function openAddForm() {
    setEditingEntry(null);
    setForm({
  ...getEmptyForm(),
  birthDate: new Date().toISOString().slice(0, 10),
});
    setShowForm(true);
  }

  function openEdit(entry) {
  setEditingEntry(entry);
  setForm({
    ...entry,
    birthDate: entry.birthDate || entry.dateOfBirth || "",
  });
  setShowForm(true);
}

  function openView(entry) {
    setSelectedEntry(entry);
    setShowView(true);
  }

  function handleRegister(entry) {
  const eligibility = getRegistrationEligibility(entry);

  if (!eligibility.eligible) {
    alert("Registration possible only after 21 days after birth.");
    return;
  }

  navigate("/cattle/register", {
    state: {
      source: "birth_log",
      birthData: entry,
    },
  });
}

  function handleFormChange(e) {
  const { name, value } = e.target;

  setForm((prev) => {
    const updated = { ...prev, [name]: value };

    if (name === "fatherSource") {
  if (value === "Unknown") {
    updated.fatherTag = "";
    updated.fatherOwner = "";
    updated.fatherBreed = "";
  }

  if (value === "Borrowed Bull") {
    updated.fatherTag = "";
  }

  if (value === "Own Goshala Bull") {
    updated.fatherOwner = "";
    updated.fatherBreed = "";
  }
}
    const lookupKey = value ? value.toString().trim().toUpperCase() : "";

    // 1. Auto-fill breeds from Master Cattle
    if (name === "motherTag") {
      updated.motherBreed =
  lookupKey && cattleMap[lookupKey]?.breed
    ? cattleMap[lookupKey].breed
    : updated.motherBreed;
    }

    if (name === "fatherTag") {
      updated.fatherBreed =
  lookupKey && cattleMap[lookupKey]?.breed
    ? cattleMap[lookupKey].breed
    : updated.fatherBreed;
    }

    // 2. Auto-calculate calf breed
    const mb = updated.motherBreed || "";
    const fb = updated.fatherBreed || "";

    if (["motherBreed", "fatherBreed", "motherTag", "fatherTag"].includes(name)) {
      if (mb && fb && mb === fb) {
        updated.calfBreed = mb;
      } else if (mb) {
        updated.calfBreed = "Mix";
      }
    }

    // 3. Auto-set workflow status based on health
if (name === "birthStatus") {
  if (["Stillborn", "Abortion"].includes(value)) {
    updated.status = "Archived";
  } else if (["Healthy", "Weak"].includes(value)) {
    updated.status = "Pending";
  } else {
    updated.status = "Pending";
  }
}

    return updated;
  });
}

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
    data.append("folder", "newborn_photos"); 

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      });
      const fileData = await res.json();
      if (fileData.secure_url) {
        setForm(prev => ({ ...prev, photo: fileData.secure_url }));
      }
    } catch (err) {
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const motherEligibilityError = validateMotherEligibility(
  form,
  rows,
  cattleMap,
  editingEntry
);

if (motherEligibilityError) {
  alert(motherEligibilityError);
  return;
}
      const motherGapError = validateMotherCalvingGap(form, rows, editingEntry);

if (motherGapError) {
  alert(motherGapError);
  return;
}
      if (editingEntry) {
        
const res = await updateNewBorn(form);

      } else {
        await addNewBorn(form);
      }
      alert("Saved Successfully!");
      setShowForm(false);
      loadData(); 
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  }

  const breedOptions = ["Hallikar", "Gir", "Jersey", "HF", "Mix", "Sahiwal", "Punganur", "Kankrej", "Deoni", "Malnad Gidda", "Krishna Valley", "Bargur", "Ongole", "Rathi"];
const colourOptions = [
  "Black",
  "White",
  "Grey",
  "Brown",
  "Red",
  "Reddish Brown",
  "Fawn",
  "Cream",
  "Mixed",
  "To be confirmed",
];
  const needsRegistration = (entry) => {
  return getRegistrationEligibility(entry).eligible;
};

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      

      
      {/* HEADER */}
<div style={{ marginBottom: "1rem" }}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "1rem",
      flexWrap: "wrap",
      marginBottom: "1rem",
    }}
  >
    <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0, color: "#111827" }}>
      New Born Log
    </h1>

    <button type="button" onClick={openAddForm} className="btn btn-primary">
      + Add New Birth
    </button>
  </div>

  <div
    style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "14px",
      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto",
      gap: "12px",
      alignItems: "end",
    }}
  >
    <div>
      <label style={filterLabelStyle}>Search</label>
      <input
        type="text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Birth ID, mother ID, breed..."
        className="form-input"
        style={{ width: "100%" }}
      />
    </div>

    <div>
      <label style={filterLabelStyle}>Health</label>
      <select
        value={healthFilter}
        onChange={(e) => setHealthFilter(e.target.value)}
        className="form-select"
        style={{ width: "100%" }}
      >
        <option value="All">All Health</option>
        <option value="Healthy">Healthy</option>
        <option value="Weak">Weak</option>
        <option value="Live">Live</option>
        <option value="Stillborn">Stillborn</option>
        <option value="Abortion">Abortion</option>
      </select>
    </div>

    <div>
      <label style={filterLabelStyle}>Workflow</label>
      <select
        value={workflowFilter}
        onChange={(e) => setWorkflowFilter(e.target.value)}
        className="form-select"
        style={{ width: "100%" }}
      >
        <option value="All">All Workflow</option>
        <option value="Pending">Pending Registration</option>
        <option value="Registered">Registered</option>
        <option value="Archived">Closed</option>
      </select>
    </div>

    <div>
      <label style={filterLabelStyle}>From Date</label>
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        className="form-input"
        style={{ width: "100%" }}
      />
    </div>

    <div>
      <label style={filterLabelStyle}>To Date</label>
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="form-input"
        style={{ width: "100%" }}
      />
    </div>

    <button
      type="button"
      onClick={() => {
        setSearchText("");
        setHealthFilter("All");
        setWorkflowFilter("All");
        setFromDate("");
        setToDate("");
      }}
      className="btn btn-secondary"
      style={{ height: "38px", whiteSpace: "nowrap" }}
    >
      Clear Filters
    </button>
  </div>
</div>

      {error && <div style={{ padding: "1rem", background: "#fee2e2", color: "#b91c1c", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "1rem",
  }}
>
  <MiniMetric label="Birth Records" value={summary.total} />
  <MiniMetric label="Pending Registration" value={summary.pending} />
  <MiniMetric label="Overdue Registration" value={summary.overdue} danger />
  <MiniMetric label="Registered" value={summary.registered} />
  <MiniMetric label="Closed" value={summary.closed} />
</div>
      
      {/* TABLE CONTAINER (Only data scrolls) */}
<div
  className="card"
  style={{
    padding: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 240px)",
  }}
>
  <div
    style={{
      flex: 1,
      overflowY: "auto",
      overflowX: "auto",
    }}
  >
    <div
  style={{
    marginBottom: "12px",
    padding: "10px 14px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    color: "#1d4ed8",
    fontSize: "0.9rem",
    fontWeight: 500,
  }}
>
  ℹ️ <strong>Registration Rule:</strong> Newborn cattle can be registered only
  after completing <strong>21 days</strong> from the date of birth. Records
  pending registration beyond <strong>30 days</strong> are considered overdue
  and should be registered at the earliest.
</div>

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    borderBottom: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: "0.85rem",
  }}
>
  <div style={{ color: "#64748b", fontWeight: 600 }}>
    Records: {filteredRows.length} | Page {currentPage} of {totalPages}
  </div>

  <div style={{ display: "flex", gap: "8px" }}>
    <button
      type="button"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
      className="btn btn-secondary"
      style={{ padding: "5px 10px", opacity: currentPage === 1 ? 0.5 : 1 }}
    >
      Prev
    </button>

    <button
      type="button"
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
      className="btn btn-secondary"
      style={{ padding: "5px 10px", opacity: currentPage === totalPages ? 0.5 : 1 }}
    >
      Next
    </button>
  </div>
</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: "800px" }}>
            <thead
  style={{
    background: "#f8fafc",
    textAlign: "left",
    borderBottom: "2px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 10,
  }}
>
              <tr>
                <th style={thStyle}>Transaction ID</th>
                <th style={thStyle}>Birth Date</th>
                <th style={thStyle}>Mother ID</th>
                <th style={thStyle}>Calf Sex</th>
                <th style={thStyle}>Calf Breed</th>
                <th style={thStyle}>Health</th>
<th style={thStyle}>Workflow</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading...</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>No birth records found for the selected period.</td></tr>
              ) : (
                paginatedRows.map((row, idx) => (
  <tr
    key={idx}
    onClick={() => openView(row)}
    style={{
      borderBottom: "1px solid #f1f5f9",
      cursor: "pointer",
      background: idx % 2 === 0 ? "#ffffff" : "#fafafa",
    }}
  >
    <td style={tdStyle}>
      <div style={{ fontWeight: "bold", color: "#334155" }}>{row.id}</div>
      {row.calfId && row.calfId !== "CREATE NEW ID" && (
        <div style={{ fontSize: "0.75rem", color: "#16a34a" }}>
          Linked: {row.calfId}
        </div>
      )}
    </td>

    <td style={tdStyle}>{formatDisplayDate(row.dateOfBirth)}</td>
    <td style={tdStyle}>{row.motherTag}</td>
    <td style={tdStyle}>{row.calfSex}</td>
    <td style={tdStyle}>{row.calfBreed}</td>

    <td style={tdStyle}>
      <HealthBadge status={row.birthStatus} />
    </td>

    <td style={tdStyle}>
      {(() => {
        const reg = getRegistrationEligibility(row);

        return (
          <div>
            <WorkflowBadge status={row.status} />

            {reg.showButton && (
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "11px",
                  color: reg.overdue ? "#b91c1c" : "#64748b",
                  fontWeight: reg.overdue ? 700 : 500,
                }}
              >
                {reg.overdue
                  ? "Overdue"
                  : !reg.eligible
                  ? reg.message.replace("Registration possible after ", "Due in ")
                  : "Eligible"}
              </div>
            )}
          </div>
        );
      })()}
    </td>

    <td style={tdStyle}>
      <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenActionMenu(openActionMenu === row.id ? null : row.id);
          }}
          style={{
            border: "1px solid #cbd5e1",
            background: "#fff",
            borderRadius: "6px",
            padding: "4px 10px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          ⋮
        </button>

        {openActionMenu === row.id && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: "30px",
              right: 0,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              minWidth: "170px",
              boxShadow: "0 8px 20px rgba(0,0,0,.12)",
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            <button
              style={menuItemStyle}
              onClick={() => {
                setOpenActionMenu(null);
                openView(row);
              }}
            >
              👁️ View
            </button>

            {getRegistrationEligibility(row).eligible && (
              <button
                style={menuItemStyle}
                onClick={() => {
                  setOpenActionMenu(null);
                  handleRegister(row);
                }}
              >
                ⊕ Register Cattle
              </button>
            )}
          </div>
        )}
      </div>
    </td>
  </tr>
))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- VIEW MODAL --- */}
      {showView && selectedEntry && (
        <div style={overlayStyle} onClick={() => setShowView(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem", borderBottom:"1px solid #eee", paddingBottom:"10px"}}>
               <h2 style={{margin:0, color:"#1e293b", fontSize:"1.2rem"}}>Transaction: {selectedEntry.id}</h2>
               <button onClick={() => setShowView(false)} style={closeBtn}>✕</button>
            </div>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
               {/* Left: Photo & Status */}
               <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                   <div style={{ width: "100%", aspectRatio: "4/3", background: "#f1f5f9", borderRadius: "12px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                       {selectedEntry.photo ? (
                           <img src={selectedEntry.photo} alt="Calf" style={{width:"100%", height:"100%", objectFit:"contain"}}/>
                       ) : (
                           <span style={{color:"#94a3b8", fontWeight: "500"}}>No Photo</span>
                       )}
                   </div>
                   <div style={{padding:"12px", background:"#f8fafc", borderRadius:"8px", border:"1px solid #e2e8f0"}}>
                       <div style={labelStyle}>Workflow Stage</div>
                       <WorkflowBadge status={selectedEntry.status} />
                   </div>
                   
                   {getRegistrationEligibility(selectedEntry).eligible ? (
  <button
    onClick={() => handleRegister(selectedEntry)}
    className="btn btn-primary"
    style={{ width: "100%", justifyContent: "center" }}
  >
    ⊕ Register Cattle
  </button>
) : (
  <div
    style={{
      padding: "10px",
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      color: "#64748b",
      fontWeight: 700,
      fontSize: "0.85rem",
      textAlign: "center",
    }}
  >
    {getRegistrationEligibility(selectedEntry).message}
  </div>
)}
               </div>

               {/* Right: Details Grid */}
               <div style={{ flex: "2 1 400px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                   <div className="responsive-grid">
                       <Detail label="Birth Date" value={formatDisplayDate(selectedEntry.dateOfBirth)} />
                       <Detail label="Time of Birth" value={selectedEntry.timeOfBirth} />
                   </div>
                   
                   <div style={{ borderTop:"1px dashed #e2e8f0", paddingTop:"1rem" }}>
                     <div style={{fontSize:"0.8rem", fontWeight:"bold", color:"#3b82f6", marginBottom:"10px", textTransform:"uppercase"}}>Parentage</div>
                     <div className="responsive-grid">
                        <Detail label="Mother Tag" value={selectedEntry.motherTag} />
                        <Detail label="Mother Breed" value={selectedEntry.motherBreed || "Unknown"} />
                        <Detail label="Father Tag" value={selectedEntry.fatherTag || "-"} />
                        <Detail label="Father Source" value={selectedEntry.fatherSource || "-"} />
<Detail label="Father Owner" value={selectedEntry.fatherOwner || "-"} />
                        <Detail label="Father Breed" value={selectedEntry.fatherBreed || "Unknown"} />
                     </div>
                   </div>

                   <div style={{ borderTop:"1px dashed #e2e8f0", paddingTop:"1rem" }}>
                     <div style={{fontSize:"0.8rem", fontWeight:"bold", color:"#10b981", marginBottom:"10px", textTransform:"uppercase"}}>Calf Details</div>
                     <div className="responsive-grid">
                        <Detail label="Gender" value={selectedEntry.calfSex} />
                        <Detail label="Breed" value={selectedEntry.calfBreed} />
                        <Detail label="Color" value={selectedEntry.color} />
                        <Detail label="Weight" value={selectedEntry.calfWeight ? `${selectedEntry.calfWeight} Kg` : "-"} />
                        <div>
  <div style={labelStyle}>Health</div>
  <HealthBadge status={selectedEntry.birthStatus} />
</div>
                     </div>
                   </div>

                   {selectedEntry.calfId && selectedEntry.calfId !== "CREATE NEW ID" && (
                     <div style={{padding:"10px", background:"#dcfce7", borderRadius:"6px", border:"1px solid #bbf7d0"}}>
                        <div style={{fontSize:"0.7rem", color:"#166534", fontWeight:"bold", textTransform:"uppercase"}}>Registered Internal ID</div>
                        <div style={{fontWeight:"bold", color:"#14532d"}}>{selectedEntry.calfId}</div>
                     </div>
                   )}
                   
                   <div>
                       <Detail label="Remarks" value={selectedEntry.remarks} />
                   </div>
               </div>
            </div>
            
            <div style={{marginTop:"2rem", textAlign:"right", paddingTop:"1rem", borderTop:"1px solid #f1f5f9"}}>
                <button onClick={() => { setShowView(false); openEdit(selectedEntry); }} className="btn btn-secondary">Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* --- FORM MODAL --- */}
      {showForm && (
        <div style={overlayStyle} onClick={() => setShowForm(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>{editingEntry ? "Edit Birth Record" : "Add New Birth"}</h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              
              <div className="responsive-grid">
                  <Field label="Birth Date *">
                    <input type="date" name="birthDate" value={form.birthDate} onChange={handleFormChange} className="form-input" required />
                  </Field>
                  <Field label="Time of Birth">
                    <input type="time" name="timeOfBirth" value={form.timeOfBirth} onChange={handleFormChange} className="form-input" />
                  </Field>
              </div>

              {/* MOTHER SECTION */}
              <div style={{background:"#f8fafc", padding:"1rem", borderRadius:"8px", border:"1px solid #e2e8f0"}}>
                  <div className="responsive-grid">
                      <Field label="Mother Tag/ID *">
                        <input type="text" name="motherTag" value={form.motherTag} onChange={handleFormChange} className="form-input" required placeholder="Enter Tag to Auto-fill" />
                      </Field>
                      <Field label="Mother Breed">
  <input
    type="text"
    name="motherBreed"
    value={form.motherBreed || ""}
    readOnly
    className="form-input"
    placeholder="Auto-filled from Mother Tag"
    style={{
      background: "#f8fafc",
      color: "#475569",
      cursor: "not-allowed",
      fontWeight: 500,
    }}
  />
</Field>
                  </div>
              </div>

              {/* FATHER SECTION */}
<div style={{background:"#f8fafc", padding:"1rem", borderRadius:"8px", border:"1px solid #e2e8f0"}}>
  <div className="responsive-grid">
    <Field label="Father Source *">
      <select
        name="fatherSource"
        value={form.fatherSource}
        onChange={handleFormChange}
        className="form-select"
        required
      >
        <option value="Own Goshala Bull">Own Goshala Bull</option>
        <option value="Borrowed Bull">Borrowed Bull</option>
        <option value="Unknown">Unknown / Not Recorded</option>
      </select>
    </Field>

    {form.fatherSource === "Own Goshala Bull" && (
      <Field label="Father Tag/ID *">
        <input
          type="text"
          name="fatherTag"
          value={form.fatherTag}
          onChange={handleFormChange}
          className="form-input"
          required
          placeholder="Enter Father Tag"
        />
      </Field>
    )}

    {form.fatherSource === "Borrowed Bull" && (
      <Field label="Bull Owner / Source">
        <input
          type="text"
          name="fatherOwner"
          value={form.fatherOwner}
          onChange={handleFormChange}
          className="form-input"
          placeholder="Owner / Goshala / Farmer"
        />
      </Field>
    )}

    <Field label="Father Breed">
      {form.fatherSource === "Own Goshala Bull" ? (
        <input
          type="text"
          name="fatherBreed"
          value={form.fatherBreed}
          readOnly
          className="form-input"
          placeholder="Auto-filled from Father Tag"
          style={{ background: "#f1f5f9", color: "#64748b" }}
        />
      ) : (
        <select
          name="fatherBreed"
          value={form.fatherBreed}
          onChange={handleFormChange}
          className="form-select"
        >
          <option value="">Select</option>
          {breedOptions.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      )}
    </Field>
  </div>
</div>

              {/* CALF SECTION */}
              <div className="responsive-grid">
                  <Field label="Calf Gender *">
                    <select name="calfSex" value={form.calfSex} onChange={handleFormChange} className="form-select" required>
                      <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                    </select>
                  </Field>
                  <Field label="Calf Breed (Result)">
  <input
    type="text"
    name="calfBreed"
    value={form.calfBreed}
    readOnly
    className="form-input"
    style={{ background: "#f1f5f9", color: "#64748b" }}
    placeholder="Auto-calculated"
  />
</Field>
              </div>

              <div className="responsive-grid">
                   <Field label="Calf Colour *">
  <select
    name="color"
    value={form.color}
    onChange={handleFormChange}
    className="form-select"
    required
  >
    <option value="">Select</option>
    {colourOptions.map((c) => (
      <option key={c} value={c}>{c}</option>
    ))}
  </select>
</Field>
                   <Field label="Weight (Kg)">
                    <input type="number" name="calfWeight" value={form.calfWeight} onChange={handleFormChange} className="form-input" />
                  </Field>
              </div>

              <div className="responsive-grid">
                  <Field label="Delivery Type">
                     <select name="deliveryType" value={form.deliveryType} onChange={handleFormChange} className="form-select">
                        <option value="">Select</option><option value="Normal">Normal</option><option value="Assisted">Assisted</option><option value="Caesarean">Caesarean</option>
                     </select>
                  </Field>
                  <Field label="Health Status">
                     <select name="birthStatus" value={form.birthStatus} onChange={handleFormChange} className="form-select">
                        <option value="">Select</option><option value="Healthy">Healthy</option><option value="Weak">Weak</option><option value="Stillborn">Stillborn</option><option value="Abortion">Abortion</option>
                     </select>
                  </Field>
              </div>
              
              <Field label="Workflow Status">
  {["Stillborn", "Abortion"].includes(form.birthStatus) ? (
    <input
      type="text"
      value="Closed"
      readOnly
      className="form-input"
      style={{
        background: "#f1f5f9",
        color: "#64748b",
        cursor: "not-allowed",
        fontWeight: 600,
      }}
    />
  ) : (
    <input
      type="text"
      value="Pending Registration"
      readOnly
      className="form-input"
      style={{
        background: "#f8fafc",
        color: "#475569",
        cursor: "not-allowed",
        fontWeight: 600,
      }}
    />
  )}
</Field>
              
              {/* UPLOAD BUTTON */}
<div style={{ background: "#f0f9ff", padding: "10px", borderRadius: "8px", border: "1px solid #bae6fd" }}>
  <label style={{ ...labelStyle, color: "#0369a1" }}>
    Newborn Photo
  </label>

  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    {form.photo && (
      <img
        src={form.photo}
        alt="Preview"
        style={{ height: "60px", borderRadius: "6px", border: "1px solid #e2e8f0" }}
      />
    )}

    <input
      type="file"
      accept="image/*"
      capture="environment"
      ref={fileInputRef}
      onChange={handleFileSelect}
      style={{ display: "none" }}
    />

    <button
      type="button"
      onClick={() => !uploading && fileInputRef.current?.click()}
      disabled={uploading}
      style={{
        background: uploading ? "#cbd5e1" : "#0ea5e9",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        padding: "8px 14px",
        fontWeight: "bold",
        cursor: uploading ? "not-allowed" : "pointer",
      }}
    >
      {uploading ? "Uploading..." : "📷 Upload Photo"}
    </button>
  </div>
</div>

              <Field label="Remarks">
                <input type="text" name="remarks" value={form.remarks} onChange={handleFormChange} className="form-input" />
              </Field>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary btn-full-mobile">Cancel</button>
                <button type="submit" className="btn btn-primary btn-full-mobile">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES & HELPERS ---
const MiniMetric = ({ label, value, danger }) => (
  <div
    style={{
      background: "#fff",
      border: danger ? "1px solid #fecaca" : "1px solid #e2e8f0",
      borderRadius: "10px",
      padding: "12px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    }}
  >
    <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>
      {label}
    </div>
    <div
      style={{
        fontSize: "1.35rem",
        fontWeight: 800,
        color: danger ? "#b91c1c" : "#0f172a",
      }}
    >
      {value}
    </div>
  </div>
);

const HealthBadge = ({ status }) => {
  let bg = "#f3f4f6";
  let col = "#6b7280";
  let label = status || "-";

  if (status === "Healthy") {
    bg = "#dcfce7";
    col = "#166534";
  } else if (status === "Weak") {
    bg = "#ffedd5";
    col = "#9a3412";
  } else if (["Stillborn", "Abortion"].includes(status)) {
    bg = "#e5e7eb";
    col = "#374151";
  }

  return (
    <span style={{ background: bg, color: col, padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold" }}>
      {label}
    </span>
  );
};

const WorkflowBadge = ({ status }) => {
  let bg = "#fef9c3";
  let col = "#854d0e";
  let label = status || "Pending";

  if (status === "Registered" || status === "Tagged") {
    bg = "#dbeafe";
    col = "#1d4ed8";
    label = "Registered";
  } else if (status === "Archived" || status === "Closed") {
    bg = "#e5e7eb";
    col = "#374151";
    label = "Closed";
  } else {
    label = "Pending Registration";
  }

  return (
    <span style={{ background: bg, color: col, padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold" }}>
      {label}
    </span>
  );
};

const Detail = ({label, value}) => (
  <div>
    <div style={{fontSize:"0.75rem", color:"#64748b", fontWeight:"bold", textTransform:"uppercase"}}>{label}</div>
    <div style={{fontSize:"0.95rem", color:"#0f172a", fontWeight: "500"}}>{value || "-"}</div>
  </div>
);

const thStyle = { padding: "1rem", borderBottom: "1px solid #e2e8f0", fontWeight: 600, color: "#64748b", textTransform: "uppercase", fontSize: "0.75rem" };
const tdStyle = { padding: "1rem", borderBottom: "1px solid #f1f5f9", color: "#334155", verticalAlign:"middle" };
const viewBtnStyle = { border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", marginRight:"6px", fontSize: "0.85rem", fontWeight: "600" };

const menuItemStyle = {
  width: "100%",
  padding: "9px 12px",
  border: "none",
  background: "#fff",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "0.85rem",
  color: "#334155",
};
const filterLabelStyle = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 700,
  color: "#64748b",
  marginBottom: "4px",
  textTransform: "uppercase",
};
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" };
const modalStyle = { background: "#fff", padding: "1.5rem", borderRadius: "12px", width: "800px", maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" };
const closeBtn = { background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#9ca3af", lineHeight: 1 };
const labelStyle = { fontSize: "0.75rem", color: "#64748b", fontWeight: "bold", textTransform: "uppercase", marginBottom: "4px" };
const Field = ({ label, children }) => <div className="form-group"><label className="form-label">{label}</label>{children}</div>;