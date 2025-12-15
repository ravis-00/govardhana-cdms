// web-cdms/src/api/masterApi.js

// 🔗 Deployed Apps Script Web App URL (must end with /exec)
const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxyWG3lJI2THu2BwmdXsuCriFSQ7eaUx3wHCCMcZF04AHjiVM-10OVkRVFiqEFuzHPL8g/exec";

/**
 * Remove undefined / null / empty string params so URL stays clean.
 */
function cleanParams(params = {}) {
  const out = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });
  return out;
}

/**
 * Small helper to build a URL with query parameters.
 */
function buildUrl(action, params = {}) {
  const url = new URL(BASE_URL);
  url.searchParams.set("action", action);

  const cleaned = cleanParams(params);
  Object.entries(cleaned).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

/**
 * Adds timeout to fetch (Apps Script sometimes hangs).
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Unified response handler for all API calls.
 * Supports both:
 *   { success, data, error }
 * and plain arrays/objects.
 */
async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `HTTP ${res.status} – ${text || res.statusText || "Network error"}`
    );
  }

  const json = await res.json().catch(() => {
    throw new Error("Invalid JSON response from server");
  });

  if (json && json.success === false) {
    throw new Error(json.error || "Unknown API error");
  }

  return json.data ?? json;
}

/**
 * Generic GET wrapper.
 */
async function getRequest(action, params) {
  const url = buildUrl(action, params);
  const res = await fetchWithTimeout(
    url,
    { method: "GET", cache: "no-cache" },
    30000
  );
  return handleResponse(res);
}

/**
 * Generic POST wrapper.
 */
async function postRequest(action, body) {
  const url = buildUrl(action);
  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    },
    30000
  );
  return handleResponse(res);
}

// ============================================================================
// === Public API functions used by the React app =============================
// ============================================================================

// ---- CATTLE / MASTER ----
export async function getCattle() {
  return getRequest("getCattle");
}

export async function getActiveCattle() {
  return getRequest("getActiveCattle");
}

/**
 * Death records from Master.
 * Backend expects: action=getDeathRecords&fromDate=YYYY-MM-DD
 */
export async function getDeathRecords(fromDate, toDate) {
  return getRequest("getDeathRecords", { fromDate, toDate });
}


/**
 * NOTE: Your Apps Script doGet currently DOES NOT have getCattleById route.
 * This function is kept for future, but it will fail unless backend adds it.
 */
export async function getCattleById(id) {
  return getRequest("getCattleById", { id });
}

export async function addCattle(payload) {
  return postRequest("addCattle", payload);
}

export async function updateCattle(payload) {
  return postRequest("updateCattle", payload);
}

// ---- BIRTH REPORT (Certificates & Reports page) ----
/**
 * Backend supports optional filters:
 *   action=getBirthReport&fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
 */
export async function getBirthReport(params = {}) {
  // params can include { fromDate, toDate }
  return getRequest("getBirthReport", params);
}

// ---- SALES REPORT (Cattle Sales Report) ----
/**
 * Backend currently returns all sales rows.
 * We accept optional params for future use (frontend can filter).
 */
export async function getSalesReport(params = {}) {
  return getRequest("getSalesReport", params);
}

// ---- MILK YIELD ----
export async function getMilkYield() {
  return getRequest("getMilkYield");
}

// ---- BIO WASTE ----
export async function getBioWaste() {
  return getRequest("getBioWaste");
}

// ---- VACCINATION / DEWORMING ----
export async function getVaccine() {
  return getRequest("getVaccine");
}

// ---- MEDICAL TREATMENT (Health sheet) ----
export async function getTreatments() {
  return getRequest("getTreatments");
}

export async function addTreatment(payload) {
  return postRequest("addTreatment", payload);
}

export async function updateTreatment(payload) {
  return postRequest("updateTreatment", payload);
}

// ---- NEW BORN (New Born sheet) ----
export async function getNewBorn() {
  return getRequest("getNewBorn");
}

export async function addNewBorn(payload) {
  return postRequest("addNewBorn", payload);
}

export async function updateNewBorn(payload) {
  return postRequest("updateNewBorn", payload);
}

// ---- FEEDING (Feeding sheet) ----
export async function getFeeding() {
  return getRequest("getFeeding");
}

export async function addFeeding(payload) {
  return postRequest("addFeeding", payload);
}

export async function updateFeeding(payload) {
  return postRequest("updateFeeding", payload);
}

// ---- DATTU YOJANA (Dattu sheet) ----
export async function getDattuYojana() {
  return getRequest("getDattuYojana");
}

export async function addDattuYojana(payload) {
  return postRequest("addDattuYojana", payload);
}

export async function updateDattuYojana(payload) {
  return postRequest("updateDattuYojana", payload);
}

// ============================================================================
// === Backwards-compatibility aliases =======================================
// ============================================================================

// Cattle / master
export const fetchCattle = getCattle;
export const fetchActiveCattle = getActiveCattle;
export const fetchDeathRecords = getDeathRecords;

// Reports
export const fetchBirthReport = getBirthReport;
export const fetchSalesReport = getSalesReport;

// Milk yield
export const fetchMilkYield = getMilkYield;

// Bio waste
export const fetchBioWaste = getBioWaste;

// Vaccine / deworming
export const fetchVaccine = getVaccine;

// Medical treatment
export const fetchTreatments = getTreatments;

// New born
export const fetchNewBorn = getNewBorn;

// Feeding
export const fetchFeeding = getFeeding;

// Dattu Yojana
export const fetchDattuYojana = getDattuYojana;
