// src/pages/Dashboard.jsx
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
  PieChart, Pie, Legend 
} from "recharts";

// --- 1. HELPERS ---

function formatNumber(value) {
  if (!Number.isFinite(value)) return 0;
  return value % 1 !== 0 ? value.toFixed(1) : value;
}

function toArray(result) {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.data)) return result.data;
  return [];
}

// Normalize Breeds
function normalizeBreed(rawName) {
  if (!rawName) return "Unknown";
  const lower = String(rawName).toLowerCase().trim();
  if (lower.includes("malnad") || lower.includes("malenadu") || lower.includes("malnadu")) return "Malnad Gidda";
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
    calfMortalityRate: 0, // <--- Added for % Calculation
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

        const currentYear = new Date().getFullYear();
        const todayDate = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(todayDate.getFullYear() - 1);

        // Lookup Map
        const cattleMap = new Map();
        cattle.forEach(c => {
            if(c.tag) cattleMap.set(String(c.tag).toLowerCase().trim(), c);
            if(c.id) cattleMap.set(String(c.id).toLowerCase().trim(), c);
        });

        // --- CATTLE STATS ---
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
            if (stdBreed !== "Mix / Cross" && stdBreed !== "Unknown") {
              pureBredCount++;
            }
          }
        });

        const newBornLogCount = newBorn.filter(nb => {
           const d = new Date(nb.date || nb.dateOfBirth);
           return !isNaN(d) && d >= oneYearAgo && d <= todayDate;
        }).length;

        const finalBirthCount = Math.max(totalBirths12M, newBornLogCount);
        const pureRate = finalBirthCount > 0 
          ? ((pureBredCount / finalBirthCount) * 100).toFixed(0) 
          : 0;

        // --- DATTU ---
        const activeDattu = dattu.filter(d => String(d.schemeStatus || "").toLowerCase() === "active").length;
        const sponsorRate = activeCount > 0 
          ? ((activeDattu / activeCount) * 100).toFixed(1) 
          : 0;

        // --- MILK ---
        const yieldByDate = new Map();
        milkYield.forEach((row) => {
          const day = String(row.date || "").slice(0, 10);
          if (!day) return;
          const currentTotal = yieldByDate.get(day) || 0;
          yieldByDate.set(day, currentTotal + (Number(row.totalYield) || 0));
        });
        const yieldDays = Array.from(yieldByDate.values());
        const avgYield = yieldDays.length > 0 
           ? yieldDays.reduce((a, b) => a + b, 0) / yieldDays.length 
           : 0;

        const soldByDate = new Map();
        milkDist.forEach((row) => {
          const day = String(row.date || "").slice(0, 10);
          if (!day) return;
          const currentTotal = soldByDate.get(day) || 0;
          soldByDate.set(day, currentTotal + (Number(row.outPassQty) || 0));
        });
        const soldDays = Array.from(soldByDate.values());
        const avgSold = soldDays.length > 0 
           ? soldDays.reduce((a, b) => a + b, 0) / soldDays.length 
           : 0;

        // --- FEEDING ---
        const feedByDate = new Map();
        feeding.forEach(row => {
           const day = String(row.date || "").slice(0, 10);
           if (!day) return;
           const cur = feedByDate.get(day) || 0;
           feedByDate.set(day, cur + (Number(row.quantityKg || row.totalKg) || 0));
        });
        const feedDays = Array.from(feedByDate.values());
        const avgFeed = feedDays.length > 0 
           ? feedDays.reduce((a, b) => a + b, 0) / feedDays.length 
           : 0;

        // --- DEATHS & CALF MORTALITY ---
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
                  if (cat.includes("calf")) {
                      calfDeaths12m++;
                  }
              }
            } else if (reason.includes("sold") || reason.includes("sale") || reason.includes("auction") || reason.includes("given")) {
              sold12m++;
            }
          }
        });

        // 🔥 CALCULATE MORTALITY PERCENTAGE
        // Formula: (Dead Calves / Total Born) * 100
        const mortalityRate = finalBirthCount > 0 
            ? ((calfDeaths12m / finalBirthCount) * 100).toFixed(1) 
            : 0;

        setStats({
          activeCattle: activeCount,
          femaleCattle: femaleCount,
          maleCattle: maleCount,
          avgMilkYieldPerDay: avgYield,
          avgMilkSoldPerDay: avgSold,
          newBorn12M: finalBirthCount,
          calfMortality12M: calfDeaths12m,
          calfMortalityRate: mortalityRate, // <--- Store Rate
          pureBredRate: pureRate,
          activeDattuYojana: activeDattu,
          sponsorshipCoverage: sponsorRate,
          avgFeedingPerDay: avgFeed,
          deathsLastYear: deaths12m,
          soldLastYear: sold12m,
        });

        const breedChart = Object.keys(breedCounts).map(k => ({ name: k, count: breedCounts[k] }))
                                .sort((a,b) => b.count - a.count); 
        setBreedData(breedChart);

        const catChart = [
          { name: "Cows", count: catCounts["Cows"], color: "#2563eb" },
          { name: "Heifers", count: catCounts["Heifers"], color: "#9333ea" },
          { name: "Calves", count: catCounts["Calves"], color: "#059669" },
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

  const today = new Date().toLocaleDateString("en-GB");

  if (loading) return <div style={{ padding: "2rem" }}>Loading Dashboard...</div>;
  if (error) return <div style={{ padding: "2rem", color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "#111827" }}>Dashboard</h1>
        <div style={{ background: "#fff", padding: "6px 12px", borderRadius: "20px", border: "1px solid #d1d5db", fontSize: "0.85rem", fontWeight: "700", color: "#111827" }}>
          Date: {today}
        </div>
      </header>

      {/* STAT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        
        <StatCard title="ACTIVE CATTLE" value={stats.activeCattle} color="#2563eb" />
        <StatCard title="FEMALE CATTLE" value={stats.femaleCattle} color="#ec4899" />
        <StatCard title="MALE CATTLE" value={stats.maleCattle} color="#f59e0b" />
        
        <StatCard title="NEW BORN (12M)" value={stats.newBorn12M} color="#0ea5e9" />
        
        {/* 🔥 UPDATED CALF MORTALITY CARD */}
        {/* Shows Count + Percentage in brackets */}
        <StatCard 
          title="CALF MORTALITY (12M)" 
          value={`${stats.calfMortality12M} (${stats.calfMortalityRate}%)`} 
          color={stats.calfMortalityRate > 5 ? "#ef4444" : "#10b981"} // Red if > 5%, else Green
        />

        <StatCard 
          title="PUREBRED BIRTHS %" 
          value={`${stats.pureBredRate}%`} 
          color={stats.pureBredRate >= 80 ? "#16a34a" : "#ca8a04"} 
        />

        <StatCard title="AVG MILK / DAY (L)" value={formatNumber(stats.avgMilkYieldPerDay)} color="#059669" />
        <StatCard title="AVG MILK SOLD / DAY (L)" value={formatNumber(stats.avgMilkSoldPerDay)} color="#10b981" />
        <StatCard title="AVG FEEDING / DAY (KG)" value={formatNumber(stats.avgFeedingPerDay)} color="#d97706" />

        <StatCard title="SOLD (12M)" value={stats.soldLastYear} color="#f97316" />
        <StatCard title="DEATHS (12M)" value={stats.deathsLastYear} color="#ef4444" />
        
        <StatCard title="ACTIVE SPONSORSHIPS" value={stats.activeDattuYojana} color="#8b5cf6" />
        <StatCard 
          title="SPONSOR COVERAGE %" 
          value={`${stats.sponsorshipCoverage}%`} 
          color={stats.sponsorshipCoverage >= 20 ? "#8b5cf6" : "#ef4444"} 
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "1.5rem" }}>
        
        {/* Breed Bar Chart */}
        <div style={chartCardStyle}>
          <h3 style={chartTitleStyle}>Breed Distribution</h3>
          <div style={{ height: "350px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breedData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <XAxis dataKey="name" fontSize={11} interval={0} tick={{fill: '#374151', fontWeight: 600 }} angle={-45} textAnchor="end" height={70} />
                <YAxis fontSize={12} tick={{fill: '#374151', fontWeight: 600 }} /> 
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                   <LabelList dataKey="count" position="top" style={{ fill: '#111827', fontSize: '0.75rem', fontWeight: 'bold' }} />
                   {breedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Donut Chart */}
        <div style={chartCardStyle}>
          <h3 style={chartTitleStyle}>Cattle Categories</h3>
          <div style={{ height: "350px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60} 
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="name"
                  label={{ fill: '#000000', fontSize: 12, fontWeight: 'bold' }} 
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#000000', fontWeight: 'bold' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

/* --- COMPONENTS & STYLES --- */

function StatCard({ title, value, color }) {
  return (
    <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#374151", textTransform: "uppercase", marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ fontSize: "2rem", fontWeight: "800", color: "#111827" }}>{value}</div>
    </div>
  );
}

const chartCardStyle = { background: "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" };
const chartTitleStyle = { margin: "0 0 1.5rem 0", fontSize: "1rem", fontWeight: "700", color: "#111827" };

function getBarColor(index) {
  const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
  return colors[index % colors.length];
}