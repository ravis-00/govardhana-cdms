import React, { useEffect, useMemo, useState, useRef } from "react";
import { fetchCattle, updateCattle, getCattleExitLog, reactivateCattle } from "../api/masterApi";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import rashtrotthanaLogo from "../assets/Logo.png";
import PageHeader from "../components/common/PageHeader";
import StatusBadge from "../components/common/StatusBadge";
import MetricCard from "../components/common/MetricCard";
import ProgressToast from "../components/common/ProgressToast";

// --- CLOUDINARY CONFIG ---
const CLOUD_NAME = "dvcwgkszp";       
const UPLOAD_PRESET = "cattle_upload"; 

// Configuration
const ITEMS_PER_PAGE = 20;
const STATUS_OPTIONS = ["All", "Active", "Deactive"];

const BREED_OPTIONS = ["Hallikar", "Gir", "Jersey", "HF", "Mix", "Sahiwal", "Kankrej", "Deoni", "Malnad Gidda"];

const COLOUR_OPTIONS = [
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

const SHED_OPTIONS = ["Punyakoti", "Samrakshana", "Kaveri", "Nandini", "Others"];

// --- HELPER: Get Robust ID ---
function getRowId(row) {
  if (!row) return "";
  return row.internalId || row.id || row.internal_id || "";
}

function cleanValue(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function getAnyValue(obj, keys = []) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }
  return "";
}

function getLogExitType(log) {
  return String(
    getAnyValue(log, [
      "exit_type",
      "exitType",
      "Exit Type",
      "EXIT TYPE",
      "reason",
      "Reason",
      "type",
    ])
  ).toLowerCase().trim();
}

function getLogDateValue(log) {
  return String(
    getAnyValue(log, [
      "exit_date",
      "exitDate",
      "Exit Date",
      "EXIT DATE",
      "date",
    ])
  );
}

function getLogTimeValue(log) {
  return String(
    getAnyValue(log, [
      "exit_time",
      "exitTime",
      "Exit Time",
      "EXIT TIME",
      "time",
    ])
  );
}

function getExitLogsForCattle(row, exitLogs = []) {
  if (!row) return [];

  const cattleId = cleanValue(getRowId(row));
  const tag = cleanValue(row.tag || row.tag_number || row.tagNumber);

  const matches = exitLogs.filter((log) => {
    const logInternalId = cleanValue(
      getAnyValue(log, [
        "internal_id",
        "internalId",
        "Internal ID",
        "INTERNAL ID",
        "id",
      ])
    );

    const logTagNumber = cleanValue(
      getAnyValue(log, [
        "tag_number",
        "tagNumber",
        "Tag Number",
        "TAG NUMBER",
        "tag",
        "tagNo",
        "cattleId",
        "cattle_id",
      ])
    );

    return (
      (cattleId && logInternalId && cattleId === logInternalId) ||
      (tag && logTagNumber && tag === logTagNumber)
    );
  });

  return matches.sort((a, b) => {
    const aDate = parseFlexibleDate(`${getLogDateValue(a)} ${getLogTimeValue(a)}`);
    const bDate = parseFlexibleDate(`${getLogDateValue(b)} ${getLogTimeValue(b)}`);

    return (aDate?.getTime() || 0) - (bDate?.getTime() || 0);
  });
}

function getLatestExitLogForCattle(row, exitLogs = []) {
  const matches = getExitLogsForCattle(row, exitLogs).filter((log) => {
    const type = getLogExitType(log);
    return type && !type.includes("reactivation");
  });

  if (!matches.length) return null;
  return matches[matches.length - 1];
}

function getLatestLifecycleLogForCattle(row, exitLogs = []) {
  const matches = getExitLogsForCattle(row, exitLogs);
  if (!matches.length) return null;
  return matches[matches.length - 1];
}

function getExitLogForCattle(row, exitLogs = []) {
  return getLatestExitLogForCattle(row, exitLogs);
}

function getExitTypeForCattle(row, exitLogs = []) {
  const match = getLatestExitLogForCattle(row, exitLogs);
  return getLogExitType(match);
}

function normalizeAdmissionType(type) {
  const t = String(type || "").toLowerCase().trim();

  if (!t || t === "-") return "-";

  if (t === "farmer" || t === "from farmer" || t.includes("farmer")) {
    return "From Farmer";
  }

  if (
    t === "rescue" ||
    t === "slaughter house" ||
    t === "slaughterhouse" ||
    t.includes("rescue") ||
    t.includes("slaughter")
  ) {
    return "Rescue / Slaughter House";
  }

  if (t.includes("birth") || t.includes("born")) return "Born at Goshala";
  if (t.includes("purchase")) return "Purchase";
  if (t.includes("donation")) return "Donation";

  return type;
}

function getDisplayTypeForCattle(row, exitLogs = []) {
  const status = String(row.status || "").toLowerCase().trim();
  const latestLifecycleLog = getLatestLifecycleLogForCattle(row, exitLogs);
  const latestLifecycleType = getLogExitType(latestLifecycleLog);

  if (status === "active") {
    if (latestLifecycleType.includes("reactivation")) {
      return "Reactivated";
    }

    return normalizeAdmissionType(
  row.admissionType ||
  row.type_of_admission ||
  row.admission_type ||
  row.origin ||
  "-"
);
  }

  if (status === "deactive") {
    const latestExitType = getExitTypeForCattle(row, exitLogs);

    return latestExitType
      ? latestExitType.charAt(0).toUpperCase() + latestExitType.slice(1)
      : "-";
  }

  return "-";
}



function canReactivateCattle(row, exitLogs = []) {
  const status = String(row?.status || "").toLowerCase().trim();
  const exitType = getExitTypeForCattle(row, exitLogs);

  return (
    status === "deactive" &&
    exitType &&
    !exitType.includes("death")
  );
}

function getDeactiveCertificateLabel(exitType) {
  if (!exitType) return null;

  if (exitType.includes("death"))
    return "📜 Death Certificate";

  if (exitType.includes("sold") || exitType.includes("sale"))
    return "📜 Sale Certificate";

  if (exitType.includes("transfer"))
    return "📜 Transfer Certificate";

  if (exitType.includes("farmer"))
    return "📜 Farmer Handover Certificate";

  return null;
}

// --- DATE HELPER FOR CERTIFICATES ---
function formatDateDisplay(isoDate) {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return isoDate;
}

function formatCertificateDate(dateValue) {
  if (!dateValue) return "-";

  const parts = String(dateValue).split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return dateValue;
}

function getCertificateDateCode(dateValue) {
  if (!dateValue) return "00000000";

  const parts = String(dateValue).split("-");
  if (parts.length === 3) {
    return `${parts[2]}${parts[1]}${parts[0]}`;
  }

  return String(dateValue).replace(/\D/g, "") || "00000000";
}

function getCertificateNo(prefix, internalId, eventDate) {
  return `${prefix}-${internalId || "NA"}-${getCertificateDateCode(eventDate)}`;
}
export default function MasterCattle() {
  const { user } = useAuth(); 
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exitLogs, setExitLogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Active");
const [breedFilter, setBreedFilter] = useState("All");
const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [genderFilter, setGenderFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
const [actionMenuId, setActionMenuId] = useState(null);
const [reactivationRow, setReactivationRow] = useState(null);
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchCattle();
if (Array.isArray(res)) setRows(res);
else if (res && res.data) setRows(res.data);
else setRows([]);

const exitRes = await getCattleExitLog();
console.log("EXIT LOG RESPONSE:", exitRes);

const exitData = Array.isArray(exitRes)
  ? exitRes
  : Array.isArray(exitRes?.data)
    ? exitRes.data
    : [];

console.log("EXIT LOG DATA COUNT:", exitData.length);
console.log("FIRST EXIT LOG ROW:", exitData[0]);
console.log("FULL EXIT RESPONSE:", JSON.stringify(exitRes));

console.log("EXIT LOG SAMPLE:", exitData.slice(0, 5));
setExitLogs(exitData);


setExitLogs(exitData);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
  setTypeFilter("All");
}, [statusFilter]);

  const filteredRows = useMemo(() => {
  if (!rows || rows.length === 0) return [];

  return rows.filter((row) => {
    const status = String(row.status || "").toLowerCase().trim();
    const matchStatus =
      statusFilter === "All" || status === statusFilter.toLowerCase();

    const matchBreed =
      breedFilter === "All" || String(row.breed || "") === breedFilter;

      const matchGender =
  genderFilter === "All" ||
  String(row.gender || "")
    .toLowerCase()
    .startsWith(genderFilter.toLowerCase());

    const displayType = getDisplayTypeForCattle(row, exitLogs);

const matchType =
  typeFilter === "All" || displayType === typeFilter;

    const haystack = `
      ${row.tag || ""}
      ${row.name || ""}
      ${row.breed || ""}
      ${row.color || ""}
      ${row.gender || ""}
      ${row.category || ""}
      ${row.shed || ""}
      ${row.govtUid || ""}
      ${getRowId(row)}
    `.toLowerCase();

    return (
      matchStatus &&
      matchBreed &&
      matchGender &&
      matchType &&
      haystack.includes(searchText.toLowerCase())
    );
  });
}, [rows, statusFilter, breedFilter, genderFilter, typeFilter, searchText, exitLogs]);

  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const sortedRows = useMemo(() => {
  return [...filteredRows].sort((a, b) => {
    const idA = Number(String(getRowId(a)).replace(/\D/g, "")) || 0;
    const idB = Number(String(getRowId(b)).replace(/\D/g, "")) || 0;
    return idB - idA;
  });
}, [filteredRows]);

const displayedRows = useMemo(() => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  return sortedRows.slice(start, start + ITEMS_PER_PAGE);
}, [sortedRows, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, breedFilter, genderFilter, typeFilter, searchText]);
  useEffect(() => {
  setActionMenuId(null);
}, [currentPage, statusFilter, breedFilter, genderFilter, typeFilter, searchText]);
  const handleNext = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePrev = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };
  const handleClearFilters = () => {
  setStatusFilter("All");
  setBreedFilter("All");
  setGenderFilter("All");
  setTypeFilter("All");
  setSearchText("");
  setCurrentPage(1);
};
  const isAdmin = user?.role === "Admin" || user?.role === "Super Admin";

  const summary = useMemo(() => {
  const activeRows = rows.filter(
    r => String(r.status || "").toLowerCase().trim() === "active"
  );

  const active = activeRows.length;

  const female = activeRows.filter(
    r => String(r.gender || "").toLowerCase().startsWith("f")
  ).length;

  const male = activeRows.filter(
    r => String(r.gender || "").toLowerCase().startsWith("m")
  ).length;

  const breeds = new Set(
    activeRows.map(r => r.breed).filter(Boolean)
  ).size;

  return {
    total: rows.length,
    active,
    female,
    male,
    breeds,
  };
}, [rows]);

const breedOptions = useMemo(() => {
  const breeds = rows
    .map(r => r.breed)
    .filter(Boolean);

  return ["All", ...Array.from(new Set(breeds)).sort()];
}, [rows]);

const typeOptions = useMemo(() => {
  const types = rows
    .filter((row) => {
      const status = String(row.status || "").toLowerCase().trim();
      return statusFilter === "All" || status === statusFilter.toLowerCase();
    })
    .map((row) => getDisplayTypeForCattle(row, exitLogs))
    .filter(Boolean)
    .filter((t) => t !== "-");

  return ["All", ...Array.from(new Set(types)).sort()];
}, [rows, exitLogs, statusFilter]);

  /* =========================================
     🔥 CERTIFICATE GENERATION LOGIC
     ========================================= */
  const handleGenerateCert = (row) => {
  const displayType = getDisplayTypeForCattle(row, exitLogs);
  const admissionType = String(row.admissionType || "").toLowerCase();

  if (displayType === "Reactivated") {
    printReactivationCertificate(row);
    return;
  }

  if (admissionType.includes("birth") || admissionType.includes("born")) {
    printBirthCertificate(row);
  } else {
    printIncomingCertificate(row);
  }
};

const handleGenerateDeactiveCert = (row, exitType) => {
  const t = String(exitType || "").toLowerCase().trim();

  if (t.includes("death")) {
    printDeactiveCertificate(row, "CATTLE DEATH CERTIFICATE");
    return;
  }

  if (t.includes("sold") || t.includes("sale")) {
    printSaleCertificate(row);
    return;
  }

  if (t.includes("transfer")) {
    printTransferCertificate(row);
    return;
  }

  if (t.includes("farmer")) {
    printFarmerHandoverCertificate(row);
    return;
  }

  alert(`Certificate format not available for exit type: ${exitType || "Unknown"}`);
};
  // --- 1. BIRTH CERTIFICATE TEMPLATE ---
  const printBirthCertificate = (row) => {
    const html = `
      <html>
      <head>
        <title>Birth Certificate - ${row.name}</title>
        <style>
          body { font-family: "Times New Roman", serif; padding: 20px; text-align: center; }
          .container { border: 3px solid #000; padding: 15px; max-width: 800px; margin: 0 auto; }
          .header h1 { font-size: 22px; font-weight: 800; margin: 0; text-decoration: underline; }
          .header h2 { font-size: 16px; font-weight: 700; margin: 5px 0; }
          .cert-title { border: 2px solid #000; padding: 6px; font-size: 18px; font-weight: 800; display: inline-block; width: 100%; margin-top: 10px; background: #eee; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; border: 2px solid #000; }
          td { border: 1px solid #000; padding: 10px; text-align: left; width: 50%; font-size: 14px; vertical-align: middle; }
          .label { font-weight: 800; text-transform: uppercase; margin-right: 5px; }
          .value { font-weight: 500; text-transform: uppercase; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 30px; }
          .sign-line { width: 180px; border-bottom: 1px solid #000; margin-bottom: 8px; }
          .sign-label { font-weight: 700; font-size: 13px; text-transform: uppercase; }
          @media print { @page { size: A4; margin: 10mm; } body { padding: 0; } .container { height: 95vh; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MADHAVA SRUSTI RASHTROTTHANA GOSHALA</h1>
            <h2>SS GHATI DODDABALLAPURA</h2>
            <div class="cert-title">BIRTH CERTIFICATE</div>
          </div>
          <div style="width:100%; height:280px; border:2px solid #000; margin:15px 0; display:flex; align-items:center; justify-content:center; overflow:hidden;">
            ${row.photo ? `<img src="${row.photo}" style="height:100%; object-fit:contain;" />` : `<div style="color:#999; font-style:italic;">[ Photo Not Provided ]</div>`}
          </div>
          <table>
            <tr><td><span class="label">NAME:</span> <span class="value">${row.name}</span></td><td><span class="label">COLOUR:</span> <span class="value">${row.color || "-"}</span></td></tr>
            <tr><td><span class="label">DATE OF BIRTH:</span> <span class="value">${formatDateDisplay(row.dob)}</span></td><td><span class="label">TAG NO:</span> <span class="value">${row.tag}</span></td></tr>
            <tr><td><span class="label">BREED NAME:</span> <span class="value">${row.breed}</span></td><td><span class="label">GENDER:</span> <span class="value">${row.gender}</span></td></tr>
            <tr><td><span class="label">MOTHER BREED:</span> <span class="value">${row.damBreed || "-"}</span></td><td><span class="label">MOTHER TAG NO:</span> <span class="value">${row.damId || "-"}</span></td></tr>
            <tr><td><span class="label">FATHER BREED:</span> <span class="value">${row.sireBreed || "-"}</span></td><td><span class="label">FATHER TAG NO:</span> <span class="value">${row.sireId || "-"}</span></td></tr>
          </table>
          <div class="footer">
            <div style="text-align:center;"><div class="sign-line"></div><div class="sign-label">SUPERVISOR SIGNATURE</div></div>
            <div style="text-align:center;"><div class="sign-line"></div><div class="sign-label">PROJECT MANAGER SIGNATURE</div></div>
          </div>
        </div>
        <script>setTimeout(() => window.print(), 500);</script>
      </body>
      </html>
    `;
    const win = window.open("", "_blank", "width=900,height=1100");
    if (win) { win.document.write(html); win.document.close(); }
  };


const printReactivationCertificate = (row) => {
  const reactLog = getLatestLifecycleLogForCattle(row, exitLogs);
  const internalId = getRowId(row);

  const eventDate = reactLog?.exit_date || reactLog?.date || "";
  const certificateNo = getCertificateNo("RC", internalId, eventDate);
  const generatedOn = formatCertificateDate(new Date().toISOString().slice(0, 10));

  const previousExitType =
    reactLog?.category ||
    reactLog?.previous_exit_type ||
    "Not recorded";

  const reactivationDate = formatCertificateDate(eventDate);
  const returnedFrom =
    reactLog?.party_name ||
    reactLog?.partyName ||
    "Not recorded";

  const contact =
    reactLog?.party_contact ||
    reactLog?.partyContact ||
    "Not recorded";

  const reason =
    reactLog?.cause_details ||
    reactLog?.causeDetails ||
    reactLog?.remarks ||
    "Not recorded";

  const remarks = reactLog?.remarks || "No remarks recorded";

  const html = `
    <html>
    <head>
      <title>Cattle Reactivation Certificate - ${row.tag}</title>
      <style>
        body {
          font-family: "Times New Roman", serif;
          padding: 18px;
          color: #000;
        }

        .container {
          border: 3px solid #000;
          padding: 14px 16px;
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          position: relative;
          padding-top: 4px;
        }

        .logo {
          width: 70px;
          height: 70px;
          object-fit: contain;
          margin-bottom: 4px;
        }

        .org-title {
          font-size: 21px;
          font-weight: 800;
          text-decoration: underline;
          margin: 0;
        }

        .org-subtitle {
          font-size: 14px;
          font-weight: 700;
          margin: 4px 0 10px 0;
        }

        .cert-title {
          border: 2px solid #000;
          padding: 7px;
          font-size: 17px;
          font-weight: 800;
          background: #eee;
          margin-bottom: 10px;
        }

        .meta-box {
          border: 1px solid #000;
          padding: 7px 10px;
          margin-bottom: 10px;
          font-size: 13px;
          font-weight: 700;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .photo-box {
          width: 100%;
          height: 180px;
          border: 2px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .photo-box img {
          height: 100%;
          max-width: 100%;
          object-fit: contain;
        }

        .section-title {
          background: #f2f2f2;
          border: 1px solid #000;
          padding: 5px 8px;
          font-weight: 800;
          font-size: 13px;
          margin-top: 10px;
          text-align: left;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
          margin-bottom: 8px;
        }

        td {
          border: 1px solid #000;
          padding: 7px 9px;
          width: 50%;
          font-size: 12.8px;
          vertical-align: top;
        }

        .label {
          font-weight: 800;
          text-transform: uppercase;
          margin-right: 5px;
        }

        .value {
          font-weight: 500;
          text-transform: uppercase;
        }

        .remarks-box {
          border: 2px solid #000;
          min-height: 32px;
          padding: 8px;
          font-size: 12.8px;
          text-align: left;
          margin-bottom: 10px;
        }

        .declaration-box {
          border: 1px solid #000;
          padding: 8px;
          font-size: 12.8px;
          line-height: 1.35;
          text-align: left;
          margin-top: 10px;
          margin-bottom: 12px;
        }

        .declaration-title {
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .footer {
          margin-top: 18px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .sign {
          width: 32%;
          text-align: center;
          font-size: 11.5px;
          font-weight: 800;
        }

        .sign-line {
          border-bottom: 1px solid #000;
          height: 16px;
          margin-bottom: 6px;
        }

        @media print {
          @page { size: A4; margin: 8mm; }
          body { padding: 0; }
        }
      </style>
    </head>

    <body>
      <div class="container">
        <div class="header">
          <img class="logo" src="${rashtrotthanaLogo}" />
          <h1 class="org-title">MADHAVA SRUSTI RASHTROTTHANA GOSHALA</h1>
          <div class="org-subtitle">SS GHATI DODDABALLAPURA</div>
          <div class="cert-title">CATTLE REACTIVATION CERTIFICATE</div>
        </div>

        <div class="meta-box">
          <div>Certificate No : ${certificateNo}</div>
          <div>Generated On : ${generatedOn}</div>
        </div>

        <div class="photo-box">
          ${
            row.photo
              ? `<img src="${row.photo}" />`
              : `<div style="color:#777; font-style:italic;">Photo Not Available</div>`
          }
        </div>

        <div class="section-title">Cattle Identity</div>
        <table>
          <tr>
            <td><span class="label">Internal ID:</span> <span class="value">${internalId || "-"}</span></td>
            <td><span class="label">Tag No:</span> <span class="value">${row.tag || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Name:</span> <span class="value">${row.name || "-"}</span></td>
            <td><span class="label">Breed:</span> <span class="value">${row.breed || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Gender:</span> <span class="value">${row.gender || "-"}</span></td>
            <td><span class="label">Category:</span> <span class="value">${row.category || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Colour:</span> <span class="value">${row.color || "-"}</span></td>
            <td><span class="label">Current Status:</span> <span class="value">${row.status || "-"}</span></td>
          </tr>
        </table>

        <div class="section-title">Reactivation Details</div>
        <table>
          <tr>
            <td><span class="label">Reactivation Date:</span> <span class="value">${reactivationDate}</span></td>
            <td><span class="label">Previous Exit Type:</span> <span class="value">${previousExitType}</span></td>
          </tr>
          <tr>
            <td><span class="label">Returned From:</span> <span class="value">${returnedFrom}</span></td>
            <td><span class="label">Contact:</span> <span class="value">${contact}</span></td>
          </tr>
          <tr>
            <td colspan="2"><span class="label">Reason for Return:</span> <span class="value">${reason}</span></td>
          </tr>
        </table>

        <div class="section-title">Remarks</div>
        <div class="remarks-box">${remarks}</div>

        <div class="declaration-box">
          <div class="declaration-title">Declaration</div>
          This is to certify that the above cattle has returned to Madhava Srusti Rashtrotthana Goshala
          and has been reactivated in Govardhana CDMS. The previous exit record remains preserved
          in the cattle lifecycle history.
        </div>

        <div class="footer">
          <div class="sign">
            <div class="sign-line"></div>
            SUPERVISOR SIGNATURE
          </div>
          <div class="sign">
            <div class="sign-line"></div>
            RECORD VERIFICATION
          </div>
          <div class="sign">
            <div class="sign-line"></div>
            PROJECT MANAGER SIGNATURE
          </div>
        </div>
      </div>

      <script>setTimeout(() => window.print(), 500);</script>
    </body>
    </html>
  `;

  const win = window.open("", "_blank", "width=900,height=1100");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};

  // --- 2. INCOMING CERTIFICATE TEMPLATE ---
  const printIncomingCertificate = (row) => {
    const html = `
      <html>
      <head>
        <title>Incoming Certificate - ${row.tag}</title>
        <style>
          body { font-family: "Times New Roman", serif; padding: 20px; text-align: center; }
          .container { border: 3px solid #000; padding: 15px; max-width: 800px; margin: 0 auto; }
          .header h1 { font-size: 22px; font-weight: 800; margin: 0; text-decoration: underline; }
          .header h2 { font-size: 16px; font-weight: 700; margin: 5px 0; }
          .cert-title { border: 2px solid #000; padding: 6px; font-size: 18px; font-weight: 800; display: inline-block; width: 100%; margin-top: 10px; background: #eee; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; border: 2px solid #000; }
          td { border: 1px solid #000; padding: 10px; text-align: left; width: 50%; font-size: 14px; vertical-align: middle; }
          .label { font-weight: 800; text-transform: uppercase; margin-right: 5px; }
          .value { font-weight: 500; text-transform: uppercase; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 30px; }
          .sign-line { width: 180px; border-bottom: 1px solid #000; margin-bottom: 8px; }
          .sign-label { font-weight: 700; font-size: 13px; text-transform: uppercase; }
          @media print { @page { size: A4; margin: 10mm; } body { padding: 0; } .container { height: 95vh; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MADHAVA SRUSTI RASHTROTTHANA GOSHALA</h1>
            <h2>SS GHATI DODDABALLAPURA</h2>
            <div class="cert-title">INCOMING CATTLE CERTIFICATE</div>
          </div>
          <div style="width:100%; height:280px; border:2px solid #000; margin:15px 0; display:flex; align-items:center; justify-content:center; overflow:hidden;">
            ${row.photo ? `<img src="${row.photo}" style="height:100%; object-fit:contain;" />` : `<div style="color:#999; font-style:italic;">[ Photo Not Provided ]</div>`}
          </div>
          <table>
            <tr><td><span class="label">ADMISSION DATE:</span> <span class="value">${formatDateDisplay(row.admissionDate)}</span></td><td><span class="label">TYPE:</span> <span class="value">${row.admissionType}</span></td></tr>
            <tr><td><span class="label">TAG NO:</span> <span class="value">${row.tag}</span></td><td><span class="label">NAME:</span> <span class="value">${row.name}</span></td></tr>
            <tr><td><span class="label">BREED:</span> <span class="value">${row.breed}</span></td><td><span class="label">GENDER:</span> <span class="value">${row.gender}</span></td></tr>
            <tr><td><span class="label">COLOUR:</span> <span class="value">${row.color || "-"}</span></td><td><span class="label">CATTLE TYPE:</span> <span class="value">${row.category}</span></td></tr>
            <tr><td><span class="label">SOURCE NAME:</span> <span class="value">${row.sourceName || "-"}</span></td><td><span class="label">ADDRESS:</span> <span class="value">${row.sourceAddress || "-"}</span></td></tr>
          </table>
          <div class="footer">
            <div style="text-align:center;"><div class="sign-line"></div><div class="sign-label">SUPERVISOR SIGNATURE</div></div>
            <div style="text-align:center;"><div class="sign-line"></div><div class="sign-label">PROJECT MANAGER SIGNATURE</div></div>
          </div>
        </div>
        <script>setTimeout(() => window.print(), 500);</script>
      </body>
      </html>
    `;
    const win = window.open("", "_blank", "width=900,height=1100");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const printDeactiveCertificate = (row, certificateTitle) => {
  const exitLog = getExitLogForCattle(row, exitLogs);
  const exitType = getExitTypeForCattle(row, exitLogs);

  const internalId = getRowId(row);
  const eventDate = exitLog?.exit_date || exitLog?.date || "";
  const certificateNo = getCertificateNo("DC", internalId, eventDate);
  const generatedOn = formatCertificateDate(new Date().toISOString().slice(0, 10));

  const causeDetails =
    exitLog?.cause_details ||
    exitLog?.causeDetails ||
    exitLog?.reason ||
    "Not recorded";

  const remarks = exitLog?.remarks || "No remarks recorded";
  const teethDetails = exitLog?.teeth_details || exitLog?.teethDetails || "Not recorded";
  const teethAge = exitLog?.teeth_age || exitLog?.teethAge || "Not recorded";
  const pregnancyStatus =
    exitLog?.preganancy_status ||
    exitLog?.pregnancy_status ||
    "Not recorded";

  const showPregnancy = String(row.gender || "").toLowerCase().startsWith("f");

  const html = `
    <html>
    <head>
      <title>${certificateTitle} - ${row.tag}</title>
      <style>
        body {
          font-family: "Times New Roman", serif;
          padding: 18px;
          color: #000;
        }

        .container {
          border: 3px solid #000;
          padding: 14px 16px;
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          position: relative;
          padding-top: 4px;
        }

        .logo {
          width: 70px;
          height: 70px;
          object-fit: contain;
          margin-bottom: 4px;
        }

        .org-title {
          font-size: 21px;
          font-weight: 800;
          text-decoration: underline;
          margin: 0;
        }

        .org-subtitle {
          font-size: 14px;
          font-weight: 700;
          margin: 4px 0 10px 0;
        }

        .cert-title {
          border: 2px solid #000;
          padding: 7px;
          font-size: 17px;
          font-weight: 800;
          background: #eee;
          margin-bottom: 10px;
        }

        .meta-box {
          border: 1px solid #000;
          padding: 7px 10px;
          margin-bottom: 10px;
          font-size: 13px;
          font-weight: 700;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .photo-box {
          width: 100%;
          height: 180px;
          border: 2px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .photo-box img {
          height: 100%;
          max-width: 100%;
          object-fit: contain;
        }

        .section-title {
          background: #f2f2f2;
          border: 1px solid #000;
          padding: 5px 8px;
          font-weight: 800;
          font-size: 13px;
          margin-top: 10px;
          text-align: left;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
          margin-bottom: 8px;
        }

        td {
          border: 1px solid #000;
          padding: 7px 9px;
          width: 50%;
          font-size: 12.8px;
          vertical-align: top;
        }

        .label {
          font-weight: 800;
          text-transform: uppercase;
          margin-right: 5px;
        }

        .value {
          font-weight: 500;
          text-transform: uppercase;
        }

        .remarks-box {
          border: 2px solid #000;
          min-height: 42px;
          padding: 8px;
          font-size: 12.8px;
          text-align: left;
          margin-bottom: 10px;
        }

        .veterinary-box {
          border: 1px solid #000;
          padding: 8px;
          font-size: 12.8px;
          line-height: 1.35;
          text-align: left;
          margin-top: 10px;
          margin-bottom: 12px;
        }

        .veterinary-title {
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .footer {
          margin-top: 18px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .sign {
          width: 32%;
          text-align: center;
          font-size: 11.5px;
          font-weight: 800;
        }

        .sign-line {
          border-bottom: 1px solid #000;
          height: 16px;
          margin-bottom: 6px;
        }

        @media print {
          @page { size: A4; margin: 8mm; }
          body { padding: 0; }
        }
      </style>
    </head>

    <body>
      <div class="container">
        <div class="header">
          <img class="logo" src="${rashtrotthanaLogo}" />
          <h1 class="org-title">MADHAVA SRUSTI RASHTROTTHANA GOSHALA</h1>
          <div class="org-subtitle">SS GHATI DODDABALLAPURA</div>
          <div class="cert-title">CATTLE DEATH CERTIFICATE</div>
        </div>

        <div class="meta-box">
          <div>Certificate No : ${certificateNo}</div>
          <div>Generated On : ${generatedOn}</div>
        </div>

        <div class="photo-box">
          ${
            row.photo
              ? `<img src="${row.photo}" />`
              : `<div style="color:#777; font-style:italic;">Photo Not Available</div>`
          }
        </div>

        <div class="section-title">Cattle Identity</div>
        <table>
          <tr>
            <td><span class="label">Internal ID:</span> <span class="value">${internalId || "-"}</span></td>
            <td><span class="label">Tag No:</span> <span class="value">${row.tag || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Name:</span> <span class="value">${row.name || "-"}</span></td>
            <td><span class="label">Breed:</span> <span class="value">${row.breed || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Gender:</span> <span class="value">${row.gender || "-"}</span></td>
            <td><span class="label">Category:</span> <span class="value">${row.category || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Colour:</span> <span class="value">${row.color || "-"}</span></td>
            <td><span class="label">Date of Birth:</span> <span class="value">${formatCertificateDate(row.dob)}</span></td>
          </tr>
        </table>

        <div class="section-title">Death Details</div>
        <table>
          <tr>
            <td><span class="label">Date of Death:</span> <span class="value">${formatCertificateDate(eventDate)}</span></td>
            <td><span class="label">Time of Death:</span> <span class="value">${exitLog?.exit_time || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Cause of Death:</span> <span class="value">${causeDetails}</span></td>
            <td><span class="label">Location/Shed:</span> <span class="value">${row.shed || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Teeth Details:</span> <span class="value">${teethDetails}</span></td>
            <td><span class="label">Age by Teeth:</span> <span class="value">${teethAge}</span></td>
          </tr>
          ${
            showPregnancy
              ? `<tr><td><span class="label">Pregnancy Status:</span> <span class="value">${pregnancyStatus}</span></td><td><span class="label">Market Value:</span> <span class="value">${exitLog?.market_value || "-"}</span></td></tr>`
              : `<tr><td><span class="label">Market Value:</span> <span class="value">${exitLog?.market_value || "-"}</span></td><td><span class="label">Reference No:</span> <span class="value">${exitLog?.ref_no || "-"}</span></td></tr>`
          }
        </table>

        <div class="section-title">Remarks / Veterinary Observation</div>
        <div class="remarks-box">${remarks}</div>

        <div class="veterinary-box">
          <div class="veterinary-title">Veterinary Certification</div>
          This is to certify that the above cattle was recorded as deceased on the date mentioned above.
          The details are based on available records and verification by the concerned goshala staff /
          veterinary authority.
        </div>

        <div class="footer">
          <div class="sign">
            <div class="sign-line"></div>
            SUPERVISOR SIGNATURE
          </div>
          <div class="sign">
            <div class="sign-line"></div>
            VETERINARY OFFICER SIGNATURE
          </div>
          <div class="sign">
            <div class="sign-line"></div>
            PROJECT MANAGER SIGNATURE
          </div>
        </div>
      </div>

      <script>setTimeout(() => window.print(), 500);</script>
    </body>
    </html>
  `;

  const win = window.open("", "_blank", "width=900,height=1100");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};

const printSaleCertificate = (row) => {
  const exitLog = getExitLogForCattle(row, exitLogs);

  const internalId = getRowId(row);
  const eventDate = exitLog?.exit_date || exitLog?.date || "";
  const certificateNo = getCertificateNo("SC", internalId, eventDate);
  const generatedOn = formatCertificateDate(new Date().toISOString().slice(0, 10));

  const saleDate = formatCertificateDate(eventDate);
  const soldTo = exitLog?.party_name || exitLog?.partyName || "Not recorded";
  const contact = exitLog?.party_contact || exitLog?.partyContact || "Not recorded";
  const address = exitLog?.party_address || exitLog?.partyAddress || "Not recorded";
  const amount = exitLog?.amount || "Not recorded";
  const refNo = exitLog?.ref_no || exitLog?.refNo || "Not recorded";
  const gatePass = exitLog?.gate_pass || exitLog?.gatePass || "Not recorded";
  const receiptNo = exitLog?.receipt_no || exitLog?.receiptNo || "Not recorded";
  const remarks = exitLog?.remarks || "No remarks recorded";

  const html = `
    <html>
    <head>
      <title>Cattle Sale Certificate - ${row.tag}</title>
      <style>
        body {
          font-family: "Times New Roman", serif;
          padding: 18px;
          color: #000;
        }

        .container {
          border: 3px solid #000;
          padding: 14px 16px;
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          position: relative;
          padding-top: 4px;
        }

        .logo {
          width: 70px;
          height: 70px;
          object-fit: contain;
          margin-bottom: 4px;
        }

        .org-title {
          font-size: 21px;
          font-weight: 800;
          text-decoration: underline;
          margin: 0;
        }

        .org-subtitle {
          font-size: 14px;
          font-weight: 700;
          margin: 4px 0 10px 0;
        }

        .cert-title {
          border: 2px solid #000;
          padding: 7px;
          font-size: 17px;
          font-weight: 800;
          background: #eee;
          margin-bottom: 10px;
        }

        .meta-box {
          border: 1px solid #000;
          padding: 7px 10px;
          margin-bottom: 10px;
          font-size: 13px;
          font-weight: 700;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .photo-box {
          width: 100%;
          height: 180px;
          border: 2px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .photo-box img {
          height: 100%;
          max-width: 100%;
          object-fit: contain;
        }

        .section-title {
          background: #f2f2f2;
          border: 1px solid #000;
          padding: 5px 8px;
          font-weight: 800;
          font-size: 13px;
          margin-top: 10px;
          text-align: left;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
          margin-bottom: 8px;
        }

        td {
          border: 1px solid #000;
          padding: 7px 9px;
          width: 50%;
          font-size: 12.8px;
          vertical-align: top;
        }

        .label {
          font-weight: 800;
          text-transform: uppercase;
          margin-right: 5px;
        }

        .value {
          font-weight: 500;
          text-transform: uppercase;
        }

        .remarks-box {
          border: 2px solid #000;
          min-height: 28px;
          padding: 8px;
          font-size: 12.8px;
          text-align: left;
          margin-bottom: 10px;
        }

        .declaration-box {
          border: 1px solid #000;
          padding: 8px;
          font-size: 12.8px;
          line-height: 1.35;
          text-align: left;
          margin-top: 10px;
          margin-bottom: 12px;
        }

        .declaration-title {
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .footer {
          margin-top: 18px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .sign {
          width: 32%;
          text-align: center;
          font-size: 11.5px;
          font-weight: 800;
        }

        .sign-line {
          border-bottom: 1px solid #000;
          height: 16px;
          margin-bottom: 6px;
        }

        @media print {
          @page { size: A4; margin: 8mm; }
          body { padding: 0; }
        }
      </style>
    </head>

    <body>
      <div class="container">
        <div class="header">
          <img class="logo" src="${rashtrotthanaLogo}" />
          <h1 class="org-title">MADHAVA SRUSTI RASHTROTTHANA GOSHALA</h1>
          <div class="org-subtitle">SS GHATI DODDABALLAPURA</div>
          <div class="cert-title">CATTLE SALE CERTIFICATE</div>
        </div>

        <div class="meta-box">
          <div>Certificate No : ${certificateNo}</div>
          <div>Generated On : ${generatedOn}</div>
        </div>

        <div class="photo-box">
          ${
            row.photo
              ? `<img src="${row.photo}" />`
              : `<div style="color:#777; font-style:italic;">Photo Not Available</div>`
          }
        </div>

        <div class="section-title">Cattle Identity</div>
        <table>
          <tr>
            <td><span class="label">Internal ID:</span> <span class="value">${internalId || "-"}</span></td>
            <td><span class="label">Tag No:</span> <span class="value">${row.tag || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Name:</span> <span class="value">${row.name || "-"}</span></td>
            <td><span class="label">Breed:</span> <span class="value">${row.breed || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Gender:</span> <span class="value">${row.gender || "-"}</span></td>
            <td><span class="label">Category:</span> <span class="value">${row.category || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Colour:</span> <span class="value">${row.color || "-"}</span></td>
            <td><span class="label">Date of Birth:</span> <span class="value">${formatCertificateDate(row.dob)}</span></td>
          </tr>
        </table>

        <div class="section-title">Sale Details</div>
        <table>
          <tr>
            <td><span class="label">Sale Date:</span> <span class="value">${saleDate}</span></td>
            <td><span class="label">Sale Amount:</span> <span class="value">${amount}</span></td>
          </tr>
          <tr>
            <td><span class="label">Sold To:</span> <span class="value">${soldTo}</span></td>
            <td><span class="label">Contact:</span> <span class="value">${contact}</span></td>
          </tr>
          <tr>
            <td><span class="label">Address:</span> <span class="value">${address}</span></td>
            <td><span class="label">Receipt No:</span> <span class="value">${receiptNo}</span></td>
          </tr>
          <tr>
            <td><span class="label">Reference No:</span> <span class="value">${refNo}</span></td>
            <td><span class="label">Gate Pass No:</span> <span class="value">${gatePass}</span></td>
          </tr>
        </table>

        <div class="section-title">Remarks</div>
        <div class="remarks-box">${remarks}</div>

        <div class="declaration-box">
          <div class="declaration-title">Declaration</div>
          This is to certify that the above cattle belonging to Madhava Srusti Rashtrotthana Goshala
          was sold / handed over as per the details mentioned above and the transaction has been
          recorded in Govardhana CDMS.
        </div>

        <div class="footer">
          <div class="sign">
            <div class="sign-line"></div>
            SUPERVISOR SIGNATURE
          </div>
          <div class="sign">
            <div class="sign-line"></div>
            ACCOUNTS / RECEIPT VERIFICATION
          </div>
          <div class="sign">
            <div class="sign-line"></div>
            PROJECT MANAGER SIGNATURE
          </div>
        </div>
      </div>

      <script>setTimeout(() => window.print(), 500);</script>
    </body>
    </html>
  `;

  const win = window.open("", "_blank", "width=900,height=1100");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};



const printTransferCertificate = (row) => {
  const exitLog = getExitLogForCattle(row, exitLogs);

  const internalId = getRowId(row);
  const eventDate = exitLog?.exit_date || exitLog?.date || "";
  const certificateNo = getCertificateNo("TC", internalId, eventDate);
  const generatedOn = formatCertificateDate(new Date().toISOString().slice(0, 10));

  const transferDate = formatCertificateDate(eventDate);
  const transferredTo = exitLog?.party_name || exitLog?.partyName || "Not recorded";
  const contact = exitLog?.party_contact || exitLog?.partyContact || "Not recorded";
  const address = exitLog?.party_address || exitLog?.partyAddress || "Not recorded";
  const refNo = exitLog?.ref_no || exitLog?.refNo || "Not recorded";
  const gatePass = exitLog?.gate_pass || exitLog?.gatePass || "Not recorded";
  const remarks = exitLog?.remarks || "No remarks recorded";

  const html = `
    <html>
    <head>
      <title>Cattle Transfer Certificate - ${row.tag}</title>
      <style>
        body {
          font-family: "Times New Roman", serif;
          padding: 18px;
          color: #000;
        }

        .container {
          border: 3px solid #000;
          padding: 14px 16px;
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          position: relative;
          padding-top: 4px;
        }

        .logo {
          width: 70px;
          height: 70px;
          object-fit: contain;
          margin-bottom: 4px;
        }

        .org-title {
          font-size: 21px;
          font-weight: 800;
          text-decoration: underline;
          margin: 0;
        }

        .org-subtitle {
          font-size: 14px;
          font-weight: 700;
          margin: 4px 0 10px 0;
        }

        .cert-title {
          border: 2px solid #000;
          padding: 7px;
          font-size: 17px;
          font-weight: 800;
          background: #eee;
          margin-bottom: 10px;
        }

        .meta-box {
          border: 1px solid #000;
          padding: 7px 10px;
          margin-bottom: 10px;
          font-size: 13px;
          font-weight: 700;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .photo-box {
          width: 100%;
          height: 180px;
          border: 2px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .photo-box img {
          height: 100%;
          max-width: 100%;
          object-fit: contain;
        }

        .section-title {
          background: #f2f2f2;
          border: 1px solid #000;
          padding: 5px 8px;
          font-weight: 800;
          font-size: 13px;
          margin-top: 10px;
          text-align: left;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
          margin-bottom: 8px;
        }

        td {
          border: 1px solid #000;
          padding: 7px 9px;
          width: 50%;
          font-size: 12.8px;
          vertical-align: top;
        }

        .label {
          font-weight: 800;
          text-transform: uppercase;
          margin-right: 5px;
        }

        .value {
          font-weight: 500;
          text-transform: uppercase;
        }

        .remarks-box {
          border: 2px solid #000;
          min-height: 28px;
          padding: 8px;
          font-size: 12.8px;
          text-align: left;
          margin-bottom: 10px;
        }

        .declaration-box {
          border: 1px solid #000;
          padding: 8px;
          font-size: 12.8px;
          line-height: 1.35;
          text-align: left;
          margin-top: 10px;
          margin-bottom: 12px;
        }

        .declaration-title {
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .footer {
          margin-top: 18px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .sign {
          width: 32%;
          text-align: center;
          font-size: 11.5px;
          font-weight: 800;
        }

        .sign-line {
          border-bottom: 1px solid #000;
          height: 16px;
          margin-bottom: 6px;
        }

        @media print {
          @page { size: A4; margin: 8mm; }
          body { padding: 0; }
        }
      </style>
    </head>

    <body>
      <div class="container">
        <div class="header">
          <img class="logo" src="${rashtrotthanaLogo}" />
          <h1 class="org-title">MADHAVA SRUSTI RASHTROTTHANA GOSHALA</h1>
          <div class="org-subtitle">SS GHATI DODDABALLAPURA</div>
          <div class="cert-title">CATTLE TRANSFER CERTIFICATE</div>
        </div>

        <div class="meta-box">
          <div>Certificate No : ${certificateNo}</div>
          <div>Generated On : ${generatedOn}</div>
        </div>

        <div class="photo-box">
          ${
            row.photo
              ? `<img src="${row.photo}" />`
              : `<div style="color:#777; font-style:italic;">Photo Not Available</div>`
          }
        </div>

        <div class="section-title">Cattle Identity</div>
        <table>
          <tr>
            <td><span class="label">Internal ID:</span> <span class="value">${internalId || "-"}</span></td>
            <td><span class="label">Tag No:</span> <span class="value">${row.tag || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Name:</span> <span class="value">${row.name || "-"}</span></td>
            <td><span class="label">Breed:</span> <span class="value">${row.breed || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Gender:</span> <span class="value">${row.gender || "-"}</span></td>
            <td><span class="label">Category:</span> <span class="value">${row.category || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Colour:</span> <span class="value">${row.color || "-"}</span></td>
            <td><span class="label">Date of Birth:</span> <span class="value">${formatCertificateDate(row.dob)}</span></td>
          </tr>
        </table>

        <div class="section-title">Transfer Details</div>
        <table>
          <tr>
            <td><span class="label">Transfer Date:</span> <span class="value">${transferDate}</span></td>
            <td><span class="label">Transferred To:</span> <span class="value">${transferredTo}</span></td>
          </tr>
          <tr>
            <td><span class="label">Contact:</span> <span class="value">${contact}</span></td>
            <td><span class="label">Reference No:</span> <span class="value">${refNo}</span></td>
          </tr>
          <tr>
            <td><span class="label">Address:</span> <span class="value">${address}</span></td>
            <td><span class="label">Gate Pass No:</span> <span class="value">${gatePass}</span></td>
          </tr>
        </table>

        <div class="section-title">Remarks</div>
        <div class="remarks-box">${remarks}</div>

        <div class="declaration-box">
          <div class="declaration-title">Declaration</div>
          This is to certify that the above cattle belonging to Madhava Srusti Rashtrotthana Goshala
          was transferred / handed over as per the details mentioned above and the transaction has
          been recorded in Govardhana CDMS.
        </div>

        <div class="footer">
          <div class="sign">
            <div class="sign-line"></div>
            SUPERVISOR SIGNATURE
          </div>
          <div class="sign">
            <div class="sign-line"></div>
            RECEIVING AUTHORITY SIGNATURE
          </div>
          <div class="sign">
            <div class="sign-line"></div>
            PROJECT MANAGER SIGNATURE
          </div>
        </div>
      </div>

      <script>setTimeout(() => window.print(), 500);</script>
    </body>
    </html>
  `;

  const win = window.open("", "_blank", "width=900,height=1100");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};

const printFarmerHandoverCertificate = (row) => {
  const exitLog = getExitLogForCattle(row, exitLogs);

  const internalId = getRowId(row);
  const eventDate = exitLog?.exit_date || exitLog?.date || "";
  const certificateNo = getCertificateNo("FH", internalId, eventDate);
  const generatedOn = formatCertificateDate(new Date().toISOString().slice(0, 10));

  const handoverDate = formatCertificateDate(eventDate);
  const farmerName = exitLog?.party_name || exitLog?.partyName || "Not recorded";
  const contact = exitLog?.party_contact || exitLog?.partyContact || "Not recorded";
  const address = exitLog?.party_address || exitLog?.partyAddress || "Not recorded";
  const marketValue = exitLog?.market_value || exitLog?.marketValue || "Not recorded";
  const teethDetails = exitLog?.teeth_details || exitLog?.teethDetails || "Not recorded";
  const teethAge = exitLog?.teeth_age || exitLog?.teethAge || "Not recorded";
  const pregnancyStatus =
    exitLog?.preganancy_status ||
    exitLog?.pregnancy_status ||
    "Not recorded";
  const remarks = exitLog?.remarks || "No remarks recorded";

  const showPregnancy = String(row.gender || "").toLowerCase().startsWith("f");

  const html = `
    <html>
    <head>
      <title>Farmer Handover Certificate - ${row.tag}</title>
      <style>
        body {
          font-family: "Times New Roman", serif;
          padding: 18px;
          color: #000;
        }

        .container {
          border: 3px solid #000;
          padding: 14px 16px;
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          position: relative;
          padding-top: 4px;
        }

        .logo {
          width: 70px;
          height: 70px;
          object-fit: contain;
          margin-bottom: 4px;
        }

        .org-title {
          font-size: 21px;
          font-weight: 800;
          text-decoration: underline;
          margin: 0;
        }

        .org-subtitle {
          font-size: 14px;
          font-weight: 700;
          margin: 4px 0 10px 0;
        }

        .cert-title {
          border: 2px solid #000;
          padding: 7px;
          font-size: 17px;
          font-weight: 800;
          background: #eee;
          margin-bottom: 10px;
        }

        .meta-box {
          border: 1px solid #000;
          padding: 7px 10px;
          margin-bottom: 10px;
          font-size: 13px;
          font-weight: 700;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .photo-box {
          width: 100%;
          height: 180px;
          border: 2px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .photo-box img {
          height: 100%;
          max-width: 100%;
          object-fit: contain;
        }

        .section-title {
          background: #f2f2f2;
          border: 1px solid #000;
          padding: 5px 8px;
          font-weight: 800;
          font-size: 13px;
          margin-top: 10px;
          text-align: left;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
          margin-bottom: 8px;
        }

        td {
          border: 1px solid #000;
          padding: 7px 9px;
          width: 50%;
          font-size: 12.8px;
          vertical-align: top;
        }

        .label {
          font-weight: 800;
          text-transform: uppercase;
          margin-right: 5px;
        }

        .value {
          font-weight: 500;
          text-transform: uppercase;
        }

        .remarks-box {
          border: 2px solid #000;
          min-height: 28px;
          padding: 8px;
          font-size: 12.8px;
          text-align: left;
          margin-bottom: 10px;
        }

        .declaration-box {
          border: 1px solid #000;
          padding: 8px;
          font-size: 12.8px;
          line-height: 1.35;
          text-align: left;
          margin-top: 10px;
          margin-bottom: 12px;
        }

        .declaration-title {
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .footer {
          margin-top: 18px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .sign {
          width: 32%;
          text-align: center;
          font-size: 11.5px;
          font-weight: 800;
        }

        .sign-line {
          border-bottom: 1px solid #000;
          height: 16px;
          margin-bottom: 6px;
        }

        @media print {
          @page { size: A4; margin: 8mm; }
          body { padding: 0; }
        }
      </style>
    </head>

    <body>
      <div class="container">
        <div class="header">
          <img class="logo" src="${rashtrotthanaLogo}" />
          <h1 class="org-title">MADHAVA SRUSTI RASHTROTTHANA GOSHALA</h1>
          <div class="org-subtitle">SS GHATI DODDABALLAPURA</div>
          <div class="cert-title">FARMER HANDOVER CERTIFICATE</div>
        </div>

        <div class="meta-box">
          <div>Certificate No : ${certificateNo}</div>
          <div>Generated On : ${generatedOn}</div>
        </div>

        <div class="photo-box">
          ${
            row.photo
              ? `<img src="${row.photo}" />`
              : `<div style="color:#777; font-style:italic;">Photo Not Available</div>`
          }
        </div>

        <div class="section-title">Cattle Identity</div>
        <table>
          <tr>
            <td><span class="label">Internal ID:</span> <span class="value">${internalId || "-"}</span></td>
            <td><span class="label">Tag No:</span> <span class="value">${row.tag || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Name:</span> <span class="value">${row.name || "-"}</span></td>
            <td><span class="label">Breed:</span> <span class="value">${row.breed || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Gender:</span> <span class="value">${row.gender || "-"}</span></td>
            <td><span class="label">Category:</span> <span class="value">${row.category || "-"}</span></td>
          </tr>
          <tr>
            <td><span class="label">Colour:</span> <span class="value">${row.color || "-"}</span></td>
            <td><span class="label">Date of Birth:</span> <span class="value">${formatCertificateDate(row.dob)}</span></td>
          </tr>
        </table>

        <div class="section-title">Farmer Handover Details</div>
        <table>
          <tr>
            <td><span class="label">Handover Date:</span> <span class="value">${handoverDate}</span></td>
            <td><span class="label">Farmer Name:</span> <span class="value">${farmerName}</span></td>
          </tr>
          <tr>
            <td><span class="label">Contact:</span> <span class="value">${contact}</span></td>
            <td><span class="label">Market Value:</span> <span class="value">${marketValue}</span></td>
          </tr>
          <tr>
            <td><span class="label">Address:</span> <span class="value">${address}</span></td>
            <td><span class="label">Teeth Details:</span> <span class="value">${teethDetails}</span></td>
          </tr>
          <tr>
            <td><span class="label">Age by Teeth:</span> <span class="value">${teethAge}</span></td>
            <td><span class="label">${showPregnancy ? "Pregnancy Status:" : "Remarks:"}</span>
              <span class="value">${showPregnancy ? pregnancyStatus : remarks}</span></td>
          </tr>
        </table>

        ${showPregnancy ? `
          <div class="section-title">Remarks</div>
          <div class="remarks-box">${remarks}</div>
        ` : ""}

        <div class="declaration-box">
          <div class="declaration-title">Declaration</div>
          This is to certify that the above cattle belonging to Madhava Srusti Rashtrotthana Goshala
          was handed over to the farmer / beneficiary as per the details mentioned above and the
          transaction has been recorded in Govardhana CDMS.
        </div>

        <div class="footer">
          <div class="sign">
            <div class="sign-line"></div>
            SUPERVISOR SIGNATURE
          </div>
          <div class="sign">
            <div class="sign-line"></div>
            FARMER / BENEFICIARY SIGNATURE
          </div>
          <div class="sign">
            <div class="sign-line"></div>
            PROJECT MANAGER SIGNATURE
          </div>
        </div>
      </div>

      <script>setTimeout(() => window.print(), 500);</script>
    </body>
    </html>
  `;

  const win = window.open("", "_blank", "width=900,height=1100");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};
  if (loading) return <div style={{ padding: "2rem" }}>Loading Master Data...</div>;
  if (error) return <div style={{ padding: "2rem", color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "1.5rem", width: "100%", boxSizing: "border-box" }}>
      
 {/* HEADER */}
<div style={{ marginBottom: "1.25rem" }}>
  <PageHeader
    title="🐄 Master Cattle Data"
    countText={
      <>
        Showing <strong>{filteredRows.length}</strong> of{" "}
        <strong>{rows.length}</strong> records
      </>
    }
    action={
      isAdmin ? (
        <Link to="/cattle/register" style={primaryBtnStyle}>
          <span>+</span> Add New
        </Link>
      ) : null
    }
  />

  {/* SUMMARY CHIPS */}
  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
    <MetricCard
  label="Total"
  value={summary.total}
  color="#2563eb"
  onClick={() => {
    setStatusFilter("All");
    setGenderFilter("All");
    setBreedFilter("All");
  }}
/>

<MetricCard label="Active" value={summary.active} color="#16a34a" onClick={() => {
  setStatusFilter("Active");
  setGenderFilter("All");
  setBreedFilter("All");
}} />

<MetricCard label="Active Female" value={summary.female} color="#ec4899" onClick={() => {
  setStatusFilter("Active");
  setGenderFilter("Female");
  setBreedFilter("All");
}} />

<MetricCard label="Active Male" value={summary.male} color="#3b82f6" onClick={() => {
  setStatusFilter("Active");
  setGenderFilter("Male");
  setBreedFilter("All");
}} />

<MetricCard label="Active Breeds" value={summary.breeds} color="#f97316" onClick={() => {
  setStatusFilter("Active");
  setGenderFilter("All");
  setBreedFilter("All");
}} />
  </div>

  {/* FILTERS */}
<div style={filterPanelStyle}>
  <div style={filterGridStyle}>
    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={filterInputStyle}>
      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
    </select>

    <select value={breedFilter} onChange={e => setBreedFilter(e.target.value)} style={filterInputStyle}>
      {breedOptions.map(b => <option key={b} value={b}>{b === "All" ? "All Breeds" : b}</option>)}
    </select>

    <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} style={filterInputStyle}>
      <option value="All">All Gender</option>
      <option value="Female">Female</option>
      <option value="Male">Male</option>
    </select>

    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={filterInputStyle}>
      {typeOptions.map(t => (
        <option key={t} value={t}>
          {t === "All" ? "All Types" : t}
        </option>
      ))}
    </select>

    <div style={searchBoxWrapStyle}>
      <input
        type="text"
        placeholder="Search Tag, Name, Breed, Colour, UID..."
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        style={searchInputStyle}
      />

      {searchText && (
        <button
          type="button"
          onClick={() => setSearchText("")}
          style={clearSearchBtnStyle}
          title="Clear search"
        >
          ×
        </button>
      )}
    </div>
  </div>

  <div style={filterActionsStyle}>
    <button
      type="button"
      onClick={handleClearFilters}
      style={clearFiltersBtnStyle}
    >
      Clear Filters
    </button>
  </div>
</div>
</div>

{filteredRows.length > 0 && (
  <div style={topPaginationStyle}>
    <button onClick={handlePrev} disabled={currentPage === 1} style={pageBtnStyle}>
      ‹ Prev
    </button>

    <span style={pageNumberStyle}>
  Records: {filteredRows.length} | Page {currentPage} of {totalPages || 1}
</span>

    <button
      onClick={handleNext}
      disabled={currentPage === totalPages || totalPages === 0}
      style={pageBtnStyle}
    >
      Next ›
    </button>
  </div>
)}
      {/* TABLE */}
      <div
  style={{
    ...cardStyle,
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 220px)",
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
  <th style={{ ...thStyle, width: "70px" }}>Photo</th>
  <th style={thStyle}>Cattle</th>
  <th style={thStyle}>Breed</th>
  <th style={thStyle}>Gender</th>
  <th style={thStyle}>Status</th>
  <th style={thStyle}>Type</th>
  <th style={{ ...thStyle, textAlign: "center" }}>Action</th>
</tr>
          </thead>
          <tbody>
  {displayedRows.length === 0 ? (
    <tr>
      <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#999" }}>
        No records found.
      </td>
    </tr>
  ) : (
    displayedRows.map((row, idx) => {
      const type = String(row.admissionType || "").toLowerCase();
const isActiveRow = String(row.status || "").toLowerCase() === "active";
const isDeactiveRow = String(row.status || "").toLowerCase() === "deactive";

const safeId = getRowId(row);
const exitType = getExitTypeForCattle(row, exitLogs);
const deactiveCertLabel = getDeactiveCertificateLabel(exitType);

if (isDeactiveRow && row.tag === "632643") {
  console.log("MATCH TEST FOR 632643:", {
    rowTag: row.tag,
    rowInternalId: safeId,
    exitType,
    deactiveCertLabel,
    exitLogsCount: exitLogs.length,
    firstExitLog: exitLogs[0],
  });
}


      return (
  <tr
    key={idx}
    onClick={() =>
  setSelected({
    ...row,
    is_disabled: row.is_disabled || row.isDisabled || "No",
    isDisabled: row.is_disabled || row.isDisabled || "No",
    disability_details: row.disability_details || row.disabilityDetails || "",
    disabilityDetails: row.disability_details || row.disabilityDetails || "",
  })
}
    style={{
  borderBottom: "1px solid #f1f5f9",
  cursor: "pointer",
  background:
  selected && getRowId(selected) === safeId
    ? "#fef3c7"
    : String(row.status || "").toLowerCase() === "deactive"
    ? "#fff7ed"
    : idx % 2 === 0
    ? "#ffffff"
    : "#fafafa",
}}
  >
    <td style={tdStyle}>
      <CattleThumb url={row.photo || row.photoUrl || row.photo_url} />
    </td>

    <td style={tdStyle}>
      <div style={{ fontWeight: "800", color: "#0f172a" }}>{row.tag || "-"}</div>
      <div style={{ fontSize: "0.9rem", color: "#334155", marginTop: "2px" }}>
        {row.name || "-"}
      </div>
      <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
        {safeId}
      </div>
    </td>

    <td style={tdStyle}>
      <div style={{ fontWeight: 600 }}>{row.breed || "-"}</div>
      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{row.color || ""}</div>
    </td>

    <td style={tdStyle}>
  <GenderText gender={row.gender} />
</td>

    <td style={tdStyle}>
      <StatusBadge value={row.status} />
    </td>
<td style={tdStyle}>
  <StatusBadge value={getDisplayTypeForCattle(row, exitLogs)} />
</td>

    <td style={{ ...tdStyle, textAlign: "center" }}>
      <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActionMenuId(actionMenuId === safeId ? null : safeId);
          }}
          style={menuBtnStyle}
          title="Actions"
        >
          ⋮
        </button>

        {actionMenuId === safeId && (
          <div style={actionMenuStyle} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              style={actionMenuItemStyle}
              onClick={() => {
                setActionMenuId(null);
                setSelected({
  ...row,
  is_disabled: row.is_disabled || row.isDisabled || "No",
  isDisabled: row.is_disabled || row.isDisabled || "No",
  disability_details: row.disability_details || row.disabilityDetails || "",
  disabilityDetails: row.disability_details || row.disabilityDetails || "",
});
              }}
            >
              👁 View Details
            </button>

            {isActiveRow && (
              <button
                type="button"
                style={actionMenuItemStyle}
                onClick={() => {
                  setActionMenuId(null);
                  handleGenerateCert(row);
                }}
              >
                {getDisplayTypeForCattle(row, exitLogs) === "Reactivated"
  ? "📜 Reactivation Certificate"
  : type.includes("birth") || type.includes("born")
    ? "📜 Birth Certificate"
    : "📜 Incoming Certificate"}
              </button>
            )}

            {isDeactiveRow && deactiveCertLabel && (
              <button
                type="button"
                style={actionMenuItemStyle}
                onClick={() => {
                  setActionMenuId(null);
                  handleGenerateDeactiveCert(row, exitType);
                }}
              >
                {deactiveCertLabel}
              </button>
            )}

{canReactivateCattle(row, exitLogs) && (
  <button
    type="button"
    style={actionMenuItemStyle}
    onClick={() => {
      setActionMenuId(null);
      setReactivationRow(row);
    }}
  >
    🔄 Reactivate
  </button>
)}
            <button
              type="button"
              style={actionMenuItemStyle}
              onClick={() => {
                setActionMenuId(null);
                alert("Pedigree shortcut will be connected next.");
              }}
            >
              🌳 Pedigree
            </button>
          </div>
        )}
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

{/* REACTIVATION MODAL - UI ONLY */}
{reactivationRow && (
  <ReactivationModal
    row={reactivationRow}
    exitLog={getExitLogForCattle(reactivationRow, exitLogs)}
    exitType={getExitTypeForCattle(reactivationRow, exitLogs)}
    onClose={() => setReactivationRow(null)}
    onSubmit={async (payload) => {
  try {
    const res = await reactivateCattle(payload);

    if (res?.success) {
      alert("Cattle reactivated successfully.");
      setReactivationRow(null);
      await loadData();
    } else {
      alert(res?.error || "Failed to reactivate cattle.");
    }
  } catch (err) {
    console.error(err);
    alert("Failed to reactivate cattle.");
  }
}}
  />
)}

      {/* MODAL */}
      {selected && (
        <div style={modalOverlayStyle} onClick={() => setSelected(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
             <CattleDetailsPanel
  selected={selected}
  exitLogs={exitLogs}
  onClose={() => setSelected(null)}
  canEdit={isAdmin}
  refreshData={loadData}
/>
          </div>
        </div>
      )}
    </div>
  );
}

function ReactivationModal({ row, exitLog, exitType, onClose, onSubmit }) {
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    reactivationDate: today,
    reasonForReturn: "",
    returnedFrom: exitLog?.party_name || exitLog?.partyName || "",
    returnedFromContact: exitLog?.party_contact || exitLog?.partyContact || "",
    remarks: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!form.reactivationDate) {
      alert("Please select Reactivation Date.");
      return;
    }

    if (!form.reasonForReturn.trim()) {
      alert("Please enter Reason for Return.");
      return;
    }

    onSubmit({
      internal_id: getRowId(row),
      tag_number: row.tag || "",
      cattle_name: row.name || "",
      previous_exit_type: exitType || "",
      linked_exit_id: exitLog?.exit_id || exitLog?.exitId || "",
      reactivation_date: form.reactivationDate,
      reason_for_return: form.reasonForReturn,
      returned_from: form.returnedFrom,
      returned_from_contact: form.returnedFromContact,
      remarks: form.remarks,
    });
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div
        style={{
          ...modalContentStyle,
          width: "560px",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
              🔄 Reactivate Cattle
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
              This will update Master status to Active and add Reactivation entry in Exit Log
            </div>
          </div>

          <button type="button" onClick={onClose} style={closeBtnStyle}>
            ×
          </button>
        </div>

        <div
          style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: "10px",
            padding: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ fontWeight: 800, color: "#0f172a" }}>
            {row.tag || "-"} — {row.name || "-"}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "4px" }}>
            Internal ID: <strong>{getRowId(row) || "-"}</strong>
          </div>
          <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "4px" }}>
            Current Status: <strong>{row.status || "-"}</strong> | Exit Type:{" "}
            <strong>{exitType || "-"}</strong>
          </div>
          <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "4px" }}>
            Original Exit ID: <strong>{exitLog?.exit_id || exitLog?.exitId || "-"}</strong>
          </div>
        </div>

        <div style={{ display: "grid", gap: "0.85rem" }}>
          <div>
            <label style={labelStyle}>Reactivation Date *</label>
            <input
              type="date"
              name="reactivationDate"
              value={form.reactivationDate}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Reason for Return *</label>
            <textarea
              name="reasonForReturn"
              value={form.reasonForReturn}
              onChange={handleChange}
              placeholder="Example: Returned by farmer due to inability to maintain..."
              style={{
                ...inputStyle,
                minHeight: "80px",
                resize: "vertical",
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Returned From</label>
            <input
              type="text"
              name="returnedFrom"
              value={form.returnedFrom}
              onChange={handleChange}
              placeholder="Person / farmer / party name"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Returned From Contact</label>
            <input
              type="text"
              name="returnedFromContact"
              value={form.returnedFromContact}
              onChange={handleChange}
              placeholder="Contact number"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Remarks</label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              placeholder="Any additional observations on return"
              style={{
                ...inputStyle,
                minHeight: "70px",
                resize: "vertical",
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginTop: "1.25rem",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "1rem",
          }}
        >
          <button type="button" onClick={onClose} style={cancelBtnStyle}>
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            style={{
              ...saveBtnStyle,
              background: "#2563eb",
            }}
          >
            Capture Reactivation
          </button>
        </div>
      </div>
    </div>
  );
}

function GenderText({ gender }) {
  const g = String(gender || "").toLowerCase();

  let color = "#334155";

  if (g.startsWith("f")) color = "#ec4899";
  if (g.startsWith("m")) color = "#2563eb";

  return (
    <span style={{ color, fontWeight: 700 }}>
      {gender || "-"}
    </span>
  );
}

function CattleThumb({ url }) {
  const [hasError, setHasError] = useState(false);

  const placeholder = (
    <div
      style={{
        width: "48px",
        height: "48px",
        borderRadius: "10px",
        background: "#f8fafc",
        border: "1px dashed #cbd5e1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
      }}
    >
      <div style={{ fontSize: "1.1rem", lineHeight: 1 }}>🐄</div>
      <div style={{ fontSize: "0.55rem", marginTop: "2px" }}>No Photo</div>
    </div>
  );

  if (!url || hasError) return placeholder;

  return (
    <img
      src={url}
      alt="Cattle"
      style={{
        width: "48px",
        height: "48px",
        objectFit: "cover",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
      }}
      onError={() => setHasError(true)}
    />
  );
}
/* ------------------------------------------------
   PHOTO COMPONENT
   ------------------------------------------------ */
function CattlePhoto({ url, imgStyle = largePhotoStyle }) {
  if (!url) return <div style={placeholderStyle}>No Photo</div>;
  if (url.includes("cloudinary.com")) return <img src={url} alt="Cattle" style={imgStyle} onError={(e) => e.target.style.display = 'none'} />;
  if (url.includes("drive.google.com")) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:"5px", background:"#fef2f2", width: "100%" }}>
        <span style={{fontSize:"0.75rem", color:"#b91c1c", fontWeight:"bold", textAlign:"center"}}>Drive Link (Cannot Embed)</span>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{fontSize:"0.8rem", color:"#fff", background:"#ef4444", padding:"6px 12px", borderRadius:"4px", textDecoration:"none"}}>Open Photo ↗</a>
      </div>
    );
  }
  return <img src={url} alt="Cattle" style={imgStyle} onError={(e) => e.target.style.display = 'none'} />;
}

/* ------------ DETAILS PANEL WITH UPLOAD ------------ */
function CattleDetailsPanel({
  selected,
  exitLogs = [],
  onClose,
  canEdit,
  refreshData,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({
  open: false,
  type: "info",
  message: "",
});
  const fileInputRef = useRef(null); 

  useEffect(() => { if (isEditing) setFormData({ ...selected }); }, [isEditing, selected]);

  

  const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => {
    if (name === "gender") {
      return {
        ...prev,
        gender: value,
        category: "",
      };
    }

    return {
      ...prev,
      [name]: value,
    };
  });
};

  const handleSave = async () => {
  const idToUpdate = formData.internalId || formData.id || formData.internal_id;

  if (!idToUpdate) {
    alert("Error: Missing Internal ID for this record. Cannot update.");
    return;
  }

  try {
    setSaving(true);
    setToast({
  open: true,
  type: "info",
  message: "Please wait... Updating cattle details.",
});

    const photoValue =
      formData.photo ||
      formData.photoUrl ||
      formData.photo_url ||
      "";

    const res = await updateCattle({
      id: idToUpdate,
      ...formData,
      photo: photoValue,
      photoUrl: photoValue,
      photo_url: photoValue,
    });

    if (res && res.success) {
      setToast({
  open: true,
  type: "success",
  message: "Cattle details updated successfully.",
});

setIsEditing(false);

// Give user time to see the success toast
setTimeout(async () => {
  await refreshData();
  onClose();
}, 1800);
    } else {
      setToast({
  open: true,
  type: "error",
  message: res?.error || "Update failed.",
});
    }
  } catch (err) {
    console.error(err);
    setToast({
  open: true,
  type: "error",
  message: err.message || String(err),
});
  } finally {
    setSaving(false);
  }
};

  // UPLOAD LOGIC
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET); 
    // data.append("folder", "cattle_photos"); 

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      });
      const fileData = await res.json();
      
      if (fileData.secure_url) {
        setFormData(prev => ({
  ...prev,
  photo: fileData.secure_url,
  photoUrl: fileData.secure_url,
  photo_url: fileData.secure_url,
}));
      } else {
        console.error("Cloudinary upload failed:", fileData);
alert(fileData?.error?.message || "Upload failed. Check console.");
      }
    } catch (err) {
      console.error("Error uploading:", err);
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const isActive = String(selected.status || "").toLowerCase() === "active";
const isBornAtGoshala = isBornAtGoshalaType(selected);



const latestLifecycleLog = getLatestLifecycleLogForCattle(selected, exitLogs);
const latestReactivationLog = getExitLogsForCattle(selected, exitLogs)
  .filter((log) => getLogExitType(log).includes("reactivation"))
  .slice(-1)[0];

const reactivationLogToShow = latestReactivationLog || latestLifecycleLog;
const latestLifecycleType = getLogExitType(latestLifecycleLog);

const admissionDate =
  getAnyValue(selected, [
    "admissionDate",
    "admission_date",
    "date_of_admission",
    "Date of Admission",
    "Admission Date",
    "origin_admission_date",
  ]) || selected.dob || "";

const admissionType = getAnyValue(selected, [
  "admissionType",
  "admission_type",
  "type_of_admission",
  "type",
  "origin_type",
]);

const displayAdmissionType = normalizeAdmissionType(admissionType);

const admissionAgeMonthsValue = getAnyValue(selected, [
  "admissionAgeMonths",
  "admission_age_months",
  "admissionAge",
  "age_at_admission",
  "ageAtAdmission",
]);

const admissionWeight = getAnyValue(selected, [
  "admissionWeight",
  "admission_weight",
  "weight",
  "admissionWeightKg",
  "body_weight",
]);

const birthWeight = getAnyValue(selected, [
  "birthWeight",
  "birth_weight",
  "calfWeight",
  "calf_weight",
]);

const colour = getAnyValue(selected, [
  "color",
  "colour",
  "Color",
  "Colour",
]);

const reactivationDate = getAnyValue(latestLifecycleLog, [
  "reactivation_date",
  "exit_date",
  "date",
]);

const reactivationWeight = getAnyValue(latestLifecycleLog, [
  "reactivation_weight",
  "weight",
  "admission_weight",
  "body_weight",
]);

const currentAgeText = calculateSmartAge(
  selected.dob,
  admissionDate,
  admissionAgeMonthsValue
);

const ageAtAdmissionText = formatAgeFromMonths(admissionAgeMonthsValue);

const ageAtReactivationText = calculateAgeAtDate(
  selected.dob,
  reactivationDate,
  admissionDate,
  admissionAgeMonthsValue
);

const sourceName = getAnyValue(selected, [
  "sourceName",
  "source_name",
  "source_party_name",
  "sourcePartyName",
  "party_name",
]);

const sourceMobile = getAnyValue(selected, [
  "sourceMobile",
  "source_mobile",
  "source_party_mobile",
  "sourcePartyMobile",
  "party_contact",
]);

const sourceAddress = getAnyValue(selected, [
  "sourceAddress",
  "source_address",
  "source_party_address",
  "sourcePartyAddress",
  "party_address",
]);

const purchasePrice = getAnyValue(selected, [
  "purchasePrice",
  "purchase_price",
  "amount",
]);

const linkedBirthId = getAnyValue(selected, ["linkedBirthId", "linked_birth_id"]);
const birthTime = getAnyValue(selected, ["birthTime", "birth_time"]);
const birthStatus = getAnyValue(selected, ["birthStatus", "birth_status"]);
const deliveryType = getAnyValue(selected, ["deliveryType", "delivery_type"]);

const disabledValue = String(
  getAnyValue(selected, [
    "is_disabled",
    "isDisabled",
    "Is Disabled",
    "is disabled",
  ]) || "No"
).trim();

const isDisabledYes = ["yes", "y", "true", "1"].includes(
  disabledValue.toLowerCase()
);

const disabilityDetailsValue = getAnyValue(selected, [
  "disability_details",
  "disabilityDetails",
  "Disability Details",
]);

const displayId = getRowId(selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {toast.open && (
  <ProgressToast
    show={toast.open}
    type={toast.type}
    message={toast.message}
  />
)}
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem" }}>
        <div>
             {isEditing ? (
               <div style={{color:"#ea580c", fontWeight:"bold", fontSize:"1.1rem"}}>Editing: {selected.tag}</div>
             ) : (
               <>
                 <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{selected.tag} – {selected.name}</div>
                 <div style={{fontSize:"0.85rem", color:"#666", marginTop:"4px"}}>
                   Internal ID: <strong>{displayId || "N/A"}</strong> | UID: {selected.govtUid || "N/A"}
                 </div>
               </>
             )}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {canEdit && !isEditing && <button onClick={() => setIsEditing(true)} style={editBtnStyle}>✎ Edit</button>}
          {isEditing && (
            <>
              <button
  onClick={() => setIsEditing(false)}
  disabled={saving}
  style={{
    ...cancelBtnStyle,
    opacity: saving ? 0.6 : 1,
    cursor: saving ? "not-allowed" : "pointer",
  }}
>
  Cancel
</button>
              <button
  onClick={handleSave}
  disabled={saving}
  style={{
    ...saveBtnStyle,
    opacity: saving ? 0.6 : 1,
    cursor: saving ? "not-allowed" : "pointer",
  }}
>
  {saving ? "Saving..." : "Save"}
</button>
            </>
          )}
          <button
  onClick={() => {
    if (!saving) onClose();
  }}
  disabled={saving}
  style={{
    background: "transparent",
    border: "none",
    cursor: saving ? "not-allowed" : "pointer",
    opacity: saving ? 0.5 : 1,
  }}
>×</button>
        </div>
      </div>

      <div style={scrollableAreaStyle}>
        
        {/* LARGE PHOTO CONTAINER */}
        <div style={largePhotoContainerStyle}>
             {isEditing ? (
                formData.photo ? <img src={formData.photo} style={largePhotoStyle} alt="Preview" /> : <div style={placeholderStyle}>No Photo Selected</div>
             ) : (
                <CattlePhoto
  url={selected.photo || selected.photoUrl || selected.photo_url}
/>
             )}
        </div>

        {/* BASIC INFO SECTION */}
        <SectionTitle>Basic Information & Status</SectionTitle>
        <div style={gridStyle}>
          {isEditing ? (
             <>
                <EditInput label="Name" name="name" value={formData.name} onChange={handleChange} />

<EditInput label="Tag No" name="tag" value={formData.tag} onChange={handleChange} />

<EditInput
  label="Colour"
  name="color"
  value={formData.color || formData.colour || ""}
  onChange={handleChange}
  type="select"
  options={COLOUR_OPTIONS}
/>

<EditInput
  label="Breed"
  name="breed"
  value={formData.breed || ""}
  onChange={handleChange}
  type="select"
  options={BREED_OPTIONS}
/>

<EditInput
  label="Gender"
  name="gender"
  value={formData.gender || ""}
  onChange={handleChange}
  type="select"
  options={["Female", "Male"]}
/>

<EditInput label="DOB" name="dob" value={formData.dob} onChange={handleChange} type="date" />

<EditInput
  label="Status"
  name="status"
  value={formData.status}
  onChange={handleChange}
  type="select"
  options={["Active", "Deactive"]}
/>

<EditInput
  label="Shed (Location)"
  name="shed"
  value={formData.shed || formData.shed_id || ""}
  onChange={handleChange}
  type="select"
  options={SHED_OPTIONS}
/>

<EditInput
  label="Category"
  name="category"
  value={formData.category || ""}
  onChange={handleChange}
  type="select"
  options={getCategoryOptionsForEdit(formData.gender)}
/>
                
                {/* UPLOAD BUTTON CONTROL */}
<div style={{ gridColumn: "1 / -1", background: "#f0f9ff", padding: "10px", borderRadius: "8px", border: "1px solid #bae6fd" }}>
  <label style={{ ...labelStyle, color: "#0369a1" }}>
    Photo URL (Auto-filled on Upload)
  </label>

  <div style={{ display: "flex", gap: "10px" }}>
    <input
      type="text"
      name="photo"
      value={formData.photo || formData.photoUrl || formData.photo_url || ""}
      onChange={handleChange}
      placeholder="Paste link or Upload ->"
      style={{ ...inputStyle, flex: 1 }}
    />

    <input
      type="file"
      accept="image/*"
      ref={fileInputRef}
      onChange={handleFileSelect}
      style={{ display: "none" }}
    />

    <button
      type="button"
      onClick={() => {
        if (!saving && !uploading) {
          fileInputRef.current?.click();
        }
      }}
      disabled={saving || uploading}
      style={{
        background: saving || uploading ? "#cbd5e1" : "#0ea5e9",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        padding: "0 15px",
        fontWeight: "bold",
        cursor: saving || uploading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "5px",
        whiteSpace: "nowrap",
        opacity: saving || uploading ? 0.7 : 1,
      }}
    >
      {saving ? "Saving..." : uploading ? "Uploading..." : "📷 Upload New"}
    </button>
  </div>
</div>

             </>
          ) : (
             <>
               <DetailItem label="Breed" value={selected.breed} />
               <DetailItem label="Gender" value={selected.gender} />
               <DetailItem label="Colour" value={colour || "-"} />
               <DetailItem label="DOB" value={formatDate(selected.dob)} />
               {isBornAtGoshala && (
  <DetailItem label="Date of Birth" value={formatDate(selected.dob)} />
)}

{isActive && (
  <DetailItem
    label={isBornAtGoshala ? "Current Age" : "Estimated Current Age"}
    value={currentAgeText}
  />
)}
               <DetailItem label="Status" value={<StatusBadge value={selected.status} />} />
               <DetailItem label="Location" value={selected.shed} />
               <DetailItem label="Category" value={selected.category} />
             </>
          )}
        </div>

        {/* ORIGINS */}
<SectionTitle>Origins & Source</SectionTitle>
<div style={gridStyle}>
  {isEditing ? (
    <>

    <EditInput
  label="Admission Date"
  name="admissionDate"
  value={formData.admissionDate || formData.admission_date || ""}
  onChange={handleChange}
  type="date"
/>

<EditInput
  label="Admission Weight (Kg)"
  name="admissionWeight"
  value={formData.admissionWeight || formData.admission_weight || ""}
  onChange={handleChange}
  type="number"
/>

<EditInput
  label="Age at Admission (Months)"
  name="admissionAgeMonths"
  value={formData.admissionAgeMonths || formData.admission_age_months || ""}
  onChange={handleChange}
  type="number"
/>
      <EditInput
        label={
          displayAdmissionType === "Purchase"
            ? "Vendor Name"
            : displayAdmissionType === "Donation"
            ? "Donor Name"
            : displayAdmissionType === "From Farmer"
            ? "Farmer Name"
            : displayAdmissionType === "Rescue / Slaughter House"
            ? "Rescue Source Name"
            : "Source"
        }
        name="sourceName"
        value={formData.sourceName || formData.source_party_name || ""}
        onChange={handleChange}
      />

      <EditInput
        label={
          displayAdmissionType === "Purchase"
            ? "Vendor Phone Number"
            : displayAdmissionType === "Donation"
            ? "Donor Phone Number"
            : displayAdmissionType === "From Farmer"
            ? "Farmer Phone Number"
            : displayAdmissionType === "Rescue / Slaughter House"
            ? "Source Phone Number"
            : "Contact Number"
        }
        name="sourceMobile"
        value={formData.sourceMobile || formData.source_party_mobile || ""}
        onChange={handleChange}
      />

      <EditInput
        label={
          displayAdmissionType === "Purchase"
            ? "Vendor Address"
            : displayAdmissionType === "Donation"
            ? "Donor Address"
            : displayAdmissionType === "From Farmer"
            ? "Farmer Address"
            : displayAdmissionType === "Rescue / Slaughter House"
            ? "Rescue Location / Address"
            : "Address"
        }
        name="sourceAddress"
        value={formData.sourceAddress || formData.source_party_address || ""}
        onChange={handleChange}
      />

      {displayAdmissionType === "Purchase" && (
        <EditInput
          label="Purchase Price"
          name="purchasePrice"
          value={formData.purchasePrice || formData.purchase_price || ""}
          onChange={handleChange}
        />
      )}
    </>
  ) : (
    <>
      {isBornAtGoshala ? (
  <>
    <DetailItem label="Registration / Tagging Date" value={formatDate(admissionDate)} />
    <DetailItem label="Type" value={displayAdmissionType || "-"} />
    <DetailItem label="Date of Birth" value={formatDate(selected.dob)} />
    <DetailItem label="Birth Weight" value={birthWeight ? `${birthWeight} Kg` : "-"} />
    <DetailItem label="Birth Log ID" value={linkedBirthId || "-"} />
    <DetailItem label="Delivery Type" value={deliveryType || "-"} />
    <DetailItem label="Birth Status" value={birthStatus || "-"} />
    <DetailItem label="Birth Time" value={birthTime || "-"} />
  </>
) : (
  <>
    <DetailItem label="Admission Date" value={formatDate(admissionDate)} />
    <DetailItem label="Type" value={displayAdmissionType || "-"} />
    <DetailItem label="Age at Admission" value={ageAtAdmissionText} />
    <DetailItem
      label="Admission Weight"
      value={admissionWeight ? `${admissionWeight} Kg` : "-"}
    />
    <DetailItem label="Source" value={sourceName || "-"} />
    <DetailItem label="Contact Number" value={sourceMobile || "-"} />
    <DetailItem label="Address" value={sourceAddress || "-"} />

    {displayAdmissionType === "Purchase" && (
      <DetailItem label="Purchase Price" value={purchasePrice || "-"} />
    )}
  </>
)}
    </>
  )}
</div>


{getDisplayTypeForCattle(selected, exitLogs) === "Reactivated" && (
  <>
    <SectionTitle>REACTIVATION DETAILS</SectionTitle>

<div style={gridStyle}>
  <DetailItem
    label="Previous Exit Type"
    value={
      reactivationLogToShow?.category ||
      reactivationLogToShow?.previous_exit_type ||
      "-"
    }
  />

  <DetailItem
    label="Reactivation Date"
    value={formatDate(reactivationDate)}
  />

  <DetailItem
    label="Age at Readmission"
    value={ageAtReactivationText}
  />

  <DetailItem
    label="Estimated Current Age"
    value={currentAgeText}
  />

  <DetailItem
    label="Weight at Readmission"
    value={reactivationWeight ? `${reactivationWeight} Kg` : "-"}
  />

  <DetailItem
    label="Returned From"
    value={reactivationLogToShow?.party_name || latestLifecycleLog?.returned_from || "-"}
  />

  <DetailItem
    label="Reason for Return"
    value={
      reactivationLogToShow?.cause_details ||
      reactivationLogToShow?.reason_for_return ||
      reactivationLogToShow?.remarks ||
      "-"
    }
  />
</div>
  </>
)}

        {/* PARENTAGE */}
{isBornAtGoshala && (
  <>
    <SectionTitle>Parentage</SectionTitle>

    <div
      style={{
        background: "#fff7ed",
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #ffedd5",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: "bold",
              color: "#ea580c",
              marginBottom: "4px",
            }}
          >
            MOTHER (DAM)
          </div>

          {isEditing ? (
            <EditInput
              label="ID / Tag"
              name="damId"
              value={formData.damId}
              onChange={handleChange}
            />
          ) : (
            <div style={{ fontSize: "0.9rem" }}>
              {selected.damId || "-"}
              {selected.damBreed && selected.damBreed.trim() && (
                <span
                  style={{
                    color: "#888",
                    fontSize: "0.8rem",
                    marginLeft: "4px",
                  }}
                >
                  ({selected.damBreed})
                </span>
              )}
            </div>
          )}
        </div>

        <div>
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: "bold",
              color: "#ea580c",
              marginBottom: "4px",
            }}
          >
            FATHER (SIRE)
          </div>

          {isEditing ? (
            <EditInput
              label="ID / Tag"
              name="sireId"
              value={formData.sireId}
              onChange={handleChange}
            />
          ) : (
            <div style={{ fontSize: "0.9rem" }}>
              {selected.sireId || "-"}
              {selected.sireBreed && selected.sireBreed.trim() && (
                <span
                  style={{
                    color: "#888",
                    fontSize: "0.8rem",
                    marginLeft: "4px",
                  }}
                >
                  ({selected.sireBreed})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  </>
)}
        

        {/* HEALTH */}
<SectionTitle>Health & Other</SectionTitle>

<div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
  {isEditing ? (
    <>
      <EditInput
        label="Is Disabled?"
        name="is_disabled"
        value={formData.is_disabled || formData.isDisabled || "No"}
        onChange={handleChange}
        type="select"
        options={["No", "Yes"]}
      />

      {(formData.isDisabled === "Yes" || formData.is_disabled === "Yes") && (
        <div>
          <label style={labelStyle}>Disability Details</label>
          <textarea
            name="disabilityDetails"
            value={formData.disability_details || formData.disabilityDetails || ""}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: "60px" }}
          />
        </div>
      )}

      <div>
        <label style={labelStyle}>Remarks</label>
        <textarea
          name="remarks"
          value={formData.remarks || ""}
          onChange={handleChange}
          style={{ ...inputStyle, minHeight: "70px" }}
        />
      </div>
    </>
  ) : (
    <>
      <DetailItem
        label="Is Disabled?"
        value={selected.is_disabled || selected.isDisabled || "No"}
      />

      {(selected.isDisabled === "Yes" || selected.is_disabled === "Yes") && (
        <DetailItem
          label="Disability Details"
          value={selected.disability_details || selected.disabilityDetails || "-"}
        />
      )}

      <div style={{ marginTop: "5px" }}>
        <div style={labelItemStyle}>Remarks</div>
        <div style={{ background: "#f3f4f6", padding: "10px", borderRadius: "6px", fontSize: "0.85rem", fontStyle: "italic", color: "#374151" }}>
          "{selected.remarks || "No remarks."}"
        </div>
      </div>
    </>
  )}
</div>

      </div>
    </div>
  );
}

// Logic & Helpers
function parseFlexibleDate(value) {
  if (!value) return null;

  if (value instanceof Date && !isNaN(value.getTime())) return value;

  const s = String(value).trim();
  if (!s || s === "-") return null;

  const dateOnly = s.split(" ")[0];

  // dd/mm/yyyy or dd-mm-yyyy
  const dmY = dateOnly.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmY) {
    return new Date(Number(dmY[3]), Number(dmY[2]) - 1, Number(dmY[1]));
  }

  // yyyy-mm-dd
  const ymD = dateOnly.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymD) {
    return new Date(Number(ymD[1]), Number(ymD[2]) - 1, Number(ymD[3]));
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatAgeFromMonths(totalMonths) {
  const n = Number(String(totalMonths || "").replace(/[^0-9]/g, ""));
  if (!n) return "-";

  const years = Math.floor(n / 12);
  const months = n % 12;

  if (years === 0) return `${months} month${months === 1 ? "" : "s"}`;
  if (months === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years} years ${months} months`;
}

function getAdmissionAgeMonths(row) {
  return (
    row.admissionAgeMonths ||
    row.admission_age_months ||
    row.admissionAge ||
    ""
  );
}

function getCategoryOptionsForEdit(gender) {
  const g = String(gender || "").toLowerCase();

  if (g === "male") {
    return ["Male Calf", "Bull", "Ox / Bullock"];
  }

  if (g === "female") {
    return ["Female Calf", "Heifer", "Cow", "Milking Cow", "Dry Cow"];
  }

  return [
    "Calf",
    "Male Calf",
    "Female Calf",
    "Heifer",
    "Cow",
    "Milking Cow",
    "Dry Cow",
    "Bull",
    "Ox / Bullock",
  ];
}

function isBornAtGoshalaType(row) {
  const type = String(
    row.admissionType || row.admission_type || row.type_of_admission || ""
  ).toLowerCase();

  return type.includes("born") || type.includes("birth");
}

function calculateSmartAge(dob, admissionDate, admissionAgeRaw) {
  const now = new Date();

  const birthDate = parseFlexibleDate(dob);
  if (birthDate) {
    return calculateAgeBetweenDates(birthDate, now);
  }

  const admDate = parseFlexibleDate(admissionDate);
  const startAgeMonths = Number(String(admissionAgeRaw || "").replace(/[^0-9]/g, ""));

  if (admDate && startAgeMonths > 0) {
    const monthsSinceAdmission =
      (now.getFullYear() - admDate.getFullYear()) * 12 +
      (now.getMonth() - admDate.getMonth());

    return formatAgeFromMonths(startAgeMonths + monthsSinceAdmission) + " (Est)";
  }

  return "Unknown";
}

function calculateAgeBetweenDates(fromDate, toDate) {
  if (!fromDate || !toDate) return "-";

  let months =
    (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
    (toDate.getMonth() - fromDate.getMonth());

  if (toDate.getDate() < fromDate.getDate()) {
    months -= 1;
  }

  return formatAgeFromMonths(months);
}

function calculateAgeAtDate(dob, targetDate, admissionDate, admissionAgeRaw) {
  const target = parseFlexibleDate(targetDate);
  if (!target) return "-";

  const birthDate = parseFlexibleDate(dob);
  if (birthDate) {
    return calculateAgeBetweenDates(birthDate, target);
  }

  const admDate = parseFlexibleDate(admissionDate);
  const startAgeMonths = Number(String(admissionAgeRaw || "").replace(/[^0-9]/g, ""));

  if (admDate && startAgeMonths > 0) {
    const monthsSinceAdmission =
      (target.getFullYear() - admDate.getFullYear()) * 12 +
      (target.getMonth() - admDate.getMonth());

    return formatAgeFromMonths(startAgeMonths + monthsSinceAdmission);
  }

  return "-";
}





const EditInput = ({ label, name, value, onChange, type="text", options=[], placeholder="" }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {type === "select" ? (
      <select name={name} value={value||""} onChange={onChange} style={inputStyle}>
         {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} name={name} value={value||""} onChange={onChange} style={inputStyle} placeholder={placeholder} />
    )}
  </div>
);

const DetailItem = ({ label, value }) => { if(!value) return null; return <div><div style={labelItemStyle}>{label}</div><div style={{fontWeight:500, fontSize:"0.9rem"}}>{value}</div></div>; };
const SectionTitle = ({ children }) => <div style={sectionTitleStyle}>{children}</div>;
const TypePill = ({ type }) => {
  const t = String(type || "-").toLowerCase();

  let style = {
    background: "#eef2ff",
    color: "#3730a3",
  };

  if (t.includes("reactivated") || t.includes("reactivation")) {
    style = { background: "#dbeafe", color: "#1d4ed8" };
  } else if (t.includes("birth") || t.includes("born")) {
    style = { background: "#dcfce7", color: "#166534" };
  } else if (t.includes("sold") || t.includes("sale")) {
    style = { background: "#ffedd5", color: "#9a3412" };
  } else if (t.includes("transfer")) {
    style = { background: "#e0e7ff", color: "#3730a3" };
  } else if (t.includes("farmer")) {
    style = { background: "#fef3c7", color: "#92400e" };
  } else if (t.includes("death")) {
    style = { background: "#fee2e2", color: "#991b1b" };
  }

  return (
    <span
      style={{
        ...style,
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 800,
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
      }}
    >
      {type || "-"}
    </span>
  );
};

const StatusPill = ({ status }) => {
  const s = String(status || "").toLowerCase();

  let style = {
    background: "#e2e8f0",
    color: "#334155",
  };

  if (s === "active") style = { background: "#dcfce7", color: "#166534" };
  else if (s.includes("dead")) style = { background: "#fee2e2", color: "#991b1b" };
  else if (s.includes("sold")) style = { background: "#ffedd5", color: "#9a3412" };
  else if (s.includes("deactive")) style = { background: "#f1f5f9", color: "#475569" };

  return (
    <span
      style={{
        ...style,
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 800,
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {s === "active" ? "● " : ""}
      {status || "-"}
    </span>
  );
};
const formatDate = (v) => (!v || v==="-") ? "-" : new Date(v).toLocaleDateString('en-GB');

const cardStyle = { background: "#fff", borderRadius: "10px", padding: "0", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", overflow:"hidden", border:"1px solid #e5e7eb" };
const thStyle = {
  background: "#f8fafc",
  color: "#475569",
  fontSize: "0.75rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  padding: "12px",
  borderBottom: "2px solid #e2e8f0",
  textAlign: "left",
  position: "sticky",
  top: 0,
  zIndex: 2,
};
const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "middle",
};
const inputStyle = { padding: "0.5rem", border: "1px solid #ccc", borderRadius: "5px", width: "100%", boxSizing:"border-box" };
const filterInputStyle = {
  padding: "0.6rem 0.75rem",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  width: "100%",
  boxSizing: "border-box",
  background: "#fff",
  fontSize: "0.9rem",
  color: "#334155",
};
const searchBoxWrapStyle = {
  position: "relative",
  width: "100%",
};

const searchInputStyle = {
  ...filterInputStyle,
  paddingRight: "2.5rem",
};

const clearSearchBtnStyle = {
  position: "absolute",
  right: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  width: "22px",
  height: "22px",
  border: "none",
  borderRadius: "50%",
  background: "#e2e8f0",
  color: "#334155",
  fontSize: "14px",
  fontWeight: "bold",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10,
};

const clearFiltersBtnStyle = {
  padding: "0.6rem 0.75rem",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#fff",
  color: "#334155",
  fontSize: "0.85rem",
  fontWeight: "600",
  cursor: "pointer",
};
const primaryBtnStyle = { 
  background: "#2563eb", 
  color: "#fff", 
  padding: "10px 24px", 
  borderRadius: "6px", 
  textDecoration: "none", 
  fontSize:"0.9rem", 
  fontWeight:600, 
  display: "flex", 
  alignItems: "center", 
  gap: "6px", 
  minWidth: "140px", 
  justifyContent: "center",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
};
const menuBtnStyle = {
  width: "34px",
  height: "30px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  background: "#fff",
  cursor: "pointer",
  fontSize: "1.2rem",
  fontWeight: "700",
  color: "#334155",
};

const actionMenuStyle = {
  position: "absolute",
  top: "34px",
  right: "0",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  boxShadow: "0 10px 25px rgba(15,23,42,0.15)",
  minWidth: "180px",
  padding: "0.4rem",
  zIndex: 50,
};

const actionMenuItemStyle = {
  width: "100%",
  padding: "0.55rem 0.75rem",
  border: "none",
  background: "transparent",
  textAlign: "left",
  cursor: "pointer",
  borderRadius: "7px",
  fontSize: "0.85rem",
  fontWeight: "600",
  color: "#334155",
};
const viewBtnStyle = { background: "#eff6ff", color: "#1d4ed8", padding: "6px 10px", borderRadius: "5px", border: "1px solid #bfdbfe", cursor: "pointer", fontSize:"0.8rem", fontWeight:600 };
const certBtnStyle = { background: "#f0fdf4", color: "#15803d", padding: "6px 10px", borderRadius: "5px", border: "1px solid #bbf7d0", cursor: "pointer", fontSize:"0.8rem", fontWeight:600 };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 };
const modalContentStyle = { background: "#fff", width: "700px", maxWidth:"95%", padding: "1.5rem", borderRadius: "10px", maxHeight: "95vh", overflowY: "auto", display:"flex", flexDirection:"column" };
const scrollableAreaStyle = { overflowY: "auto", paddingRight: "0.5rem", flex: 1, marginTop: "0.5rem" };
const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" };
const labelStyle = { fontSize: "0.75rem", color: "#666", display: "block", marginBottom: "4px", fontWeight:600 };
const labelItemStyle = { fontSize: "0.7rem", color: "#94a3b8", fontWeight: "bold", textTransform: "uppercase" };
const sectionTitleStyle = { fontSize: "0.85rem", color: "#0369a1", fontWeight: "bold", borderBottom: "2px solid #e0f2fe", marginBottom: "12px", marginTop: "10px", paddingBottom: "5px", textTransform:"uppercase" };
const editBtnStyle = { background: "#f59e0b", color:"#fff", border:"none", padding:"6px 12px", borderRadius:"4px", cursor:"pointer", fontSize:"0.8rem", fontWeight:600 };
const saveBtnStyle = { background: "#16a34a", color:"#fff", border:"none", padding:"6px 12px", borderRadius:"4px", cursor:"pointer", fontSize:"0.8rem", fontWeight:600 };
const cancelBtnStyle = { background: "#fff", color:"#666", border:"1px solid #ccc", padding:"6px 12px", borderRadius:"4px", cursor:"pointer", fontSize:"0.8rem", fontWeight:600 };
const closeBtnStyle = { background: "none", border:"none", fontSize:"2rem", cursor:"pointer", color:"#9ca3af", lineHeight:1};
const paginationStyle = { display: "flex", justifyContent: "space-between", alignItems:"center", padding:"1rem", background:"#f8fafc", borderTop:"1px solid #e2e8f0" };
const pageBtnStyle = {
  padding: "4px 10px",
  border: "1px solid #cbd5e1",
  background: "#fff",
  cursor: "pointer",
  borderRadius: "6px",
  fontSize: "0.8rem",
};
const pageNumberStyle = { padding: "6px 10px", fontWeight:600, color:"#334155" };
const topPaginationStyle = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "0.5rem",
  marginBottom: "0.5rem",
};
const largePhotoContainerStyle = { width: "100%", height: "300px", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: "12px", border: "1px solid #e5e7eb", marginBottom: "1.5rem" };
const largePhotoStyle = { width: "100%", height: "100%", objectFit: "contain" };
const placeholderStyle = { display:"flex", alignItems:"center", justifyContent:"center", height:"100%", fontSize:"0.9rem", color:"#999", textAlign:"center", width:"100%" };
const filterPanelStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "1rem",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "140px 160px 160px 170px 1fr",
  gap: "0.75rem",
  alignItems: "center",
};

const filterActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "0.75rem",
};