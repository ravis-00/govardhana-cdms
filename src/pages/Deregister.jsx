import React, { useEffect, useMemo, useState } from "react";
import { fetchCattle, updateCattle } from "../api/masterApi";

const EXIT_TYPES = ["Death", "Sold", "Donated", "Lost"];

const DEATH_CAUSES = [
  "Old Age",
  "Disease",
  "Accident",
  "Natural Calamity",
  "Other",
];

const EMPTY_FILTERS = {
  gender: "",
  breed: "",
  shed: "",
};

export default function Deregister() {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1280 : window.innerWidth
  );
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  const [viewing, setViewing] = useState(null);
  const [selectedForExit, setSelectedForExit] = useState(null);

  const [toast, setToast] = useState({
    open: false,
    type: "info",
    message: "",
  });

  const showToast = (type, message) => {
    setToast({
      open: true,
      type,
      message,
    });
  };

  const closeToast = () => {
    setToast((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const res = await fetchCattle();

      const allData = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];

      const activeOnly = allData.filter((cattle) => {
        return (
          String(cattle?.status || "")
            .trim()
            .toLowerCase() === "active"
        );
      });

      setRows(activeOnly);
    } catch (err) {
      console.error("Unable to load active cattle:", err);

      setRows([]);
      setLoadError(
        err?.message || "Unable to load active cattle."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    if (!toast.open) return undefined;

    const timer = setTimeout(() => {
      closeToast();
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast.open]);

  const breedOptions = useMemo(() => {
    return [
      ...new Set(
        rows
          .map((row) => String(row?.breed || "").trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const shedOptions = useMemo(() => {
    return [
      ...new Set(
        rows
          .map((row) => String(row?.shed || "").trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const metrics = useMemo(() => {
    const female = rows.filter((row) =>
      String(row?.gender || "")
        .trim()
        .toLowerCase()
        .startsWith("f")
    ).length;

    const male = rows.filter((row) =>
      String(row?.gender || "")
        .trim()
        .toLowerCase()
        .startsWith("m")
    ).length;

    const sheds = new Set(
      rows
        .map((row) => String(row?.shed || "").trim())
        .filter(Boolean)
    ).size;

    return {
      total: rows.length,
      female,
      male,
      sheds,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return rows.filter((row) => {
      const searchableText = [
        row?.tag,
        row?.tagNumber,
        row?.tag_number,
        row?.name,
        row?.id,
        row?.internalId,
        row?.internal_id,
        row?.breed,
        row?.gender,
        row?.shed,
        row?.category,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      const matchesSearch =
        !search || searchableText.includes(search);

      const matchesGender =
        !filters.gender ||
        String(row?.gender || "")
          .trim()
          .toLowerCase() === filters.gender.toLowerCase();

      const matchesBreed =
        !filters.breed ||
        String(row?.breed || "").trim() === filters.breed;

      const matchesShed =
        !filters.shed ||
        String(row?.shed || "").trim() === filters.shed;

      return (
        matchesSearch &&
        matchesGender &&
        matchesBreed &&
        matchesShed
      );
    });
  }, [rows, searchText, filters]);

  const hasActiveFilters =
    Boolean(searchText.trim()) ||
    Boolean(filters.gender) ||
    Boolean(filters.breed) ||
    Boolean(filters.shed);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / recordsPerPage)
  );

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage;
    return filteredRows.slice(start, start + recordsPerPage);
  }, [filteredRows, currentPage, recordsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filters.gender, filters.breed, filters.shed, recordsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const clearFilters = () => {
    setSearchText("");
    setFilters(EMPTY_FILTERS);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRefresh = async () => {
    await loadData();
    showToast("success", "Active herd refreshed.");
  };

  return (
    <div style={{ ...pageStyle, padding: isMobile ? "1rem" : "1.5rem", minWidth: 0 }}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Herd Management · Herd Lifecycle</div>

          <h1 style={pageTitleStyle}>
            Herd Exit
          </h1>

          <p style={pageSubtitleStyle}>
            Deregister active cattle due to death, sale, donation or
            loss.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          style={{
            ...refreshButtonStyle,
            width: isMobile ? "100%" : "auto",
            ...(loading ? disabledButtonStyle : {}),
          }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div style={{
        ...metricsGridStyle,
        gridTemplateColumns: isMobile
          ? "repeat(2, minmax(0, 1fr))"
          : "repeat(auto-fit, minmax(180px, 1fr))",
        gap: isMobile ? "0.75rem" : "1rem",
      }}>
        <MetricCard
          label="Active Herd"
          value={metrics.total}
          helper="Available for herd exit"
        />

        <MetricCard
          label="Female"
          value={metrics.female}
          helper="Active female cattle"
        />

        <MetricCard
          label="Male"
          value={metrics.male}
          helper="Active male cattle"
        />

        <MetricCard
          label="Sheds"
          value={metrics.sheds}
          helper="Represented in active herd"
        />
      </div>

      <div style={filterCardStyle}>
        <div style={{
          ...filterGridStyle,
          gridTemplateColumns: isMobile
            ? "repeat(2, minmax(0, 1fr))"
            : isTablet
            ? "repeat(3, minmax(0, 1fr))"
            : "repeat(auto-fit, minmax(170px, 1fr))",
        }}>
          <div style={{ gridColumn: isMobile ? "1 / -1" : "span 2", minWidth: 0 }}>
            <label style={filterLabelStyle}>
              Search
            </label>

            <input
              type="text"
              placeholder="Search tag, name, internal ID, breed or shed..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
              style={filterInputStyle}
            />
          </div>

          <div>
            <label style={filterLabelStyle}>
              Gender
            </label>

            <select
              name="gender"
              value={filters.gender}
              onChange={handleFilterChange}
              style={filterInputStyle}
            >
              <option value="">All Genders</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </div>

          <div>
            <label style={filterLabelStyle}>
              Breed
            </label>

            <select
              name="breed"
              value={filters.breed}
              onChange={handleFilterChange}
              style={filterInputStyle}
            >
              <option value="">All Breeds</option>

              {breedOptions.map((breed) => (
                <option key={breed} value={breed}>
                  {breed}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={filterLabelStyle}>
              Shed
            </label>

            <select
              name="shed"
              value={filters.shed}
              onChange={handleFilterChange}
              style={filterInputStyle}
            >
              <option value="">All Sheds</option>

              {shedOptions.map((shed) => (
                <option key={shed} value={shed}>
                  {shed}
                </option>
              ))}
            </select>
          </div>

          <div style={filterActionStyle}>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              style={{
                ...clearButtonStyle,
                ...(!hasActiveFilters
                  ? disabledButtonStyle
                  : {}),
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div style={resultCountStyle}>
          Showing <strong>{filteredRows.length}</strong> of{" "}
          <strong>{rows.length}</strong> active cattle
        </div>
      </div>

      <div style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <div>
            <div style={tableTitleStyle}>Active Herd</div>

            <div style={tableSubtitleStyle}>
              Click a row to review cattle details before
              deregistration.
            </div>
          </div>
        </div>

        <PaginationBar
          recordCount={filteredRows.length}
          currentPage={currentPage}
          totalPages={totalPages}
          onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
          onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        />

        {useCompactRecords ? (
          <div style={mobileListStyle}>
            {loading ? (
              <div style={mobileEmptyStyle}>Loading active herd...</div>
            ) : loadError ? (
              <div style={{ ...mobileEmptyStyle, color: "#b91c1c" }}>{loadError}</div>
            ) : filteredRows.length === 0 ? (
              <div style={mobileEmptyStyle}>
                {hasActiveFilters
                  ? "No active cattle match the selected filters."
                  : "No active cattle are currently available."}
              </div>
            ) : (
              paginatedRows.map((row, index) => (
                <MobileCattleCard
                  key={getInternalId(row) || getTagNumber(row) || index}
                  row={row}
                  onView={() => setViewing(row)}
                  onDeregister={() => setSelectedForExit(row)}
                />
              ))
            )}
          </div>
        ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead style={tableHeadStyle}>
              <tr>
                <th style={thStyle}>Tag No</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Breed</th>
                <th style={thStyle}>Gender</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Shed</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "center" }}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={emptyCellStyle}>
                    Loading active herd...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      ...emptyCellStyle,
                      color: "#b91c1c",
                    }}
                  >
                    {loadError}
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={emptyCellStyle}>
                    {hasActiveFilters
                      ? "No active cattle match the selected filters."
                      : "No active cattle are currently available."}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, index) => {
                  const rowKey =
                    row?.internalId ||
                    row?.internal_id ||
                    row?.id ||
                    row?.tag ||
                    index;

                  return (
                    <tr
                      key={rowKey}
                      onClick={() => setViewing(row)}
                      style={{
                        ...tableRowStyle,
                        background:
                          index % 2 === 0
                            ? "#ffffff"
                            : "#fffdf8",
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.background =
                          "#fff7ed";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.background =
                          index % 2 === 0
                            ? "#ffffff"
                            : "#fffdf8";
                      }}
                    >
                      <td style={tdStyle}>
                        <strong style={{ color: "#0f172a" }}>
                          {getTagNumber(row) || "-"}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        {row?.name || "-"}
                      </td>

                      <td style={tdStyle}>
                        {row?.breed || "-"}
                      </td>

                      <td style={tdStyle}>
                        <GenderText gender={row?.gender} />
                      </td>

                      <td style={tdStyle}>
                        {row?.category || "-"}
                      </td>

                      <td style={tdStyle}>
                        {row?.shed || "-"}
                      </td>

                      <td style={tdStyle}>
                        <StatusBadge status={row?.status} />
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
                            setSelectedForExit(row);
                          }}
                          style={dangerButtonStyle}
                        >
                          Deregister
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}

        {filteredRows.length > 0 && (
          <PaginationBar
            recordCount={filteredRows.length}
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
            onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            isFooter
          />
        )}
      </div>

      {viewing && (
        <CattlePreviewModal
          selected={viewing}
          onClose={() => setViewing(null)}
          onDeregister={() => {
            setSelectedForExit(viewing);
            setViewing(null);
          }}
          isMobile={isMobile}
        />
      )}

      {selectedForExit && (
        <DeregisterModal
          selected={selectedForExit}
          onClose={() => setSelectedForExit(null)}
          onSuccess={async (message) => {
            setSelectedForExit(null);
            await loadData();
            showToast("success", message);
          }}
          showToast={showToast}
          isMobile={isMobile}
        />
      )}

      {toast.open && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={closeToast}
        />
      )}
    </div>
  );
}

function PaginationBar({
  recordCount,
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  isFooter = false,
}) {
  return (
    <div style={{
      ...paginationBarStyle,
      ...(isFooter ? paginationFooterStyle : {}),
    }}>
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
          style={{
            ...paginationButtonStyle,
            ...(currentPage <= 1 ? disabledButtonStyle : {}),
          }}
        >
          Prev
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= totalPages}
          style={{
            ...paginationButtonStyle,
            ...(currentPage >= totalPages ? disabledButtonStyle : {}),
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function MetricCard({ label, value, helper }) {
  return (
    <div style={metricCardStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>{value}</div>
      <div style={metricHelperStyle}>{helper}</div>
    </div>
  );
}

function MobileCattleCard({ row, onView, onDeregister }) {
  return (
    <article onClick={onView} style={mobileCardStyle}>
      <div style={mobileCardHeaderStyle}>
        <div style={{ minWidth: 0 }}>
          <div style={mobileCardEyebrowStyle}>Tag Number</div>
          <div style={mobileCardTitleStyle}>{getTagNumber(row) || "-"}</div>
          <div style={mobileCardNameStyle}>{row?.name || "Unnamed Cattle"}</div>
        </div>
        <StatusBadge status={row?.status} />
      </div>

      <div style={mobileCardGridStyle}>
        <MobileCardDetail label="Breed" value={row?.breed} />
        <MobileCardDetail label="Gender" value={<GenderText gender={row?.gender} />} />
        <MobileCardDetail label="Category" value={row?.category} />
        <MobileCardDetail label="Shed" value={row?.shed} />
      </div>

      <div style={mobileCardActionsStyle}>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onView();
          }}
          style={secondaryButtonStyle}
        >
          View
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDeregister();
          }}
          style={dangerButtonStyle}
        >
          Deregister
        </button>
      </div>
    </article>
  );
}

function MobileCardDetail({ label, value }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={mobileCardDetailLabelStyle}>{label}</div>
      <div style={mobileCardDetailValueStyle}>{value || "-"}</div>
    </div>
  );
}

function GenderText({ gender }) {
  const normalized = String(gender || "")
    .trim()
    .toLowerCase();

  const color = normalized.startsWith("f")
    ? "#be185d"
    : normalized.startsWith("m")
      ? "#1d4ed8"
      : "#475569";

  return (
    <span style={{ color, fontWeight: 700 }}>
      {gender || "-"}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span style={activeBadgeStyle}>
      {status || "Active"}
    </span>
  );
}

function CattlePreviewModal({
  selected,
  onClose,
  onDeregister,
  isMobile,
}) {
  return (
    <div style={{ ...overlayStyle, padding: isMobile ? 0 : "1rem", alignItems: isMobile ? "stretch" : "center" }} onClick={onClose}>
      <div
        style={{
          ...previewModalStyle,
          width: isMobile ? "100%" : "720px",
          height: isMobile ? "100dvh" : "auto",
          maxHeight: isMobile ? "100dvh" : "90vh",
          borderRadius: isMobile ? 0 : "12px",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={modalHeaderStyle}>
          <div>
            <div style={modalEyebrowStyle}>
              Active Cattle Preview
            </div>

            <h2 style={modalTitleStyle}>
              {selected?.name || "Unnamed Cattle"}
            </h2>

            <div style={modalIdentityStyle}>
              <span style={identityChipStyle}>
                ID: {getInternalId(selected) || "-"}
              </span>

              <span style={identityChipStyle}>
                Tag: {getTagNumber(selected) || "-"}
              </span>

              <StatusBadge status={selected?.status} />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={closeButtonStyle}
          >
            ×
          </button>
        </div>

        <div style={{ ...previewGridStyle, flex: 1, overflowY: "auto", paddingRight: "2px" }}>
          <PreviewItem
            label="Name"
            value={selected?.name}
          />

          <PreviewItem
            label="Gender"
            value={
              <GenderText gender={selected?.gender} />
            }
          />

          <PreviewItem
            label="Breed"
            value={selected?.breed}
          />

          <PreviewItem
            label="Category"
            value={selected?.category}
          />

          <PreviewItem
            label="Colour"
            value={
              selected?.color ||
              selected?.colour
            }
          />

          <PreviewItem
            label="Date of Birth"
            value={formatDisplayDate(selected?.dob)}
          />

          <PreviewItem
            label="Shed"
            value={selected?.shed}
          />

          <PreviewItem
            label="Admission Type"
            value={selected?.admissionType}
          />

          <PreviewItem
            label="Admission Date"
            value={formatDisplayDate(
              selected?.admissionDate
            )}
          />

          <PreviewItem
            label="Govt UID / INAPH"
            value={
              selected?.govtUid ||
              selected?.govt_uid
            }
          />

          <div style={{ gridColumn: "1 / -1" }}>
            <PreviewItem
              label="Remarks"
              value={selected?.remarks}
            />
          </div>
        </div>

        <div style={modalFooterStyle}>
          <button
            type="button"
            onClick={onClose}
            style={secondaryButtonStyle}
          >
            Close
          </button>

          <button
            type="button"
            onClick={onDeregister}
            style={confirmExitButtonStyle}
          >
            Proceed to Deregister
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewItem({ label, value }) {
  const displayValue =
    value === null ||
    value === undefined ||
    value === ""
      ? "Not recorded"
      : value;

  return (
    <div style={previewItemStyle}>
      <div style={previewLabelStyle}>{label}</div>
      <div style={previewValueStyle}>{displayValue}</div>
    </div>
  );
}

function DeregisterModal({
  selected,
  onClose,
  onSuccess,
  showToast,
  isMobile,
}) {
  const isFemale =
    String(selected?.gender || "")
      .trim()
      .toLowerCase()
      .startsWith("f");

  const [formData, setFormData] = useState({
    type: "Death",
    date: new Date().toISOString().slice(0, 10),
    time: "",
    category: "Old Age",
    specificCause: "",
    doctorName: "",
    teethDetails: "",
    teethAge: "",
    pregnancyStatus: isFemale
      ? "Not Pregnant"
      : "Not Applicable",
    marketValue: "",
    buyerName: "",
    buyerContact: "",
    buyerAddress: "",
    salePrice: "",
    gatePass: "",
    paymentRef: "",
    receiptNo: "",
    receiverName: "",
    receiverContact: "",
    receiverAddress: "",
    remarks: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] =
    useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.date) {
      return "Please select an Exit Date.";
    }

    if (formData.type === "Death") {
      if (!formData.time) {
        return "Time of Death is required.";
      }

      if (!formData.category) {
        return "Cause Category is required.";
      }

      if (!formData.specificCause.trim()) {
        return "Specific Cause of Death is required.";
      }

      if (!formData.doctorName.trim()) {
        return "Doctor or certifying authority is required.";
      }

      if (!formData.teethDetails.trim()) {
        return "Teeth Details are required.";
      }

      if (!formData.teethAge.trim()) {
        return "Age by Teeth is required.";
      }

      if (!formData.marketValue) {
        return "Market Value is required.";
      }
    }

    if (formData.type === "Sold") {
      if (!formData.buyerName.trim()) {
        return "Buyer Name is required.";
      }

      if (!formData.salePrice) {
        return "Sale Price is required.";
      }
    }

    return "";
  };

  const requestConfirmation = () => {
    const validationError = validateForm();

    if (validationError) {
      showToast("error", validationError);
      return;
    }

    setShowConfirmation(true);
  };

  const handleSubmit = async () => {
    setShowConfirmation(false);
    setSubmitting(true);

    showToast(
      "info",
      `Please wait... Marking ${getTagNumber(selected)} as ${formData.type}.`
    );

    try {
      const payload = {
        action: "deregisterCattle",

        id: getInternalId(selected),
        tagNumber: getTagNumber(selected),

        exitType: formData.type,
        exitDate: formData.date,
        exitTime: formData.time,
        remarks: formData.remarks,

        category:
          formData.type === "Death"
            ? formData.category
            : "",

        specificCause:
          formData.type === "Death"
            ? formData.specificCause
            : "",

        partyName:
          formData.type === "Death"
            ? formData.doctorName
            : formData.type === "Sold"
              ? formData.buyerName
              : formData.receiverName,

        partyContact:
          formData.type === "Sold"
            ? formData.buyerContact
            : formData.receiverContact,

        partyAddress:
          formData.type === "Sold"
            ? formData.buyerAddress
            : formData.receiverAddress,

        amount:
          formData.type === "Sold"
            ? formData.salePrice
            : "",

        gatePass:
          formData.type === "Sold"
            ? formData.gatePass
            : "",

        receiptNo:
          formData.type === "Sold"
            ? formData.receiptNo
            : "",

        referenceNumber:
          formData.type === "Sold"
            ? formData.paymentRef
            : "",

        teethDetails:
          formData.type === "Death"
            ? formData.teethDetails
            : "",

        teethAge:
          formData.type === "Death"
            ? formData.teethAge
            : "",

        pregnancyStatus:
          formData.type === "Death"
            ? isFemale
              ? formData.pregnancyStatus
              : "Not Applicable"
            : "",

        marketValue:
          formData.type === "Death"
            ? formData.marketValue
            : "",
      };

      /*
       * Existing working API call preserved.
       * Do not replace during this UI-only update.
       */
      const res = await updateCattle(payload);

      if (!res?.success) {
        throw new Error(
          res?.error || "Unable to complete herd exit."
        );
      }

      onSuccess(
        `${getTagNumber(selected)} marked as ${formData.type} successfully.`
      );
    } catch (err) {
      console.error("Herd exit submission failed:", err);

      showToast(
        "error",
        err?.message || "Unable to submit herd exit."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div style={{ ...overlayStyle, padding: isMobile ? 0 : "1rem", alignItems: isMobile ? "stretch" : "center" }} onClick={onClose}>
        <div
          style={{
            ...exitModalStyle,
            width: isMobile ? "100%" : "760px",
            height: isMobile ? "100dvh" : "auto",
            maxHeight: isMobile ? "100dvh" : "92vh",
            borderRadius: isMobile ? 0 : "12px",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div style={modalHeaderStyle}>
            <div>
              <div style={modalEyebrowStyle}>
                De-Admission / Herd Exit
              </div>

              <h2 style={modalTitleStyle}>
                {selected?.name || "Unnamed Cattle"}
              </h2>

              <div style={modalIdentityStyle}>
                <span style={identityChipStyle}>
                  ID: {getInternalId(selected) || "-"}
                </span>

                <span style={identityChipStyle}>
                  Tag: {getTagNumber(selected) || "-"}
                </span>

                <span style={identityChipStyle}>
                  Breed: {selected?.breed || "-"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={closeButtonStyle}
            >
              ×
            </button>
          </div>

          <div style={{
            ...formGridStyle,
            gridTemplateColumns: isMobile ? "minmax(0, 1fr)" : formGridStyle.gridTemplateColumns,
            flex: 1,
            overflowY: "auto",
            paddingRight: "2px",
          }}>
            <div>
              <label style={labelStyle}>
                Reason / Type *
              </label>

              <select
                name="type"
                style={inputStyle}
                value={formData.type}
                onChange={handleChange}
                disabled={submitting}
              >
                {EXIT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Exit Date *
              </label>

              <input
                type="date"
                name="date"
                style={inputStyle}
                value={formData.date}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            {formData.type === "Death" && (
              <DeathFields
                formData={formData}
                handleChange={handleChange}
                isFemale={isFemale}
                disabled={submitting}
              />
            )}

            {formData.type === "Sold" && (
              <SoldFields
                formData={formData}
                handleChange={handleChange}
                disabled={submitting}
              />
            )}

            {formData.type === "Donated" && (
              <ReceiverFields
                title="Donation Receiver Details"
                formData={formData}
                handleChange={handleChange}
                disabled={submitting}
              />
            )}

            {formData.type === "Lost" && (
              <div style={warningPanelStyle}>
                <div style={warningPanelTitleStyle}>
                  Lost Cattle
                </div>

                <div style={warningPanelTextStyle}>
                  Record available details in Remarks, including
                  last-seen location and reporting reference.
                </div>
              </div>
            )}

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                Remarks
              </label>

              <textarea
                name="remarks"
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
                value={formData.remarks}
                onChange={handleChange}
                disabled={submitting}
                placeholder="Enter supporting notes or observations..."
              />
            </div>
          </div>

          <div style={modalFooterStyle}>
            <button
              type="button"
              onClick={onClose}
              style={secondaryButtonStyle}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={requestConfirmation}
              style={{
                ...confirmExitButtonStyle,
                ...(submitting ? disabledButtonStyle : {}),
              }}
              disabled={submitting}
            >
              {submitting
                ? "Processing..."
                : "Confirm Exit"}
            </button>
          </div>
        </div>
      </div>

      {showConfirmation && (
        <ConfirmDialog
          title="Confirm Herd Exit"
          message={`Mark ${getTagNumber(selected)} as ${formData.type}? This action will remove the cattle from the active herd.`}
          confirmLabel={`Confirm ${formData.type}`}
          onCancel={() => setShowConfirmation(false)}
          onConfirm={handleSubmit}
        />
      )}
    </>
  );
}

function DeathFields({
  formData,
  handleChange,
  isFemale,
  disabled,
}) {
  return (
    <div style={deathPanelStyle}>
      <div style={deathPanelTitleStyle}>
        Death Certificate Details
      </div>

      <div>
        <label style={labelStyle}>
          Cause Category *
        </label>

        <select
          name="category"
          style={inputStyle}
          value={formData.category}
          onChange={handleChange}
          disabled={disabled}
        >
          {DEATH_CAUSES.map((cause) => (
            <option key={cause} value={cause}>
              {cause === "Disease"
                ? "Disease / Illness"
                : cause}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>
          Specific Cause *
        </label>

        <input
          type="text"
          name="specificCause"
          style={inputStyle}
          value={formData.specificCause}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Disease, condition or incident"
        />
      </div>

      <div>
        <label style={labelStyle}>
          Time of Death *
        </label>

        <input
          type="time"
          name="time"
          style={inputStyle}
          value={formData.time}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Certified By / Doctor *
        </label>

        <input
          type="text"
          name="doctorName"
          style={inputStyle}
          value={formData.doctorName}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Doctor or certifying authority"
        />
      </div>

      <div>
        <label style={labelStyle}>
          Teeth Details *
        </label>

        <input
          type="text"
          name="teethDetails"
          style={inputStyle}
          value={formData.teethDetails}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Example: 8 permanent teeth"
        />
      </div>

      <div>
        <label style={labelStyle}>
          Age by Teeth *
        </label>

        <input
          type="text"
          name="teethAge"
          style={inputStyle}
          value={formData.teethAge}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Example: Approximately 8 years"
        />
      </div>

      {isFemale && (
        <div>
          <label style={labelStyle}>
            Pregnancy Status
          </label>

          <select
            name="pregnancyStatus"
            style={inputStyle}
            value={formData.pregnancyStatus}
            onChange={handleChange}
            disabled={disabled}
          >
            <option value="Not Pregnant">
              Not Pregnant
            </option>
            <option value="Pregnant">
              Pregnant
            </option>
            <option value="Unknown">
              Unknown
            </option>
          </select>
        </div>
      )}

      <div>
        <label style={labelStyle}>
          Market Value (₹) *
        </label>

        <input
          type="number"
          name="marketValue"
          min="0"
          style={inputStyle}
          value={formData.marketValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Estimated market value"
        />
      </div>
    </div>
  );
}

function SoldFields({
  formData,
  handleChange,
  disabled,
}) {
  return (
    <div style={salePanelStyle}>
      <div style={salePanelTitleStyle}>
        Sale Details
      </div>

      <div>
        <label style={labelStyle}>
          Buyer Name *
        </label>

        <input
          type="text"
          name="buyerName"
          style={inputStyle}
          value={formData.buyerName}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Sale Price (₹) *
        </label>

        <input
          type="number"
          name="salePrice"
          min="0"
          style={inputStyle}
          value={formData.salePrice}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Buyer Contact
        </label>

        <input
          type="text"
          name="buyerContact"
          style={inputStyle}
          value={formData.buyerContact}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Buyer Address
        </label>

        <input
          type="text"
          name="buyerAddress"
          style={inputStyle}
          value={formData.buyerAddress}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Gate Pass
        </label>

        <input
          type="text"
          name="gatePass"
          style={inputStyle}
          value={formData.gatePass}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Receipt No
        </label>

        <input
          type="text"
          name="receiptNo"
          style={inputStyle}
          value={formData.receiptNo}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Payment Reference
        </label>

        <input
          type="text"
          name="paymentRef"
          style={inputStyle}
          value={formData.paymentRef}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function ReceiverFields({
  title,
  formData,
  handleChange,
  disabled,
}) {
  return (
    <div style={receiverPanelStyle}>
      <div style={receiverPanelTitleStyle}>
        {title}
      </div>

      <div>
        <label style={labelStyle}>
          Receiver Name
        </label>

        <input
          type="text"
          name="receiverName"
          style={inputStyle}
          value={formData.receiverName}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Contact
        </label>

        <input
          type="text"
          name="receiverContact"
          style={inputStyle}
          value={formData.receiverContact}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>
          Address
        </label>

        <input
          type="text"
          name="receiverAddress"
          style={inputStyle}
          value={formData.receiverAddress}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}) {
  return (
    <div style={{ ...overlayStyle, zIndex: 1500 }}>
      <div style={confirmDialogStyle}>
        <div style={confirmDialogIconStyle}>!</div>

        <h3 style={confirmDialogTitleStyle}>
          {title}
        </h3>

        <p style={confirmDialogMessageStyle}>
          {message}
        </p>

        <div style={confirmDialogActionsStyle}>
          <button
            type="button"
            onClick={onCancel}
            style={secondaryButtonStyle}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={confirmExitButtonStyle}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ type, message, onClose }) {
  const typeStyles = {
    success: {
      background: "#ecfdf5",
      border: "#a7f3d0",
      color: "#065f46",
    },
    error: {
      background: "#fef2f2",
      border: "#fecaca",
      color: "#991b1b",
    },
    info: {
      background: "#eff6ff",
      border: "#bfdbfe",
      color: "#1e40af",
    },
  };

  const current = typeStyles[type] || typeStyles.info;

  return (
    <div
      style={{
        ...toastStyle,
        background: current.background,
        borderColor: current.border,
        color: current.color,
      }}
    >
      <span>{message}</span>

      <button
        type="button"
        onClick={onClose}
        style={toastCloseStyle}
      >
        ×
      </button>
    </div>
  );
}

function getTagNumber(row) {
  return (
    row?.tag ||
    row?.tagNumber ||
    row?.tag_number ||
    row?.tagNo ||
    row?.cattleId ||
    ""
  );
}

function getInternalId(row) {
  return (
    row?.internalId ||
    row?.internal_id ||
    row?.id ||
    ""
  );
}

function formatDisplayDate(value) {
  if (!value) return "Not recorded";

  const text = String(value).trim();
  const isoMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (isoMatch) {
    return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
}

/* =========================
   STYLES
========================= */

const pageStyle = {
  padding: "1.5rem",
  maxWidth: "1600px",
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "1rem",
  flexWrap: "wrap",
  marginBottom: "1.25rem",
};

const eyebrowStyle = {
  color: "#ea580c",
  fontSize: "0.75rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "5px",
};

const pageTitleStyle = {
  fontSize: "1.8rem",
  lineHeight: 1.2,
  fontWeight: 750,
  color: "#0f172a",
  margin: 0,
};

const pageSubtitleStyle = {
  color: "#64748b",
  fontSize: "0.9rem",
  margin: "6px 0 0",
};

const refreshButtonStyle = {
  padding: "0.65rem 1rem",
  borderRadius: "7px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  fontWeight: 700,
};

const disabledButtonStyle = {
  opacity: 0.55,
  cursor: "not-allowed",
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "1rem",
  marginBottom: "1rem",
};

const metricCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "1rem",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
};

const metricLabelStyle = {
  color: "#64748b",
  fontSize: "0.75rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const metricValueStyle = {
  color: "#0f172a",
  fontSize: "1.65rem",
  lineHeight: 1.2,
  fontWeight: 800,
  marginTop: "6px",
};

const metricHelperStyle = {
  color: "#94a3b8",
  fontSize: "0.75rem",
  marginTop: "4px",
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
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  alignItems: "end",
  gap: "0.8rem",
};

const filterLabelStyle = {
  display: "block",
  marginBottom: "5px",
  color: "#475569",
  fontSize: "0.75rem",
  fontWeight: 700,
};

const filterInputStyle = {
  width: "100%",
  height: "39px",
  padding: "0.55rem 0.7rem",
  borderRadius: "7px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: "0.85rem",
  boxSizing: "border-box",
};

const filterActionStyle = {
  display: "flex",
  alignItems: "end",
};

const clearButtonStyle = {
  width: "100%",
  height: "39px",
  padding: "0 0.8rem",
  borderRadius: "7px",
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#334155",
  cursor: "pointer",
  fontWeight: 700,
};

const resultCountStyle = {
  marginTop: "0.75rem",
  paddingTop: "0.75rem",
  borderTop: "1px solid #f1f5f9",
  color: "#64748b",
  fontSize: "0.8rem",
};

const tableCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  overflow: "hidden",
  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.05)",
};

const tableHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "1rem",
  borderBottom: "1px solid #e2e8f0",
};

const tableTitleStyle = {
  color: "#0f172a",
  fontSize: "1rem",
  fontWeight: 750,
};

const tableSubtitleStyle = {
  color: "#64748b",
  fontSize: "0.78rem",
  marginTop: "3px",
};

const paginationBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "0.75rem",
  padding: "0.75rem 1rem",
  borderBottom: "1px solid #e2e8f0",
  background: "#ffffff",
};

const paginationFooterStyle = {
  borderTop: "1px solid #e2e8f0",
  borderBottom: "none",
};

const paginationInfoStyle = {
  color: "#64748b",
  fontSize: "0.8rem",
};

const paginationActionsStyle = {
  display: "flex",
  gap: "0.5rem",
};

const paginationButtonStyle = {
  minWidth: "58px",
  padding: "0.5rem 0.7rem",
  borderRadius: "7px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 700,
};

const tableStyle = {
  width: "100%",
  minWidth: "950px",
  borderCollapse: "collapse",
  fontSize: "0.86rem",
};

const tableHeadStyle = {
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
};

const thStyle = {
  padding: "0.8rem 1rem",
  color: "#475569",
  fontSize: "0.72rem",
  fontWeight: 750,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "0.75rem 1rem",
  color: "#334155",
  borderBottom: "1px solid #f1f5f9",
  whiteSpace: "nowrap",
};

const tableRowStyle = {
  cursor: "pointer",
  transition: "background 0.15s ease",
};

const mobileListStyle = {
  display: "grid",
  gap: "0.75rem",
  padding: "0.75rem",
};

const mobileEmptyStyle = {
  padding: "2.5rem 1rem",
  textAlign: "center",
  color: "#64748b",
};

const mobileCardStyle = {
  display: "grid",
  gap: "0.85rem",
  padding: "0.9rem",
  minWidth: 0,
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
  gap: "0.75rem",
  paddingBottom: "0.75rem",
  borderBottom: "1px solid #f1f5f9",
};

const mobileCardEyebrowStyle = {
  color: "#64748b",
  fontSize: "0.68rem",
  fontWeight: 750,
  textTransform: "uppercase",
};

const mobileCardTitleStyle = {
  color: "#0f172a",
  fontSize: "1rem",
  fontWeight: 800,
  overflowWrap: "anywhere",
};

const mobileCardNameStyle = {
  color: "#475569",
  fontSize: "0.82rem",
  fontWeight: 600,
  marginTop: "2px",
};

const mobileCardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "0.75rem",
};

const mobileCardDetailLabelStyle = {
  color: "#64748b",
  fontSize: "0.68rem",
  fontWeight: 750,
  textTransform: "uppercase",
};

const mobileCardDetailValueStyle = {
  color: "#1e293b",
  fontSize: "0.84rem",
  fontWeight: 600,
  marginTop: "2px",
  overflowWrap: "anywhere",
};

const mobileCardActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.6rem",
};

const emptyCellStyle = {
  padding: "3rem 1rem",
  textAlign: "center",
  color: "#64748b",
};

const activeBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 8px",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  fontSize: "0.72rem",
  fontWeight: 750,
};

const dangerButtonStyle = {
  padding: "6px 11px",
  borderRadius: "6px",
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  cursor: "pointer",
  fontSize: "0.78rem",
  fontWeight: 700,
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  background: "rgba(15, 23, 42, 0.58)",
};

const previewModalStyle = {
  width: "720px",
  maxWidth: "100%",
  maxHeight: "90vh",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  background: "#ffffff",
  borderRadius: "12px",
  padding: "1.4rem",
  boxSizing: "border-box",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.3)",
};

const exitModalStyle = {
  width: "760px",
  maxWidth: "100%",
  maxHeight: "92vh",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  background: "#ffffff",
  borderRadius: "12px",
  padding: "1.4rem",
  boxSizing: "border-box",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.3)",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  paddingBottom: "1rem",
  marginBottom: "1rem",
  borderBottom: "1px solid #e2e8f0",
  flexShrink: 0,
};

const modalEyebrowStyle = {
  color: "#ea580c",
  fontSize: "0.72rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const modalTitleStyle = {
  color: "#0f172a",
  fontSize: "1.3rem",
  fontWeight: 750,
  margin: "4px 0 0",
};

const modalIdentityStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  alignItems: "center",
  marginTop: "8px",
};

const identityChipStyle = {
  padding: "3px 7px",
  borderRadius: "5px",
  background: "#f1f5f9",
  color: "#475569",
  fontSize: "0.75rem",
};

const closeButtonStyle = {
  alignSelf: "flex-start",
  background: "transparent",
  border: "none",
  color: "#94a3b8",
  cursor: "pointer",
  fontSize: "1.6rem",
  lineHeight: 1,
};

const previewGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "0.8rem",
};

const previewItemStyle = {
  padding: "0.75rem",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
};

const previewLabelStyle = {
  color: "#64748b",
  fontSize: "0.7rem",
  fontWeight: 750,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const previewValueStyle = {
  color: "#0f172a",
  fontSize: "0.86rem",
  fontWeight: 600,
  marginTop: "4px",
  wordBreak: "break-word",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};

const labelStyle = {
  display: "block",
  marginBottom: "5px",
  color: "#475569",
  fontSize: "0.72rem",
  fontWeight: 750,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

const inputStyle = {
  width: "100%",
  padding: "0.62rem",
  borderRadius: "7px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: "0.86rem",
  boxSizing: "border-box",
};

const deathPanelStyle = {
  gridColumn: "1 / -1",
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "1rem",
  padding: "1rem",
  borderRadius: "9px",
  border: "1px solid #fecaca",
  background: "#fff7f7",
};

const deathPanelTitleStyle = {
  gridColumn: "1 / -1",
  color: "#991b1b",
  fontSize: "0.75rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const salePanelStyle = {
  gridColumn: "1 / -1",
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "1rem",
  padding: "1rem",
  borderRadius: "9px",
  border: "1px solid #bbf7d0",
  background: "#f0fdf4",
};

const salePanelTitleStyle = {
  gridColumn: "1 / -1",
  color: "#166534",
  fontSize: "0.75rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const receiverPanelStyle = {
  gridColumn: "1 / -1",
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "1rem",
  padding: "1rem",
  borderRadius: "9px",
  border: "1px solid #bfdbfe",
  background: "#eff6ff",
};

const receiverPanelTitleStyle = {
  gridColumn: "1 / -1",
  color: "#1e40af",
  fontSize: "0.75rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const warningPanelStyle = {
  gridColumn: "1 / -1",
  padding: "1rem",
  borderRadius: "9px",
  border: "1px solid #fde68a",
  background: "#fffbeb",
};

const warningPanelTitleStyle = {
  color: "#92400e",
  fontSize: "0.78rem",
  fontWeight: 800,
  textTransform: "uppercase",
};

const warningPanelTextStyle = {
  color: "#78350f",
  fontSize: "0.82rem",
  marginTop: "5px",
  lineHeight: 1.5,
};

const modalFooterStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.7rem",
  marginTop: "1.3rem",
  paddingTop: "1rem",
  borderTop: "1px solid #e2e8f0",
  flexShrink: 0,
};

const secondaryButtonStyle = {
  padding: "0.6rem 1rem",
  borderRadius: "7px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  fontWeight: 700,
};

const confirmExitButtonStyle = {
  padding: "0.6rem 1rem",
  borderRadius: "7px",
  border: "1px solid #dc2626",
  background: "#dc2626",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 750,
};

const confirmDialogStyle = {
  width: "420px",
  maxWidth: "100%",
  padding: "1.4rem",
  borderRadius: "12px",
  background: "#ffffff",
  textAlign: "center",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.35)",
};

const confirmDialogIconStyle = {
  width: "42px",
  height: "42px",
  margin: "0 auto 0.8rem",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fef2f2",
  color: "#dc2626",
  fontSize: "1.2rem",
  fontWeight: 800,
};

const confirmDialogTitleStyle = {
  color: "#0f172a",
  fontSize: "1.1rem",
  margin: 0,
};

const confirmDialogMessageStyle = {
  color: "#64748b",
  fontSize: "0.86rem",
  lineHeight: 1.5,
  margin: "0.7rem 0 1.2rem",
};

const confirmDialogActionsStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "0.7rem",
};

const toastStyle = {
  position: "fixed",
  top: "1rem",
  right: "1rem",
  zIndex: 2000,
  maxWidth: "430px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem",
  padding: "0.8rem 1rem",
  border: "1px solid",
  borderRadius: "9px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.16)",
  fontSize: "0.84rem",
  fontWeight: 650,
};

const toastCloseStyle = {
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  fontSize: "1.15rem",
  lineHeight: 1,
};
