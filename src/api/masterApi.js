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

export async function getDeathRecords(fromDate = "2024-01-01", toDate = "") {
  return getRequest("getDeathRecords", { fromDate, toDate });
}

export async function getCattleById(id) {
  return getRequest("getCattleById", { id });
}

export async function addCattle(payload) {
  return postRequest("addCattle", payload);
}

export async function updateCattle(payload) {
  return postRequest("updateCattle", payload);
}

// ---- BIRTH REPORT ----
export async function getBirthReport(params = {}) {
  return getRequest("getBirthReport", params);
}

// ---- SALES REPORT ----
export async function getSalesReport(params = {}) {
  return getRequest("getSalesReport", params);
}

// ---- DATTU REPORT (MISSING IN YOUR ORIGINAL FILE) ----
// This is required for the Certificates & Reports page to work
export async function getDattuReport(fromDate, toDate) {
  return getRequest("getDattuReport", { fromDate, toDate });
}

// ---- MILK YIELD ----
// Updated to accept params so you can filter Milk Report by date too
export async function getMilkYield(params = {}) {
  return getRequest("getMilkYield", params);
}

// ---- BIO WASTE ----
// Updated to accept params so you can filter Bio Report by date too
export async function getBioWaste(params = {}) {
  return getRequest("getBioWaste", params);
}

// ---- VACCINATION / DEWORMING ----
export async function getVaccine() {
  return getRequest("getVaccine");
}

// ---- MEDICAL TREATMENT ----
export async function getTreatments() {
  return getRequest("getTreatments");
}

export async function addTreatment(payload) {
  return postRequest("addTreatment", payload);
}

export async function updateTreatment(payload) {
  return postRequest("updateTreatment", payload);
}

// ---- NEW BORN ----
export async function getNewBorn() {
  return getRequest("getNewBorn");
}

export async function addNewBorn(payload) {
  return postRequest("addNewBorn", payload);
}

export async function updateNewBorn(payload) {
  return postRequest("updateNewBorn", payload);
}

// ---- FEEDING ----
export async function getFeeding() {
  return getRequest("getFeeding");
}

export async function addFeeding(payload) {
  return postRequest("addFeeding", payload);
}

export async function updateFeeding(payload) {
  return postRequest("updateFeeding", payload);
}

// ---- DATTU YOJANA (Data Entry List) ----
export async function getDattuYojana() {
  return getRequest("getDattuYojana");
}

export async function addDattuYojana(payload) {
  return postRequest("addDattuYojana", payload);
}

export async function updateDattuYojana(payload) {
  return postRequest("updateDattuYojana", payload);
}

// ... inside masterApi.js ...

export async function getMilkReport(fromDate, toDate) {
  return getRequest("getMilkReport", { fromDate, toDate });
}

export async function getBioReport(fromDate, toDate) {
  return getRequest("getBioReport", { fromDate, toDate });
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
export const fetchDattuReport = getDattuReport; // <--- ADDED THIS ALIAS

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

// Dattu Yojana (Data Entry)
export const fetchDattuYojana = getDattuYojana;

export const fetchMilkReport = getMilkReport;
export const fetchBioReport = getBioReport;

// ... existing imports and functions ...

// --- AUTHENTICATION & USERS ---

export async function loginUser(email, password) {
  // The Controller expects action="login"
  return getRequest("login", { email, password });
}

export async function fetchUsers() {
  return getRequest("getUsers");
}

export async function addUser(userData) {
  // userData = { name, email, password, mobile, role }
  return postRequest("addUser", userData);
}

export async function updateUser(userData) {
  return postRequest("updateUser", userData);
}
