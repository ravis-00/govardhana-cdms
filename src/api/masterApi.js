// web-cdms/src/api/masterApi.js

// 🔗 Deployed Apps Script Web App URL (must end with /exec)
// 🔗 Deployed Apps Script Web App URL (must end with /exec)
// 🔗 Deployed Apps Script Web App URL (must end with /exec)
const BASE_URL =
  "https://script.google.com/macros/s/AKfycbxyWG3lJI2THu2BwmdXsuCriFSQ7eaUx3wHCCMcZF04AHjiVM-10OVkRVFiqEFuzHPL8g/exec";

// example: "https://script.googleusercontent.com/macros/s/AKfycb...../exec"


/**
 * Small helper to build a URL with query parameters.
 */
function buildUrl(action, params = {}) {
  const url = new URL(BASE_URL);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

/**
 * Unified response handler for all API calls.
 * Supports both:
 *   { success, data, error }
 * and plain arrays/objects.
 */
async function handleResponse(res) {
  if (!res.ok) {
    // Network / HTTP level error
    const text = await res.text().catch(() => "");
    throw new Error(
      `HTTP ${res.status} – ${text || res.statusText || "Network error"}`
    );
  }

  const json = await res.json().catch(() => {
    throw new Error("Invalid JSON response from server");
  });

  // Our Apps Script wraps data as { success, data, error }
  if (json && json.success === false) {
    throw new Error(json.error || "Unknown API error");
  }

  // Support both {success, data} and plain arrays/objects
  return json.data ?? json;
}

/**
 * Generic GET wrapper.
 */
async function getRequest(action, params) {
  const res = await fetch(buildUrl(action, params), {
    method: "GET",
    cache: "no-cache",
  });
  return handleResponse(res);
}

/**
 * Generic POST wrapper.
 */
async function postRequest(action, body) {
  const res = await fetch(buildUrl(action), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return handleResponse(res);
}

// ============================================================================
// === Public API functions used by the React app =============================
// ============================================================================
//
// New naming convention: getXxx / addXxx / updateXxx
// Older pages sometimes use fetchXxx – we keep aliases later so both work.
//

// ---- CATTLE / MASTER ----

export async function getCattle() {
  return getRequest("getCattle");
}

export async function getActiveCattle() {
  return getRequest("getActiveCattle");
}

export async function getDeathRecords(fromDate = "2024-01-01") {
  return getRequest("getDeathRecords", { fromDate });
}

export async function getCattleById(id) {
  return getRequest("getCattleById", { id });
}

export async function addCattle(payload) {
  // returns { success, id }
  return postRequest("addCattle", payload);
}

export async function updateCattle(payload) {
  // returns { success, id }
  return postRequest("updateCattle", payload);
}

// ---- BIRTH REPORT (Certificates & Reports page) ----

/**
 * Birth Report – returns an array of rows (arrays) from Apps Script
 * Each row: [
 *   Date, Time, Name, Breed, Gender, Colour,
 *   Mother cow breed, Mother ear tag number,
 *   Father bull breed, Father ear tag number
 * ]
 */
export async function getBirthReport() {
  return getRequest("getBirthReport");
}

// ---- SALES REPORT (Cattle Sales Report – NEW) ----

/**
 * Cattle Sales Report – returns an array of objects from Apps Script.
 * Filtering by date / buyer is done on the frontend for now.
 */
export async function getSalesReport() {
  return getRequest("getSalesReport");
}

// ---- MILK YIELD ----

/**
 * Milk Yield – list all records from Milk Yield sheet.
 */
export async function getMilkYield() {
  return getRequest("getMilkYield");
}

// ---- BIO WASTE ----

export async function getBioWaste() {
  return getRequest("getBioWaste");
}
// (Later you can add addBioWaste / updateBioWaste if needed)

// ---- VACCINATION / DEWORMING ----

export async function getVaccine() {
  return getRequest("getVaccine");
}
// (Similarly, add addVaccine / updateVaccine when backend is ready)

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
  // backend returns { success: true, id: ... }
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
  // backend returns { success: true, id: ... }
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
//
// Older pages might still import these names:
//   fetchCattle, fetchActiveCattle, fetchDeathRecords,
//   fetchMilkYield, fetchBioWaste, fetchVaccine,
//   fetchTreatments, fetchNewBorn, fetchFeeding, fetchDattuYojana, ...
// To avoid having to touch every page, we simply re-export them here.
//

// Cattle / master
export const fetchCattle = getCattle;
export const fetchActiveCattle = getActiveCattle;
export const fetchDeathRecords = getDeathRecords;

// Birth Report (used in CertificatesReports.jsx)
export const fetchBirthReport = getBirthReport;

// 🔹 NEW: Cattle Sales Report alias
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
