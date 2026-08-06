import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDashboardSummary,
} from "../api/masterApi";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, CartesianGrid
} from "recharts";

// --- 1. ICONS (SVG) ---
const Icons = {
  cow: <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>,
  drop: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>,
  alert: <path d="M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z"/>,
  leaf: <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-5.5 4-8 4z"/>,
  rupee: <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z M11 7h2v2h-2zm0 4h2v6h-2z"/>, 
  ribbon: <path d="M20 12l-5.11-5.11a1 1 0 0 0-.71-.29H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8.49a1 1 0 0 0 .71-.29L20 12zM5 16V7.41l4.29 4.29L5 16z"/> 
};

// --- 2. HELPERS ---
function formatNumber(value) {
  if (!Number.isFinite(value)) return 0;
  return value % 1 !== 0 ? value.toFixed(1) : value;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeCattle: 0, femaleCattle: 0, maleCattle: 0, avgMilkYieldPerDay: 0, avgMilkSoldPerDay: 0,
    newBorn12M: 0, calfMortality12M: 0, calfMortalityRate: 0, pureBredRate: 0, activeDattuYojana: 0,
    sponsorshipCoverage: 0, avgFeedingPerDay: 0, deathsLastYear: 0, soldLastYear: 0,
  });

  const [breedData, setBreedData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [attention, setAttention] = useState({
  vaccinationOverdue: 0,
  calfRegistrationOverdue: 0,
  sponsorshipExpiring30Days: 0,
});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
  let isMounted = true;

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response =
        await getDashboardSummary();

      if (
        !response ||
        response.success !== true ||
        !response.data
      ) {
        throw new Error(
          response?.error ||
          "Dashboard summary was not returned."
        );
      }

      const dashboard =
        response.data;

      const returnedStats =
        dashboard.stats || {};

        const returnedAttention =
  dashboard.attention || {};

      const nextStats = {
        activeCattle:
          Number(returnedStats.activeCattle) || 0,

        femaleCattle:
          Number(returnedStats.femaleCattle) || 0,

        maleCattle:
          Number(returnedStats.maleCattle) || 0,

        avgMilkYieldPerDay:
          Number(returnedStats.avgMilkYieldPerDay) || 0,

        avgMilkSoldPerDay:
          Number(returnedStats.avgMilkSoldPerDay) || 0,

        newBorn12M:
          Number(returnedStats.newBorn12M) || 0,

        calfMortality12M:
          Number(returnedStats.calfMortality12M) || 0,

        calfMortalityRate:
          Number(returnedStats.calfMortalityRate) || 0,

        pureBredRate:
          Number(returnedStats.pureBredRate) || 0,

        activeDattuYojana:
          Number(returnedStats.activeDattuYojana) || 0,

        sponsorshipCoverage:
          Number(returnedStats.sponsorshipCoverage) || 0,

        avgFeedingPerDay:
          Number(returnedStats.avgFeedingPerDay) || 0,

        deathsLastYear:
          Number(returnedStats.deathsLastYear) || 0,

        soldLastYear:
          Number(returnedStats.soldLastYear) || 0,
      };

      const nextBreedData =
        Array.isArray(dashboard.breedData)
          ? dashboard.breedData
              .map((item) => ({
                name: String(
                  item?.name || "Unknown"
                ),
                count:
                  Number(item?.count) || 0,
              }))
              .filter(
                (item) => item.count > 0
              )
          : [];

      const defaultCategoryColors = {
        Cows: "#3b82f6",
        Heifers: "#8b5cf6",
        Calves: "#10b981",
        Bulls: "#f59e0b",
      };

      const nextCategoryData =
        Array.isArray(
          dashboard.categoryData
        )
          ? dashboard.categoryData
              .map((item) => {
                const name =
                  String(
                    item?.name || ""
                  );

                return {
                  name,

                  count:
                    Number(
                      item?.count
                    ) || 0,

                  color:
                    item?.color ||
                    defaultCategoryColors[
                      name
                    ] ||
                    "#64748b",
                };
              })
              .filter(
                (item) =>
                  item.name &&
                  item.count > 0
              )
          : [];

      if (!isMounted) {
        return;
      }

      setStats(nextStats);

setAttention({
  vaccinationOverdue:
    Number(
      returnedAttention.vaccinationOverdue
    ) || 0,

  calfRegistrationOverdue:
    Number(
      returnedAttention.calfRegistrationOverdue
    ) || 0,

  sponsorshipExpiring30Days:
    Number(
      returnedAttention.sponsorshipExpiring30Days
    ) || 0,
});

setBreedData(nextBreedData);

setCategoryData(
  nextCategoryData
);

      const generatedAt =
        dashboard.generatedAt ||
        response.meta?.generatedAt;

      const parsedRefreshTime =
        generatedAt
          ? new Date(generatedAt)
          : new Date();

      setLastRefreshTime(
        Number.isNaN(
          parsedRefreshTime.getTime()
        )
          ? new Date()
          : parsedRefreshTime
      );

    } catch (err) {
      console.error(
        "Dashboard Load Error:",
        err
      );

      if (isMounted) {
        setError(
          err?.message ||
          "Failed to load dashboard data."
        );
      }

    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }

  loadDashboard();

  return () => {
    isMounted = false;
  };
}, []);

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading Dashboard...</div>;
  if (error) return <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>{error}</div>;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1600px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      
      {/* HEADER */}
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem",
  }}
>
  <div>
    <h1 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#1e293b", margin: 0 }}>
      Dashboard
    </h1>
    <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "0.95rem" }}>
      Operations overview & key performance indicators.
    </p>
  </div>

  <div
    style={{
      background: "#fff",
      padding: "0.55rem 1rem",
      borderRadius: "10px",
      border: "1px solid #e2e8f0",
      whiteSpace: "nowrap",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      lineHeight: 1.4,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "0.8rem",
        color: "#64748b",
        fontWeight: "600",
      }}
    >
      🕒 Updated:
    </div>

    <div style={{ color: "#1e293b", fontWeight: "600", fontSize: "0.85rem" }}>
      {lastRefreshTime
        ? `${lastRefreshTime.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })} | ${lastRefreshTime.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "Loading..."}
    </div>
  </div>
</div>

      {/* --- HERO METRICS (UPDATED: Compact Grid 4-up) --- */}
      {/* Reduced minmax from 260px to 220px to allow 4 cards in one row on desktop */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        
        {/* 1. Active Cattle */}
<HeroCard 
  title="ACTIVE CATTLE" 
  value={stats.activeCattle} 
  trend="● Total Head Count"
  icon="🐄"
  bg="linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
  iconColor="#3b82f6"
  textColor="#1e3a8a"
  trendColor="#60a5fa"
/>

        {/* 2. Purebred Rate */}
<HeroCard 
  title="PUREBRED RATE" 
  value={`${stats.pureBredRate}%`} 
  trend={stats.pureBredRate < 75 ? "▼ Below Target" : "▲ On Target"}
  icon="🏅"
  bg={stats.pureBredRate < 75 ? "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)" : "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"}
  iconColor={stats.pureBredRate < 75 ? "#f59e0b" : "#10b981"}
  textColor={stats.pureBredRate < 75 ? "#9a3412" : "#065f46"}
  trendColor={stats.pureBredRate < 75 ? "#fbbf24" : "#34d399"}
/>

       {/* 3. Calf Mortality */}
<HeroCard 
  title="CALF MORTALITY (12M)" 
  value={`${stats.calfMortality12M} (${stats.calfMortalityRate}%)`} 
  trend={stats.calfMortalityRate > 5 ? "▲ Needs Attention" : "● Within Limit"}
  icon="⚠️"
  bg={stats.calfMortalityRate > 5 ? "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)" : "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"}
  iconColor={stats.calfMortalityRate > 5 ? "#ef4444" : "#10b981"}
  textColor={stats.calfMortalityRate > 5 ? "#991b1b" : "#065f46"}
  trendColor={stats.calfMortalityRate > 5 ? "#f87171" : "#34d399"}
/>

        {/* 4. Active Sponsors */}
<HeroCard 
  title="ACTIVE SPONSORS" 
  value={stats.activeDattuYojana} 
  trend={stats.sponsorshipCoverage < 60 ? "▼ Low Coverage" : "▲ Good Coverage"}
  icon="🤝"
  bg="linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)"
  iconColor="#8b5cf6"
  textColor="#6b21a8"
  trendColor="#a78bfa"
/>
      </div>

      {/* --- MINI METRICS (Clean Look) --- */}
      <h3 style={sectionTitleStyle}>Detailed Demographics & Operations</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        <MiniCard label="Female Population" value={stats.femaleCattle} accentColor="#ec4899" />
        <MiniCard label="Male Population" value={stats.maleCattle} accentColor="#3b82f6" />
        <MiniCard label="New Born (12M)" value={stats.newBorn12M} accentColor="#10b981" />
        <MiniCard label="Avg Milk Sold / Day" value={`${formatNumber(stats.avgMilkSoldPerDay)} L`} accentColor="#f59e0b" />
        <MiniCard label="Total Deaths (12M)" value={stats.deathsLastYear} accentColor="#ef4444" />
        <MiniCard label="Avg Feeding / Day" value={`${formatNumber(stats.avgFeedingPerDay)} Kg`} accentColor="#8b5cf6" />
      </div>

      {/* --- ACTIONABLE REMINDERS --- */}
<div
  style={{
    background: "#fff7ed",
    border: "1px solid #fb923c",
    padding: "1.25rem 1.5rem",
    borderRadius: "14px",
    marginBottom: "2.5rem",
    boxShadow:
      "0 4px 12px rgba(234, 88, 12, 0.08)",
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "1rem",
    }}
  >
    <div style={{ fontSize: "1.4rem" }}>
      ⚠️
    </div>

    <h3
      style={{
        margin: 0,
        fontSize: "1rem",
        fontWeight: "800",
        color: "#9a3412",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      Attention Required
    </h3>
  </div>

  <div
    style={{
      display: "grid",
      gap: "0.7rem",
    }}
  >
    <AttentionRow
      icon="💉"
      label="Vaccination overdue"
      count={attention.vaccinationOverdue}
      onView={() =>
        navigate("/vaccine")
      }
    />

    <AttentionRow
      icon="🐄"
      label="Calf registration overdue"
      count={attention.calfRegistrationOverdue}
      onView={() =>
         navigate("/newborn")
      }
    />

    <AttentionRow
      icon="🤝"
      label="Sponsorship expiring in 30 days"
      count={attention.sponsorshipExpiring30Days}
      onView={() =>
        navigate("/dattu-yojana")
      }
    />
  </div>
</div>

     {/* --- CHARTS & HERD COMPOSITION --- */}
<div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1.5rem" }}>
  {/* Breed Chart - Horizontal */}
  <div style={chartCardStyle}>
    <h3 style={chartTitleStyle}>Breed Distribution</h3>

    <div style={{ height: "360px", width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={breedData.slice(0, 12)}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#334155", fontSize: 12, fontWeight: 600 }}
          />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          />
          <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={18}>
            <LabelList
              dataKey="count"
              position="right"
              style={{ fill: "#475569", fontSize: "0.75rem", fontWeight: "bold" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* Herd Composition Cards */}
  <div style={chartCardStyle}>
    <h3 style={chartTitleStyle}>Herd Composition</h3>

    <div style={{ display: "grid", gap: "1rem" }}>
      {categoryData.map((item) => {
        const percent = stats.activeCattle > 0 ? ((item.count / stats.activeCattle) * 100).toFixed(1) : 0;

        const iconMap = {
          Cows: "🐄",
          Heifers: "🐮",
          Calves: "🍼",
          Bulls: "🐂",
        };

        return (
          <div
            key={item.name}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderLeft: `5px solid ${item.color}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <div style={{ fontSize: "1.6rem" }}>{iconMap[item.name] || "🐄"}</div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                  {item.name}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>
                  {percent}% of active herd
                </div>
              </div>
            </div>

            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1e293b" }}>
              {item.count}
            </div>
          </div>
        );
      })}
    </div>

    <div
      style={{
        marginTop: "1.25rem",
        padding: "1rem",
        borderRadius: "12px",
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 800, textTransform: "uppercase" }}>
        Total Active Herd
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 900, color: "#1e3a8a" }}>
        {stats.activeCattle}
      </div>
    </div>
  </div>
</div>
</div>
  );
}

// --- SUB-COMPONENTS ---

function HeroCard({ title, value, trend, icon, bg, iconColor, textColor, trendColor }) {
  return (
    <div style={{ 
      background: bg, padding: "1.25rem", borderRadius: "16px", // Reduced Padding to make card smaller
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      color: textColor, transition: "transform 0.2s", cursor: "default",
      position: "relative", overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)"
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem", position: "relative", zIndex: 2 }}>
        <div
  style={{
    background: "rgba(255,255,255,0.7)",
    padding: "10px",
    borderRadius: "14px",
    backdropFilter: "blur(4px)",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    fontSize: "28px",
    lineHeight: 1,
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  {typeof icon === "string" ? (
    <span>{icon}</span>
  ) : (
    <svg viewBox="0 0 24 24" fill={iconColor} width="28" height="28">
      {icon}
    </svg>
  )}
</div>
      </div>
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ fontSize: "0.8rem", opacity: 0.8, fontWeight: "700", marginBottom: "4px", letterSpacing: "0.5px", textTransform:"uppercase" }}>{title}</div>
        <div style={{ fontSize: "2.6rem", fontWeight: "900", letterSpacing: "-1.5px", lineHeight: 1 }}>
  {value}
</div>
        <div
  style={{
    marginTop: "10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.8rem",
    color: trendColor,
    fontWeight: "700",
    background: "rgba(255,255,255,0.55)",
    padding: "4px 8px",
    borderRadius: "999px",
    width: "fit-content",
  }}
>
  {trend}
</div>
      </div>
    </div>
  );
}

function MiniCard({ label, value, accentColor }) {
  return (
    <div style={{ 
      background: "#fff", padding: "1.2rem", borderRadius: "12px", 
      boxShadow: "0 2px 4px rgba(0,0,0,0.02)", border: "1px solid #f1f5f9",
      borderLeft: `4px solid ${accentColor}`,
      display: "flex", flexDirection: "column", justifyContent: "center"
    }}>
      <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b" }}>{value}</div>
    </div>
  );
}

function AttentionRow({
  icon,
  label,
  count,
  onView,
}) {
  const numericCount =
    Number(count) || 0;

  const hasItems =
    numericCount > 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(0, 1fr) auto auto",
        alignItems: "center",
        gap: "0.9rem",
        padding: "0.75rem 0.9rem",
        borderRadius: "10px",
        border: hasItems
          ? "1px solid #fed7aa"
          : "1px solid #e2e8f0",
        background: hasItems
          ? "#ffffff"
          : "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.7rem",
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: "1.1rem",
            flexShrink: 0,
          }}
        >
          {icon}
        </span>

        <span
          style={{
            color: hasItems
              ? "#7c2d12"
              : "#64748b",
            fontSize: "0.92rem",
            fontWeight: "700",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </span>
      </div>

      <div
        style={{
          minWidth: "38px",
          padding: "0.28rem 0.65rem",
          borderRadius: "999px",
          background: hasItems
            ? "#ffedd5"
            : "#e2e8f0",
          color: hasItems
            ? "#c2410c"
            : "#64748b",
          fontWeight: "800",
          fontSize: "0.88rem",
          textAlign: "center",
        }}
      >
        {numericCount}
      </div>

      <button
        type="button"
        onClick={onView}
        style={{
          border: "none",
          background: "transparent",
          color: "#c2410c",
          fontSize: "0.85rem",
          fontWeight: "800",
          cursor: "pointer",
          padding: "0.35rem 0.5rem",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.textDecoration =
            "underline";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.textDecoration =
            "none";
        }}
      >
        View
      </button>
    </div>
  );
}

const sectionTitleStyle = { fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "1rem", marginTop: "1rem" };
const chartCardStyle = { background: "#fff", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" };
const chartTitleStyle = { margin: "0 0 1.5rem 0", fontSize: "1.1rem", fontWeight: "700", color: "#1e293b" };