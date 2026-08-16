import React, { useEffect, useMemo, useState } from "react";
import { getDeathRecords } from "../api/masterApi.js";

/* ============================================================
   DATE HELPERS
============================================================ */

function isoDateOnly(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  if (Object.prototype.toString.call(value) === "[object Date]") {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return String(value).slice(0, 10);
}

function formatDateDisplay(value) {
  if (!value) return "";

  const iso = isoDateOnly(value);
  const parts = iso.split("-");

  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return value;
}

function toDateObj(value) {
  if (!value) return null;

  const iso = isoDateOnly(value);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatAgeFromMonths(totalMonths) {
  const safeMonths = Math.max(
    0,
    Math.floor(
      Number(totalMonths) || 0
    )
  );

  const years =
    Math.floor(safeMonths / 12);

  const months =
    safeMonths % 12;

  if (years === 0 && months === 0) {
    return "Less than 1 month";
  }

  if (years === 0) {
    return `${months} month${
      months === 1 ? "" : "s"
    }`;
  }

  if (months === 0) {
    return `${years} year${
      years === 1 ? "" : "s"
    }`;
  }

  return `${years} year${
    years === 1 ? "" : "s"
  } ${months} month${
    months === 1 ? "" : "s"
  }`;
}

function completedMonthsBetween(
  fromDate,
  toDate
) {
  if (!fromDate || !toDate) {
    return 0;
  }

  let months =
    (toDate.getFullYear() -
      fromDate.getFullYear()) *
      12 +
    (toDate.getMonth() -
      fromDate.getMonth());

  if (
    toDate.getDate() <
    fromDate.getDate()
  ) {
    months -= 1;
  }

  return Math.max(0, months);
}

function calculateRecordedAgeAtDeath({
  dob,
  dateOfDeath,
  admissionDate,
  admissionAgeMonths,
}) {
  const deathDate =
    toDateObj(dateOfDeath);

  if (!deathDate) {
    return "Not available";
  }

  const birthDate =
    toDateObj(dob);

  if (birthDate) {
    return formatAgeFromMonths(
      completedMonthsBetween(
        birthDate,
        deathDate
      )
    );
  }

  const admittedOn =
    toDateObj(admissionDate);

  const startingAge =
    Number(
      String(
        admissionAgeMonths ?? ""
      ).replace(/[^0-9.]/g, "")
    );

  if (
    admittedOn &&
    Number.isFinite(startingAge)
  ) {
    const elapsedMonths =
      completedMonthsBetween(
        admittedOn,
        deathDate
      );

    return (
      formatAgeFromMonths(
        startingAge +
        elapsedMonths
      ) + " (estimated)"
    );
  }

  return "Not available";
}

function defaultFromDate() {
  const date = new Date();

  // Show the previous 18 months by default.
  date.setMonth(date.getMonth() - 18);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function todayIso() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* ============================================================
   VALUE HELPERS
============================================================ */

function firstValue(...values) {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
}

function displayValue(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === "" ||
    String(value).trim() === "-"
  ) {
    return "Not recorded";
  }

  return value;
}

function normalizeCauseCategory(value) {
  const category = String(value || "").trim();

  if (!category) return "Other";

  const lower = category.toLowerCase();

  if (
    lower === "disease" ||
    lower === "disease / illness" ||
    lower === "illness"
  ) {
    return "Disease";
  }

  if (lower === "old age" || lower === "oldage") {
    return "Old Age";
  }

  if (lower === "accident") {
    return "Accident";
  }

  if (
    lower === "natural calamity" ||
    lower === "naturalcalamity"
  ) {
    return "Natural Calamity";
  }

  if (lower === "natural") {
    return "Natural";
  }

  return category;
}

/* ============================================================
   BACKEND NORMALIZATION
============================================================ */

function normalizeRecord(record) {
  const dateOfDeath = isoDateOnly(
    firstValue(
      record.dateOfDeath,
      record.dateOfDeAdmission,
      record.exitDate,
      record.exit_date,
      record.date
    )
  );

  const dob = isoDateOnly(
  firstValue(
    record.dateOfBirth,
    record.dob
  )
);

const admissionDate = isoDateOnly(
  firstValue(
    record.admissionDate,
    record.admission_date
  )
);

const admissionAgeMonths =
  firstValue(
    record.admissionAgeMonths,
    record.admission_age_months
  );

const recordedAgeAtDeath =
  calculateRecordedAgeAtDeath({
    dob,
    dateOfDeath,
    admissionDate,
    admissionAgeMonths,
  });

  const causeCategory = normalizeCauseCategory(
    firstValue(
      record.causeCategory,
      record.category
    )
  );

  const causeDetails = firstValue(
    record.causeDetails,
    record.cause_details,
    record.specificCause
  );

  const combinedCause = firstValue(
    record.causeOfDeath,
    causeCategory && causeDetails
      ? `${causeCategory} - ${causeDetails}`
      : causeCategory || causeDetails
  );

  return {
    id: firstValue(
      record.exitId,
      record.exit_id,
      record.id
    ),

    internalId: firstValue(
      record.internalId,
      record.internal_id
    ),

    cattleId: firstValue(
      record.cattleId,
      record.tagNumber,
      record.tag_number,
      record.tagNo
    ),

    name: firstValue(record.name, "Unknown"),
    breed: firstValue(record.breed, "-"),
    gender: firstValue(record.gender, "-"),

    dob,
admissionDate,
admissionAgeMonths,
recordedAgeAtDeath,

    color: firstValue(
      record.color,
      record.colour
    ),

    shed: firstValue(
      record.shed,
      record.locationShed
    ),

    dateOfDeath,
    time: firstValue(
      record.time,
      record.exitTime,
      record.exit_time
    ),

    causeCategory,
    causeDetails,
    causeOfDeath: combinedCause,

    doctor: firstValue(
      record.doctor,
      record.doctorName,
      record.partyName,
      "-"
    ),

    teethDetails: firstValue(
      record.teethDetails,
      record.teeth
    ),

    teethAge: firstValue(
      record.teethAge,
      record.age
    ),

    pregnancyStatus: firstValue(
      record.pregnancyStatus,
      record.pregnancy
    ),

    marketValue: firstValue(
      record.marketValue,
      record.market_value
    ),

    remarks: firstValue(record.remarks),

    photoUrl: firstValue(
      record.photoUrl,
      record.photo_url,
      record.photo
    ),
  };
}

/* ============================================================
   PAGE
============================================================ */

export default function DeathRecords() {
  const [fromDate, setFromDate] = useState(defaultFromDate());
  const [toDate, setToDate] = useState(todayIso());

  const [searchText, setSearchText] = useState("");
  const [causeFilter, setCauseFilter] = useState("All");

  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 820
  );
  const [currentPage, setCurrentPage] = useState(1);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const response = await getDeathRecords(
        fromDate || "2024-01-01",
        toDate || ""
      );

      let rawData = [];

      if (Array.isArray(response)) {
        rawData = response;
      } else if (Array.isArray(response?.data)) {
        rawData = response.data;
      }

      setRows(rawData.map(normalizeRecord));
    } catch (err) {
      console.error("Mortality Register load failed:", err);

      setRows([]);
      setError(
        err?.message ||
          "Unable to load mortality records."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadData, 400);
    return () => window.clearTimeout(timer);
  }, [fromDate, toDate]);

  useEffect(() => {
    function handleResize() {
      setIsCompact(window.innerWidth <= 820);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const causeOptions = useMemo(() => {
    const unique = new Set();

    rows.forEach((row) => {
      if (row.causeCategory) {
        unique.add(row.causeCategory);
      }
    });

    return ["All", ...Array.from(unique).sort()];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return rows
      .filter((row) => {
        if (
          causeFilter !== "All" &&
          row.causeCategory !== causeFilter
        ) {
          return false;
        }

        if (!search) return true;

        const searchableText = [
          row.internalId,
          row.cattleId,
          row.name,
          row.breed,
          row.gender,
          row.shed,
          row.causeCategory,
          row.causeDetails,
          row.causeOfDeath,
          row.doctor,
          row.remarks,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(search);
      })
      .sort((a, b) => {
        const aDate = toDateObj(a.dateOfDeath)?.getTime() || 0;
        const bDate = toDateObj(b.dateOfDeath)?.getTime() || 0;

        return bDate - aDate;
      });
  }, [rows, searchText, causeFilter]);

  const metrics = useMemo(() => {
    const result = {
      total: filteredRows.length,
      disease: 0,
      oldAge: 0,
      accident: 0,
      other: 0,
    };

    filteredRows.forEach((row) => {
      const category = String(
        row.causeCategory || ""
      ).toLowerCase();

      if (
        category === "disease" ||
        category === "disease / illness" ||
        category === "illness"
      ) {
        result.disease += 1;
      } else if (
        category === "old age" ||
        category === "oldage"
      ) {
        result.oldAge += 1;
      } else if (category === "accident") {
        result.accident += 1;
      } else {
        result.other += 1;
      }
    });

    return result;
  }, [filteredRows]);

  const pageSize = isCompact ? 10 : 20;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, causeFilter, fromDate, toDate, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  function clearFilters() {
    setSearchText("");
    setCauseFilter("All");
    setFromDate(defaultFromDate());
    setToDate(todayIso());
  }

  function printCertificate(row) {
    const deathDate =
  formatDateDisplay(
    row.dateOfDeath
  );

const recordedAge =
  row.recordedAgeAtDeath ||
  calculateRecordedAgeAtDeath({
    dob: row.dob,
    dateOfDeath: row.dateOfDeath,
    admissionDate:
      row.admissionDate,
    admissionAgeMonths:
      row.admissionAgeMonths,
  });

    const html = `
      <html>
        <head>
          <title>Death Certificate - ${row.name}</title>

          <style>
            body {
              font-family: "Times New Roman", serif;
              padding: 20px;
              text-align: center;
            }

            .container {
              border: 3px solid #000;
              padding: 15px;
              max-width: 800px;
              margin: 0 auto;
              box-sizing: border-box;
            }

            .header h1 {
              font-size: 22px;
              font-weight: 800;
              margin: 0;
              text-decoration: underline;
            }

            .header h2 {
              font-size: 16px;
              font-weight: 700;
              margin: 5px 0;
            }

            .certificate-title {
              border: 2px solid #000;
              padding: 6px;
              font-size: 18px;
              font-weight: 800;
              width: 100%;
              margin-top: 10px;
              background: #eeeeee;
              box-sizing: border-box;
            }

            .photo-box {
              width: 100%;
              height: 250px;
              border: 2px solid #000;
              margin: 15px 0;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #fafafa;
              overflow: hidden;
              box-sizing: border-box;
            }

            .photo-box img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              border: 2px solid #000;
            }

            td {
              border: 1px solid #000;
              padding: 8px 10px;
              text-align: left;
              width: 50%;
              font-size: 14px;
              vertical-align: middle;
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

            .certification-text {
              text-align: left;
              margin: 20px 0;
              font-size: 14px;
              line-height: 1.6;
              font-weight: 700;
            }

            .footer {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              padding: 0 10px;
              align-items: flex-end;
            }

            .signature-box {
              text-align: center;
              margin-bottom: 10px;
            }

            .signature-line {
              width: 160px;
              border-bottom: 1px solid #000;
              margin-bottom: 5px;
            }

            .signature-label {
              font-weight: 700;
              font-size: 11px;
              text-transform: uppercase;
            }

            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }

              body {
                padding: 0;
              }
            }
          </style>
        </head>

        <body>
          <div class="container">
            <div class="header">
              <h1>MADHAVA SRUSTI RASHTROTTHANA GOSHALA</h1>
              <h2>SS GHATI DODDABALLAPURA</h2>
              <div class="certificate-title">
                DEATH CERTIFICATE
              </div>
            </div>

            <div class="photo-box">
              ${
                row.photoUrl
                  ? `<img src="${row.photoUrl}" alt="Cattle Photo" />`
                  : `<div>[ Photo Not Provided ]</div>`
              }
            </div>

            <table>
              <tr>
                <td>
                  <span class="label">Date of Death:</span>
                  <span class="value">${deathDate || "-"}</span>
                </td>

                <td>
                  <span class="label">Time:</span>
                  <span class="value">${row.time || "-"}</span>
                </td>
              </tr>

              <tr>
                <td>
                  <span class="label">Name:</span>
                  <span class="value">${row.name || "-"}</span>
                </td>

                <td>
                  <span class="label">Ear Tag No:</span>
                  <span class="value">${row.cattleId || "-"}</span>
                </td>
              </tr>

              <tr>
                <td>
                  <span class="label">Breed:</span>
                  <span class="value">${row.breed || "-"}</span>
                </td>

                <td>
                  <span class="label">Gender:</span>
                  <span class="value">${row.gender || "-"}</span>
                </td>
              </tr>

              <tr>
                <td>
                  <span class="label">Age:</span>
<span class="value">${recordedAge || "Not available"}</span>
                </td>

                <td>
                  <span class="label">Colour:</span>
                  <span class="value">${row.color || "-"}</span>
                </td>
              </tr>

              <tr>
                <td>
                  <span class="label">Teeth Details:</span>
                  <span class="value">${row.teethDetails || "-"}</span>
                </td>

                <td>
                  <span class="label">Age by Teeth:</span>
                  <span class="value">${row.teethAge || "-"}</span>
                </td>
              </tr>

              <tr>
                <td>
                  <span class="label">Pregnancy:</span>
                  <span class="value">${row.pregnancyStatus || "-"}</span>
                </td>

                <td>
                  <span class="label">Market Value:</span>
                  <span class="value">${row.marketValue || "-"}</span>
                </td>
              </tr>

              <tr>
                <td colspan="2">
                  <span class="label">Reason for Death:</span>
                  <span class="value">${row.causeOfDeath || "-"}</span>
                </td>
              </tr>
            </table>

            <div class="certification-text">
              THIS IS TO CERTIFY THAT THE ABOVE CATTLE WAS EXAMINED
              AND THE DEATH DETAILS WERE RECORDED.
            </div>

            <div class="footer">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">
                  Supervisor Signature
                </div>
              </div>

              <div class="signature-box">
                <div style="font-size:12px;font-weight:bold;margin-bottom:5px;">
                  ${row.doctor && row.doctor !== "-" ? row.doctor : ""}
                </div>

                <div class="signature-line"></div>

                <div class="signature-label">
                  Doctor Signature & Seal
                </div>
              </div>

              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">
                  Project Manager Signature
                </div>
              </div>
            </div>
          </div>

          <script>
            setTimeout(function () {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=1100"
    );

    if (!printWindow) {
      window.alert(
        "Popup blocked. Please allow popups for this site."
      );
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
  }

  return (
    <div style={{ ...pageStyle, ...(isCompact ? compactPageStyle : {}) }}>
      {/* PAGE HEADER */}
      <div style={{ ...pageHeaderStyle, ...(isCompact ? compactHeaderStyle : {}) }}>
        <div>
          <div style={eyebrowStyle}>Veterinary</div>

          <h1 style={pageTitleStyle}>
            Mortality Register
          </h1>

          <p style={pageSubtitleStyle}>
            Review cattle deaths, causes, veterinary details and
            certificates.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          style={{
            ...refreshButtonStyle,
            ...(isCompact ? compactFullButtonStyle : {}),
            opacity: loading ? 0.65 : 1,
          }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* KPI CARDS */}
      <div style={{ ...metricsGridStyle, ...(isCompact ? compactMetricsGridStyle : {}) }}>
        <MetricCard
          label="Total Deaths"
          value={metrics.total}
          helper="Current filtered records"
          style={isCompact ? compactTotalMetricStyle : undefined}
        />

        <MetricCard
          label="Disease"
          value={metrics.disease}
          helper="Disease or illness"
        />

        <MetricCard
          label="Old Age"
          value={metrics.oldAge}
          helper="Age-related deaths"
        />

        <MetricCard
          label="Accident"
          value={metrics.accident}
          helper="Accidental deaths"
        />

        <MetricCard
          label="Other Causes"
          value={metrics.other}
          helper="Natural and other causes"
        />
      </div>

      {/* FILTER CARD */}
      <div style={filterCardStyle}>
        <div style={{ ...filterGridStyle, ...(isCompact ? compactFilterGridStyle : {}) }}>
          <div style={{ gridColumn: isCompact ? "auto" : "span 2" }}>
            <label style={labelStyle}>
              Search
            </label>

            <input
              type="text"
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
              placeholder="Search tag, name, breed, cause, doctor, shed or internal ID"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Cause
            </label>

            <select
              value={causeFilter}
              onChange={(event) =>
                setCauseFilter(event.target.value)
              }
              style={inputStyle}
            >
              {causeOptions.map((cause) => (
                <option key={cause} value={cause}>
                  {cause}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>
              From
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(event.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              To
            </label>

            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(event.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div style={{ ...filterActionStyle, ...(isCompact ? compactFilterActionStyle : {}) }}>
            <button
              type="button"
              onClick={clearFilters}
              style={{ ...clearButtonStyle, ...(isCompact ? compactFullButtonStyle : {}) }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      {/* RESPONSIVE REGISTER */}
      <div style={tableCardStyle}>
        <div style={{ ...tableSummaryStyle, ...(isCompact ? compactSummaryStyle : {}) }}>
          <div>
            <strong>{filteredRows.length}</strong>{" "}
            mortality record(s)
          </div>

          <div style={tableHintStyle}>
            Click a row to view complete details
          </div>
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredRows.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          compact={isCompact}
        />

        {isCompact ? (
          <div style={mobileCardsStyle}>
            {loading ? (
              <div style={emptyStateStyle}>Loading mortality records...</div>
            ) : filteredRows.length === 0 ? (
              <div style={emptyStateStyle}>No mortality records found for the selected filters.</div>
            ) : pagedRows.map((row, index) => (
              <article
                key={row.id || `${row.internalId}-${row.dateOfDeath}-${index}`}
                style={mobileRecordCardStyle}
              >
                <div style={mobileCardHeaderStyle}>
                  <div>
                    <div style={mobileFieldLabelStyle}>Death Date</div>
                    <strong>{formatDateDisplay(row.dateOfDeath)}</strong>
                  </div>
                  <CauseBadge value={row.causeCategory} />
                </div>
                <div style={mobileCardTitleStyle}>{row.cattleId || "-"} | {row.name}</div>
                <div style={mobileDetailsGridStyle}>
                  <MobileField label="Breed" value={displayValue(row.breed)} />
                  <MobileField label="Gender" value={displayValue(row.gender)} />
                  <MobileField label="Shed" value={displayValue(row.shed)} />
                  <MobileField label="Doctor" value={displayValue(row.doctor)} />
                </div>
                <div style={mobileCauseStyle}>
                  <span style={mobileFieldLabelStyle}>Cause</span>
                  <span>{displayValue(row.causeOfDeath)}</span>
                </div>
                <div style={mobileActionsStyle}>
                  <button type="button" onClick={() => setSelected(row)} style={secondaryButtonStyle}>View</button>
                  <button type="button" onClick={() => printCertificate(row)} style={certificateButtonStyle}>Certificate</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
        <div style={tableScrollStyle}>
          <table style={tableStyle}>
            <thead style={tableHeadStyle}>
              <tr>
                <th style={thStyle}>Death Date</th>
                <th style={thStyle}>Tag Number</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Breed</th>
                <th style={thStyle}>Gender</th>
                <th style={thStyle}>Cause</th>
                <th style={thStyle}>Doctor</th>
                <th style={{ ...thStyle, textAlign: "center" }}>
                  Certificate
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={emptyStateStyle}>
                    Loading mortality records...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={emptyStateStyle}>
                    No mortality records found for the selected
                    filters.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row, index) => (
                  <tr
                    key={
                      row.id ||
                      `${row.internalId}-${row.dateOfDeath}-${index}`
                    }
                    onClick={() => setSelected(row)}
                    style={{
                      ...tableRowStyle,
                      background:
                        index % 2 === 0
                          ? "#ffffff"
                          : "#f8fafc",
                    }}
                  >
                    <td style={tdStyle}>
                      {formatDateDisplay(row.dateOfDeath)}
                    </td>

                    <td style={tdStyle}>
                      <strong>{row.cattleId || "-"}</strong>
                    </td>

                    <td style={tdStyle}>
                      {row.name}
                    </td>

                    <td style={tdStyle}>
                      {displayValue(row.breed)}
                    </td>

                    <td style={tdStyle}>
                      <GenderText value={row.gender} />
                    </td>

                    <td style={tdStyle}>
                      <CauseBadge
                        value={row.causeCategory}
                      />
                    </td>

                    <td style={tdStyle}>
                      {displayValue(row.doctor)}
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
                          printCertificate(row);
                        }}
                        style={certificateButtonStyle}
                      >
                        Certificate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredRows.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          compact={isCompact}
        />
      </div>

      {/* DETAILS MODAL */}
      {selected && (
        <div
          style={{ ...overlayStyle, ...(isCompact ? compactOverlayStyle : {}) }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ ...modalStyle, ...(isCompact ? compactModalStyle : {}) }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ ...modalHeaderStyle, ...(isCompact ? compactModalHeaderStyle : {}) }}>
              <div>
                <div style={modalEyebrowStyle}>
                  Mortality Record
                </div>

                <h2 style={modalTitleStyle}>
                  {selected.cattleId || "No Tag"}
                  {" | "}
                  {selected.name || "Unknown"}
                </h2>

                <div style={modalSubTitleStyle}>
                  {displayValue(selected.breed)}
                  {" • "}
                  {displayValue(selected.gender)}
                  {" • "}
                  {displayValue(selected.internalId)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                style={closeButtonStyle}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div style={{ ...modalBodyStyle, ...(isCompact ? compactModalBodyStyle : {}) }}>
              <section style={sectionCardStyle}>
                <SectionTitle>
                  Animal Information
                </SectionTitle>

                <div style={detailsGridStyle}>
                  <DetailItem
                    label="Internal ID"
                    value={selected.internalId}
                  />

                  <DetailItem
                    label="Tag Number"
                    value={selected.cattleId}
                  />

                  <DetailItem
                    label="Name"
                    value={selected.name}
                  />

                  <DetailItem
                    label="Breed"
                    value={selected.breed}
                  />

                  <DetailItem
                    label="Gender"
                    value={selected.gender}
                  />

                  <DetailItem
                    label="Colour"
                    value={selected.color}
                  />

                  <DetailItem
                    label="Date of Birth"
                    value={
                      selected.dob
                        ? formatDateDisplay(selected.dob)
                        : ""
                    }
                  />

                  <DetailItem
                    label="Shed"
                    value={selected.shed}
                  />
                </div>
              </section>

              <section style={sectionCardStyle}>
                <SectionTitle>
                  Death Information
                </SectionTitle>

                <div style={detailsGridStyle}>
                  <DetailItem
                    label="Date of Death"
                    value={formatDateDisplay(
                      selected.dateOfDeath
                    )}
                  />

                  <DetailItem
                    label="Time of Death"
                    value={selected.time}
                  />

                  <DetailItem
                    label="Cause Category"
                    value={selected.causeCategory}
                  />

                  <DetailItem
                    label="Specific Cause"
                    value={selected.causeDetails}
                  />

                  <DetailItem
                    label="Certified By"
                    value={selected.doctor}
                    fullWidth
                  />
                </div>
              </section>

              <section style={sectionCardStyle}>
                <SectionTitle>
                  Certificate Details
                </SectionTitle>

                <div style={detailsGridStyle}>
  <DetailItem
    label="Recorded Age at Death"
    value={
      selected.recordedAgeAtDeath
    }
  />

  <DetailItem
  label="Age by Teeth"
  value={selected.teethAge}
/>

                  <DetailItem
                    label="Pregnancy Status"
                    value={selected.pregnancyStatus}
                  />

                  <DetailItem
                    label="Market Value"
                    value={
                      selected.marketValue
                        ? `₹${selected.marketValue}`
                        : ""
                    }
                  />
                </div>
              </section>

              <section style={sectionCardStyle}>
                <SectionTitle>
                  Photo and Remarks
                </SectionTitle>

                <div style={{ ...photoRemarksGridStyle, ...(isCompact ? compactPhotoRemarksGridStyle : {}) }}>
                  <div style={photoBoxStyle}>
                    {selected.photoUrl ? (
                      <img
                        src={selected.photoUrl}
                        alt={selected.name}
                        style={photoStyle}
                      />
                    ) : (
                      <div style={noPhotoStyle}>
                        No photo available
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={remarksLabelStyle}>
                      Remarks
                    </div>

                    <div style={remarksBoxStyle}>
                      {displayValue(selected.remarks)}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div style={{ ...modalFooterStyle, ...(isCompact ? compactModalFooterStyle : {}) }}>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={secondaryButtonStyle}
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => printCertificate(selected)}
                style={primaryButtonStyle}
              >
                Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function MetricCard({ label, value, helper, style }) {
  return (
    <div style={{ ...metricCardStyle, ...style }}>
      <div style={metricLabelStyle}>
        {label}
      </div>

      <div style={metricValueStyle}>
        {value}
      </div>

      <div style={metricHelperStyle}>
        {helper}
      </div>
    </div>
  );
}

function MobileField({ label, value }) {
  return (
    <div>
      <div style={mobileFieldLabelStyle}>{label}</div>
      <div style={mobileFieldValueStyle}>{value}</div>
    </div>
  );
}

function PaginationBar({ currentPage, totalPages, totalRecords, pageSize, onPageChange, compact }) {
  if (totalRecords === 0) return null;
  const first = (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, totalRecords);
  return (
    <div style={{ ...paginationStyle, ...(compact ? compactPaginationStyle : {}) }}>
      <div>Records: {first}-{last} of {totalRecords} | Page {currentPage} of {totalPages}</div>
      <div style={paginationButtonsStyle}>
        <button type="button" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} style={{ ...pageButtonStyle, opacity: currentPage === 1 ? 0.45 : 1 }}>Prev</button>
        <button type="button" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} style={{ ...pageButtonStyle, opacity: currentPage === totalPages ? 0.45 : 1 }}>Next</button>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={sectionTitleStyle}>
      {children}
    </div>
  );
}

function DetailItem({ label, value, fullWidth = false }) {
  const hasValue =
    value !== null &&
    value !== undefined &&
    String(value).trim() !== "" &&
    String(value).trim() !== "-";

  return (
    <div
      style={{
        ...detailItemStyle,
        gridColumn: fullWidth ? "1 / -1" : "auto",
      }}
    >
      <div style={detailLabelStyle}>
        {label}
      </div>

      <div
        style={{
          ...detailValueStyle,
          color: hasValue ? "#0f172a" : "#94a3b8",
          fontStyle: hasValue ? "normal" : "italic",
        }}
      >
        {hasValue ? value : "Not recorded"}
      </div>
    </div>
  );
}

function CauseBadge({ value }) {
  const category = normalizeCauseCategory(value);

  let style = causeOtherStyle;

  if (category === "Disease") {
    style = causeDiseaseStyle;
  } else if (category === "Old Age") {
    style = causeOldAgeStyle;
  } else if (category === "Accident") {
    style = causeAccidentStyle;
  }

  return (
    <span style={{ ...causeBadgeBaseStyle, ...style }}>
      {category || "Other"}
    </span>
  );
}

function GenderText({ value }) {
  const normalized = String(value || "").toLowerCase();

  const color =
    normalized === "female"
      ? "#be185d"
      : normalized === "male"
        ? "#1d4ed8"
        : "#475569";

  return (
    <span style={{ color, fontWeight: 600 }}>
      {displayValue(value)}
    </span>
  );
}

/* ============================================================
   STYLES
============================================================ */

const pageStyle = {
  width: "100%",
  maxWidth: "1500px",
  margin: "0 auto",
  padding: "1.5rem 2rem",
  boxSizing: "border-box",
};

const pageHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "1rem",
  marginBottom: "1.25rem",
  flexWrap: "wrap",
};

const eyebrowStyle = {
  color: "#ea580c",
  fontSize: "0.75rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "0.25rem",
};

const pageTitleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "1.75rem",
  fontWeight: 750,
};

const pageSubtitleStyle = {
  margin: "0.35rem 0 0",
  color: "#64748b",
  fontSize: "0.9rem",
};

const refreshButtonStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#334155",
  padding: "0.55rem 1rem",
  cursor: "pointer",
  fontWeight: 650,
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
  gap: "0.9rem",
  marginBottom: "1rem",
};

const metricCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "1rem",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
};

const metricLabelStyle = {
  color: "#64748b",
  fontSize: "0.76rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  fontWeight: 700,
};

const metricValueStyle = {
  color: "#0f172a",
  fontSize: "1.8rem",
  lineHeight: 1.2,
  fontWeight: 750,
  marginTop: "0.3rem",
};

const metricHelperStyle = {
  color: "#94a3b8",
  fontSize: "0.75rem",
  marginTop: "0.3rem",
};

const filterCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "1rem",
  marginBottom: "1rem",
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(240px, 2fr) minmax(150px, 1fr) repeat(2, minmax(140px, 0.8fr)) auto",
  gap: "0.75rem",
  alignItems: "end",
};

const labelStyle = {
  display: "block",
  marginBottom: "0.3rem",
  color: "#475569",
  fontSize: "0.75rem",
  fontWeight: 650,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  padding: "0.55rem 0.65rem",
  color: "#0f172a",
  background: "#ffffff",
  fontSize: "0.86rem",
};

const filterActionStyle = {
  display: "flex",
  alignItems: "flex-end",
};

const clearButtonStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  background: "#f8fafc",
  color: "#475569",
  padding: "0.55rem 0.85rem",
  cursor: "pointer",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const errorStyle = {
  marginBottom: "1rem",
  padding: "0.75rem 1rem",
  borderRadius: "8px",
  background: "#fef2f2",
  color: "#991b1b",
  border: "1px solid #fecaca",
};

const tableCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  overflow: "hidden",
};

const tableSummaryStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  alignItems: "center",
  padding: "0.8rem 1rem",
  borderBottom: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: "0.85rem",
};

const tableHintStyle = {
  color: "#94a3b8",
  fontSize: "0.78rem",
};

const tableScrollStyle = {
  overflowX: "auto",
  overflowY: "auto",
  maxHeight: "calc(100vh - 410px)",
  minHeight: "300px",
};

const tableStyle = {
  width: "100%",
  minWidth: "1050px",
  borderCollapse: "collapse",
  fontSize: "0.86rem",
};

const tableHeadStyle = {
  position: "sticky",
  top: 0,
  zIndex: 5,
  background: "#f8fafc",
};

const thStyle = {
  padding: "0.75rem 1rem",
  color: "#64748b",
  fontSize: "0.72rem",
  fontWeight: 700,
  textAlign: "left",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  borderBottom: "1px solid #cbd5e1",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "0.75rem 1rem",
  color: "#334155",
  borderBottom: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
};

const tableRowStyle = {
  cursor: "pointer",
};

const emptyStateStyle = {
  padding: "3rem 1rem",
  textAlign: "center",
  color: "#94a3b8",
};

const certificateButtonStyle = {
  border: "1px solid #fed7aa",
  borderRadius: "6px",
  background: "#fff7ed",
  color: "#c2410c",
  padding: "0.35rem 0.65rem",
  cursor: "pointer",
  fontWeight: 650,
};

const causeBadgeBaseStyle = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "0.2rem 0.55rem",
  fontSize: "0.74rem",
  fontWeight: 700,
};

const causeDiseaseStyle = {
  background: "#fee2e2",
  color: "#991b1b",
};

const causeOldAgeStyle = {
  background: "#f1f5f9",
  color: "#475569",
};

const causeAccidentStyle = {
  background: "#ffedd5",
  color: "#9a3412",
};

const causeOtherStyle = {
  background: "#fef3c7",
  color: "#92400e",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1200,
  background: "rgba(15, 23, 42, 0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
};

const modalStyle = {
  width: "920px",
  maxWidth: "100%",
  maxHeight: "92vh",
  background: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 25px 60px rgba(15, 23, 42, 0.35)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "1rem",
  padding: "1.25rem 1.5rem",
  borderBottom: "1px solid #e2e8f0",
};

const modalEyebrowStyle = {
  color: "#ea580c",
  fontSize: "0.72rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const modalTitleStyle = {
  margin: "0.25rem 0 0",
  color: "#0f172a",
  fontSize: "1.3rem",
};

const modalSubTitleStyle = {
  marginTop: "0.35rem",
  color: "#64748b",
  fontSize: "0.85rem",
};

const closeButtonStyle = {
  width: "34px",
  height: "34px",
  border: "none",
  borderRadius: "50%",
  background: "#f1f5f9",
  color: "#475569",
  cursor: "pointer",
  fontSize: "1.35rem",
  lineHeight: 1,
};

const modalBodyStyle = {
  padding: "1rem 1.5rem",
  overflowY: "auto",
  background: "#f8fafc",
};

const sectionCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "9px",
  padding: "1rem",
  marginBottom: "0.9rem",
};

const sectionTitleStyle = {
  color: "#334155",
  fontSize: "0.82rem",
  fontWeight: 750,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: "0.85rem",
  paddingBottom: "0.55rem",
  borderBottom: "1px solid #e2e8f0",
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "1rem",
};

const detailItemStyle = {
  minWidth: 0,
};

const detailLabelStyle = {
  color: "#94a3b8",
  fontSize: "0.68rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  marginBottom: "0.25rem",
};

const detailValueStyle = {
  fontSize: "0.88rem",
  fontWeight: 600,
  wordBreak: "break-word",
};

const photoRemarksGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(260px, 0.8fr) minmax(280px, 1.2fr)",
  gap: "1rem",
};

const photoBoxStyle = {
  height: "230px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const photoStyle = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
};

const noPhotoStyle = {
  color: "#94a3b8",
  fontStyle: "italic",
};

const remarksLabelStyle = {
  color: "#64748b",
  fontSize: "0.75rem",
  fontWeight: 700,
  marginBottom: "0.4rem",
};

const remarksBoxStyle = {
  minHeight: "120px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  background: "#f8fafc",
  padding: "0.75rem",
  color: "#475569",
  fontSize: "0.86rem",
  lineHeight: 1.5,
};

const modalFooterStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.75rem",
  padding: "1rem 1.5rem",
  borderTop: "1px solid #e2e8f0",
  background: "#ffffff",
};

const secondaryButtonStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#475569",
  padding: "0.55rem 1rem",
  cursor: "pointer",
  fontWeight: 650,
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "7px",
  background: "#ea580c",
  color: "#ffffff",
  padding: "0.55rem 1rem",
  cursor: "pointer",
  fontWeight: 650,
};

const compactPageStyle = { padding: "1rem", overflowX: "hidden" };
const compactHeaderStyle = { display: "block" };
const compactFullButtonStyle = { width: "100%", justifyContent: "center" };
const compactMetricsGridStyle = { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.65rem" };
const compactTotalMetricStyle = { gridColumn: "1 / -1" };
const compactFilterGridStyle = { gridTemplateColumns: "1fr" };
const compactFilterActionStyle = { display: "block" };
const compactSummaryStyle = { alignItems: "flex-start", flexDirection: "column", gap: "0.25rem" };

const paginationStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem",
  padding: "0.7rem 1rem", color: "#64748b", fontSize: "0.78rem", borderBottom: "1px solid #e2e8f0",
};
const compactPaginationStyle = { flexWrap: "wrap", padding: "0.7rem" };
const paginationButtonsStyle = { display: "flex", gap: "0.5rem", marginLeft: "auto" };
const pageButtonStyle = {
  border: "1px solid #cbd5e1", borderRadius: "7px", background: "#ffffff", color: "#334155",
  padding: "0.45rem 0.7rem", fontWeight: 650, cursor: "pointer",
};

const mobileCardsStyle = { padding: "0.7rem", display: "grid", gap: "0.7rem", background: "#f8fafc" };
const mobileRecordCardStyle = {
  border: "1px solid #e2e8f0", borderRadius: "10px", background: "#ffffff", padding: "0.85rem",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)", minWidth: 0,
};
const mobileCardHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.6rem" };
const mobileCardTitleStyle = { margin: "0.65rem 0", paddingBottom: "0.55rem", borderBottom: "1px solid #e2e8f0", color: "#0f172a", fontWeight: 750, wordBreak: "break-word" };
const mobileDetailsGridStyle = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.7rem" };
const mobileFieldLabelStyle = { color: "#64748b", fontSize: "0.65rem", fontWeight: 750, textTransform: "uppercase", letterSpacing: "0.03em" };
const mobileFieldValueStyle = { color: "#0f172a", fontSize: "0.8rem", fontWeight: 650, marginTop: "0.15rem", wordBreak: "break-word" };
const mobileCauseStyle = { display: "grid", gap: "0.2rem", marginTop: "0.75rem", paddingTop: "0.65rem", borderTop: "1px solid #e2e8f0", color: "#334155", fontSize: "0.8rem" };
const mobileActionsStyle = { display: "flex", justifyContent: "flex-end", gap: "0.55rem", marginTop: "0.8rem" };

const compactOverlayStyle = { padding: 0, alignItems: "stretch" };
const compactModalStyle = { width: "100%", maxWidth: "none", height: "100dvh", maxHeight: "100dvh", borderRadius: 0 };
const compactModalHeaderStyle = { padding: "0.85rem 1rem" };
const compactModalBodyStyle = { padding: "0.75rem", overscrollBehavior: "contain" };
const compactModalFooterStyle = { padding: "0.75rem", position: "sticky", bottom: 0 };
const compactPhotoRemarksGridStyle = { gridTemplateColumns: "1fr" };
