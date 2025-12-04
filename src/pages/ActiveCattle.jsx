import React, { useEffect, useState } from "react";
import { fetchCattle, addCattle } from "../api/cattle.js";

const initialForm = {
  name: "",
  breed: "",
  gender: "",
  cattleType: "",
  locationShed: "",
  status: "Active",
};

const th = {
  borderBottom: "2px solid #ddd",
  padding: "0.5rem",
  textAlign: "left",
  background: "#f3f4f6",
};

const td = {
  borderBottom: "1px solid #eee",
  padding: "0.4rem",
};

export default function ActiveCattle() {
  const [cattle, setCattle] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const list = await fetchCattle();
    setCattle(list);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name) {
      alert("Cattle Name is required");
      return;
    }

    setSaving(true);
    await addCattle(form);
    await loadData();
    setForm(initialForm);
    setSaving(false);
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Active Cattle</h1>

      {/* Add form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Breed"
          value={form.breed}
          onChange={(e) => setForm({ ...form, breed: e.target.value })}
        />
        <input
          placeholder="Gender"
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
        />
        <button disabled={saving} style={{ marginLeft: "0.5rem" }}>
          {saving ? "Saving..." : "Add Cattle"}
        </button>
      </form>

      {/* Table */}
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Cattle ID</th>
            <th style={th}>Name</th>
            <th style={th}>Breed</th>
            <th style={th}>Gender</th>
            <th style={th}>Location</th>
          </tr>
        </thead>
        <tbody>
          {cattle.map((c) => (
            <tr key={c.id}>
              <td style={td}>{c.id}</td>
              <td style={td}>{c.cattleId}</td>
              <td style={td}>{c.name}</td>
              <td style={td}>{c.breed}</td>
              <td style={td}>{c.gender}</td>
              <td style={td}>{c.locationShed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
