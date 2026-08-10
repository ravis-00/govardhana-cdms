import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getSponsors,
  addSponsor,
  updateSponsor,
  getSponsorships,
  addSponsorship,
  updateSponsorship,
  cancelSponsorship,
  getSponsorshipPayments,
  addSponsorshipPayment,
  updateSponsorshipPayment,
 fetchCattle,
} from "../api/masterApi";
import { useAuth } from "../context/AuthContext";

const ITEMS_PER_PAGE = 20;

const SPONSORSHIP_CATEGORIES = [
  "Cattle Sponsorship",
  "Feed Sponsorship",
  "Medical Sponsorship",
  "Goushala Maintenance",
  "Infrastructure Sponsorship",
  "Occasion Sponsorship",
  "Programme Sponsorship",
  "General Donation",
];

const DURATION_TYPES = [
  "One Time",
  "Monthly",
  "Quarterly",
  "Half Yearly",
  "Annual",
  "Lifetime",
  "Custom",
];

const PAYMENT_FREQUENCIES = [
  "One Time",
  "Monthly",
  "Quarterly",
  "Half Yearly",
  "Annual",
  "As Agreed",
];

const PAYMENT_MODES = [
  "Cash",
  "Cheque",
  "UPI",
  "NEFT",
  "RTGS",
  "Bank Transfer",
  "Card",
  "Online",
  "Other",
];

const INITIAL_SPONSOR_FORM = {
  sponsorId: "",
  donorName: "",
  mobileNumber: "",
  email: "",
  address: "",
  city: "",
  state: "Karnataka",
  postalCode: "",
  country: "India",
  panNumber: "",
  preferredContact: "",
  dateOfBirth: "",
  anniversary: "",
  status: "Active",
  remarks: "",
};

const INITIAL_SPONSORSHIP_FORM = {
  sponsorshipId: "",
  sponsorId: "",
  cattleInternalId: "",
  category: "",
  schemeName: "",
  scope: "",
  startDate: "",
  endDate: "",
  durationType: "Annual",
  committedAmount: "",
  paymentFrequency: "Annual",
  status: "Active",
  cancellationReason: "",
  remarks: "",
};

const INITIAL_PAYMENT_FORM = {
  paymentId: "",
  sponsorshipId: "",
  paymentDate: getTodayInputDate(),
  amountReceived: "",
  paymentMode: "UPI",
  transactionReference: "",
  receiptNumber: "",
  receivedBy: "",
  remarks: "",
};

const INITIAL_CANCEL_FORM = {
  sponsorshipId: "",
  cancellationReason: "",
  remarks: "",
};

function getTodayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

function safeText(value) {
  return value === null || value === undefined
    ? ""
    : String(value).trim();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeApiList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

function extractApiError(response, fallbackMessage) {
  if (!response) {
    return fallbackMessage;
  }

  if (typeof response === "string") {
    return response;
  }

  return (
    response.error ||
    response.message ||
    response.data?.error ||
    response.data?.message ||
    fallbackMessage
  );
}

function toInputDate(value) {
  if (!value) {
    return "";
  }

  if (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  ) {
    return value.toISOString().slice(0, 10);
  }

  const text = safeText(value);

  if (!text) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  const ddmmyyyy = text.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/
  );

  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, "0");
    const month = ddmmyyyy[2].padStart(2, "0");
    const year = ddmmyyyy[3];

    return `${year}-${month}-${day}`;
  }

  return "";
}

function formatDisplayDate(value) {
  const normalized = toInputDate(value);

  if (!normalized) {
    return "-";
  }

  const [year, month, day] = normalized.split("-");

  return `${day}-${month}-${year}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function getUserActor(user) {
  return (
    user?.name ||
    user?.displayName ||
    user?.email ||
    user?.username ||
    "Admin"
  );
}

function getCattleInternalId(cattle) {
  return safeText(
    cattle?.internalId ||
      cattle?.internal_id ||
      cattle?.id ||
      cattle?.cattleId
  );
}

function getCattleTag(cattle) {
  return safeText(
    cattle?.tagNumber ||
      cattle?.tag_number ||
      cattle?.tag ||
      cattle?.cattleId
  );
}

function getCattleName(cattle) {
  return safeText(
    cattle?.name ||
      cattle?.cattleName ||
      cattle?.cattle_name
  );
}

function getCattleLabel(cattle) {
  const internalId = getCattleInternalId(cattle);
  const tag = getCattleTag(cattle);
  const name = getCattleName(cattle);

  return [internalId, tag, name]
    .filter(Boolean)
    .join(" — ");
}

function getStatusLabel(row) {
  return (
    safeText(row?.displayStatus) ||
    safeText(row?.status) ||
    "Active"
  );
}

function isCancelledSponsorship(row) {
  return safeText(row?.status).toLowerCase() === "cancelled";
}

function isCattleCategory(category) {
  return safeText(category).toLowerCase() ===
    "cattle sponsorship";
}

function pageSlice(rows, currentPage, pageSize = ITEMS_PER_PAGE) {
  const startIndex =
    (currentPage - 1) * pageSize;

  return rows.slice(
    startIndex,
    startIndex + pageSize
  );
}

function pageCount(rows, pageSize = ITEMS_PER_PAGE) {
  return Math.max(
    1,
    Math.ceil(rows.length / pageSize)
  );
}

export default function DattuYojana() {
  const { user } = useAuth();

  const canEdit = user?.role !== "Viewer";
  const actor = getUserActor(user);

  const [activeTab, setActiveTab] =
    useState("Sponsors");

  const [sponsors, setSponsors] = useState([]);
  const [sponsorships, setSponsorships] =
    useState([]);
  const [payments, setPayments] = useState([]);
  const [cattle, setCattle] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 640
  );
  const initialLoadStartedRef = useRef(false);
  const cattleLoadedRef = useRef(false);
  const paymentsLoadedRef = useRef(false);

  const [sponsorSearch, setSponsorSearch] =
    useState("");
  const [sponsorStatusFilter, setSponsorStatusFilter] =
    useState("All");
  const [
    sponsorContactFilter,
    setSponsorContactFilter,
  ] = useState("All");
  const [sponsorPage, setSponsorPage] = useState(1);

  const [
    sponsorshipSearch,
    setSponsorshipSearch,
  ] = useState("");
  const [
    sponsorshipStatusFilter,
    setSponsorshipStatusFilter,
  ] = useState("All");
  const [
    sponsorshipCategoryFilter,
    setSponsorshipCategoryFilter,
  ] = useState("All");
  const [sponsorshipPage, setSponsorshipPage] =
    useState(1);

  const [paymentSearch, setPaymentSearch] =
    useState("");
  const [paymentModeFilter, setPaymentModeFilter] =
    useState("All");
  const [paymentFromDate, setPaymentFromDate] =
    useState("");
  const [paymentToDate, setPaymentToDate] =
    useState("");
  const [paymentPage, setPaymentPage] = useState(1);

  const [modalType, setModalType] = useState("");
  const [selectedRecord, setSelectedRecord] =
    useState(null);
  const [editingRecord, setEditingRecord] =
    useState(null);

  const [sponsorForm, setSponsorForm] = useState({
    ...INITIAL_SPONSOR_FORM,
  });

  const [sponsorshipForm, setSponsorshipForm] =
    useState({
      ...INITIAL_SPONSORSHIP_FORM,
    });

    const [sponsorOptionSearch, setSponsorOptionSearch] =
  useState("");

const [showSponsorOptions, setShowSponsorOptions] =
  useState(false);

  const [paymentForm, setPaymentForm] = useState({
    ...INITIAL_PAYMENT_FORM,
    receivedBy: actor,
  });

  const [cancelForm, setCancelForm] = useState({
    ...INITIAL_CANCEL_FORM,
  });

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  useEffect(() => {
    if (initialLoadStartedRef.current) return;
    initialLoadStartedRef.current = true;
    loadInitialData();
  }, []);

  useEffect(() => {
    function handleResize() {
      setIsCompact(window.innerWidth <= 640);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!toast.show) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToast((previous) => ({
        ...previous,
        show: false,
      }));
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toast.show]);

  useEffect(() => {
    setSponsorPage(1);
  }, [
    sponsorSearch,
    sponsorStatusFilter,
    sponsorContactFilter,
  ]);

  useEffect(() => {
    setSponsorshipPage(1);
  }, [
    sponsorshipSearch,
    sponsorshipStatusFilter,
    sponsorshipCategoryFilter,
  ]);

  useEffect(() => {
    setPaymentPage(1);
  }, [
    paymentSearch,
    paymentModeFilter,
    paymentFromDate,
    paymentToDate,
  ]);

  async function loadInitialData() {
    setLoading(true);

    try {
      const [sponsorResponse, sponsorshipResponse] = await Promise.all([
        getSponsors(),
        getSponsorships(),
      ]);

      setSponsors(normalizeApiList(sponsorResponse));
      setSponsorships(normalizeApiList(sponsorshipResponse));
    } catch (error) {
      console.error(
        "Unable to load sponsorship management data:",
        error
      );

      showToast(
        "error",
        error?.message ||
          "Unable to load sponsorship data"
      );
    } finally {
      setLoading(false);
    }
  }

  async function ensureTabData(tabName) {
    if (tabName === "Sponsorships" && !cattleLoadedRef.current) {
      cattleLoadedRef.current = true;
      setLoading(true);
      try {
        const response = await fetchCattle();
        setCattle(normalizeApiList(response));
      } catch (error) {
        cattleLoadedRef.current = false;
        showToast("error", error?.message || "Unable to load cattle data");
      } finally {
        setLoading(false);
      }
    }

    if (tabName === "Payments" && !paymentsLoadedRef.current) {
      paymentsLoadedRef.current = true;
      setLoading(true);
      try {
        const response = await getSponsorshipPayments();
        setPayments(normalizeApiList(response));
      } catch (error) {
        paymentsLoadedRef.current = false;
        showToast("error", error?.message || "Unable to load payment data");
      } finally {
        setLoading(false);
      }
    }
  }

  async function reloadSponsors() {
    const response = await getSponsors();
    setSponsors(normalizeApiList(response));
  }

  async function reloadSponsorships() {
    const response = await getSponsorships();
    setSponsorships(normalizeApiList(response));
  }

  async function reloadPayments() {
    const response =
      await getSponsorshipPayments();

    setPayments(normalizeApiList(response));
  }

  function showToast(type, message) {
    setToast({
      show: true,
      type,
      message,
    });
  }

  function changeTab(tabName) {
    if (saving) {
      return;
    }

    setActiveTab(tabName);
    ensureTabData(tabName);
    setSelectedRecord(null);
    closeModal();
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalType("");
    setEditingRecord(null);

    setSponsorForm({
      ...INITIAL_SPONSOR_FORM,
    });

    setSponsorshipForm({
      ...INITIAL_SPONSORSHIP_FORM,
    });

    setPaymentForm({
      ...INITIAL_PAYMENT_FORM,
      receivedBy: actor,
    });

    setCancelForm({
      ...INITIAL_CANCEL_FORM,
    });

    setSponsorOptionSearch("");
setShowSponsorOptions(false);
  }

  function openAddSponsor() {
    setEditingRecord(null);

    setSponsorForm({
      ...INITIAL_SPONSOR_FORM,
    });

    setModalType("sponsor-form");
  }

  function openEditSponsor(row) {
    setEditingRecord(row);

    setSponsorForm({
      sponsorId: safeText(row.sponsorId),
      donorName: safeText(row.donorName),
      mobileNumber: safeText(row.mobileNumber),
      email: safeText(row.email),
      address: safeText(row.address),
      city: safeText(row.city),
      state: safeText(row.state) || "Karnataka",
      postalCode: safeText(row.postalCode),
      country: safeText(row.country) || "India",
      panNumber: safeText(row.panNumber),
      preferredContact: safeText(
        row.preferredContact
      ),
      dateOfBirth: toInputDate(row.dateOfBirth),
      anniversary: toInputDate(row.anniversary),
      status: safeText(row.status) || "Active",
      remarks: safeText(row.remarks),
    });

    setSelectedRecord(null);
    setModalType("sponsor-form");
  }

  function openAddSponsorship() {
    if (sponsors.length === 0) {
      showToast(
        "error",
        "Add at least one sponsor before creating a sponsorship"
      );

      return;
    }

    setEditingRecord(null);

    setSponsorshipForm({
      ...INITIAL_SPONSORSHIP_FORM,
      startDate: getTodayInputDate(),
    });
setSponsorOptionSearch("");
setShowSponsorOptions(false);
    setModalType("sponsorship-form");
  }

  function openEditSponsorship(row) {
    setEditingRecord(row);

    setSponsorshipForm({
      sponsorshipId: safeText(
        row.sponsorshipId
      ),
      sponsorId: safeText(row.sponsorId),
      cattleInternalId: safeText(
        row.cattleInternalId
      ),
      category: safeText(row.category),
      schemeName: safeText(row.schemeName),
      scope: safeText(row.scope),
      startDate: toInputDate(row.startDate),
      endDate: toInputDate(row.endDate),
      durationType:
        safeText(row.durationType) || "Annual",
      committedAmount:
        row.committedAmount === null ||
        row.committedAmount === undefined
          ? ""
          : String(row.committedAmount),
      paymentFrequency:
        safeText(row.paymentFrequency) || "Annual",
      status: safeText(row.status) || "Active",
      cancellationReason: safeText(
        row.cancellationReason
      ),
      remarks: safeText(row.remarks),
    });
setSponsorOptionSearch(
  `${safeText(row.donorName)} ${safeText(
    row.sponsorId
  )}`.trim()
);

setShowSponsorOptions(false);
    setSelectedRecord(null);
    setModalType("sponsorship-form");
  }

  function openCancelSponsorship(row) {
    setEditingRecord(row);

    setCancelForm({
      sponsorshipId: safeText(
        row.sponsorshipId
      ),
      cancellationReason: "",
      remarks: safeText(row.remarks),
    });

    setSelectedRecord(null);
    setModalType("cancel-sponsorship");
  }

  function openAddPayment(defaultSponsorship = null) {
    const availableSponsorships =
      sponsorships.filter(
        (row) => !isCancelledSponsorship(row)
      );

    if (availableSponsorships.length === 0) {
      showToast(
        "error",
        "No active sponsorship is available for payment"
      );

      return;
    }

    setEditingRecord(null);

    setPaymentForm({
      ...INITIAL_PAYMENT_FORM,
      sponsorshipId:
        defaultSponsorship?.sponsorshipId || "",
      receivedBy: actor,
    });

    setSelectedRecord(null);
    setModalType("payment-form");
  }

  function openEditPayment(row) {
    setEditingRecord(row);

    setPaymentForm({
      paymentId: safeText(row.paymentId),
      sponsorshipId: safeText(
        row.sponsorshipId
      ),
      paymentDate: toInputDate(
        row.paymentDate
      ),
      amountReceived:
        row.amountReceived === null ||
        row.amountReceived === undefined
          ? ""
          : String(row.amountReceived),
      paymentMode:
        safeText(row.paymentMode) || "UPI",
      transactionReference: safeText(
        row.transactionReference
      ),
      receiptNumber: safeText(
        row.receiptNumber
      ),
      receivedBy:
        safeText(row.receivedBy) || actor,
      remarks: safeText(row.remarks),
    });

    setSelectedRecord(null);
    setModalType("payment-form");
  }

  function handleSponsorFormChange(event) {
    const { name, value } = event.target;

    setSponsorForm((previous) => ({
      ...previous,
      [name]:
        name === "panNumber"
          ? value.toUpperCase()
          : value,
    }));
  }

  function handleSponsorshipFormChange(event) {
    const { name, value } = event.target;

    setSponsorshipForm((previous) => {
      const next = {
        ...previous,
        [name]: value,
      };

      if (
        name === "category" &&
        !isCattleCategory(value)
      ) {
        next.cattleInternalId = "";
      }

      if (
        name === "durationType" &&
        (value === "One Time" ||
          value === "Lifetime")
      ) {
        next.endDate = "";
      }

      return next;
    });
  }

  function handlePaymentFormChange(event) {
    const { name, value } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleCancelFormChange(event) {
    const { name, value } = event.target;

    setCancelForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function validateSponsorForm() {
    if (!sponsorForm.donorName.trim()) {
      return "Sponsor name is required";
    }

    const mobileDigits =
      sponsorForm.mobileNumber.replace(/\D/g, "");

    if (
      sponsorForm.mobileNumber &&
      (mobileDigits.length < 10 ||
        mobileDigits.length > 15)
    ) {
      return "Mobile number must contain between 10 and 15 digits";
    }

    if (
      sponsorForm.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        sponsorForm.email.trim()
      )
    ) {
      return "Enter a valid email address";
    }

    if (
      sponsorForm.panNumber &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
        sponsorForm.panNumber.trim()
      )
    ) {
      return "PAN number must be in the format ABCDE1234F";
    }

    return "";
  }

  function validateSponsorshipForm() {
    if (!sponsorshipForm.sponsorId) {
      return "Sponsor is required";
    }

    if (!sponsorshipForm.category) {
      return "Sponsorship category is required";
    }

    if (
      isCattleCategory(
        sponsorshipForm.category
      ) &&
      !sponsorshipForm.cattleInternalId
    ) {
      return "Select cattle for cattle sponsorship";
    }

    if (!sponsorshipForm.schemeName.trim()) {
      return "Scheme name is required";
    }

    if (!sponsorshipForm.startDate) {
      return "Start date is required";
    }

    if (
      sponsorshipForm.durationType !==
        "One Time" &&
      sponsorshipForm.durationType !==
        "Lifetime" &&
      !sponsorshipForm.endDate
    ) {
      return "End date is required for this duration";
    }

    if (
      sponsorshipForm.endDate &&
      sponsorshipForm.endDate <
        sponsorshipForm.startDate
    ) {
      return "End date cannot be earlier than start date";
    }

    if (
      !sponsorshipForm.committedAmount ||
      toNumber(
        sponsorshipForm.committedAmount
      ) <= 0
    ) {
      return "Committed amount must be greater than zero";
    }

    if (!sponsorshipForm.paymentFrequency) {
      return "Payment frequency is required";
    }

    return "";
  }

  function validatePaymentForm() {
    if (!paymentForm.sponsorshipId) {
      return "Sponsorship is required";
    }

    if (!paymentForm.paymentDate) {
      return "Payment date is required";
    }

    if (
      !paymentForm.amountReceived ||
      toNumber(paymentForm.amountReceived) <= 0
    ) {
      return "Amount received must be greater than zero";
    }

    if (!paymentForm.paymentMode) {
      return "Payment mode is required";
    }

    return "";
  }

  async function submitSponsor(event) {
    event.preventDefault();

    const validationMessage =
      validateSponsorForm();

    if (validationMessage) {
      showToast("error", validationMessage);
      return;
    }

    const payload = {
      sponsorId: sponsorForm.sponsorId,
      donorName:
        sponsorForm.donorName.trim(),
      mobileNumber:
        sponsorForm.mobileNumber.trim(),
      email:
        sponsorForm.email.trim().toLowerCase(),
      address: sponsorForm.address.trim(),
      city: sponsorForm.city.trim(),
      state: sponsorForm.state.trim(),
      postalCode:
        sponsorForm.postalCode.trim(),
      country: sponsorForm.country.trim(),
      panNumber:
        sponsorForm.panNumber
          .trim()
          .toUpperCase(),
      preferredContact:
        sponsorForm.preferredContact,
      dateOfBirth: sponsorForm.dateOfBirth,
      anniversary: sponsorForm.anniversary,
      status: sponsorForm.status,
      remarks: sponsorForm.remarks.trim(),
    };

    if (editingRecord) {
      payload.updatedBy = actor;
    } else {
      payload.createdBy = actor;
    }

    setSaving(true);

    try {
      const response = editingRecord
        ? await updateSponsor(payload)
        : await addSponsor(payload);

      if (response?.success === false) {
        throw new Error(
          extractApiError(
            response,
            "Unable to save sponsor"
          )
        );
      }

      await reloadSponsors();

      showToast(
        "success",
        editingRecord
          ? "Sponsor updated successfully"
          : "Sponsor added successfully"
      );

      setModalType("");
      setEditingRecord(null);
    } catch (error) {
      console.error("Sponsor save failed:", error);

      showToast(
        "error",
        error?.message ||
          "Unable to save sponsor"
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitSponsorship(event) {
  event.preventDefault();

  const validationMessage =
    validateSponsorshipForm();

  if (validationMessage) {
    showToast("error", validationMessage);
    return;
  }

  const isEditing = Boolean(editingRecord);

  const payload = {
    sponsorshipId:
      sponsorshipForm.sponsorshipId,
    sponsorId: sponsorshipForm.sponsorId,
    cattleInternalId:
      sponsorshipForm.cattleInternalId,
    category: sponsorshipForm.category,
    schemeName:
      sponsorshipForm.schemeName.trim(),
    scope: sponsorshipForm.scope.trim(),
    startDate: sponsorshipForm.startDate,
    endDate: sponsorshipForm.endDate,
    durationType:
      sponsorshipForm.durationType,
    committedAmount: toNumber(
      sponsorshipForm.committedAmount
    ),
    paymentFrequency:
      sponsorshipForm.paymentFrequency,
    status: sponsorshipForm.status,
    remarks: sponsorshipForm.remarks.trim(),
  };

  if (isEditing) {
    payload.updatedBy = actor;
  } else {
    payload.createdBy = actor;
  }

  setSaving(true);

  try {
    const response = isEditing
      ? await updateSponsorship(payload)
      : await addSponsorship(payload);

    if (response?.success === false) {
      throw new Error(
        extractApiError(
          response,
          "Unable to save sponsorship"
        )
      );
    }

    setModalType("");
    setEditingRecord(null);

    showToast(
      "success",
      isEditing
        ? "Sponsorship updated successfully"
        : "Sponsorship added successfully"
    );

    try {
      await reloadSponsorships();
    } catch (reloadError) {
      console.error(
        "Sponsorship saved, but refresh failed:",
        reloadError
      );

      showToast(
        "error",
        "Sponsorship was saved, but the list could not be refreshed. Refresh the page."
      );
    }
  } catch (error) {
    console.error(
      "Sponsorship save failed:",
      error
    );

    showToast(
      "error",
      error?.name === "AbortError"
        ? "The update took too long. Please check the sheet before trying again."
        : error?.message ||
            "Unable to save sponsorship"
    );
  } finally {
    setSaving(false);
  }
}

  async function submitPayment(event) {
    event.preventDefault();

    const validationMessage =
      validatePaymentForm();

    if (validationMessage) {
      showToast("error", validationMessage);
      return;
    }

    const payload = {
      paymentId: paymentForm.paymentId,
      sponsorshipId:
        paymentForm.sponsorshipId,
      paymentDate: paymentForm.paymentDate,
      amountReceived: toNumber(
        paymentForm.amountReceived
      ),
      paymentMode: paymentForm.paymentMode,
      transactionReference:
        paymentForm.transactionReference.trim(),
      receiptNumber:
        paymentForm.receiptNumber.trim(),
      receivedBy:
        paymentForm.receivedBy.trim() ||
        actor,
      remarks: paymentForm.remarks.trim(),
    };

    if (!editingRecord) {
      payload.createdBy = actor;
    }

    setSaving(true);

    try {
      const response = editingRecord
        ? await updateSponsorshipPayment(
            payload
          )
        : await addSponsorshipPayment(
            payload
          );

      if (response?.success === false) {
        throw new Error(
          extractApiError(
            response,
            "Unable to save payment"
          )
        );
      }

      await reloadPayments();

      showToast(
        "success",
        editingRecord
          ? "Payment updated successfully"
          : "Payment recorded successfully"
      );

      setModalType("");
      setEditingRecord(null);
    } catch (error) {
      console.error("Payment save failed:", error);

      showToast(
        "error",
        error?.message ||
          "Unable to save payment"
      );
    } finally {
      setSaving(false);
    }
  }

  const sponsorLookup = useMemo(() => {
  return sponsors.reduce((lookup, row) => {
    const sponsorId = safeText(row.sponsorId);

    if (sponsorId) {
      lookup[sponsorId] = row;
    }

    return lookup;
  }, {});
}, [sponsors]);

const filteredSponsorOptions = useMemo(() => {
  const search =
    sponsorOptionSearch.trim().toLowerCase();

  return sponsors
    .filter((row) => {
      const sponsorId = safeText(row.sponsorId);

      const isActive =
        safeText(row.status).toLowerCase() ===
        "active";

      const isCurrentSelection =
        sponsorId ===
        sponsorshipForm.sponsorId;

      if (!isActive && !isCurrentSelection) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        row.sponsorId,
        row.donorName,
        row.mobileNumber,
        row.email,
        row.city,
      ]
        .map(safeText)
        .join(" ")
        .toLowerCase()
        .includes(search);
    })
    .slice(0, 20);
}, [
  sponsors,
  sponsorOptionSearch,
  sponsorshipForm.sponsorId,
]);

const sponsorSummary = useMemo(() => {
  const sponsorCommitments = {};

  sponsorships.forEach((row) => {
    const sponsorId = safeText(row.sponsorId);

    const sponsorIsActive =
      safeText(
        sponsorLookup[sponsorId]?.status
      ).toLowerCase() === "active";

    const sponsorshipIsActive =
      getStatusLabel(row).toLowerCase() ===
      "active";

    if (
      sponsorId &&
      sponsorIsActive &&
      sponsorshipIsActive
    ) {
      sponsorCommitments[sponsorId] =
        (sponsorCommitments[sponsorId] || 0) +
        toNumber(row.committedAmount);
    }
  });

  return sponsors.reduce(
    (result, row) => {
      result.total += 1;

      if (
        safeText(row.status).toLowerCase() ===
        "active"
      ) {
        result.active += 1;
      } else {
        result.inactive += 1;
      }

      const totalCommitment =
        sponsorCommitments[
          safeText(row.sponsorId)
        ] || 0;

      if (totalCommitment >= 50000) {
        result.highValueSponsors += 1;
      }

      return result;
    },
    {
      total: 0,
      active: 0,
      inactive: 0,
      highValueSponsors: 0,
    }
  );
}, [
  sponsors,
  sponsorships,
  sponsorLookup,
]);

  const cattleLookup = useMemo(() => {
    return cattle.reduce((lookup, row) => {
      const internalId =
        getCattleInternalId(row);

      if (internalId) {
        lookup[internalId] = row;
      }

      return lookup;
    }, {});
  }, [cattle]);

  const paymentTotalsBySponsorship =
    useMemo(() => {
      return payments.reduce((lookup, row) => {
        const sponsorshipId =
          safeText(row.sponsorshipId);

        if (!sponsorshipId) {
          return lookup;
        }

        lookup[sponsorshipId] =
          toNumber(lookup[sponsorshipId]) +
          toNumber(row.amountReceived);

        return lookup;
      }, {});
    }, [payments]);

  

const sponsorshipSummary = useMemo(() => {
  return sponsorships.reduce(
    (result, row) => {
      result.total += 1;

      const status = getStatusLabel(row).toLowerCase();

      if (status === "active") {
        result.active += 1;

        // Count only Active commitment
        result.activeCommitted += toNumber(
          row.committedAmount
        );
      }

      if (status === "expiring soon") {
        result.expiringSoon += 1;
      }

      if (
        status === "expired" ||
        status === "cancelled"
      ) {
        result.closed += 1;
      }

      return result;
    },
    {
      total: 0,
      active: 0,
      expiringSoon: 0,
      closed: 0,
      activeCommitted: 0,
    }
  );
}, [sponsorships]);

  const paymentSummary = useMemo(() => {
    return payments.reduce(
      (result, row) => {
        result.totalEntries += 1;
        result.received += toNumber(
          row.amountReceived
        );

        if (
          toInputDate(row.paymentDate) ===
          getTodayInputDate()
        ) {
          result.receivedToday += toNumber(
            row.amountReceived
          );
        }

        return result;
      },
      {
        totalEntries: 0,
        received: 0,
        receivedToday: 0,
      }
    );
  }, [payments]);

  const totalOutstanding = useMemo(() => {
    return sponsorships.reduce(
      (total, row) => {
        if (isCancelledSponsorship(row)) {
          return total;
        }

        const committed = toNumber(
          row.committedAmount
        );

        const paid = toNumber(
          paymentTotalsBySponsorship[
            row.sponsorshipId
          ]
        );

        return total + Math.max(0, committed - paid);
      },
      0
    );
  }, [
    sponsorships,
    paymentTotalsBySponsorship,
  ]);

  const filteredSponsors = useMemo(() => {
    const search =
      sponsorSearch.trim().toLowerCase();

    return sponsors.filter((row) => {
      const status =
        safeText(row.status).toLowerCase() ||
        "active";

      if (
        sponsorStatusFilter !== "All" &&
        status !==
          sponsorStatusFilter.toLowerCase()
      ) {
        return false;
      }

      const preferredContact = safeText(
        row.preferredContact
      ).toLowerCase();

      if (
        sponsorContactFilter !== "All" &&
        preferredContact !==
          sponsorContactFilter.toLowerCase()
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        row.sponsorId,
        row.donorName,
        row.mobileNumber,
        row.email,
        row.city,
        row.state,
        row.panNumber,
      ]
        .map(safeText)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [
    sponsors,
    sponsorSearch,
    sponsorStatusFilter,
    sponsorContactFilter,
  ]);

  const filteredSponsorships = useMemo(() => {
    const search =
      sponsorshipSearch.trim().toLowerCase();

    return sponsorships.filter((row) => {
      const status =
        getStatusLabel(row).toLowerCase();

      if (
        sponsorshipStatusFilter !== "All" &&
        status !==
          sponsorshipStatusFilter.toLowerCase()
      ) {
        return false;
      }

      if (
        sponsorshipCategoryFilter !== "All" &&
        safeText(row.category) !==
          sponsorshipCategoryFilter
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        row.sponsorshipId,
        row.sponsorId,
        row.donorName,
        row.category,
        row.schemeName,
        row.cattleInternalId,
        row.scope,
      ]
        .map(safeText)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [
    sponsorships,
    sponsorshipSearch,
    sponsorshipStatusFilter,
    sponsorshipCategoryFilter,
  ]);

  const filteredPayments = useMemo(() => {
    const search =
      paymentSearch.trim().toLowerCase();

    return payments.filter((row) => {
      if (
        paymentModeFilter !== "All" &&
        safeText(row.paymentMode) !==
          paymentModeFilter
      ) {
        return false;
      }

      const paymentDate =
        toInputDate(row.paymentDate);

      if (
        paymentFromDate &&
        paymentDate &&
        paymentDate < paymentFromDate
      ) {
        return false;
      }

      if (
        paymentToDate &&
        paymentDate &&
        paymentDate > paymentToDate
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        row.paymentId,
        row.sponsorshipId,
        row.sponsorId,
        row.donorName,
        row.schemeName,
        row.paymentMode,
        row.receiptNumber,
        row.transactionReference,
        row.receivedBy,
      ]
        .map(safeText)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [
    payments,
    paymentSearch,
    paymentModeFilter,
    paymentFromDate,
    paymentToDate,
  ]);

  const pageSize = isCompact ? 10 : ITEMS_PER_PAGE;

  const sponsorTotalPages =
    pageCount(filteredSponsors, pageSize);

  const sponsorshipTotalPages =
    pageCount(filteredSponsorships, pageSize);

  const paymentTotalPages =
    pageCount(filteredPayments, pageSize);

  const displayedSponsors = useMemo(
    () => pageSlice(filteredSponsors, sponsorPage, pageSize),
    [filteredSponsors, sponsorPage, pageSize]
  );

  const displayedSponsorships = useMemo(
    () =>
      pageSlice(
        filteredSponsorships,
        sponsorshipPage,
        pageSize
      ),
    [filteredSponsorships, sponsorshipPage, pageSize]
  );

  const displayedPayments = useMemo(
    () => pageSlice(filteredPayments, paymentPage, pageSize),
    [filteredPayments, paymentPage, pageSize]
  );

  useEffect(() => {
    setSponsorPage(1);
    setSponsorshipPage(1);
    setPaymentPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (sponsorPage > sponsorTotalPages) {
      setSponsorPage(sponsorTotalPages);
    }
  }, [sponsorPage, sponsorTotalPages]);

  useEffect(() => {
    if (
      sponsorshipPage >
      sponsorshipTotalPages
    ) {
      setSponsorshipPage(
        sponsorshipTotalPages
      );
    }
  }, [
    sponsorshipPage,
    sponsorshipTotalPages,
  ]);

  useEffect(() => {
    if (paymentPage > paymentTotalPages) {
      setPaymentPage(paymentTotalPages);
    }
  }, [paymentPage, paymentTotalPages]);

  const activeSponsorshipOptions = useMemo(
    () =>
      sponsorships.filter(
        (row) => !isCancelledSponsorship(row)
      ),
    [sponsorships]
  );

  function clearSponsorFilters() {
    setSponsorSearch("");
    setSponsorStatusFilter("All");
    setSponsorContactFilter("All");
  }

  function clearSponsorshipFilters() {
    setSponsorshipSearch("");
    setSponsorshipStatusFilter("All");
    setSponsorshipCategoryFilter("All");
  }

  function clearPaymentFilters() {
    setPaymentSearch("");
    setPaymentModeFilter("All");
    setPaymentFromDate("");
    setPaymentToDate("");
  }

  const sponsorFiltersActive =
    Boolean(sponsorSearch) ||
    sponsorStatusFilter !== "All" ||
    sponsorContactFilter !== "All";

  const sponsorshipFiltersActive =
    Boolean(sponsorshipSearch) ||
    sponsorshipStatusFilter !== "All" ||
    sponsorshipCategoryFilter !== "All";

  const paymentFiltersActive =
    Boolean(paymentSearch) ||
    paymentModeFilter !== "All" ||
    Boolean(paymentFromDate) ||
    Boolean(paymentToDate);

  // PART 2 STARTS WITH THE MAIN return (...) BLOCK.
    return (
  <div className="sponsorship-page">
    <style>{`
      .sponsorship-page {
        width: 100%;
        max-width: 1440px;
        min-width: 0;
        margin: 0 auto;
      }

      .sponsorship-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1.125rem;
      }

      .sponsorship-tabs {
        display: flex;
        gap: 0.375rem;
        width: fit-content;
        max-width: 100%;
        margin-bottom: 1.125rem;
        padding: 0.3125rem;
        overflow-x: auto;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
      }

      .sponsorship-metrics {
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 0.875rem;
        margin-bottom: 1.125rem;
      }

      .sponsorship-filter-grid {
        display: grid;
        grid-template-columns:
          minmax(220px, 2fr)
          repeat(2, minmax(160px, 1fr));
        gap: 0.75rem;
      }

      .sponsorship-payment-filter-grid {
        display: grid;
        grid-template-columns:
          minmax(220px, 2fr)
          repeat(3, minmax(150px, 1fr));
        gap: 0.75rem;
      }

      .sponsorship-table-hint {
        display: none;
        padding: 0.65rem 1rem;
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
        color: #64748b;
        font-size: 0.76rem;
        text-align: center;
      }

      .sponsorship-form-grid {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 0.875rem;
      }

      @media (max-width: 1024px) {
        .sponsorship-metrics {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .sponsorship-filter-grid,
        .sponsorship-payment-filter-grid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 640px) {
        .sponsorship-header {
          flex-direction: column;
          align-items: stretch;
        }

        .sponsorship-header-actions {
          width: 100%;
        }

        .sponsorship-header-actions button {
          width: 100%;
          min-height: 44px;
        }

        .sponsorship-tabs {
          width: 100%;
          box-sizing: border-box;
        }

        .sponsorship-tabs button {
          flex: 1 0 auto;
          min-height: 44px;
          padding-inline: 0.85rem !important;
        }

        .sponsorship-metrics {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .sponsorship-filter-grid,
        .sponsorship-payment-filter-grid {
          grid-template-columns:
            minmax(0, 1fr);
        }

        .sponsorship-table-hint {
          display: block;
        }

        .sponsorship-form-grid {
          grid-template-columns:
            minmax(0, 1fr);
        }

        .responsive-register {
          display: block;
          width: 100%;
          min-width: 0 !important;
          border-collapse: separate !important;
        }

        .responsive-register thead {
          display: none;
        }

        .responsive-register tbody {
          display: grid;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f8fafc;
        }

        .responsive-register tbody tr {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.7rem 0.85rem;
          padding: 0.85rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff !important;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
        }

        .responsive-register tbody tr::after {
          content: "Tap to view details";
          grid-column: 1 / -1;
          padding-top: 0.6rem;
          border-top: 1px solid #e2e8f0;
          color: #ea580c;
          font-size: 0.72rem;
          font-weight: 700;
          text-align: right;
        }

        .responsive-register tbody tr:has(td[colspan])::after {
          display: none;
        }

        .responsive-register td {
          display: block;
          min-width: 0;
          padding: 0 !important;
          border: 0 !important;
          white-space: normal !important;
          overflow-wrap: anywhere;
          font-size: 0.8rem;
        }

        .responsive-register td::before {
          display: block;
          margin-bottom: 0.18rem;
          color: #64748b;
          font-size: 0.62rem;
          font-weight: 750;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .responsive-register td[colspan] {
          grid-column: 1 / -1;
          padding: 2rem 0.75rem !important;
          text-align: center;
        }

        .responsive-register td[colspan]::before {
          display: none;
        }

        .sponsor-register td:nth-child(1)::before { content: "Sponsor ID"; }
        .sponsor-register td:nth-child(2)::before { content: "Sponsor"; }
        .sponsor-register td:nth-child(3)::before { content: "Contact"; }
        .sponsor-register td:nth-child(4)::before { content: "Location"; }
        .sponsor-register td:nth-child(5)::before { content: "Preferred Contact"; }
        .sponsor-register td:nth-child(6)::before { content: "Status"; }

        .sponsorship-register td:nth-child(1)::before { content: "Sponsorship ID"; }
        .sponsorship-register td:nth-child(2)::before { content: "Sponsor"; }
        .sponsorship-register td:nth-child(3)::before { content: "Category"; }
        .sponsorship-register td:nth-child(4)::before { content: "Scheme"; }
        .sponsorship-register td:nth-child(5)::before { content: "Period"; }
        .sponsorship-register td:nth-child(6)::before { content: "Committed"; }
        .sponsorship-register td:nth-child(7)::before { content: "Received"; }
        .sponsorship-register td:nth-child(8)::before { content: "Balance"; }
        .sponsorship-register td:nth-child(9)::before { content: "Status"; }

        .payment-register td:nth-child(1)::before { content: "Payment ID"; }
        .payment-register td:nth-child(2)::before { content: "Date"; }
        .payment-register td:nth-child(3)::before { content: "Sponsor"; }
        .payment-register td:nth-child(4)::before { content: "Sponsorship"; }
        .payment-register td:nth-child(5)::before { content: "Amount"; }
        .payment-register td:nth-child(6)::before { content: "Mode"; }
        .payment-register td:nth-child(7)::before { content: "Receipt"; }
        .payment-register td:nth-child(8)::before { content: "Reference"; }
        .payment-register td:nth-child(9)::before { content: "Received By"; }
      }

      @media (max-width: 380px) {
        .sponsorship-metrics {
          grid-template-columns:
            minmax(0, 1fr);
        }
      }
    `}</style>
      {toast.show && (
        <div
  className="sponsorship-toast"
  style={{
    ...toastStyle,
            ...(toast.type === "success"
              ? successToastStyle
              : errorToastStyle),
          }}
        >
          {toast.message}
        </div>
      )}

      <div className="sponsorship-header-actions">
        <div>
          <h1 style={pageTitleStyle}>
            Sponsorship Management
          </h1>

          <p style={pageSubtitleStyle}>
            Manage sponsors, sponsorship agreements and
            payment receipts
          </p>
        </div>

        {canEdit && (
          <div style={headerActionsStyle}>
            {activeTab === "Sponsors" && (
              <button
                type="button"
                onClick={openAddSponsor}
                style={primaryButtonStyle}
              >
                + Add Sponsor
              </button>
            )}

            {activeTab === "Sponsorships" && (
              <button
                type="button"
                onClick={openAddSponsorship}
                style={primaryButtonStyle}
              >
                + Add Sponsorship
              </button>
            )}

            {activeTab === "Payments" && (
              <button
                type="button"
                onClick={() => openAddPayment()}
                style={primaryButtonStyle}
              >
                + Record Payment
              </button>
            )}
          </div>
        )}
      </div>

      <div className="sponsorship-tabs">
        {["Sponsors", "Sponsorships", "Payments"].map(
          (tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => changeTab(tab)}
              style={{
                ...tabButtonStyle,
                ...(activeTab === tab
                  ? activeTabButtonStyle
                  : {}),
              }}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {activeTab === "Sponsors" && (
        <>
          <div className="sponsorship-metrics">
            <MetricCard
              label="Total Sponsors"
              value={sponsorSummary.total}
              helper="All sponsor profiles"
            />

            <MetricCard
              label="Active"
              value={sponsorSummary.active}
              helper="Currently active"
            />

            <MetricCard
              label="Inactive"
              value={sponsorSummary.inactive}
              helper="Inactive profiles"
            />

            <MetricCard
  label="High Value Sponsors"
  value={sponsorSummary.highValueSponsors}
  helper="₹50,000+ total commitment"
/>
          </div>

          <div style={filterPanelStyle}>
            <div style={filterHeaderStyle}>
              <div>
                <div style={filterTitleStyle}>
                  Search & Filters
                </div>

                <div style={filterSubtitleStyle}>
                  Search by sponsor name, ID, mobile,
                  email, city or PAN
                </div>
              </div>

              {sponsorFiltersActive && (
                <button
                  type="button"
                  onClick={clearSponsorFilters}
                  style={clearButtonStyle}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="sponsorship-filter-grid">
              <Field label="Search">
                <input
                  type="text"
                  value={sponsorSearch}
                  onChange={(event) =>
                    setSponsorSearch(event.target.value)
                  }
                  placeholder="Search sponsor..."
                  style={inputStyle}
                />
              </Field>

              <Field label="Status">
                <select
                  value={sponsorStatusFilter}
                  onChange={(event) =>
                    setSponsorStatusFilter(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="All">
                    All Status
                  </option>
                  <option value="Active">
                    Active
                  </option>
                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </Field>

              <Field label="Preferred Contact">
                <select
                  value={sponsorContactFilter}
                  onChange={(event) =>
                    setSponsorContactFilter(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="All">
                    All Contact Methods
                  </option>
                  <option value="Mobile">
                    Mobile
                  </option>
                  <option value="Phone">
                    Phone Call
                  </option>
                  <option value="WhatsApp">
                    WhatsApp
                  </option>
                  <option value="Email">
                    Email
                  </option>
                </select>
              </Field>
            </div>
          </div>

          <div style={tableCardStyle}>
            <div style={tableHeaderStyle}>
              <div>
                <div style={tableTitleStyle}>
                  Sponsor Register
                </div>

                <div style={tableSubtitleStyle}>
                  Showing {filteredSponsors.length} of{" "}
                  {sponsors.length} sponsors
                </div>
              </div>
            </div>

<div className="sponsorship-table-hint">
  Tap a card to view complete details
</div>

            <div style={tableScrollStyle}>
              <table className="responsive-register sponsor-register" style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Sponsor ID</th>
                    <th style={thStyle}>Sponsor</th>
                    <th style={thStyle}>Contact</th>
                    <th style={thStyle}>Location</th>
                    <th style={thStyle}>
                      Preferred Contact
                    </th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={emptyStateStyle}
                      >
                        Loading sponsors...
                      </td>
                    </tr>
                  ) : displayedSponsors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={emptyStateStyle}
                      >
                        No sponsors found.
                      </td>
                    </tr>
                  ) : (
                    displayedSponsors.map((row) => (
                      <tr
                        key={row.sponsorId}
                        onClick={() =>
                          setSelectedRecord({
                            type: "sponsor",
                            data: row,
                          })
                        }
                        style={clickableRowStyle}
                      >
                        <td style={tdStyle}>
                          <span style={idTextStyle}>
                            {row.sponsorId || "-"}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={primaryCellTextStyle}
                          >
                            {row.donorName || "-"}
                          </div>

                          {row.panNumber && (
                            <div
                              style={
                                secondaryCellTextStyle
                              }
                            >
                              PAN: {row.panNumber}
                            </div>
                          )}
                        </td>

                        <td style={tdStyle}>
                          <div>
                            {row.mobileNumber || "-"}
                          </div>

                          {row.email && (
                            <div
                              style={
                                secondaryCellTextStyle
                              }
                            >
                              {row.email}
                            </div>
                          )}
                        </td>

                        <td style={tdStyle}>
                          <div>
                            {[row.city, row.state]
                              .filter(Boolean)
                              .join(", ") || "-"}
                          </div>

                          {row.postalCode && (
                            <div
                              style={
                                secondaryCellTextStyle
                              }
                            >
                              {row.postalCode}
                            </div>
                          )}
                        </td>

                        <td style={tdStyle}>
                          {row.preferredContact || "-"}
                        </td>

                        <td style={tdStyle}>
                          <StatusBadge
                            status={
                              row.status || "Active"
                            }
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={sponsorPage}
              totalPages={sponsorTotalPages}
              onPrevious={() =>
                setSponsorPage((page) =>
                  Math.max(1, page - 1)
                )
              }
              onNext={() =>
                setSponsorPage((page) =>
                  Math.min(
                    sponsorTotalPages,
                    page + 1
                  )
                )
              }
            />
          </div>
        </>
      )}

      {activeTab === "Sponsorships" && (
        <>
          <div className="sponsorship-metrics">
            <MetricCard
              label="Total Sponsorships"
              value={sponsorshipSummary.total}
              helper="All agreements"
            />

            <MetricCard
              label="Active"
              value={sponsorshipSummary.active}
              helper="Currently active"
            />

            <MetricCard
              label="Expiring Soon"
              value={
                sponsorshipSummary.expiringSoon
              }
              helper="Ending within 30 days"
            />

            <MetricCard
            
  label="Active Commitment"
  value={formatCurrency(
    sponsorshipSummary.activeCommitted
  )}
  helper="Current active commitment"
  compact
/>
          </div>

          <div style={filterPanelStyle}>
            <div style={filterHeaderStyle}>
              <div>
                <div style={filterTitleStyle}>
                  Search & Filters
                </div>

                <div style={filterSubtitleStyle}>
                  Search by sponsor, agreement, scheme,
                  category or cattle
                </div>
              </div>

              {sponsorshipFiltersActive && (
                <button
                  type="button"
                  onClick={clearSponsorshipFilters}
                  style={clearButtonStyle}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="sponsorship-filter-grid">
              <Field label="Search">
                <input
                  type="text"
                  value={sponsorshipSearch}
                  onChange={(event) =>
                    setSponsorshipSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search sponsorship..."
                  style={inputStyle}
                />
              </Field>

              <Field label="Display Status">
                <select
                  value={sponsorshipStatusFilter}
                  onChange={(event) =>
                    setSponsorshipStatusFilter(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="All">
                    All Status
                  </option>
                  <option value="Upcoming">
                    Upcoming
                  </option>
                  <option value="Active">
                    Active
                  </option>
                  <option value="Expiring Soon">
                    Expiring Soon
                  </option>
                  <option value="Expired">
                    Expired
                  </option>
                  <option value="Cancelled">
                    Cancelled
                  </option>
                </select>
              </Field>

              <Field label="Category">
                <select
                  value={sponsorshipCategoryFilter}
                  onChange={(event) =>
                    setSponsorshipCategoryFilter(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="All">
                    All Categories
                  </option>

                  {SPONSORSHIP_CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </Field>
            </div>
          </div>

          <div style={tableCardStyle}>
            <div style={tableHeaderStyle}>
              <div>
                <div style={tableTitleStyle}>
                  Sponsorship Register
                </div>

                <div style={tableSubtitleStyle}>
                  Showing{" "}
                  {filteredSponsorships.length} of{" "}
                  {sponsorships.length} sponsorships
                </div>
              </div>
            </div>

<div className="sponsorship-table-hint">
  Tap a card to view complete details
</div>

            <div style={tableScrollStyle}>
              <table
                className="responsive-register sponsorship-register"
                style={{
                  ...tableStyle,
                  minWidth: "1150px",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>
                      Sponsorship ID
                    </th>
                    <th style={thStyle}>Sponsor</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Scheme</th>
                    <th style={thStyle}>Period</th>
                    <th style={thStyle}>Committed</th>
                    <th style={thStyle}>Received</th>
                    <th style={thStyle}>Balance</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={emptyStateStyle}
                      >
                        Loading sponsorships...
                      </td>
                    </tr>
                  ) : displayedSponsorships.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={emptyStateStyle}
                      >
                        No sponsorships found.
                      </td>
                    </tr>
                  ) : (
                    displayedSponsorships.map(
                      (row) => {
                        const paidAmount = toNumber(
                          paymentTotalsBySponsorship[
                            row.sponsorshipId
                          ]
                        );

                        const balanceAmount = Math.max(
                          0,
                          toNumber(
                            row.committedAmount
                          ) - paidAmount
                        );

                        return (
                          <tr
                            key={row.sponsorshipId}
                            onClick={() =>
                              setSelectedRecord({
                                type: "sponsorship",
                                data: row,
                              })
                            }
                            style={clickableRowStyle}
                          >
                            <td style={tdStyle}>
                              <span style={idTextStyle}>
                                {row.sponsorshipId ||
                                  "-"}
                              </span>
                            </td>

                            <td style={tdStyle}>
                              <div
                                style={
                                  primaryCellTextStyle
                                }
                              >
                                {row.donorName || "-"}
                              </div>

                              <div
                                style={
                                  secondaryCellTextStyle
                                }
                              >
                                {row.sponsorId || "-"}
                              </div>
                            </td>

                            <td style={tdStyle}>
                              {row.category || "-"}
                            </td>

                            <td style={tdStyle}>
                              <div
                                style={
                                  primaryCellTextStyle
                                }
                              >
                                {row.schemeName || "-"}
                              </div>

                              {row.cattleInternalId && (
                                <div
                                  style={
                                    secondaryCellTextStyle
                                  }
                                >
                                  Cattle:{" "}
                                  {row.cattleInternalId}
                                </div>
                              )}
                            </td>

                            <td style={tdStyle}>
                              <div>
                                {formatDisplayDate(
                                  row.startDate
                                )}
                              </div>

                              <div
                                style={
                                  secondaryCellTextStyle
                                }
                              >
                                to{" "}
                                {formatDisplayDate(
                                  row.endDate
                                )}
                              </div>
                            </td>

                            <td
                              style={{
                                ...tdStyle,
                                fontWeight: 600,
                              }}
                            >
                              {formatCurrency(
                                row.committedAmount
                              )}
                            </td>

                            <td
                              style={{
                                ...tdStyle,
                                fontWeight: 600,
                                color: "#166534",
                              }}
                            >
                              {formatCurrency(
                                paidAmount
                              )}
                            </td>

                            <td
                              style={{
                                ...tdStyle,
                                fontWeight: 600,
                                color:
                                  balanceAmount > 0
                                    ? "#c2410c"
                                    : "#166534",
                              }}
                            >
                              {formatCurrency(
                                balanceAmount
                              )}
                            </td>

                            <td style={tdStyle}>
                              <StatusBadge
                                status={getStatusLabel(
                                  row
                                )}
                              />
                            </td>
                          </tr>
                        );
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={sponsorshipPage}
              totalPages={sponsorshipTotalPages}
              onPrevious={() =>
                setSponsorshipPage((page) =>
                  Math.max(1, page - 1)
                )
              }
              onNext={() =>
                setSponsorshipPage((page) =>
                  Math.min(
                    sponsorshipTotalPages,
                    page + 1
                  )
                )
              }
            />
          </div>
        </>
      )}

      {activeTab === "Payments" && (
        <>
          <div className="sponsorship-metrics">
            <MetricCard
              label="Payment Entries"
              value={paymentSummary.totalEntries}
              helper="All recorded receipts"
            />

            <MetricCard
              label="Total Received"
              value={formatCurrency(
                paymentSummary.received
              )}
              helper="Across all sponsorships"
              compact
            />

            <MetricCard
              label="Received Today"
              value={formatCurrency(
                paymentSummary.receivedToday
              )}
              helper="Payments recorded today"
              compact
            />

            <MetricCard
              label="Outstanding"
              value={formatCurrency(
                totalOutstanding
              )}
              helper="Against active commitments"
              compact
            />
          </div>

          <div style={filterPanelStyle}>
            <div style={filterHeaderStyle}>
              <div>
                <div style={filterTitleStyle}>
                  Search & Filters
                </div>

                <div style={filterSubtitleStyle}>
                  Search payment, sponsor, receipt or
                  transaction reference
                </div>
              </div>

              {paymentFiltersActive && (
                <button
                  type="button"
                  onClick={clearPaymentFilters}
                  style={clearButtonStyle}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="sponsorship-payment-filter-grid">
              <Field label="Search">
                <input
                  type="text"
                  value={paymentSearch}
                  onChange={(event) =>
                    setPaymentSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search payment..."
                  style={inputStyle}
                />
              </Field>

              <Field label="Payment Mode">
                <select
                  value={paymentModeFilter}
                  onChange={(event) =>
                    setPaymentModeFilter(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="All">
                    All Payment Modes
                  </option>

                  {PAYMENT_MODES.map((mode) => (
                    <option
                      key={mode}
                      value={mode}
                    >
                      {mode}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="From Date">
  <input
    type="date"
    value={paymentFromDate}
    onChange={(event) =>
      setPaymentFromDate(
        event.target.value
      )
    }
    max={paymentToDate || undefined}
    style={inputStyle}
  />
</Field>

              <Field label="To Date">
                <input
                  type="date"
                  value={paymentToDate}
                  onChange={(event) =>
                    setPaymentToDate(
                      event.target.value
                    )
                  }
                  min={paymentFromDate || undefined}
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>

          <div style={tableCardStyle}>
            <div style={tableHeaderStyle}>
              <div>
                <div style={tableTitleStyle}>
                  Sponsorship Payments
                </div>

                <div style={tableSubtitleStyle}>
                  Showing {filteredPayments.length} of{" "}
                  {payments.length} payments
                </div>
              </div>
            </div>

<div className="sponsorship-table-hint">
  Tap a card to view complete details
</div>
            <div style={tableScrollStyle}>
              <table
                className="responsive-register payment-register"
                style={{
                  ...tableStyle,
                  minWidth: "1100px",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>Payment ID</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Sponsor</th>
                    <th style={thStyle}>
                      Sponsorship
                    </th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Mode</th>
                    <th style={thStyle}>Receipt</th>
                    <th style={thStyle}>
                      Reference
                    </th>
                    <th style={thStyle}>
                      Received By
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
                        Loading payments...
                      </td>
                    </tr>
                  ) : displayedPayments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={emptyStateStyle}
                      >
                        No payments found.
                      </td>
                    </tr>
                  ) : (
                    displayedPayments.map((row) => (
                      <tr
                        key={row.paymentId}
                        onClick={() =>
                          setSelectedRecord({
                            type: "payment",
                            data: row,
                          })
                        }
                        style={clickableRowStyle}
                      >
                        <td style={tdStyle}>
                          <span style={idTextStyle}>
                            {row.paymentId || "-"}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          {formatDisplayDate(
                            row.paymentDate
                          )}
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={primaryCellTextStyle}
                          >
                            {row.donorName || "-"}
                          </div>

                          <div
                            style={
                              secondaryCellTextStyle
                            }
                          >
                            {row.sponsorId || "-"}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <div>
                            {row.sponsorshipId || "-"}
                          </div>

                          <div
                            style={
                              secondaryCellTextStyle
                            }
                          >
                            {row.schemeName || "-"}
                          </div>
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 700,
                            color: "#166534",
                          }}
                        >
                          {formatCurrency(
                            row.amountReceived
                          )}
                        </td>

                        <td style={tdStyle}>
                          {row.paymentMode || "-"}
                        </td>

                        <td style={tdStyle}>
                          {row.receiptNumber || "-"}
                        </td>

                        <td style={tdStyle}>
                          {row.transactionReference ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {row.receivedBy || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={paymentPage}
              totalPages={paymentTotalPages}
              onPrevious={() =>
                setPaymentPage((page) =>
                  Math.max(1, page - 1)
                )
              }
              onNext={() =>
                setPaymentPage((page) =>
                  Math.min(
                    paymentTotalPages,
                    page + 1
                  )
                )
              }
            />
          </div>
        </>
      )}

      {/* PART 3 STARTS HERE:
          Form modals, detail modals, helper components,
          closing tags and styles will be added next. */}

                {modalType === "sponsor-form" && (
        <div style={overlayStyle} onClick={closeModal}>
          <div
  className="sponsorship-modal"
  style={formModalStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>
                  {editingRecord
                    ? "Edit Sponsor"
                    : "Add Sponsor"}
                </h2>

                <div style={modalSubtitleStyle}>
                  {editingRecord
                    ? editingRecord.sponsorId
                    : "Create a new sponsor profile"}
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            <form
  onSubmit={submitSponsor}
  style={modalFormStyle}
>
              <div style={modalBodyStyle}>
                <SectionCard
                  title="Sponsor Details"
                  description="Primary identity and contact information"
                >
                  <div className="sponsorship-form-grid">
                    <Field label="Sponsor Name *">
                      <input
                        type="text"
                        name="donorName"
                        value={sponsorForm.donorName}
                        onChange={handleSponsorFormChange}
                        disabled={saving}
                        style={inputStyle}
                        required
                      />
                    </Field>

                    <Field label="Mobile Number">
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={sponsorForm.mobileNumber}
                        onChange={handleSponsorFormChange}
                        disabled={saving}
                        placeholder="10 to 15 digits"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Email">
                      <input
                        type="email"
                        name="email"
                        value={sponsorForm.email}
                        onChange={handleSponsorFormChange}
                        disabled={saving}
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="PAN Number">
                      <input
                        type="text"
                        name="panNumber"
                        value={sponsorForm.panNumber}
                        onChange={handleSponsorFormChange}
                        disabled={saving}
                        maxLength={10}
                        placeholder="ABCDE1234F"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Preferred Contact">
                      <select
                        name="preferredContact"
                        value={sponsorForm.preferredContact}
                        onChange={handleSponsorFormChange}
                        disabled={saving}
                        style={inputStyle}
                      >
                        <option value="">
                          Select contact method
                        </option>
                        <option value="Mobile">
                          Mobile
                        </option>
                        <option value="Phone">
                          Phone Call
                        </option>
                        <option value="WhatsApp">
                          WhatsApp
                        </option>
                        <option value="Email">
                          Email
                        </option>
                      </select>
                    </Field>

                    <Field label="Status">
                      <select
                        name="status"
                        value={sponsorForm.status}
                        onChange={handleSponsorFormChange}
                        disabled={saving}
                        style={inputStyle}
                      >
                        <option value="Active">
                          Active
                        </option>
                        <option value="Inactive">
                          Inactive
                        </option>
                      </select>
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Address"
                  description="Sponsor communication address"
                >
                  <div className="sponsorship-form-grid">
                    <Field label="Address" fullWidth>
                      <textarea
                        name="address"
                        value={sponsorForm.address}
                        onChange={handleSponsorFormChange}
                        disabled={saving}
                        rows={3}
                        style={textareaStyle}
                      />
                    </Field>

                    <Field label="City">
                      <input
                        type="text"
                        name="city"
                        value={sponsorForm.city}
                        onChange={handleSponsorFormChange}
                        disabled={saving}
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="State">
                      <input
                        type="text"
                        name="state"
                        value={sponsorForm.state}
                        onChange={handleSponsorFormChange}
                        disabled={saving}
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Postal Code">
                      <input
                        type="text"
                        name="postalCode"
                        value={sponsorForm.postalCode}
                        onChange={handleSponsorFormChange}
                        disabled={saving}
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Country">
                      <input
                        type="text"
                        name="country"
                        value={sponsorForm.country}
                        onChange={handleSponsorFormChange}
                        disabled={saving}
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Important Dates"
                  description="Optional dates for sponsor communication"
                >
                  <div className="sponsorship-form-grid">
                    <Field label="Date of Birth">
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={sponsorForm.dateOfBirth}
                        onChange={handleSponsorFormChange}
                        disabled={saving}
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Anniversary">
                      <input
                        type="date"
                        name="anniversary"
                        value={sponsorForm.anniversary}
                        onChange={handleSponsorFormChange}
                        disabled={saving}
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Remarks"
                  description="Additional information about the sponsor"
                >
                  <Field label="Remarks" fullWidth>
                    <textarea
                      name="remarks"
                      value={sponsorForm.remarks}
                      onChange={handleSponsorFormChange}
                      disabled={saving}
                      rows={3}
                      style={textareaStyle}
                    />
                  </Field>
                </SectionCard>
              </div>

              <ModalFooter
                saving={saving}
                onCancel={closeModal}
                submitText={
                  editingRecord
                    ? "Update Sponsor"
                    : "Save Sponsor"
                }
              />
            </form>
          </div>
        </div>
      )}

      {modalType === "sponsorship-form" && (
        <div style={overlayStyle} onClick={closeModal}>
          <div
  className="sponsorship-modal"
  style={formModalStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>
                  {editingRecord
                    ? "Edit Sponsorship"
                    : "Add Sponsorship"}
                </h2>

                <div style={modalSubtitleStyle}>
                  {editingRecord
                    ? editingRecord.sponsorshipId
                    : "Create a new sponsorship agreement"}
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

           <form
  onSubmit={submitSponsorship}
  style={modalFormStyle}
>
              <div style={modalBodyStyle}>
                <SectionCard
                  title="Sponsor & Scheme"
                  description="Select sponsor and sponsorship scheme"
                >
                  <div className="sponsorship-form-grid">
                    <Field label="Sponsor *">
                      <select
                        name="sponsorId"
                        value={sponsorshipForm.sponsorId}
                        onChange={handleSponsorshipFormChange}
                        disabled={saving}
                        style={inputStyle}
                      >
                        <option value="">
                          Select sponsor
                        </option>

                        {sponsors
                          .filter(
                            (row) =>
                              safeText(
                                row.status
                              ).toLowerCase() !==
                                "inactive" ||
                              row.sponsorId ===
                                sponsorshipForm.sponsorId
                          )
                          .map((row) => (
                            <option
                              key={row.sponsorId}
                              value={row.sponsorId}
                            >
                              {row.donorName} —{" "}
                              {row.sponsorId}
                            </option>
                          ))}
                      </select>
                    </Field>

                    <Field label="Category *">
                      <select
                        name="category"
                        value={sponsorshipForm.category}
                        onChange={handleSponsorshipFormChange}
                        disabled={saving}
                        style={inputStyle}
                      >
                        <option value="">
                          Select category
                        </option>

                        {SPONSORSHIP_CATEGORIES.map(
                          (category) => (
                            <option
                              key={category}
                              value={category}
                            >
                              {category}
                            </option>
                          )
                        )}
                      </select>
                    </Field>

                    <Field label="Scheme Name *">
                      <input
                        type="text"
                        name="schemeName"
                        value={sponsorshipForm.schemeName}
                        onChange={handleSponsorshipFormChange}
                        disabled={saving}
                        placeholder="Example: Annual Cow Sponsorship"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Scope">
                      <input
                        type="text"
                        name="scope"
                        value={sponsorshipForm.scope}
                        onChange={handleSponsorshipFormChange}
                        disabled={saving}
                        placeholder="Purpose or coverage"
                        style={inputStyle}
                      />
                    </Field>

                    {isCattleCategory(
                      sponsorshipForm.category
                    ) && (
                      <Field
                        label="Select Cattle *"
                        fullWidth
                      >
                        <select
                          name="cattleInternalId"
                          value={
                            sponsorshipForm.cattleInternalId
                          }
                          onChange={
                            handleSponsorshipFormChange
                          }
                          disabled={saving}
                          style={inputStyle}
                        >
                          <option value="">
                            Select cattle
                          </option>

                          {cattle.map((row) => {
                            const internalId =
                              getCattleInternalId(row);

                            if (!internalId) {
                              return null;
                            }

                            return (
                              <option
                                key={internalId}
                                value={internalId}
                              >
                                {getCattleLabel(row)}
                              </option>
                            );
                          })}
                        </select>
                      </Field>
                    )}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Period & Commitment"
                  description="Define duration, amount and payment frequency"
                >
                  <div className="sponsorship-form-grid">
                    <Field label="Start Date *">
                      <input
                        type="date"
                        name="startDate"
                        value={sponsorshipForm.startDate}
                        onChange={handleSponsorshipFormChange}
                        disabled={saving}
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Duration Type *">
                      <select
                        name="durationType"
                        value={sponsorshipForm.durationType}
                        onChange={handleSponsorshipFormChange}
                        disabled={saving}
                        style={inputStyle}
                      >
                        {DURATION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="End Date">
                      <input
                        type="date"
                        name="endDate"
                        value={sponsorshipForm.endDate}
                        onChange={handleSponsorshipFormChange}
                        disabled={
                          saving ||
                          sponsorshipForm.durationType ===
                            "One Time" ||
                          sponsorshipForm.durationType ===
                            "Lifetime"
                        }
                        min={
                          sponsorshipForm.startDate ||
                          undefined
                        }
                        style={{
                          ...inputStyle,
                          ...(sponsorshipForm.durationType ===
                            "One Time" ||
                          sponsorshipForm.durationType ===
                            "Lifetime"
                            ? disabledInputStyle
                            : {}),
                        }}
                      />
                    </Field>

                    <Field label="Committed Amount *">
                      <input
                        type="number"
                        name="committedAmount"
                        value={
                          sponsorshipForm.committedAmount
                        }
                        onChange={handleSponsorshipFormChange}
                        disabled={saving}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Payment Frequency *">
                      <select
                        name="paymentFrequency"
                        value={
                          sponsorshipForm.paymentFrequency
                        }
                        onChange={handleSponsorshipFormChange}
                        disabled={saving}
                        style={inputStyle}
                      >
                        {PAYMENT_FREQUENCIES.map(
                          (frequency) => (
                            <option
                              key={frequency}
                              value={frequency}
                            >
                              {frequency}
                            </option>
                          )
                        )}
                      </select>
                    </Field>

                    {editingRecord && (
                      <Field label="Stored Status">
                        <select
                          name="status"
                          value={sponsorshipForm.status}
                          onChange={
                            handleSponsorshipFormChange
                          }
                          disabled={saving}
                          style={inputStyle}
                        >
                          <option value="Active">
                            Active
                          </option>
                          <option value="Cancelled">
                            Cancelled
                          </option>
                        </select>
                      </Field>
                    )}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Remarks"
                  description="Additional sponsorship information"
                >
                  <Field label="Remarks" fullWidth>
                    <textarea
                      name="remarks"
                      value={sponsorshipForm.remarks}
                      onChange={handleSponsorshipFormChange}
                      disabled={saving}
                      rows={3}
                      style={textareaStyle}
                    />
                  </Field>
                </SectionCard>
              </div>

              <ModalFooter
                saving={saving}
                onCancel={closeModal}
                submitText={
                  editingRecord
                    ? "Update Sponsorship"
                    : "Save Sponsorship"
                }
              />
            </form>
          </div>
        </div>
      )}

      {modalType === "payment-form" && (
        <div style={overlayStyle} onClick={closeModal}>
          <div
  className="sponsorship-modal"
  style={formModalStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>
                  {editingRecord
                    ? "Edit Payment"
                    : "Record Payment"}
                </h2>

                <div style={modalSubtitleStyle}>
                  {editingRecord
                    ? editingRecord.paymentId
                    : "Record sponsorship payment receipt"}
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

          <form
  onSubmit={submitPayment}
  style={modalFormStyle}
>
              <div style={modalBodyStyle}>
                <SectionCard
                  title="Sponsorship"
                  description="Select the sponsorship receiving payment"
                >
                  <div className="sponsorship-form-grid">
                    <Field label="Sponsorship *" fullWidth>
                      <select
                        name="sponsorshipId"
                        value={paymentForm.sponsorshipId}
                        onChange={handlePaymentFormChange}
                        disabled={saving}
                        style={inputStyle}
                      >
                        <option value="">
                          Select sponsorship
                        </option>

                        {activeSponsorshipOptions.map(
                          (row) => {
                            const committed = toNumber(
                              row.committedAmount
                            );

                            const paid = toNumber(
                              paymentTotalsBySponsorship[
                                row.sponsorshipId
                              ]
                            );

                            const balance = Math.max(
                              0,
                              committed - paid
                            );

                            return (
                              <option
                                key={row.sponsorshipId}
                                value={row.sponsorshipId}
                              >
                                {row.sponsorshipId} —{" "}
                                {row.donorName || row.sponsorId} —{" "}
                                {row.schemeName || row.category} —{" "}
                                Balance {formatCurrency(balance)}
                              </option>
                            );
                          }
                        )}
                      </select>
                    </Field>

                    {paymentForm.sponsorshipId && (
                      <div style={summaryBoxStyle}>
                        {(() => {
                          const sponsorship =
                            sponsorships.find(
                              (row) =>
                                row.sponsorshipId ===
                                paymentForm.sponsorshipId
                            );

                          if (!sponsorship) {
                            return null;
                          }

                          const paid = toNumber(
                            paymentTotalsBySponsorship[
                              sponsorship.sponsorshipId
                            ]
                          );

                          const balance = Math.max(
                            0,
                            toNumber(
                              sponsorship.committedAmount
                            ) - paid
                          );

                          return (
                            <>
                              <div style={summaryBoxTitleStyle}>
                                {sponsorship.donorName ||
                                  sponsorship.sponsorId}
                              </div>

                              <div style={summaryBoxGridStyle}>
                                <SummaryItem
                                  label="Scheme"
                                  value={
                                    sponsorship.schemeName ||
                                    sponsorship.category
                                  }
                                />

                                <SummaryItem
                                  label="Committed"
                                  value={formatCurrency(
                                    sponsorship.committedAmount
                                  )}
                                />

                                <SummaryItem
                                  label="Received"
                                  value={formatCurrency(paid)}
                                />

                                <SummaryItem
                                  label="Outstanding"
                                  value={formatCurrency(
                                    balance
                                  )}
                                />
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Payment Details"
                  description="Amount, date and payment method"
                >
                  <div className="sponsorship-form-grid">
                    <Field label="Payment Date *">
                      <input
                        type="date"
                        name="paymentDate"
                        value={paymentForm.paymentDate}
                        onChange={handlePaymentFormChange}
                        disabled={saving}
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Amount Received *">
                      <input
                        type="number"
                        name="amountReceived"
                        value={paymentForm.amountReceived}
                        onChange={handlePaymentFormChange}
                        disabled={saving}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Payment Mode *">
                      <select
                        name="paymentMode"
                        value={paymentForm.paymentMode}
                        onChange={handlePaymentFormChange}
                        disabled={saving}
                        style={inputStyle}
                      >
                        {PAYMENT_MODES.map((mode) => (
                          <option key={mode} value={mode}>
                            {mode}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Receipt Number">
                      <input
                        type="text"
                        name="receiptNumber"
                        value={paymentForm.receiptNumber}
                        onChange={handlePaymentFormChange}
                        disabled={saving}
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Transaction Reference">
                      <input
                        type="text"
                        name="transactionReference"
                        value={
                          paymentForm.transactionReference
                        }
                        onChange={handlePaymentFormChange}
                        disabled={saving}
                        placeholder="UPI / bank reference"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Received By">
                      <input
                        type="text"
                        name="receivedBy"
                        value={paymentForm.receivedBy}
                        onChange={handlePaymentFormChange}
                        disabled={saving}
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Remarks"
                  description="Additional payment information"
                >
                  <Field label="Remarks" fullWidth>
                    <textarea
                      name="remarks"
                      value={paymentForm.remarks}
                      onChange={handlePaymentFormChange}
                      disabled={saving}
                      rows={3}
                      style={textareaStyle}
                    />
                  </Field>
                </SectionCard>
              </div>

              <ModalFooter
                saving={saving}
                onCancel={closeModal}
                submitText={
                  editingRecord
                    ? "Update Payment"
                    : "Record Payment"
                }
              />
            </form>
          </div>
        </div>
      )}

      {modalType === "cancel-sponsorship" && (
        <div style={overlayStyle} onClick={closeModal}>
          <div
  className="sponsorship-confirm-modal"
  style={confirmModalStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>
                  Cancel Sponsorship
                </h2>

                <div style={modalSubtitleStyle}>
                  {cancelForm.sponsorshipId}
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            <form
  onSubmit={submitCancellation}
  style={modalFormStyle}
>
              <div style={confirmBodyStyle}>
                <div style={warningBoxStyle}>
                  Cancelling a sponsorship preserves its
                  history and payments but prevents new
                  payments from being recorded against it.
                </div>

                <Field label="Cancellation Reason *">
                  <textarea
                    name="cancellationReason"
                    value={
                      cancelForm.cancellationReason
                    }
                    onChange={handleCancelFormChange}
                    disabled={saving}
                    rows={3}
                    style={textareaStyle}
                  />
                </Field>

                <div style={{ marginTop: "14px" }}>
                  <Field label="Remarks">
                    <textarea
                      name="remarks"
                      value={cancelForm.remarks}
                      onChange={handleCancelFormChange}
                      disabled={saving}
                      rows={3}
                      style={textareaStyle}
                    />
                  </Field>
                </div>
              </div>

              <div
  className="sponsorship-modal-footer"
  style={modalFooterStyle}
>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  style={{
                    ...secondaryButtonStyle,
                    ...(saving
                      ? disabledButtonStyle
                      : {}),
                  }}
                >
                  Keep Active
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...dangerButtonStyle,
                    ...(saving
                      ? disabledButtonStyle
                      : {}),
                  }}
                >
                  {saving
                    ? "Cancelling..."
                    : "Cancel Sponsorship"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRecord?.type === "sponsor" && (
        <SponsorDetailModal
          sponsor={selectedRecord.data}
          canEdit={canEdit}
          onClose={() => setSelectedRecord(null)}
          onEdit={openEditSponsor}
        />
      )}

      {selectedRecord?.type === "sponsorship" && (
        <SponsorshipDetailModal
          sponsorship={selectedRecord.data}
          sponsor={
            sponsorLookup[
              selectedRecord.data.sponsorId
            ]
          }
          cattle={
            cattleLookup[
              selectedRecord.data.cattleInternalId
            ]
          }
          amountPaid={toNumber(
            paymentTotalsBySponsorship[
              selectedRecord.data.sponsorshipId
            ]
          )}
          canEdit={canEdit}
          onClose={() => setSelectedRecord(null)}
          onEdit={openEditSponsorship}
          onCancel={openCancelSponsorship}
          onRecordPayment={openAddPayment}
        />
      )}

      {selectedRecord?.type === "payment" && (
        <PaymentDetailModal
          payment={selectedRecord.data}
          sponsorship={sponsorships.find(
            (row) =>
              row.sponsorshipId ===
              selectedRecord.data.sponsorshipId
          )}
          canEdit={canEdit}
          onClose={() => setSelectedRecord(null)}
          onEdit={openEditPayment}
        />
      )}
    </div>
  );
}

function SponsorDetailModal({
  sponsor,
  canEdit,
  onClose,
  onEdit,
}) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
  className="sponsorship-detail-modal"
  style={detailModalStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={modalHeaderStyle}>
          <div>
            <h2 style={modalTitleStyle}>
              {sponsor.donorName || "Sponsor"}
            </h2>

            <div style={modalSubtitleStyle}>
              {sponsor.sponsorId}
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

        <div
  className="sponsorship-detail-body"
  style={detailBodyStyle}
>
          <div style={detailStatusRowStyle}>
            <StatusBadge
              status={sponsor.status || "Active"}
            />

            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(sponsor)}
                style={editButtonStyle}
              >
                Edit Sponsor
              </button>
            )}
          </div>

          <DetailSection title="Contact Information">
            <div style={detailsGridStyle}>
              <DetailItem
                label="Mobile Number"
                value={sponsor.mobileNumber}
              />

              <DetailItem
                label="Email"
                value={sponsor.email}
              />

              <DetailItem
                label="Preferred Contact"
                value={sponsor.preferredContact}
              />

              <DetailItem
                label="PAN Number"
                value={sponsor.panNumber}
              />
            </div>
          </DetailSection>

          <DetailSection title="Address">
            <div style={detailsGridStyle}>
              <DetailItem
                label="Address"
                value={sponsor.address}
                fullWidth
              />

              <DetailItem
                label="City"
                value={sponsor.city}
              />

              <DetailItem
                label="State"
                value={sponsor.state}
              />

              <DetailItem
                label="Postal Code"
                value={sponsor.postalCode}
              />

              <DetailItem
                label="Country"
                value={sponsor.country}
              />
            </div>
          </DetailSection>

          <DetailSection title="Important Dates">
            <div style={detailsGridStyle}>
              <DetailItem
                label="Date of Birth"
                value={formatDisplayDate(
                  sponsor.dateOfBirth
                )}
              />

              <DetailItem
                label="Anniversary"
                value={formatDisplayDate(
                  sponsor.anniversary
                )}
              />
            </div>
          </DetailSection>

          <DetailSection title="Audit Information">
            <div style={detailsGridStyle}>
              <DetailItem
                label="Created On"
                value={sponsor.createdOn}
              />

              <DetailItem
                label="Created By"
                value={sponsor.createdBy}
              />

              <DetailItem
                label="Updated On"
                value={sponsor.updatedOn}
              />

              <DetailItem
                label="Updated By"
                value={sponsor.updatedBy}
              />
            </div>
          </DetailSection>

          {sponsor.remarks && (
            <DetailSection title="Remarks">
              <div style={remarksBoxStyle}>
                {sponsor.remarks}
              </div>
            </DetailSection>
          )}
        </div>
      </div>
    </div>
  );
}

function SponsorshipDetailModal({
  sponsorship,
  sponsor,
  cattle,
  amountPaid,
  canEdit,
  onClose,
  onEdit,
  onCancel,
  onRecordPayment,
}) {
  const committedAmount = toNumber(
    sponsorship.committedAmount
  );

  const balanceAmount = Math.max(
    0,
    committedAmount - amountPaid
  );

  const cancelled =
    isCancelledSponsorship(sponsorship);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
  className="sponsorship-detail-modal"
  style={detailModalStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={modalHeaderStyle}>
          <div>
            <h2 style={modalTitleStyle}>
              {sponsorship.schemeName ||
                "Sponsorship"}
            </h2>

            <div style={modalSubtitleStyle}>
              {sponsorship.sponsorshipId}
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

        <div
  className="sponsorship-detail-body"
  style={detailBodyStyle}
>
          <div style={detailStatusRowStyle}>
            <StatusBadge
              status={getStatusLabel(sponsorship)}
            />

            {canEdit && (
              <div style={detailActionGroupStyle}>
                {!cancelled && (
                  <button
                    type="button"
                    onClick={() =>
                      onRecordPayment(sponsorship)
                    }
                    style={successButtonStyle}
                  >
                    Record Payment
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onEdit(sponsorship)}
                  style={editButtonStyle}
                >
                  Edit
                </button>

                {!cancelled && (
                  <button
                    type="button"
                    onClick={() =>
                      onCancel(sponsorship)
                    }
                    style={dangerOutlineButtonStyle}
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={amountSummaryGridStyle}>
            <AmountCard
              label="Committed"
              value={formatCurrency(
                committedAmount
              )}
            />

            <AmountCard
              label="Received"
              value={formatCurrency(amountPaid)}
            />

            <AmountCard
              label="Outstanding"
              value={formatCurrency(balanceAmount)}
            />
          </div>

          <DetailSection title="Sponsor">
            <div style={detailsGridStyle}>
              <DetailItem
                label="Sponsor"
                value={
                  sponsorship.donorName ||
                  sponsor?.donorName
                }
              />

              <DetailItem
                label="Sponsor ID"
                value={sponsorship.sponsorId}
              />

              <DetailItem
                label="Mobile"
                value={
                  sponsorship.sponsorMobile ||
                  sponsor?.mobileNumber
                }
              />

              <DetailItem
                label="Email"
                value={
                  sponsorship.sponsorEmail ||
                  sponsor?.email
                }
              />
            </div>
          </DetailSection>

          <DetailSection title="Sponsorship Details">
            <div style={detailsGridStyle}>
              <DetailItem
                label="Category"
                value={sponsorship.category}
              />

              <DetailItem
                label="Scheme Name"
                value={sponsorship.schemeName}
              />

              <DetailItem
                label="Scope"
                value={sponsorship.scope}
              />

              <DetailItem
                label="Payment Frequency"
                value={
                  sponsorship.paymentFrequency
                }
              />

              <DetailItem
                label="Duration Type"
                value={sponsorship.durationType}
              />

              <DetailItem
                label="Stored Status"
                value={sponsorship.status}
              />
            </div>
          </DetailSection>

          {sponsorship.cattleInternalId && (
            <DetailSection title="Sponsored Cattle">
              <div style={detailsGridStyle}>
                <DetailItem
                  label="Internal ID"
                  value={
                    sponsorship.cattleInternalId
                  }
                />

                <DetailItem
                  label="Tag Number"
                  value={getCattleTag(cattle)}
                />

                <DetailItem
                  label="Cattle Name"
                  value={getCattleName(cattle)}
                />

                <DetailItem
                  label="Breed"
                  value={
                    cattle?.breed ||
                    cattle?.cattleBreed
                  }
                />
              </div>
            </DetailSection>
          )}

          <DetailSection title="Period">
            <div style={detailsGridStyle}>
              <DetailItem
                label="Start Date"
                value={formatDisplayDate(
                  sponsorship.startDate
                )}
              />

              <DetailItem
                label="End Date"
                value={formatDisplayDate(
                  sponsorship.endDate
                )}
              />
            </div>
          </DetailSection>

          {cancelled && (
            <DetailSection title="Cancellation">
              <div style={warningBoxStyle}>
                <strong>Reason:</strong>{" "}
                {sponsorship.cancellationReason ||
                  "Not specified"}
              </div>
            </DetailSection>
          )}

          <DetailSection title="Audit Information">
            <div style={detailsGridStyle}>
              <DetailItem
                label="Created On"
                value={sponsorship.createdOn}
              />

              <DetailItem
                label="Created By"
                value={sponsorship.createdBy}
              />

              <DetailItem
                label="Updated On"
                value={sponsorship.updatedOn}
              />

              <DetailItem
                label="Updated By"
                value={sponsorship.updatedBy}
              />
            </div>
          </DetailSection>

          {sponsorship.remarks && (
            <DetailSection title="Remarks">
              <div style={remarksBoxStyle}>
                {sponsorship.remarks}
              </div>
            </DetailSection>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentDetailModal({
  payment,
  sponsorship,
  canEdit,
  onClose,
  onEdit,
}) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
  className="sponsorship-detail-modal"
  style={detailModalStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={modalHeaderStyle}>
          <div>
            <h2 style={modalTitleStyle}>
              Payment Receipt
            </h2>

            <div style={modalSubtitleStyle}>
              {payment.paymentId}
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

        <div
  className="sponsorship-detail-body"
  style={detailBodyStyle}
>
          <div style={detailStatusRowStyle}>
            <div style={paymentAmountStyle}>
              {formatCurrency(
                payment.amountReceived
              )}
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(payment)}
                style={editButtonStyle}
              >
                Edit Payment
              </button>
            )}
          </div>

          <DetailSection title="Sponsor & Sponsorship">
            <div style={detailsGridStyle}>
              <DetailItem
                label="Sponsor"
                value={payment.donorName}
              />

              <DetailItem
                label="Sponsor ID"
                value={payment.sponsorId}
              />

              <DetailItem
                label="Sponsorship ID"
                value={payment.sponsorshipId}
              />

              <DetailItem
                label="Scheme"
                value={
                  payment.schemeName ||
                  sponsorship?.schemeName
                }
              />
            </div>
          </DetailSection>

          <DetailSection title="Payment Details">
            <div style={detailsGridStyle}>
              <DetailItem
                label="Payment Date"
                value={formatDisplayDate(
                  payment.paymentDate
                )}
              />

              <DetailItem
                label="Amount Received"
                value={formatCurrency(
                  payment.amountReceived
                )}
              />

              <DetailItem
                label="Payment Mode"
                value={payment.paymentMode}
              />

              <DetailItem
                label="Receipt Number"
                value={payment.receiptNumber}
              />

              <DetailItem
                label="Transaction Reference"
                value={
                  payment.transactionReference
                }
              />

              <DetailItem
                label="Received By"
                value={payment.receivedBy}
              />
            </div>
          </DetailSection>

          <DetailSection title="Audit Information">
            <div style={detailsGridStyle}>
              <DetailItem
                label="Created On"
                value={payment.createdOn}
              />

              <DetailItem
                label="Created By"
                value={payment.createdBy}
              />
            </div>
          </DetailSection>

          {payment.remarks && (
            <DetailSection title="Remarks">
              <div style={remarksBoxStyle}>
                {payment.remarks}
              </div>
            </DetailSection>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  compact = false,
}) {
  return (
    <div style={metricCardStyle}>
      <div style={metricLabelStyle}>{label}</div>

      <div
        style={{
          ...metricValueStyle,
          ...(compact
            ? compactMetricValueStyle
            : {}),
        }}
      >
        {value}
      </div>

      <div style={metricHelperStyle}>
        {helper}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  fullWidth = false,
}) {
  return (
    <div
      style={{
        gridColumn: fullWidth
          ? "1 / -1"
          : "auto",
      }}
    >
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}) {
  return (
    <section style={sectionCardStyle}>
      <div style={sectionHeaderStyle}>
        <div style={sectionTitleStyle}>
          {title}
        </div>

        <div style={sectionDescriptionStyle}>
          {description}
        </div>
      </div>

      {children}
    </section>
  );
}

function StatusBadge({ status }) {
  const normalized =
    safeText(status).toLowerCase();

  let background = "#f1f5f9";
  let color = "#475569";
  let borderColor = "#cbd5e1";

  if (normalized === "active") {
    background = "#dcfce7";
    color = "#166534";
    borderColor = "#bbf7d0";
  } else if (normalized === "upcoming") {
    background = "#dbeafe";
    color = "#1d4ed8";
    borderColor = "#bfdbfe";
  } else if (normalized === "expiring soon") {
    background = "#fef3c7";
    color = "#92400e";
    borderColor = "#fde68a";
  } else if (
    normalized === "expired" ||
    normalized === "cancelled"
  ) {
    background = "#fee2e2";
    color = "#991b1b";
    borderColor = "#fecaca";
  }

  return (
    <span
      style={{
        ...statusBadgeStyle,
        background,
        color,
        borderColor,
      }}
    >
      {status || "Active"}
    </span>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}) {
  return (
    <div
  className="sponsorship-pagination"
  style={paginationStyle}
>
      <div style={paginationInfoStyle}>
        Page {currentPage} of {totalPages}
      </div>

      <div style={paginationButtonsStyle}>
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage === 1}
          style={{
            ...paginationButtonStyle,
            ...(currentPage === 1
              ? disabledButtonStyle
              : {}),
          }}
        >
          Previous
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= totalPages}
          style={{
            ...paginationButtonStyle,
            ...(currentPage >= totalPages
              ? disabledButtonStyle
              : {}),
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ModalFooter({
  saving,
  onCancel,
  submitText,
}) {
  return (
    <div
  className="sponsorship-modal-footer"
  style={modalFooterStyle}
>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        style={{
          ...secondaryButtonStyle,
          ...(saving
            ? disabledButtonStyle
            : {}),
        }}
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={saving}
        style={{
          ...primaryButtonStyle,
          ...(saving
            ? disabledButtonStyle
            : {}),
        }}
      >
        {saving ? "Saving..." : submitText}
      </button>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <section style={detailSectionStyle}>
      <div style={detailSectionTitleStyle}>
        {title}
      </div>

      {children}
    </section>
  );
}

function DetailItem({
  label,
  value,
  fullWidth = false,
}) {
  return (
    <div
      style={{
        gridColumn: fullWidth
          ? "1 / -1"
          : "auto",
      }}
    >
      <div style={detailLabelStyle}>
        {label}
      </div>

      <div style={detailValueStyle}>
        {value === null ||
        value === undefined ||
        value === ""
          ? "-"
          : value}
      </div>
    </div>
  );
}

function AmountCard({ label, value }) {
  return (
    <div style={amountCardStyle}>
      <div style={amountCardLabelStyle}>
        {label}
      </div>

      <div style={amountCardValueStyle}>
        {value}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <div style={summaryItemLabelStyle}>
        {label}
      </div>

      <div style={summaryItemValueStyle}>
        {value || "-"}
      </div>
    </div>
  );
}





const headerActionsStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const pageTitleStyle = {
  margin: 0,
  fontSize: "28px",
  lineHeight: 1.2,
  fontWeight: 700,
  color: "#0f172a",
};

const pageSubtitleStyle = {
  margin: "6px 0 0",
  fontSize: "14px",
  color: "#64748b",
};



const tabButtonStyle = {
  padding: "9px 18px",
  border: "none",
  borderRadius: "7px",
  background: "transparent",
  color: "#64748b",
  fontSize: "14px",
  fontWeight: 700,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const activeTabButtonStyle = {
  background: "#ffffff",
  color: "#c2410c",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.12)",
};



const metricCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "18px",
  boxShadow:
    "0 1px 2px rgba(15, 23, 42, 0.04)",
};

const metricLabelStyle = {
  fontSize: "13px",
  color: "#64748b",
  fontWeight: 600,
};

const metricValueStyle = {
  marginTop: "7px",
  fontSize: "28px",
  lineHeight: 1.15,
  fontWeight: 700,
  color: "#0f172a",
  overflowWrap: "anywhere",
};

const compactMetricValueStyle = {
  fontSize: "22px",
};

const metricHelperStyle = {
  marginTop: "8px",
  fontSize: "12px",
  color: "#94a3b8",
};

const filterPanelStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "18px",
  marginBottom: "18px",
};

const filterHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "14px",
};

const filterTitleStyle = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#0f172a",
};

const filterSubtitleStyle = {
  marginTop: "3px",
  fontSize: "12px",
  color: "#64748b",
};



const tableCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  overflow: "hidden",
};

const tableHeaderStyle = {
  padding: "17px 18px",
  borderBottom: "1px solid #e2e8f0",
};

const tableTitleStyle = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#0f172a",
};

const tableSubtitleStyle = {
  marginTop: "3px",
  fontSize: "12px",
  color: "#64748b",
};

const tableScrollStyle = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  minWidth: "980px",
  borderCollapse: "collapse",
  fontSize: "14px",
};

const thStyle = {
  padding: "12px 16px",
  textAlign: "left",
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "13px 16px",
  borderBottom: "1px solid #f1f5f9",
  color: "#334155",
  verticalAlign: "middle",
};

const clickableRowStyle = {
  cursor: "pointer",
  background: "#ffffff",
};

const primaryCellTextStyle = {
  fontWeight: 600,
  color: "#0f172a",
};

const secondaryCellTextStyle = {
  marginTop: "3px",
  fontSize: "12px",
  color: "#64748b",
};

const idTextStyle = {
  color: "#c2410c",
  fontWeight: 700,
};

const emptyStateStyle = {
  padding: "48px 18px",
  textAlign: "center",
  color: "#64748b",
};

const paginationStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "14px 18px",
  background: "#f8fafc",
  borderTop: "1px solid #e2e8f0",
};

const paginationInfoStyle = {
  fontSize: "13px",
  color: "#64748b",
};

const paginationButtonsStyle = {
  display: "flex",
  gap: "8px",
};

const paginationButtonStyle = {
  padding: "8px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#334155",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px",
  background: "rgba(15, 23, 42, 0.55)",
};

const formModalStyle = {
  width: "100%",
  maxWidth: "860px",
  maxHeight: "92vh",
  display: "flex",
  flexDirection: "column",
  background: "#ffffff",
  borderRadius: "14px",
  overflow: "hidden",
  boxShadow:
    "0 24px 70px rgba(15, 23, 42, 0.28)",
};

const modalFormStyle = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
};

const detailModalStyle = {
  width: "100%",
  maxWidth: "760px",
  maxHeight: "90vh",
  background: "#ffffff",
  borderRadius: "14px",
  overflow: "hidden",
  boxShadow:
    "0 24px 70px rgba(15, 23, 42, 0.28)",
};

const confirmModalStyle = {
  width: "100%",
  maxWidth: "560px",
  maxHeight: "90vh",
  background: "#ffffff",
  borderRadius: "14px",
  overflow: "hidden",
  boxShadow:
    "0 24px 70px rgba(15, 23, 42, 0.28)",
};

const modalHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "16px",
  padding: "18px 22px",
  borderBottom: "1px solid #e2e8f0",
};

const modalTitleStyle = {
  margin: 0,
  fontSize: "20px",
  fontWeight: 700,
  color: "#0f172a",
};

const modalSubtitleStyle = {
  marginTop: "4px",
  fontSize: "12px",
  color: "#64748b",
};

const modalBodyStyle = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: "18px 22px",
  background: "#f8fafc",
};

const detailBodyStyle = {
  maxHeight: "calc(90vh - 82px)",
  overflowY: "auto",
  padding: "20px 22px",
};

const confirmBodyStyle = {
  padding: "20px 22px",
  background: "#f8fafc",
};

const modalFooterStyle = {
  flexShrink: 0,
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  padding: "15px 22px",
  borderTop: "1px solid #e2e8f0",
  background: "#ffffff",
  boxShadow: "0 -4px 12px rgba(15, 23, 42, 0.05)",
  zIndex: 2,
};

const sectionCardStyle = {
  padding: "16px",
  marginBottom: "14px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
};

const sectionHeaderStyle = {
  marginBottom: "14px",
};

const sectionTitleStyle = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#0f172a",
};

const sectionDescriptionStyle = {
  marginTop: "3px",
  fontSize: "12px",
  color: "#64748b",
};



const labelStyle = {
  display: "block",
  marginBottom: "5px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#475569",
};

const inputStyle = {
  width: "100%",
  minHeight: "40px",
  padding: "9px 10px",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: "14px",
  outline: "none",
};

const disabledInputStyle = {
  background: "#f1f5f9",
  color: "#94a3b8",
  cursor: "not-allowed",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: "82px",
  resize: "vertical",
  fontFamily: "inherit",
};

const primaryButtonStyle = {
  padding: "10px 17px",
  border: "none",
  borderRadius: "8px",
  background: "#ea580c",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  padding: "10px 17px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#334155",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

const editButtonStyle = {
  padding: "8px 13px",
  border: "1px solid #fed7aa",
  borderRadius: "7px",
  background: "#fff7ed",
  color: "#c2410c",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const successButtonStyle = {
  padding: "8px 13px",
  border: "1px solid #86efac",
  borderRadius: "7px",
  background: "#dcfce7",
  color: "#166534",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButtonStyle = {
  padding: "10px 17px",
  border: "none",
  borderRadius: "8px",
  background: "#dc2626",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerOutlineButtonStyle = {
  padding: "8px 13px",
  border: "1px solid #fecaca",
  borderRadius: "7px",
  background: "#fef2f2",
  color: "#b91c1c",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const clearButtonStyle = {
  padding: "7px 11px",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#475569",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const closeButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#64748b",
  fontSize: "28px",
  lineHeight: 1,
  cursor: "pointer",
};

const disabledButtonStyle = {
  opacity: 0.55,
  cursor: "not-allowed",
};

const statusBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 9px",
  border: "1px solid",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
};

const detailStatusRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const detailActionGroupStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const detailSectionStyle = {
  marginBottom: "20px",
};

const detailSectionTitleStyle = {
  marginBottom: "10px",
  paddingBottom: "7px",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "13px",
  fontWeight: 700,
  color: "#0f172a",
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "15px",
};

const detailLabelStyle = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

const detailValueStyle = {
  marginTop: "4px",
  fontSize: "14px",
  fontWeight: 500,
  color: "#0f172a",
  whiteSpace: "pre-wrap",
};

const remarksBoxStyle = {
  padding: "12px",
  border: "1px solid #fde68a",
  borderRadius: "8px",
  background: "#fffbeb",
  color: "#78350f",
  fontSize: "14px",
  lineHeight: 1.5,
};

const warningBoxStyle = {
  padding: "12px",
  marginBottom: "16px",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  background: "#fef2f2",
  color: "#991b1b",
  fontSize: "13px",
  lineHeight: 1.5,
};

const amountSummaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px",
  marginBottom: "20px",
};

const amountCardStyle = {
  padding: "14px",
  border: "1px solid #e2e8f0",
  borderRadius: "9px",
  background: "#f8fafc",
};

const amountCardLabelStyle = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
};

const amountCardValueStyle = {
  marginTop: "5px",
  fontSize: "18px",
  fontWeight: 700,
  color: "#0f172a",
};

const paymentAmountStyle = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#166534",
};

const summaryBoxStyle = {
  gridColumn: "1 / -1",
  padding: "14px",
  border: "1px solid #bfdbfe",
  borderRadius: "9px",
  background: "#eff6ff",
};

const summaryBoxTitleStyle = {
  marginBottom: "10px",
  fontSize: "14px",
  fontWeight: 700,
  color: "#1e3a8a",
};

const summaryBoxGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "12px",
};

const summaryItemLabelStyle = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
};

const summaryItemValueStyle = {
  marginTop: "3px",
  fontSize: "13px",
  fontWeight: 600,
  color: "#0f172a",
};

const toastStyle = {
  position: "fixed",
  top: "20px",
  right: "22px",
  zIndex: 2000,
  maxWidth: "420px",
  padding: "12px 16px",
  borderRadius: "9px",
  boxShadow:
    "0 10px 30px rgba(15, 23, 42, 0.18)",
  fontSize: "14px",
  fontWeight: 600,
};

const successToastStyle = {
  background: "#dcfce7",
  border: "1px solid #86efac",
  color: "#166534",
};

const errorToastStyle = {
  background: "#fee2e2",
  border: "1px solid #fca5a5",
  color: "#991b1b",
};
