// web-cdms/src/api/masterApi.js

const BASE_URL = "https://script.google.com/macros/s/AKfycbzcJJcBinxjKRVkkhjX66VqzmKVGhelSlHu6KB1mjBYOqQ2N0u1a-BZCNwLNU8ZNtFFMw/exec"; 
// example: "https://script.googleusercontent.com/macros/s/AKfycb...../exec"

async function handleResponse(res) {
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || "Unknown API error");
  }
  return json.data ?? json;
}

export async function getCattle() {
  const res = await fetch(`${BASE_URL}?action=getCattle`);
  return handleResponse(res);
}

export async function getActiveCattle() {
  const res = await fetch(`${BASE_URL}?action=getActiveCattle`);
  return handleResponse(res);
}

export async function getDeathRecords(fromDate = "2024-01-01") {
  const res = await fetch(
    `${BASE_URL}?action=getDeathRecords&fromDate=${encodeURIComponent(fromDate)}`
  );
  return handleResponse(res);
}

export async function getCattleById(id) {
  const res = await fetch(`${BASE_URL}?action=getCattleById&id=${id}`);
  return handleResponse(res);
}

export async function addCattle(payload) {
  const res = await fetch(`${BASE_URL}?action=addCattle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res); // returns { success, id }
}

export async function updateCattle(payload) {
  const res = await fetch(`${BASE_URL}?action=updateCattle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res); // returns { success, id }
}
