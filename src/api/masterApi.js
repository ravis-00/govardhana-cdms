// src/api/masterApi.js
const BASE_URL = "https://script.google.com/macros/s/AKfycbxyWG3lJI2THu2BwmdXsuCriFSQ7eaUx3wHCCMcZF04AHjiVM-10OVkRVFiqEFuzHPL8g/exec";

function cleanParams(params = {}) {
  const out = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });
  return out;
}

function buildUrl(action, params = {}) {
  const url = new URL(BASE_URL);
  url.searchParams.set("action", action);
  const cleaned = cleanParams(params);
  Object.entries(cleaned).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} – ${text || res.statusText || "Network error"}`);
  }
  const json = await res.json().catch(() => {
    throw new Error("Invalid JSON response from server");
  });
  if (json && json.success === false) {
    throw new Error(json.error || "Unknown API error");
  }
  return json.data !== undefined ? json.data : (json.user ? json : json); 
}

async function getRequest(action, params) {
  const url = buildUrl(action, params);
  const res = await fetchWithTimeout(url, { method: "GET", cache: "no-cache" }, 30000);
  return handleResponse(res);
}

async function postRequest(action, body) {
  const url = buildUrl(action);
  // Apps Script often prefers action in the payload for POST
  const payload = { action, ...body };
  
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload ?? {}),
  }, 30000);
  return handleResponse(res);
}

// --- API FUNCTIONS ---

// 1. CATTLE
export async function getCattle() { return getRequest("getCattle"); }
export async function getActiveCattle() { return getRequest("getActiveCattle"); }
export async function getCattleById(id) { return getRequest("getCattleById", { id }); }
export async function addCattle(payload) { return postRequest("addCattle", payload); }
export async function updateCattle(payload) { return postRequest("updateCattle", payload); }
export async function updateCattleTag(payload) { return postRequest("updateCattleTag", payload); }
export async function fetchBreeds() { return getRequest("getBreeds"); } 

// 1.1 PEDIGREE (🔥 NEW ADDITION 🔥)
export async function getPedigree(searchQuery) { return getRequest("getPedigree", { searchQuery }); }

// Exit & Deregister
export async function getCattleExitLog(params = {}) { return getRequest("getCattleExitLog", params); }
export async function deregisterCattle(payload) { return postRequest("deregisterCattle", payload); }

// 2. NEW BORN
export async function getNewBorn() { return getRequest("getNewBorn"); }
export async function addNewBorn(payload) { return postRequest("addNewBorn", payload); }
export async function updateNewBorn(payload) { return postRequest("updateNewBorn", payload); }
export async function getUnregisteredBirths() { return getRequest("getUnregisteredBirths"); }

// 3. MILK
export async function getMilkProduction(params = {}) { return getRequest("getMilkProduction", params); }
export async function addMilkProduction(payload) { return postRequest("addMilkProduction", payload); }
export async function updateMilkProduction(payload) { return postRequest("updateMilkYield", payload); }

export async function getMilkDistribution(params = {}) { return getRequest("getMilkDistribution", params); }
export async function addMilkDistribution(payload) { return postRequest("addMilkDistribution", payload); }
export async function updateMilkDistribution(payload) { return postRequest("updateMilkDistribution", payload); }

// 4. BIO WASTE
export async function getBioWaste(params = {}) { return getRequest("getBioWaste", params); }
export async function addBioWaste(payload) { return postRequest("addBioWaste", payload); }
export async function updateBioWaste(payload) { return postRequest("updateBioWaste", payload); }

// 5. FEEDING
export async function getFeeding() { return getRequest("getFeeding"); }
export async function addFeeding(payload) { return postRequest("addFeeding", payload); }
export async function updateFeeding(payload) { return postRequest("updateFeeding", payload); }

// 6. MEDICAL & VET
export async function getVaccine() { return getRequest("getVaccine"); }
export async function addVaccine(payload) { return postRequest("addVaccine", payload); }
export async function updateVaccine(payload) { return postRequest("updateVaccine", payload); }

export async function getTreatments() { return getRequest("getTreatments"); }
export async function addTreatment(payload) { return postRequest("addTreatment", payload); }
export async function updateTreatment(payload) { return postRequest("updateTreatment", payload); }

export async function getDeathRecords(fromDate = "2024-01-01", toDate = "") { return getRequest("getDeathRecords", { fromDate, toDate }); }
export async function getMedicines() { return getRequest("getMedicines"); }

// 7. FINANCE (DATTU)
export async function getDattuYojana() { return getRequest("getDattuYojana"); }
export async function addDattuYojana(payload) { return postRequest("addDattuYojana", payload); }
export async function updateDattuYojana(payload) { return postRequest("updateDattuYojana", payload); }

// 8. AUTH & USERS
export async function loginUser(email, password) { return postRequest("login", { email, password }); }
export const login = loginUser; 
export async function fetchUsers() { return getRequest("getUsers"); }
export const getUsers = fetchUsers;
export async function addUser(userData) { return postRequest("addUser", userData); }
export async function updateUser(userData) { return postRequest("updateUser", userData); }

// 9. REPORTS
export async function getReportData(reportType, startDate, endDate) { 
  return getRequest("getReportData", { reportType, startDate, endDate }); 
}

// =========================================================================
// 10. MASTER CONFIGURATION
// =========================================================================

// Helper to Capitalize: "breeds" -> "Breeds"
const formatType = (type) => {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1);
};

export async function fetchMaster(type) { 
  const properType = formatType(type);
  return getRequest(`get${properType}Master`); 
}

export async function addMaster(type, data) { 
  const properType = formatType(type);
  return postRequest(`add${properType}Master`, data); 
}

export async function updateMaster(type, id, data) { 
  const properType = formatType(type);
  return postRequest(`update${properType}Master`, { id, ...data }); 
}

export async function deleteMaster(type, id) { 
  const properType = formatType(type);
  return postRequest(`delete${properType}Master`, { id }); 
}

// --- ALIASES ---
export const fetchCattle = getCattle;
export const fetchActiveCattle = getActiveCattle;
export const fetchDeathRecords = getDeathRecords;
export const fetchUnregisteredBirths = getUnregisteredBirths;
export const fetchDattuReport = getDattuYojana;
export const getMilkYield = getMilkProduction; 
export const fetchMilkYield = getMilkProduction;
export const addMilkYield = addMilkProduction;
export const updateMilkYieldAlias = updateMilkProduction;
export const fetchBioWaste = getBioWaste;
export const fetchFeeding = getFeeding;
export const fetchVaccine = getVaccine;
export const fetchTreatments = getTreatments;
export const fetchNewBorn = getNewBorn;
export const fetchDattuYojana = getDattuYojana;