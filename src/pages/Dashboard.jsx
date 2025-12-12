// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import {
  getCattle,
  getMilkYield,
  getNewBorn,
  getDattuYojana,
  getFeeding,
} from "../api/masterApi";

function formatNumber(value) {
  if (!isFinite(value)) return 0;
  return Math.round(value);
}

// 🔹 Small helper to safely convert any API response into an array
function toArray(result) {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.data)) return result.data;
  if (result && Array.isArray(result.items)) return result.items;
  return [];
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeCattle: 0,
    femaleCattle: 0,
    maleCattle: 0,
    avgMilkYieldPerDay: 0,
    avgMilkSoldPerDay: 0,
    newBornCurrentYear: 0,
    activeDattuYojana: 0,
    avgFeedingPerDay: 0,
  });

  const [breedData, setBreedData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          cattleResult,
          milkYieldResult,
          newBornResult,
          dattuResult,
          feedingResult,
        ] = await Promise.all([
          getCattle(),
          getMilkYield(),
          getNewBorn(),
          getDattuYojana(),
          getFeeding(),
        ]);

        // ✅ Normalise all responses into arrays so .filter/.forEach never crash
        const cattle = toArray(cattleResult);
        const milkYield = toArray(milkYieldResult);
        const newBorn = toArray(newBornResult);
        const dattu = toArray(dattuResult);
        const feeding = toArray(feedingResult);

        const currentYear = new Date().getFullYear();

        // ----------------- CATTLE STATS -----------------
        const activeCattle = cattle.filter(
          (c) => String(c.status || "").toLowerCase() === "active"
        );

        const femaleCattle = activeCattle.filter((c) =>
          String(c.gender || "").toLowerCase().startsWith("f")
        );
        const maleCattle = activeCattle.filter((c) =>
          String(c.gender || "").toLowerCase().startsWith("m")
        );

        // Breeds (Hallikar, Deoni, Kankrej, Malenadu Gidda, Gir, Mix)
        const breedCounts = countBy(activeCattle, (c) =>
          String(c.breed || "").trim().toLowerCase()
        );

        const breeds = [
          { key: "hallikar", label: "Hallikar" },
          { key: "deoni", label: "Deoni" },
          { key: "kankrej", label: "Kankrej" },
          { key: "malenadu gidda", label: "Malenadu Gidda" },
          { key: "gir", label: "Gir" },
          { key: "mix", label: "Mix" },
        ].map((b) => ({
          label: b.label,
          value: breedCounts[b.key] || 0,
        }));

        // Cattle categories: Cows, Heifers, Calves, Bulls
        const categoryCounts = countBy(activeCattle, (c) =>
          String(c.cattleType || c.category || "").trim().toLowerCase()
        );

        const categories = [
          { keys: ["cow", "cows"], label: "Cows" },
          { keys: ["heifer", "heifers"], label: "Heifers" },
          { keys: ["calf", "calves"], label: "Calves" },
          { keys: ["bull", "bulls"], label: "Bulls" },
        ].map((cat) => ({
          label: cat.label,
          value: cat.keys.reduce(
            (sum, k) => sum + (categoryCounts[k] || 0),
            0
          ),
        }));

        // ----------------- MILK STATS -----------------
        const milkByDate = new Map();

        milkYield.forEach((row) => {
          const day = String(row.date || "").slice(0, 10);
          if (!day) return;

          const existing = milkByDate.get(day) || {
            yield: 0,
            sold: 0,
          };

          // Some sheets use "Day Total Yeild"
          const dayTotal = Number(
            row.dayTotalYield || row.dayTotalYeild || 0
          );
          const sold = Number(row.outPass || 0);

          existing.yield += isNaN(dayTotal) ? 0 : dayTotal;
          existing.sold += isNaN(sold) ? 0 : sold;

          milkByDate.set(day, existing);
        });

        const milkDayValues = Array.from(milkByDate.values());
        let avgMilkYieldPerDay = 0;
        let avgMilkSoldPerDay = 0;

        if (milkDayValues.length > 0) {
          const totalYield = milkDayValues.reduce(
            (sum, d) => sum + d.yield,
            0
          );
          const totalSold = milkDayValues.reduce(
            (sum, d) => sum + d.sold,
            0
          );
          avgMilkYieldPerDay = totalYield / milkDayValues.length;
          avgMilkSoldPerDay = totalSold / milkDayValues.length;
        }

        // ----------------- NEW BORN (CURRENT YEAR) -----------------
        const newBornCurrentYear = newBorn.filter((nb) => {
          const dob = nb.dateOfBirth;
          if (!dob) return false;
          const d = new Date(dob);
          return d.getFullYear() === currentYear;
        });

        // ----------------- DATTU YOJANA -----------------
        const activeDattuYojana = dattu.filter((d) => {
          const status = String(d.schemeStatus || "").toLowerCase();
          return !status || status === "active";
        });

        // ----------------- FEEDING -----------------
        const feedingByDate = new Map();
        feeding.forEach((row) => {
          const day = String(row.date || "").slice(0, 10);
          if (!day) return;
          const total = Number(row.totalKg || 0);
          const existing = feedingByDate.get(day) || 0;
          feedingByDate.set(
            day,
            existing + (isNaN(total) ? 0 : total)
          );
        });

        const feedingValues = Array.from(feedingByDate.values());
        let avgFeedingPerDay = 0;
        if (feedingValues.length > 0) {
          const totalFeeding = feedingValues.reduce((s, v) => s + v, 0);
          avgFeedingPerDay = totalFeeding / feedingValues.length;
        }

        // ----------------- SET STATE -----------------
        setStats({
          activeCattle: activeCattle.length,
          femaleCattle: femaleCattle.length,
          maleCattle: maleCattle.length,
          avgMilkYieldPerDay,
          avgMilkSoldPerDay,
          newBornCurrentYear: newBornCurrentYear.length,
          activeDattuYojana: activeDattuYojana.length,
          avgFeedingPerDay,
        });

        setBreedData(breeds);
        setCategoryData(categories);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const today = new Date().toLocaleDateString("en-GB");

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Header row */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Dashboard
        </h1>

        <div
          style={{
            fontSize: "0.9rem",
            padding: "0.25rem 0.75rem",
            borderRadius: "999px",
            background: "#ffffff",
            boxShadow: "0 4px 10px rgba(15,23,42,0.08)",
          }}
        >
          <strong>Date:</strong> {today}
        </div>
      </header>

      {error && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            background: "#fee2e2",
            color: "#b91c1c",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {/* =================== TOP 8 CARDS =================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <StatCard
          label="Active Cattle"
          value={formatNumber(stats.activeCattle)}
          loading={loading}
        />
        <StatCard
          label="Female Cattle"
          value={formatNumber(stats.femaleCattle)}
          loading={loading}
        />
        <StatCard
          label="Male Cattle"
          value={formatNumber(stats.maleCattle)}
          loading={loading}
        />
        <StatCard
          label="Avg Milk Yield / Day (L)"
          value={formatNumber(stats.avgMilkYieldPerDay)}
          loading={loading}
        />
        <StatCard
          label="Avg Milk Sold / Day (L)"
          value={formatNumber(stats.avgMilkSoldPerDay)}
          loading={loading}
        />
        <StatCard
          label="New Born (Current Year)"
          value={formatNumber(stats.newBornCurrentYear)}
          loading={loading}
        />
        <StatCard
          label="Active Dattu Yojana"
          value={formatNumber(stats.activeDattuYojana)}
          loading={loading}
        />
        <StatCard
          label="Avg Feeding / Day (Kg)"
          value={formatNumber(stats.avgFeedingPerDay)}
          loading={loading}
        />
      </div>

      {/* =================== GRAPHS SECTION =================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.1fr)",
          gap: "1.25rem",
          marginTop: "0.75rem",
        }}
      >
        {/* Vertical Breed Graph */}
        <ChartCard title="Breed Distribution">
          <VerticalBarChart data={breedData} />
        </ChartCard>

        {/* Horizontal Category Graph */}
        <ChartCard title="Cattle Categories">
          <HorizontalBarChart data={categoryData} />
        </ChartCard>
      </div>
    </div>
  );
}

/* =================== SMALL HELPERS =================== */

function countBy(items, keyFn) {
  const out = {};
  (items || []).forEach((item) => {
    const key = keyFn(item);
    if (!key) return;
    out[key] = (out[key] || 0) + 1;
  });
  return out;
}

function StatCard({ label, value, loading }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "0.75rem",
        padding: "1.1rem 1.4rem",
        boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "100px",
      }}
    >
      <div
        style={{
          fontSize: "0.8rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#6b7280",
          marginBottom: "0.35rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          color: "#111827",
        }}
      >
        {loading ? "…" : value}
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "0.75rem",
        padding: "1.1rem 1.4rem 1.3rem",
        boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
        minHeight: "260px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontSize: "0.9rem",
          fontWeight: 600,
          marginBottom: "0.75rem",
          color: "#111827",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

/* ============ VERTICAL BAR CHART (BREEDS) ============ */

function VerticalBarChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyChartPlaceholder />;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "flex-end",
        gap: "0.75rem",
        padding: "0.5rem 0.25rem 0.25rem",
      }}
    >
      {data.map((d) => (
        <div
          key={d.label}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: "0.75rem",
          }}
        >
          <div
            style={{
              height: "180px",
              width: "100%",
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                width: "70%",
                margin: "0 auto",
                height: `${(d.value / max) * 100 || 0}%`,
                borderRadius: "0.5rem 0.5rem 0 0",
                background:
                  "linear-gradient(180deg, #2563eb, #3b82f6)",
                transition: "height 0.3s ease",
              }}
            />
          </div>
          <div style={{ marginTop: "0.35rem", color: "#111827" }}>
            {d.value}
          </div>
          <div
            style={{
              marginTop: "0.1rem",
              color: "#6b7280",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============ HORIZONTAL BAR CHART (CATEGORIES) ============ */

function HorizontalBarChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyChartPlaceholder />;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        paddingTop: "0.25rem",
      }}
    >
      {data.map((d) => (
        <div
          key={d.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.8rem",
          }}
        >
          <div style={{ width: "70px", color: "#4b5563" }}>{d.label}</div>
          <div
            style={{
              flex: 1,
              height: "10px",
              borderRadius: "999px",
              background: "#e5e7eb",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(d.value / max) * 100 || 0}%`,
                height: "100%",
                borderRadius: "999px",
                background:
                  "linear-gradient(90deg, #2563eb, #3b82f6)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div style={{ width: "36px", textAlign: "right", color: "#111827" }}>
            {d.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyChartPlaceholder() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.8rem",
        color: "#9ca3af",
      }}
    >
      No data available
    </div>
  );
}
