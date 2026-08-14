import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getSamvardhanaOutgoing,
  addSamvardhanaOutgoing,
  updateSamvardhanaOutgoing,
  cancelSamvardhanaOutgoing,
  fetchMaster,
} from "../api/masterApi";

import { useAuth } from "../context/AuthContext";

import ConfirmDialog from
  "../components/common/ConfirmDialog";


const MATERIALS = [
  "Milk",
  "Gaumaya",
  "Gaumutra",
  "Compost",
  "Slurry",
  "Other",
];

const MILK_USAGE_TYPES = [
  "Sale",
  "Canteen",
  "Ginnu",
];

const UNIT_OPTIONS = {
  Milk: ["Ltr", "Kg"],
  Gaumaya: [
    "Kg",
    "Wheelbarrow",
    "Tractor Load",
  ],
  Gaumutra: ["Kg", "Liters"],
  Compost: [
    "Kg",
    "Load",
    "Tractor Load",
  ],
  Slurry: ["Tank", "Liters"],
  Other: [
    "Kg",
    "Ltr",
    "Liters",
    "Tank",
    "Load",
  ],
};


function todayIso() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-");
}


function monthStartIso() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    "01",
  ].join("-");
}


function numberValue(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

/*
 * Internal Transfer value = material subtotal.
 * External Sale value = final billed amount.
 *
 * Historical rows without the new billing snapshot
 * continue to fall back to totalAmount.
 */
function transactionDisplayValue(
  row
) {
  const movementType =
    row?.movementType ||
    row?.movement_type ||
    "";

  const subtotalSnapshot =
    numberValue(
      row?.subtotalAmount ??
      row?.subtotal_amount
    );

  if (
    movementType ===
      "External Sale" &&
    subtotalSnapshot > 0
  ) {
    return numberValue(
      row?.billedAmount ??
      row?.billed_amount
    );
  }

  return numberValue(
    row?.totalAmount
  );
}


function round2(value) {
  return (
    Math.round(
      numberValue(value) * 100
    ) / 100
  );
}


function formatAmount(value) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(numberValue(value));
}


function formatDate(value) {
  if (!value) {
    return "-";
  }

  const text = String(value).trim();

  const isoMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (isoMatch) {
    return (
      isoMatch[3] +
      "-" +
      isoMatch[2] +
      "-" +
      isoMatch[1]
    );
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return text;
  }

  return [
    String(
      date.getDate()
    ).padStart(2, "0"),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    date.getFullYear(),
  ].join("-");
}


function normalise(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}


function createEmptyItem() {
  return {
    lineId: "",
    material: "Milk",
    usageType: "Sale",
    quantity: "",
    unit: "Ltr",
    rate: "",
    amount: 0,
    sourceType: "",
    sourceTransactionId: "",
    remarks: "",
  };
}


function createEmptyForm() {
  return {
    outgoingId: "",
    date: todayIso(),
    movementType:
      "Internal Transfer",
    destinationType: "MSGP",
    destinationName: "MSGP",
    partyName: "",
    receiptNo: "",
        billNo: "",
    billDate: "",
    taxAmount: "",
    transportCharges: "",
    otherCharges: "",
    otherChargesRemarks: "",
    discountAmount: "",
    senderName: "",
    receiverName: "",
    remarks: "",
    items: [
      createEmptyItem(),
    ],
  };
}


function getRateMap(rows) {
  const result = {};

  (rows || []).forEach(
    (row) => {
      const key = normalise(
        row.item_name ||
        row.itemName
      );

      if (!key) {
        return;
      }

      result[key] = {
        rate:
          numberValue(row.rate),
        unit:
          String(
            row.unit || ""
          ).trim(),
      };
    }
  );

  return result;
}


function materialRate(
  rateMap,
  material
) {
  const aliases = {
    Milk: ["milk"],

    Gaumaya: [
      "gaumaya",
      "gomaya",
      "dung",
    ],

    Gaumutra: [
      "gaumutra",
      "gomutra",
      "gomuthra",
      "urine",
    ],

    Compost: [
      "compost",
      "gobbara",
    ],

    Slurry: ["slurry"],
  };

  const materialAliases =
    aliases[material] || [];

  for (
    let index = 0;
    index <
    materialAliases.length;
    index += 1
  ) {
    const found =
      rateMap[
        normalise(
          materialAliases[index]
        )
      ];

    if (found) {
      return found;
    }
  }

  return null;
}


function calculateItemAmount(
  item
) {
  return round2(
    numberValue(
      item.quantity
    ) *
    numberValue(
      item.rate
    )
  );
}


export default function SamvardhanaOutgoing() {
  const { user } = useAuth();

  const [rows, setRows] =
    useState([]);

  const [rates, setRates] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [toast, setToast] =
    useState(null);

  const [fromDate, setFromDate] =
    useState(monthStartIso());

  const [toDate, setToDate] =
    useState(todayIso());

  const [
    movementFilter,
    setMovementFilter,
  ] = useState("");

  const [
    destinationFilter,
    setDestinationFilter,
  ] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("Completed");

  const [search, setSearch] =
    useState("");

  const [formOpen, setFormOpen] =
    useState(false);

  const [isEditMode, setIsEditMode] =
    useState(false);

  const [form, setForm] =
    useState(createEmptyForm);

  const [selected, setSelected] =
    useState(null);

  const [
    cancelTarget,
    setCancelTarget,
  ] = useState(null);

  const [
    cancelReasonOpen,
    setCancelReasonOpen,
  ] = useState(false);

  const [
    cancelReason,
    setCancelReason,
  ] = useState("");

  const [
    cancelConfirmOpen,
    setCancelConfirmOpen,
  ] = useState(false);

  const rateMap = useMemo(
    () => getRateMap(rates),
    [rates]
  );


  function showToast(
    message,
    type = "success"
  ) {
    setToast({
      message,
      type,
    });

    window.setTimeout(
      () => setToast(null),
      3500
    );
  }


  async function loadRates() {
    try {
      const response =
        await fetchMaster(
          "rates"
        );

      const data =
        Array.isArray(
          response?.data
        )
          ? response.data
          : Array.isArray(
              response
            )
          ? response
          : [];

      setRates(
        data.filter(
          (row) =>
            normalise(
              row.is_active
            ) !== "no"
        )
      );
    } catch (rateError) {
      console.error(
        "Rates Load Error:",
        rateError
      );
    }
  }


  async function loadRows() {
    if (
      fromDate &&
      toDate &&
      fromDate > toDate
    ) {
      setError(
        "From Date cannot be later than To Date."
      );

      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await getSamvardhanaOutgoing({
          fromDate,
          toDate,
          movementType:
            movementFilter,
          destinationType:
            destinationFilter,
          status:
            statusFilter,
        });

      const data =
        Array.isArray(
          response?.data
        )
          ? response.data
          : Array.isArray(
              response
            )
          ? response
          : [];

      setRows(data);
    } catch (loadError) {
      console.error(
        "Samvardhana Load Error:",
        loadError
      );

      setError(
        loadError?.message ||
        "Unable to load Samvardhana Outgoing transactions."
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadRates();
  }, []);


  useEffect(() => {
    loadRows();
  }, []);


  const filteredRows = useMemo(
    () => {
      const searchText =
        normalise(search);

      if (!searchText) {
        return rows;
      }

      return rows.filter(
        (row) => {
          const values = [
            row.outgoingId,
            row.date,
            row.movementType,
            row.destinationType,
            row.destinationName,
            row.partyName,
            row.receiptNo,
            row.billNo,
            row.senderName,
            row.receiverName,
            row.status,
            ...(row.items || []).map(
              (item) =>
                [
                  item.material,
                  item.usageType,
                  item.unit,
                ].join(" ")
            ),
          ];

          return values.some(
            (value) =>
              normalise(
                value
              ).includes(
                searchText
              )
          );
        }
      );
    },
    [rows, search]
  );


  const summary = useMemo(
    () => {
      return filteredRows.reduce(
        (result, row) => {
          result.count += 1;

          if (
            row.movementType ===
            "Internal Transfer"
          ) {
            result.internal += 1;
          }

          if (
            row.movementType ===
            "External Sale"
          ) {
            result.external += 1;
          }

          if (
            row.status !==
            "Cancelled"
          ) {
                        result.amount +=
              transactionDisplayValue(
                row
              );
          }

          return result;
        },
        {
          count: 0,
          internal: 0,
          external: 0,
          amount: 0,
        }
      );
    },
    [filteredRows]
  );


  function clearFilters() {
    setFromDate(
      monthStartIso()
    );

    setToDate(
      todayIso()
    );

    setMovementFilter("");
    setDestinationFilter("");
    setStatusFilter(
      "Completed"
    );

    setSearch("");
  }


  function openAdd() {
    const empty =
      createEmptyForm();

    const defaultRate =
      materialRate(
        rateMap,
        "Milk"
      );

    if (defaultRate) {
      empty.items[0].rate =
        defaultRate.rate;

      empty.items[0].unit =
        defaultRate.unit ||
        "Ltr";
    }

    setForm(empty);
    setIsEditMode(false);
    setFormOpen(true);
    setSelected(null);
    setError("");
  }


  function openEdit(row) {
    if (
      row.status ===
      "Cancelled"
    ) {
      showToast(
        "A cancelled transaction cannot be edited.",
        "error"
      );

      return;
    }

    setForm({
      outgoingId:
        row.outgoingId ||
        row.outgoing_id ||
        "",

      date:
        row.date || todayIso(),

      movementType:
        row.movementType ||
        row.movement_type ||
        "Internal Transfer",

      destinationType:
        row.destinationType ||
        row.destination_type ||
        "MSGP",

      destinationName:
        row.destinationName ||
        row.destination_name ||
        "",

      partyName:
        row.partyName ||
        row.party_name ||
        "",

      receiptNo:
        row.receiptNo ||
        row.receipt_no ||
        "",

      billNo:
        row.billNo ||
        row.bill_no ||
        "",

      billDate:
        row.billDate ||
        row.bill_date ||
        "",

            taxAmount:
        row.taxAmount ??
        row.tax_amount ??
        "",

      transportCharges:
        row.transportCharges ??
        row.transport_charges ??
        "",

      otherCharges:
        row.otherCharges ??
        row.other_charges ??
        "",

      otherChargesRemarks:
        row.otherChargesRemarks ||
        row.other_charges_remarks ||
        "",

      discountAmount:
        row.discountAmount ??
        row.discount_amount ??
        "",

      senderName:
        row.senderName ||
        row.sender_name ||
        "",

      receiverName:
        row.receiverName ||
        row.receiver_name ||
        "",

      remarks:
        row.remarks || "",

      items:
        (row.items || []).map(
          (item) => ({
            lineId:
              item.lineId ||
              item.line_id ||
              "",

            material:
              item.material ||
              "Milk",

            usageType:
              item.usageType ||
              item.usage_type ||
              "",

            quantity:
              item.quantity ?? "",

            unit:
              item.unit || "",

            rate:
              item.rate ?? "",

            amount:
              item.amount ?? 0,

            sourceType:
              item.sourceType ||
              item.source_type ||
              "",

            sourceTransactionId:
              item.sourceTransactionId ||
              item.source_transaction_id ||
              "",

            remarks:
              item.remarks || "",
          })
        ),
    });

    setIsEditMode(true);
    setFormOpen(true);
    setSelected(null);
    setError("");
  }


  function handleHeaderChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => {
        const next = {
          ...previous,
          [name]: value,
        };

        if (
          name ===
          "movementType"
        ) {
          if (
            value ===
            "Internal Transfer"
          ) {
            next.destinationType =
              "MSGP";

            next.destinationName =
              "MSGP";

                        next.partyName = "";
            next.billNo = "";
            next.billDate = "";
            next.taxAmount = "";
            next.transportCharges = "";
            next.otherCharges = "";
            next.otherChargesRemarks = "";
            next.discountAmount = "";
                    } else {
            next.destinationType =
              "External Party";

            next.destinationName = "";

            /*
             * Bill Date defaults to the outgoing date.
             * Bill Number is generated after saving.
             */
            next.billDate =
              next.date;
          }
        }

        if (
          name ===
            "destinationType" &&
          next.movementType ===
            "Internal Transfer"
        ) {
          next.destinationName =
            value;
        }

        if (
          name === "partyName" &&
          next.movementType ===
            "External Sale"
        ) {
          next.destinationName =
            value;
        }

                if (
          name === "date" &&
          next.movementType ===
            "External Sale" &&
          (
            !previous.billDate ||
            previous.billDate ===
              previous.date
          )
        ) {
          next.billDate =
            value;
        }
        return next;
      }
    );
  }


  function updateItem(
    index,
    field,
    value
  ) {
    setForm(
      (previous) => {
        const items =
          previous.items.map(
            (item) => ({
              ...item,
            })
          );

        const current = {
          ...items[index],
          [field]: value,
        };

        if (
          field === "material"
        ) {
          const defaults =
            materialRate(
              rateMap,
              value
            );

          current.usageType =
            value === "Milk"
              ? "Sale"
              : "";

          current.unit =
            defaults?.unit ||
            UNIT_OPTIONS[value]?.[0] ||
            "";

          current.rate =
            defaults?.rate || "";
        }

        current.amount =
          calculateItemAmount(
            current
          );

        items[index] =
          current;

        return {
          ...previous,
          items,
        };
      }
    );
  }


  function addItem() {
    setForm(
      (previous) => {
        const item =
          createEmptyItem();

        const defaults =
          materialRate(
            rateMap,
            item.material
          );

        if (defaults) {
          item.rate =
            defaults.rate;

          item.unit =
            defaults.unit ||
            item.unit;
        }

        return {
          ...previous,
          items: [
            ...previous.items,
            item,
          ],
        };
      }
    );
  }


  function removeItem(index) {
    setForm(
      (previous) => {
        if (
          previous.items.length <= 1
        ) {
          showToast(
            "At least one material line is required.",
            "error"
          );

          return previous;
        }

        return {
          ...previous,
          items:
            previous.items.filter(
              (_, itemIndex) =>
                itemIndex !== index
            ),
        };
      }
    );
  }


    /*
   * Material subtotal is calculated from the transaction lines.
   */
  const formTotal = useMemo(
    () =>
      round2(
        form.items.reduce(
          (total, item) =>
            total +
            calculateItemAmount(
              item
            ),
          0
        )
      ),
    [form.items]
  );


  /*
   * External-sale billed amount:
   *
   * Subtotal
   * + Tax
   * + Transport
   * + Other Charges
   * - Discount
   */
  const formBilledAmount =
    useMemo(
      () => {
        if (
          form.movementType !==
          "External Sale"
        ) {
          return 0;
        }

        return round2(
          Math.max(
            0,
            formTotal +
              numberValue(
                form.taxAmount
              ) +
              numberValue(
                form.transportCharges
              ) +
              numberValue(
                form.otherCharges
              ) -
              numberValue(
                form.discountAmount
              )
          )
        );
      },
      [
        form.movementType,
        formTotal,
        form.taxAmount,
        form.transportCharges,
        form.otherCharges,
        form.discountAmount,
      ]
    );


  function validateForm() {
    if (!form.date) {
      return "Date is required.";
    }

    if (!form.receiptNo.trim()) {
      return "Receipt Number is required.";
    }

    if (
      form.movementType ===
        "External Sale" &&
      !form.partyName.trim()
    ) {
      return "Party Name is required for an External Sale.";
    }

    if (
      !form.destinationName.trim()
    ) {
      return "Destination Name is required.";
    }

    if (
      !Array.isArray(
        form.items
      ) ||
      form.items.length === 0
    ) {
      return "Add at least one material line.";
    }

    for (
      let index = 0;
      index <
      form.items.length;
      index += 1
    ) {
      const item =
        form.items[index];

      if (
        numberValue(
          item.quantity
        ) <= 0
      ) {
        return (
          "Quantity must be greater than zero on material line " +
          (index + 1) +
          "."
        );
      }

      if (
        numberValue(
          item.rate
        ) <= 0
      ) {
        return (
          "Rate must be greater than zero on material line " +
          (index + 1) +
          "."
        );
      }

      if (!item.unit) {
        return (
          "Unit is required on material line " +
          (index + 1) +
          "."
        );
      }

      if (
        item.material ===
          "Milk" &&
        !item.usageType
      ) {
        return (
          "Milk Usage Type is required on line " +
          (index + 1) +
          "."
        );
      }
    }

    if (
      form.movementType ===
      "External Sale"
    ) {
      const taxAmount =
        numberValue(
          form.taxAmount
        );

      const transportCharges =
        numberValue(
          form.transportCharges
        );

      const otherCharges =
        numberValue(
          form.otherCharges
        );

      const discountAmount =
        numberValue(
          form.discountAmount
        );

      if (
        taxAmount < 0 ||
        transportCharges < 0 ||
        otherCharges < 0 ||
        discountAmount < 0
      ) {
        return "Tax, transport charges, other charges and discount cannot be negative.";
      }

      if (
        otherCharges > 0 &&
        !form.otherChargesRemarks
          .trim()
      ) {
        return "Other Charges Remarks is required when Other Charges is greater than zero.";
      }

      const amountBeforeDiscount =
        formTotal +
        taxAmount +
        transportCharges +
        otherCharges;

      if (
        discountAmount >
        amountBeforeDiscount
      ) {
        return "Discount Amount cannot exceed the subtotal and charges.";
      }
    }

    return "";
  }


  async function handleSave(
    event
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const validationError =
      validateForm();

    if (validationError) {
      showToast(
        validationError,
        "error"
      );

      return;
    }

    const userName =
      user?.name ||
      user?.email ||
      "Admin";

    const payload = {
      ...form,

            subtotalAmount:
        formTotal,

      billedAmount:
        formBilledAmount,

      createdBy:
        userName,

      updatedBy:
        userName,

      items:
        form.items.map(
          (item) => ({
            ...item,

            quantity:
              round2(
                item.quantity
              ),

            rate:
              round2(
                item.rate
              ),

            amount:
              calculateItemAmount(
                item
              ),
          })
        ),
    };

    setSaving(true);

    try {
      if (isEditMode) {
        await updateSamvardhanaOutgoing(
          payload
        );
      } else {
        await addSamvardhanaOutgoing(
          payload
        );
      }

      showToast(
        isEditMode
          ? "Samvardhana Outgoing transaction updated successfully."
          : "Samvardhana Outgoing transaction added successfully."
      );

      setFormOpen(false);
      setForm(
        createEmptyForm()
      );

      await loadRows();
    } catch (saveError) {
      console.error(
        "Samvardhana Save Error:",
        saveError
      );

      showToast(
        saveError?.message ||
        "Unable to save the transaction.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }


  function beginCancel(row) {
    if (
      row.status ===
      "Cancelled"
    ) {
      return;
    }

    setCancelTarget(row);
    setCancelReason("");
    setCancelReasonOpen(true);
    setSelected(null);
  }


  function continueCancel() {
    if (
      !cancelReason.trim()
    ) {
      showToast(
        "Cancellation Reason is required.",
        "error"
      );

      return;
    }

    setCancelReasonOpen(false);
    setCancelConfirmOpen(true);
  }


  async function confirmCancel() {
    if (
      !cancelTarget ||
      saving
    ) {
      return;
    }

    setSaving(true);

    try {
      await cancelSamvardhanaOutgoing({
        outgoingId:
          cancelTarget.outgoingId ||
          cancelTarget.outgoing_id,

        cancellationReason:
          cancelReason.trim(),

        updatedBy:
          user?.name ||
          user?.email ||
          "Admin",
      });

      setCancelConfirmOpen(false);
      setCancelTarget(null);
      setCancelReason("");

      showToast(
        "Transaction cancelled successfully."
      );

      await loadRows();
    } catch (cancelError) {
      showToast(
        cancelError?.message ||
        "Unable to cancel the transaction.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <div className="svo-page">
      <style>{`
        .svo-page {
          color: #0f172a;
        }

        .svo-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .svo-header h1 {
          margin: 0;
          font-size: 1.6rem;
        }

        .svo-subtitle {
          margin: 0.35rem 0 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        .svo-primary,
        .svo-secondary,
        .svo-danger {
          border-radius: 8px;
          padding: 0.65rem 1rem;
          font-weight: 700;
          cursor: pointer;
        }

        .svo-primary {
          border: 1px solid #ea580c;
          background: #ea580c;
          color: white;
        }

        .svo-secondary {
          border: 1px solid #cbd5e1;
          background: white;
          color: #334155;
        }

        .svo-danger {
          border: 1px solid #dc2626;
          background: #dc2626;
          color: white;
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .svo-kpis {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.8rem;
          margin-bottom: 1rem;
        }

        .svo-card,
        .svo-panel {
          background: white;
          border: 1px solid #dbe3ee;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        }

        .svo-card {
          padding: 1rem;
        }

        .svo-card-label {
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .svo-card-value {
          margin-top: 0.35rem;
          font-size: 1.35rem;
          font-weight: 800;
        }

        .svo-panel {
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .svo-filter-grid {
          display: grid;
          grid-template-columns:
            minmax(170px, 1.4fr)
            repeat(5, minmax(140px, 1fr));
          gap: 0.75rem;
          align-items: end;
        }

        .svo-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .svo-field label {
          color: #475569;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .svo-field input,
        .svo-field select,
        .svo-field textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 7px;
          padding: 0.62rem 0.7rem;
          background: white;
          color: #0f172a;
          font: inherit;
        }

        .svo-actions {
          display: flex;
          gap: 0.55rem;
          flex-wrap: wrap;
        }

        .svo-table-wrap {
          overflow-x: auto;
        }

        .svo-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }

        .svo-table th,
        .svo-table td {
          padding: 0.7rem;
          border-bottom: 1px solid #e2e8f0;
          text-align: left;
          font-size: 0.82rem;
        }

        .svo-table th {
          background: #f8fafc;
          color: #475569;
          font-size: 0.72rem;
          text-transform: uppercase;
        }

        .svo-table tbody tr {
          cursor: pointer;
        }

        .svo-table tbody tr:hover {
          background: #fff7ed;
        }

        .svo-number {
          text-align: right !important;
          font-variant-numeric: tabular-nums;
        }

        .svo-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 0.25rem 0.55rem;
          font-size: 0.7rem;
          font-weight: 800;
        }

        .svo-badge.completed {
          background: #dcfce7;
          color: #166534;
        }

        .svo-badge.cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        .svo-empty {
          padding: 2.5rem;
          text-align: center;
          color: #64748b;
        }

        .svo-error {
          margin-bottom: 1rem;
          padding: 0.8rem;
          border: 1px solid #fecaca;
          border-radius: 8px;
          background: #fef2f2;
          color: #b91c1c;
        }

        .svo-toast {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 12000;
          max-width: 420px;
          border-radius: 9px;
          padding: 0.85rem 1rem;
          color: white;
          font-weight: 700;
          box-shadow: 0 12px 30px rgba(0,0,0,0.18);
        }

        .svo-toast.success {
          background: #15803d;
        }

        .svo-toast.error {
          background: #b91c1c;
        }

        .svo-overlay {
          position: fixed;
          inset: 0;
          z-index: 9000;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
          background: rgba(15, 23, 42, 0.6);
        }

        .svo-modal {
          width: min(1100px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.25);
        }

        .svo-modal.small {
          width: min(560px, 100%);
        }

        .svo-modal-header,
        .svo-modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.2rem;
        }

        .svo-modal-header {
          border-bottom: 1px solid #e2e8f0;
        }

        .svo-modal-footer {
          justify-content: flex-end;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .svo-modal-body {
          padding: 1.2rem;
        }

        .svo-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.8rem;
          margin-bottom: 1rem;
        }

        .svo-section-title {
          margin: 1.2rem 0 0.7rem;
          color: #c2410c;
          font-size: 0.82rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .svo-item {
          display: grid;
          grid-template-columns:
            1.1fr 1fr 0.8fr 0.8fr 0.8fr 0.9fr auto;
          gap: 0.55rem;
          align-items: end;
          margin-bottom: 0.65rem;
          padding: 0.8rem;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          background: #f8fafc;
        }

        .svo-item-source {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns:
            minmax(180px, 0.8fr)
            minmax(220px, 1.5fr)
            minmax(220px, 1.5fr);
          gap: 0.55rem;
          padding-top: 0.7rem;
          border-top: 1px dashed #cbd5e1;
        }

        .svo-item-amount {
          padding: 0.65rem;
          text-align: right;
          font-weight: 800;
        }

        .svo-total {
          display: flex;
          justify-content: flex-end;
          margin-top: 0.8rem;
          font-size: 1.1rem;
          font-weight: 800;
        }

        .svo-details-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.8rem;
        }

        .svo-detail {
          padding: 0.75rem;
          border-radius: 8px;
          background: #f8fafc;
        }

        .svo-detail-label {
          color: #64748b;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .svo-detail-value {
          margin-top: 0.25rem;
          font-weight: 700;
        }

        @media (max-width: 1100px) {
          .svo-filter-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .svo-item {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .svo-header {
            flex-direction: column;
          }

          .svo-header .svo-primary {
            width: 100%;
          }

          .svo-kpis {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

                    .svo-filter-grid,
          .svo-form-grid,
          .svo-details-grid,
          .svo-item,
          .svo-item-source {
            grid-template-columns: 1fr;
          }

          .svo-item-source {
            grid-column: auto;
          }
          .svo-modal {
            max-height: 96vh;
          }

          .svo-modal-footer {
            flex-direction: column-reverse;
          }

          .svo-modal-footer button {
            width: 100%;
          }
        }
      `}</style>

      {toast && (
        <div
          className={
            "svo-toast " +
            toast.type
          }
          role="status"
        >
          {toast.message}
        </div>
      )}

      <div className="svo-header">
        <div>
          <h1>
            Samvardhana Outgoing
          </h1>

          <p className="svo-subtitle">
            Record valued internal
            transfers to MSGP/Krushi
            and external by-product
            sales.
          </p>
        </div>

        <button
          type="button"
          className="svo-primary"
          onClick={openAdd}
        >
          + Add Outgoing
        </button>
      </div>

      <div className="svo-kpis">
        <SummaryCard
          label="Transactions"
          value={summary.count}
        />

        <SummaryCard
          label="Internal Transfers"
          value={summary.internal}
        />

        <SummaryCard
          label="External Sales"
          value={summary.external}
        />

        <SummaryCard
          label="Total Value"
          value={
            "₹" +
            formatAmount(
              summary.amount
            )
          }
        />
      </div>

      <section className="svo-panel">
        <div className="svo-filter-grid">
          <Field label="Search">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="ID, receipt, destination, party..."
            />
          </Field>

          <Field label="From Date">
            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(
                  event.target.value
                )
              }
            />
          </Field>

          <Field label="To Date">
            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(
                  event.target.value
                )
              }
            />
          </Field>

          <Field label="Movement Type">
            <select
              value={
                movementFilter
              }
              onChange={(event) =>
                setMovementFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Movement Types
              </option>

              <option value="Internal Transfer">
                Internal Transfer
              </option>

              <option value="External Sale">
                External Sale
              </option>
            </select>
          </Field>

          <Field label="Destination">
            <select
              value={
                destinationFilter
              }
              onChange={(event) =>
                setDestinationFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Destinations
              </option>

              <option value="MSGP">
                MSGP
              </option>

              <option value="Krushi">
                Krushi
              </option>

              <option value="External Party">
                External Party
              </option>
            </select>
          </Field>

          <Field label="Status">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Statuses
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Cancelled">
                Cancelled
              </option>
            </select>
          </Field>
        </div>

        <div
          className="svo-actions"
          style={{
            marginTop: "0.8rem",
          }}
        >
          <button
            type="button"
            className="svo-primary"
            onClick={loadRows}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "Apply Filters"}
          </button>

          <button
            type="button"
            className="svo-secondary"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </section>

      {error && (
        <div className="svo-error">
          {error}
        </div>
      )}

      <section className="svo-panel">
        <div className="svo-table-wrap">
          <table className="svo-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Outgoing ID</th>
                <th>Movement</th>
                <th>Destination/Party</th>
                <th>Receipt</th>
                <th>Materials</th>
                <th className="svo-number">
                  Value
                </th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
                filteredRows.map(
                  (row) => (
                    <tr
                      key={
                        row.outgoingId ||
                        row.outgoing_id
                      }
                      onClick={() =>
                        setSelected(
                          row
                        )
                      }
                      title="Click to view details"
                    >
                      <td>
                        {formatDate(
                          row.date
                        )}
                      </td>

                      <td>
                        {row.outgoingId ||
                          row.outgoing_id}
                      </td>

                      <td>
                        {row.movementType ||
                          row.movement_type}
                      </td>

                      <td>
                        {row.partyName ||
                          row.destinationName ||
                          "-"}
                      </td>

                      <td>
                        {row.receiptNo ||
                          "-"}
                      </td>

                      <td>
                        {(row.items || [])
                          .map(
                            (item) =>
                              item.material
                          )
                          .join(", ") ||
                          "-"}
                      </td>

                      <td className="svo-number">
                        ₹
                                                {formatAmount(
                          transactionDisplayValue(
                            row
                          )
                        )}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            row.status
                          }
                        />
                      </td>
                    </tr>
                  )
                )}
            </tbody>
          </table>

          {!loading &&
            filteredRows.length ===
              0 && (
              <div className="svo-empty">
                No Samvardhana
                Outgoing transactions
                found.
              </div>
            )}

          {loading && (
            <div className="svo-empty">
              Loading transactions...
            </div>
          )}
        </div>
      </section>

      {formOpen && (
        <div className="svo-overlay">
          <form
            className="svo-modal"
            onSubmit={handleSave}
          >
            <div className="svo-modal-header">
              <div>
                <strong>
                  {isEditMode
                    ? "Edit Samvardhana Outgoing"
                    : "Add Samvardhana Outgoing"}
                </strong>

                {isEditMode && (
                  <div
                    style={{
                      marginTop:
                        "0.25rem",
                      color:
                        "#64748b",
                      fontSize:
                        "0.8rem",
                    }}
                  >
                    {form.outgoingId}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="svo-secondary"
                onClick={() =>
                  setFormOpen(false)
                }
                disabled={saving}
              >
                Close
              </button>
            </div>

            <div className="svo-modal-body">
              <div className="svo-form-grid">
                <Field label="Date">
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    max={todayIso()}
                    onChange={
                      handleHeaderChange
                    }
                    required
                  />
                </Field>

                <Field label="Movement Type">
                  <select
                    name="movementType"
                    value={
                      form.movementType
                    }
                    onChange={
                      handleHeaderChange
                    }
                  >
                    <option value="Internal Transfer">
                      Internal Transfer
                    </option>

                    <option value="External Sale">
                      External Sale
                    </option>
                  </select>
                </Field>

                <Field label="Destination Type">
                  <select
                    name="destinationType"
                    value={
                      form.destinationType
                    }
                    onChange={
                      handleHeaderChange
                    }
                    disabled={
                      form.movementType ===
                      "External Sale"
                    }
                  >
                    {form.movementType ===
                    "Internal Transfer" ? (
                      <>
                        <option value="MSGP">
                          MSGP
                        </option>

                        <option value="Krushi">
                          Krushi
                        </option>
                      </>
                    ) : (
                      <option value="External Party">
                        External Party
                      </option>
                    )}
                  </select>
                </Field>

                {form.movementType ===
                "External Sale" ? (
                  <Field label="Party Name">
                    <input
                      type="text"
                      name="partyName"
                      value={
                        form.partyName
                      }
                      onChange={
                        handleHeaderChange
                      }
                      required
                    />
                  </Field>
                ) : (
                  <Field label="Destination Name">
                    <input
                      type="text"
                      name="destinationName"
                      value={
                        form.destinationName
                      }
                      onChange={
                        handleHeaderChange
                      }
                      required
                    />
                  </Field>
                )}

                <Field label="Receipt No.">
                  <input
                    type="text"
                    name="receiptNo"
                    value={
                      form.receiptNo
                    }
                    onChange={
                      handleHeaderChange
                    }
                    required
                  />
                </Field>

                <Field label="Sender">
                  <input
                    type="text"
                    name="senderName"
                    value={
                      form.senderName
                    }
                    onChange={
                      handleHeaderChange
                    }
                  />
                </Field>

                <Field label="Receiver">
                  <input
                    type="text"
                    name="receiverName"
                    value={
                      form.receiverName
                    }
                    onChange={
                      handleHeaderChange
                    }
                  />
                </Field>

                                {form.movementType ===
                  "External Sale" && (
                  <>
                    <Field label="Bill No.">
                      <input
                        type="text"
                        value={
                          form.billNo
                        }
                        readOnly
                        placeholder="Generated after saving"
                        title="Bill Number is generated automatically by CDMS."
                      />
                    </Field>

                    <Field label="Bill Date">
                      <input
                        type="date"
                        name="billDate"
                        value={
                          form.billDate
                        }
                        onChange={
                          handleHeaderChange
                        }
                      />
                    </Field>

                    <Field label="Material Subtotal">
                      <input
                        type="number"
                        value={
                          formTotal
                        }
                        readOnly
                        step="0.01"
                        title="Calculated automatically from material lines."
                      />
                    </Field>

                    <Field label="Tax Amount">
                      <input
                        type="number"
                        name="taxAmount"
                        min="0"
                        step="0.01"
                        value={
                          form.taxAmount
                        }
                        onChange={
                          handleHeaderChange
                        }
                        placeholder="0.00"
                      />
                    </Field>

                    <Field label="Transport Charges">
                      <input
                        type="number"
                        name="transportCharges"
                        min="0"
                        step="0.01"
                        value={
                          form.transportCharges
                        }
                        onChange={
                          handleHeaderChange
                        }
                        placeholder="0.00"
                      />
                    </Field>

                    <Field label="Other Charges">
                      <input
                        type="number"
                        name="otherCharges"
                        min="0"
                        step="0.01"
                        value={
                          form.otherCharges
                        }
                        onChange={
                          handleHeaderChange
                        }
                        placeholder="0.00"
                      />
                    </Field>

                    <Field label="Other Charges Remarks">
                      <input
                        type="text"
                        name="otherChargesRemarks"
                        value={
                          form.otherChargesRemarks
                        }
                        onChange={
                          handleHeaderChange
                        }
                        placeholder="Required when other charges are entered"
                      />
                    </Field>

                    <Field label="Discount Amount">
                      <input
                        type="number"
                        name="discountAmount"
                        min="0"
                        step="0.01"
                        value={
                          form.discountAmount
                        }
                        onChange={
                          handleHeaderChange
                        }
                        placeholder="0.00"
                      />
                    </Field>

                    <Field label="Final Billed Amount">
                      <input
                        type="number"
                        value={
                          formBilledAmount
                        }
                        readOnly
                        step="0.01"
                        title="Calculated automatically from subtotal and billing adjustments."
                      />
                    </Field>
                                    </>
                )}
              </div>

              <div className="svo-section-title">
                Material Lines
              </div>

              {form.items.map(
                (item, index) => (
                  <div
                    className="svo-item"
                    key={
                      item.lineId ||
                      `new-${index}`
                    }
                  >
                    <Field label="Material">
                      <select
                        value={
                          item.material
                        }
                        onChange={(
                          event
                        ) =>
                          updateItem(
                            index,
                            "material",
                            event.target
                              .value
                          )
                        }
                      >
                        {MATERIALS.map(
                          (material) => (
                            <option
                              key={
                                material
                              }
                              value={
                                material
                              }
                            >
                              {material}
                            </option>
                          )
                        )}
                      </select>
                    </Field>

                    <Field label="Usage Type">
                      <select
                        value={
                          item.usageType
                        }
                        disabled={
                          item.material !==
                          "Milk"
                        }
                        onChange={(
                          event
                        ) =>
                          updateItem(
                            index,
                            "usageType",
                            event.target
                              .value
                          )
                        }
                      >
                        {item.material !==
                        "Milk" ? (
                          <option value="">
                            Not Applicable
                          </option>
                        ) : (
                          MILK_USAGE_TYPES.map(
                            (usageType) => (
                              <option
                                key={
                                  usageType
                                }
                                value={
                                  usageType
                                }
                              >
                                {usageType}
                              </option>
                            )
                          )
                        )}
                      </select>
                    </Field>

                    <Field label="Quantity">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={
                          item.quantity
                        }
                        onChange={(
                          event
                        ) =>
                          updateItem(
                            index,
                            "quantity",
                            event.target
                              .value
                          )
                        }
                        required
                      />
                    </Field>

                    <Field label="Unit">
                      <select
                        value={
                          item.unit
                        }
                        onChange={(
                          event
                        ) =>
                          updateItem(
                            index,
                            "unit",
                            event.target
                              .value
                          )
                        }
                      >
                        {(
                          UNIT_OPTIONS[
                            item.material
                          ] || []
                        ).map(
                          (unit) => (
                            <option
                              key={unit}
                              value={unit}
                            >
                              {unit}
                            </option>
                          )
                        )}
                      </select>
                    </Field>

                    <Field label="Rate">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={
                          item.rate
                        }
                        onChange={(
                          event
                        ) =>
                          updateItem(
                            index,
                            "rate",
                            event.target
                              .value
                          )
                        }
                        required
                      />
                    </Field>

                    <Field label="Amount">
                      <div className="svo-item-amount">
                        ₹
                        {formatAmount(
                          calculateItemAmount(
                            item
                          )
                        )}
                      </div>
                    </Field>

                    <button
                      type="button"
                      className="svo-danger"
                      onClick={() =>
                        removeItem(
                          index
                        )
                      }
                    >
                      Remove
                    </button>

                                        <div className="svo-item-source">
                      <Field label="Source Type (Optional)">
                        <select
                          value={
                            item.sourceType
                          }
                          onChange={(
                            event
                          ) =>
                            updateItem(
                              index,
                              "sourceType",
                              event.target
                                .value
                            )
                          }
                        >
                          <option value="">
                            Not Linked
                          </option>

                          <option value="Milk Distribution">
                            Milk Distribution
                          </option>

                          <option value="Bio Waste">
                            Bio Waste
                          </option>
                        </select>
                      </Field>

                      <Field label="Source Transaction ID (Optional)">
                        <input
                          type="text"
                          value={
                            item.sourceTransactionId
                          }
                          onChange={(
                            event
                          ) =>
                            updateItem(
                              index,
                              "sourceTransactionId",
                              event.target
                                .value
                            )
                          }
                          placeholder={
                            item.sourceType ===
                            "Milk Distribution"
                              ? "Milk Distribution transaction ID"
                              : item.sourceType ===
                                "Bio Waste"
                              ? "BW-00001"
                              : "Select Source Type first"
                          }
                          disabled={
                            !item.sourceType
                          }
                        />
                      </Field>

                      <Field label="Line Remarks">
                        <input
                          type="text"
                          value={
                            item.remarks
                          }
                          onChange={(
                            event
                          ) =>
                            updateItem(
                              index,
                              "remarks",
                              event.target
                                .value
                            )
                          }
                          placeholder="Optional material-line remarks"
                        />
                      </Field>
                    </div>
                  </div>
                )
              )}

              <button
                type="button"
                className="svo-secondary"
                onClick={addItem}
              >
                + Add Material
              </button>

                            <div className="svo-total">
                {form.movementType ===
                "External Sale"
                  ? "Material Subtotal: ₹"
                  : "Transfer Value: ₹"}

                {formatAmount(
                  formTotal
                )}

                {form.movementType ===
                  "External Sale" && (
                  <>
                    {" | Final Billed Amount: ₹"}
                    {formatAmount(
                      formBilledAmount
                    )}
                  </>
                )}
              </div>

              <div className="svo-section-title">
                Source and Remarks
              </div>

              <div className="svo-form-grid">
                <Field label="Remarks">
                  <textarea
                    name="remarks"
                    value={
                      form.remarks
                    }
                    onChange={
                      handleHeaderChange
                    }
                    rows="3"
                  />
                </Field>
              </div>
            </div>

            <div className="svo-modal-footer">
              <button
                type="button"
                className="svo-secondary"
                onClick={() =>
                  setFormOpen(false)
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="svo-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : isEditMode
                  ? "Update Transaction"
                  : "Save Transaction"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selected && (
        <div
          className="svo-overlay"
          onClick={() =>
            setSelected(null)
          }
        >
          <div
            className="svo-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="svo-modal-header">
              <div>
                <strong>
                  Samvardhana Outgoing
                  Details
                </strong>

                <div
                  style={{
                    marginTop:
                      "0.25rem",
                    color: "#64748b",
                  }}
                >
                  {selected.outgoingId}
                </div>
              </div>

              <button
                type="button"
                className="svo-secondary"
                onClick={() =>
                  setSelected(null)
                }
              >
                Close
              </button>
            </div>

            <div className="svo-modal-body">
              <div className="svo-details-grid">
                <Detail
                  label="Date"
                  value={formatDate(
                    selected.date
                  )}
                />

                <Detail
                  label="Movement Type"
                  value={
                    selected.movementType
                  }
                />

                <Detail
                  label="Destination"
                  value={
                    selected.partyName ||
                    selected.destinationName
                  }
                />

                <Detail
                  label="Receipt No."
                  value={
                    selected.receiptNo
                  }
                />

                <Detail
                  label="Bill No."
                  value={
                    selected.billNo ||
                    "-"
                  }
                />

                <Detail
                  label="Status"
                  value={
                    selected.status
                  }
                />

                <Detail
                  label="Sender"
                  value={
                    selected.senderName ||
                    "-"
                  }
                />

                <Detail
                  label="Receiver"
                  value={
                    selected.receiverName ||
                    "-"
                  }
                />

                                <Detail
                  label={
                    selected.movementType ===
                    "External Sale"
                      ? "Final Billed Amount"
                      : "Transfer Value"
                  }
                  value={
                    "₹" +
                    formatAmount(
                      transactionDisplayValue(
                        selected
                      )
                    )
                  }
                />

                {selected.movementType ===
                  "External Sale" && (
                  <>
                    <Detail
                      label="Bill Date"
                      value={
                        formatDate(
                          selected.billDate
                        ) || "-"
                      }
                    />

                    <Detail
                      label="Material Subtotal"
                      value={
                        "₹" +
                        formatAmount(
                          selected.subtotalAmount ??
                          selected.subtotal_amount
                        )
                      }
                    />

                    <Detail
                      label="Tax Amount"
                      value={
                        "₹" +
                        formatAmount(
                          selected.taxAmount ??
                          selected.tax_amount
                        )
                      }
                    />

                    <Detail
                      label="Transport Charges"
                      value={
                        "₹" +
                        formatAmount(
                          selected.transportCharges ??
                          selected.transport_charges
                        )
                      }
                    />

                    <Detail
                      label="Other Charges"
                      value={
                        "₹" +
                        formatAmount(
                          selected.otherCharges ??
                          selected.other_charges
                        )
                      }
                    />

                    <Detail
                      label="Other Charges Remarks"
                      value={
                        selected.otherChargesRemarks ||
                        selected.other_charges_remarks ||
                        "-"
                      }
                    />

                    <Detail
                      label="Discount Amount"
                      value={
                        "₹" +
                        formatAmount(
                          selected.discountAmount ??
                          selected.discount_amount
                        )
                      }
                    />
                  </>
                )}
              </div>

              <div className="svo-section-title">
                Materials
              </div>

              <div className="svo-table-wrap">
                <table className="svo-table">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Usage</th>
                      <th className="svo-number">
                        Quantity
                      </th>
                      <th>Unit</th>
                      <th className="svo-number">
                        Rate
                      </th>
                      <th className="svo-number">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {(selected.items || []).map(
                      (item) => (
                        <tr
                          key={
                            item.lineId ||
                            item.line_id
                          }
                          style={{
                            cursor:
                              "default",
                          }}
                        >
                          <td>
                            {item.material}
                          </td>

                          <td>
                            {item.usageType ||
                              "-"}
                          </td>

                          <td className="svo-number">
                            {item.quantity}
                          </td>

                          <td>
                            {item.unit}
                          </td>

                          <td className="svo-number">
                            ₹
                            {formatAmount(
                              item.rate
                            )}
                          </td>

                          <td className="svo-number">
                            ₹
                            {formatAmount(
                              item.amount
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="svo-modal-footer">
              {selected.status !==
                "Cancelled" && (
                <>
                  <button
                    type="button"
                    className="svo-danger"
                    onClick={() =>
                      beginCancel(
                        selected
                      )
                    }
                  >
                    Cancel Transaction
                  </button>

                  <button
                    type="button"
                    className="svo-primary"
                    onClick={() =>
                      openEdit(
                        selected
                      )
                    }
                  >
                    Edit
                  </button>
                </>
              )}

              <button
                type="button"
                className="svo-secondary"
                onClick={() =>
                  setSelected(null)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelReasonOpen && (
        <div className="svo-overlay">
          <div className="svo-modal small">
            <div className="svo-modal-header">
              <strong>
                Cancellation Reason
              </strong>
            </div>

            <div className="svo-modal-body">
              <Field label="Reason">
                <textarea
                  value={cancelReason}
                  onChange={(event) =>
                    setCancelReason(
                      event.target.value
                    )
                  }
                  rows="4"
                  placeholder="Enter the reason for cancelling this transaction"
                  autoFocus
                />
              </Field>
            </div>

            <div className="svo-modal-footer">
              <button
                type="button"
                className="svo-secondary"
                onClick={() => {
                  setCancelReasonOpen(
                    false
                  );

                  setCancelTarget(
                    null
                  );
                }}
              >
                Back
              </button>

              <button
                type="button"
                className="svo-danger"
                onClick={
                  continueCancel
                }
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={cancelConfirmOpen}
        title="Cancel Samvardhana Outgoing?"
        message={
          cancelTarget
            ? `Transaction ${
                cancelTarget.outgoingId
              } will be marked as Cancelled.\n\nReason: ${cancelReason}`
            : ""
        }
        confirmText={
          saving
            ? "Cancelling..."
            : "Cancel Transaction"
        }
        cancelText="Back"
        onConfirm={
          confirmCancel
        }
        onCancel={() =>
          setCancelConfirmOpen(
            false
          )
        }
      />
    </div>
  );
}


function Field({
  label,
  children,
}) {
  return (
    <div className="svo-field">
      <label>{label}</label>
      {children}
    </div>
  );
}


function SummaryCard({
  label,
  value,
}) {
  return (
    <div className="svo-card">
      <div className="svo-card-label">
        {label}
      </div>

      <div className="svo-card-value">
        {value}
      </div>
    </div>
  );
}


function StatusBadge({
  status,
}) {
  const normal =
    normalise(status);

  return (
    <span
      className={
        "svo-badge " +
        (normal === "cancelled"
          ? "cancelled"
          : "completed")
      }
    >
      {status || "Completed"}
    </span>
  );
}


function Detail({
  label,
  value,
}) {
  return (
    <div className="svo-detail">
      <div className="svo-detail-label">
        {label}
      </div>

      <div className="svo-detail-value">
        {value || "-"}
      </div>
    </div>
  );
}