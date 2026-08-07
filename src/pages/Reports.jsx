import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { getReportData } from "../api/masterApi";

/*
 * ============================================================
 * REPORT CATALOG
 * ============================================================
 *
 * Existing backend report IDs are retained:
 * birth, death, sales, incoming, dattu, milk, govardhana
 *
 * New reports will be added to this catalog later.
 */

const REPORT_CATEGORIES = [
  {
    id: "cattle",
    label: "Cattle Management",
    description:
      "Birth, admission, herd exit and mortality reports.",
  },
  {
    id: "operations",
    label: "Daily Operations",
    description:
      "Milk, feeding and waste-management reports.",
  },
  {
    id: "sponsorship",
    label: "Sponsorship & Finance",
    description:
      "Sponsor, sponsorship and payment-related reports.",
  },
  {
    id: "management",
    label: "Management",
    description:
      "Consolidated operational and financial summaries.",
  },
];

const REPORT_TYPES = [
  {
    id: "cattle-register",
    label: "Cattle Register",
    shortLabel: "Cattle",
    category: "cattle",
    description:
      "Complete cattle register with identity and admission details.",
    dateRequired: true,
    searchEnabled: false,

    filters: [
      {
        id: "status",
        label: "Status",
        rowKey: "status",
        allLabel: "All Statuses",
      },
      {
        id: "shed",
        label: "Shed",
        rowKey: "shed",
        allLabel: "All Sheds",
      },
      {
        id: "gender",
        label: "Gender",
        rowKey: "gender",
        allLabel: "All Genders",
      },
      {
        id: "category",
        label: "Category",
        rowKey: "category",
        allLabel: "All Categories",
      },
      {
        id: "breed",
        label: "Breed",
        rowKey: "breed",
        allLabel: "All Breeds",
      },
      {
        id: "admissionType",
        label: "Admission Type",
        rowKey: "admissionType",
        allLabel: "All Admission Types",
      },
    ],

    columns: [
      { label: "Sl.No", key: "slno" },
      { label: "Internal ID", key: "internalId" },
      { label: "Tag Number", key: "tagNumber" },
      {
  label: "Name ",
  key: "name",
},
      { label: "Gender", key: "gender" },
      { label: "Category", key: "category" },
      { label: "Breed", key: "breed" },
      { label: "Shed", key: "shed" },
      { label: "Status", key: "status" },
      { label: "Admission Date", key: "admissionDate" },
      { label: "Admission Type", key: "admissionType" },
      { label: "Admission Age", key: "admissionAge" },
    ],
  },

  {
    id: "birth",
    label: "Birth Report",
    shortLabel: "Births",
    category: "cattle",
    description:
      "Birth records with calf, mother and father details.",
    dateRequired: true,

filters: [
  {
    id: "gender",
    label: "Gender",
    rowKey: "gender",
    allLabel: "All Genders",
  },
  {
    id: "breed",
    label: "Breed",
    rowKey: "breed",
    allLabel: "All Breeds",
  },
  {
    id: "status",
    label: "Status",
    rowKey: "status",
    allLabel: "All Statuses",
  },
],

columns: [
      {
        label: "Sl.No",
        key: "slno",
      },
      {
        label: "Date",
        key: "date",
      },
      {
        label: "Time",
        key: "time",
      },
      {
        label: "Name",
        key: "name",
      },
      {
        label: "Breed",
        key: "breed",
      },
      {
        label: "Gender",
        key: "gender",
      },
      {
        label: "Color",
        key: "color",
      },
      {
        label: "Mother Breed",
        key: "momBreed",
      },
      {
        label: "Mother Tag",
        key: "momTag",
      },
      {
        label: "Father Breed",
        key: "dadBreed",
      },
      {
        label: "Father Tag",
        key: "dadTag",
      },
      {
        label: "Status",
        key: "status",
      },
    ],
  },
  {
  id: "death",
  label: "Death Report",
  shortLabel: "Deaths",
  category: "cattle",
  description:
    "Mortality records with cattle identity and cause details.",
  dateRequired: true,

  filters: [
    {
      id: "gender",
      label: "Gender",
      rowKey: "gender",
      allLabel: "All Genders",
    },
    {
      id: "breed",
      label: "Breed",
      rowKey: "breed",
      allLabel: "All Breeds",
    },
    {
      id: "shed",
      label: "Shed",
      rowKey: "shed",
      allLabel: "All Sheds",
    },
    {
      id: "causeCategory",
      label: "Cause Category",
      rowKey: "causeCategory",
      allLabel: "All Cause Categories",
    },
  ],

  columns: [
    {
      label: "Sl.No",
      key: "slno",
    },
    {
      label: "Date",
      key: "date",
    },
    {
      label: "Time",
      key: "time",
    },
    {
      label: "Internal ID",
      key: "internalId",
    },
    {
      label: "Tag Number",
      key: "tagNumber",
    },
    {
      label: "Name",
      key: "name",
    },
    {
      label: "Breed",
      key: "breed",
    },
    {
      label: "Gender",
      key: "gender",
    },
    {
      label: "Shed",
      key: "shed",
    },
    {
      label: "Cause Category",
      key: "causeCategory",
    },
    {
      label: "Specific Cause",
      key: "causeDetails",
    },
    {
      label: "Age",
      key: "age",
    },
    {
      label: "Certified By",
      key: "doctor",
    },
    {
      label: "Remarks",
      key: "remarks",
    },
  ],
},
  {
  id: "sales",
  label: "Sales Report",
  shortLabel: "Sales",
  category: "cattle",
  description:
    "Cattle sale records with buyer and transaction details.",
  dateRequired: true,
  searchEnabled: true,

  filters: [
    {
      id: "gender",
      label: "Gender",
      rowKey: "gender",
      allLabel: "All Genders",
    },
    {
      id: "category",
      label: "Category",
      rowKey: "category",
      allLabel: "All Categories",
    },
    {
      id: "breed",
      label: "Breed",
      rowKey: "breed",
      allLabel: "All Breeds",
    },
    {
      id: "shed",
      label: "Shed",
      rowKey: "shed",
      allLabel: "All Sheds",
    },
  ],

  columns: [
    {
      label: "Sl.No",
      key: "slno",
    },
    {
      label: "Sale Date",
      key: "saleDate",
    },
    {
      label: "Time",
      key: "time",
    },
    {
      label: "Internal ID",
      key: "internalId",
    },
    {
      label: "Tag Number",
      key: "tagNumber",
    },
    {
      label: "Name",
      key: "name",
    },
    {
      label: "Gender",
      key: "gender",
    },
    {
      label: "Category",
      key: "category",
    },
    {
      label: "Breed",
      key: "breed",
    },
    {
      label: "Shed",
      key: "shed",
    },
    {
      label: "Buyer Name",
      key: "buyerName",
    },
    {
      label: "Contact",
      key: "buyerContact",
    },
    {
      label: "Receipt No",
      key: "receiptNumber",
    },
    {
      label: "Gate Pass",
      key: "gatePass",
    },
    {
      label: "Reference No",
      key: "referenceNumber",
    },
    {
      label: "Amount",
      key: "amount",
      numeric: true,
    },
    {
      label: "Remarks",
      key: "remarks",
    },
  ],
},
  {
  id: "incoming",
  label: "Incoming Report",
  shortLabel: "Admissions",
  category: "cattle",
  description:
    "Incoming cattle and admission-source details.",
  dateRequired: true,
  searchEnabled: false,

  filters: [
    {
      id: "admissionType",
      label: "Admission Type",
      rowKey: "admissionType",
      allLabel: "All Admission Types",
    },
    {
      id: "shed",
      label: "Shed",
      rowKey: "shed",
      allLabel: "All Sheds",
    },
    {
      id: "gender",
      label: "Gender",
      rowKey: "gender",
      allLabel: "All Genders",
    },
    {
      id: "category",
      label: "Category",
      rowKey: "category",
      allLabel: "All Categories",
    },
    {
      id: "breed",
      label: "Breed",
      rowKey: "breed",
      allLabel: "All Breeds",
    },
    {
      id: "status",
      label: "Status",
      rowKey: "status",
      allLabel: "All Statuses",
    },
  ],

  columns: [
    {
      label: "Sl.No",
      key: "slno",
    },
    {
      label: "Admission Date",
      key: "admissionDate",
    },
    {
      label: "Internal ID",
      key: "internalId",
    },
    {
      label: "Tag Number",
      key: "tagNumber",
    },
    {
      label: "Name",
      key: "name",
    },
    {
      label: "Gender",
      key: "gender",
    },
    {
      label: "Category",
      key: "category",
    },
    {
      label: "Breed",
      key: "breed",
    },
    {
      label: "Shed",
      key: "shed",
    },
    {
      label: "Status",
      key: "status",
    },
    {
      label: "Admission Type",
      key: "admissionType",
    },
    {
      label: "Admission Age",
      key: "admissionAge",
    },
    {
      label: "Source Name",
      key: "sourceName",
    },
    {
      label: "Source Mobile",
      key: "sourceMobile",
    },
    {
      label: "Admission Weight",
      key: "admissionWeight",
    },
    {
      label: "Purchase Price",
      key: "purchasePrice",
      numeric: true,
    },
    {
      label: "Remarks",
      key: "remarks",
    },
  ],
},
  {
    id: "milk",
    label: "Daily Milk Report",
    shortLabel: "Milk",
    category: "operations",
    description:
      "Daily milk production and distribution summary.",
    dateRequired: true,
    filters: [],
    columns: [
      {
        label: "Sl.No",
        key: "slno",
      },
      {
        label: "Date",
        key: "date",
      },
      {
        label: "AM Yield",
        key: "amYield",
        numeric: true,
      },
      {
        label: "AM Good",
        key: "amGood",
        numeric: true,
      },
      {
        label: "AM Colostrum",
        key: "amCol",
        numeric: true,
      },
      {
        label: "PM Yield",
        key: "pmYield",
        numeric: true,
      },
      {
        label: "PM Good",
        key: "pmGood",
        numeric: true,
      },
      {
        label: "PM Colostrum",
        key: "pmCol",
        numeric: true,
      },
      {
        label: "Temple",
        key: "temple",
        numeric: true,
      },
      {
        label: "Workers",
        key: "workers",
        numeric: true,
      },
      {
        label: "Calves/Bulls",
        key: "bulls",
        numeric: true,
      },
      {
        label: "Total Yield",
        key: "totalYield",
        numeric: true,
      },
      {
        label: "Total Dist",
        key: "totalLeftByProd",
        numeric: true,
      },
    ],
  },
  {
    id: "govardhana",
    label: "Govardhana Outgoing",
    shortLabel: "Outgoing",
    category: "operations",
    description:
      "Milk and by-product quantities and calculated values.",
    dateRequired: true,

filters: [
  {
    id: "sector",
    label: "Sector",
    rowKey: "sector",
    allLabel: "All Sectors",
  },
],

columns: [
      {
        label: "Sl.No",
        key: "slno",
      },
      {
        label: "Date",
        key: "date",
      },
      {
        label: "Invoice",
        key: "invoice",
      },
      {
        label: "Sector",
        key: "sector",
      },
      {
        label: "Milk (Kg)",
        key: "milkQty",
        numeric: true,
      },
      {
        label: "Milk (Rs)",
        key: "milkRs",
        numeric: true,
      },
      {
        label: "Dung (Kg)",
        key: "dungQty",
        numeric: true,
      },
      {
        label: "Dung (Rs)",
        key: "dungRs",
        numeric: true,
      },
      {
        label: "Urine (L)",
        key: "urineQty",
        numeric: true,
      },
      {
        label: "Urine (Rs)",
        key: "urineRs",
        numeric: true,
      },
      {
        label: "Total (Rs)",
        key: "totalAmount",
        numeric: true,
      },
    ],
  },
  {
  id: "dattu",
  label: "Sponsorship Report",
  shortLabel: "Sponsorships",
  category: "sponsorship",
  description:
    "Sponsorship commitments, receipts, balances and current status.",
  dateRequired: true,
  searchEnabled: true,

  filters: [
    {
      id: "category",
      label: "Category",
      rowKey: "category",
      allLabel: "All Categories",
    },
    {
      id: "schemeName",
      label: "Scheme",
      rowKey: "schemeName",
      allLabel: "All Schemes",
    },
    {
      id: "displayStatus",
      label: "Status",
      rowKey: "displayStatus",
      allLabel: "All Statuses",
    },
  ],

  columns: [
    {
      label: "Sl.No",
      key: "slno",
    },
    {
      label: "Start Date",
      key: "startDate",
    },
    {
      label: "Sponsorship ID",
      key: "sponsorshipId",
    },
    {
      label: "Sponsor",
      key: "donorName",
    },
    {
      label: "Category",
      key: "category",
    },
    {
      label: "Scheme",
      key: "schemeName",
    },
    {
      label: "Cattle ID",
      key: "cattleInternalId",
    },
    {
      label: "End Date",
      key: "endDate",
    },
    {
      label: "Committed",
      key: "committedAmount",
      numeric: true,
    },
    {
      label: "Received",
      key: "receivedAmount",
      numeric: true,
    },
    {
      label: "Balance",
      key: "balanceAmount",
      numeric: true,
    },
    {
      label: "Payments",
      key: "paymentCount",
      numeric: true,
    },
    {
      label: "Last Payment",
      key: "lastPaymentDate",
    },
    {
      label: "Status",
      key: "displayStatus",
    },
  ],
},
];

const REPORTS_WITH_TOTALS = [
  "sales",
  "dattu",
  "milk",
  "govardhana",
];

const DEFAULT_ROWS_PER_PAGE = 10;

/*
 * ============================================================
 * DATE HELPERS
 * ============================================================
 */

function getLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDefaultDates() {
  const today = new Date();

  const firstDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  );

  return {
    fromDate: getLocalIsoDate(firstDay),
    toDate: getLocalIsoDate(today),
  };
}

function formatDateForDisplay(value) {
  if (!value) {
    return "-";
  }

  const text = String(value).trim();

  const isoMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (isoMatch) {
    return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  }

  return text;
}

/*
 * ============================================================
 * VALUE HELPERS
 * ============================================================
 */

function safeCellValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  return value;
}

function escapeCsvValue(value) {
  const text =
    value === null ||
    value === undefined
      ? ""
      : String(value);

  return `"${text.replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(
    value === null ||
      value === undefined
      ? ""
      : value,
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/*
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export default function Reports() {
  const defaultDates = useMemo(
    () => getDefaultDates(),
    [],
  );

  const [activeCategory, setActiveCategory] =
    useState("all");

 const [activeReportId, setActiveReportId] =
  useState("cattle-register");

  const [reportSearch, setReportSearch] =
    useState("");

  const [tableSearch, setTableSearch] =
    useState("");
    const [
  reportFilters,
  setReportFilters,
] = useState({});

  const [fromDate, setFromDate] = useState(
    defaultDates.fromDate,
  );

  const [toDate, setToDate] = useState(
    defaultDates.toDate,
  );

  const [rows, setRows] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [hasGenerated, setHasGenerated] =
    useState(false);

  const [
    lastGeneratedOn,
    setLastGeneratedOn,
  ] = useState(null);

  const [
    rowsPerPage,
    setRowsPerPage,
  ] = useState(DEFAULT_ROWS_PER_PAGE);

  const [currentPage, setCurrentPage] =
    useState(1);

  const activeReport = useMemo(() => {
    return (
      REPORT_TYPES.find(
        (report) =>
          report.id === activeReportId,
      ) || REPORT_TYPES[0]
    );
  }, [activeReportId]);

  const visibleReports = useMemo(() => {
    const searchText = reportSearch
      .trim()
      .toLowerCase();

    return REPORT_TYPES.filter(
      (report) => {
        const matchesCategory =
          activeCategory === "all" ||
          report.category ===
            activeCategory;

        const matchesSearch =
          !searchText ||
          report.label
            .toLowerCase()
            .includes(searchText) ||
          report.description
            .toLowerCase()
            .includes(searchText);

        return (
          matchesCategory &&
          matchesSearch
        );
      },
    );
  }, [
    activeCategory,
    reportSearch,
  ]);

  const dynamicFilterOptions =
  useMemo(() => {
    const result = {};

    const filterDefinitions =
      activeReport.filters || [];

    filterDefinitions.forEach(
      (filterDefinition) => {
        const values = rows
          .map((row) =>
            String(
              row[
                filterDefinition.rowKey
              ] ?? "",
            ).trim(),
          )
          .filter(
            (value) =>
              value &&
              value !== "-",
          );

        result[
          filterDefinition.id
        ] = Array.from(
          new Set(values),
        ).sort((first, second) =>
          first.localeCompare(
            second,
            undefined,
            {
              numeric: true,
              sensitivity: "base",
            },
          ),
        );
      },
    );

    return result;
  }, [rows, activeReport]);

  const filteredRows = useMemo(() => {
  const searchText = tableSearch
    .trim()
    .toLowerCase();

  const filterDefinitions =
    activeReport.filters || [];

  return rows.filter((row) => {
    const matchesSearch =
      !searchText ||
      activeReport.columns.some(
        (column) =>
          String(
            row[column.key] ?? "",
          )
            .toLowerCase()
            .includes(searchText),
      );

    if (!matchesSearch) {
      return false;
    }

    const matchesDynamicFilters =
      filterDefinitions.every(
        (filterDefinition) => {
          const selectedValue =
            String(
              reportFilters[
                filterDefinition.id
              ] ?? "",
            ).trim();

          if (!selectedValue) {
            return true;
          }

          const rowValue = String(
            row[
              filterDefinition.rowKey
            ] ?? "",
          ).trim();

          return (
            rowValue.toLowerCase() ===
            selectedValue.toLowerCase()
          );
        },
      );

    return matchesDynamicFilters;
  });
}, [
  rows,
  tableSearch,
  activeReport,
  reportFilters,
]);

  const totals = useMemo(() => {
    if (
      !filteredRows.length ||
      !REPORTS_WITH_TOTALS.includes(
        activeReport.id,
      )
    ) {
      return {};
    }

    const sums = {};

    activeReport.columns.forEach(
      (column) => {
        if (!column.numeric) {
          return;
        }

        const total =
          filteredRows.reduce(
            (sum, row) => {
              const value = Number(
                row[column.key],
              );

              return (
                sum +
                (Number.isFinite(value)
                  ? value
                  : 0)
              );
            },
            0,
          );

        sums[column.key] =
          Math.round(total * 100) /
          100;
      },
    );

    return sums;
  }, [
    filteredRows,
    activeReport,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRows.length /
        rowsPerPage,
    ),
  );

  const paginatedRows = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      rowsPerPage;

    return filteredRows.slice(
      startIndex,
      startIndex + rowsPerPage,
    );
  }, [
    filteredRows,
    currentPage,
    rowsPerPage,
  ]);

  const reportStatistics = useMemo(() => {
    const availableReports =
      REPORT_TYPES.length;

    const categories =
      REPORT_CATEGORIES.filter(
        (category) =>
          REPORT_TYPES.some(
            (report) =>
              report.category ===
              category.id,
          ),
      ).length;

    const currentRecords =
      filteredRows.length;

    return {
      availableReports,
      categories,
      currentRecords,
      generated:
        hasGenerated &&
        rows.length >= 0
          ? 1
          : 0,
    };
  }, [
    filteredRows.length,
    hasGenerated,
    rows.length,
  ]);

  const pageStart =
    filteredRows.length === 0
      ? 0
      : (currentPage - 1) *
          rowsPerPage +
        1;

  const pageEnd = Math.min(
    currentPage * rowsPerPage,
    filteredRows.length,
  );

  useEffect(() => {
  setCurrentPage(1);
}, [
  tableSearch,
  reportFilters,
  rowsPerPage,
  activeReportId,
]);

 useEffect(() => {
  setRows([]);
  setTableSearch("");
  setReportFilters({});
  setError("");
  setHasGenerated(false);
  setLastGeneratedOn(null);
  setCurrentPage(1);
}, [activeReportId]);

  async function loadReport() {
    if (
      activeReport.dateRequired &&
      fromDate &&
      toDate &&
      fromDate > toDate
    ) {
      setError(
        "From Date cannot be later than To Date.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await getReportData(
          activeReport.id,
          fromDate,
          toDate,
        );

      let rawData = [];

      if (
        response &&
        response.data &&
        Array.isArray(response.data)
      ) {
        rawData = response.data;
      } else if (
        Array.isArray(response)
      ) {
        rawData = response;
      }

      const processedRows =
        rawData.map(
          (row, index) => ({
            ...row,
            slno: index + 1,
          }),
        );

      setRows(processedRows);
      setHasGenerated(true);
      setLastGeneratedOn(
        new Date(),
      );
      setCurrentPage(1);
    } catch (loadError) {
      console.error(
        "Report Error:",
        loadError,
      );

      setRows([]);
      setHasGenerated(true);

      setError(
        loadError?.message ||
          "Unable to generate the report. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSelectReport(
  reportId,
) {
  setActiveReportId(reportId);
  setTableSearch("");
  setReportFilters({});
  setCurrentPage(1);
  setError("");
}

function handleReportFilterChange(
  filterId,
  value,
) {
  setReportFilters(
    (currentFilters) => ({
      ...currentFilters,
      [filterId]: value,
    }),
  );

  setCurrentPage(1);
  setError("");
}

  function handleClearFilters() {
  setFromDate("");
  setToDate("");
  setTableSearch("");
  setReportFilters({});

  setRows([]);
  setHasGenerated(false);
  setLastGeneratedOn(null);

  setError("");
  setCurrentPage(1);
}

  function handleExportCsv() {
    if (!filteredRows.length) {
      setError(
        "Generate a report before exporting CSV.",
      );
      return;
    }

    setError("");

    const headers =
      activeReport.columns.map(
        (column) =>
          escapeCsvValue(
            column.label,
          ),
      );

    const dataRows =
      filteredRows.map((row) =>
        activeReport.columns
          .map((column) =>
            escapeCsvValue(
              row[column.key] ?? "",
            ),
          )
          .join(","),
      );

    const csvContent = [
      headers.join(","),
      ...dataRows,
    ].join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type:
          "text/csv;charset=utf-8;",
      },
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;

    anchor.download = `${
      activeReport.id
    }-${fromDate || "all"}-${
      toDate || "all"
    }.csv`;

    document.body.appendChild(
      anchor,
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  function handlePrint() {
  if (!filteredRows.length) {
    setError(
      "Generate a report before printing.",
    );
    return;
  }

  setError("");

  const rowsHtml = filteredRows
    .map(
      (row) => `
        <tr>
          ${activeReport.columns
            .map(
              (column) =>
                `<td>${escapeHtml(
                  safeCellValue(
                    row[column.key],
                  ),
                )}</td>`,
            )
            .join("")}
        </tr>
      `,
    )
    .join("");

  let totalRowHtml = "";

  if (
    REPORTS_WITH_TOTALS.includes(
      activeReport.id,
    )
  ) {
    totalRowHtml = `
      <tr class="total-row">
        ${activeReport.columns
          .map((column) => {
            if (column.key === "slno") {
              return "<td>Total</td>";
            }

            if (
              totals[column.key] !==
              undefined
            ) {
              return `<td>${escapeHtml(
                totals[column.key],
              )}</td>`;
            }

            return "<td></td>";
          })
          .join("")}
      </tr>
    `;
  }

  const generatedText = lastGeneratedOn
    ? lastGeneratedOn.toLocaleString(
        "en-IN",
      )
    : new Date().toLocaleString(
        "en-IN",
      );

      const reportFileName = [
  activeReport.label
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, ""),

  formatDateForDisplay(fromDate),
  "to",
  formatDateForDisplay(toDate),
].join("_");

const originalDocumentTitle =
  document.title;

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />

        <title>${escapeHtml(
          activeReport.label,
        )}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 20px;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            color: #111827;
            background: #ffffff;
          }

          .header {
            text-align: center;
            margin-bottom: 18px;
          }

          .organisation {
            font-size: 20px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .report-title {
            margin-top: 6px;
            font-size: 15px;
            font-weight: 700;
          }

          .report-meta {
            margin-top: 5px;
            font-size: 10px;
            color: #475569;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
            font-size: 9px;
          }

          th,
          td {
            border: 1px solid #94a3b8;
            padding: 5px;
            text-align: left;
            vertical-align: top;
            word-break: break-word;
          }

          th {
            background: #f1f5f9;
            font-weight: 700;
          }

          .total-row td {
            background: #e2e8f0;
            font-weight: 700;
            border-top: 2px solid #334155;
          }

          .footer {
            display: flex;
            justify-content: space-between;
            gap: 80px;
            margin-top: 60px;
          }

          .signature {
            width: 220px;
            text-align: center;
            border-top: 1px solid #111827;
            padding-top: 6px;
            font-size: 11px;
            font-weight: 600;
          }

          @page {
            size: landscape;
            margin: 10mm;
          }

          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>

      <body>
        <div class="header">
          <div class="organisation">
            Madhava Srusti Rashtrotthana Goshala
          </div>

          <div class="report-title">
            ${escapeHtml(
              activeReport.label,
            )}
          </div>

          <div class="report-meta">
            Period:
            ${escapeHtml(
              formatDateForDisplay(
                fromDate,
              ),
            )}
            to
            ${escapeHtml(
              formatDateForDisplay(
                toDate,
              ),
            )}
            |
            Generated:
            ${escapeHtml(
              generatedText,
            )}
            |
            Records:
            ${filteredRows.length}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              ${activeReport.columns
                .map(
                  (column) =>
                    `<th>${escapeHtml(
                      column.label,
                    )}</th>`,
                )
                .join("")}
            </tr>
          </thead>

          <tbody>
            ${rowsHtml}
            ${totalRowHtml}
          </tbody>
        </table>

        <div class="footer">
          <div class="signature">
            Supervisor Signature
          </div>

          <div class="signature">
            Project Manager Signature
          </div>
        </div>
      </body>
    </html>
  `;

  const existingFrame =
    document.getElementById(
      "reports-print-frame",
    );

  if (existingFrame) {
    existingFrame.remove();
  }

  const printFrame =
    document.createElement("iframe");

  printFrame.id =
    "reports-print-frame";

  printFrame.setAttribute(
    "title",
    "Report print preview",
  );

  printFrame.style.position =
    "fixed";

  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "0";
  printFrame.style.visibility =
    "hidden";

  document.body.appendChild(
    printFrame,
  );

  const frameWindow =
    printFrame.contentWindow;

  const frameDocument =
    printFrame.contentDocument ||
    frameWindow?.document;

  if (
    !frameWindow ||
    !frameDocument
  ) {
    printFrame.remove();

    setError(
      "Unable to prepare the print view. Please try again.",
    );

    return;
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();
  frameDocument.title =
  reportFileName;

  printFrame.onload = () => {
  window.setTimeout(() => {
    let cleanedUp = false;

    const cleanupPrint = () => {
      if (cleanedUp) {
        return;
      }

      cleanedUp = true;

      document.title =
        originalDocumentTitle;

      window.setTimeout(() => {
        if (
          printFrame &&
          printFrame.parentNode
        ) {
          printFrame.remove();
        }
      }, 300);
    };

    try {
      /*
       * Chrome often uses the main browser-tab title
       * as the suggested Save as PDF filename, even
       * when an iframe is being printed.
       */
      document.title =
        reportFileName;

      frameWindow.document.title =
        reportFileName;

      frameWindow.addEventListener(
        "afterprint",
        cleanupPrint,
        {
          once: true,
        },
      );

      frameWindow.focus();
      frameWindow.print();

      /*
       * Fallback restoration in case the browser does
       * not dispatch the afterprint event.
       */
      window.setTimeout(() => {
        cleanupPrint();
      }, 30000);
    } catch (printError) {
      console.error(
        "Print Error:",
        printError,
      );

      cleanupPrint();

      setError(
        "Unable to open the print dialog. Please try again.",
      );
    }
  }, 300);
};
}

  return (
    <div
      style={styles.page}
      className="reports-page"
    >
      <header style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>
            Reports & Analytics
          </h1>

          <p style={styles.pageSubtitle}>
            Generate, review and
            export operational,
            veterinary, sponsorship and
            management reports.
          </p>
        </div>
      </header>

      

      <section style={styles.catalogCard}>
  <div className="reports-catalog-header">
    <div>
      <h2 style={styles.sectionTitle}>
        Important Reports
      </h2>

      <p style={styles.sectionSubtitle}>
        Select a report to view, download or print.
      </p>
    </div>

    <div className="reports-catalog-search">
      <label
        style={styles.fieldLabel}
        htmlFor="report-search"
      >
        Search Reports
      </label>

      <input
        id="report-search"
        type="search"
        value={reportSearch}
        onChange={(event) =>
          setReportSearch(
            event.target.value,
          )
        }
        placeholder="Search reports..."
        style={styles.input}
      />
    </div>
  </div>

  <div className="reports-selector-row">
    <span
  className="reports-selector-label"
  style={styles.selectorLabel}
>
      Categories
    </span>

    <div className="reports-category-list">
      <CategoryButton
        active={
          activeCategory === "all"
        }
        label="All Reports"
        onClick={() =>
          setActiveCategory("all")
        }
      />

      {REPORT_CATEGORIES.map(
        (category) => (
          <CategoryButton
            key={category.id}
            active={
              activeCategory ===
              category.id
            }
            label={category.label}
            onClick={() =>
              setActiveCategory(
                category.id,
              )
            }
          />
        ),
      )}
    </div>
  </div>

  <div className="reports-selector-row">
    <span
  className="reports-selector-label"
  style={styles.selectorLabel}
>
      Reports
    </span>

    <div className="reports-button-list">
      {visibleReports.length === 0 ? (
        <span style={styles.noReportsCompact}>
          No reports found.
        </span>
      ) : (
        visibleReports.map((report) => (
          <button
            type="button"
            key={report.id}
            onClick={() =>
              handleSelectReport(
                report.id,
              )
            }
            title={report.description}
            style={{
              ...styles.reportButton,
              ...(activeReport.id ===
              report.id
                ? styles.reportButtonActive
                : {}),
            }}
          >
            {report.label}

            {report.legacy && (
              <span
                style={
                  styles.reportLegacyMark
                }
              >
                Legacy
              </span>
            )}
          </button>
        ))
      )}
    </div>
  </div>
</section>

      <section
        style={styles.workspaceCard}
      >
        <div className="reports-workspace-header">
  <div
  className="reports-selected-row"
  style={styles.selectedReportRow}
>
    <span style={styles.selectedReportLabel}>
      Selected Report
    </span>

    <h2 style={styles.workspaceTitle}>
      {activeReport.label}
    </h2>
  </div>

  <div
  className="reports-generated-status"
  style={styles.generatedStatus}
>
    {lastGeneratedOn
      ? `Generated ${lastGeneratedOn.toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
          },
        )}`
      : "Not generated"}
  </div>
</div>

        <div style={styles.filterSection}>
  <div style={styles.filterSectionHeader}>
    SEARCH & FILTERS
  </div>

  <div className="reports-filter-grid">
  {activeReport.searchEnabled !== false && (
  <div style={styles.fieldGroup}>
    <label
      style={styles.fieldLabel}
      htmlFor="table-search"
    >
      Search Results
    </label>

    <input
      id="table-search"
      type="search"
      value={tableSearch}
      onChange={(event) =>
        setTableSearch(
          event.target.value,
        )
      }
      placeholder="Search generated report..."
      style={styles.input}
      disabled={
        !hasGenerated ||
        loading
      }
    />
  </div>
)}

  {activeReport.dateRequired && (
    <>
      <div style={styles.fieldGroup}>
        <label
          style={styles.fieldLabel}
          htmlFor="from-date"
        >
          From Date
        </label>

        <input
  id="from-date"
  type="date"
  value={fromDate}
  onChange={(event) =>
    setFromDate(event.target.value)
  }
  max={toDate || undefined}
  style={styles.input}
/>
      </div>

      <div style={styles.fieldGroup}>
        <label
          style={styles.fieldLabel}
          htmlFor="to-date"
        >
          To Date
        </label>

        <input
  id="to-date"
  type="date"
  value={toDate}
  onChange={(event) =>
    setToDate(event.target.value)
  }
  min={fromDate || undefined}
  style={styles.input}
/>
      </div>
    </>
  )}

  {(activeReport.filters || []).map(
    (filterDefinition) => (
      <div
        key={filterDefinition.id}
        style={styles.fieldGroup}
      >
        <label
          style={styles.fieldLabel}
          htmlFor={`report-filter-${filterDefinition.id}`}
        >
          {filterDefinition.label}
        </label>

        <select
          id={`report-filter-${filterDefinition.id}`}
          value={
            reportFilters[
              filterDefinition.id
            ] || ""
          }
          onChange={(event) =>
            handleReportFilterChange(
              filterDefinition.id,
              event.target.value,
            )
          }
          style={styles.input}
          disabled={
            !hasGenerated ||
            loading
          }
        >
          <option value="">
            {filterDefinition.allLabel ||
              `All ${filterDefinition.label}`}
          </option>

          {(
            dynamicFilterOptions[
              filterDefinition.id
            ] || []
          ).map((optionValue) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {optionValue}
            </option>
          ))}
        </select>
      </div>
    ),
  )}
</div>

<div className="reports-action-row">
  <div className="reports-primary-actions">
    <button
      type="button"
      onClick={loadReport}
      disabled={loading}
      style={{
        ...styles.primaryButton,
        ...(loading
          ? styles.disabledButton
          : {}),
      }}
    >
      {loading
        ? "Generating..."
        : "Generate Report"}
    </button>

    <button
      type="button"
      onClick={handleClearFilters}
      disabled={loading}
      style={styles.secondaryButton}
    >
      Clear Filters
    </button>
  </div>

  <div className="reports-export-actions">
    <button
      type="button"
      onClick={handleExportCsv}
      disabled={
        loading ||
        !filteredRows.length
      }
      style={{
        ...styles.secondaryButton,
        ...(!filteredRows.length ||
        loading
          ? styles.disabledButton
          : {}),
      }}
    >
      Export CSV
    </button>

    <button
      type="button"
      onClick={handlePrint}
      disabled={
        loading ||
        !filteredRows.length
      }
      style={{
        ...styles.secondaryButton,
        ...(!filteredRows.length ||
        loading
          ? styles.disabledButton
          : {}),
      }}
    >
      Print / PDF
    </button>
  </div>
</div>

{error && (
  <div style={styles.errorBox}>
    {error}
  </div>
)}
</div>
</section>

<section style={styles.tableCard}>
  <div className="reports-table-topbar">
    <div>
      <h3 style={styles.tableTitle}>
        Report Results
      </h3>

      <p style={styles.tableSubtitle}>
        {hasGenerated
          ? `Showing ${pageStart}-${pageEnd} of ${filteredRows.length} filtered records`
          : "Select filters and generate the report."}
      </p>
    </div>

    <div
  className="reports-pagination-controls"
  style={styles.paginationControls}
>
      <label
        htmlFor="rows-per-page"
        style={styles.paginationLabel}
      >
        Rows per page
      </label>

      <select
        id="rows-per-page"
        value={rowsPerPage}
        onChange={(event) =>
          setRowsPerPage(
            Number(event.target.value),
          )
        }
        style={styles.select}
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    </div>
  </div>

  <div className="reports-table-scroll-hint">
  Swipe sideways to view all columns
</div>

<div className="reports-table-scroll">
    <table style={styles.table}>
            <thead>
              <tr>
                {activeReport.columns.map(
                  (column) => (
                    <th
                      key={column.key}
                      style={styles.th}
                    >
                      {column.label}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={
                      activeReport
                        .columns.length
                    }
                    style={
                      styles.stateCell
                    }
                  >
                    Generating report...
                  </td>
                </tr>
              ) : !hasGenerated ? (
                <tr>
                  <td
                    colSpan={
                      activeReport
                        .columns.length
                    }
                    style={
                      styles.stateCell
                    }
                  >
                    Select the required
                    report and filters,
                    then click Generate
                    Report.
                  </td>
                </tr>
              ) : filteredRows.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={
                      activeReport
                        .columns.length
                    }
                    style={
                      styles.stateCell
                    }
                  >
                    No records found for
                    the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map(
                  (row, rowIndex) => (
                    <tr
                      key={`${activeReport.id}-${row.slno}-${rowIndex}`}
                      style={
                        rowIndex % 2 ===
                        0
                          ? styles.evenRow
                          : styles.oddRow
                      }
                    >
                      {activeReport.columns.map(
                        (column) => (
                          <td
                            key={
                              column.key
                            }
                            style={{
                              ...styles.td,
                              ...(column.numeric
                                ? styles.numericCell
                                : {}),
                            }}
                          >
                            {[
  "date",
  "admissionDate",
  "dateOfBirth",
  "expiry",
].includes(column.key)
  ? formatDateForDisplay(
      row[column.key],
    )
  : safeCellValue(
      row[column.key],
    )}
                          </td>
                        ),
                      )}
                    </tr>
                  ),
                )
              )}
            </tbody>

            {filteredRows.length >
              0 &&
              REPORTS_WITH_TOTALS.includes(
                activeReport.id,
              ) && (
                <tfoot>
                  <tr
                    style={
                      styles.totalRow
                    }
                  >
                    {activeReport.columns.map(
                      (column) => (
                        <td
                          key={
                            column.key
                          }
                          style={{
                            ...styles.totalCell,
                            ...(column.numeric
                              ? styles.numericCell
                              : {}),
                          }}
                        >
                          {column.key ===
                          "slno"
                            ? "Total"
                            : totals[
                                column
                                  .key
                              ] ??
                              ""}
                        </td>
                      ),
                    )}
                  </tr>
                </tfoot>
              )}
          </table>
        </div>

        <div className="reports-table-footer">
          <span style={styles.pageText}>
            Page {currentPage} of{" "}
            {totalPages}
          </span>

          <div className="reports-page-buttons">
            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1,
                    ),
                )
              }
              disabled={
                currentPage === 1 ||
                !filteredRows.length
              }
              style={{
                ...styles.secondaryButton,
                ...(currentPage === 1 ||
                !filteredRows.length
                  ? styles.disabledButton
                  : {}),
              }}
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      totalPages,
                      page + 1,
                    ),
                )
              }
              disabled={
                currentPage >=
                  totalPages ||
                !filteredRows.length
              }
              style={{
                ...styles.secondaryButton,
                ...(currentPage >=
                  totalPages ||
                !filteredRows.length
                  ? styles.disabledButton
                  : {}),
              }}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="reports-custom-card">
        <div>
          <h2
            style={
              styles.customReportTitle
            }
          >
            Custom Reports
          </h2>

          <p
            style={
              styles.customReportText
            }
          >
            Custom column selection,
            grouping and advanced filters
            will be introduced after the
            predefined reports are
            completed and validated.
          </p>
        </div>

        <span
          style={
            styles.comingSoonBadge
          }
        >
          Planned
        </span>
      </section>

      <style>{`
  .reports-page {
    width: 100%;
    max-width: 1600px;
    min-width: 0;
    margin: 0 auto;
  }

  .reports-catalog-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 0.875rem;
    margin-bottom: 0.875rem;
  }

  .reports-catalog-search {
    width: 100%;
    max-width: 330px;
  }

  .reports-selector-row {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr);
    align-items: start;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  .reports-category-list,
  .reports-button-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    min-width: 0;
  }

  .reports-workspace-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.8rem 1.125rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .reports-filter-grid {
    display: grid;
    grid-template-columns:
      repeat(4, minmax(180px, 1fr));
    gap: 0.75rem;
    align-items: end;
  }

  .reports-action-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.875rem;
  }

  .reports-primary-actions,
  .reports-export-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .reports-table-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.95rem 1.125rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .reports-table-scroll-hint {
    display: none;
    padding: 0.65rem 1rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #64748b;
    font-size: 0.76rem;
    text-align: center;
  }

  .reports-table-scroll {
    width: 100%;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
  }

  .reports-table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.625rem;
    padding: 0.7rem 1.125rem;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .reports-page-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .reports-custom-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.25rem;
    padding: 1.125rem;
    border: 1px dashed #cbd5e1;
    border-radius: 10px;
    background: #f8fafc;
  }

  @media (max-width: 1200px) {
    .reports-filter-grid {
      grid-template-columns:
        repeat(3, minmax(180px, 1fr));
    }
  }

  @media (max-width: 1024px) {
    .reports-filter-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .reports-page {
      padding: 0 !important;
    }

    .reports-page button,
    .reports-page input,
    .reports-page select {
      min-height: 44px;
    }

    .reports-catalog-header {
      align-items: stretch;
    }

    .reports-catalog-search {
      max-width: none;
    }

    .reports-selector-row {
      grid-template-columns: minmax(0, 1fr);
      gap: 0.5rem;
    }

    .reports-selector-label {
      padding-top: 0 !important;
    }

    .reports-category-list {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .reports-button-list {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .reports-category-list button,
    .reports-button-list button {
      width: 100%;
      white-space: normal !important;
      text-align: center;
      line-height: 1.3;
    }

    .reports-workspace-header {
      align-items: flex-start;
    }

    .reports-selected-row {
      width: 100%;
    }

    .reports-generated-status {
      width: 100%;
    }

    .reports-filter-grid {
      grid-template-columns:
        minmax(0, 1fr);
    }

    .reports-action-row {
      align-items: stretch;
    }

    .reports-primary-actions,
    .reports-export-actions {
      width: 100%;
    }

    .reports-primary-actions button,
    .reports-export-actions button {
      flex: 1 1 140px;
    }

    .reports-table-topbar {
      align-items: flex-start;
    }

    .reports-pagination-controls {
      width: 100%;
      justify-content: space-between;
    }

    .reports-table-scroll-hint {
      display: block;
    }

    .reports-table-footer {
      align-items: stretch;
    }

    .reports-page-buttons {
      width: 100%;
    }

    .reports-page-buttons button {
      flex: 1;
    }

    .reports-custom-card {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  @media (max-width: 420px) {
    .reports-category-list,
    .reports-button-list {
      grid-template-columns:
        minmax(0, 1fr);
    }

    .reports-primary-actions,
    .reports-export-actions {
      display: grid;
      grid-template-columns:
        minmax(0, 1fr);
    }

    .reports-primary-actions button,
    .reports-export-actions button {
      width: 100%;
    }
  }
`}</style>
    </div>
  );
}

/*
 * ============================================================
 * SMALL PRESENTATIONAL COMPONENTS
 * ============================================================
 */



function CategoryButton({
  active,
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.categoryButton,
        ...(active
          ? styles.categoryButtonActive
          : {}),
      }}
    >
      {label}
    </button>
  );
}

/*
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = {
  page: {
  minHeight: "100%",
  width: "100%",
  maxWidth: "1600px",
  minWidth: 0,
  margin: "0 auto",
  background: "#f3f4f6",
  color: "#0f172a",
},

  pageHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "14px",
},

  pageTitle: {
  margin: 0,
  fontSize: "1.7rem",
  lineHeight: 1.2,
  fontWeight: 750,
  color: "#0f172a",
},

  pageSubtitle: {
  margin: "6px 0 0",
  fontSize: "0.95rem",
  lineHeight: 1.5,
  color: "#64748b",
},

  kpiGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
    marginBottom: "16px",
  },

  kpiCard: {
    minHeight: "92px",
    padding: "16px",
    border: "1px solid #dbe3ee",
    borderRadius: "10px",
    background: "#ffffff",
    boxShadow:
      "0 1px 2px rgba(15, 23, 42, 0.04)",
  },

  kpiLabel: {
    display: "block",
    marginBottom: "8px",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#64748b",
  },

  kpiValue: {
    display: "block",
    fontSize: "1.35rem",
    lineHeight: 1.1,
    color: "#0f172a",
  },

  kpiHelper: {
    display: "block",
    marginTop: "8px",
    fontSize: "0.72rem",
    color: "#94a3b8",
  },

  catalogCard: {
    marginBottom: "16px",
    padding: "18px",
    border: "1px solid #dbe3ee",
    borderRadius: "10px",
    background: "#ffffff",
    boxShadow:
      "0 1px 2px rgba(15, 23, 42, 0.04)",
  },

 compactCatalogHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  flexWrap: "wrap",
  gap: "14px",
  marginBottom: "14px",
},

reportSearchCompact: {
  width: "100%",
  maxWidth: "330px",
},

compactSelectorRow: {
  display: "grid",
  gridTemplateColumns: "92px minmax(0, 1fr)",
  alignItems: "start",
  gap: "12px",
  marginTop: "12px",
},

selectorLabel: {
  paddingTop: "8px",
  fontSize: "0.82rem",
  fontWeight: 750,
  color: "#334155",
},

reportButtonList: {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
},

reportButton: {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  minHeight: "38px",
  padding: "8px 13px",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#334155",
  fontSize: "0.84rem",
  fontWeight: 650,
  cursor: "pointer",
  whiteSpace: "nowrap",
},

reportButtonActive: {
  borderColor: "#ea580c",
  background: "#fff7ed",
  color: "#c2410c",
  boxShadow:
    "0 0 0 1px rgba(234, 88, 12, 0.08)",
},

reportLegacyMark: {
  padding: "2px 5px",
  borderRadius: "999px",
  background: "#fef3c7",
  color: "#92400e",
  fontSize: "0.58rem",
  fontWeight: 750,
},

noReportsCompact: {
  display: "inline-block",
  padding: "9px 0",
  fontSize: "0.82rem",
  color: "#64748b",
}, 

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "14px",
  },

 sectionTitle: {
  margin: 0,
  fontSize: "1.05rem",
  fontWeight: 750,
  color: "#0f172a",
},

  sectionSubtitle: {
    margin: "4px 0 0",
    fontSize: "0.82rem",
    color: "#64748b",
  },

  categoryTabs: {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  margin: 0,
},

  categoryButton: {
  minHeight: "36px",
  padding: "7px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#475569",
  fontSize: "0.82rem",
  fontWeight: 650,
  cursor: "pointer",
},

  categoryButtonActive: {
    borderColor: "#ea580c",
    background: "#fff7ed",
    color: "#c2410c",
  },

  reportSearchRow: {
    display: "flex",
    marginBottom: "14px",
  },

  reportSearchField: {
    width: "100%",
    maxWidth: "520px",
  },

  reportGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "10px",
  },

  reportCard: {
    minHeight: "126px",
    padding: "14px",
    border: "1px solid #dbe3ee",
    borderRadius: "9px",
    background: "#ffffff",
    textAlign: "left",
    cursor: "pointer",
    transition:
      "border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
  },

  reportCardActive: {
    borderColor: "#ea580c",
    background: "#fff7ed",
    boxShadow:
      "0 0 0 1px rgba(234, 88, 12, 0.1)",
  },

  reportCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  reportIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "#fff7ed",
    color: "#ea580c",
    fontWeight: 800,
    fontSize: "0.76rem",
  },

  legacyBadge: {
    padding: "3px 7px",
    borderRadius: "999px",
    background: "#fef3c7",
    color: "#92400e",
    fontSize: "0.62rem",
    fontWeight: 700,
  },

  reportCardTitle: {
    display: "block",
    marginBottom: "6px",
    fontSize: "0.86rem",
    color: "#0f172a",
  },

  reportCardDescription: {
    display: "block",
    fontSize: "0.72rem",
    lineHeight: 1.45,
    color: "#64748b",
  },

  noReportsState: {
    gridColumn: "1 / -1",
    padding: "26px",
    border: "1px dashed #cbd5e1",
    borderRadius: "8px",
    textAlign: "center",
    fontSize: "0.8rem",
    color: "#64748b",
  },

  workspaceCard: {
    marginBottom: "16px",
    border: "1px solid #dbe3ee",
    borderRadius: "10px",
    background: "#ffffff",
    overflow: "hidden",
    boxShadow:
      "0 1px 2px rgba(15, 23, 42, 0.04)",
  },

  workspaceHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
  padding: "13px 18px",
  borderBottom: "1px solid #e2e8f0",
},

selectedReportRow: {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "10px",
},

selectedReportLabel: {
  fontSize: "0.78rem",
  fontWeight: 650,
  color: "#64748b",
},

generatedStatus: {
  fontSize: "0.76rem",
  fontWeight: 650,
  color: "#64748b",
},

  workspaceTitle: {
    margin: 0,
    fontSize: "1.08rem",
    fontWeight: 750,
    color: "#0f172a",
  },

  workspaceSubtitle: {
    margin: "5px 0 0",
    fontSize: "0.75rem",
    color: "#64748b",
  },

  workspaceStatus: {
    padding: "5px 9px",
    border: "1px solid #bbf7d0",
    borderRadius: "999px",
    background: "#f0fdf4",
    color: "#15803d",
    fontSize: "0.66rem",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  filterSection: {
    padding: "14px 18px 16px",
  },

  filterSectionHeader: {
  marginBottom: "12px",
  paddingBottom: "7px",
  borderBottom: "1px solid #fed7aa",
  color: "#ea580c",
  fontSize: "0.78rem",
  fontWeight: 800,
  letterSpacing: "0.03em",
},

  filterGrid: {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
  alignItems: "end",
},

  fieldGroup: {
    minWidth: 0,
  },

  fieldLabel: {
    display: "block",
    marginBottom: "6px",
    fontSize: "0.8rem",
    fontWeight: 650,
    color: "#334155",
  },

  input: {
  width: "100%",
  minHeight: "42px",
  padding: "9px 11px",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: "0.86rem",
  boxSizing: "border-box",
  outline: "none",
},

  select: {
    minHeight: "36px",
    padding: "7px 9px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "0.76rem",
  },

  actionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "14px",
  },

  primaryActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  exportActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  primaryButton: {
  minHeight: "40px",
  padding: "9px 16px",
  border: "1px solid #ea580c",
  borderRadius: "7px",
  background: "#ea580c",
  color: "#ffffff",
  fontSize: "0.84rem",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow:
    "0 2px 4px rgba(234, 88, 12, 0.2)",
},

  secondaryButton: {
  minHeight: "40px",
  padding: "9px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#334155",
  fontSize: "0.82rem",
  fontWeight: 650,
  cursor: "pointer",
},

  disabledButton: {
    cursor: "not-allowed",
    opacity: 0.5,
    boxShadow: "none",
  },

  errorBox: {
    marginTop: "12px",
    padding: "10px 12px",
    border: "1px solid #fecaca",
    borderRadius: "7px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "0.75rem",
  },

  tableCard: {
    marginBottom: "16px",
    border: "1px solid #dbe3ee",
    borderRadius: "10px",
    background: "#ffffff",
    overflow: "hidden",
    boxShadow:
      "0 1px 2px rgba(15, 23, 42, 0.04)",
  },

  tableTopBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    padding: "15px 18px",
    borderBottom: "1px solid #e2e8f0",
  },

  tableTitle: {
  margin: 0,
  fontSize: "1rem",
  fontWeight: 750,
  color: "#0f172a",
},

  tableSubtitle: {
  margin: "4px 0 0",
  fontSize: "0.8rem",
  color: "#64748b",
},

  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  paginationLabel: {
  fontSize: "0.78rem",
  fontWeight: 600,
  color: "#475569",
},

  tableScrollContainer: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
  width: "100%",
  minWidth: "920px",
  borderCollapse: "collapse",
  fontSize: "0.84rem",
},

  th: {
  padding: "12px 13px",
  borderBottom: "1px solid #dbe3ee",
  background: "#f8fafc",
  color: "#475569",
  textAlign: "left",
  fontSize: "0.76rem",
  fontWeight: 750,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
},

  td: {
  padding: "12px 13px",
  borderBottom: "1px solid #eef2f7",
  color: "#1e293b",
  verticalAlign: "top",
  whiteSpace: "nowrap",
},

  numericCell: {
    textAlign: "right",
    fontVariantNumeric:
      "tabular-nums",
  },

  evenRow: {
    background: "#ffffff",
  },

  oddRow: {
    background: "#fbfdff",
  },

  stateCell: {
    padding: "42px 18px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "0.78rem",
  },

  totalRow: {
    background: "#f1f5f9",
  },

  totalCell: {
    padding: "10px 12px",
    borderTop: "2px solid #cbd5e1",
    color: "#0f172a",
    fontWeight: 750,
    whiteSpace: "nowrap",
  },

  tableFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    padding: "11px 18px",
    borderTop: "1px solid #e2e8f0",
    background: "#f8fafc",
  },

  pageText: {
  fontSize: "0.78rem",
  color: "#64748b",
},

  pageButtonGroup: {
    display: "flex",
    gap: "8px",
  },

  customReportCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "18px",
    border: "1px dashed #cbd5e1",
    borderRadius: "10px",
    background: "#f8fafc",
  },

  customReportTitle: {
    margin: 0,
    fontSize: "0.95rem",
    fontWeight: 750,
    color: "#0f172a",
  },

  customReportText: {
    margin: "5px 0 0",
    maxWidth: "760px",
    fontSize: "0.74rem",
    lineHeight: 1.5,
    color: "#64748b",
  },

  comingSoonBadge: {
    padding: "5px 10px",
    borderRadius: "999px",
    background: "#e2e8f0",
    color: "#475569",
    fontSize: "0.66rem",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
};