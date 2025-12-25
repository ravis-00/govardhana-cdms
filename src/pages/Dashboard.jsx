// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import {
  getCattle,
  getMilkYield,
  getNewBorn,
  getDattuYojana,
  getFeeding,
} from "../api/masterApi";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList 
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

// Normalize Breeds (Fix spelling variations)
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

        const [cattleRes, milkRes, newBornRes, dattuRes, feedingRes] = await Promise.all([
          getCattle(),
          getMilkYield(),
          getNewBorn(),
          getDattuYojana(),
          getFeeding(),
        ]);

        const cattle = toArray(cattleRes);
        const milkYield = toArray(milkRes);
        const newBorn = toArray(newBornRes);
        const dattu = toArray(dattuRes);
        const feeding = toArray(feedingRes);

        const currentYear = new Date().getFullYear();

        // --- CATTLE STATS ---
        let activeCount = 0;
        let femaleCount = 0;
        let maleCount = 0;
        const breedCounts = {};
        const catCounts = { "Cows": 0, "Heifers": 0, "Bulls": 0, "Calves": 0 };

        cattle.forEach(c => {
          const status = String(c.status || "").toLowerCase().trim();
          if (status === "active") {
            activeCount++;
            
            const gender = String(c.gender || "").toLowerCase();
            if (gender.startsWith("f")) femaleCount++;
            else if (gender.startsWith("m")) maleCount++;

            const stdBreed = normalizeBreed(c.breed);
            breedCounts[stdBreed] = (breedCounts[stdBreed] || 0) + 1;

            const cat = String(c.category || c.cattleType || "").toLowerCase();
            if (cat.includes("cow")) catCounts["Cows"]++;
            else if (cat.includes("heifer")) catCounts["Heifers"]++;
            else if (cat.includes("bull") || cat.includes("ox")) catCounts["Bulls"]++;
            else if (cat.includes("calf")) catCounts["Calves"]++;
          }
        });

        // --- MILK STATS ---
        const milkByDate = new Map();
        milkYield.forEach((row) => {
          const day = String(row.date || "").slice(0, 10);
          if (!day) return;
          const existing = milkByDate.get(day) || { yield: 0, sold: 0 };
          
          existing.yield += Number(row.dayTotalYield || row.dayTotalYeild || 0) || 0;
          existing.sold += Number(row.outPass || 0) || 0;
          
          milkByDate.set(day, existing);
        });

        const milkDays = Array.from(milkByDate.values());
        let avgYield = 0, avgSold = 0;
        if (milkDays.length > 0) {
           avgYield = milkDays.reduce((acc, d) => acc + d.yield, 0) / milkDays.length;
           avgSold = milkDays.reduce((acc, d) => acc + d.sold, 0) / milkDays.length;
        }

        // --- NEW BORN ---
        const bornThisYear = newBorn.filter(nb => {
           const d = new Date(nb.date || nb.dateOfBirth);
           return !isNaN(d) && d.getFullYear() === currentYear;
        }).length;

        // --- DATTU ---
        const activeDattu = dattu.filter(d => String(d.schemeStatus || "").toLowerCase() === "active").length;

        // --- FEEDING ---
        const feedByDate = new Map();
        feeding.forEach(row => {
           const day = String(row.date || "").slice(0, 10);
           if (!day) return;
           const cur = feedByDate.get(day) || 0;
           feedByDate.set(day, cur + (Number(row.totalKg) || 0));
        });
        const feedDays = Array.from(feedByDate.values());
        const avgFeed = feedDays.length > 0 
           ? feedDays.reduce((a, b) => a + b, 0) / feedDays.length 
           : 0;

        setStats({
          activeCattle: activeCount,
          femaleCattle: femaleCount,
          maleCattle: maleCount,
          avgMilkYieldPerDay: avgYield,
          avgMilkSoldPerDay: avgSold,
          newBornCurrentYear: bornThisYear,
          activeDattuYojana: activeDattu,
          avgFeedingPerDay: avgFeed,
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
        setCategoryData(catChart);

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
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, color: "#1f2937" }}>Dashboard</h1>
        <div style={{ background: "#fff", padding: "6px 12px", borderRadius: "20px", border: "1px solid #e5e7eb", fontSize: "0.85rem", fontWeight: "600", color: "#6b7280" }}>
          Date: {today}
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard title="ACTIVE CATTLE" value={stats.activeCattle} color="#2563eb" />
        <StatCard title="FEMALE CATTLE" value={stats.femaleCattle} color="#ec4899" />
        <StatCard title="MALE CATTLE" value={stats.maleCattle} color="#f59e0b" />
        <StatCard title="AVG MILK / DAY (L)" value={formatNumber(stats.avgMilkYieldPerDay)} color="#059669" />
        <StatCard title="AVG MILK SOLD (L)" value={formatNumber(stats.avgMilkSoldPerDay)} color="#10b981" />
        <StatCard title="NEW BORN (THIS YEAR)" value={stats.newBornCurrentYear} color="#0ea5e9" />
        <StatCard title="ACTIVE SPONSORSHIPS" value={stats.activeDattuYojana} color="#8b5cf6" />
        <StatCard title="AVG FEEDING (KG)" value={formatNumber(stats.avgFeedingPerDay)} color="#d97706" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "1.5rem" }}>
        
        {/* Breed Distribution Chart */}
        <div style={chartCardStyle}>
          <h3 style={chartTitleStyle}>Breed Distribution</h3>
          <div style={{ height: "350px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={breedData} 
                margin={{ top: 20, right: 30, left: 0, bottom: 60 }} 
              >
                <XAxis 
                  dataKey="name" 
                  fontSize={11} 
                  interval={0} 
                  tick={{fill: '#6b7280'}} 
                  angle={-45}        
                  textAnchor="end"   
                  height={70}        
                />
                <YAxis fontSize={12} tick={{fill: '#6b7280'}} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                   {/* This line adds the labels on top */}
                   <LabelList dataKey="count" position="top" style={{ fill: '#374151', fontSize: '0.75rem', fontWeight: 'bold' }} />
                   
                   {breedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                   ))}
                </Bar>

              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Progress Bars */}
        <div style={chartCardStyle}>
          <h3 style={chartTitleStyle}>Cattle Categories</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1rem 0" }}>
            {categoryData.map((cat) => (
              <div key={cat.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.9rem", fontWeight: "600", color: "#374151" }}>
                  <span>{cat.name}</span>
                  <span>{cat.count}</span>
                </div>
                <div style={{ width: "100%", height: "10px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ 
                    width: `${stats.activeCattle > 0 ? (cat.count / stats.activeCattle) * 100 : 0}%`, 
                    height: "100%", 
                    background: cat.color, 
                    borderRadius: "99px",
                    transition: "width 1s ease-in-out"
                  }}></div>
                </div>
              </div>
            ))}
            {categoryData.length === 0 && <div style={{color: "#ccc", textAlign:"center"}}>No Category Data</div>}
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
      <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#9ca3af", textTransform: "uppercase", marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ fontSize: "2rem", fontWeight: "800", color: "#1f2937" }}>{value}</div>
    </div>
  );
}

const chartCardStyle = { background: "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" };
const chartTitleStyle = { margin: "0 0 1.5rem 0", fontSize: "1rem", fontWeight: "700", color: "#374151" };

function getBarColor(index) {
  const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
  return colors[index % colors.length];
}