import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import PageHeader from "../../components/common/PageHeader";
import MetricCard from "../../components/common/MetricCard";
import SectionCard from "../../components/common/SectionCard";
import {
  fetchMaster,
  addMaster,
  updateMaster,
  deleteMaster,
} from "../../api/masterApi";

const EMPTY_FORM = {
  id: "",
  medicine_id: "",
  medicine_name: "",
  generic_name: "",
  type: "",
  usage_type: "",
  unit: "",
  manufacturer: "",
  is_active: "Yes",
  remarks: "",
};

const COMMON_TYPES = [
  "Medicine",
  "Injectable",
  "Bolus",
  "Tablet",
  "Capsule",
  "Liquid",
  "Powder",
  "Cream",
  "Ointment",
  "Spray",
];

const COMMON_USAGE_TYPES = [
  "Antibiotic / Anti-infective",
  "Anti-inflammatory / Analgesic",
  "Antiparasitic / Dewormer",
  "Haemoprotozoal",
  "Mastitis Treatment",
  "Reproductive / Hormonal",
  "Nutritional / Mineral Supplement",
  "Digestive / Rumen Support",
  "Antidiarrhoeal",
  "Fluid / Electrolyte Therapy",
  "Antiseptic / Skin & Wound Care",
  "Respiratory Support",
  "Liver / Metabolic Support",
  "Haemostatic",
  "Laxative",
  "Homeopathic",
  "General / Supportive Care",
];

const COMMON_UNITS = [
  "Piece",
  "Strip",
  "Bolus",
  "Tablet",
  "Capsule",
  "Vial",
  "Bottle",
  "Vial/Bottle",
  "Tube",
  "Jar",
  "Pack",
  "Sachet",
  "Kg",
  "Gram",
  "Litre",
  "ml",
  "Spray Bottle",
];

export default function Medicines() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] =
    useState("");
  const [typeFilter, setTypeFilter] =
    useState("All");
  const [
    usageTypeFilter,
    setUsageTypeFilter,
  ] = useState("All");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [showModal, setShowModal] =
    useState(false);
  const [mode, setMode] = useState("add");
  const [form, setForm] =
    useState(EMPTY_FORM);

  const [saving, setSaving] =
    useState(false);

  const [
    statusUpdatingId,
    setStatusUpdatingId,
  ] = useState("");

  const [
    pendingStatusChange,
    setPendingStatusChange,
  ] = useState(null);

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  function showToast(type, message) {
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

  async function loadData() {
    try {
      setLoading(true);

      const response =
        await fetchMaster("medicines");

      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const normalizedRows = data
        .map((row) => {
          const medicineId = String(
            row.medicine_id ||
              row.id ||
              ""
          )
            .trim()
            .toUpperCase();

          return {
            id: medicineId,
            medicine_id: medicineId,

            medicine_name: normalizeText(
              row.medicine_name
            ),

            generic_name: normalizeText(
              row.generic_name
            ),

            type:
              normalizeText(row.type) ||
              "Medicine",

            usage_type: normalizeText(
              row.usage_type
            ),

            unit:
              normalizeText(row.unit) ||
              "Piece",

            manufacturer: normalizeText(
              row.manufacturer ||
                row.manufacture
            ),

            is_active:
              String(
                row.is_active || "Yes"
              )
                .trim()
                .toLowerCase() === "no"
                ? "No"
                : "Yes",

            remarks: normalizeText(
              row.remarks
            ),
          };
        })
        .filter(
          (row) =>
            row.medicine_id ||
            row.medicine_name
        )
        .sort((a, b) =>
          a.medicine_name.localeCompare(
            b.medicine_name
          )
        );

      setRows(normalizedRows);
    } catch (error) {
      console.error(
        "Failed to load Medicines:",
        error
      );

      setRows([]);

      showToast(
        "error",
        error?.message ||
          "Unable to load Medicines."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const metrics = useMemo(() => {
    const active = rows.filter(
      (row) =>
        row.is_active === "Yes"
    ).length;

    return {
      total: rows.length,
      active,
      inactive: rows.length - active,
    };
  }, [rows]);

  const typeOptions = useMemo(() => {
    const values = new Set(
      COMMON_TYPES
    );

    rows.forEach((row) => {
      if (row.type) {
        values.add(row.type);
      }
    });

    if (form.type) {
      values.add(form.type);
    }

    return Array.from(values).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [rows, form.type]);

  const usageTypeOptions = useMemo(() => {
    const values = new Set(
      COMMON_USAGE_TYPES
    );

    rows.forEach((row) => {
      if (row.usage_type) {
        values.add(row.usage_type);
      }
    });

    if (form.usage_type) {
      values.add(form.usage_type);
    }

    return Array.from(values).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [rows, form.usage_type]);

  const unitOptions = useMemo(() => {
    const values = new Set(
      COMMON_UNITS
    );

    rows.forEach((row) => {
      if (row.unit) {
        values.add(row.unit);
      }
    });

    if (form.unit) {
      values.add(form.unit);
    }

    return Array.from(values).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [rows, form.unit]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = String(
      searchText || ""
    )
      .trim()
      .toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          row.medicine_id,
          row.medicine_name,
          row.generic_name,
          row.type,
          row.usage_type,
          row.unit,
          row.manufacturer,
          row.remarks,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesType =
        typeFilter === "All" ||
        row.type === typeFilter;

      const matchesUsageType =
        usageTypeFilter === "All" ||
        row.usage_type ===
          usageTypeFilter;

      const rowStatus =
        row.is_active === "No"
          ? "Inactive"
          : "Active";

      const matchesStatus =
        statusFilter === "All" ||
        rowStatus === statusFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesUsageType &&
        matchesStatus
      );
    });
  }, [
    rows,
    searchText,
    typeFilter,
    usageTypeFilter,
    statusFilter,
  ]);

  function openAddModal() {
    setMode("add");

    setForm({
  ...EMPTY_FORM,
  type: "",
  usage_type: "",
  unit: "",
  is_active: "Yes",
});

    setShowModal(true);
  }

  function openEditModal(row) {
    setMode("edit");

    setForm({
      id:
        row.medicine_id ||
        row.id ||
        "",

      medicine_id:
        row.medicine_id ||
        row.id ||
        "",

      medicine_name:
        row.medicine_name || "",

      generic_name:
        row.generic_name || "",

      type:
        row.type || "Medicine",

      usage_type:
        row.usage_type || "",

      unit:
        row.unit || "Piece",

      manufacturer:
        row.manufacturer || "",

      is_active:
        row.is_active === "No"
          ? "No"
          : "Yes",

      remarks:
        row.remarks || "",
    });

    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setForm(EMPTY_FORM);
  }

  function handleChange(event) {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function clearFilters() {
    setSearchText("");
    setTypeFilter("All");
    setUsageTypeFilter("All");
    setStatusFilter("All");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const medicineName = normalizeText(
      form.medicine_name
    );

    const genericName = normalizeText(
      form.generic_name
    );

    const medicineType = normalizeText(
      form.type
    );

    const usageType = normalizeText(
      form.usage_type
    );

    const unit = normalizeText(
      form.unit
    );

    const manufacturer = normalizeText(
      form.manufacturer
    );

    const remarks = normalizeText(
      form.remarks
    );

    if (!medicineName) {
      showToast(
        "error",
        "Medicine Name is required."
      );
      return;
    }

    if (medicineName.length > 150) {
      showToast(
        "error",
        "Medicine Name cannot exceed 150 characters."
      );
      return;
    }

    if (genericName.length > 150) {
      showToast(
        "error",
        "Generic Name cannot exceed 150 characters."
      );
      return;
    }

    if (!medicineType) {
      showToast(
        "error",
        "Type is required."
      );
      return;
    }

    if (medicineType.length > 100) {
      showToast(
        "error",
        "Type cannot exceed 100 characters."
      );
      return;
    }

    if (usageType.length > 100) {
      showToast(
        "error",
        "Usage Type cannot exceed 100 characters."
      );
      return;
    }

    if (!unit) {
      showToast(
        "error",
        "Unit is required."
      );
      return;
    }

    if (unit.length > 50) {
      showToast(
        "error",
        "Unit cannot exceed 50 characters."
      );
      return;
    }

    if (manufacturer.length > 150) {
      showToast(
        "error",
        "Manufacturer cannot exceed 150 characters."
      );
      return;
    }

    if (remarks.length > 500) {
      showToast(
        "error",
        "Remarks cannot exceed 500 characters."
      );
      return;
    }

    const medicineId = String(
      form.medicine_id ||
        form.id ||
        ""
    )
      .trim()
      .toUpperCase();

    const payload = {
      id: medicineId,
      medicine_id: medicineId,
      medicine_name: medicineName,
      generic_name: genericName,
      type: medicineType,
      usage_type: usageType,
      unit,
      manufacturer,

      is_active:
        form.is_active === "No"
          ? "No"
          : "Yes",

      remarks,
    };

    try {
      setSaving(true);

      showToast(
        "info",
        mode === "add"
          ? "Please wait while the Medicine is saved..."
          : "Please wait while the Medicine is updated..."
      );

      const response =
        mode === "add"
          ? await addMaster(
              "medicines",
              payload
            )
          : await updateMaster(
              "medicines",
              medicineId,
              payload
            );

      if (response?.success === false) {
        throw new Error(
          response.error ||
            response.message ||
            "Unable to save Medicine."
        );
      }

      await loadData();

      setShowModal(false);
      setForm(EMPTY_FORM);

      showToast(
        "success",
        response?.message ||
          (mode === "add"
            ? "Medicine added successfully."
            : "Medicine updated successfully.")
      );
    } catch (error) {
      console.error(
        "Medicine save failed:",
        error
      );

      showToast(
        "error",
        error?.message ||
          "Unable to save Medicine."
      );
    } finally {
      setSaving(false);
    }
  }

  function requestStatusChange(row) {
    const isActive =
      row.is_active !== "No";

    setPendingStatusChange({
      row,
      newStatus: isActive
        ? "No"
        : "Yes",
    });
  }

  function closeStatusConfirmation() {
    if (statusUpdatingId) return;

    setPendingStatusChange(null);
  }

  async function confirmStatusChange() {
    if (!pendingStatusChange) {
      return;
    }

    const {
      row,
      newStatus,
    } = pendingStatusChange;

    const medicineId = String(
      row.medicine_id ||
        row.id ||
        ""
    )
      .trim()
      .toUpperCase();

    try {
      setStatusUpdatingId(
        medicineId
      );

      showToast(
        "info",
        newStatus === "No"
          ? "Please wait while the Medicine is deactivated..."
          : "Please wait while the Medicine is activated..."
      );

      let response;

      if (newStatus === "No") {
        response = await deleteMaster(
          "medicines",
          medicineId
        );
      } else {
        response = await updateMaster(
          "medicines",
          medicineId,
          {
            id: medicineId,
            medicine_id: medicineId,
            medicine_name:
              row.medicine_name,
            generic_name:
              row.generic_name,
            type: row.type,
            usage_type:
              row.usage_type,
            unit: row.unit,
            manufacturer:
              row.manufacturer,
            is_active: "Yes",
            remarks: row.remarks,
          }
        );
      }

      if (response?.success === false) {
        throw new Error(
          response.error ||
            response.message ||
            "Unable to change Medicine status."
        );
      }

      await loadData();

      setPendingStatusChange(null);

      showToast(
        "success",
        newStatus === "Yes"
          ? "Medicine activated successfully."
          : "Medicine deactivated successfully."
      );
    } catch (error) {
      console.error(
        "Medicine status update failed:",
        error
      );

      showToast(
        "error",
        error?.message ||
          "Unable to change Medicine status."
      );
    } finally {
      setStatusUpdatingId("");
    }
  }

  const hasActiveFilters =
    Boolean(searchText.trim()) ||
    typeFilter !== "All" ||
    usageTypeFilter !== "All" ||
    statusFilter !== "All";

  return (
    <div style={pageStyle}>
      <PageHeader
        title="Medicines Master"
        description="Manage approved medicines and veterinary products used in clinical and preventive-care records."
        countText={`${filteredRows.length} of ${rows.length} medicine${
          rows.length === 1 ? "" : "s"
        }`}
        action={
          <button
            type="button"
            onClick={openAddModal}
            className="btn btn-primary"
            style={{
              whiteSpace: "nowrap",
            }}
          >
            + Add Medicine
          </button>
        }
      />

      <div style={metricsWrapperStyle}>
        <MetricCard
          label="Total Medicines"
          value={metrics.total}
          color="#2563eb"
        />

        <MetricCard
          label="Active"
          value={metrics.active}
          color="#16a34a"
        />

        <MetricCard
          label="Inactive"
          value={metrics.inactive}
          color="#dc2626"
        />
      </div>

      <SectionCard title="Search & Filters">
        <div style={filtersGridStyle}>
          <div>
            <label style={fieldLabelStyle}>
              Search
            </label>

            <input
              type="text"
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
              className="form-input"
              placeholder="Search ID, medicine, generic name, type or manufacturer"
            />
          </div>

          <div>
            <label style={fieldLabelStyle}>
              Type
            </label>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value
                )
              }
              className="form-select"
            >
              <option value="All">
                All Types
              </option>

              {typeOptions.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={fieldLabelStyle}>
              Usage Type
            </label>

            <select
              value={usageTypeFilter}
              onChange={(event) =>
                setUsageTypeFilter(
                  event.target.value
                )
              }
              className="form-select"
            >
              <option value="All">
                All Usage Types
              </option>

              {usageTypeOptions.map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {value}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label style={fieldLabelStyle}>
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="form-select"
            >
              <option value="All">
                All Statuses
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>

          <div style={clearButtonWrapperStyle}>
            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-secondary"
              disabled={!hasActiveFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Configuration Rules">
        <div style={informationGridStyle}>
          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Purpose
            </div>

            <div style={informationValueStyle}>
              Active medicines are available in
              Clinical Records and Preventive Care.
            </div>
          </div>

          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Medicine Name
            </div>

            <div style={informationValueStyle}>
              Medicine names must be unique. Different
              brands may share the same generic name.
            </div>
          </div>

          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Classification
            </div>

            <div style={informationValueStyle}>
              Type identifies the veterinary product,
              while Usage Type describes its broad purpose.
            </div>
          </div>

          <div style={informationItemStyle}>
            <div style={informationLabelStyle}>
              Deactivation Rule
            </div>

            <div style={informationValueStyle}>
              Medicines should be deactivated instead of
              permanently deleted.
            </div>
          </div>
        </div>
      </SectionCard>

      <div
        className="card"
        style={tableCardStyle}
      >
        <div style={tableScrollStyle}>
          <table style={tableStyle}>
            <thead style={tableHeadStyle}>
              <tr>
                <th style={thStyle}>
                  Medicine ID
                </th>

                <th style={thStyle}>
                  Medicine Name
                </th>

                <th style={thStyle}>
                  Generic Name
                </th>

                <th style={thStyle}>
                  Type
                </th>

                <th style={thStyle}>
                  Usage Type
                </th>

                <th style={thStyle}>
                  Unit
                </th>

                <th style={thStyle}>
                  Manufacturer
                </th>

                <th style={thStyle}>
                  Status
                </th>

                <th
                  style={{
                    ...thStyle,
                    textAlign: "center",
                  }}
                >
                  Actions / Status
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    style={emptyStateStyle}
                  >
                    Loading Medicines...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={emptyStateStyle}
                  >
                    No Medicines found.
                  </td>
                </tr>
              ) : (
                filteredRows.map(
                  (row, index) => {
                    const isActive =
                      row.is_active !== "No";

                    const isStatusUpdating =
                      statusUpdatingId ===
                      row.medicine_id;

                    return (
                      <tr
                        key={row.medicine_id}
                        style={{
                          borderBottom:
                            "1px solid #f1f5f9",

                          background:
                            index % 2 === 0
                              ? "#ffffff"
                              : "#f8fafc",

                          opacity: isActive
                            ? 1
                            : 0.72,
                        }}
                      >
                        <td style={tdStyle}>
                          <strong>
                            {row.medicine_id ||
                              "-"}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          <strong>
                            {row.medicine_name ||
                              "-"}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          {row.generic_name ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          <TypeBadge
                            value={row.type}
                          />
                        </td>

                        <td style={tdStyle}>
                          {row.usage_type ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          <UnitBadge
                            value={row.unit}
                          />
                        </td>

                        <td style={tdStyle}>
                          {row.manufacturer ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          <StatusBadge
                            value={
                              row.is_active
                            }
                          />
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            textAlign:
                              "center",
                          }}
                        >
                          <div
                            style={
                              actionButtonsStyle
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  row
                                )
                              }
                              style={
                                editButtonStyle
                              }
                              disabled={
                                saving ||
                                Boolean(
                                  statusUpdatingId
                                )
                              }
                            >
                              Edit
                            </button>

                            <label
                              style={{
                                ...switchStyle,

                                cursor:
                                  isStatusUpdating
                                    ? "not-allowed"
                                    : "pointer",
                              }}
                              title={
                                isActive
                                  ? "Deactivate medicine"
                                  : "Activate medicine"
                              }
                            >
                              <input
                                type="checkbox"
                                checked={
                                  isActive
                                }
                                disabled={
                                  saving ||
                                  Boolean(
                                    statusUpdatingId
                                  )
                                }
                                onChange={() =>
                                  requestStatusChange(
                                    row
                                  )
                                }
                                style={{
                                  display:
                                    "none",
                                }}
                              />

                              <span
                                style={{
                                  ...switchSliderStyle,

                                  ...(isActive
                                    ? switchOnStyle
                                    : switchOffStyle),
                                }}
                              >
                                <span
                                  style={{
                                    ...switchKnobStyle,

                                    transform:
                                      isActive
                                        ? "translateX(18px)"
                                        : "translateX(0px)",
                                  }}
                                />
                              </span>
                            </label>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div
          style={overlayStyle}
          onClick={closeModal}
        >
          <div
            style={modalStyle}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>
                  {mode === "add"
                    ? "Add Medicine"
                    : "Edit Medicine"}
                </h2>

                <p
                  style={
                    modalDescriptionStyle
                  }
                >
                  Create or update an approved
                  veterinary medicine reference.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={closeButtonStyle}
                disabled={saving}
                aria-label="Close medicine form"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gap: "1rem",
              }}
            >
              <SectionCard title="Medicine Details">
                {mode === "edit" && (
                  <Field label="Medicine ID">
                    <input
                      type="text"
                      value={
                        form.medicine_id
                      }
                      className="form-input"
                      disabled
                    />
                  </Field>
                )}

                <div style={formGridStyle}>
                  <Field label="Medicine Name *">
                    <input
                      type="text"
                      name="medicine_name"
                      value={
                        form.medicine_name
                      }
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Example: Ivermectin"
                      maxLength={150}
                      required
                      disabled={saving}
                      autoComplete="off"
                    />
                  </Field>

                  <Field label="Generic Name">
                    <input
                      type="text"
                      name="generic_name"
                      value={
                        form.generic_name
                      }
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Example: Ivermectin"
                      maxLength={150}
                      disabled={saving}
                      autoComplete="off"
                    />
                  </Field>
                </div>

                <div style={formGridStyle}>
                  <Field label="Type *">
  <select
    name="type"
    value={form.type}
    onChange={handleChange}
    className="form-select"
    required
    disabled={saving}
  >
    <option value="">
      Select Type
    </option>

    {typeOptions.map((value) => (
      <option
        key={value}
        value={value}
      >
        {value}
      </option>
    ))}
  </select>
</Field>

                 <Field label="Usage Type">
  <select
    name="usage_type"
    value={form.usage_type}
    onChange={handleChange}
    className="form-select"
    disabled={saving}
  >
    <option value="">
      Select Usage Type
    </option>

    {usageTypeOptions.map((value) => (
      <option
        key={value}
        value={value}
      >
        {value}
      </option>
    ))}
  </select>
</Field>
                </div>

                <div style={formGridStyle}>
                  <Field label="Unit *">
  <select
    name="unit"
    value={form.unit}
    onChange={handleChange}
    className="form-select"
    required
    disabled={saving}
  >
    <option value="">
      Select Unit
    </option>

    {unitOptions.map((value) => (
      <option
        key={value}
        value={value}
      >
        {value}
      </option>
    ))}
  </select>
</Field>

                  <Field label="Manufacturer">
                    <input
                      type="text"
                      name="manufacturer"
                      value={
                        form.manufacturer
                      }
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Manufacturer name"
                      maxLength={150}
                      disabled={saving}
                      autoComplete="off"
                    />
                  </Field>
                </div>

                <Field label="Status *">
                  <select
                    name="is_active"
                    value={
                      form.is_active
                    }
                    onChange={handleChange}
                    className="form-select"
                    required
                    disabled={saving}
                  >
                    <option value="Yes">
                      Active
                    </option>

                    <option value="No">
                      Inactive
                    </option>
                  </select>
                </Field>

                <Field label="Remarks">
                  <textarea
                    name="remarks"
                    value={form.remarks}
                    onChange={handleChange}
                    className="form-input"
                    rows={3}
                    maxLength={500}
                    placeholder="Optional remarks"
                    disabled={saving}
                  />
                </Field>
              </SectionCard>

              <div style={modalActionsStyle}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary btn-full-mobile"
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary btn-full-mobile"
                  disabled={
                    saving ||
                    !String(
                      form.medicine_name || ""
                    ).trim() ||
                    !String(
                      form.type || ""
                    ).trim() ||
                    !String(
                      form.unit || ""
                    ).trim()
                  }
                >
                  {saving
                    ? mode === "add"
                      ? "Saving..."
                      : "Updating..."
                    : mode === "add"
                      ? "Save Medicine"
                      : "Update Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingStatusChange && (
        <div
          style={overlayStyle}
          onClick={
            closeStatusConfirmation
          }
        >
          <div
            style={confirmDialogStyle}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2 style={confirmTitleStyle}>
              {pendingStatusChange
                .newStatus === "No"
                ? "Deactivate Medicine?"
                : "Activate Medicine?"}
            </h2>

            <p style={confirmMessageStyle}>
              {pendingStatusChange
                .newStatus === "No"
                ? `This will prevent "${pendingStatusChange.row.medicine_name}" from being selected in new Clinical Records and Preventive Care entries. Historical records will remain unchanged.`
                : `This will make "${pendingStatusChange.row.medicine_name}" available for new Clinical Records and Preventive Care entries.`}
            </p>

            <div style={confirmActionsStyle}>
              <button
                type="button"
                onClick={
                  closeStatusConfirmation
                }
                className="btn btn-secondary"
                disabled={Boolean(
                  statusUpdatingId
                )}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  confirmStatusChange
                }
                className="btn btn-primary"
                disabled={Boolean(
                  statusUpdatingId
                )}
              >
                {statusUpdatingId
                  ? "Updating..."
                  : pendingStatusChange
                        .newStatus === "No"
                    ? "Deactivate"
                    : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div
          style={{
            ...toastStyle,

            ...(toast.type === "success"
              ? successToastStyle
              : toast.type === "error"
                ? errorToastStyle
                : infoToastStyle),
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <label style={fieldLabelStyle}>
        {label}
      </label>

      {children}
    </div>
  );
}

function StatusBadge({ value }) {
  const isActive =
    String(value || "")
      .trim()
      .toLowerCase() !== "no";

  return (
    <span
      style={{
        ...statusBadgeStyle,
        ...(isActive
          ? activeStatusStyle
          : inactiveStatusStyle),
      }}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function TypeBadge({ value }) {
  return (
    <span style={typeBadgeStyle}>
      {value || "-"}
    </span>
  );
}

function UnitBadge({ value }) {
  return (
    <span style={unitBadgeStyle}>
      {value || "-"}
    </span>
  );
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

const pageStyle = {
  padding: "2.25rem 1.5rem 1.5rem",
  maxWidth: "1450px",
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box",
};

const metricsWrapperStyle = {
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap",
  marginBottom: "1rem",
};

const filtersGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(280px, 2fr) minmax(170px, 1fr) minmax(190px, 1fr) minmax(160px, 1fr) auto",
  gap: "1rem",
  alignItems: "end",
};

const clearButtonWrapperStyle = {
  display: "flex",
  alignItems: "flex-end",
};

const informationGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};

const informationItemStyle = {
  padding: "0.75rem",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  background: "#f8fafc",
};

const informationLabelStyle = {
  marginBottom: "0.3rem",
  fontSize: "0.72rem",
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
};

const informationValueStyle = {
  fontSize: "0.85rem",
  lineHeight: 1.45,
  color: "#334155",
  fontWeight: 600,
};

const tableCardStyle = {
  padding: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  minHeight: "420px",
  maxHeight: "calc(100vh - 520px)",
};

const tableScrollStyle = {
  flex: 1,
  overflowY: "auto",
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.88rem",
  minWidth: "1450px",
};

const tableHeadStyle = {
  background: "#f8fafc",
  borderBottom: "2px solid #e2e8f0",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const thStyle = {
  padding: "0.8rem 0.9rem",
  textAlign: "left",
  fontWeight: 700,
  fontSize: "0.7rem",
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "0.72rem 0.9rem",
  color: "#1f2937",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "middle",
};

const emptyStateStyle = {
  padding: "3rem",
  textAlign: "center",
  color: "#64748b",
};

const typeBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.22rem 0.55rem",
  borderRadius: "999px",
  fontSize: "0.74rem",
  fontWeight: 700,
  color: "#0369a1",
  background: "#e0f2fe",
  border: "1px solid #bae6fd",
  whiteSpace: "nowrap",
};

const unitBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.2rem 0.55rem",
  borderRadius: "999px",
  fontSize: "0.74rem",
  fontWeight: 700,
  color: "#334155",
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  whiteSpace: "nowrap",
};

const statusBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.22rem 0.55rem",
  borderRadius: "999px",
  fontSize: "0.72rem",
  fontWeight: 800,
};

const activeStatusStyle = {
  background: "#f0fdf4",
  border: "1px solid #86efac",
  color: "#15803d",
};

const inactiveStatusStyle = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#b91c1c",
};

const editButtonStyle = {
  padding: "0.35rem 0.75rem",
  borderRadius: "6px",
  border: "1px solid #bfdbfe",
  background: "#eff6ff",
  color: "#1d4ed8",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 700,
};

const actionButtonsStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "0.5rem",
  flexWrap: "wrap",
};

const switchStyle = {
  display: "inline-flex",
  alignItems: "center",
};

const switchSliderStyle = {
  position: "relative",
  width: "42px",
  height: "24px",
  borderRadius: "999px",
  transition: "0.25s",
};

const switchOnStyle = {
  background: "#16a34a",
};

const switchOffStyle = {
  background: "#cbd5e1",
};

const switchKnobStyle = {
  position: "absolute",
  top: "3px",
  left: "3px",
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  background: "#ffffff",
  transition: "0.25s",
  boxShadow:
    "0 2px 5px rgba(0,0,0,0.25)",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 100,
  padding: "1rem",
};

const modalStyle = {
  background: "#ffffff",
  borderRadius: "12px",
  width: "100%",
  maxWidth: "900px",
  maxHeight: "90vh",
  overflowY: "auto",
  padding: "1.25rem",
  boxShadow:
    "0 20px 40px rgba(15,23,42,0.2)",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "1rem",
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: "0.85rem",
  marginBottom: "1rem",
};

const modalTitleStyle = {
  margin: 0,
  fontSize: "1.3rem",
  color: "#0f172a",
};

const modalDescriptionStyle = {
  margin: "4px 0 0",
  fontSize: "0.85rem",
  color: "#64748b",
};

const closeButtonStyle = {
  border: "none",
  background: "transparent",
  fontSize: "1.5rem",
  color: "#64748b",
  cursor: "pointer",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "0 1rem",
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
};

const fieldLabelStyle = {
  display: "block",
  fontSize: "0.8rem",
  color: "#374151",
  marginBottom: "0.3rem",
  fontWeight: 600,
};

const confirmDialogStyle = {
  width: "100%",
  maxWidth: "520px",
  background: "#ffffff",
  borderRadius: "12px",
  padding: "1.5rem",
  boxShadow:
    "0 20px 40px rgba(15,23,42,0.25)",
};

const confirmTitleStyle = {
  margin: "0 0 0.75rem",
  fontSize: "1.2rem",
  color: "#0f172a",
};

const confirmMessageStyle = {
  margin: 0,
  color: "#475569",
  fontSize: "0.9rem",
  lineHeight: 1.55,
};

const confirmActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.75rem",
  marginTop: "1.5rem",
  flexWrap: "wrap",
};

const toastStyle = {
  position: "fixed",
  top: "1.25rem",
  right: "1.25rem",
  zIndex: 9999,
  maxWidth: "460px",
  padding: "0.85rem 1rem",
  borderRadius: "8px",
  boxShadow:
    "0 10px 30px rgba(15,23,42,0.18)",
  fontSize: "0.88rem",
  fontWeight: 700,
};

const successToastStyle = {
  background: "#f0fdf4",
  border: "1px solid #86efac",
  color: "#166534",
};

const errorToastStyle = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#b91c1c",
};

const infoToastStyle = {
  background: "#eff6ff",
  border: "1px solid #93c5fd",
  color: "#1d4ed8",
};