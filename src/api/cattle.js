const BASE_URL = "https://script.google.com/macros/s/AKfycbzcJJcBinxjKRVkkhjX66VqzmKVGhelSlHu6KB1mjBYOqQ2N0u1a-BZCNwLNU8ZNtFFMw/exec";

async function handleResponse(res) {
  if (!res.ok) throw new Error("Network error: " + res.status);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "API Error");
  return data;
}

export async function fetchCattle() {
  const res = await fetch(`${BASE_URL}?action=getCattle`);
  return (await handleResponse(res)).data;
}

export async function addCattle(cattle) {
  const res = await fetch(`${BASE_URL}?action=addCattle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cattle),
  });
  return (await handleResponse(res)).id;
}
