import React, { useEffect, useState } from "react";
import {
  getCattle, getMilkYield, getMilkDistribution, getNewBorn, getDattuYojana, getFeeding, getCattleExitLog,
} from "../api/masterApi";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie, Legend, CartesianGrid
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

function toArray(result) {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.data)) return result.data;
  return [];
}

function normalizeBreed(rawName) {
  if (!rawName) return "Unknown";
  const lower = String(rawName).toLowerCase().trim();
  if (lower.includes("malnad") || lower.includes("malenadu")) return "Malnad Gidda";
  if (lower.includes("hallikar")) return "Hallikar";
  if (lower.includes("gir")) return "Gir";
  if (lower.includes("deoni")) return "Deoni";
  if (lower.includes("kankrej")) return "Kankrej";
  if (lower.includes("bargur")) return "Bargur";
  if (lower.includes("sahival") || lower.includes("sahiwal")) return "Sahiwal";
  if (lower.includes("mix") || lower.includes("cross")) return "Mix / Cross";
  return rawName; 
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeCattle: 0, femaleCattle: 0, maleCattle: 0, avgMilkYieldPerDay: 0, avgMilkSoldPerDay: 0,
    newBorn12M: 0, calfMortality12M: 0, calfMortalityRate: 0, pureBredRate: 0, activeDattuYojana: 0,
    sponsorshipCoverage: 0, avgFeedingPerDay: 0, deathsLastYear: 0, soldLastYear: 0,
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

        const [cattleRes, milkRes, distRes, newBornRes, dattuRes, feedingRes, exitRes] = await Promise.all([
          getCattle(), getMilkYield(), getMilkDistribution(), getNewBorn(), getDattuYojana(), getFeeding(), getCattleExitLog(),
        ]);

        const cattle = toArray(cattleRes);
        const milkYield = toArray(milkRes);
        const milkDist = toArray(distRes);
        const newBorn = toArray(newBornRes);
        const dattu = toArray(dattuRes);
        const feeding = toArray(feedingRes);
        const exitLog = toArray(exitRes);

        const todayDate = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(todayDate.getFullYear() - 1);

        // --- CATTLE PROCESSING ---
        const cattleMap = new Map();
        cattle.forEach(c => {
           if(c.tag) cattleMap.set(String(c.tag).toLowerCase().trim(), c);
           if(c.id) cattleMap.set(String(c.id).toLowerCase().trim(), c);
        });

        let activeCount = 0, femaleCount = 0, maleCount = 0;
        const breedCounts = {};
        const catCounts = { "Cows": 0, "Heifers": 0, "Bulls": 0, "Calves": 0 };
        let pureBredCount = 0, totalBirths12M = 0;

        cattle.forEach(c => {
          const status = String(c.status || "").toLowerCase().trim();
          const dob = c.dob ? new Date(c.dob) : null;
          const stdBreed = normalizeBreed(c.breed);
          
          if (status === "active") {
            activeCount++;
            const gender = String(c.gender || "").toLowerCase();
            if (gender.startsWith("f")) femaleCount++;
            else if (gender.startsWith("m")) maleCount++;

            breedCounts[stdBreed] = (breedCounts[stdBreed] || 0) + 1;

            const cat = String(c.category || c.cattleType || "").toLowerCase();
            if (cat.includes("cow")) catCounts["Cows"]++;
            else if (cat.includes("heifer")) catCounts["Heifers"]++;
            else if (cat.includes("bull") || cat.includes("ox")) catCounts["Bulls"]++;
            else if (cat.includes("calf")) catCounts["Calves"]++;
          }

          if (dob && dob >= oneYearAgo && dob <= todayDate) {
            totalBirths12M++;
            if (stdBreed !== "Mix / Cross" && stdBreed !== "Unknown") pureBredCount++;
          }
        });

        const newBornLogCount = newBorn.filter(nb => {
           const d = new Date(nb.date || nb.dateOfBirth);
           return !isNaN(d) && d >= oneYearAgo && d <= todayDate;
        }).length;

        const finalBirthCount = Math.max(totalBirths12M, newBornLogCount);
        const pureRate = finalBirthCount > 0 ? ((pureBredCount / finalBirthCount) * 100).toFixed(0) : 0;

        const activeDattu = dattu.filter(d => String(d.schemeStatus || "").toLowerCase() === "active").length;
        const sponsorRate = activeCount > 0 ? ((activeDattu / activeCount) * 100).toFixed(1) : 0;

        const yieldByDate = new Map();
        milkYield.forEach(row => {
          const day = String(row.date || "").slice(0, 10);
          if (day) yieldByDate.set(day, (yieldByDate.get(day) || 0) + (Number(row.totalYield) || 0));
        });
        const yieldDays = Array.from(yieldByDate.values());
        const avgYield = yieldDays.length > 0 ? yieldDays.reduce((a, b) => a + b, 0) / yieldDays.length : 0;

        const soldByDate = new Map();
        milkDist.forEach(row => {
          const day = String(row.date || "").slice(0, 10);
          if (day) soldByDate.set(day, (soldByDate.get(day) || 0) + (Number(row.outPassQty) || 0));
        });
        const soldDays = Array.from(soldByDate.values());
        const avgSold = soldDays.length > 0 ? soldDays.reduce((a, b) => a + b, 0) / soldDays.length : 0;

        const feedByDate = new Map();
        feeding.forEach(row => {
           const day = String(row.date || "").slice(0, 10);
           if (day) feedByDate.set(day, (feedByDate.get(day) || 0) + (Number(row.quantityKg || row.totalKg) || 0));
        });
        const feedDays = Array.from(feedByDate.values());
        const avgFeed = feedDays.length > 0 ? feedDays.reduce((a, b) => a + b, 0) / feedDays.length : 0;

        let deaths12m = 0, sold12m = 0, calfDeaths12m = 0;
        exitLog.forEach(log => {
          const exitDate = new Date(log.date);
          if (!isNaN(exitDate) && exitDate >= oneYearAgo && exitDate <= todayDate) {
            const reason = String(log.reason || "").toLowerCase();
            const tag = String(log.cattleId || "").toLowerCase().trim();

            if (reason.includes("death") || reason.includes("died") || reason.includes("mortality") || reason.includes("expired")) {
              deaths12m++;
              const animal = cattleMap.get(tag);
              if (animal) {
                  const cat = String(animal.category || "").toLowerCase();
                  if (cat.includes("calf")) calfDeaths12m++;
              }
            } else if (reason.includes("sold") || reason.includes("sale")) {
              sold12m++;
            }
          }
        });

        const mortalityRate = finalBirthCount > 0 ? ((calfDeaths12m / finalBirthCount) * 100).toFixed(1) : 0;

        setStats({
          activeCattle: activeCount, femaleCattle: femaleCount, maleCattle: maleCount,
          avgMilkYieldPerDay: avgYield, avgMilkSoldPerDay: avgSold, newBorn12M: finalBirthCount,
          calfMortality12M: calfDeaths12m, calfMortalityRate: mortalityRate, pureBredRate: pureRate,
          activeDattuYojana: activeDattu, sponsorshipCoverage: sponsorRate, avgFeedingPerDay: avgFeed,
          deathsLastYear: deaths12m, soldLastYear: sold12m,
        });

        const breedChart = Object.keys(breedCounts).map(k => ({ name: k, count: breedCounts[k] })).sort((a,b) => b.count - a.count); 
        setBreedData(breedChart);

        const catChart = [
          { name: "Cows", count: catCounts["Cows"], color: "#3b82f6" }, 
          { name: "Heifers", count: catCounts["Heifers"], color: "#8b5cf6" },
          { name: "Calves", count: catCounts["Calves"], color: "#10b981" },
          { name: "Bulls", count: catCounts["Bulls"], color: "#f59e0b" }
        ];
        setCategoryData(catChart.filter(c => c.count > 0));

      } catch (err) {
        console.error("Dashboard Load Error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading Dashboard...</div>;
  if (error) return <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>{error}</div>;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1600px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#1e293b", margin: 0, letterSpacing: "-0.5px" }}>Dashboard</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "0.95rem" }}>Operations overview & key performance indicators.</p>
        </div>
        <div style={{ background: "#fff", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.9rem", color: "#475569", fontWeight: "600", whiteSpace: "nowrap", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          Date: <span style={{ color: "#1e293b" }}>{new Date().toLocaleDateString('en-GB')}</span>
        </div>
      </div>

      {/* --- HERO METRICS (UPDATED: Compact Grid 4-up) --- */}
      {/* Reduced minmax from 260px to 220px to allow 4 cards in one row on desktop */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        
        {/* 1. Active Cattle (Light Blue) */}
        <HeroCard 
          title="ACTIVE CATTLE" 
          value={stats.activeCattle} 
          trend="Total Head Count"
          icon={Icons.cow} 
          bg="linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" // Light Blue Gradient
          iconColor="#3b82f6" // Medium Blue Icon
          textColor="#1e3a8a" // Dark Blue Text
          trendColor="#60a5fa" // Lighter Blue Trend Color
        />

        {/* 2. Purebred Rate (Light Orange or Light Green) */}
        <HeroCard 
          title="PUREBRED RATE" 
          value={`${stats.pureBredRate}%`} 
          trend="Of Total Births (12M)"
          icon={Icons.ribbon} 
          bg={stats.pureBredRate < 75 ? "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)" : "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"}
          iconColor={stats.pureBredRate < 75 ? "#f59e0b" : "#10b981"}
          textColor={stats.pureBredRate < 75 ? "#9a3412" : "#065f46"}
          trendColor={stats.pureBredRate < 75 ? "#fbbf24" : "#34d399"}
        />

        {/* 3. Calf Mortality (Light Red or Light Green) */}
        <HeroCard 
          title="CALF MORTALITY (12M)" 
          value={`${stats.calfMortality12M} (${stats.calfMortalityRate}%)`} 
          trend="Annual Rate"
          icon={Icons.alert} 
          bg={stats.calfMortalityRate > 5 ? "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)" : "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"}
          iconColor={stats.calfMortalityRate > 5 ? "#ef4444" : "#10b981"}
          textColor={stats.calfMortalityRate > 5 ? "#991b1b" : "#065f46"}
          trendColor={stats.calfMortalityRate > 5 ? "#f87171" : "#34d399"}
        />

        {/* 4. Active Sponsors (Light Purple) */}
        <HeroCard 
          title="ACTIVE SPONSORS" 
          value={stats.activeDattuYojana} 
          trend={`${stats.sponsorshipCoverage}% Coverage`}
          icon={Icons.rupee} 
          bg="linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)" // Light Purple Gradient
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

      {/* --- KEY OBSERVATIONS --- */}
      <div style={{ 
        background: "#fffbeb", 
        border: "1px solid #fcd34d", 
        padding: "1.5rem", 
        borderRadius: "12px", 
        marginBottom: "2.5rem", 
        display: "flex", 
        gap: "15px"
      }}>
        <div style={{ fontSize: "1.5rem" }}>📌</div>
        <div>
           <h3 style={{ margin: "0 0 8px 0", fontSize: "1rem", fontWeight: "700", color: "#92400e", textTransform: "uppercase" }}>Key Observations</h3>
           <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "#b45309", fontSize: "0.95rem", lineHeight: "1.6" }}>
             {stats.pureBredRate < 75 && <li><strong>Purebred rate is low ({stats.pureBredRate}%)</strong>. Target: 75-80%.</li>}
             {stats.sponsorshipCoverage < 60 && <li><strong>Sponsorship coverage is low ({stats.sponsorshipCoverage}%)</strong>. Target: 50-60%.</li>}
             {stats.pureBredRate >= 75 && stats.sponsorshipCoverage >= 60 && <li>All Key Performance Indicators are within target ranges. Excellent work!</li>}
           </ul>
        </div>
      </div>

      {/* --- CHARTS --- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
        {/* Breed Chart */}
        <div style={chartCardStyle}>
          <h3 style={chartTitleStyle}>Breed Distribution</h3>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer>
              <BarChart data={breedData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                  <LabelList dataKey="count" position="top" style={{ fill: '#475569', fontSize: '0.75rem', fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Chart */}
        <div style={chartCardStyle}>
          <h3 style={chartTitleStyle}>Herd Composition</h3>
          <div style={{ height: "300px", width: "100%", position: "relative" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="count" nameKey="name">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', fontWeight: '600' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -60%)", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: "2rem", fontWeight: "800", color: "#1e293b", lineHeight: 1 }}>{stats.activeCattle}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Head</div>
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
        <div style={{ background: "rgba(255,255,255,0.5)", padding: "8px", borderRadius: "12px", backdropFilter: "blur(4px)" }}>
          <svg viewBox="0 0 24 24" fill={iconColor} width="22" height="22">{icon}</svg>
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ fontSize: "0.8rem", opacity: 0.8, fontWeight: "700", marginBottom: "4px", letterSpacing: "0.5px", textTransform:"uppercase" }}>{title}</div>
        <div style={{ fontSize: "2rem", fontWeight: "800", letterSpacing: "-1px", lineHeight: 1.1 }}>{value}</div>
        <div style={{ marginTop: "6px", fontSize: "0.8rem", color: trendColor, fontWeight: "600" }}>{trend}</div>
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

const sectionTitleStyle = { fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "1rem", marginTop: "1rem" };
const chartCardStyle = { background: "#fff", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" };
const chartTitleStyle = { margin: "0 0 1.5rem 0", fontSize: "1.1rem", fontWeight: "700", color: "#1e293b" };