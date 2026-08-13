// src/api/masterApi.js
const BASE_URL = "https://script.google.com/macros/s/AKfycbxyWG3lJI2THu2BwmdXsuCriFSQ7eaUx3wHCCMcZF04AHjiVM-10OVkRVFiqEFuzHPL8g/exec";

const SESSION_TOKEN_KEY = "cattle_session_token";

export function getSessionToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SESSION_TOKEN_KEY) || "";
}

export function setSessionToken(token) {
  if (typeof window === "undefined") return;

  const value = String(token || "").trim();
  if (value) {
    window.localStorage.setItem(SESSION_TOKEN_KEY, value);
  } else {
    window.localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

export function clearSessionToken() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.localStorage.removeItem(
    SESSION_TOKEN_KEY
  );

  /*
   * Do not retain operational data after authentication is
   * removed.
   */
  clearCattleDataMemoryCache();
  clearDashboardSummaryMemoryCache();
}
/*
 * Prevent accidental duplicate Dashboard requests.
 *
 * This is useful during:
 * - React development Strict Mode
 * - rapid remounting
 * - multiple components requesting the Dashboard simultaneously
 *
 * It only deduplicates a request while that request is running.
 * It does not introduce long-term browser caching or stale data.
 */
let dashboardSummaryInFlight = null;

/*
 * Reuse the Dashboard response while the current application
 * session remains open.
 *
 * Backend writes clear both the frontend and Apps Script caches.
 */
const DASHBOARD_MEMORY_CACHE_MS =
  10 * 60 * 1000;

let dashboardSummaryMemoryCache =
  null;

let dashboardSummaryMemoryCachedAt =
  0;

let feedingInFlight = null;
let usersInFlight = null;
let newBornInFlight = null;
let sessionValidationInFlight = null;
let shedsInFlight = null;
const bioWasteInFlight = new Map();

/*
 * Short-lived Master Cattle memory cache.
 *
 * This exists only while the current JavaScript application
 * remains open. It is not written to localStorage or
 * sessionStorage.
 */
const CATTLE_MEMORY_CACHE_MS =
  2 * 60 * 1000;

let cattleInFlight = null;
let cattleMemoryCache = null;
let cattleMemoryCachedAt = 0;

let cattleExitLogInFlight = null;
let cattleExitLogMemoryCache = null;
let cattleExitLogMemoryCachedAt = 0;


/**
 * Clears the current browser application's Dashboard response.
 */
function clearDashboardSummaryMemoryCache() {
  dashboardSummaryMemoryCache =
    null;

  dashboardSummaryMemoryCachedAt =
    0;
}

/**
 * Clears Dashboard memory after a successful operation that can
 * change a Dashboard metric.
 */
async function runWithDashboardCacheInvalidation(
  request
) {
  const response =
    await request;

  clearDashboardSummaryMemoryCache();

  return response;
}

/**
 * Clears all in-memory data used by Master Cattle.
 */
function clearCattleDataMemoryCache() {
  cattleMemoryCache = null;
  cattleMemoryCachedAt = 0;

  cattleExitLogMemoryCache = null;
  cattleExitLogMemoryCachedAt = 0;
}

/**
 * Checks whether a memory-cache value is still fresh.
 */
function isFreshMemoryCache(
  value,
  cachedAt
) {
  return (
    value !== null &&
    cachedAt > 0 &&
    Date.now() - cachedAt <
      CATTLE_MEMORY_CACHE_MS
  );
}

/**
 * Clears Master Cattle caches after a successful write.
 */
async function runWithCattleCacheInvalidation(
  request
) {
  const response =
    await request;

  /*
   * Cattle changes can affect both Master Cattle and Dashboard
   * totals, gender counts, breeds, births and mortality.
   */
  clearCattleDataMemoryCache();
  clearDashboardSummaryMemoryCache();

  return response;
}

// =========================================================================
// HELPERS (Do not modify unless changing core logic)
// =========================================================================

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

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = 45000
) {
  const controller =
    new AbortController();

  let timedOut = false;

  const timeoutId = setTimeout(
    () => {
      timedOut = true;
      controller.abort();
    },
    timeoutMs
  );

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) {
      const timeoutError = new Error(
        `Request timed out after ${Math.round(
          timeoutMs / 1000
        )} seconds. Please retry.`
      );

      timeoutError.code =
        "REQUEST_TIMEOUT";

      throw timeoutError;
    }

    if (
      error?.name === "AbortError"
    ) {
      const abortError = new Error(
        "Request was cancelled. Please retry."
      );

      abortError.code =
        "REQUEST_ABORTED";

      throw abortError;
    }

    /*
     * Browser fetch normally throws TypeError for DNS,
     * connection and redirect-chain failures.
     */
    if (error instanceof TypeError) {
      const networkError = new Error(
        "Unable to complete the server request. Please check the connection and retry."
      );

      networkError.code =
        "NETWORK_ERROR";

      throw networkError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleResponse(
  res
) {
  if (!res.ok) {
    const text = await res
      .text()
      .catch(() => "");

    const httpError = new Error(
      `HTTP ${res.status} – ${
        text ||
        res.statusText ||
        "Network error"
      }`
    );

    httpError.code =
      "HTTP_ERROR";

    httpError.status =
      res.status;

    throw httpError;
  }

  const json = await res
    .json()
    .catch(() => {
      const jsonError = new Error(
        "Invalid JSON response from server"
      );

      jsonError.code =
        "INVALID_JSON";

      throw jsonError;
    });

  if (
    json &&
    json.success === false
  ) {
    const serverError = new Error(
      json.error ||
      json.message ||
      "Server returned success:false"
    );

    serverError.code =
      "SERVER_RESPONSE_ERROR";

    throw serverError;
  }

  return json;
}

function isRetryableReadError(
  error
) {
  if (
    error?.code ===
      "REQUEST_TIMEOUT" ||
    error?.code ===
      "NETWORK_ERROR"
  ) {
    return true;
  }

  /*
   * Apps Script can occasionally return a temporary 404 from
   * its redirected echo URL. Retry that response once.
   */
  if (
    error?.code ===
      "HTTP_ERROR" &&
    [
      404,
      408,
      429,
      500,
      502,
      503,
      504,
    ].includes(error.status)
  ) {
    return true;
  }

  return false;
}

function waitBeforeRetry(
  delayMs
) {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        delayMs
      );
    }
  );
}

async function getRequest(
  action,
  params = {},
  options = {}
) {
  const url = buildUrl(
    action,
    params
  );

  const timeoutMs =
    options.timeoutMs ||
    45000;

  const maxRetries =
    options.maxRetries ??
    1;

  let attempt = 0;

  while (true) {
    try {
      const res =
        await fetchWithTimeout(
          url,
          {
            method: "GET",
            cache: "no-cache",
          },
          timeoutMs
        );

      return await handleResponse(
        res
      );
    } catch (error) {
      const shouldRetry =
        attempt < maxRetries &&
        isRetryableReadError(
          error
        );

      if (!shouldRetry) {
        throw error;
      }

      attempt += 1;

      /*
       * Short pause before the single retry gives a transient
       * Apps Script redirect or execution failure time to clear.
       */
      await waitBeforeRetry(
        500
      );
    }
  }
}

async function postRequest(
  action,
  body,
  timeoutMs = 45000
) {
  /*
   * POST actions are carried only in the JSON body.
   *
   * Keeping ?action= in the Apps Script URL can occasionally
   * cause a redirected request to reach doGet(), resulting in
   * "Invalid GET Action" even though the original call was POST.
   */
  const url = BASE_URL;

  const payload = {
    action,
    ...(body || {}),
  };

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type":
          "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    },
    timeoutMs
  );

  return handleResponse(res);
}

async function authenticatedPostRequest(
  action,
  body = {},
  timeoutMs = 45000
) {
  const sessionToken = getSessionToken();

  if (!sessionToken) {
    throw new Error(
      "Your session is missing. Please sign in again."
    );
  }

  return postRequest(
    action,
    {
      ...body,
      sessionToken,
    },
    timeoutMs
  );
}

// =========================================================================
// API ENDPOINTS
// =========================================================================

// 0. DASHBOARD SUMMARY

/**
 * Loads the compact, backend-calculated Dashboard summary.
 *
 * Normal request:
 * - Uses the Apps Script Dashboard cache.
 * - Deduplicates simultaneous frontend requests.
 *
 * Force refresh:
 * - Bypasses the Apps Script Dashboard cache.
 * - Intended for testing or an explicit Refresh button.
 */
export async function getDashboardSummary(
  options = {}
) {
  const forceRefresh =
    options.forceRefresh === true;

  /*
   * Return the current application's cached Dashboard response
   * without starting another Apps Script request.
   */
  if (
    !forceRefresh &&
    isFreshMemoryCache(
      dashboardSummaryMemoryCache,
      dashboardSummaryMemoryCachedAt
    )
  ) {
    return dashboardSummaryMemoryCache;
  }

  /*
   * Reuse an existing request if Dashboard is mounted more than
   * once while the same request is still running.
   */
  if (
    !forceRefresh &&
    dashboardSummaryInFlight
  ) {
    return dashboardSummaryInFlight;
  }

  const request = getRequest(
    "getDashboardSummary",
    forceRefresh
      ? { forceRefresh: true }
      : {}
  ).then((response) => {
    dashboardSummaryMemoryCache =
      response;

    dashboardSummaryMemoryCachedAt =
      Date.now();

    return response;
  });

  if (forceRefresh) {
    return request;
  }

  dashboardSummaryInFlight =
    request.finally(() => {
      dashboardSummaryInFlight =
        null;
    });

  return dashboardSummaryInFlight;
}

// 1. CATTLE MANAGEMENT

export async function getCattle(
  options = {}
) {
  const forceRefresh =
    options.forceRefresh === true;

  if (
    !forceRefresh &&
    isFreshMemoryCache(
      cattleMemoryCache,
      cattleMemoryCachedAt
    )
  ) {
    return cattleMemoryCache;
  }

  /*
   * Reuse a request already in progress.
   */
  if (
    !forceRefresh &&
    cattleInFlight
  ) {
    return cattleInFlight;
  }

  const request = getRequest(
    "getCattle"
  ).then((response) => {
    cattleMemoryCache = response;
    cattleMemoryCachedAt =
      Date.now();

    return response;
  });

  if (forceRefresh) {
    return request;
  }

  cattleInFlight =
    request.finally(() => {
      cattleInFlight = null;
    });

  return cattleInFlight;
}

export async function getActiveCattle() {
  return getRequest(
    "getActiveCattle"
  );
}

export async function getCattleById(id) {
  return getRequest(
    "getCattleById",
    { id }
  );
}

export async function addCattle(
  payload
) {
  return runWithCattleCacheInvalidation(
    postRequest(
      "addCattle",
      payload
    )
  );
}

export async function updateCattle(
  payload
) {
  return runWithCattleCacheInvalidation(
    postRequest(
      "updateCattle",
      payload
    )
  );
}

export async function updateCattleTag(
  payload
) {
  return runWithCattleCacheInvalidation(
    postRequest(
      "updateCattleTag",
      payload
    )
  );
}

export async function getTagHistoryByCattle(internalId) {
  return getRequest("getTagHistoryByCattle", { internalId });
}
export async function getAllTagHistory() {
  return getRequest("getAllTagHistory");
}

export async function fetchBreeds() {
  return getRequest("getBreeds");
}

// 1.1 PEDIGREE
export async function getPedigreeList() { return getRequest("getPedigreeList"); }
export async function getPedigree(searchQuery) { return getRequest("getPedigree", { searchQuery }); }

// Exit & Deregister
export async function getCattleExitLog(
  params = {},
  options = {}
) {
  const forceRefresh =
    options.forceRefresh === true;

  if (
    !forceRefresh &&
    isFreshMemoryCache(
      cattleExitLogMemoryCache,
      cattleExitLogMemoryCachedAt
    )
  ) {
    return cattleExitLogMemoryCache;
  }

  if (
    !forceRefresh &&
    cattleExitLogInFlight
  ) {
    return cattleExitLogInFlight;
  }

  const request = getRequest(
    "getCattleExitLog",
    params
  ).then((response) => {
    cattleExitLogMemoryCache =
      response;

    cattleExitLogMemoryCachedAt =
      Date.now();

    return response;
  });

  if (forceRefresh) {
    return request;
  }

  cattleExitLogInFlight =
    request.finally(() => {
      cattleExitLogInFlight = null;
    });

  return cattleExitLogInFlight;
}

export async function deregisterCattle(
  payload
) {
  return runWithCattleCacheInvalidation(
    postRequest(
      "deregisterCattle",
      payload
    )
  );
}

// 2. NEW BORN & BREEDING
export async function getNewBorn() {
  /*
   * Reuse a simultaneous request triggered by React development
   * Strict Mode or multiple components.
   *
   * This is in-flight deduplication only. It does not retain
   * birth records after the request finishes, so refresh-after-
   * save always obtains current data.
   */
  if (newBornInFlight) {
    return newBornInFlight;
  }

  newBornInFlight =
    getRequest(
      "getNewBorn"
    ).finally(() => {
      newBornInFlight = null;
    });

  return newBornInFlight;
}

export async function addNewBorn(
  payload
) {
  return runWithDashboardCacheInvalidation(
    postRequest(
      "addNewBorn",
      payload
    )
  );
}

export async function updateNewBorn(
  payload
) {
  return runWithDashboardCacheInvalidation(
    postRequest(
      "updateNewBorn",
      payload
    )
  );
}

export async function getUnregisteredBirths() {
  return getRequest("getUnregisteredBirths");
}

export async function getBirthDetailsById(birthId) {
  return getRequest("getBirthDetailsById", { birthId });
}
// 3. MILK PRODUCTION & DISTRIBUTION

// Existing shed-level production
export async function getMilkProduction(
  params = {}
) {
  return getRequest(
    "getMilkProduction",
    params
  );
}

export async function addMilkProduction(
  payload
) {
  return runWithDashboardCacheInvalidation(
    postRequest(
      "addMilkProduction",
      payload
    )
  );
}

export async function updateMilkProduction(
  payload
) {
  return runWithDashboardCacheInvalidation(
    postRequest(
      "updateMilkYield",
      payload
    )
  );
}

// Existing distribution
export async function getMilkDistribution(
  params = {}
) {
  return getRequest(
    "getMilkDistribution",
    params
  );
}

export async function calculateMilkOutPass(
  params = {}
) {
  return getRequest(
    "calculateMilkOutPass",
    params
  );
}

export async function addMilkDistribution(
  payload
) {
  return runWithDashboardCacheInvalidation(
    postRequest(
      "addMilkDistribution",
      payload
    )
  );
}

export async function updateMilkDistribution(
  payload
) {
  return runWithDashboardCacheInvalidation(
    postRequest(
      "updateMilkDistribution",
      payload
    )
  );
}

// Individual cattle lactation
export async function getEligibleMilkCattle(
  payload = {}
) {
  return authenticatedPostRequest(
    "getEligibleMilkCattle",
    payload
  );
}

export async function getCattleLactations(
  payload = {}
) {
  return authenticatedPostRequest(
    "getCattleLactations",
    payload
  );
}

export async function addCattleLactation(
  payload
) {
  return authenticatedPostRequest(
    "addCattleLactation",
    payload
  );
}

export async function updateCattleLactation(
  payload
) {
  return authenticatedPostRequest(
    "updateCattleLactation",
    payload
  );
}

export async function closeCattleLactation(
  payload
) {
  return authenticatedPostRequest(
    "closeCattleLactation",
    payload
  );
}

export async function cancelCattleLactation(
  payload
) {
  return authenticatedPostRequest(
    "cancelCattleLactation",
    payload
  );
}

// Individual cattle milk yield
export async function getIndividualMilkEntrySheet(
  payload = {}
) {
  return authenticatedPostRequest(
    "getIndividualMilkEntrySheet",
    payload
  );
}

export async function getIndividualMilkYield(
  payload = {}
) {
  return authenticatedPostRequest(
    "getIndividualMilkYield",
    payload
  );
}

export async function getIndividualCowMonthlyRegister(
  payload = {}
) {
  return authenticatedPostRequest(
    "getIndividualCowMonthlyRegister",
    payload
  );
}

export async function saveIndividualMilkSession(
  payload
) {
  return authenticatedPostRequest(
    "saveIndividualMilkSession",
    payload,
    60000
  );
}

export async function updateIndividualMilkYield(
  payload
) {
  return authenticatedPostRequest(
    "updateIndividualMilkYield",
    payload
  );
}

export async function cancelIndividualMilkYield(
  payload
) {
  return authenticatedPostRequest(
    "cancelIndividualMilkYield",
    payload
  );
}

// 4. BIO WASTE

// 4. BIO WASTE

export async function getBioWaste(
  params = {},
  options = {}
) {
  const forceRefresh =
    options.forceRefresh === true;

  const requestParams = {
    fromDate: params.fromDate || "",
    toDate: params.toDate || "",
  };

  const requestKey = JSON.stringify(
    requestParams
  );

  if (forceRefresh) {
    return getRequest(
      "getBioWaste",
      requestParams
    );
  }

  if (
    bioWasteInFlight.has(
      requestKey
    )
  ) {
    return bioWasteInFlight.get(
      requestKey
    );
  }

  const request = getRequest(
    "getBioWaste",
    requestParams
  ).finally(() => {
    bioWasteInFlight.delete(
      requestKey
    );
  });

  bioWasteInFlight.set(
    requestKey,
    request
  );

  return request;
}

export async function addBioWaste(
  payload
) {
  return postRequest(
    "addBioWaste",
    payload,
    60000
  );
}

export async function updateBioWaste(
  payload
) {
  return postRequest(
    "updateBioWaste",
    payload,
    60000
  );
}

// 5. FEEDING
export async function getFeeding(
  options = {}
) {
  const forceRefresh =
    options.forceRefresh === true;

  if (forceRefresh) {
    return getRequest("getFeeding");
  }

  if (feedingInFlight) {
    return feedingInFlight;
  }

  feedingInFlight = getRequest(
    "getFeeding"
  ).finally(() => {
    feedingInFlight = null;
  });

  return feedingInFlight;
}

export async function addFeeding(
  payload
) {
  return runWithDashboardCacheInvalidation(
    postRequest(
      "addFeeding",
      payload,
      90000
    )
  );
}

export async function updateFeeding(
  payload
) {
  return runWithDashboardCacheInvalidation(
    postRequest(
      "updateFeeding",
      payload,
      90000
    )
  );
}

// 6. MEDICAL & VET


// Preventive Care Transactions
export async function getPreventiveCareLog(params = {}) {
  return getRequest("getPreventiveCareLog", params);
}

export async function addPreventiveCare(
  payload
) {
  return runWithDashboardCacheInvalidation(
    postRequest(
      "addPreventiveCare",
      payload
    )
  );
}

export async function updatePreventiveCare(
  payload
) {
  return runWithDashboardCacheInvalidation(
    postRequest(
      "updatePreventiveCare",
      payload
    )
  );
}

// Temporary aliases until Vaccine.jsx is fully migrated
export const getVaccine = getPreventiveCareLog;
export const addVaccine = addPreventiveCare;
export const updateVaccine = updatePreventiveCare;

// Preventive Care Types Master
export async function getPreventiveCareTypes() {
  return getRequest("getPreventiveCareTypes");
}

export async function addPreventiveCareType(payload) {
  return postRequest("addPreventiveCareType", payload);
}

export async function updatePreventiveCareType(payload) {
  return postRequest("updatePreventiveCareType", payload);
}

// Clinical Treatment Records
export async function getTreatments() {
  return getRequest("getTreatments");
}

export async function addTreatment(payload) {
  return postRequest("addTreatment", payload);
}

export async function updateTreatment(payload) {
  return postRequest("updateTreatment", payload);
}

export async function getDeathRecords(fromDate = "", toDate = "") {
  return getRequest("getDeathRecords", { fromDate, toDate });
}

export async function updateDeathRecord(
  payload
) {
  return runWithCattleCacheInvalidation(
    postRequest(
      "updateDeathRecord",
      payload
    )
  );
}

export async function getMedicines() {
  return getRequest("getMedicines");
}

// 7. FINANCE / SPONSORSHIP MANAGEMENT

// Sponsor Profiles
export async function getSponsors() {
  return getRequest("getSponsors");
}

export async function addSponsor(payload) {
  return postRequest("addSponsor", payload);
}

export async function updateSponsor(payload) {
  return postRequest("updateSponsor", payload);
}

// Legacy Dattu Yojana APIs
// Keep temporarily until the old workflow is fully retired.
export async function getDattuYojana() {
  return getRequest("getDattuYojana");
}

export async function addDattuYojana(
  payload
) {
  return runWithDashboardCacheInvalidation(
    postRequest(
      "addDattuYojana",
      payload
    )
  );
}

export async function updateDattuYojana(
  payload
) {
  return runWithDashboardCacheInvalidation(
    postRequest(
      "updateDattuYojana",
      payload
    )
  );
}

// 8. AUTH & USERS
export async function loginUser(
  email,
  password
) {
  const response =
    await postRequest(
      "login",
      {
        email,
        password,
      }
    );

  /*
   * A successful login may include the already-cached Dashboard
   * summary. Prime the frontend memory cache so Dashboard does
   * not start a second Apps Script request.
   */
  if (
    response?.success === true &&
    response?.dashboardSummary
      ?.success === true &&
    response.dashboardSummary.data
  ) {
    dashboardSummaryMemoryCache =
      response.dashboardSummary;

    dashboardSummaryMemoryCachedAt =
      Date.now();
  }

  return response;
}

export async function validateSession() {
  /*
   * React development Strict Mode may start session restoration
   * twice during the same initial mount. Reuse only the request
   * currently in progress.
   *
   * No authentication result is retained after completion.
   */
  if (
    sessionValidationInFlight
  ) {
    return sessionValidationInFlight;
  }

  sessionValidationInFlight =
    authenticatedPostRequest(
      "validateSession"
    ).finally(() => {
      sessionValidationInFlight =
        null;
    });

  return sessionValidationInFlight;
}

export async function logoutUser() {
  try {
    return await authenticatedPostRequest("logout");
  } finally {
    clearSessionToken();
  }
}

export async function fetchUsers(options = {}) {
  const forceRefresh =
    options.forceRefresh === true;

  /*
   * Explicit refresh after Add/Edit must obtain
   * the latest Users sheet data.
   */
  if (forceRefresh) {
    return authenticatedPostRequest("getUsers");
  }

  /*
   * If getUsers is already running, reuse the
   * same Promise instead of starting another
   * Apps Script request.
   */
  if (usersInFlight) {
    return usersInFlight;
  }

  usersInFlight =
    authenticatedPostRequest("getUsers")
      .finally(() => {
        usersInFlight = null;
      });

  return usersInFlight;
}

export async function addUser(userData) {
  return authenticatedPostRequest("addUser", userData);
}

export async function updateUser(userData) {
  return authenticatedPostRequest("updateUser", userData);
}

// 9. REPORTS 
export async function getReportData(reportType, startDate, endDate) { 
  return getRequest("getReportData", { reportType, startDate, endDate }); 
}

// 10. MASTER CONFIGURATION (Generic)
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

export async function updateMaster(
  type,
  id,
  data = {}
) {
  const properType = formatType(type);

  return postRequest(
    `update${properType}Master`,
    {
      ...data,
      id,
    }
  );
}

export async function deleteMaster(type, id) { 
  const properType = formatType(type);
  return postRequest(`delete${properType}Master`, { id }); 
}

// 11. SHED CONFIGURATION (Specific)
export async function getSheds(
  options = {}
) {
  const forceRefresh =
    options.forceRefresh === true;

  if (forceRefresh) {
    return getRequest("getSheds");
  }

  if (shedsInFlight) {
    return shedsInFlight;
  }

  shedsInFlight = getRequest(
    "getSheds"
  ).finally(() => {
    shedsInFlight = null;
  });

  return shedsInFlight;
}
export const addShed = async (data) => { return postRequest("addShed", data); };
export const updateShed = async (data) => { return postRequest("updateShed", data); };
export const deleteShed = async (data) => { return postRequest("deleteShed", data); };

export const reactivateCattle =
  async (payload) => {
    return runWithCattleCacheInvalidation(
      postRequest(
        "reactivateCattle",
        payload
      )
    );
  };

// Sponsorship Register
export async function getSponsorships() {
  return getRequest("getSponsorships");
}

export async function addSponsorship(
  payload
) {
  return runWithDashboardCacheInvalidation(
    postRequest(
      "addSponsorship",
      payload,
      90000
    )
  );
}

export async function updateSponsorship(
  payload
) {
  return runWithDashboardCacheInvalidation(
    postRequest(
      "updateSponsorship",
      payload,
      90000
    )
  );
}

export async function cancelSponsorship(
  payload
) {
  return runWithDashboardCacheInvalidation(
    postRequest(
      "cancelSponsorship",
      payload,
      90000
    )
  );
}

// Sponsorship Payments
export async function getSponsorshipPayments() {
  return getRequest("getSponsorshipPayments");
}

export async function addSponsorshipPayment(payload) {
  return postRequest("addSponsorshipPayment", payload);
}

export async function updateSponsorshipPayment(payload) {
  return postRequest("updateSponsorshipPayment", payload);
}


// =========================================================================
// ALIASES (For backward compatibility)
// =========================================================================
export const fetchDashboardSummary =
  getDashboardSummary;

export const login = loginUser; 
export const getUsers = fetchUsers;
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
export const fetchPreventiveCareLog = getPreventiveCareLog;
export const fetchVaccine = getPreventiveCareLog;
export const fetchTreatments = getTreatments;
export const fetchNewBorn = getNewBorn;
export const fetchDattuYojana = getDattuYojana;
