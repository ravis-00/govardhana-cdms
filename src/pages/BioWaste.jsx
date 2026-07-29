import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getBioWaste,
  addBioWaste,
  updateBioWaste,
  getSheds,
} from "../api/masterApi";


// =========================================================
// CONSTANTS
// =========================================================

const PAGE_SIZE = 10;

const WASTE_TYPE_OPTIONS = [
  "Dung (Gomaya)",
  "Urine (Gomutra)",
  "Slurry",
  "Leftover Feed",
  "Compost (Gobbara)",
  "Others",
];

const WASTE_TYPE_UNIT_MAP = {
  "Dung (Gomaya)": [
    "Kg",
    "Wheelbarrow",
    "Tractor Load",
  ],

  "Urine (Gomutra)": [
    "Liters",
  ],

  Slurry: [
    "Liters",
    "Tank",
  ],

  "Leftover Feed": [
    "Kg",
  ],

  "Compost (Gobbara)": [
    "Kg",
    "Wheelbarrow",
    "Tractor Load",
  ],

  Others: [
    "Kg",
    "Liters",
    "Tank",
    "Wheelbarrow",
    "Tractor Load",
  ],
};


// =========================================================
// HELPERS
// =========================================================

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonthStart() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    "01",
  ].join("-");
}

function formatDisplayDate(value) {
  if (!value) {
    return "";
  }

  const text = String(value);

  if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
    return text;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split("-");
    return `${day}-${month}-${year}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return text;
  }

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  return `${day}-${month}-${date.getFullYear()}`;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeWasteType(value) {
  const normalized =
    normalizeText(value);

  const aliases = {
    "dung (gomaya)": "Dung (Gomaya)",
    dung: "Dung (Gomaya)",
    gomaya: "Dung (Gomaya)",
    gaumaya: "Dung (Gomaya)",

    "urine (gomutra)": "Urine (Gomutra)",
    urine: "Urine (Gomutra)",
    gomutra: "Urine (Gomutra)",
    gaumutra: "Urine (Gomutra)",

    slurry: "Slurry",

    "leftover feed": "Leftover Feed",
    "feed waste": "Leftover Feed",

    "compost (gobbara)":
      "Compost (Gobbara)",

    compost:
      "Compost (Gobbara)",

    gobbara:
      "Compost (Gobbara)",

    others: "Others",
    other: "Others",
  };

  return aliases[normalized] || value || "Others";
}

function normalizeUnit(value) {
  const normalized =
    normalizeText(value);

  const aliases = {
    kg: "Kg",
    kgs: "Kg",
    kilogram: "Kg",
    kilograms: "Kg",

    liter: "Liters",
    liters: "Liters",
    litre: "Liters",
    litres: "Liters",
    l: "Liters",

    tank: "Tank",
    tanks: "Tank",

    tractor: "Tractor Load",
    "tractor load": "Tractor Load",
    "tractor loads": "Tractor Load",

    wheelbarrow: "Wheelbarrow",
    "wheel barrow": "Wheelbarrow",
    barrow: "Wheelbarrow",
  };

  return aliases[normalized] || value || "";
}

function getAllowedUnits(wasteType) {
  const normalizedType =
    normalizeWasteType(wasteType);

  return (
    WASTE_TYPE_UNIT_MAP[normalizedType] ||
    WASTE_TYPE_UNIT_MAP.Others
  );
}

function getDefaultUnit(wasteType) {
  return getAllowedUnits(wasteType)[0] || "";
}

function getEmptyForm() {
  const defaultWasteType =
    "Dung (Gomaya)";

  return {
    transactionId: "",
    transaction_id: "",
    rowIndex: "",

    date: getTodayIso(),

    sourceShed: [],

    wasteType:
      defaultWasteType,

    quantity: "",

    unit:
      getDefaultUnit(defaultWasteType),

    destination: "",
    sender: "",
    receiver: "",
    remarks: "",
  };
}

function roundQuantity(value) {
  return (
    Math.round(
      Number(value || 0) * 100
    ) / 100
  );
}

function createUnitSummary(rows) {
  const totals = {};

  rows.forEach((row) => {
    const unit =
      normalizeUnit(row.unit) ||
      "Unspecified";

    totals[unit] =
      roundQuantity(
        (totals[unit] || 0) +
          Number(row.quantity || 0)
      );
  });

  const entries =
    Object.entries(totals)
      .filter(([, quantity]) => quantity > 0)
      .map(
        ([unit, quantity]) =>
          `${quantity} ${unit}`
      );

  return entries.length > 0
    ? entries.join(" • ")
    : "0";
}

function getWasteBadgeStyle(wasteType) {
  const normalizedType =
    normalizeWasteType(wasteType);

  const styles = {
    "Dung (Gomaya)": {
      background: "#fef3c7",
      color: "#92400e",
    },

    "Urine (Gomutra)": {
      background: "#dbeafe",
      color: "#1e40af",
    },

    Slurry: {
      background: "#e0e7ff",
      color: "#3730a3",
    },

    "Leftover Feed": {
      background: "#ffedd5",
      color: "#9a3412",
    },

    "Compost (Gobbara)": {
      background: "#dcfce7",
      color: "#166534",
    },

    Others: {
      background: "#f3f4f6",
      color: "#374151",
    },
  };

  return (
    styles[normalizedType] ||
    styles.Others
  );
}


// =========================================================
// PAGE
// =========================================================

export default function BioWaste() {
  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [shedOptions, setShedOptions] =
    useState([]);

  const [fromDate, setFromDate] =
    useState(getCurrentMonthStart());

  const [toDate, setToDate] =
    useState(getTodayIso());

  const [searchText, setSearchText] =
    useState("");

  const [wasteTypeFilter, setWasteTypeFilter] =
    useState("");

  const [shedFilter, setShedFilter] =
    useState("");

  const [destinationFilter, setDestinationFilter] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [showModal, setShowModal] =
    useState(false);

  const [isEditMode, setIsEditMode] =
    useState(false);

  const [form, setForm] =
    useState(getEmptyForm());

  const [selectedEntry, setSelectedEntry] =
    useState(null);

  const [toast, setToast] =
    useState({
      show: false,
      type: "success",
      message: "",
    });

  const toastTimerRef =
    useRef(null);


  // =======================================================
  // TOAST
  // =======================================================

  function showToast(
    message,
    type = "success"
  ) {
    if (toastTimerRef.current) {
      clearTimeout(
        toastTimerRef.current
      );
    }

    setToast({
      show: true,
      type,
      message,
    });

    toastTimerRef.current =
      setTimeout(() => {
        setToast((current) => ({
          ...current,
          show: false,
        }));
      }, 3500);
  }


  // =======================================================
  // DATA LOADING
  // =======================================================

  useEffect(() => {
    loadData();
  }, [fromDate, toDate]);

  useEffect(() => {
    loadSheds();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(
          toastTimerRef.current
        );
      }
    };
  }, []);

  async function loadSheds() {
    const fallbackSheds = [
      "Govardhanagiri",
      "Nandini-Old",
      "Nandini-New",
      "Quarantine",
    ];

    try {
      const response =
        await getSheds();

      const rawSheds =
        response?.success &&
        Array.isArray(response.data)
          ? response.data
          : [];

      const names = rawSheds
        .map((shed) => {
          if (typeof shed === "string") {
            return shed.trim();
          }

          return String(
            shed?.name ||
            shed?.shedName ||
            shed?.shed_name ||
            ""
          ).trim();
        })
        .filter(Boolean);

      setShedOptions(
        names.length > 0
          ? [...new Set(names)]
          : fallbackSheds
      );
    } catch (error) {
      console.warn(
        "Shed load failed:",
        error
      );

      setShedOptions(
        fallbackSheds
      );
    }
  }

  async function loadData() {
    if (
      fromDate &&
      toDate &&
      fromDate > toDate
    ) {
      setRows([]);

      showToast(
        "From Date cannot be later than To Date.",
        "error"
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await getBioWaste({
          fromDate,
          toDate,
        });

      const rawData =
        response &&
        Array.isArray(response.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

      const normalizedRows =
        rawData.map((row) => ({
          ...row,

          transactionId:
            row.transactionId ||
            row.transaction_id ||
            "",

          date:
            row.date || "",

          sourceShed:
            row.sourceShed ||
            row.source_shed ||
            "",

          wasteType:
            normalizeWasteType(
              row.wasteType ||
              row.waste_type ||
              "Others"
            ),

          quantity:
            Number(row.quantity || 0),

          unit:
            normalizeUnit(
              row.unit || ""
            ),

          destination:
            row.destination ||
            row.destinationUnit ||
            row.destination_unit ||
            "",

          sender:
            row.sender ||
            row.senderName ||
            row.sender_name ||
            "",

          receiver:
            row.receiver ||
            row.receiverName ||
            row.receiver_name ||
            "",

          remarks:
            row.remarks || "",
        }));

      normalizedRows.sort(
        (first, second) => {
          if (
            first.date === second.date
          ) {
            return String(
              first.wasteType
            ).localeCompare(
              String(second.wasteType)
            );
          }

          return first.date <
            second.date
            ? 1
            : -1;
        }
      );

      setRows(normalizedRows);
    } catch (error) {
      console.error(
        "Unable to load Waste Management records:",
        error
      );

      setRows([]);

      showToast(
        error?.message ||
          "Unable to load Waste Management records.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }


  // =======================================================
  // FILTER OPTIONS
  // =======================================================

  const availableSheds =
    useMemo(() => {
      const values = rows
        .flatMap((row) =>
          String(
            row.sourceShed || ""
          )
            .split(",")
            .map((shed) => shed.trim())
        )
        .filter(Boolean);

      return [
        ...new Set([
          ...shedOptions,
          ...values,
        ]),
      ].sort();
    }, [rows, shedOptions]);

  const destinationOptions =
    useMemo(() => {
      return [
        ...new Set(
          rows
            .map((row) =>
              String(
                row.destination || ""
              ).trim()
            )
            .filter(Boolean)
        ),
      ].sort();
    }, [rows]);


  // =======================================================
  // FILTERED DATA
  // =======================================================

  const filteredRows =
    useMemo(() => {
      const normalizedSearch =
        normalizeText(searchText);

      return rows.filter((row) => {
        const rowWasteType =
          normalizeWasteType(
            row.wasteType
          );

        if (
          wasteTypeFilter &&
          rowWasteType !==
            wasteTypeFilter
        ) {
          return false;
        }

        if (shedFilter) {
          const rowSheds =
            String(
              row.sourceShed || ""
            )
              .split(",")
              .map((shed) =>
                normalizeText(shed)
              );

          if (
            !rowSheds.includes(
              normalizeText(shedFilter)
            )
          ) {
            return false;
          }
        }

        if (
          destinationFilter &&
          normalizeText(
            row.destination
          ) !==
            normalizeText(
              destinationFilter
            )
        ) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const searchableText = [
          row.transactionId,
          row.date,
          row.sourceShed,
          row.wasteType,
          row.quantity,
          row.unit,
          row.destination,
          row.sender,
          row.receiver,
          row.remarks,
        ]
          .map(normalizeText)
          .join(" ");

        return searchableText.includes(
          normalizedSearch
        );
      });
    }, [
      rows,
      searchText,
      wasteTypeFilter,
      shedFilter,
      destinationFilter,
    ]);


  // =======================================================
  // KPI DATA
  // =======================================================

  const dungRows =
    filteredRows.filter(
      (row) =>
        normalizeWasteType(
          row.wasteType
        ) === "Dung (Gomaya)"
    );

  const urineRows =
    filteredRows.filter(
      (row) =>
        normalizeWasteType(
          row.wasteType
        ) === "Urine (Gomutra)"
    );

  const slurryRows =
    filteredRows.filter(
      (row) =>
        normalizeWasteType(
          row.wasteType
        ) === "Slurry"
    );

  const otherRows =
    filteredRows.filter((row) =>
      ![
        "Dung (Gomaya)",
        "Urine (Gomutra)",
        "Slurry",
      ].includes(
        normalizeWasteType(
          row.wasteType
        )
      )
    );


  // =======================================================
  // PAGINATION
  // =======================================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredRows.length /
          PAGE_SIZE
      )
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchText,
    wasteTypeFilter,
    shedFilter,
    destinationFilter,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        PAGE_SIZE;

      return filteredRows.slice(
        startIndex,
        startIndex + PAGE_SIZE
      );
    }, [
      filteredRows,
      currentPage,
    ]);


  // =======================================================
  // FORM HANDLERS
  // =======================================================

  function openAddModal() {
    setIsEditMode(false);
    setForm(getEmptyForm());
    setShowModal(true);
  }

  function openEditModal(row) {
    const wasteType =
      normalizeWasteType(
        row.wasteType
      );

    const normalizedUnit =
      normalizeUnit(row.unit);

    const allowedUnits =
      getAllowedUnits(wasteType);

    const unit =
      allowedUnits.includes(
        normalizedUnit
      )
        ? normalizedUnit
        : getDefaultUnit(
            wasteType
          );

    const sourceSheds =
      String(
        row.sourceShed || ""
      )
        .split(",")
        .map((shed) => shed.trim())
        .filter(Boolean);

    setIsEditMode(true);

    setForm({
      ...getEmptyForm(),
      ...row,

      transactionId:
        row.transactionId ||
        row.transaction_id ||
        "",

      transaction_id:
        row.transactionId ||
        row.transaction_id ||
        "",

      date:
        row.date || getTodayIso(),

      sourceShed:
        sourceSheds,

      wasteType,

      quantity:
        row.quantity !== undefined &&
        row.quantity !== null
          ? row.quantity
          : "",

      unit,

      destination:
        row.destination || "",

      sender:
        row.sender || "",

      receiver:
        row.receiver || "",

      remarks:
        row.remarks || "",
    });

    setShowModal(true);
  }

  function closeFormModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => {
      if (name === "wasteType") {
        const allowedUnits =
          getAllowedUnits(value);

        return {
          ...previous,
          wasteType: value,

          unit:
            allowedUnits.includes(
              previous.unit
            )
              ? previous.unit
              : getDefaultUnit(
                  value
                ),
        };
      }

      return {
        ...previous,
        [name]: value,
      };
    });
  }

  function handleShedChange(
    newShedArray
  ) {
    setForm((previous) => ({
      ...previous,
      sourceShed:
        newShedArray,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    if (
      !Array.isArray(
        form.sourceShed
      ) ||
      form.sourceShed.length === 0
    ) {
      showToast(
        "Select at least one Source Shed.",
        "error"
      );

      return;
    }

    const quantity =
      Number(form.quantity);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      showToast(
        "Quantity must be greater than zero.",
        "error"
      );

      return;
    }

    if (
      !String(
        form.destination || ""
      ).trim()
    ) {
      showToast(
        "Destination is required.",
        "error"
      );

      return;
    }

    const allowedUnits =
      getAllowedUnits(
        form.wasteType
      );

    if (
      !allowedUnits.includes(
        form.unit
      )
    ) {
      showToast(
        `${form.unit} is not valid for ${form.wasteType}.`,
        "error"
      );

      return;
    }

    const wasEditMode =
      isEditMode;

    const payload = {
      ...form,

      transactionId:
        form.transactionId ||
        form.transaction_id ||
        "",

      transaction_id:
        form.transactionId ||
        form.transaction_id ||
        "",

      quantity:
        roundQuantity(quantity),

      sourceShed:
        form.sourceShed
          .map((shed) =>
            String(shed).trim()
          )
          .filter(Boolean)
          .join(", "),

      wasteType:
        normalizeWasteType(
          form.wasteType
        ),

      unit:
        normalizeUnit(
          form.unit
        ),

      destination:
        String(
          form.destination || ""
        ).trim(),

      sender:
        String(
          form.sender || ""
        ).trim(),

      receiver:
        String(
          form.receiver || ""
        ).trim(),

      remarks:
        String(
          form.remarks || ""
        ).trim(),
    };

    setSaving(true);

    try {
      if (wasEditMode) {
        await updateBioWaste(
          payload
        );
      } else {
        await addBioWaste(
          payload
        );
      }

      setShowModal(false);
      setForm(getEmptyForm());

      await loadData();

      showToast(
        wasEditMode
          ? "Waste Management entry updated successfully."
          : "Waste Management entry added successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        wasEditMode
          ? "Waste Management update failed:"
          : "Waste Management save failed:",
        error
      );

      showToast(
        error?.message ||
          (wasEditMode
            ? "Unable to update the entry."
            : "Unable to save the entry."),
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  function clearFilters() {
    setFromDate(
      getCurrentMonthStart()
    );

    setToDate(
      getTodayIso()
    );

    setSearchText("");
    setWasteTypeFilter("");
    setShedFilter("");
    setDestinationFilter("");
    setCurrentPage(1);
  }

  const allowedUnitOptions =
    getAllowedUnits(
      form.wasteType
    );


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div style={pageStyle}>
      {toast.show && (
        <div
          role="status"
          aria-live="polite"
          style={{
            ...toastStyle,

            ...(toast.type === "error"
              ? errorToastStyle
              : successToastStyle),
          }}
        >
          <span>
            {toast.type === "error"
              ? "⚠"
              : "✓"}
          </span>

          <span>
            {toast.message}
          </span>

          <button
            type="button"
            onClick={() =>
              setToast(
                (current) => ({
                  ...current,
                  show: false,
                })
              )
            }
            aria-label="Close notification"
            style={toastCloseStyle}
          >
            ×
          </button>
        </div>
      )}


      {/* PAGE HEADER */}

      <div style={headerStyle}>
        <div>
          <h1 style={pageTitleStyle}>
            Waste Management
          </h1>

          <p style={pageSubtitleStyle}>
            Record and monitor cattle waste collection,
            movement and destination details.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn btn-primary"
          style={{ whiteSpace: "nowrap" }}
        >
          + Add Entry
        </button>
      </div>


      {/* KPI CARDS */}

      <div style={kpiGridStyle}>
        <KpiCard
          label="Records"
          value={filteredRows.length}
          helper="Filtered entries"
        />

        <KpiCard
          label="Dung / Gomaya"
          value={createUnitSummary(
            dungRows
          )}
          helper={`${dungRows.length} entries`}
        />

        <KpiCard
          label="Urine / Gomutra"
          value={createUnitSummary(
            urineRows
          )}
          helper={`${urineRows.length} entries`}
        />

        <KpiCard
          label="Slurry"
          value={createUnitSummary(
            slurryRows
          )}
          helper={`${slurryRows.length} entries`}
        />

        <KpiCard
          label="Other Waste"
          value={createUnitSummary(
            otherRows
          )}
          helper={`${otherRows.length} entries`}
        />
      </div>


      {/* FILTERS */}

      <div
        className="card"
        style={filterCardStyle}
      >
        <div style={filterGridStyle}>
          <FilterField label="From Date">
            <input
              type="date"
              value={fromDate}
              max={toDate || getTodayIso()}
              onChange={(event) =>
                setFromDate(
                  event.target.value
                )
              }
              className="form-input"
            />
          </FilterField>

          <FilterField label="To Date">
            <input
              type="date"
              value={toDate}
              min={fromDate}
              max={getTodayIso()}
              onChange={(event) =>
                setToDate(
                  event.target.value
                )
              }
              className="form-input"
            />
          </FilterField>

          <FilterField label="Waste Type">
            <select
              value={wasteTypeFilter}
              onChange={(event) =>
                setWasteTypeFilter(
                  event.target.value
                )
              }
              className="form-select"
            >
              <option value="">
                All Waste Types
              </option>

              {WASTE_TYPE_OPTIONS.map(
                (wasteType) => (
                  <option
                    key={wasteType}
                    value={wasteType}
                  >
                    {wasteType}
                  </option>
                )
              )}
            </select>
          </FilterField>

          <FilterField label="Source Shed">
            <select
              value={shedFilter}
              onChange={(event) =>
                setShedFilter(
                  event.target.value
                )
              }
              className="form-select"
            >
              <option value="">
                All Sheds
              </option>

              {availableSheds.map(
                (shed) => (
                  <option
                    key={shed}
                    value={shed}
                  >
                    {shed}
                  </option>
                )
              )}
            </select>
          </FilterField>

          <FilterField label="Destination">
            <select
              value={destinationFilter}
              onChange={(event) =>
                setDestinationFilter(
                  event.target.value
                )
              }
              className="form-select"
            >
              <option value="">
                All Destinations
              </option>

              {destinationOptions.map(
                (destination) => (
                  <option
                    key={destination}
                    value={destination}
                  >
                    {destination}
                  </option>
                )
              )}
            </select>
          </FilterField>

          <FilterField label="Search">
            <input
              type="search"
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
              className="form-input"
              placeholder="Search records..."
            />
          </FilterField>
        </div>

        <div style={filterFooterStyle}>
          <span style={resultCountStyle}>
            Showing {filteredRows.length} of{" "}
            {rows.length} records
          </span>

          <button
            type="button"
            onClick={clearFilters}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>


      {/* TABLE */}

      <div
        className="card"
        style={tableCardStyle}
      >
        <div style={tableScrollStyle}>
          {loading ? (
            <div style={loadingStyle}>
              Loading Waste Management records...
            </div>
          ) : (
            <table style={tableStyle}>
              <thead style={tableHeadStyle}>
                <tr>
                  <th style={thStyle}>
                    Date
                  </th>

                  <th style={thStyle}>
                    Waste Type
                  </th>

                  <th style={thStyle}>
                    Source Shed(s)
                  </th>

                  <th style={thStyle}>
                    Quantity
                  </th>

                  <th style={thStyle}>
                    Destination
                  </th>

                  <th style={thStyle}>
                    Sender
                  </th>

                  <th style={thStyle}>
                    Receiver
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={emptyStateStyle}
                    >
                      No Waste Management records
                      found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map(
                    (row) => (
                      <tr
                        key={
                          row.transactionId ||
                          `${row.date}-${row.rowIndex}`
                        }
                        onClick={() =>
                          setSelectedEntry(row)
                        }
                        style={clickableRowStyle}
                        title="Click to view details"
                      >
                        <td style={tdStyle}>
                          <strong>
                            {formatDisplayDate(
                              row.date
                            )}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              ...wasteBadgeStyle,
                              ...getWasteBadgeStyle(
                                row.wasteType
                              ),
                            }}
                          >
                            {row.wasteType}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          {row.sourceShed || "-"}
                        </td>

                        <td style={tdStyle}>
                          <strong>
                            {roundQuantity(
                              row.quantity
                            )}
                          </strong>{" "}
                          {row.unit}
                        </td>

                        <td style={tdStyle}>
                          {row.destination || "-"}
                        </td>

                        <td style={tdStyle}>
                          {row.sender || "-"}
                        </td>

                        <td style={tdStyle}>
                          {row.receiver || "-"}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          )}
        </div>


        {/* PAGINATION */}

        {!loading &&
          filteredRows.length > 0 && (
            <div style={paginationStyle}>
              <span style={paginationTextStyle}>
                Page {currentPage} of{" "}
                {totalPages}
              </span>

              <div style={paginationButtonGroupStyle}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                >
                  Previous
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={
                    currentPage >=
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
      </div>


      {/* ADD / EDIT MODAL */}

      {showModal && (
        <div
          style={overlayStyle}
          onClick={closeFormModal}
        >
          <div
            style={modalStyle}
            onClick={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="bio-waste-form-title"
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2
                  id="bio-waste-form-title"
                  style={modalTitleStyle}
                >
                  {isEditMode
                    ? "Edit Waste Management Entry"
                    : "Add Waste Management Entry"}
                </h2>

                <p style={modalSubtitleStyle}>
                  Enter the collection and movement
                  details below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeFormModal}
                disabled={saving}
                style={modalCloseButtonStyle}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={formStyle}
            >
              <div className="responsive-grid">
                <Field label="Date">
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    max={getTodayIso()}
                    onChange={handleChange}
                    className="form-input"
                    disabled={saving}
                    required
                  />
                </Field>

                <Field label="Source Shed(s)">
                  <ShedMultiSelect
                    options={availableSheds}
                    selected={form.sourceShed}
                    onChange={handleShedChange}
                    disabled={saving}
                  />
                </Field>
              </div>

              <div className="responsive-grid">
                <Field label="Waste Type">
                  <select
                    name="wasteType"
                    value={form.wasteType}
                    onChange={handleChange}
                    className="form-select"
                    disabled={saving}
                    required
                  >
                    {WASTE_TYPE_OPTIONS.map(
                      (wasteType) => (
                        <option
                          key={wasteType}
                          value={wasteType}
                        >
                          {wasteType}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <div style={quantityUnitGridStyle}>
                  <Field label="Quantity">
                    <input
                      type="number"
                      name="quantity"
                      value={form.quantity}
                      min="0.01"
                      step="0.01"
                      onChange={handleChange}
                      className="form-input"
                      disabled={saving}
                      required
                    />
                  </Field>

                  <Field label="Unit">
                    <select
                      name="unit"
                      value={form.unit}
                      onChange={handleChange}
                      className="form-select"
                      disabled={saving}
                      required
                    >
                      {allowedUnitOptions.map(
                        (unitOption) => (
                          <option
                            key={unitOption}
                            value={unitOption}
                          >
                            {unitOption}
                          </option>
                        )
                      )}
                    </select>
                  </Field>
                </div>
              </div>

              <Field label="Destination">
                <input
                  type="text"
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. Biogas Plant, Compost Pit"
                  disabled={saving}
                  required
                />
              </Field>

              <div className="responsive-grid">
                <Field label="Sender (From Incharge)">
                  <input
                    type="text"
                    name="sender"
                    value={form.sender}
                    onChange={handleChange}
                    className="form-input"
                    disabled={saving}
                  />
                </Field>

                <Field label="Receiver (To Incharge)">
                  <input
                    type="text"
                    name="receiver"
                    value={form.receiver}
                    onChange={handleChange}
                    className="form-input"
                    disabled={saving}
                  />
                </Field>
              </div>

              <Field label="Remarks">
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  className="form-input"
                  rows="3"
                  disabled={saving}
                  style={{ resize: "vertical" }}
                />
              </Field>

              <div style={modalFooterStyle}>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="btn btn-secondary btn-full-mobile"
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary btn-full-mobile"
                >
                  {saving
                    ? isEditMode
                      ? "Updating..."
                      : "Saving..."
                    : isEditMode
                      ? "Update"
                      : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* DETAIL MODAL */}

      {selectedEntry && (
        <div
          style={overlayStyle}
          onClick={() =>
            setSelectedEntry(null)
          }
        >
          <div
            style={detailModalStyle}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>
                  Waste Management Details
                </h2>

                <p style={modalSubtitleStyle}>
                  {formatDisplayDate(
                    selectedEntry.date
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedEntry(null)
                }
                style={modalCloseButtonStyle}
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            <div style={detailGridStyle}>
              <DetailItem
                label="Transaction ID"
                value={
                  selectedEntry.transactionId
                }
                fullWidth
              />

              <DetailItem
                label="Date"
                value={formatDisplayDate(
                  selectedEntry.date
                )}
              />

              <DetailItem
                label="Waste Type"
                value={
                  selectedEntry.wasteType
                }
              />

              <DetailItem
                label="Quantity"
                value={`${roundQuantity(
                  selectedEntry.quantity
                )} ${selectedEntry.unit}`}
                isBold
              />

              <DetailItem
                label="Source Shed(s)"
                value={
                  selectedEntry.sourceShed
                }
              />

              <DetailItem
                label="Destination"
                value={
                  selectedEntry.destination
                }
              />

              <DetailItem
                label="Sender"
                value={selectedEntry.sender}
              />

              <DetailItem
                label="Receiver"
                value={
                  selectedEntry.receiver
                }
              />

              <DetailItem
                label="Remarks"
                value={
                  selectedEntry.remarks
                }
                fullWidth
              />
            </div>

            <div style={modalFooterStyle}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setSelectedEntry(null)
                }
              >
                Close
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const entry =
                    selectedEntry;

                  setSelectedEntry(null);
                  openEditModal(entry);
                }}
              >
                Edit Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// =========================================================
// COMPONENTS
// =========================================================

function ShedMultiSelect({
  options,
  selected,
  onChange,
  disabled = false,
}) {
  const [isOpen, setIsOpen] =
    useState(false);

  const dropdownRef =
    useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target
        )
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  function toggleOption(option) {
    if (disabled) {
      return;
    }

    if (selected.includes(option)) {
      onChange(
        selected.filter(
          (item) => item !== option
        )
      );
    } else {
      onChange([
        ...selected,
        option,
      ]);
    }
  }

  return (
    <div
      ref={dropdownRef}
      style={{ position: "relative" }}
    >
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(
              (current) => !current
            );
          }
        }}
        disabled={disabled}
        className="form-input"
        style={{
          width: "100%",
          cursor: disabled
            ? "not-allowed"
            : "pointer",

          background: disabled
            ? "#f3f4f6"
            : "#ffffff",

          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          minHeight: "40px",
          textAlign: "left",
        }}
      >
        <span style={multiSelectTextStyle}>
          {selected.length > 0
            ? selected.join(", ")
            : "-- Select Sheds --"}
        </span>

        <span style={dropdownArrowStyle}>
          ▼
        </span>
      </button>

      {isOpen && !disabled && (
        <div style={dropdownMenuStyle}>
          {options.length === 0 ? (
            <div style={dropdownEmptyStyle}>
              No sheds available
            </div>
          ) : (
            options.map((option) => {
              const checked =
                selected.includes(
                  option
                );

              return (
                <label
                  key={option}
                  style={{
                    ...dropdownOptionStyle,

                    background:
                      checked
                        ? "#fff7ed"
                        : "#ffffff",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      toggleOption(
                        option
                      )
                    }
                  />

                  <span>{option}</span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  helper,
}) {
  return (
    <div
      className="card"
      style={kpiCardStyle}
    >
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

function FilterField({
  label,
  children,
}) {
  return (
    <div>
      <label style={filterLabelStyle}>
        {label}
      </label>

      {children}
    </div>
  );
}

function Field({
  label,
  children,
}) {
  return (
    <div>
      <label style={fieldLabelStyle}>
        {label}
      </label>

      {children}
    </div>
  );
}

function DetailItem({
  label,
  value,
  isBold = false,
  fullWidth = false,
}) {
  return (
    <div
      style={{
        ...detailItemStyle,

        ...(fullWidth
          ? {
              gridColumn: "1 / -1",
            }
          : {}),
      }}
    >
      <div style={detailLabelStyle}>
        {label}
      </div>

      <div
        style={{
          ...detailValueStyle,

          ...(isBold
            ? {
                fontWeight: 700,
                fontSize: "1.05rem",
              }
            : {}),
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}


// =========================================================
// STYLES
// =========================================================

const pageStyle = {
  padding: "1.5rem",
  maxWidth: "1400px",
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "1rem",
  marginBottom: "1.25rem",
};

const pageTitleStyle = {
  margin: 0,
  color: "#111827",
  fontSize: "1.65rem",
  fontWeight: 700,
};

const pageSubtitleStyle = {
  margin: "0.35rem 0 0",
  color: "#6b7280",
  fontSize: "0.92rem",
};

const kpiGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "1rem",
  marginBottom: "1rem",
};

const kpiCardStyle = {
  padding: "1rem",
  minHeight: "105px",
};

const kpiLabelStyle = {
  color: "#6b7280",
  fontSize: "0.78rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const kpiValueStyle = {
  marginTop: "0.55rem",
  color: "#111827",
  fontSize: "1.25rem",
  fontWeight: 700,
  lineHeight: 1.35,
};

const kpiHelperStyle = {
  marginTop: "0.45rem",
  color: "#9ca3af",
  fontSize: "0.78rem",
};

const filterCardStyle = {
  padding: "1rem",
  marginBottom: "1rem",
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(165px, 1fr))",
  gap: "0.85rem",
  alignItems: "end",
};

const filterFooterStyle = {
  marginTop: "0.9rem",
  paddingTop: "0.85rem",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "0.75rem",
};

const filterLabelStyle = {
  display: "block",
  marginBottom: "0.35rem",
  color: "#374151",
  fontSize: "0.78rem",
  fontWeight: 600,
};

const resultCountStyle = {
  color: "#6b7280",
  fontSize: "0.82rem",
};

const tableCardStyle = {
  padding: 0,
  overflow: "hidden",
};

const tableScrollStyle = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  minWidth: "1000px",
  borderCollapse: "collapse",
  fontSize: "0.88rem",
};

const tableHeadStyle = {
  position: "sticky",
  top: 0,
  zIndex: 5,
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
};

const thStyle = {
  padding: "0.9rem 1rem",
  textAlign: "left",
  color: "#4b5563",
  fontSize: "0.74rem",
  fontWeight: 700,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "0.85rem 1rem",
  color: "#1f2937",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "top",
};

const clickableRowStyle = {
  cursor: "pointer",
  transition: "background 0.15s ease",
};

const wasteBadgeStyle = {
  display: "inline-flex",
  padding: "0.25rem 0.55rem",
  borderRadius: "999px",
  fontSize: "0.74rem",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const loadingStyle = {
  padding: "3rem",
  textAlign: "center",
  color: "#6b7280",
};

const emptyStateStyle = {
  padding: "3rem",
  textAlign: "center",
  color: "#9ca3af",
};

const paginationStyle = {
  padding: "0.8rem 1rem",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "0.75rem",
};

const paginationTextStyle = {
  color: "#6b7280",
  fontSize: "0.82rem",
};

const paginationButtonGroupStyle = {
  display: "flex",
  gap: "0.5rem",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  padding: "1rem",
  background: "rgba(15, 23, 42, 0.55)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalStyle = {
  width: "100%",
  maxWidth: "720px",
  maxHeight: "92vh",
  padding: "1.5rem",
  overflowY: "auto",
  borderRadius: "12px",
  background: "#ffffff",
  boxShadow:
    "0 24px 60px rgba(15, 23, 42, 0.25)",
};

const detailModalStyle = {
  ...modalStyle,
  maxWidth: "680px",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "1rem",
  paddingBottom: "1rem",
  marginBottom: "1.1rem",
  borderBottom: "1px solid #e5e7eb",
};

const modalTitleStyle = {
  margin: 0,
  color: "#111827",
  fontSize: "1.25rem",
  fontWeight: 700,
};

const modalSubtitleStyle = {
  margin: "0.3rem 0 0",
  color: "#6b7280",
  fontSize: "0.85rem",
};

const modalCloseButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#6b7280",
  cursor: "pointer",
  fontSize: "1.5rem",
  lineHeight: 1,
};

const formStyle = {
  display: "grid",
  gap: "1rem",
};

const quantityUnitGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 150px",
  gap: "0.6rem",
};

const fieldLabelStyle = {
  display: "block",
  marginBottom: "0.35rem",
  color: "#374151",
  fontSize: "0.82rem",
  fontWeight: 600,
};

const modalFooterStyle = {
  marginTop: "1.25rem",
  paddingTop: "1rem",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "0.75rem",
};

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "0.9rem",
};

const detailItemStyle = {
  padding: "0.8rem",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  background: "#f9fafb",
};

const detailLabelStyle = {
  color: "#6b7280",
  fontSize: "0.72rem",
  fontWeight: 700,
  textTransform: "uppercase",
};

const detailValueStyle = {
  marginTop: "0.3rem",
  color: "#111827",
  fontSize: "0.92rem",
  fontWeight: 500,
  overflowWrap: "anywhere",
};

const multiSelectTextStyle = {
  maxWidth: "90%",
  overflow: "hidden",
  color: "#374151",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const dropdownArrowStyle = {
  color: "#6b7280",
  fontSize: "0.72rem",
};

const dropdownMenuStyle = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  zIndex: 30,
  maxHeight: "220px",
  overflowY: "auto",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  background: "#ffffff",
  boxShadow:
    "0 10px 24px rgba(15, 23, 42, 0.12)",
};

const dropdownOptionStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.55rem",
  padding: "0.65rem 0.75rem",
  borderBottom: "1px solid #f3f4f6",
  color: "#374151",
  cursor: "pointer",
  fontSize: "0.85rem",
};

const dropdownEmptyStyle = {
  padding: "0.8rem",
  color: "#9ca3af",
  fontSize: "0.82rem",
  textAlign: "center",
};

const toastStyle = {
  position: "fixed",
  top: "1rem",
  right: "1rem",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  gap: "0.65rem",
  maxWidth: "420px",
  padding: "0.85rem 1rem",
  borderRadius: "8px",
  boxShadow:
    "0 10px 25px rgba(15, 23, 42, 0.18)",
  fontSize: "0.9rem",
  fontWeight: 600,
};

const successToastStyle = {
  background: "#ecfdf5",
  color: "#065f46",
  border: "1px solid #a7f3d0",
};

const errorToastStyle = {
  background: "#fef2f2",
  color: "#991b1b",
  border: "1px solid #fecaca",
};

const toastCloseStyle = {
  marginLeft: "auto",
  padding: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  fontSize: "1.25rem",
  lineHeight: 1,
  cursor: "pointer",
};