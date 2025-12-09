// web-cdms/src/api/masterApi.js

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbzcJJcBinxjKRVkkhjX66VqzmKVGhelSlHu6KB1mjBYOqQ2N0u1a-BZCNwLNU8ZNtFFMw/exec";
// example: "https://script.googleusercontent.com/macros/s/AKfycb...../exec"

/**
 * Small helper to build a URL with query parameters
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
 * Unified response handler for all API calls
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
 * Generic GET wrapper
 */
async function getRequest(action, params) {
  const res = await fetch(buildUrl(action, params), {
    method: "GET",
    cache: "no-cache",
  });
  return handleResponse(res);
}

/**
 * Generic POST wrapper
 */
async function postRequest(action, body) {
  const res = await fetch(buildUrl(action), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return handleResponse(res);
}

// === Public API functions used by the React app ===

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

/**
 * Milk Yield – list all records from Milk Yield sheet
 */
export async function getMilkYield() {
  return getRequest("getMilkYield");
}

export async function getBioWaste() {
  return getRequest("getBioWaste");
}
