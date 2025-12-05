// src/pages/Dashboard.jsx
import React from "react";

// TEMP – mock stats (replace with real API data later)
const DASHBOARD_DATA = {
  date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  summaryCards: [
    { label: "Active Cattle", value: 552 },
    { label: "Female Cattle", value: 342 },
    { label: "Hallikar Breed", value: 91 },
    { label: "Deoni Breed", value: 113 },
    { label: "Average Milk Yield / Day (L)", value: 126 },
    { label: "Average Milk Sold / Day (L)", value: 91 },
    { label: "New Born (Current Year)", value: 84 },
    { label: "Active Dattu Yojana", value: 30 },
  ],
  breeds: [
    { name: "Hallikar", count: 91 },
    { name: "Deoni", count: 113 },
    { name: "Kankrej", count: 58 },
    { name: "Malenadu Gidda", count: 87 },
    { name: "Gir", count: 124 },
    { name: "Mix", count: 54 },
  ],
  categories: [
    { name: "Cows", count: 194 },
    { name: "Heifers", count: 59 },
    { name: "Bulls", count: 140 },
    { name: "Calves", count: 159 },
  ],
};

export default function Dashboard() {
  const { date, summaryCards, breeds, categories } = DASHBOARD_DATA;

  const maxBreed = Math.max(...breeds.map((b) => b.count));
  const maxCategory = Math.max(...categories.map((c) => c.count));

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
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
            padding: "0.5rem 1rem",
            borderRadius: "999px",
            border: "1px solid #e5e7eb",
            fontSize: "0.9rem",
            background: "#f9fafb",
          }}
        >
          <span style={{ color: "#6b7280", marginRight: "0.4rem" }}>Date:</span>
          <strong>{formatDate(date)}</strong>
        </div>
      </header>

      {/* Summary cards */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.9rem",
          marginBottom: "1.5rem",
        }}
      >
        {summaryCards.map((card) => (
          <div key={card.label} style={cardStyle}>
            <div
              style={{
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#6b7280",
                marginBottom: "0.25rem",
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </section>

      {/* Charts row */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
          gap: "1.2rem",
          alignItems: "stretch",
        }}
      >
        {/* Breed distribution chart */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelTitleStyle}>Breed Distribution</div>
              <div style={panelSubtitleStyle}>
                Number of cattle in each breed
              </div>
            </div>
          </div>

          <div style={{ paddingTop: "0.5rem" }}>
            {/* Bars */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "0.75rem",
                height: "220px",
              }}
            >
              {breeds.map((breed) => {
                const heightPct = (breed.count / maxBreed) * 100;
                return (
                  <div
                    key={breed.name}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column-reverse",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        borderRadius: "0.75rem 0.75rem 0.25rem 0.25rem",
                        background:
                          "linear-gradient(180deg, #22c55e, #16a34a, #15803d)",
                        height: `${heightPct || 4}%`,
                        minHeight: "6px",
                        boxShadow: "0 6px 18px rgba(22,163,74,0.35)",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#4b5563",
                        textAlign: "center",
                        minHeight: "2.1rem",
                      }}
                    >
                      <div>{breed.name}</div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#111827",
                          marginTop: "0.05rem",
                        }}
                      >
                        {breed.count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cattle category chart */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelTitleStyle}>Cattle Categories</div>
              <div style={panelSubtitleStyle}>
                Distribution of cows, heifers, bulls & calves
              </div>
            </div>
          </div>

          <div style={{ paddingTop: "0.5rem" }}>
            {categories.map((cat) => {
              const widthPct = (cat.count / maxCategory) * 100;
              return (
                <div
                  key={cat.name}
                  style={{
                    marginBottom: "0.7rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.15rem",
                      fontSize: "0.8rem",
                      color: "#4b5563",
                    }}
                  >
                    <span>{cat.name}</span>
                    <span style={{ fontWeight: 600, color: "#111827" }}>
                      {cat.count}
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      background: "#e5e7eb",
                      borderRadius: "999px",
                      height: "0.6rem",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${widthPct || 4}%`,
                        height: "100%",
                        borderRadius: "999px",
                        background:
                          "linear-gradient(90deg,#3b82f6,#2563eb,#1d4ed8)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

/* Helpers & styles */

function formatDate(isoDate) {
  // Expecting YYYY-MM-DD
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

const cardStyle = {
  background: "#ffffff",
  borderRadius: "0.9rem",
  padding: "0.85rem 1rem",
  boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
  border: "1px solid #e5e7eb",
};

const panelStyle = {
  background: "#ffffff",
  borderRadius: "0.9rem",
  padding: "1rem 1.2rem 1.2rem",
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
  border: "1px solid #e5e7eb",
  minHeight: "260px",
};

const panelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "0.4rem",
};

const panelTitleStyle = {
  fontSize: "0.95rem",
  fontWeight: 600,
  color: "#111827",
};

const panelSubtitleStyle = {
  fontSize: "0.78rem",
  color: "#6b7280",
  marginTop: "0.1rem",
};
