// src/pages/CertificatesReports.jsx
import React, { useState, useRef } from "react";
import { fetchBirthReport } from "../api/masterApi";

/** Helper: parse "dd-MM-yyyy" into Date (or null if invalid) */
function parseDdMmYyyy(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map((p) => Number(p));
  if (!d || !m || !y) return null;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}

export default function CertificatesReports() {
  // Which certificate modal is open: 'birth' | 'death' | 'incoming' | 'dattu' | null
  const [openCertModal, setOpenCertModal] = useState(null);

  // Which report filter modal is open: reportId or null
  const [openReportFilter, setOpenReportFilter] = useState(null);

  // Current report being displayed + rows
  const [currentReportId, setCurrentReportId] = useState(null);
  const [currentReportTitle, setCurrentReportTitle] = useState("");
  const [reportRows, setReportRows] = useState([]);

  // Generic filter state (used by the modal)
  const [filter, setFilter] = useState({
    fromDate: "",
    toDate: "",
    extra: "",
  });

  // Loading + error for current report (mainly used for Birth Report)
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ref for the current report table (used by Print / PDF)
  const tableRef = useRef(null);

  // Report config (columns + sample rows)
  const REPORT_CONFIG = {
    birth: {
      id: "birth",
      title: "Date-wise Birth Report",
      columns: [
        "Date",
        "Time",
        "Name",
        "Breed",
        "Gender",
        "Colour",
        "Mother cow breed",
        "Mother ear tag number",
        "Father bull breed",
        "Father ear tag number",
      ],
      // sampleRows are kept only as fallback, not used normally
      sampleRows: [],
    },
    death: {
      id: "death",
      title: "Date-wise Death Report",
      columns: [
        "Date",
        "Animal ID",
        "Tag No",
        "Name",
        "Breed",
        "Age (yrs)",
        "Cause",
      ],
      sampleRows: [
        ["2025-01-03", "A-501001", "650201", "Gouri", "Hallikar", "9", "Old age"],
      ],
    },
    sales: {
      id: "sales",
      title: "Cattle Sales Report",
      columns: [
        "Sale Date",
        "Animal ID",
        "Tag No",
        "Name",
        "Buyer Name",
        "Amount",
        "Mode",
      ],
      sampleRows: [
        [
          "2025-01-10",
          "A-601010",
          "680101",
          "Surabhi",
          "Shree Dairy",
          "45000",
          "NEFT",
        ],
      ],
    },
    incoming: {
      id: "incoming",
      title: "Incoming Cattle Report",
      columns: [
        "Date",
        "Animal ID",
        "Tag No",
        "Name",
        "Breed",
        "Source",
        "Type",
      ],
      sampleRows: [
        [
          "2025-01-01",
          "A-700900",
          "690101",
          "Kamala",
          "Hallikar",
          "Chamarajanagar Farmer",
          "Purchase",
        ],
      ],
    },
    dattu: {
      id: "dattu",
      title: "Dattu Yojana Report",
      columns: [
        "Date",
        "Adopter Name",
        "Cattle Tag",
        "Cattle Name",
        "Breed",
        "Amount",
        "Type",
      ],
      sampleRows: [
        [
          "2025-01-04",
          "Smt. Meera Rao",
          "631228",
          "Vasundara",
          "Hallikar",
          "25000",
          "Shashwatha Dattu",
        ],
      ],
    },
    milk: {
      id: "milk",
      title: "Daily Milk Yield Report",
      columns: ["Date", "Shed", "Morning (L)", "Evening (L)", "Total (L)"],
      sampleRows: [
        ["2025-01-01", "Punyakoti", "120", "100", "220"],
        ["2025-01-02", "Punyakoti", "125", "105", "230"],
      ],
    },
    byproducts: {
      id: "byproducts",
      title: "Outgoing By-products Report",
      columns: ["Date", "Item", "Quantity", "Unit", "Receiver / Purpose"],
      sampleRows: [
        ["2025-01-02", "Gomaya cakes", "200", "Nos", "Temple supply"],
        ["2025-01-03", "Gomutra", "50", "L", "Medicinal unit"],
      ],
    },
  };

  /** Open a non-birth report using static sample rows for now */
  function openReport(id) {
    const cfg = REPORT_CONFIG[id];
    if (!cfg) return;
    setCurrentReportId(id);
    setCurrentReportTitle(cfg.title);
    setReportRows(cfg.sampleRows || []);
    setErrorMsg("");
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  }

  function resetFilter() {
    setFilter({ fromDate: "", toDate: "", extra: "" });
  }

  /** Apply filters for Birth Report on the client side */
  function applyBirthFilters(allRows, filterState) {
    let rows = Array.isArray(allRows) ? [...allRows] : [];

    const { fromDate, toDate, extra } = filterState;
    let from = fromDate ? new Date(fromDate) : null;
    let to = toDate ? new Date(toDate) : null;
    if (to) {
      // include entire 'to' day
      to.setHours(23, 59, 59, 999);
    }

    rows = rows.filter((row) => {
      const d = parseDdMmYyyy(row[0]); // first col is "dd-MM-yyyy"
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });

    if (extra) {
      const term = extra.toLowerCase();
      // Breed is column index 3 in our array
      rows = rows.filter((row) =>
        String(row[3] || "").toLowerCase().includes(term)
      );
    }

    return rows;
  }

  /** Load Birth Report from Apps Script + apply filters */
  async function loadBirthReportWithFilters(filterState) {
    setLoading(true);
    setErrorMsg("");
    setCurrentReportId("birth");
    setCurrentReportTitle(REPORT_CONFIG.birth.title);

    try {
      const allRows = await fetchBirthReport(); // array of arrays from backend
      const filtered = applyBirthFilters(allRows, filterState);

      setReportRows(filtered);
      // No error if there are simply no records; table will show the empty message
    } catch (err) {
      console.error("Birth report error:", err);
      setReportRows([]);
      setErrorMsg(
        "Unable to load Birth Report from Google Sheets. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /** When user clicks "Apply Filters" in the modal */
  async function handleReportFilterSubmit(e) {
    e.preventDefault();
    if (!openReportFilter) return;

    const id = openReportFilter;
    setOpenReportFilter(null);

    if (id === "birth") {
      // Real data from Google Sheets
      await loadBirthReportWithFilters(filter);
    } else {
      // Other reports still use local sample data
      openReport(id);
    }
  }

  // Helper for report filter label
  function reportFilterTitle(id) {
    switch (id) {
      case "birth":
        return "Birth Report Filters";
      case "death":
        return "Death Report Filters";
      case "sales":
        return "Cattle Sales Report Filters";
      case "incoming":
        return "Incoming Cattle Report Filters";
      case "dattu":
        return "Dattu Yojana Report Filters";
      case "milk":
        return "Daily Milk Yield Report Filters";
      case "byproducts":
        return "Outgoing By-products Report Filters";
      default:
        return "Report Filters";
    }
  }

  function extraFilterLabel(id) {
    switch (id) {
      case "birth":
        return "Breed (optional)";
      case "death":
        return "Cause / Category (optional)";
      case "sales":
        return "Buyer / Location (optional)";
      case "incoming":
        return "Source type (Purchase / Donation)";
      case "dattu":
        return "Dattu type (Shashwatha / Yearly)";
      case "milk":
        return "Shed (optional)";
      case "byproducts":
        return "Item (Gomaya / Gomutra / etc.)";
      default:
        return "Filter";
    }
  }

  /* ---------- EXPORT / PRINT HELPERS ---------- */

  function escapeCsvValue(value) {
    if (value == null) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function handleDownloadCsv() {
    if (!currentReportId) {
      alert("Please open a report first.");
      return;
    }
    if (!reportRows || reportRows.length === 0) {
      alert("No data available to download.");
      return;
    }

    const cfg = REPORT_CONFIG[currentReportId];
    const header = cfg.columns || [];

    const lines = [];
    lines.push(header.map(escapeCsvValue).join(","));
    reportRows.forEach((row) => {
      lines.push(row.map(escapeCsvValue).join(","));
    });

    const csvContent = lines.join("\r\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      (cfg.title || "report").toLowerCase().replace(/\s+/g, "-") + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function openPrintWindow() {
    if (!currentReportId || !tableRef.current) {
      alert("Please open a report first.");
      return;
    }

    const title = currentReportTitle || "Report";
    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              padding: 24px;
            }
            h1 {
              font-size: 18px;
              margin-bottom: 16px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 4px 6px;
              text-align: left;
            }
            th {
              background: #f5f5f5;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${tableRef.current.outerHTML}
        </body>
      </html>
    `;

    const printWin = window.open("", "_blank", "width=1024,height=768");
    if (!printWin) {
      alert(
        "Popup blocked. Please allow popups for this site to print/download PDF."
      );
      return;
    }
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    printWin.print(); // user can choose printer or 'Save as PDF'
  }

  function handleDownloadPdf() {
    // Use browser print dialog; user can choose "Save as PDF"
    openPrintWindow();
  }

  function handlePrint() {
    openPrintWindow();
  }

  /* ---------- RENDER ---------- */

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>
            Certificates &amp; Reports
          </h1>
          <p
            style={{
              margin: "0.3rem 0 0",
              fontSize: "0.9rem",
              color: "#6b7280",
            }}
          >
            Generate standard certificates and view key operational reports for
            Govardhana Goshala.
          </p>
        </div>
      </header>

      {/* Certificates section */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>Certificates</h2>
          <p style={sectionSubtitleStyle}>
            These certificates will be generated in fixed formats for donors and
            record-keeping.
          </p>
        </div>

        <div style={cardGridStyle}>
          <CertificateCard
            title="Birth Certificate"
            description="For new-born calves with dam & sire details."
            onClick={() => setOpenCertModal("birth")}
          />
          <CertificateCard
            title="Death Certificate"
            description="For deceased cattle with cause of death."
            onClick={() => setOpenCertModal("death")}
          />
          <CertificateCard
            title="Incoming Cow Certificate"
            description="For newly purchased / donated cattle."
            onClick={() => setOpenCertModal("incoming")}
          />
          <CertificateCard
            title="Dattu Yojana Certificate"
            description="For adopters under Dattu Yojana."
            onClick={() => setOpenCertModal("dattu")}
          />
        </div>
      </section>

      {/* Reports section */}
      <section style={{ ...sectionStyle, marginTop: "1.75rem" }}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>Reports</h2>
          <p style={sectionSubtitleStyle}>
            View date-wise performance and activity across key operations.
            Filters are applied on the data loaded from Google Sheets.
          </p>
        </div>

        <div style={cardGridStyle}>
          <ReportCard
            title="Birth Report"
            description="Date-wise list of calves born."
            onClick={() => {
              resetFilter();
              setOpenReportFilter("birth");
            }}
          />
          <ReportCard
            title="Death Report"
            description="Date-wise list of cattle deaths."
            onClick={() => {
              resetFilter();
              setOpenReportFilter("death");
            }}
          />
          <ReportCard
            title="Cattle Sales Report"
            description="Summary of all cattle sold."
            onClick={() => {
              resetFilter();
              setOpenReportFilter("sales");
            }}
          />
          <ReportCard
            title="Incoming Cattle Report"
            description="All purchased / donated cattle."
            onClick={() => {
              resetFilter();
              setOpenReportFilter("incoming");
            }}
          />
          <ReportCard
            title="Dattu Yojana Report"
            description="Adoptions and related details."
            onClick={() => {
              resetFilter();
              setOpenReportFilter("dattu");
            }}
          />
          <ReportCard
            title="Daily Milk Yield Report"
            description="Day-wise milk yield by shed."
            onClick={() => {
              resetFilter();
              setOpenReportFilter("milk");
            }}
          />
          <ReportCard
            title="Outgoing By-products Report"
            description="Gomaya, Gomutra and other by-products."
            onClick={() => {
              resetFilter();
              setOpenReportFilter("byproducts");
            }}
          />
        </div>
      </section>

      {/* Current report table */}
      {currentReportId && (
        <section style={{ marginTop: "1.75rem" }}>
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  {currentReportTitle}
                </h2>
                <p
                  style={{
                    margin: "0.25rem 0 0",
                    fontSize: "0.8rem",
                    color: "#6b7280",
                  }}
                >
                  Data loaded from Google Sheets for the selected period and
                  filters.
                </p>
                {loading && (
                  <p
                    style={{
                      margin: "0.25rem 0 0",
                      fontSize: "0.8rem",
                      color: "#2563eb",
                    }}
                  >
                    Loading data… please wait.
                  </p>
                )}
                {!!errorMsg && (
                  <p
                    style={{
                      margin: "0.25rem 0 0",
                      fontSize: "0.8rem",
                      color: "#b91c1c",
                    }}
                  >
                    {errorMsg}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  style={secondaryButtonStyle}
                  type="button"
                  onClick={handleDownloadCsv}
                  disabled={loading}
                >
                  Download CSV
                </button>
                <button
                  style={secondaryButtonStyle}
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={loading}
                >
                  Download PDF
                </button>
                <button
                  style={secondaryButtonStyle}
                  type="button"
                  onClick={handlePrint}
                  disabled={loading}
                >
                  Print
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table ref={tableRef} style={tableStyle}>
                <thead>
                  <tr>
                    {REPORT_CONFIG[currentReportId].columns.map((col) => (
                      <th key={col} style={thStyle}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          REPORT_CONFIG[currentReportId].columns.length
                        }
                        style={emptyCellStyle}
                      >
                        {loading
                          ? "Loading..."
                          : "No records found for selected filters."}
                      </td>
                    </tr>
                  ) : (
                    reportRows.map((row, idx) => (
                      <tr key={idx}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} style={tdStyle}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* CERTIFICATE MODALS */}
      {openCertModal === "birth" && (
        <CertModal
          title="Birth Certificate"
          onClose={() => setOpenCertModal(null)}
        >
          <CertificateBirthForm />
        </CertModal>
      )}
      {openCertModal === "death" && (
        <CertModal
          title="Death Certificate"
          onClose={() => setOpenCertModal(null)}
        >
          <CertificateDeathForm />
        </CertModal>
      )}
      {openCertModal === "incoming" && (
        <CertModal
          title="Incoming Cow Certificate"
          onClose={() => setOpenCertModal(null)}
        >
          <CertificateIncomingForm />
        </CertModal>
      )}
      {openCertModal === "dattu" && (
        <CertModal
          title="Dattu Yojana Certificate"
          onClose={() => setOpenCertModal(null)}
        >
          <CertificateDattuForm />
        </CertModal>
      )}

      {/* REPORT FILTER MODAL */}
      {openReportFilter && (
        <ReportFilterModal
          title={reportFilterTitle(openReportFilter)}
          filter={filter}
          extraLabel={extraFilterLabel(openReportFilter)}
          onChange={handleFilterChange}
          onClose={() => setOpenReportFilter(null)}
          onSubmit={handleReportFilterSubmit}
        />
      )}
    </div>
  );
}

/* ---------------- CERTIFICATE CARDS / REPORT CARDS ---------------- */

function CertificateCard({ title, description, onClick }) {
  return (
    <button type="button" onClick={onClick} style={certCardStyle}>
      <div
        style={{
          fontSize: "1.1rem",
          fontWeight: 600,
          marginBottom: "0.25rem",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "0.8rem",
          color: "#6b7280",
          marginBottom: "0.6rem",
        }}
      >
        {description}
      </div>
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 500,
          color: "#2563eb",
        }}
      >
        Generate →
      </div>
    </button>
  );
}

function ReportCard({ title, description, onClick }) {
  return (
    <button type="button" onClick={onClick} style={reportCardStyle}>
      <div
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          marginBottom: "0.15rem",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "0.8rem",
          color: "#6b7280",
          marginBottom: "0.6rem",
        }}
      >
        {description}
      </div>
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 500,
          color: "#2563eb",
        }}
      >
        View / Download →
      </div>
    </button>
  );
}

/* ---------------- GENERIC MODALS ---------------- */

function CertModal({ title, children, onClose }) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.6rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#6b7280",
              }}
            >
              Certificate
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{title}</div>
          </div>
          <button type="button" onClick={onClose} style={closeBtnStyle}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ReportFilterModal({
  title,
  filter,
  extraLabel,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.6rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#6b7280",
              }}
            >
              Report Filters
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{title}</div>
          </div>
          <button type="button" onClick={onClose} style={closeBtnStyle}>
            ✕
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            display: "grid",
            gap: "0.8rem",
            marginTop: "0.4rem",
          }}
        >
          <Field label="From Date">
            <input
              type="date"
              name="fromDate"
              value={filter.fromDate}
              onChange={onChange}
              style={inputStyle}
            />
          </Field>
          <Field label="To Date">
            <input
              type="date"
              name="toDate"
              value={filter.toDate}
              onChange={onChange}
              style={inputStyle}
            />
          </Field>
          <Field label={extraLabel}>
            <input
              type="text"
              name="extra"
              value={filter.extra}
              onChange={onChange}
              style={inputStyle}
            />
          </Field>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
              marginTop: "0.4rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>
            <button type="submit" style={primaryButtonStyle}>
              Apply Filters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- CERTIFICATE FORMS (UI ONLY) ---------------- */

function Field({ label, children }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "0.8rem",
          marginBottom: "0.2rem",
          color: "#374151",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function CertificateBirthForm() {
  function handleSubmit(e) {
    e.preventDefault();
    alert(
      "Birth certificate generation will be implemented later (PDF via Apps Script)."
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: "0.8rem", marginTop: "0.4rem" }}
    >
      <Field label="Calf ID / Tag No">
        <input
          type="text"
          style={inputStyle}
          placeholder="Search / enter calf ID or tag"
        />
      </Field>
      <Field label="Calf Name">
        <input type="text" style={inputStyle} />
      </Field>
      <Field label="Date of Birth">
        <input type="date" style={inputStyle} />
      </Field>
      <Field label="Sex">
        <select style={inputStyle}>
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </Field>
      <Field label="Breed">
        <input type="text" style={inputStyle} />
      </Field>
      <Field label="Dam (Mother)">
        <input type="text" style={inputStyle} placeholder="Name / tag" />
      </Field>
      <Field label="Sire (Bull / Straw)">
        <input
          type="text"
          style={inputStyle}
          placeholder="Name / tag / straw code"
        />
      </Field>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "0.4rem",
        }}
      >
        <button type="submit" style={primaryButtonStyle}>
          Generate Certificate (Demo)
        </button>
      </div>
    </form>
  );
}

function CertificateDeathForm() {
  function handleSubmit(e) {
    e.preventDefault();
    alert(
      "Death certificate generation will be implemented later (PDF via Apps Script)."
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: "0.8rem", marginTop: "0.4rem" }}
    >
      <Field label="Animal ID / Tag No">
        <input type="text" style={inputStyle} placeholder="Search / enter" />
      </Field>
      <Field label="Name">
        <input type="text" style={inputStyle} />
      </Field>
      <Field label="Breed">
        <input type="text" style={inputStyle} />
      </Field>
      <Field label="Age (Years)">
        <input type="number" style={inputStyle} />
      </Field>
      <Field label="Date of Death">
        <input type="date" style={inputStyle} />
      </Field>
      <Field label="Cause of Death">
        <input type="text" style={inputStyle} />
      </Field>
      <Field label="Certifying Authority Name">
        <input type="text" style={inputStyle} />
      </Field>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "0.4rem",
        }}
      >
        <button type="submit" style={primaryButtonStyle}>
          Generate Certificate (Demo)
        </button>
      </div>
    </form>
  );
}

function CertificateIncomingForm() {
  function handleSubmit(e) {
    e.preventDefault();
    alert(
      "Incoming cow certificate generation will be implemented later (PDF via Apps Script)."
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: "0.8rem", marginTop: "0.4rem" }}
    >
      <Field label="Animal ID / Tag No">
        <input type="text" style={inputStyle} />
      </Field>
      <Field label="Name">
        <input type="text" style={inputStyle} />
      </Field>
      <Field label="Breed">
        <input type="text" style={inputStyle} />
      </Field>
      <Field label="Type of Incoming">
        <select style={inputStyle}>
          <option value="">Select</option>
          <option value="Purchase">Purchase</option>
          <option value="Donation">Donation</option>
          <option value="Transfer">Transfer</option>
        </select>
      </Field>
      <Field label="Source (Farmer / Ashrama / Donor)">
        <input type="text" style={inputStyle} />
      </Field>
      <Field label="Date of Incoming">
        <input type="date" style={inputStyle} />
      </Field>
      <Field label="Remarks">
        <textarea
          style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
        />
      </Field>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "0.4rem",
        }}
      >
        <button type="submit" style={primaryButtonStyle}>
          Generate Certificate (Demo)
        </button>
      </div>
    </form>
  );
}

function CertificateDattuForm() {
  function handleSubmit(e) {
    e.preventDefault();
    alert(
      "Dattu Yojana certificate generation will be implemented later (PDF via Apps Script)."
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: "0.8rem", marginTop: "0.4rem" }}
    >
      <Field label="Adopter Name">
        <input type="text" style={inputStyle} />
      </Field>
      <Field label="Address">
        <textarea
          style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
        />
      </Field>
      <Field label="Cattle Tag / Name">
        <input type="text" style={inputStyle} />
      </Field>
      <Field label="Dattu Type">
        <select style={inputStyle}>
          <option value="">Select</option>
          <option value="Shashwatha">Shashwatha Dattu</option>
          <option value="Yearly">Yearly Dattu</option>
          <option value="Monthly">Monthly Support</option>
        </select>
      </Field>
      <Field label="Adoption Date">
        <input type="date" style={inputStyle} />
      </Field>
      <Field label="Donation Amount">
        <input type="number" style={inputStyle} />
      </Field>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "0.4rem",
        }}
      >
        <button type="submit" style={primaryButtonStyle}>
          Generate Certificate (Demo)
        </button>
      </div>
    </form>
  );
}

/* ---------------- STYLES ---------------- */

const sectionStyle = {
  background: "#ffffff",
  borderRadius: "0.75rem",
  padding: "1rem 1.25rem",
  boxShadow: "0 10px 25px rgba(15,23,42,0.03)",
};

const sectionHeaderStyle = {
  marginBottom: "0.75rem",
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: "1.1rem",
  fontWeight: 600,
};

const sectionSubtitleStyle = {
  margin: "0.25rem 0 0",
  fontSize: "0.8rem",
  color: "#6b7280",
};

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "0.75rem",
};

const certCardStyle = {
  borderRadius: "0.75rem",
  border: "1px solid #e5e7eb",
  padding: "0.8rem 0.9rem",
  background: "#f9fafb",
  textAlign: "left",
  cursor: "pointer",
};

const reportCardStyle = {
  ...certCardStyle,
};

const cardStyle = {
  background: "#ffffff",
  borderRadius: "0.75rem",
  padding: "1rem 1.25rem",
  boxShadow: "0 10px 25px rgba(15,23,42,0.03)",
};

const primaryButtonStyle = {
  padding: "0.4rem 0.9rem",
  borderRadius: "999px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontSize: "0.85rem",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  padding: "0.4rem 0.9rem",
  borderRadius: "999px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#374151",
  fontSize: "0.85rem",
  fontWeight: 500,
  cursor: "pointer",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.85rem",
};

const thStyle = {
  textAlign: "left",
  padding: "0.45rem 0.6rem",
  borderBottom: "1px solid #e5e7eb",
  background: "#f9fafb",
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "#4b5563",
};

const tdStyle = {
  padding: "0.45rem 0.6rem",
  borderBottom: "1px solid #e5e7eb",
  color: "#111827",
};

const emptyCellStyle = {
  padding: "0.6rem 0.6rem",
  textAlign: "center",
  color: "#6b7280",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

const modalStyle = {
  width: "100%",
  maxWidth: "540px",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#ffffff",
  borderRadius: "0.9rem",
  padding: "1rem 1.25rem 1.25rem",
  boxShadow: "0 24px 60px rgba(15,23,42,0.25)",
};

const closeBtnStyle = {
  border: "none",
  borderRadius: "999px",
  padding: "0.25rem 0.6rem",
  background: "#e5e7eb",
  cursor: "pointer",
  fontSize: "0.85rem",
};

const inputStyle = {
  width: "100%",
  padding: "0.45rem 0.6rem",
  borderRadius: "0.5rem",
  border: "1px solid #d1d5db",
  fontSize: "0.9rem",
};
