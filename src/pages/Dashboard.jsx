import React, { useEffect, useState } from "react";
import {
  getCattle,
  getMilkYield,
  getMilkDistribution,
  getNewBorn,
  getDattuYojana,
  getFeeding,
  getCattleExitLog,
} from "../api/masterApi";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
  PieChart, Pie, Legend, CartesianGrid
} from "recharts";

// --- 1. ICONS (SVG) ---
const Icons = {
  cow: <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>,
  drop: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>,
  alert: <path d="M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z"/>,
  leaf: <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-5.5 4-8 4z"/>,
  rupee: <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z M11 7h2v2h-2zm0 4h2v6h-2z"/>, // Info/Coin style
  ribbon: <path d="M20 12l-5.11-5.11a1 1 0 0 0-.71-.29H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8.49a1 1 0 0 0 .71-.29L20 12zM5 16V7.41l4.29 4.29L5 16z"/> // Badge
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
    activeCattle: 0,
    femaleCattle: 0,
    maleCattle: 0,
    avgMilkYieldPerDay: 0,
    avgMilkSoldPerDay: 0,
    newBorn12M: 0,
    calfMortality12M: 0,
    calfMortalityRate: 0,
    pureBredRate: 0,
    activeDattuYojana: 0,
    sponsorshipCoverage: 0,
    avgFeedingPerDay: 0,
    deathsLastYear: 0,
    soldLastYear: 0,
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
          getCattle(),
          getMilkYield(),
          getMilkDistribution(),
          getNewBorn(),
          getDattuYojana(),
          getFeeding(),
          getCattleExitLog(),
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

        let activeCount = 0;
        let femaleCount = 0;
        let maleCount = 0;
        const breedCounts = {};
        const catCounts = { "Cows": 0, "Heifers": 0, "Bulls": 0, "Calves": 0 };
        let pureBredCount = 0;
        let totalBirths12M = 0;

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

        // Merge Newborn Log
        const newBornLogCount = newBorn.filter(nb => {
           const d = new Date(nb.date || nb.dateOfBirth);
           return !isNaN(d) && d >= oneYearAgo && d <= todayDate;
        }).length;

        const finalBirthCount = Math.max(totalBirths12M, newBornLogCount);
        const pureRate = finalBirthCount > 0 ? ((pureBredCount / finalBirthCount) * 100).toFixed(0) : 0;

        // --- DATTU ---
        const activeDattu = dattu.filter(d => String(d.schemeStatus || "").toLowerCase() === "active").length;
        const sponsorRate = activeCount > 0 ? ((activeDattu / activeCount) * 100).toFixed(1) : 0;

        // --- MILK ---
        const yieldByDate = new Map();
        milkYield.forEach(row => {
          const day = String(row.date || "").slice(0, 10);
          if (!day) return;
          yieldByDate.set(day, (yieldByDate.get(day) || 0) + (Number(row.totalYield) || 0));
        });
        const yieldDays = Array.from(yieldByDate.values());
        const avgYield = yieldDays.length > 0 ? yieldDays.reduce((a, b) => a + b, 0) / yieldDays.length : 0;

        const soldByDate = new Map();
        milkDist.forEach(row => {
          const day = String(row.date || "").slice(0, 10);
          if (!day) return;
          soldByDate.set(day, (soldByDate.get(day) || 0) + (Number(row.outPassQty) || 0));
        });
        const soldDays = Array.from(soldByDate.values());
        const avgSold = soldDays.length > 0 ? soldDays.reduce((a, b) => a + b, 0) / soldDays.length : 0;

        // --- FEEDING ---
        const feedByDate = new Map();
        feeding.forEach(row => {
           const day = String(row.date || "").slice(0, 10);
           if (!day) return;
           feedByDate.set(day, (feedByDate.get(day) || 0) + (Number(row.quantityKg || row.totalKg) || 0));
        });
        const feedDays = Array.from(feedByDate.values());
        const avgFeed = feedDays.length > 0 ? feedDays.reduce((a, b) => a + b, 0) / feedDays.length : 0;

        // --- DEATHS & MORTALITY ---
        let deaths12m = 0;
        let sold12m = 0;
        let calfDeaths12m = 0;

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
          activeCattle: activeCount,
          femaleCattle: femaleCount,
          maleCattle: maleCount,
          avgMilkYieldPerDay: avgYield,
          avgMilkSoldPerDay: avgSold,
          newBorn12M: finalBirthCount,
          calfMortality12M: calfDeaths12m,
          calfMortalityRate: mortalityRate,
          pureBredRate: pureRate,
          activeDattuYojana: activeDattu,
          sponsorshipCoverage: sponsorRate,
          avgFeedingPerDay: avgFeed,
          deathsLastYear: deaths12m,
          soldLastYear: sold12m,
        });

        const breedChart = Object.keys(breedCounts).map(k => ({ name: k, count: breedCounts[k] })).sort((a,b) => b.count - a.count); 
        setBreedData(breedChart);

        const catChart = [
          { name: "Cows", count: catCounts["Cows"], color: "#3b82f6" }, 
          { name: "Heifers", count: catCounts["Heifers"], color: "#a855f7" },
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

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading Dashboard...</div>;
  if (error) return <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>{error}</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1600px", margin: "0 auto", fontFamily: "'Segoe UI', sans-serif" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "#111827", margin: 0 }}>Dashboard</h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0 0", fontSize: "0.95rem" }}>Operations overview & key performance indicators.</p>
        </div>
        <div style={{ background: "#fff", padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "0.9rem", color: "#374151", fontWeight: "500" }}>
          Date: <strong>{new Date().toLocaleDateString('en-GB')}</strong>
        </div>
      </div>

      {/* --- TIER 1: HERO METRICS (4 CARDS) --- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        
        {/* 1. Active Cattle */}
        <HeroCard 
          title="ACTIVE CATTLE" 
          value={stats.activeCattle} 
          trend="Total Head Count"
          icon={Icons.cow} 
          color="#3b82f6" 
          bg="#eff6ff" 
        />

        {/* 2. Pure Breed % */}
        <HeroCard 
          title="PURE BREED %" 
          value={`${stats.pureBredRate}%`} 
          trend="Of Total Births (12M)"
          icon={Icons.ribbon} 
          // Orange if low, Green if high
          color={stats.pureBredRate < 75 ? "#f59e0b" : "#10b981"} 
          bg={stats.pureBredRate < 75 ? "#fffbeb" : "#ecfdf5"}
          isRisk={stats.pureBredRate < 75}
        />

        {/* 3. Calf Mortality */}
        <HeroCard 
          title="CALF MORTALITY (12M)" 
          value={`${stats.calfMortality12M} (${stats.calfMortalityRate}%)`} 
          trend="Annual Rate"
          icon={Icons.alert} 
          color={stats.calfMortalityRate > 5 ? "#ef4444" : "#10b981"} 
          bg={stats.calfMortalityRate > 5 ? "#fef2f2" : "#f0fdf4"}
          isRisk={stats.calfMortalityRate > 5}
        />

        {/* 4. Active Sponsors */}
        <HeroCard 
          title="ACTIVE SPONSORS" 
          value={stats.activeDattuYojana} 
          trend={`${stats.sponsorshipCoverage}% Coverage`}
          icon={Icons.rupee} 
          color={stats.sponsorshipCoverage < 50 ? "#f59e0b" : "#8b5cf6"} 
          bg={stats.sponsorshipCoverage < 50 ? "#fffbeb" : "#f5f3ff"}
          isRisk={stats.sponsorshipCoverage < 50}
        />
      </div>

      {/* --- TIER 2: MINI METRICS (6 CARDS) --- */}
      <h3 style={sectionTitleStyle}>Detailed Demographics & Operations</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        
        {/* 1. Female Pop */}
        <MiniCard label="Female Population" value={stats.femaleCattle} />
        
        {/* 2. Male Pop */}
        <MiniCard label="Male Population" value={stats.maleCattle} />
        
        {/* 3. Newborn */}
        <MiniCard label="New Born (12M)" value={stats.newBorn12M} color="#0ea5e9" />
        
        {/* 4. Avg Milk Sold */}
        <MiniCard label="Avg Milk Sold / Day" value={`${formatNumber(stats.avgMilkSoldPerDay)} L`} color="#10b981" />
        
        {/* 5. Total Deaths */}
        <MiniCard label="Total Deaths (12M)" value={stats.deathsLastYear} color="#ef4444" />
        
        {/* 6. Avg Feeding */}
        <MiniCard label="Avg Feeding / Day" value={`${formatNumber(stats.avgFeedingPerDay)} Kg`} color="#d97706" />
      </div>

      {/* --- KEY OBSERVATIONS BOX --- */}
      <div style={{ 
        background: "#fffbeb", // Light yellow/amber
        borderLeft: "5px solid #f59e0b", // Amber accent
        padding: "1.5rem", 
        borderRadius: "8px", 
        marginBottom: "2.5rem", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <span style={{ fontSize: "1.5rem" }}>📌</span>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "#92400e", textTransform: "uppercase" }}>Key Observations</h3>
        </div>
        
        <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#b45309", fontSize: "0.95rem", lineHeight: "1.6" }}>
          {/* Logic to show/hide observations based on targets */}
          {stats.pureBredRate < 75 && (
            <li>
              <strong>Pure Breed % is low ({stats.pureBredRate}%)</strong> for a Breed development Gaushala (Target: 75-80%).
            </li>
          )}
          {stats.sponsorshipCoverage < 60 && (
            <li>
              <strong>Active Sponsors coverage is low ({stats.sponsorshipCoverage}%)</strong> for a non-profit organization (Target: 50-60%).
            </li>
          )}
          {stats.pureBredRate >= 75 && stats.sponsorshipCoverage >= 60 && (
            <li>All Key Performance Indicators are within target ranges.</li>
          )}
        </ul>
      </div>

      {/* --- TIER 3: CHARTS --- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "1.5rem" }}>
        
        {/* Breed Bar Chart */}
        <div style={chartCardStyle}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={chartTitleStyle}>Breed Distribution</h3>
          </div>
          <div style={{ height: "320px", width: "100%" }}>
            <ResponsiveContainer>
              <BarChart data={breedData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} dy={10} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={45}>
                  <LabelList dataKey="count" position="top" style={{ fill: '#374151', fontSize: '0.75rem', fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Donut Chart */}
        <div style={chartCardStyle}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={chartTitleStyle}>Herd Composition</h3>
          </div>
          <div style={{ height: "320px", width: "100%", position: "relative" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={85}
                  outerRadius={115}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="name"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: '600', color: '#374151' }} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Summary */}
            <div style={{ 
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -60%)", 
              textAlign: "center", pointerEvents: "none" 
            }}>
              <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#1e293b", lineHeight: 1 }}>{stats.activeCattle}</div>
              <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>Total Head</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function HeroCard({ title, value, trend, icon, color, bg }) {
  return (
    <div style={{ 
      background: "#fff", padding: "1.5rem", borderRadius: "16px", 
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      borderTop: `4px solid ${color}`, height: "100%"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div style={{ background: bg, color: color, padding: "10px", borderRadius: "12px" }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">{icon}</svg>
        </div>
      </div>
      <div>
        <div style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>{title}</div>
        <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#111827", letterSpacing: "-0.5px" }}>{value}</div>
        {trend && (
          <div style={{ marginTop: "8px", fontSize: "0.85rem", color: color, fontWeight: "500" }}>{trend}</div>
        )}
      </div>
    </div>
  );
}

function MiniCard({ label, value, subtext, color = "#334155" }) {
  return (
    <div style={{ 
      background: "#fff", padding: "1rem 1.25rem", borderRadius: "10px", 
      border: "1px solid #e2e8f0", textAlign: "left",
      display: "flex", flexDirection: "column", justifyContent: "center"
    }}>
      <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <div style={{ fontSize: "1.4rem", fontWeight: "700", color: color }}>{value}</div>
        {subtext && <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "500" }}>{subtext}</div>}
      </div>
    </div>
  );
}

const sectionTitleStyle = { fontSize: "0.85rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "1rem", marginTop: "1rem" };
const chartCardStyle = { background: "#fff", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", border: "1px solid #f1f5f9" };
const chartTitleStyle = { margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#1e293b" };