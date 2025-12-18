// src/pages/CertificatesReports.jsx
import React, { useState, useRef } from "react";
import {
  fetchBirthReport,
  fetchSalesReport,
  fetchDeathRecords,
  fetchCattle,
  fetchDattuReport,
  fetchMilkReport,
  fetchBioReport
} from "../api/masterApi";

import { ddMmYyyyToDate, formatDateDisplay, formatPeriod } from "../utils/dateUtils";

export default function CertificatesReports() {
  const [openCertModal, setOpenCertModal] = useState(null);
  const [openReportFilter, setOpenReportFilter] = useState(null);

  const [currentReportId, setCurrentReportId] = useState(null);
  const [currentReportTitle, setCurrentReportTitle] = useState("");
  const [reportRows, setReportRows] = useState([]);

  const [lastAppliedFilter, setLastAppliedFilter] = useState({
    fromDate: "",
    toDate: "",
    extra: "",
  });

  const [filter, setFilter] = useState({
    fromDate: "",
    toDate: "",
    extra: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const tableRef = useRef(null);

  const PRINT_H1 = "MADHAVA SRUSTI RASHTROTTHANA GOSHALA";

  const REPORT_CONFIG = {
    birth: {
      id: "birth",
      title: "Date-wise Birth Report",
      columns: [
        "Date", "Time", "Name", "Breed", "Gender", "Colour",
        "Mother cow breed", "Mother ear tag number", "Father bull breed", "Father ear tag number",
      ],
      dateColumns: [0],
      sampleRows: [],
    },
    death: {
      id: "death",
      title: "Date-wise Death Report",
      columns: [
        "Date", "Time", "Name", "Breed", "Ear tag number", "Date of Birth",
        "Birth time", "Teeth", "Age", "Gender", "Colour",
        "Mother cow breed", "Mother ear tag number", "Father bull breed", "Father ear tag number",
        "Reason for death",
      ],
      dateColumns: [0, 5],
      sampleRows: [],
    },
    sales: {
      id: "sales",
      title: "Cattle Sales Report",
      columns: [
        "Sl. No", "Date (ddmmyyyy)", "Cattle name", "Tag number", "Breed", "Gender",
        "Colour", "Cattle type", "Customer name", "Customer address",
        "Customer contact number", "Gate pass number", "Sale price",
      ],
      dateColumns: [],
      sampleRows: [],
    },
    incoming: {
      id: "incoming",
      title: "Incoming Cattle Report",
      columns: [
        "Sl. No", "Date", "Tag No", "Name", "Breed", "Gender", "Colour",
        "Cattle type", "Age", "Party name", "Address",
      ],
      dateColumns: [1],
      sampleRows: [],
    },
    dattu: {
      id: "dattu",
      title: "Dattu Yojana Report",
      columns: [
        "Date", "Breed", "Tag No", "Cattle Name", "Donor Name", "Donor Address",
        "Donor Contact Number", "Scheme", "Payment Mode", "Receipt Number",
        "Expiry date", "Amount",
      ],
      dateColumns: [0, 11],
      sampleRows: [],
    },
    milk: {
      id: "milk",
      title: "Daily Milk Yield Report",
      columns: [
        "Date", "Shed", "Morning Yield", "Evening Yield", "Total Yield",
        "Out Pass", "Pass No", "To By-products", "To Workers",
        "To Temple", "To Guests", "To Canteen", "To Events", "Remarks"
      ],
      dateColumns: [0],
      sampleRows: [],
    },
    byproducts: {
      id: "byproducts",
      title: "Outgoing By-products Report",
      columns: [
        "Date", "Shed", "Gaumaya", "Gomutra", "Slurry", "Others",
        "Qty", "Units", "Gobbara", "Receiver Unit", 
        "Rec. Incharge", "From Incharge", "Remarks"
      ],
      dateColumns: [0],
      sampleRows: [],
    },
  };

  function openReport(id) {
    const cfg = REPORT_CONFIG[id];
    if (!cfg) return;

    setCurrentReportId(id);
    setCurrentReportTitle(cfg.title);
    setReportRows(cfg.sampleRows || []);
    setErrorMsg("");
    setLastAppliedFilter({ ...filter });
  }

  function closeReport() {
    setCurrentReportId(null);
    setReportRows([]);
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  }

  function resetFilter() {
    setFilter({ fromDate: "", toDate: "", extra: "" });
  }

  // ---------------- LOADERS (Reports) ----------------

  async function loadBirthReportWithFilters(filterState) {
    setLoading(true); setErrorMsg("");
    setCurrentReportId("birth"); setCurrentReportTitle(REPORT_CONFIG.birth.title);
    try {
      const allRows = await fetchBirthReport();
      let rows = Array.isArray(allRows) ? [...allRows] : [];
      const { fromDate, toDate, extra } = filterState;
      let from = fromDate ? new Date(fromDate) : null;
      let to = toDate ? new Date(toDate) : null;
      if (to) to.setHours(23, 59, 59, 999);

      rows = rows.filter((row) => {
        const d = ddMmYyyyToDate(row[0]);
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
      if (extra) {
        const term = extra.toLowerCase();
        rows = rows.filter((row) => String(row[3] || "").toLowerCase().includes(term));
      }
      setReportRows(rows);
      setLastAppliedFilter({ ...filterState });
    } catch (err) {
      console.error(err); setReportRows([]); setErrorMsg("Unable to load Birth Report.");
    } finally { setLoading(false); }
  }

  async function loadIncomingReportWithFilters(filterState) {
    setLoading(true); setErrorMsg("");
    setCurrentReportId("incoming"); setCurrentReportTitle(REPORT_CONFIG.incoming.title);
    try {
      const allItems = await fetchCattle();
      const { fromDate, toDate, extra } = filterState;
      let from = fromDate ? new Date(fromDate) : null;
      let to = toDate ? new Date(toDate) : null;
      if (to) to.setHours(23, 59, 59, 999);

      let filtered = allItems.filter((item) => {
        const status = String(item.status || "").toLowerCase().trim();
        if (status !== "active") return false;
        const d = new Date(item.dateOfAdmission);
        if (isNaN(d.getTime())) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
      if (extra) {
        const term = extra.toLowerCase().trim();
        filtered = filtered.filter((item) => String(item.typeOfAdmission || "").toLowerCase().includes(term));
      }
      const rows = filtered.map((item, idx) => [
        idx + 1, item.dateOfAdmission || "", item.tagNumber || "", item.name || "",
        item.breed || "", item.gender || "", item.colour || item.color || "",
        item.cattleType || "", item.ageYears ?? item.age ?? "", "-", "-"
      ]);
      setReportRows(rows);
      setLastAppliedFilter({ ...filterState });
    } catch (err) {
      console.error(err); setReportRows([]); setErrorMsg("Unable to load Incoming Report.");
    } finally { setLoading(false); }
  }

  async function loadSalesReportWithFilters(filterState) {
    setLoading(true); setErrorMsg("");
    setCurrentReportId("sales"); setCurrentReportTitle(REPORT_CONFIG.sales.title);
    try {
      const allItems = await fetchSalesReport();
      const { fromDate, toDate, extra } = filterState;
      let from = fromDate ? new Date(fromDate) : null;
      let to = toDate ? new Date(toDate) : null;
      if (to) to.setHours(23, 59, 59, 999);

      let filtered = allItems.filter((item) => {
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
          return buyer.includes(term);
        });
      }
      const rows = filtered.map((item, idx) => {
        const dateRaw = item.saleDate || ""; 
        const dateDdmmyyyy = String(dateRaw).replace(/-/g, "");
        return [
          idx + 1, dateDdmmyyyy, item.name || "", item.tagNumber || "", item.breed || "",
          item.gender || "", item.colour || item.color || "", item.cattleType || "",
          item.customerName || "", item.customerAddress || "", item.customerPhone || "",
          item.gatePassNumber || "", item.salePrice || ""
        ];
      });
      setReportRows(rows);
      setLastAppliedFilter({ ...filterState });
    } catch (err) {
      console.error(err); setReportRows([]); setErrorMsg("Unable to load Sales Report.");
    } finally { setLoading(false); }
  }

  async function loadDeathReportWithFilters(filterState) {
    setLoading(true); setErrorMsg("");
    setCurrentReportId("death"); setCurrentReportTitle(REPORT_CONFIG.death.title);
    try {
      const allItems = await fetchDeathRecords(filterState.fromDate, filterState.toDate);
      function pick(v, f="-") { return v ? v : f; }
      const rows = allItems.map((item) => [
        pick(item.date || item.dateOfDeath), pick(item.timeOfDeath, "-"), pick(item.name), pick(item.breed),
        pick(item.tagNumber), pick(item.dateOfBirth), "-", "-", pick(item.ageYears),
        pick(item.gender), pick(item.colour), "-", "-", "-", "-",
        pick(item.deathCause || item.cause)
      ]);
      setReportRows(rows);
      setLastAppliedFilter({ ...filterState });
    } catch (err) {
      console.error(err); setReportRows([]); setErrorMsg("Unable to load Death Report.");
    } finally { setLoading(false); }
  }

  async function loadDattuReportWithFilters(filterState) {
    setLoading(true); setErrorMsg("");
    setCurrentReportId("dattu"); setCurrentReportTitle(REPORT_CONFIG.dattu.title);
    try {
      const allItems = await fetchDattuReport(filterState.fromDate, filterState.toDate);
      let filtered = allItems;
      if (filterState.extra) {
        const term = filterState.extra.toLowerCase();
        filtered = allItems.filter(item => 
          String(item.donorName).toLowerCase().includes(term) ||
          String(item.tagNumber).toLowerCase().includes(term)
        );
      }
      const rows = filtered.map(item => [
        item.date, item.breed, item.tagNumber, item.cattleName, 
        item.donorName, item.donorAddress || item.address, item.donorContactNumber || item.phone,
        item.scheme, item.paymentMode, item.receiptNumber, item.expiryDate, item.amount
      ]);
      setReportRows(rows);
      setLastAppliedFilter({ ...filterState });
    } catch (err) {
      console.error(err); setReportRows([]); setErrorMsg("Unable to load Dattu Report.");
    } finally { setLoading(false); }
  }

  async function loadMilkReportWithFilters(filterState) {
    setLoading(true); setErrorMsg("");
    setCurrentReportId("milk"); setCurrentReportTitle(REPORT_CONFIG.milk.title);
    try {
      const allItems = await fetchMilkReport(filterState.fromDate, filterState.toDate);
      const rows = allItems.map(item => [
        item.date, item.shed, item.morning, item.evening, item.total,
        item.outPass, item.outPassNum, item.byProducts, item.workers,
        item.temple, item.guests, item.staff, item.events, item.remarks
      ]);
      setReportRows(rows);
      setLastAppliedFilter({ ...filterState });
    } catch (err) {
      console.error(err); setReportRows([]); setErrorMsg("Unable to load Milk Report.");
    } finally { setLoading(false); }
  }

  async function loadBioReportWithFilters(filterState) {
    setLoading(true); setErrorMsg("");
    setCurrentReportId("byproducts"); setCurrentReportTitle(REPORT_CONFIG.byproducts.title);
    try {
      const allItems = await fetchBioReport(filterState.fromDate, filterState.toDate);
      const rows = allItems.map(item => [
        item.date, item.shed, item.gaumaya, item.gomutra, item.slurry, item.others,
        item.qty, item.units, item.gobbara, item.receiver, 
        item.recIncharge, item.fromIncharge, item.remarks
      ]);
      setReportRows(rows);
      setLastAppliedFilter({ ...filterState });
    } catch (err) {
      console.error(err); setReportRows([]); setErrorMsg("Unable to load Bio Report.");
    } finally { setLoading(false); }
  }

  // ---------------- SUBMIT HANDLER ----------------

  async function handleReportFilterSubmit(e) {
    e.preventDefault();
    if (!openReportFilter) return;

    const id = openReportFilter;
    setOpenReportFilter(null);

    if (id === "birth") await loadBirthReportWithFilters(filter);
    else if (id === "sales") await loadSalesReportWithFilters(filter);
    else if (id === "death") await loadDeathReportWithFilters(filter);
    else if (id === "incoming") await loadIncomingReportWithFilters(filter);
    else if (id === "dattu") await loadDattuReportWithFilters(filter);
    else if (id === "milk") await loadMilkReportWithFilters(filter);
    else if (id === "byproducts") await loadBioReportWithFilters(filter);
    else openReport(id);
  }

  function reportFilterTitle(id) {
    if (id === "birth") return "Birth Report Filters";
    if (id === "dattu") return "Dattu Yojana Filters";
    if (id === "milk") return "Milk Yield Filters";
    if (id === "byproducts") return "Bio Waste Filters";
    return "Report Filters";
  }

  function extraFilterLabel(id) {
    if (id === "dattu") return "Donor / Tag (optional)";
    if (id === "milk") return "Shed (optional)";
    return "Filter (optional)";
  }

  // ---------------- EXPORT & PRINT LOGIC ----------------

  function buildPrintTitleLines() {
    const cfg = currentReportId ? REPORT_CONFIG[currentReportId] : null;
    const baseTitle = cfg?.title || currentReportTitle || "Report";
    const periodText = formatPeriod(lastAppliedFilter.fromDate, lastAppliedFilter.toDate);
    return { h1: PRINT_H1, subtitle: `${baseTitle} (${periodText})` };
  }

  function openPrintWindow() {
    if (!currentReportId || !tableRef.current) return alert("Please open a report first.");

    const { h1, subtitle } = buildPrintTitleLines();
    const temp = document.createElement("div");
    temp.innerHTML = tableRef.current.outerHTML;

    const html = `
      <html>
        <head>
          <title>${subtitle}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 30px; color: #111; }
            .print-header { text-align: center; margin-bottom: 20px; }
            .print-header h1 { font-size: 24px; margin: 0; font-weight: 800; text-transform: uppercase; }
            .print-header h3 { font-size: 16px; margin: 8px 0 0; font-weight: 600; color: #444; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
            th { background: #f0f0f0; font-weight: 700; }
            @media print { 
              body { padding: 0; }
              @page { size: landscape; margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${h1}</h1>
            <h3>${subtitle}</h3>
          </div>
          ${temp.innerHTML}
        </body>
      </html>
    `;

    const printWin = window.open("", "_blank", "width=1100,height=800");
    if (!printWin) return alert("Popup blocked. Please allow popups for this site.");

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    
    setTimeout(() => {
      printWin.focus();
      printWin.print();
    }, 500);
  }

  function handleDownloadCsv() {
    if (!reportRows.length) return alert("No data to download.");
    const cfg = REPORT_CONFIG[currentReportId];
    const header = cfg.columns.join(",");
    const rows = reportRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([header + "\r\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${cfg.title}.csv`;
    a.click();
  }

  // ---------------- CERTIFICATE GENERATION LOGIC ----------------

  function generateBirthCertificate(data) {
    const html = `
      <html>
      <head>
        <title>Birth Certificate - ${data.name}</title>
        <style>
          body { font-family: "Times New Roman", serif; padding: 40px; text-align: center; }
          .container { border: 3px solid #000; padding: 20px; max-width: 800px; margin: 0 auto; min-height: 900px; position: relative; }
          .header { text-transform: uppercase; margin-bottom: 20px; line-height: 1.4; }
          .header h1 { font-size: 24px; font-weight: 800; margin: 0; text-decoration: underline; }
          .header h2 { font-size: 18px; font-weight: 700; margin: 5px 0; }
          .cert-title { border: 2px solid #000; padding: 8px; font-size: 20px; font-weight: 800; display: inline-block; width: 100%; margin-top: 10px; background: #eee; box-sizing: border-box; }
          
          .photo-box { 
            width: 100%; height: 350px; border: 2px solid #000; margin: 20px 0; 
            display: flex; align-items: center; justify-content: center; overflow: hidden;
          }
          .photo-box img { width: 100%; height: 100%; object-fit: cover; }
          .photo-placeholder { font-size: 14px; color: #666; font-style: italic; }

          table { width: 100%; border-collapse: collapse; margin-top: 20px; border: 2px solid #000; }
          td { border: 1px solid #000; padding: 12px; text-align: left; width: 50%; font-size: 16px; vertical-align: middle; }
          .label { font-weight: 800; text-transform: uppercase; margin-right: 5px; }
          .value { font-weight: 500; text-transform: uppercase; }

          .footer { margin-top: 80px; display: flex; justify-content: space-between; padding: 0 40px; }
          .sign-box { text-align: center; }
          .sign-line { width: 200px; border-bottom: 1px solid #000; margin-bottom: 10px; }
          .sign-label { font-weight: 700; font-size: 14px; text-transform: uppercase; }

          @media print {
            body { padding: 0; margin: 0; }
            .container { border: 2px solid #000; height: 100vh; box-sizing: border-box; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${PRINT_H1}</h1>
            <h2>SS GHATI DODDABALLAPURA</h2>
            <div class="cert-title">BIRTH CERTIFICATE</div>
          </div>

          <div class="photo-box">
            ${data.photoUrl ? `<img src="${data.photoUrl}" alt="Calf Photo" />` : `<div class="photo-placeholder">[ Paste Calf Photo Here ]</div>`}
          </div>

          <table>
            <tr>
              <td><span class="label">NAME:</span> <span class="value">${data.name}</span></td>
              <td><span class="label">COLOUR:</span> <span class="value">${data.colour}</span></td>
            </tr>
            <tr>
              <td><span class="label">DATE OF BIRTH:</span> <span class="value">${data.dob}</span></td>
              <td><span class="label">TIME:</span> <span class="value">${data.time}</span></td>
            </tr>
            <tr>
              <td><span class="label">BREED NAME:</span> <span class="value">${data.breed}</span></td>
              <td><span class="label">GENDER:</span> <span class="value">${data.gender}</span></td>
            </tr>
            <tr>
              <td><span class="label">MOTHER COW BREED:</span> <span class="value">${data.motherBreed}</span></td>
              <td><span class="label">EAR TAG NO:</span> <span class="value">${data.motherTag}</span></td>
            </tr>
            <tr>
              <td><span class="label">FATHER BULL BREED:</span> <span class="value">${data.fatherBreed}</span></td>
              <td><span class="label">EAR TAG NO:</span> <span class="value">${data.fatherTag}</span></td>
            </tr>
          </table>

          <div class="footer">
            <div class="sign-box">
              <div class="sign-line"></div>
              <div class="sign-label">SUPERVISOR SIGNATURE</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div class="sign-label">PROJECT MANAGER SIGNATURE</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=900,height=1100");
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
    } else {
      alert("Popup blocked.");
    }
  }

  // ---------------- RENDER ----------------

  const currentPeriodText = formatPeriod(lastAppliedFilter.fromDate, lastAppliedFilter.toDate);

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Certificates &amp; Reports</h1>
          <p style={{ margin: "0.3rem 0 0", color: "#6b7280" }}>Generate certificates and view operational reports.</p>
        </div>
      </header>

      {/* Certificates Section */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}><h2 style={sectionTitleStyle}>Certificates</h2></div>
        <div style={cardGridStyle}>
          <CertificateCard title="Birth Certificate" description="For new-born calves." onClick={() => setOpenCertModal("birth")} />
          <CertificateCard title="Death Certificate" description="For deceased cattle." onClick={() => setOpenCertModal("death")} />
          <CertificateCard title="Incoming Cow Certificate" description="For newly purchased cattle." onClick={() => setOpenCertModal("incoming")} />
          <CertificateCard title="Dattu Yojana Certificate" description="For adopters." onClick={() => setOpenCertModal("dattu")} />
        </div>
      </section>

      {/* Reports Section */}
      <section style={{ ...sectionStyle, marginTop: "1.75rem" }}>
        <div style={sectionHeaderStyle}><h2 style={sectionTitleStyle}>Reports</h2></div>
        <div style={cardGridStyle}>
          <ReportCard title="Birth Report" description="Date-wise list of calves born." onClick={() => { resetFilter(); setOpenReportFilter("birth"); }} />
          <ReportCard title="Death Report" description="Date-wise list of cattle deaths." onClick={() => { resetFilter(); setOpenReportFilter("death"); }} />
          <ReportCard title="Cattle Sales Report" description="Summary of all cattle sold." onClick={() => { resetFilter(); setOpenReportFilter("sales"); }} />
          <ReportCard title="Incoming Cattle Report" description="All purchased / donated cattle." onClick={() => { resetFilter(); setOpenReportFilter("incoming"); }} />
          <ReportCard title="Dattu Yojana Report" description="Adoptions and related details." onClick={() => { resetFilter(); setOpenReportFilter("dattu"); }} />
          <ReportCard title="Daily Milk Yield Report" description="Day-wise milk yield by shed." onClick={() => { resetFilter(); setOpenReportFilter("milk"); }} />
          <ReportCard title="Outgoing By-products Report" description="Gomaya, Gomutra etc." onClick={() => { resetFilter(); setOpenReportFilter("byproducts"); }} />
        </div>
      </section>

      {/* Report Table */}
      {currentReportId && (
        <section style={{ marginTop: "1.75rem" }}>
          <div style={{ ...cardStyle, position: "relative" }}>
            <button
              onClick={closeReport}
              style={{
                position: "absolute", top: "1rem", right: "1.2rem",
                background: "transparent", border: "none", fontSize: "1.5rem",
                fontWeight: "bold", cursor: "pointer", color: "#9ca3af", lineHeight: 1
              }}
              title="Close Report"
            >
              &times;
            </button>

            <div style={{ textAlign: "center", marginBottom: "0.9rem", paddingRight: "2rem" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{PRINT_H1}</div>
              <div style={{ marginTop: "0.35rem", fontSize: "0.95rem", fontWeight: 700 }}>{currentReportTitle} ({currentPeriodText})</div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <div>
                {loading && <p style={{ margin: 0, fontSize: "0.8rem", color: "#2563eb" }}>Loading data...</p>}
                {errorMsg && <p style={{ margin: 0, fontSize: "0.8rem", color: "#b91c1c" }}>{errorMsg}</p>}
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button style={secondaryButtonStyle} onClick={handleDownloadCsv}>Download CSV</button>
                <button style={secondaryButtonStyle} onClick={openPrintWindow}>Download PDF</button>
                <button style={secondaryButtonStyle} onClick={openPrintWindow}>Print</button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table ref={tableRef} style={tableStyle}>
                <thead>
                  <tr>
                    {REPORT_CONFIG[currentReportId].columns.map((col) => (
                      <th key={col} style={thStyle}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportRows.length === 0 ? (
                    <tr><td colSpan={REPORT_CONFIG[currentReportId].columns.length} style={emptyCellStyle}>{loading ? "Loading..." : "No records found."}</td></tr>
                  ) : (
                    reportRows.map((row, idx) => (
                      <tr key={idx}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} style={tdStyle}>{cell}</td>
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

      {/* Modals */}
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
      
      {/* Certificate Modals */}
      {openCertModal === "birth" && (
        <CertModal title="Birth Certificate" onClose={() => setOpenCertModal(null)}>
          <CertificateBirthForm onSubmit={generateBirthCertificate} />
        </CertModal>
      )}
      {openCertModal === "death" && <CertModal title="Death Certificate" onClose={() => setOpenCertModal(null)}><CertificateDeathForm /></CertModal>}
      {openCertModal === "incoming" && <CertModal title="Incoming Cow Certificate" onClose={() => setOpenCertModal(null)}><CertificateIncomingForm /></CertModal>}
      {openCertModal === "dattu" && <CertModal title="Dattu Yojana Certificate" onClose={() => setOpenCertModal(null)}><CertificateDattuForm /></CertModal>}
    </div>
  );
}

// ---------------- STYLES & SUB-COMPONENTS ----------------

function CertificateCard({ title, description, onClick }) {
  return (
    <button onClick={onClick} style={certCardStyle}>
      <div style={{ fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{description}</div>
    </button>
  );
}

function ReportCard({ title, description, onClick }) {
  return (
    <button onClick={onClick} style={reportCardStyle}>
      <div style={{ fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{description}</div>
    </button>
  );
}

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
          <button type="button" onClick={onClose} style={closeBtnStyle}>✕</button>
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
        <h3>{title}</h3>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "10px" }}>
          <label>From: <input type="date" name="fromDate" value={filter.fromDate} onChange={onChange} style={inputStyle} /></label>
          <label>To: <input type="date" name="toDate" value={filter.toDate} onChange={onChange} style={inputStyle} /></label>
          <label>{extraLabel}: <input type="text" name="extra" value={filter.extra} onChange={onChange} style={inputStyle} /></label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={onClose} style={secondaryButtonStyle}>Cancel</button>
            <button type="submit" style={primaryButtonStyle}>Apply</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------- FORMS (Updated for Birth Certificate) ----------------

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.2rem", color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

function CertificateBirthForm({ onSubmit }) {
  const [data, setData] = useState({
    name: "", colour: "", dob: "", time: "", breed: "", gender: "",
    motherBreed: "", motherTag: "", fatherBreed: "", fatherTag: "", photoUrl: ""
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.8rem", marginTop: "0.4rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <Field label="Calf Name"><input type="text" name="name" value={data.name} onChange={handleChange} style={inputStyle} required /></Field>
        <Field label="Colour"><input type="text" name="colour" value={data.colour} onChange={handleChange} style={inputStyle} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <Field label="Date of Birth"><input type="date" name="dob" value={data.dob} onChange={handleChange} style={inputStyle} required /></Field>
        <Field label="Time (e.g. 06:18 AM)"><input type="text" name="time" value={data.time} onChange={handleChange} style={inputStyle} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <Field label="Breed Name"><input type="text" name="breed" value={data.breed} onChange={handleChange} style={inputStyle} /></Field>
        <Field label="Gender">
          <select name="gender" value={data.gender} onChange={handleChange} style={inputStyle}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <Field label="Mother Breed"><input type="text" name="motherBreed" value={data.motherBreed} onChange={handleChange} style={inputStyle} /></Field>
        <Field label="Mother Tag No"><input type="text" name="motherTag" value={data.motherTag} onChange={handleChange} style={inputStyle} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <Field label="Father Breed"><input type="text" name="fatherBreed" value={data.fatherBreed} onChange={handleChange} style={inputStyle} /></Field>
        <Field label="Father Tag No"><input type="text" name="fatherTag" value={data.fatherTag} onChange={handleChange} style={inputStyle} /></Field>
      </div>
      <Field label="Calf Photo URL (Optional)">
        <input type="text" name="photoUrl" value={data.photoUrl} onChange={handleChange} style={inputStyle} placeholder="https://..." />
      </Field>
      
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.4rem" }}>
        <button type="submit" style={primaryButtonStyle}>Generate Certificate</button>
      </div>
    </form>
  );
}

// Other forms kept as placeholders
function CertificateDeathForm() { return <div style={{padding:"10px"}}>Coming Soon</div>; }
function CertificateIncomingForm() { return <div style={{padding:"10px"}}>Coming Soon</div>; }
function CertificateDattuForm() { return <div style={{padding:"10px"}}>Coming Soon</div>; }

// Styles
const sectionStyle = { background: "#ffffff", borderRadius: "0.75rem", padding: "1rem", boxShadow: "0 10px 25px rgba(0,0,0,0.03)" };
const sectionHeaderStyle = { marginBottom: "0.75rem" };
const sectionTitleStyle = { margin: 0, fontSize: "1.1rem", fontWeight: 600 };
const cardGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" };
const certCardStyle = { borderRadius: "0.75rem", border: "1px solid #e5e7eb", padding: "1rem", background: "#f9fafb", textAlign: "left", cursor: "pointer" };
const reportCardStyle = { ...certCardStyle };
const cardStyle = { background: "#ffffff", borderRadius: "0.75rem", padding: "1rem", boxShadow: "0 10px 25px rgba(0,0,0,0.03)" };
const primaryButtonStyle = { padding: "0.5rem 1rem", borderRadius: "5px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" };
const secondaryButtonStyle = { padding: "0.5rem 1rem", borderRadius: "5px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" };
const thStyle = { textAlign: "left", padding: "8px", borderBottom: "1px solid #eee", background: "#f9fafb" };
const tdStyle = { padding: "8px", borderBottom: "1px solid #eee" };
const emptyCellStyle = { padding: "1rem", textAlign: "center", color: "#666" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 };
const modalStyle = { background: "#fff", padding: "2rem", borderRadius: "8px", width: "500px", maxWidth: "90%" };
const closeBtnStyle = { border: "none", borderRadius: "999px", padding: "0.25rem 0.6rem", background: "#e5e7eb", cursor: "pointer", fontSize: "0.85rem" };
const inputStyle = { width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" };