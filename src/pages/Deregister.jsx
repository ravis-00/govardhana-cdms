// src/pages/Deregister.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getActiveCattle, updateCattle } from "../api/masterApi";

function toIsoDate(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const DEADM_TYPES = ["Death", "Sold", "Transferred", "Donated", "Reactive", "Inactive"];

const DEATH_CAUSE_CATS = [
  "Old age",
  "Accident",
  "Disease",
  "Snake bite",
  "Calving complication",
  "Other",
];

export default function Deregister() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  // form fields
  const [typeOfDeAdmit, setTypeOfDeAdmit] = useState("Death");
  const [dateOfDeAdmit, setDateOfDeAdmit] = useState(toIsoDate());
  const [deathCauseCat, setDeathCauseCat] = useState("Old age");
  const [deathCause, setDeathCause] = useState("");
  const [dateOfDeath, setDateOfDeath] = useState(""); // optional
  const [timeOfDeath, setTimeOfDeath] = useState(""); // optional HH:mm
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setErr("");
      setLoading(true);
      const data = await getActiveCattle(); // should be array
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(String(e?.message || e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((r) => {
      const tag = String(r.cattleId || "").toLowerCase();
      const name = String(r.name || "").toLowerCase();
      const breed = String(r.breed || "").toLowerCase();
      const shed = String(r.locationShed || "").toLowerCase();
      return (
        tag.includes(s) ||
        name.includes(s) ||
        breed.includes(s) ||
        shed.includes(s)
      );
    });
  }, [rows, q]);

  function openModal(row) {
    setSelected(row);

    // reset defaults each time
    setTypeOfDeAdmit("Death");
    setDateOfDeAdmit(toIsoDate());
    setDeathCauseCat("Old age");
    setDeathCause("");
    setDateOfDeath("");
    setTimeOfDeath("");
    setRemarks("");
  }

  function closeModal() {
    if (saving) return;
    setSelected(null);
  }

  async function submit() {
    if (!selected) return;

    if (!typeOfDeAdmit) {
      alert("Please select Type of De-Admission.");
      return;
    }
    if (!dateOfDeAdmit) {
      alert("Please select Date of De-Admission.");
      return;
    }
    if (typeOfDeAdmit === "Death" && !deathCause.trim()) {
      alert("Please enter Cause of Death details.");
      return;
    }

    const payload = {
      id: selected.id,

      // Master sheet fields
      status: "Deactive",
      typeOfDeAdmit: typeOfDeAdmit,
      dateOfDeAdmit: dateOfDeAdmit,

      // Death-only fields
      deathCauseCat: typeOfDeAdmit === "Death" ? deathCauseCat : "",
      deathCause: typeOfDeAdmit === "Death" ? deathCause : "",
      dateOfDeath: typeOfDeAdmit === "Death" ? (dateOfDeath || "") : "",
      timeOfDeath: typeOfDeAdmit === "Death" ? (timeOfDeath || "") : "",

      remarks: remarks || "",
    };

    try {
      setSaving(true);
      await updateCattle(payload);

      // remove from list immediately (now deactive)
      setRows((prev) => prev.filter((r) => r.id !== selected.id));

      closeModal();
      alert("Deregistered successfully.");
    } catch (e) {
      alert(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0 }}>
            Deregister / De-Admission
          </h1>
          <div style={{ color: "#6b7280", marginTop: "0.25rem" }}>
            Showing only <b>Active</b> cattle. Deregistering will mark them as{" "}
            <b>Deactive</b>.
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by Tag / Name / Breed / Shed..."
            style={{
              width: "320px",
              padding: "0.55rem 0.8rem",
              borderRadius: "0.6rem",
              border: "1px solid #d1d5db",
              fontSize: "0.9rem",
            }}
          />
          <button
            type="button"
            onClick={load}
            style={{
              padding: "0.55rem 0.9rem",
              borderRadius: "0.6rem",
              border: "1px solid #d1d5db",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </header>

      <div
        style={{
          marginTop: "1rem",
          background: "#fff",
          borderRadius: "0.75rem",
          boxShadow: "0 10px 25px rgba(15,23,42,0.05)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
          <thead style={{ background: "#f1f5f9", textAlign: "left" }}>
            <tr>
              <th style={th}>CATTLE ID</th>
              <th style={th}>NAME</th>
              <th style={th}>BREED</th>
              <th style={th}>GENDER</th>
              <th style={th}>LOCATION / SHED</th>
              <th style={th}>STATUS</th>
              <th style={{ ...th, textAlign: "center" }}>ACTION</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={empty}>Loading...</td></tr>
            ) : err ? (
              <tr><td colSpan={7} style={empty}>Error: {err}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={empty}>No active cattle found.</td></tr>
            ) : (
              filtered.map((r, idx) => (
                <tr key={r.id ?? idx} style={{ background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={td}>{r.cattleId || r.id}</td>
                  <td style={td}>{r.name || "-"}</td>
                  <td style={td}>{r.breed || "-"}</td>
                  <td style={td}>{r.gender || "-"}</td>
                  <td style={td}>{r.locationShed || "-"}</td>
                  <td style={td}>
                    <span
                      style={{
                        padding: "0.15rem 0.55rem",
                        borderRadius: "999px",
                        fontSize: "0.78rem",
                        background: "#dcfce7",
                        color: "#166534",
                        fontWeight: 700,
                      }}
                    >
                      Active
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => openModal(r)}
                      style={{
                        padding: "0.35rem 0.75rem",
                        borderRadius: "999px",
                        border: "none",
                        cursor: "pointer",
                        background: "#fee2e2",
                        color: "#b91c1c",
                        fontWeight: 700,
                      }}
                    >
                      ⛔ Deregister
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selected && (
        <div style={overlay} onClick={closeModal}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem" }}>
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  De-Admission / Deregister
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, marginTop: "0.15rem" }}>
                  {selected.cattleId || selected.id} — {selected.name || "-"}
                </div>
                <div style={{ color: "#6b7280", marginTop: "0.25rem", fontSize: "0.9rem" }}>
                  Breed: {selected.breed || "-"} • Shed: {selected.locationShed || "-"}
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                style={{
                  border: "none",
                  background: "#e5e7eb",
                  borderRadius: "999px",
                  padding: "0.25rem 0.6rem",
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem", marginTop: "1rem" }}>
              <div>
                <label style={lbl}>Type of De-Admission</label>
                <select value={typeOfDeAdmit} onChange={(e) => setTypeOfDeAdmit(e.target.value)} style={inp}>
                  {DEADM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>Date of De-Admission</label>
                <input type="date" value={dateOfDeAdmit} onChange={(e) => setDateOfDeAdmit(e.target.value)} style={inp} />
              </div>

              {typeOfDeAdmit === "Death" && (
                <>
                  <div>
                    <label style={lbl}>Death Cause Category</label>
                    <select value={deathCauseCat} onChange={(e) => setDeathCauseCat(e.target.value)} style={inp}>
                      {DEATH_CAUSE_CATS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={lbl}>Cause of Death Details</label>
                    <input
                      value={deathCause}
                      onChange={(e) => setDeathCause(e.target.value)}
                      style={inp}
                      placeholder="e.g., Old age / Disease / Accident..."
                    />
                  </div>

                  <div>
                    <label style={lbl}>Date of Death (optional)</label>
                    <input type="date" value={dateOfDeath} onChange={(e) => setDateOfDeath(e.target.value)} style={inp} />
                  </div>

                  <div>
                    <label style={lbl}>Time of Death (optional)</label>
                    <input type="time" value={timeOfDeath} onChange={(e) => setTimeOfDeath(e.target.value)} style={inp} />
                  </div>
                </>
              )}

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  style={{ ...inp, resize: "vertical" }}
                  placeholder="Any notes for record..."
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "end", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                style={{
                  padding: "0.55rem 0.9rem",
                  borderRadius: "0.6rem",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submit}
                disabled={saving}
                style={{
                  padding: "0.55rem 0.95rem",
                  borderRadius: "0.6rem",
                  border: "none",
                  background: saving ? "#fca5a5" : "#ef4444",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : "Confirm Deregister"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const th = {
  padding: "0.7rem 1rem",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 700,
  fontSize: "0.78rem",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  color: "#475569",
};

const td = {
  padding: "0.65rem 1rem",
  borderBottom: "1px solid #e5e7eb",
  color: "#111827",
  verticalAlign: "middle",
};

const empty = {
  padding: "1rem",
  textAlign: "center",
  color: "#6b7280",
};

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

const modal = {
  width: "100%",
  maxWidth: "860px",
  background: "#fff",
  borderRadius: "1rem",
  padding: "1.25rem 1.5rem",
  boxShadow: "0 25px 60px rgba(15,23,42,0.25)",
};

const lbl = {
  display: "block",
  fontSize: "0.75rem",
  color: "#6b7280",
  marginBottom: "0.25rem",
};

const inp = {
  width: "100%",
  padding: "0.55rem 0.75rem",
  borderRadius: "0.6rem",
  border: "1px solid #d1d5db",
  fontSize: "0.9rem",
};
