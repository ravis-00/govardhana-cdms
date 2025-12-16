// src/pages/CertificatesReports.jsx
import React, { useState, useRef } from "react";
import { fetchBirthReport, fetchSalesReport } from "../api/masterApi";

// ✅ New universal date helpers (you said you added these)
import {
  ddMmYyyyToDate,
  formatDateDisplay,
  formatPeriod,
  isoToDdMmYyyy,
} from "../utils/dateUtils";

export default function CertificatesReports() {
  // Which certificate modal is open: 'birth' | 'death' | 'incoming' | 'dattu' | null
  const [openCertModal, setOpenCertModal] = useState(null);

  // Which report filter modal is open: reportId or null
  const [openReportFilter, setOpenReportFilter] = useState(null);

  // Current report being displayed + rows
  const [currentReportId, setCurrentReportId] = useState(null);
  const [currentReportTitle, setCurrentReportTitle] = useState("");
  const [reportRows, setReportRows] = useState([]);

  // Keep the last-applied filter for header/printing period
  const [lastAppliedFilter, setLastAppliedFilter] = useState({
    fromDate: "",
    toDate: "",
    extra: "",
  });

  // Generic filter state (used by the modal)
  // NOTE: fromDate/toDate are ISO because <input type="date"> returns ISO.
  const [filter, setFilter] = useState({
    fromDate: "",
    toDate: "",
    extra: "",
  });

  // Loading + error for current report (used by Birth & Sales Reports)
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ref for the current report table (used by Print / PDF)
  const tableRef = useRef(null);

  // ✅ Print header constants
  const PRINT_H1 = "MADHAVA SRUSTI RASHTROTTHANA GOSHALA";

  // Report config (columns + sample rows + dateColumns for formatting)
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
      dateColumns: [0], // Date column index
      sampleRows: [],
    },
    death: {
      id: "death",
      title: "Date-wise Death Report",
      columns: [
        "Date",
        "Time",
        "Name",
        "Breed",
        "Ear tage number",
        "Date of Birth",
        "Birth time",
        "Teeth",
        "Age",
        "Gender",
        "Colour",
        "Mother cow breed",
        "Mother ear tag number",
        "Father bull breed",
        "Father ear tag number",
        "Reason for death",
      ],
      dateColumns: [],
      sampleRows: [],
    },
    sales: {
      id: "sales",
      title: "Cattle Sales Report",
      columns: [
        "Sl. No",
        "Date",
        "Cattle name",
        "Tag number",
        "Breed",
        "Gender",
        "Colour",
        "Cattle type",
        "Customer name",
        "Customer address",
        "Customer contact number",
        "Gate pass number",
        "Sale price",
      ],
      // date in this table is a ddmmyyyy string; we don't auto-format it as dd-mm-yyyy
      dateColumns: [],
      sampleRows: [],
    },
    incoming: {
      id: "incoming",
      title: "Incoming Cattle Report",
      columns: [
        "Sl. No",
        "Date",
        "Tag No", 
        "Name", 
        "Breed", 
        "Gender", 
        "Colour",
        "Cattle type",
        "Age",
        "Party name",
        "Address",],
        
      dateColumns: [0],
      sampleRows: [],
    },
    dattu: {
      id: "dattu",
      title: "Dattu Yojana Report",
      columns: [
        "Date", 
        "Breed",
        "Tag No",
        "Cattle Name",
        "Donor Name",
        "Donor Address",
        "Donor Contact Number",
        "Scheme",
        "Payment Mode",
        "Receipt Number",
        "Expiry date",
        "Amount",],

      dateColumns: [0],
      sampleRows: [],
    },
    milk: {
      id: "milk",
      title: "Daily Milk Yield Report",
      columns: [
        "Date", 
        "Morning Milk Yield",
        "Good Milk Morning",
        "Colostrum Milk Morning",
        "Milk to Temple",
        "Evening Milk Yield",
        "Left to By-products",
        "Good Milk Evening",
        "Colostrum Milk Evening",
        "Milk to Bulls",
        "Free Milk to workers",
        "Total Milk Yield",
        "Total Colostrum Milk",
        "Total Free Milk",
        "Total left to By-products",],

        dateColumns: [0],
        sampleRows: [],
    },
    byproducts: {
      id: "byproducts",
      title: "Outgoing By-products Report",
      columns: [
        "Date", 
        "Invoice Number",
        "Sector",
        "Milk",
        "KG",
        "INR",
        "Gaumaya",
        "KG",
        "Gaumuthra",
        "KG",
        "INR",
        "Slurry",
        "Tanks",
        "INR",
        "Others",
        "INR",
        "Total INR"],
      dateColumns: [0],
      sampleRows: [],
    },
  };

  /** Open a non-birth/non-sales report using static sample rows for now */
  function openReport(id) {
    const cfg = REPORT_CONFIG[id];
    if (!cfg) return;

    setCurrentReportId(id);
    setCurrentReportTitle(cfg.title);
    setReportRows(cfg.sampleRows || []);
    setErrorMsg("");
    setLastAppliedFilter({ ...filter });
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
    let from = fromDate ? new Date(fromDate) : null; // fromDate is ISO
    let to = toDate ? new Date(toDate) : null;
    if (to) to.setHours(23, 59, 59, 999);

    rows = rows.filter((row) => {
      // backend provides "dd-MM-yyyy" for birth report
      const d = ddMmYyyyToDate(row[0]); // Date string in dd-mm-yyyy
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });

    if (extra) {
      const term = extra.toLowerCase();
      // Breed is column index 3 in our array
      rows = rows.filter((row) => String(row[3] || "").toLowerCase().includes(term));
    }

    return rows;
  }

  /** Apply filters + transform for Sales Report (array of objects -> table rows) */
  function applySalesFilters(allItems, filterState) {
    if (!Array.isArray(allItems)) return [];

    const { fromDate, toDate, extra } = filterState;
    let from = fromDate ? new Date(fromDate) : null;
    let to = toDate ? new Date(toDate) : null;
    if (to) to.setHours(23, 59, 59, 999);

    let filtered = allItems.filter((item) => {
      // backend provides saleDate as "dd-MM-yyyy" (as per your code.gs)
      const d = ddMmYyyyToDate(item.saleDate);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });

    if (extra) {
      const term = extra.toLowerCase();
      filtered = filtered.filter((item) => {
        const buyer = String(item.customerName || "").toLowerCase();
        const address = String(item.customerAddress || "").toLowerCase();
        const loc = String(item.locationShed || "").toLowerCase();
        return buyer.includes(term) || address.includes(term) || loc.includes(term);
      });
    }

    // Map objects → array rows in the order of REPORT_CONFIG.sales.columns
    const rows = filtered.map((item, idx) => {
      // Requirement: Date (ddmmyyyy) in table
      const dateRaw = item.saleDate || ""; // dd-MM-yyyy
      const dateDdmmyyyy = String(dateRaw).replace(/-/g, ""); // ddMMyyyy

      return [
        idx + 1, // Sl. No
        dateDdmmyyyy,
        item.name || "",
        item.tagNumber || "",
        item.breed || "",
        item.gender || "",
        item.colour || item.color || "",
        item.cattleType || "",
        item.customerName || "",
        item.customerAddress || "",
        item.customerPhone || "",
        item.gatePassNumber || "",
        item.salePrice || "",
      ];
    });

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
      setLastAppliedFilter({ ...filterState });
    } catch (err) {
      console.error("Birth report error:", err);
      setReportRows([]);
      setLastAppliedFilter({ ...filterState });
      setErrorMsg("Unable to load Birth Report from Google Sheets. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /** Load Cattle Sales Report from Apps Script + apply filters */
  async function loadSalesReportWithFilters(filterState) {
    setLoading(true);
    setErrorMsg("");
    setCurrentReportId("sales");
    setCurrentReportTitle(REPORT_CONFIG.sales.title);

    try {
      const allItems = await fetchSalesReport(); // array of objects
      const filteredRows = applySalesFilters(allItems, filterState);
      setReportRows(filteredRows);
      setLastAppliedFilter({ ...filterState });
    } catch (err) {
      console.error("Sales report error:", err);
      setReportRows([]);
      setLastAppliedFilter({ ...filterState });
      setErrorMsg("Unable to load Cattle Sales Report from Google Sheets. Please try again.");
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
      await loadBirthReportWithFilters(filter);
    } else if (id === "sales") {
      await loadSalesReportWithFilters(filter);
    } else {
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
    a.download = (cfg.title || "report").toLowerCase().replace(/\s+/g, "-") + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function buildPrintTitleLines() {
    const cfg = currentReportId ? REPORT_CONFIG[currentReportId] : null;
    const baseTitle = cfg?.title || currentReportTitle || "Report";

    const periodText = formatPeriod(lastAppliedFilter.fromDate, lastAppliedFilter.toDate);
    const subtitle = `${baseTitle} (${periodText})`;

    return { h1: PRINT_H1, subtitle };
  }

  function openPrintWindow() {
    if (!currentReportId || !tableRef.current) {
      alert("Please open a report first.");
      return;
    }

    const { h1, subtitle } = buildPrintTitleLines();

    // Apply date formatting in print too (for configured dateColumns)
    const cfg = REPORT_CONFIG[currentReportId];
    const dateCols = cfg?.dateColumns || [];

    // Clone table HTML and patch date cells
    const temp = document.createElement("div");
    temp.innerHTML = tableRef.current.outerHTML;

    if (dateCols.length > 0) {
      const tbodyRows = temp.querySelectorAll("tbody tr");
      tbodyRows.forEach((tr) => {
        const tds = tr.querySelectorAll("td");
        dateCols.forEach((colIdx) => {
          if (tds[colIdx]) {
            const raw = tds[colIdx].textContent;
            tds[colIdx].textContent = formatDateDisplay(raw);
          }
        });
      });
    }

    const html = `
      <html>
        <head>
          <title>${subtitle}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              padding: 24px;
              color: #111827;
            }
            .print-header {
              text-align: center;
              margin-bottom: 16px;
            }
            .print-header h1 {
              font-size: 20px;
              margin: 0;
              font-weight: 800;
              letter-spacing: 0.02em;
            }
            .print-header .subtitle {
              margin-top: 6px;
              font-size: 14px;
              font-weight: 600;
              color: #374151;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 4px 6px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #f5f5f5;
            }
            @media print {
              body { padding: 0; }
              .print-header { margin-bottom: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${h1}</h1>
            <div class="subtitle">${subtitle}</div>
          </div>
          ${temp.innerHTML}
        </body>
      </html>
    `;

    const printWin = window.open("", "_blank", "width=1024,height=768");
    if (!printWin) {
      alert("Popup blocked. Please allow popups for this site to print/download PDF.");
      return;
    }
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    printWin.print();
  }

  function handleDownloadPdf() {
    openPrintWindow();
  }

  function handlePrint() {
    openPrintWindow();
  }

  /* ---------- RENDER ---------- */

  // For on-screen header: show dd-mm-yyyy in the filter summary (if any)
  const currentPeriodText = formatPeriod(lastAppliedFilter.fromDate, lastAppliedFilter.toDate);

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
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Certificates &amp; Reports</h1>
          <p style={{ margin: "0.3rem 0 0", fontSize: "0.9rem", color: "#6b7280" }}>
            Generate standard certificates and view key operational reports for Govardhana Goshala.
          </p>
        </div>
      </header>

      {/* Certificates section */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>Certificates</h2>
          <p style={sectionSubtitleStyle}>
            These certificates will be generated in fixed formats for donors and record-keeping.
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
            View date-wise performance and activity across key operations. Filters are applied on
            the data loaded from Google Sheets.
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
            {/* ✅ Centered report heading: H1 line + subtitle line */}
            <div style={{ textAlign: "center", marginBottom: "0.9rem" }}>
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                  lineHeight: 1.2,
                }}
              >
                {PRINT_H1}
              </div>
              <div
                style={{
                  marginTop: "0.35rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#374151",
                }}
              >
                {currentReportTitle} ({currentPeriodText})
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#6b7280" }}>
                  Data loaded from Google Sheets for the selected period and filters.
                </p>
                {loading && (
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#2563eb" }}>
                    Loading data… please wait.
                  </p>
                )}
                {!!errorMsg && (
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#b91c1c" }}>
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
                      <td colSpan={REPORT_CONFIG[currentReportId].columns.length} style={emptyCellStyle}>
                        {loading ? "Loading..." : "No records found for selected filters."}
                      </td>
                    </tr>
                  ) : (
                    reportRows.map((row, idx) => (
                      <tr key={idx}>
                        {row.map((cell, cIdx) => {
                          const cfg = REPORT_CONFIG[currentReportId];
                          const isDateCol = (cfg.dateColumns || []).includes(cIdx);

                          // Sales report uses ddmmyyyy. Keep it as-is.
                          if (currentReportId === "sales" && cIdx === 1) {
                            return (
                              <td key={cIdx} style={tdStyle}>
                                {cell}
                              </td>
                            );
                          }

                          return (
                            <td key={cIdx} style={tdStyle}>
                              {isDateCol ? formatDateDisplay(cell) : cell}
                            </td>
                          );
                        })}
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
        <CertModal title="Birth Certificate" onClose={() => setOpenCertModal(null)}>
          <CertificateBirthForm />
        </CertModal>
      )}
      {openCertModal === "death" && (
        <CertModal title="Death Certificate" onClose={() => setOpenCertModal(null)}>
          <CertificateDeathForm />
        </CertModal>
      )}
      {openCertModal === "incoming" && (
        <CertModal title="Incoming Cow Certificate" onClose={() => setOpenCertModal(null)}>
          <CertificateIncomingForm />
        </CertModal>
      )}
      {openCertModal === "dattu" && (
        <CertModal title="Dattu Yojana Certificate" onClose={() => setOpenCertModal(null)}>
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
      <div style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.25rem" }}>{title}</div>
      <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.6rem" }}>{description}</div>
      <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "#2563eb" }}>Generate →</div>
    </button>
  );
}

function ReportCard({ title, description, onClick }) {
  return (
    <button type="button" onClick={onClick} style={reportCardStyle}>
      <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.15rem" }}>{title}</div>
      <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.6rem" }}>{description}</div>
      <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "#2563eb" }}>View / Download →</div>
    </button>
  );
}

/* ---------------- GENERIC MODALS ---------------- */

function CertModal({ title, children, onClose }) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
          <div>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>
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

function ReportFilterModal({ title, filter, extraLabel, onChange, onClose, onSubmit }) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
          <div>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>
              Report Filters
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{title}</div>
          </div>
          <button type="button" onClick={onClose} style={closeBtnStyle}>
            ✕
          </button>
        </div>

        {/* ✅ Help users: date inputs are ISO but display is dd-mm-yyyy everywhere else */}
        <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "0.5rem" }}>
          Note: Select dates using the date picker. Reports will display dates in dd-mm-yyyy format.
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.8rem", marginTop: "0.4rem" }}>
          <Field label="From Date">
            <input type="date" name="fromDate" value={filter.fromDate} onChange={onChange} style={inputStyle} />
          </Field>

          <Field label="To Date">
            <input type="date" name="toDate" value={filter.toDate} onChange={onChange} style={inputStyle} />
          </Field>

          <Field label={extraLabel}>
            <input type="text" name="extra" value={filter.extra} onChange={onChange} style={inputStyle} />
          </Field>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.4rem" }}>
            <button type="button" onClick={onClose} style={secondaryButtonStyle}>
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
      <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.2rem", color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

function CertificateBirthForm() {
  function handleSubmit(e) {
    e.preventDefault();
    alert("Birth certificate generation will be implemented later (PDF via Apps Script).");
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.8rem", marginTop: "0.4rem" }}>
      <Field label="Calf ID / Tag No">
        <input type="text" style={inputStyle} placeholder="Search / enter calf ID or tag" />
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
        <input type="text" style={inputStyle} placeholder="Name / tag / straw code" />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.4rem" }}>
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
    alert("Death certificate generation will be implemented later (PDF via Apps Script).");
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.8rem", marginTop: "0.4rem" }}>
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
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.4rem" }}>
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
    alert("Incoming cow certificate generation will be implemented later (PDF via Apps Script).");
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.8rem", marginTop: "0.4rem" }}>
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
        <textarea style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }} />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.4rem" }}>
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
    alert("Dattu Yojana certificate generation will be implemented later (PDF via Apps Script).");
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.8rem", marginTop: "0.4rem" }}>
      <Field label="Adopter Name">
        <input type="text" style={inputStyle} />
      </Field>
      <Field label="Address">
        <textarea style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }} />
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
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.4rem" }}>
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
