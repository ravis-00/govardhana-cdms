import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getMilkProduction,
  addMilkProduction,
  updateMilkProduction,
  getMilkDistribution,
  addMilkDistribution,
  updateMilkDistribution,
  calculateMilkOutPass,
} from "../api/masterApi";

// =========================================================
// HELPERS
// =========================================================

function getCurrentMonthDateRange() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const lastDay = new Date(
    year,
    today.getMonth() + 1,
    0
  ).getDate();

  return {
    fromDate: `${year}-${month}-01`,
    toDate: `${year}-${month}-${String(
      lastDay
    ).padStart(2, "0")}`,
  };
}

function getTodayIsoDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "-";

  const text = String(value).split("T")[0];

  const isoMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-GB");
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatQuantity(value) {
  const number = numberValue(value);

  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(1);
}

function getProductionGoodMilk(row) {
  return (
    numberValue(
      row.amGoodQty ?? row.amGood
    ) +
    numberValue(
      row.pmGoodQty ?? row.pmGood
    )
  );
}

function getProductionColostrum(row) {
  return (
    numberValue(
      row.amColostrumQty ??
        row.amColostrum
    ) +
    numberValue(
      row.pmColostrumQty ??
        row.pmColostrum
    )
  );
}

function getInternalDistribution(row) {
  return (
    numberValue(
      row.amToByProducts ??
        row.amByProd
    ) +
    numberValue(row.amTemple) +
    numberValue(
      row.pmToByProducts ??
        row.pmByProd
    ) +
    numberValue(row.toBulls) +
    numberValue(row.toWorkers) +
    numberValue(row.toCanteen) +
    numberValue(row.toEvents)
  );
}

// =========================================================
// COMPONENT
// =========================================================

export default function MilkYield() {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1280 : window.innerWidth
  );
  const [activeTab, setActiveTab] =
    useState("production");

  const initialDateRange =
  getCurrentMonthDateRange();

const [fromDate, setFromDate] =
  useState(initialDateRange.fromDate);

const [toDate, setToDate] =
  useState(initialDateRange.toDate);

  const [searchText, setSearchText] =
    useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const [prodRows, setProdRows] =
    useState([]);

  const [distRows, setDistRows] =
    useState([]);

  const [showModal, setShowModal] =
    useState(false);

  const [isEditMode, setIsEditMode] =
    useState(false);

  const [form, setForm] = useState({});

  const [viewData, setViewData] =
    useState(null);

  const [
    calculatingOutPass,
    setCalculatingOutPass,
  ] = useState(false);

  const [
    outPassSummary,
    setOutPassSummary,
  ] = useState({
    availableGoodMilk: 0,
    internalDistribution: 0,
    outPassQty: 0,
  });

  const [
    outPassError,
    setOutPassError,
  ] = useState("");

  // =======================================================
  // EFFECTS
  // =======================================================

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = viewportWidth <= 640;
  const isTablet = viewportWidth > 640 && viewportWidth <= 1024;
  const useCompactRecords = viewportWidth <= 820;
  const recordsPerPage = useCompactRecords ? 10 : 20;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [fromDate, toDate, activeTab]);

  useEffect(() => {
    if (
      activeTab !== "distribution" ||
      !showModal ||
      !form.date
    ) {
      return undefined;
    }

    const timer = setTimeout(() => {
      calculateOutPassPreview(form);
    }, 400);

    return () => clearTimeout(timer);
  }, [
    activeTab,
    showModal,
    form.date,
    form.amByProd,
    form.amTemple,
    form.pmByProd,
    form.toBulls,
    form.toWorkers,
    form.toCanteen,
    form.toEvents,
  ]);

  // =======================================================
  // DATA
  // =======================================================

  async function loadData() {
    setLoading(true);
    setLoadError("");
    if (!fromDate || !toDate) {
  setLoadError(
    "Please select both From Date and To Date."
  );

  setLoading(false);
  return;
}

if (fromDate > toDate) {
  setLoadError(
    "From Date cannot be later than To Date."
  );

  setLoading(false);
  return;
}

    try {
      

      if (activeTab === "production") {
        const response =
          await getMilkProduction({
            fromDate,
            toDate,
          });

        if (
          response?.success === false
        ) {
          throw new Error(
            response.error ||
              "Unable to load Milk Production."
          );
        }

        const rawData = Array.isArray(
          response?.data
        )
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

        const sorted = [...rawData].sort(
          (a, b) =>
            String(b.date).localeCompare(
              String(a.date)
            )
        );

        setProdRows(sorted);
      } else {
        const response =
          await getMilkDistribution({
            fromDate,
            toDate,
          });

        if (
          response?.success === false
        ) {
          throw new Error(
            response.error ||
              "Unable to load Milk Distribution."
          );
        }

        const rawData = Array.isArray(
          response?.data
        )
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

        const sorted = [...rawData].sort(
          (a, b) =>
            String(b.date).localeCompare(
              String(a.date)
            )
        );

        setDistRows(sorted);
      }
    } catch (error) {
      console.error(
        "Milk Operations Load Error:",
        error
      );

      setLoadError(
        error?.message ||
          "Unable to load Milk Operations data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function calculateOutPassPreview(
    currentForm
  ) {
    try {
      setCalculatingOutPass(true);
      setOutPassError("");

      const response =
        await calculateMilkOutPass({
          date: currentForm.date || "",

          amByProd:
            currentForm.amByProd || 0,

          amTemple:
            currentForm.amTemple || 0,

          pmByProd:
            currentForm.pmByProd || 0,

          toBulls:
            currentForm.toBulls || 0,

          toWorkers:
            currentForm.toWorkers || 0,

          toCanteen:
            currentForm.toCanteen || 0,

          toEvents:
            currentForm.toEvents || 0,
        });

      if (
        response?.success === false
      ) {
        throw new Error(
          response.error ||
            "Unable to calculate Out Pass quantity."
        );
      }

      const result =
        response?.data || response;

      const availableGoodMilk =
        numberValue(
          result?.availableGoodMilk
        );

      const internalDistribution =
        numberValue(
          result?.internalDistribution
        );

      const outPassQty =
        numberValue(result?.outPassQty);

      setOutPassSummary({
        availableGoodMilk,
        internalDistribution,
        outPassQty,
      });

      setForm((previous) => ({
        ...previous,
        outPassQty,
      }));
    } catch (error) {
      const message =
        error?.message ||
        "Unable to calculate Out Pass quantity.";

      setOutPassError(message);

      setOutPassSummary({
        availableGoodMilk: 0,
        internalDistribution: 0,
        outPassQty: 0,
      });

      setForm((previous) => ({
        ...previous,
        outPassQty: "",
      }));
    } finally {
      setCalculatingOutPass(false);
    }
  }

  // =======================================================
  // FILTERED DATA
  // =======================================================

  const filteredProductionRows =
    useMemo(() => {
      const query = searchText
        .trim()
        .toLowerCase();

      if (!query) return prodRows;

      return prodRows.filter((row) => {
        const searchable = [
          row.date,
          row.shedId,
          row.shed,
          row.remarks,
          row.transactionId,
          row.transaction_id,
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      });
    }, [prodRows, searchText]);

  const filteredDistributionRows =
    useMemo(() => {
      const query = searchText
        .trim()
        .toLowerCase();

      if (!query) return distRows;

      return distRows.filter((row) => {
        const searchable = [
          row.date,
          row.outPassNumber,
          row.outPassNum,
          row.remarks,
          row.transactionId,
          row.transaction_id,
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      });
    }, [distRows, searchText]);

  // =======================================================
  // KPI VALUES
  // =======================================================

  const productionKpis = useMemo(() => {
    const totalGoodMilk =
      prodRows.reduce(
        (total, row) =>
          total +
          getProductionGoodMilk(row),
        0
      );

    const totalColostrum =
      prodRows.reduce(
        (total, row) =>
          total +
          getProductionColostrum(row),
        0
      );

    const uniqueDates = new Set(
      prodRows
        .map((row) => row.date)
        .filter(Boolean)
    );

    const averagePerDay =
      uniqueDates.size > 0
        ? totalGoodMilk /
          uniqueDates.size
        : 0;

    const today = getTodayIsoDate();

    const todayGoodMilk =
      prodRows
        .filter(
          (row) =>
            String(row.date).split("T")[0] ===
            today
        )
        .reduce(
          (total, row) =>
            total +
            getProductionGoodMilk(row),
          0
        );

    return {
      todayGoodMilk,
      totalGoodMilk,
      averagePerDay,
      totalColostrum,
    };
  }, [prodRows]);

  const distributionKpis =
    useMemo(() => {
      const totalInternal =
        distRows.reduce(
          (total, row) =>
            total +
            getInternalDistribution(row),
          0
        );

      const totalOutPass =
        distRows.reduce(
          (total, row) =>
            total +
            numberValue(row.outPassQty),
          0
        );

      const totalDistributed =
        totalInternal + totalOutPass;

      const today = getTodayIsoDate();

      const todayDistributed =
        distRows
          .filter(
            (row) =>
              String(row.date).split(
                "T"
              )[0] === today
          )
          .reduce(
            (total, row) =>
              total +
              getInternalDistribution(
                row
              ) +
              numberValue(
                row.outPassQty
              ),
            0
          );

      return {
        todayDistributed,
        totalDistributed,
        totalInternal,
        totalOutPass,
      };
    }, [distRows]);

  // =======================================================
  // TOAST
  // =======================================================

  function showToast(
    message,
    type = "success"
  ) {
    setToast({
      show: true,
      type,
      message,
    });

    window.setTimeout(() => {
      setToast((previous) => ({
        ...previous,
        show: false,
      }));
    }, 3500);
  }

  // =======================================================
  // MODAL HANDLERS
  // =======================================================

  function resetOutPassState() {
    setOutPassSummary({
      availableGoodMilk: 0,
      internalDistribution: 0,
      outPassQty: 0,
    });

    setOutPassError("");
  }

  function openAddModal() {
    setIsEditMode(false);
    resetOutPassState();

    const today = getTodayIsoDate();

    if (activeTab === "production") {
      setForm({
        date: today,
        shedId: "Goshala-1",
        amGood: "",
        amColostrum: "",
        pmGood: "",
        pmColostrum: "",
        remarks: "",
      });
    } else {
      setForm({
        date: today,
        amByProd: "",
        amTemple: "",
        pmByProd: "",
        toBulls: "",
        toWorkers: "",
        toCanteen: "",
        toEvents: "",
        outPassQty: "",
        outPassNum: "",
        remarks: "",
      });
    }

    setShowModal(true);
  }

  function openEditModal(row) {
    setIsEditMode(true);
    resetOutPassState();

    const date = row.date
      ? String(row.date).split("T")[0]
      : "";

    if (activeTab === "production") {
      setForm({
        transactionId:
          row.transactionId ||
          row.transaction_id ||
          "",

        date,

        shedId:
          row.shedId ||
          row.shed_id ||
          row.shed ||
          "",

        amGood:
          row.amGoodQty ??
          row.amGood ??
          "",

        amColostrum:
          row.amColostrumQty ??
          row.amColostrum ??
          "",

        pmGood:
          row.pmGoodQty ??
          row.pmGood ??
          "",

        pmColostrum:
          row.pmColostrumQty ??
          row.pmColostrum ??
          "",

        remarks: row.remarks || "",
      });
    } else {
      const internalDistribution =
        getInternalDistribution(row);

      const outPassQty = numberValue(
        row.outPassQty
      );

      setOutPassSummary({
        availableGoodMilk:
          internalDistribution +
          outPassQty,

        internalDistribution,

        outPassQty,
      });

      setForm({
        transactionId:
          row.transactionId ||
          row.transaction_id ||
          "",

        originalDate: date,
        date,

        amByProd:
          row.amToByProducts ??
          row.amByProd ??
          "",

        amTemple:
          row.amTemple ?? "",

        pmByProd:
          row.pmToByProducts ??
          row.pmByProd ??
          "",

        toBulls:
          row.toBulls ?? "",

        toWorkers:
          row.toWorkers ?? "",

        toCanteen:
          row.toCanteen ?? "",

        toEvents:
          row.toEvents ?? "",

        outPassQty:
          row.outPassQty ?? "",

        outPassNum:
          row.outPassNumber ??
          row.outPassNum ??
          "",

        remarks: row.remarks || "",
      });
    }

    setShowModal(true);
  }

  function closeEditModal() {
    if (saving) return;

    setShowModal(false);
    setForm({});
    resetOutPassState();
  }

  function handleInputChange(event) {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    try {
      setSaving(true);

      let response;

      if (
        activeTab === "production"
      ) {
        response = isEditMode
          ? await updateMilkProduction(
              form
            )
          : await addMilkProduction(
              form
            );
      } else {
        response = isEditMode
          ? await updateMilkDistribution(
              form
            )
          : await addMilkDistribution(
              form
            );
      }

      if (
        !response ||
        response.success === false
      ) {
        throw new Error(
          response?.error ||
            response?.message ||
            "The record could not be saved."
        );
      }

      await loadData();

      setShowModal(false);
      setForm({});

      showToast(
        activeTab === "production"
          ? isEditMode
            ? "Milk Production updated successfully."
            : "Milk Production added successfully."
          : isEditMode
            ? "Milk Distribution updated successfully."
            : "Milk Distribution added successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Milk Operations Save Error:",
        error
      );

      showToast(
        error?.message ||
          "Failed to save the record.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

 function clearFilters() {
  const defaultRange =
    getCurrentMonthDateRange();

  setFromDate(
    defaultRange.fromDate
  );

  setToDate(
    defaultRange.toDate
  );

  setSearchText("");
}

  const visibleRows =
    activeTab === "production"
      ? filteredProductionRows
      : filteredDistributionRows;

  const totalPages = Math.max(
    1,
    Math.ceil(visibleRows.length / recordsPerPage)
  );

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage;
    return visibleRows.slice(start, start + recordsPerPage);
  }, [visibleRows, currentPage, recordsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, fromDate, toDate, searchText, recordsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div style={{ ...pageStyle, padding: isMobile ? "16px" : "24px", minWidth: 0 }}>
      {/* PAGE HEADER */}

      <div style={pageHeaderStyle}>
        <div>
          <div style={sectionLabelStyle}>
            Daily Operations
          </div>

          <h1 style={pageTitleStyle}>
            Milk Operations
          </h1>

          <p style={pageSubtitleStyle}>
            Record and review daily milk
            production and distribution.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn btn-primary"
          style={{ ...addButtonStyle, width: isMobile ? "100%" : "auto", justifyContent: "center" }}
        >
          + Add Entry
        </button>
      </div>

      {/* KPI CARDS */}

      <div style={{
        ...kpiGridStyle,
        gridTemplateColumns: isMobile
          ? "repeat(2, minmax(0, 1fr))"
          : "repeat(auto-fit, minmax(190px, 1fr))",
        gap: isMobile ? "10px" : "14px",
      }}>
        {activeTab === "production" ? (
          <>
            <KpiCard
              label="Today's Good Milk"
              value={`${formatQuantity(
                productionKpis.todayGoodMilk
              )} L`}
              helper="Current day"
            />

            <KpiCard
              label="Monthly Good Milk"
              value={`${formatQuantity(
                productionKpis.totalGoodMilk
              )} L`}
              helper="AM + PM good milk"
            />

            <KpiCard
              label="Average Per Day"
              value={`${formatQuantity(
                productionKpis.averagePerDay
              )} L`}
              helper="Monthly daily average"
            />

            <KpiCard
              label="Monthly Colostrum"
              value={`${formatQuantity(
                productionKpis.totalColostrum
              )} L`}
              helper="Excluded from distribution"
            />
          </>
        ) : (
          <>
            <KpiCard
              label="Today's Distribution"
              value={`${formatQuantity(
                distributionKpis.todayDistributed
              )} L`}
              helper="Internal + Out Pass"
            />

            <KpiCard
              label="Monthly Distribution"
              value={`${formatQuantity(
                distributionKpis.totalDistributed
              )} L`}
              helper="Total milk accounted"
            />

            <KpiCard
              label="Internal Distribution"
              value={`${formatQuantity(
                distributionKpis.totalInternal
              )} L`}
              helper="Internal consumption"
            />

            <KpiCard
              label="Out Pass Milk"
              value={`${formatQuantity(
                distributionKpis.totalOutPass
              )} L`}
              helper="Milk sent outside"
            />
          </>
        )}
      </div>

      {/* TAB BAR */}

      <div style={tabContainerStyle}>
        <TabButton
          label="Production"
          active={
            activeTab === "production"
          }
          onClick={() => {
            setActiveTab("production");
            setSearchText("");
          }}
        />

        <TabButton
          label="Distribution"
          active={
            activeTab ===
            "distribution"
          }
          onClick={() => {
            setActiveTab(
              "distribution"
            );
            setSearchText("");
          }}
        />
      </div>

      {/* TOOLBAR */}

      <div style={{
        ...toolbarStyle,
        display: "grid",
        gridTemplateColumns: isMobile
          ? "repeat(2, minmax(0, 1fr))"
          : isTablet
          ? "repeat(2, minmax(0, 1fr))"
          : "repeat(2, minmax(180px, 220px)) minmax(260px, 1fr) auto",
      }}>
        <div style={{ ...toolbarFieldStyle, minWidth: 0 }}>
  <label style={toolbarLabelStyle}>
    From Date
  </label>

  <input
    type="date"
    value={fromDate}
    max={toDate || undefined}
    onChange={(event) =>
      setFromDate(
        event.target.value
      )
    }
    className="form-input"
    style={toolbarInputStyle}
  />
</div>

<div style={{ ...toolbarFieldStyle, minWidth: 0 }}>
  <label style={toolbarLabelStyle}>
    To Date
  </label>

  <input
    type="date"
    value={toDate}
    min={fromDate || undefined}
    onChange={(event) =>
      setToDate(
        event.target.value
      )
    }
    className="form-input"
    style={toolbarInputStyle}
  />
</div>

        <div style={{
          ...searchFieldStyle,
          gridColumn: isMobile || isTablet ? "1 / -1" : "auto",
          minWidth: 0,
        }}>
          <label style={toolbarLabelStyle}>
            Search
          </label>

          <input
            type="search"
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
            placeholder={
              activeTab ===
              "production"
                ? "Search shed, ID or remarks"
                : "Search Out Pass, ID or remarks"
            }
            className="form-input"
            style={searchInputStyle}
          />
        </div>

        <div style={{
          ...toolbarActionStyle,
          gridColumn: isMobile || isTablet ? "1 / -1" : "auto",
        }}>
          <button
            type="button"
            onClick={clearFilters}
            className="btn btn-secondary"
            style={{ width: isMobile || isTablet ? "100%" : "auto" }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* ERROR */}

      {loadError && (
        <div style={errorBannerStyle}>
          <span>{loadError}</span>

          <button
            type="button"
            onClick={loadData}
            style={retryButtonStyle}
          >
            Retry
          </button>
        </div>
      )}

      {/* TABLE */}

      <div
        className="card"
        style={tableCardStyle}
      >
        <div style={tableHeaderStyle}>
          <div>
            <h2 style={tableTitleStyle}>
              {activeTab ===
              "production"
                ? "Milk Production Register"
                : "Milk Distribution Register"}
            </h2>

            <div style={recordCountStyle}>
              {visibleRows.length} record
              {visibleRows.length === 1
                ? ""
                : "s"}
            </div>
          </div>
        </div>

        <PaginationBar
          recordCount={visibleRows.length}
          currentPage={currentPage}
          totalPages={totalPages}
          onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
          onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        />

        <div style={{
          ...tableScrollStyle,
          overflowX: useCompactRecords ? "hidden" : "auto",
          maxHeight: useCompactRecords ? "none" : tableScrollStyle.maxHeight,
        }}>
          {loading ? (
            <LoadingState />
          ) : visibleRows.length === 0 ? (
            <EmptyState
  activeTab={activeTab}
  fromDate={fromDate}
  toDate={toDate}
/>
          ) : useCompactRecords ? (
            <div style={mobileListStyle}>
              {paginatedRows.map((row, index) => (
                <MilkRecordCard
                  key={row.transactionId || row.transaction_id || `${row.date}-${index}`}
                  row={row}
                  activeTab={activeTab}
                  onView={() => setViewData(row)}
                  onEdit={() => openEditModal(row)}
                />
              ))}
            </div>
          ) : (
            <table style={tableStyle}>
              <thead style={theadStyle}>
                <tr>
                  <th style={thStyle}>
                    Date
                  </th>

                  {activeTab ===
                  "production" ? (
                    <>
                      <th style={thStyle}>
                        Shed
                      </th>
                      <th style={numberThStyle}>
                        AM Good
                      </th>
                      <th style={numberThStyle}>
                        AM Colostrum
                      </th>
                      <th style={numberThStyle}>
                        PM Good
                      </th>
                      <th style={numberThStyle}>
                        PM Colostrum
                      </th>
                      <th style={numberThStyle}>
                        Good Milk Total
                      </th>
                    </>
                  ) : (
                    <>
                      <th style={numberThStyle}>
                        AM By-products
                      </th>
                      <th style={numberThStyle}>
                        PM By-products
                      </th>
                      <th style={numberThStyle}>
                        Temple
                      </th>
                      <th style={numberThStyle}>
                        Workers
                      </th>
                      <th style={numberThStyle}>
                        Out Pass Qty
                      </th>
                      <th style={thStyle}>
                        Out Pass No.
                      </th>
                    </>
                  )}

                  <th style={actionThStyle}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map(
                  (row, index) => {
                    const key =
                      row.transactionId ||
                      row.transaction_id ||
                      `${row.date}-${index}`;

                    return (
                      <tr
  key={key}
  style={tableRowStyle}
  onClick={() =>
    setViewData(row)
  }
  title="Click to view details"
>
                        <td style={tdStyle}>
                          {formatDate(
                            row.date
                          )}
                        </td>

                        {activeTab ===
                        "production" ? (
                          <>
                            <td style={tdStyle}>
                              {row.shedId ||
                                row.shed ||
                                "-"}
                            </td>

                            <td style={numberTdStyle}>
                              {formatQuantity(
                                row.amGoodQty ??
                                  row.amGood
                              )}
                            </td>

                            <td style={numberTdStyle}>
                              {formatQuantity(
                                row.amColostrumQty ??
                                  row.amColostrum
                              )}
                            </td>

                            <td style={numberTdStyle}>
                              {formatQuantity(
                                row.pmGoodQty ??
                                  row.pmGood
                              )}
                            </td>

                            <td style={numberTdStyle}>
                              {formatQuantity(
                                row.pmColostrumQty ??
                                  row.pmColostrum
                              )}
                            </td>

                            <td style={strongNumberTdStyle}>
                              {formatQuantity(
                                getProductionGoodMilk(
                                  row
                                )
                              )}{" "}
                              L
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={numberTdStyle}>
                              {formatQuantity(
                                row.amToByProducts ??
                                  row.amByProd
                              )}
                            </td>

                            <td style={numberTdStyle}>
                              {formatQuantity(
                                row.pmToByProducts ??
                                  row.pmByProd
                              )}
                            </td>

                            <td style={numberTdStyle}>
                              {formatQuantity(
                                row.amTemple
                              )}
                            </td>

                            <td style={numberTdStyle}>
                              {formatQuantity(
                                row.toWorkers
                              )}
                            </td>

                            <td style={strongNumberTdStyle}>
                              {formatQuantity(
                                row.outPassQty
                              )}{" "}
                              L
                            </td>

                            <td style={tdStyle}>
                              {row.outPassNumber ||
                                row.outPassNum ||
                                "-"}
                            </td>
                          </>
                        )}

                        <td style={actionTdStyle}>
                          <div style={rowActionsStyle}>
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();

      openEditModal(row);
    }}
    style={editButtonStyle}
    title="Edit record"
  >
    Edit
  </button>
</div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          )}
        </div>

        {visibleRows.length > 0 && (
          <PaginationBar
            recordCount={visibleRows.length}
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
            onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            isFooter
          />
        )}
      </div>

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <div
          style={{ ...overlayStyle, padding: isMobile ? 0 : "20px", alignItems: isMobile ? "stretch" : "center" }}
          onClick={closeEditModal}
        >
          <div
            style={{
              ...modalStyle,
              height: isMobile ? "100dvh" : modalStyle.height,
              maxWidth: isMobile ? "100%" : modalStyle.maxWidth,
              borderRadius: isMobile ? 0 : "14px",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div style={modalHeaderStyle}>
              <div>
                <div
                  style={modalSectionLabelStyle}
                >
                  {activeTab ===
                  "production"
                    ? "Milk Production"
                    : "Milk Distribution"}
                </div>

                <h2 style={modalTitleStyle}>
                  {isEditMode
                    ? "Edit Entry"
                    : "Add Entry"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                style={modalCloseStyle}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
  onSubmit={handleSubmit}
  style={{
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  }}
>
              <div style={modalBodyStyle}>
                <SectionTitle>
                  Basic Information
                </SectionTitle>

                <div style={formGridStyle}>
                  <Field label="Date">
                    <input
                      type="date"
                      name="date"
                      value={
                        form.date || ""
                      }
                      onChange={
                        handleInputChange
                      }
                      className="form-input"
                      required
                    />
                  </Field>

                  {activeTab ===
                    "production" && (
                    <Field label="Shed">
                      <select
                        name="shedId"
                        value={
                          form.shedId ||
                          ""
                        }
                        onChange={
                          handleInputChange
                        }
                        className="form-select"
                        required
                      >
                        <option value="Goshala-1">
                          Goshala-1
                        </option>
                        <option value="Goshala-2">
                          Goshala-2
                        </option>
                        <option value="Quarantine">
                          Quarantine
                        </option>
                      </select>
                    </Field>
                  )}
                </div>

                {activeTab ===
                "production" ? (
                  <>
                    <SectionTitle>
                      Morning Production
                    </SectionTitle>

                    <div
                      style={formGridStyle}
                    >
                      <QuantityField
                        label="AM Good Qty"
                        name="amGood"
                        value={
                          form.amGood
                        }
                        onChange={
                          handleInputChange
                        }
                      />

                      <QuantityField
                        label="AM Colostrum"
                        name="amColostrum"
                        value={
                          form.amColostrum
                        }
                        onChange={
                          handleInputChange
                        }
                      />
                    </div>

                    <SectionTitle>
                      Evening Production
                    </SectionTitle>

                    <div
                      style={formGridStyle}
                    >
                      <QuantityField
                        label="PM Good Qty"
                        name="pmGood"
                        value={
                          form.pmGood
                        }
                        onChange={
                          handleInputChange
                        }
                      />

                      <QuantityField
                        label="PM Colostrum"
                        name="pmColostrum"
                        value={
                          form.pmColostrum
                        }
                        onChange={
                          handleInputChange
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <SectionTitle>
                      Internal Distribution
                    </SectionTitle>

                    <div
                      style={formGridStyle}
                    >
                      <QuantityField
                        label="AM to By-products"
                        name="amByProd"
                        value={
                          form.amByProd
                        }
                        onChange={
                          handleInputChange
                        }
                      />

                      <QuantityField
                        label="AM to Temple"
                        name="amTemple"
                        value={
                          form.amTemple
                        }
                        onChange={
                          handleInputChange
                        }
                      />

                      <QuantityField
                        label="PM to By-products"
                        name="pmByProd"
                        value={
                          form.pmByProd
                        }
                        onChange={
                          handleInputChange
                        }
                      />

                      <QuantityField
                        label="To Bulls"
                        name="toBulls"
                        value={
                          form.toBulls
                        }
                        onChange={
                          handleInputChange
                        }
                      />

                      <QuantityField
                        label="To Workers"
                        name="toWorkers"
                        value={
                          form.toWorkers
                        }
                        onChange={
                          handleInputChange
                        }
                      />

                      <QuantityField
                        label="To Canteen"
                        name="toCanteen"
                        value={
                          form.toCanteen
                        }
                        onChange={
                          handleInputChange
                        }
                      />

                      <QuantityField
                        label="To Events"
                        name="toEvents"
                        value={
                          form.toEvents
                        }
                        onChange={
                          handleInputChange
                        }
                      />

                      <Field label="Out Pass Number">
                        <input
                          type="text"
                          name="outPassNum"
                          value={
                            form.outPassNum ||
                            ""
                          }
                          onChange={
                            handleInputChange
                          }
                          className="form-input"
                          placeholder="Enter Out Pass Number"
                        />
                      </Field>
                    </div>

                    <SectionTitle>
                      Calculated Summary
                    </SectionTitle>

                    <div
                      style={summaryGridStyle}
                    >
                      <SummaryBox
                        label="Available Good Milk"
                        value={`${formatQuantity(
                          outPassSummary.availableGoodMilk
                        )} L`}
                      />

                      <SummaryBox
                        label="Internal Distribution"
                        value={`${formatQuantity(
                          outPassSummary.internalDistribution
                        )} L`}
                      />

                      <SummaryBox
                        label="Calculated Out Pass"
                        value={
                          calculatingOutPass
                            ? "Calculating..."
                            : `${formatQuantity(
                                outPassSummary.outPassQty
                              )} L`
                        }
                        wide
                      />
                    </div>

                    {outPassError && (
                      <div
                        style={
                          calculationErrorStyle
                        }
                      >
                        {outPassError}
                      </div>
                    )}

                    {!outPassError &&
                      !calculatingOutPass && (
                        <div
                          style={
                            calculationHelpStyle
                          }
                        >
                          Out Pass Quantity is
                          calculated automatically
                          from available good milk
                          minus internal
                          distribution.
                        </div>
                      )}
                  </>
                )}

                <SectionTitle>
                  Remarks
                </SectionTitle>

                <Field label="Remarks">
                  <textarea
                    name="remarks"
                    value={
                      form.remarks || ""
                    }
                    onChange={
                      handleInputChange
                    }
                    className="form-input"
                    rows={3}
                    style={{
                      resize: "vertical",
                    }}
                    placeholder="Enter remarks"
                  />
                </Field>
              </div>

              <div style={modalFooterStyle}>
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeEditModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    (activeTab ===
                      "distribution" &&
                      (calculatingOutPass ||
                        Boolean(
                          outPassError
                        )))
                  }
                  className="btn btn-primary"
                >
                  {saving
                    ? "Saving..."
                    : calculatingOutPass
                      ? "Calculating..."
                      : isEditMode
                        ? "Update Entry"
                        : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}

      {viewData && (
        <div
          style={{ ...overlayStyle, padding: isMobile ? 0 : "20px", alignItems: isMobile ? "stretch" : "center" }}
          onClick={() =>
            setViewData(null)
          }
        >
          <div
            style={{
              ...detailsModalStyle,
              height: isMobile ? "100dvh" : detailsModalStyle.height,
              maxWidth: isMobile ? "100%" : detailsModalStyle.maxWidth,
              borderRadius: isMobile ? 0 : "14px",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div style={modalHeaderStyle}>
              <div>
                <div
                  style={modalSectionLabelStyle}
                >
                  {activeTab ===
                  "production"
                    ? "Milk Production"
                    : "Milk Distribution"}
                </div>

                <h2 style={modalTitleStyle}>
                  Entry Details
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewData(null)
                }
                style={modalCloseStyle}
              >
                ×
              </button>
            </div>

            <div style={detailsBodyStyle}>
              <DetailSection
                title="Record Information"
              >
                <ViewItem
                  label="Transaction ID"
                  value={
                    viewData.transactionId ||
                    viewData.transaction_id
                  }
                />

                <ViewItem
                  label="Date"
                  value={formatDate(
                    viewData.date
                  )}
                />
              </DetailSection>

              {activeTab ===
              "production" ? (
                <>
                  <DetailSection title="Production">
                    <ViewItem
                      label="Shed"
                      value={
                        viewData.shedId ||
                        viewData.shed
                      }
                    />

                    <ViewItem
                      label="AM Good"
                      value={`${formatQuantity(
                        viewData.amGoodQty ??
                          viewData.amGood
                      )} L`}
                    />

                    <ViewItem
                      label="AM Colostrum"
                      value={`${formatQuantity(
                        viewData.amColostrumQty ??
                          viewData.amColostrum
                      )} L`}
                    />

                    <ViewItem
                      label="PM Good"
                      value={`${formatQuantity(
                        viewData.pmGoodQty ??
                          viewData.pmGood
                      )} L`}
                    />

                    <ViewItem
                      label="PM Colostrum"
                      value={`${formatQuantity(
                        viewData.pmColostrumQty ??
                          viewData.pmColostrum
                      )} L`}
                    />

                    <ViewItem
                      label="Good Milk Total"
                      value={`${formatQuantity(
                        getProductionGoodMilk(
                          viewData
                        )
                      )} L`}
                    />

                    <ViewItem
                      label="Colostrum Total"
                      value={`${formatQuantity(
                        getProductionColostrum(
                          viewData
                        )
                      )} L`}
                    />
                  </DetailSection>
                </>
              ) : (
                <>
                  <DetailSection title="Internal Distribution">
                    <ViewItem
                      label="AM to By-products"
                      value={`${formatQuantity(
                        viewData.amToByProducts ??
                          viewData.amByProd
                      )} L`}
                    />

                    <ViewItem
                      label="AM to Temple"
                      value={`${formatQuantity(
                        viewData.amTemple
                      )} L`}
                    />

                    <ViewItem
                      label="PM to By-products"
                      value={`${formatQuantity(
                        viewData.pmToByProducts ??
                          viewData.pmByProd
                      )} L`}
                    />

                    <ViewItem
                      label="To Bulls"
                      value={`${formatQuantity(
                        viewData.toBulls
                      )} L`}
                    />

                    <ViewItem
                      label="To Workers"
                      value={`${formatQuantity(
                        viewData.toWorkers
                      )} L`}
                    />

                    <ViewItem
                      label="To Canteen"
                      value={`${formatQuantity(
                        viewData.toCanteen
                      )} L`}
                    />

                    <ViewItem
                      label="To Events"
                      value={`${formatQuantity(
                        viewData.toEvents
                      )} L`}
                    />
                  </DetailSection>

                  <DetailSection title="Out Pass">
                    <ViewItem
                      label="Internal Distribution"
                      value={`${formatQuantity(
                        getInternalDistribution(
                          viewData
                        )
                      )} L`}
                    />

                    <ViewItem
                      label="Out Pass Qty"
                      value={`${formatQuantity(
                        viewData.outPassQty
                      )} L`}
                    />

                    <ViewItem
                      label="Out Pass Number"
                      value={
                        viewData.outPassNumber ||
                        viewData.outPassNum
                      }
                    />

                    <ViewItem
                      label="Total Accounted Milk"
                      value={`${formatQuantity(
                        getInternalDistribution(
                          viewData
                        ) +
                          numberValue(
                            viewData.outPassQty
                          )
                      )} L`}
                    />
                  </DetailSection>
                </>
              )}

              <DetailSection title="Remarks">
                <ViewItem
                  label="Remarks"
                  value={viewData.remarks}
                  wide
                />
              </DetailSection>
            </div>

            <div style={modalFooterStyle}>
              <button
                type="button"
                onClick={() =>
                  setViewData(null)
                }
                className="btn btn-secondary"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const selected =
                    viewData;

                  setViewData(null);
                  openEditModal(selected);
                }}
                className="btn btn-primary"
              >
                Edit Entry
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
            ...(toast.type ===
            "success"
              ? successToastStyle
              : errorToastStyle),
          }}
        >
          <div style={toastIconStyle}>
            {toast.type === "success"
              ? "✓"
              : "!"}
          </div>

          <div>{toast.message}</div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// SMALL COMPONENTS
// =========================================================

function PaginationBar({
  recordCount,
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  isFooter = false,
}) {
  return (
    <div style={{ ...paginationBarStyle, ...(isFooter ? paginationFooterStyle : {}) }}>
      <div style={paginationInfoStyle}>
        Records: <strong>{recordCount}</strong>
        <span aria-hidden="true"> | </span>
        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
      </div>
      <div style={paginationActionsStyle}>
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage <= 1}
          style={{ ...paginationButtonStyle, ...(currentPage <= 1 ? paginationDisabledStyle : {}) }}
        >
          Prev
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= totalPages}
          style={{ ...paginationButtonStyle, ...(currentPage >= totalPages ? paginationDisabledStyle : {}) }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function MilkRecordCard({ row, activeTab, onView, onEdit }) {
  const isProduction = activeTab === "production";

  return (
    <article style={mobileCardStyle} onClick={onView}>
      <div style={mobileCardHeaderStyle}>
        <div>
          <div style={mobileCardLabelStyle}>Date</div>
          <div style={mobileCardTitleStyle}>{formatDate(row.date)}</div>
          <div style={mobileCardSubTitleStyle}>
            {isProduction
              ? row.shedId || row.shed || "No shed recorded"
              : row.outPassNumber || row.outPassNum || "No out-pass number"}
          </div>
        </div>
        <div style={mobileTotalBoxStyle}>
          <div style={mobileCardLabelStyle}>{isProduction ? "Good Milk" : "Out Pass"}</div>
          <div style={mobileTotalValueStyle}>
            {formatQuantity(isProduction ? getProductionGoodMilk(row) : row.outPassQty)} L
          </div>
        </div>
      </div>

      {isProduction ? (
        <div style={mobileCardGridStyle}>
          <MobileMilkValue label="AM Good" value={row.amGoodQty ?? row.amGood} />
          <MobileMilkValue label="PM Good" value={row.pmGoodQty ?? row.pmGood} />
          <MobileMilkValue label="AM Colostrum" value={row.amColostrumQty ?? row.amColostrum} />
          <MobileMilkValue label="PM Colostrum" value={row.pmColostrumQty ?? row.pmColostrum} />
        </div>
      ) : (
        <div style={mobileCardGridStyle}>
          <MobileMilkValue label="AM By-products" value={row.amToByProducts ?? row.amByProd} />
          <MobileMilkValue label="PM By-products" value={row.pmToByProducts ?? row.pmByProd} />
          <MobileMilkValue label="Temple" value={row.amTemple} />
          <MobileMilkValue label="Workers" value={row.toWorkers} />
        </div>
      )}

      <div style={mobileCardActionsStyle}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={(event) => {
            event.stopPropagation();
            onView();
          }}
        >
          View
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          style={editButtonStyle}
        >
          Edit
        </button>
      </div>
    </article>
  );
}

function MobileMilkValue({ label, value }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={mobileCardLabelStyle}>{label}</div>
      <div style={mobileCardValueStyle}>{formatQuantity(value)} L</div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  helper,
}) {
  return (
    <div style={kpiCardStyle}>
      <div style={kpiLabelStyle}>
        {label}
      </div>

      <div style={kpiValueStyle}>
        {value}
      </div>

      <div style={kpiHelperStyle}>
        {helper}
      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...tabButtonStyle,
        ...(active
          ? activeTabButtonStyle
          : {}),
      }}
    >
      {label}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div style={fieldStyle}>
      <label style={fieldLabelStyle}>
        {label}
      </label>

      {children}
    </div>
  );
}

function QuantityField({
  label,
  name,
  value,
  onChange,
}) {
  return (
    <Field label={`${label} (L)`}>
      <input
        type="number"
        min="0"
        step="0.1"
        name={name}
        value={value ?? ""}
        onChange={onChange}
        className="form-input"
      />
    </Field>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={sectionTitleStyle}>
      {children}
    </div>
  );
}

function SummaryBox({
  label,
  value,
  wide = false,
}) {
  return (
    <div
      style={{
        ...summaryBoxStyle,
        ...(wide
          ? { gridColumn: "1 / -1" }
          : {}),
      }}
    >
      <div style={summaryLabelStyle}>
        {label}
      </div>

      <div style={summaryValueStyle}>
        {value}
      </div>
    </div>
  );
}

function DetailSection({
  title,
  children,
}) {
  return (
    <div style={detailSectionStyle}>
      <div style={detailSectionTitleStyle}>
        {title}
      </div>

      <div style={detailGridStyle}>
        {children}
      </div>
    </div>
  );
}

function ViewItem({
  label,
  value,
  wide = false,
}) {
  const displayValue =
    value === 0 ||
    value === "0"
      ? "0"
      : value || "-";

  return (
    <div
      style={{
        ...viewItemStyle,
        ...(wide
          ? { gridColumn: "1 / -1" }
          : {}),
      }}
    >
      <div style={viewLabelStyle}>
        {label}
      </div>

      <div style={viewValueStyle}>
        {displayValue}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={stateContainerStyle}>
      <div style={spinnerStyle} />

      <div style={stateTitleStyle}>
        Loading records
      </div>

      <div style={stateTextStyle}>
        Please wait while the data is
        retrieved.
      </div>
    </div>
  );
}

function EmptyState({
  activeTab,
  fromDate,
  toDate,
}) {
  return (
    <div style={stateContainerStyle}>
      <div style={emptyIconStyle}>
        {activeTab === "production"
          ? "P"
          : "D"}
      </div>

      <div style={stateTitleStyle}>
        No records found
      </div>

      <div style={stateTextStyle}>
        No{" "}
        {activeTab === "production"
          ? "production"
          : "distribution"}{" "}
        records are available from{" "}
        {formatDate(fromDate)} to{" "}
        {formatDate(toDate)}.
      </div>
    </div>
  );
}

// =========================================================
// STYLES
// =========================================================

const pageStyle = {
  width: "100%",
  maxWidth: "1440px",
  margin: "0 auto",
  padding: "24px",
  boxSizing: "border-box",
};

const pageHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const sectionLabelStyle = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#ea580c",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "6px",
};

const pageTitleStyle = {
  margin: 0,
  fontSize: "28px",
  lineHeight: 1.2,
  fontWeight: 750,
  color: "#0f172a",
};

const pageSubtitleStyle = {
  margin: "8px 0 0",
  fontSize: "14px",
  color: "#64748b",
};

const addButtonStyle = {
  whiteSpace: "nowrap",
};

const kpiGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "14px",
  marginBottom: "20px",
};

const kpiCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "17px 18px",
  boxShadow:
    "0 1px 2px rgba(15, 23, 42, 0.04)",
};

const kpiLabelStyle = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const kpiValueStyle = {
  marginTop: "8px",
  fontSize: "25px",
  fontWeight: 750,
  color: "#0f172a",
};

const kpiHelperStyle = {
  marginTop: "5px",
  fontSize: "12px",
  color: "#94a3b8",
};

const tabContainerStyle = {
  display: "flex",
  gap: "4px",
  borderBottom: "1px solid #e2e8f0",
  marginBottom: "16px",
};

const tabButtonStyle = {
  padding: "12px 22px",
  border: "none",
  borderBottom:
    "3px solid transparent",
  background: "transparent",
  color: "#64748b",
  fontSize: "14px",
  fontWeight: 650,
  cursor: "pointer",
};

const activeTabButtonStyle = {
  color: "#ea580c",
  borderBottomColor: "#ea580c",
};

const toolbarStyle = {
  display: "flex",
  alignItems: "flex-end",
  gap: "14px",
  flexWrap: "wrap",
  padding: "16px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  marginBottom: "16px",
};

const toolbarFieldStyle = {
  minWidth: "180px",
};

const searchFieldStyle = {
  flex: "1 1 280px",
};

const toolbarActionStyle = {
  marginLeft: "auto",
};

const toolbarLabelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#475569",
};

const toolbarInputStyle = {
  width: "100%",
};

const searchInputStyle = {
  width: "100%",
};

const errorBannerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "12px 14px",
  marginBottom: "16px",
  border: "1px solid #fecaca",
  borderRadius: "10px",
  background: "#fef2f2",
  color: "#b91c1c",
  fontSize: "13px",
};

const retryButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#b91c1c",
  fontWeight: 700,
  cursor: "pointer",
};

const tableCardStyle = {
  padding: 0,
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  background: "#ffffff",
};

const tableHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 18px",
  borderBottom: "1px solid #e2e8f0",
};

const tableTitleStyle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 700,
  color: "#0f172a",
};

const recordCountStyle = {
  marginTop: "4px",
  fontSize: "12px",
  color: "#94a3b8",
};

const paginationBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "10px",
  padding: "11px 16px",
  borderBottom: "1px solid #e2e8f0",
  background: "#ffffff",
};

const paginationFooterStyle = {
  borderTop: "1px solid #e2e8f0",
  borderBottom: "none",
};

const paginationInfoStyle = {
  color: "#64748b",
  fontSize: "12px",
};

const paginationActionsStyle = {
  display: "flex",
  gap: "8px",
};

const paginationButtonStyle = {
  minWidth: "58px",
  padding: "7px 10px",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 700,
};

const paginationDisabledStyle = {
  opacity: 0.5,
  cursor: "not-allowed",
};

const tableScrollStyle = {
  overflowX: "auto",
  minHeight: "300px",
  maxHeight: "calc(100vh - 370px)",
  overflowY: "auto",
};

const tableStyle = {
  width: "100%",
  minWidth: "1050px",
  borderCollapse: "collapse",
  fontSize: "13px",
};

const theadStyle = {
  position: "sticky",
  top: 0,
  zIndex: 5,
  background: "#f8fafc",
};

const thStyle = {
  padding: "12px 14px",
  textAlign: "left",
  borderBottom: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: "11px",
  fontWeight: 750,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
};

const numberThStyle = {
  ...thStyle,
  textAlign: "right",
};

const actionThStyle = {
  ...thStyle,
  textAlign: "center",
};

const tableRowStyle = {
  borderBottom: "1px solid #f1f5f9",
  cursor: "pointer",
  transition:
    "background 0.15s ease",
};

const tdStyle = {
  padding: "13px 14px",
  color: "#334155",
  whiteSpace: "nowrap",
};

const numberTdStyle = {
  ...tdStyle,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

const strongNumberTdStyle = {
  ...numberTdStyle,
  fontWeight: 700,
  color: "#0f172a",
};

const actionTdStyle = {
  ...tdStyle,
  textAlign: "center",
};

const rowActionsStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "8px",
};

const mobileListStyle = {
  display: "grid",
  gap: "10px",
  padding: "10px",
};

const mobileCardStyle = {
  display: "grid",
  gap: "12px",
  minWidth: 0,
  padding: "12px",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  background: "#ffffff",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  cursor: "pointer",
};

const mobileCardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  paddingBottom: "10px",
  borderBottom: "1px solid #f1f5f9",
};

const mobileCardLabelStyle = {
  color: "#64748b",
  fontSize: "10px",
  fontWeight: 750,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

const mobileCardTitleStyle = {
  marginTop: "3px",
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: 800,
};

const mobileCardSubTitleStyle = {
  marginTop: "3px",
  color: "#475569",
  fontSize: "12px",
  fontWeight: 600,
  overflowWrap: "anywhere",
};

const mobileTotalBoxStyle = {
  textAlign: "right",
  flexShrink: 0,
};

const mobileTotalValueStyle = {
  marginTop: "3px",
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: 800,
};

const mobileCardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const mobileCardValueStyle = {
  marginTop: "3px",
  color: "#1e293b",
  fontSize: "13px",
  fontWeight: 650,
};

const mobileCardActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
};



const editButtonStyle = {
  padding: "6px 10px",
  border: "1px solid #fed7aa",
  borderRadius: "7px",
  background: "#fff7ed",
  color: "#c2410c",
  fontSize: "12px",
  fontWeight: 650,
  cursor: "pointer",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "20px",
  background:
    "rgba(15, 23, 42, 0.58)",
};

const modalStyle = {
  width: "100%",
  maxWidth: "720px",
  height: "min(92vh, 760px)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: "#ffffff",
  borderRadius: "14px",
  boxShadow:
    "0 24px 60px rgba(15, 23, 42, 0.28)",
};

const detailsModalStyle = {
  ...modalStyle,
  maxWidth: "760px",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  padding: "18px 22px",
  borderBottom: "1px solid #e2e8f0",
};

const modalSectionLabelStyle = {
  marginBottom: "4px",
  fontSize: "11px",
  fontWeight: 750,
  color: "#ea580c",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};

const modalTitleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "20px",
  fontWeight: 750,
};

const modalCloseStyle = {
  width: "34px",
  height: "34px",
  border: "none",
  borderRadius: "8px",
  background: "#f1f5f9",
  color: "#64748b",
  fontSize: "23px",
  lineHeight: 1,
  cursor: "pointer",
};

const modalBodyStyle = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: "20px 22px",
};

const detailsBodyStyle = {
  ...modalBodyStyle,
};

const modalFooterStyle = {
  flexShrink: 0,
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  padding: "14px 22px",
  borderTop: "1px solid #e2e8f0",
  background: "#f8fafc",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginBottom: "18px",
};

const fieldStyle = {
  minWidth: 0,
};

const fieldLabelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#475569",
  fontSize: "12px",
  fontWeight: 700,
};

const sectionTitleStyle = {
  margin: "4px 0 12px",
  paddingBottom: "7px",
  borderBottom: "1px solid #e2e8f0",
  color: "#334155",
  fontSize: "13px",
  fontWeight: 750,
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const summaryBoxStyle = {
  padding: "13px 14px",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  background: "#f8fafc",
};

const summaryLabelStyle = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

const summaryValueStyle = {
  marginTop: "6px",
  fontSize: "19px",
  fontWeight: 750,
  color: "#0f172a",
};

const calculationErrorStyle = {
  marginTop: "10px",
  padding: "10px 12px",
  borderRadius: "8px",
  background: "#fef2f2",
  color: "#b91c1c",
  fontSize: "12px",
};

const calculationHelpStyle = {
  margin: "9px 0 18px",
  fontSize: "12px",
  color: "#64748b",
};

const detailSectionStyle = {
  marginBottom: "18px",
};

const detailSectionTitleStyle = {
  marginBottom: "10px",
  paddingBottom: "7px",
  borderBottom: "1px solid #e2e8f0",
  color: "#334155",
  fontSize: "13px",
  fontWeight: 750,
};

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const viewItemStyle = {
  padding: "11px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: "9px",
  background: "#f8fafc",
};

const viewLabelStyle = {
  marginBottom: "5px",
  color: "#64748b",
  fontSize: "10px",
  fontWeight: 750,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const viewValueStyle = {
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: 650,
  overflowWrap: "anywhere",
};

const stateContainerStyle = {
  minHeight: "300px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 20px",
  textAlign: "center",
};

const spinnerStyle = {
  width: "30px",
  height: "30px",
  marginBottom: "14px",
  border: "3px solid #e2e8f0",
  borderTopColor: "#ea580c",
  borderRadius: "50%",
  animation:
    "milk-operations-spin 0.8s linear infinite",
};

const emptyIconStyle = {
  width: "42px",
  height: "42px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "12px",
  borderRadius: "12px",
  background: "#fff7ed",
  color: "#ea580c",
  fontSize: "18px",
  fontWeight: 800,
};

const stateTitleStyle = {
  color: "#334155",
  fontSize: "15px",
  fontWeight: 700,
};

const stateTextStyle = {
  marginTop: "6px",
  color: "#94a3b8",
  fontSize: "13px",
};

const toastStyle = {
  position: "fixed",
  top: "20px",
  right: "20px",
  zIndex: 3000,
  display: "flex",
  alignItems: "center",
  gap: "10px",
  maxWidth: "420px",
  padding: "12px 15px",
  borderRadius: "10px",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 650,
  boxShadow:
    "0 12px 28px rgba(15, 23, 42, 0.25)",
};

const successToastStyle = {
  background: "#15803d",
};

const errorToastStyle = {
  background: "#b91c1c",
};

const toastIconStyle = {
  width: "22px",
  height: "22px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  borderRadius: "50%",
  background:
    "rgba(255,255,255,0.22)",
};
