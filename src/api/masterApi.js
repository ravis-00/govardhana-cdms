// web-cdms/src/api/masterApi.js

// 🔗 Deployed Apps Script Web App URL
const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxyWG3lJI2THu2BwmdXsuCriFSQ7eaUx3wHCCMcZF04AHjiVM-10OVkRVFiqEFuzHPL8g/exec";

// ============================================================================
// === HELPERS ================================================================
// ============================================================================

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
 * Build URL with query parameters.
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
 * Fetch with timeout wrapper.
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
 * Unified response handler.
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

  // Return data if present, otherwise return the whole json (for success messages)
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
// === API FUNCTIONS ==========================================================
// ============================================================================

// --- 1. CATTLE MANAGEMENT ---
export async function getCattle() {
  return getRequest("getCattle");
}

export async function getActiveCattle() {
  return getRequest("getActiveCattle");
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

export async function getDeathRecords(fromDate = "2024-01-01", toDate = "") {
  return getRequest("getDeathRecords", { fromDate, toDate });
}

// --- 2. NEW BORN ---
export async function getNewBorn() {
  return getRequest("getNewBorn");
}

export async function addNewBorn(payload) {
  return postRequest("addNewBorn", payload);
}

export async function updateNewBorn(payload) {
  return postRequest("updateNewBorn", payload);
}

// --- 3. DAILY OPERATIONS (Milk, Bio, Feeding) ---

// Milk Yield
export async function getMilkYield(params = {}) {
  return getRequest("getMilkYield", params);
}

export async function addMilkYield(payload) {
  return postRequest("addMilkYield", payload);
}

export async function updateMilkYield(payload) {
  return postRequest("updateMilkYield", payload);
}

// Bio Waste
export async function getBioWaste(params = {}) {
  return getRequest("getBioWaste", params);
}

export async function addBioWaste(payload) {
  return postRequest("addBioWaste", payload);
}

export async function updateBioWaste(payload) {
  return postRequest("updateBioWaste", payload);
}

// Feeding
export async function getFeeding() {
  return getRequest("getFeeding");
}

export async function addFeeding(payload) {
  return postRequest("addFeeding", payload);
}

export async function updateFeeding(payload) {
  return postRequest("updateFeeding", payload);
}

// --- 4. MEDICAL (Vaccine & Treatment) ---
export async function getVaccine() {
  return getRequest("getVaccine");
}

export async function getTreatments() {
  return getRequest("getTreatments");
}

export async function addTreatment(payload) {
  return postRequest("addTreatment", payload);
}

export async function updateTreatment(payload) {
  return postRequest("updateTreatment", payload);
}

// --- 5. FINANCE (Dattu Yojana Data Entry) ---
export async function getDattuYojana() {
  return getRequest("getDattuYojana");
}

export async function addDattuYojana(payload) {
  return postRequest("addDattuYojana", payload);
}

export async function updateDattuYojana(payload) {
  return postRequest("updateDattuYojana", payload);
}

// --- 6. AUTHENTICATION & USERS ---
export async function loginUser(email, password) {
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

// --- 7. REPORTS (Read-Only Views) ---
// These usually map to Reports.gs in backend
export async function getBirthReport(params = {}) {
  return getRequest("getBirthReport", params);
}

export async function getSalesReport(params = {}) {
  return getRequest("getSalesReport", params);
}

export async function getDattuReport(fromDate, toDate) {
  return getRequest("getDattuReport", { fromDate, toDate });
}

export async function getMilkReport(fromDate, toDate) {
  return getRequest("getMilkReport", { fromDate, toDate });
}

export async function getBioReport(fromDate, toDate) {
  return getRequest("getBioReport", { fromDate, toDate });
}

// ============================================================================
// === ALIASES (For Backward Compatibility) ===================================
// ============================================================================

export const fetchCattle = getCattle;
export const fetchActiveCattle = getActiveCattle;
export const fetchDeathRecords = getDeathRecords;

export const fetchBirthReport = getBirthReport;
export const fetchSalesReport = getSalesReport;
export const fetchDattuReport = getDattuReport;
export const fetchMilkReport = getMilkReport;
export const fetchBioReport = getBioReport;

export const fetchMilkYield = getMilkYield;
export const fetchBioWaste = getBioWaste;
export const fetchFeeding = getFeeding;

export const fetchVaccine = getVaccine;
export const fetchTreatments = getTreatments;
export const fetchNewBorn = getNewBorn;
export const fetchDattuYojana = getDattuYojana;