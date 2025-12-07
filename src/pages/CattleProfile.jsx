// src/pages/CattleProfile.jsx
import React, { useState } from "react";

/**
 * NOTE: All data here is MOCK data just for UI.
 * Later we will replace with real data from Google Sheets / code.gs.
 */

const MOCK_PROFILE = {
  animalId: "A-631228",
  tagNo: "631228",
  name: "Vasundara",
  photoUrl: "", // you can plug a real photo URL later
  breed: "Hallikar",
  sex: "Cow",
  dob: "2019-03-15",
  ageYears: 6,
  shed: "Malenadu Gidda Shed",
  status: "Active",
  color: "Black",
  deliveriesCount: 3,
  totalCalves: 4,
  maleCalves: 2,
  femaleCalves: 2,
  lastCalvingDate: "2024-08-22",
  sire: {
    animalId: "A-420001",
    tagNo: "420001",
    name: "Rudra",
    breed: "Hallikar",
    status: "Active Bull",
  },
  dam: {
    animalId: "A-410010",
    tagNo: "410010",
    name: "Ganga",
    breed: "Hallikar",
    status: "Active Cow",
  },
  grandsires: {
    sireSire: {
      animalId: "A-300101",
      name: "Mahadeva",
      breed: "Hallikar",
      status: "Active",
    },
    sireDam: {
      animalId: "A-300102",
      name: "Bhavani",
      breed: "Hallikar",
      status: "Sold",
    },
    damSire: {
      animalId: "A-300103",
      name: "Keshava",
      breed: "Hallikar",
      status: "Dead",
    },
    damDam: {
      animalId: "A-300104",
      name: "Kamakshi",
      breed: "Hallikar",
      status: "Active",
    },
  },
  calvingHistory: [
    {
      calvingId: "C-001",
      parity: 1,
      calvingDate: "2021-06-10",
      sireName: "Rudra",
      noOfCalves: 1,
      remarks: "Normal delivery",
    },
    {
      calvingId: "C-002",
      parity: 2,
      calvingDate: "2022-11-18",
      sireName: "Rudra",
      noOfCalves: 1,
      remarks: "Normal delivery",
    },
    {
      calvingId: "C-003",
      parity: 3,
      calvingDate: "2024-08-22",
      sireName: "Rudra",
      noOfCalves: 2,
      remarks: "Twins, both healthy",
    },
  ],
  offspring: [
    {
      animalId: "A-700101",
      tagNo: "700101",
      name: "Shiva",
      sex: "Male",
      breed: "Hallikar",
      dob: "2021-06-10",
      status: "Active",
    },
    {
      animalId: "A-700201",
      tagNo: "700201",
      name: "Lakshmi",
      sex: "Female",
      breed: "Hallikar",
      dob: "2022-11-18",
      status: "Active",
    },
    {
      animalId: "A-700301",
      tagNo: "700301",
      name: "Krishna",
      sex: "Male",
      breed: "Hallikar",
      dob: "2024-08-22",
      status: "Calf",
    },
    {
      animalId: "A-700302",
      tagNo: "700302",
      name: "Radha",
      sex: "Female",
      breed: "Hallikar",
      dob: "2024-08-22",
      status: "Calf",
    },
  ],
  tagHistory: [
    {
      tagNo: "631228",
      fromDate: "2022-01-01",
      toDate: "",
      reason: "Current tag",
    },
    {
      tagNo: "521110",
      fromDate: "2019-03-15",
      toDate: "2021-12-15",
      reason: "Lost while grazing",
    },
  ],
};

export default function CattleProfile() {
  const [currentTab, setCurrentTab] = useState("overview");

  const isCow = MOCK_PROFILE.sex.toLowerCase() === "cow";

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "lineage", label: "Lineage" },
    ...(isCow ? [{ id: "calving", label: "Calving History" }] : []),
    { id: "offspring", label: "Offspring / Progeny" },
    { id: "tags", label: "Tag History" },
  ];

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Cattle Profile</h1>
          <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
            AnimalID {MOCK_PROFILE.animalId} &bull; Tag {MOCK_PROFILE.tagNo}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button style={secondaryButtonStyle}>Back to Master</button>
          <button style={primaryButtonStyle}>Edit Basic Details</button>
        </div>
      </header>

      {/* Top summary card */}
      <section style={summaryCardStyle}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={photoBoxStyle}>
            {MOCK_PROFILE.photoUrl ? (
              <img
                src={MOCK_PROFILE.photoUrl}
                alt={MOCK_PROFILE.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "0.75rem",
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: "2.5rem",
                  color: "#9ca3af",
                }}
              >
                🐄
              </span>
            )}
          </div>
          <div style={{ display: "grid", gap: "0.1rem" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>
              {MOCK_PROFILE.name}
            </div>
            <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
              {MOCK_PROFILE.breed} &bull; {MOCK_PROFILE.sex} &bull;{" "}
              {MOCK_PROFILE.color}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              DoB: {MOCK_PROFILE.dob} ({MOCK_PROFILE.ageYears} years) &bull;
              Shed: {MOCK_PROFILE.shed}
            </div>
            <div style={{ marginTop: "0.3rem", display: "flex", gap: "0.5rem" }}>
              <span style={statusPillStyle(MOCK_PROFILE.status)}>
                {MOCK_PROFILE.status}
              </span>
              <span style={chipStyle}>
                Deliveries: {MOCK_PROFILE.deliveriesCount}
              </span>
              <span style={chipStyle}>
                Calves: {MOCK_PROFILE.totalCalves} (M:
                {MOCK_PROFILE.maleCalves} / F:{MOCK_PROFILE.femaleCalves})
              </span>
              <span style={chipStyle}>
                Last calving: {MOCK_PROFILE.lastCalvingDate}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div style={{ marginTop: "1rem", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #e5e7eb" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCurrentTab(tab.id)}
              style={
                currentTab === tab.id
                  ? activeTabButtonStyle
                  : inactiveTabButtonStyle
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {currentTab === "overview" && <OverviewTab profile={MOCK_PROFILE} />}
      {currentTab === "lineage" && <LineageTab profile={MOCK_PROFILE} />}
      {currentTab === "calving" && isCow && (
        <CalvingTab profile={MOCK_PROFILE} />
      )}
      {currentTab === "offspring" && (
        <OffspringTab profile={MOCK_PROFILE} />
      )}
      {currentTab === "tags" && <TagHistoryTab profile={MOCK_PROFILE} />}
    </div>
  );
}

/* ---- TAB COMPONENTS ---- */

function OverviewTab({ profile }) {
  return (
    <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1.4fr 1fr" }}>
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Basic Details</h2>
        <div style={twoColGrid}>
          <DetailRow label="Animal ID" value={profile.animalId} />
          <DetailRow label="Current Tag" value={profile.tagNo} />
          <DetailRow label="Breed" value={profile.breed} />
          <DetailRow label="Sex" value={profile.sex} />
          <DetailRow label="Colour" value={profile.color} />
          <DetailRow label="Shed" value={profile.shed} />
          <DetailRow label="Date of Birth" value={profile.dob} />
          <DetailRow
            label="Age"
            value={`${profile.ageYears} years (approx.)`}
          />
          <DetailRow label="Status" value={profile.status} />
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Reproduction Summary</h2>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <SummaryMetric
            label="Number of deliveries"
            value={profile.deliveriesCount}
          />
          <SummaryMetric
            label="Total calves"
            value={`${profile.totalCalves} (M: ${profile.maleCalves} / F: ${profile.femaleCalves})`}
          />
          <SummaryMetric
            label="Last calving date"
            value={profile.lastCalvingDate || "—"}
          />
          <SummaryMetric label="Primary Sire used" value={profile.sire?.name} />
        </div>
        <button style={{ ...secondaryButtonStyle, marginTop: "0.75rem" }}>
          View detailed calving records
        </button>
      </div>
    </div>
  );
}

function LineageTab({ profile }) {
  const { sire, dam, grandsires } = profile;

  return (
    <div style={cardStyle}>
      <h2 style={cardTitleStyle}>Lineage (Family Tree - Upwards)</h2>
      <p style={mutedTextStyle}>
        This view shows the parents and grand-parents of the selected cattle.
        Later we will populate this from your master data and calving records.
      </p>

      {/* Parents */}
      <div style={{ marginTop: "0.75rem", marginBottom: "1rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <MiniCard title="Sire (Father)" data={sire} />
          <MiniCard title="Dam (Mother)" data={dam} />
        </div>
      </div>

      {/* Grandparents */}
      <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>
        Grandparents
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "0.75rem",
        }}
      >
        <MiniCard title="Sire's Sire" data={grandsires.sireSire} small />
        <MiniCard title="Sire's Dam" data={grandsires.sireDam} small />
        <MiniCard title="Dam's Sire" data={grandsires.damSire} small />
        <MiniCard title="Dam's Dam" data={grandsires.damDam} small />
      </div>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        <button style={primaryButtonStyle}>Edit Lineage</button>
        <button style={secondaryButtonStyle}>Open Pedigree Viewer</button>
      </div>
    </div>
  );
}

function CalvingTab({ profile }) {
  const history = profile.calvingHistory || [];

  return (
    <div style={cardStyle}>
      <h2 style={cardTitleStyle}>Calving History</h2>
      <p style={mutedTextStyle}>
        One row per delivery. Later, these records will be pulled from the
        dedicated CalvingHistory sheet.
      </p>

      {/* Summary chips */}
      <div style={{ marginBottom: "0.75rem", display: "flex", gap: "0.5rem" }}>
        <span style={chipStyle}>Total Calvings: {profile.deliveriesCount}</span>
        <span style={chipStyle}>
          Calves: {profile.totalCalves} (M:{profile.maleCalves} / F:
          {profile.femaleCalves})
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Parity</th>
              <th style={thStyle}>Calving Date</th>
              <th style={thStyle}>Sire</th>
              <th style={thStyle}>No. of Calves</th>
              <th style={thStyle}>Remarks</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={6} style={emptyCellStyle}>
                  No calving records yet.
                </td>
              </tr>
            ) : (
              history.map((row) => (
                <tr key={row.calvingId}>
                  <td style={tdStyle}>{row.parity}</td>
                  <td style={tdStyle}>{row.calvingDate}</td>
                  <td style={tdStyle}>{row.sireName}</td>
                  <td style={tdStyle}>{row.noOfCalves}</td>
                  <td style={tdStyle}>{row.remarks}</td>
                  <td style={tdStyle}>
                    <button style={linkButtonStyle}>View calves</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "0.75rem" }}>
        <button style={primaryButtonStyle}>Add Calving Record</button>
      </div>
    </div>
  );
}

function OffspringTab({ profile }) {
  const offspring = profile.offspring || [];

  return (
    <div style={cardStyle}>
      <h2 style={cardTitleStyle}>Offspring / Progeny</h2>
      <p style={mutedTextStyle}>
        All calves where this animal is recorded as the dam (for cows) or sire
        (for bulls).
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Animal ID</th>
              <th style={thStyle}>Tag No</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Sex</th>
              <th style={thStyle}>Breed</th>
              <th style={thStyle}>Date of Birth</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offspring.length === 0 ? (
              <tr>
                <td colSpan={8} style={emptyCellStyle}>
                  No offspring recorded yet.
                </td>
              </tr>
            ) : (
              offspring.map((row) => (
                <tr key={row.animalId}>
                  <td style={tdStyle}>{row.animalId}</td>
                  <td style={tdStyle}>{row.tagNo}</td>
                  <td style={tdStyle}>{row.name}</td>
                  <td style={tdStyle}>{row.sex}</td>
                  <td style={tdStyle}>{row.breed}</td>
                  <td style={tdStyle}>{row.dob}</td>
                  <td style={tdStyle}>{row.status}</td>
                  <td style={tdStyle}>
                    <button style={linkButtonStyle}>Open profile</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TagHistoryTab({ profile }) {
  const history = profile.tagHistory || [];

  return (
    <div style={cardStyle}>
      <h2 style={cardTitleStyle}>Tag History</h2>
      <p style={mutedTextStyle}>
        Shows all tag numbers used for this animal, with dates and reasons. This
        will later be driven by the TagHistory sheet.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Tag No</th>
              <th style={thStyle}>From Date</th>
              <th style={thStyle}>To Date</th>
              <th style={thStyle}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={4} style={emptyCellStyle}>
                  No tag history available.
                </td>
              </tr>
            ) : (
              history.map((row, idx) => (
                <tr key={idx}>
                  <td style={tdStyle}>{row.tagNo}</td>
                  <td style={tdStyle}>{row.fromDate}</td>
                  <td style={tdStyle}>{row.toDate || "—"}</td>
                  <td style={tdStyle}>{row.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---- SMALL REUSABLE PIECES ---- */

function DetailRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: "0.9rem", color: "#111827" }}>
        {value || "—"}
      </div>
    </div>
  );
}

function SummaryMetric({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: "0.95rem", fontWeight: 500 }}>{value || "—"}</div>
    </div>
  );
}

function MiniCard({ title, data, small }) {
  if (!data) {
    return (
      <div style={miniCardStyle}>
        <div style={miniTitleStyle}>{title}</div>
        <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Unknown</div>
      </div>
    );
  }

  return (
    <div style={miniCardStyle}>
      <div style={miniTitleStyle}>{title}</div>
      <div style={{ fontSize: small ? "0.85rem" : "0.95rem", fontWeight: 500 }}>
        {data.name || data.tagNo}
      </div>
      {data.tagNo && (
        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
          Tag: {data.tagNo}
        </div>
      )}
      {data.breed && (
        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
          {data.breed}
        </div>
      )}
      {data.status && (
        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
          Status: {data.status}
        </div>
      )}
      <button style={{ ...linkButtonStyle, marginTop: "0.25rem" }}>
        Open profile
      </button>
    </div>
  );
}

/* ---- STYLES ---- */

const primaryButtonStyle = {
  padding: "0.4rem 0.9rem",
  borderRadius: "999px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontSize: "0.85rem",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  padding: "0.4rem 0.9rem",
  borderRadius: "999px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#374151",
  fontSize: "0.85rem",
  fontWeight: 500,
  cursor: "pointer",
};

const summaryCardStyle = {
  background: "#ffffff",
  borderRadius: "0.75rem",
  padding: "1rem 1.25rem",
  boxShadow: "0 10px 25px rgba(15,23,42,0.04)",
};

const photoBoxStyle = {
  width: 88,
  height: 88,
  borderRadius: "0.75rem",
  background: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const chipStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.2rem 0.6rem",
  borderRadius: "999px",
  background: "#eef2ff",
  color: "#3730a3",
  fontSize: "0.75rem",
};

const statusPillStyle = (status) => ({
  ...chipStyle,
  background:
    status === "Active"
      ? "rgba(22,163,74,0.1)"
      : status === "Dead"
      ? "rgba(239,68,68,0.1)"
      : "rgba(148,163,184,0.15)",
  color:
    status === "Active"
      ? "#166534"
      : status === "Dead"
      ? "#b91c1c"
      : "#334155",
});

const activeTabButtonStyle = {
  padding: "0.45rem 0.85rem",
  border: "none",
  borderBottom: "2px solid #2563eb",
  background: "transparent",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "#1f2937",
  cursor: "pointer",
};

const inactiveTabButtonStyle = {
  padding: "0.45rem 0.85rem",
  border: "none",
  borderBottom: "2px solid transparent",
  background: "transparent",
  fontSize: "0.85rem",
  fontWeight: 500,
  color: "#6b7280",
  cursor: "pointer",
};

const cardStyle = {
  background: "#ffffff",
  borderRadius: "0.75rem",
  padding: "1rem 1.25rem",
  boxShadow: "0 10px 25px rgba(15,23,42,0.03)",
};

const cardTitleStyle = {
  margin: 0,
  marginBottom: "0.5rem",
  fontSize: "1rem",
  fontWeight: 600,
};

const mutedTextStyle = {
  fontSize: "0.8rem",
  color: "#6b7280",
};

const twoColGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "0.75rem 1.25rem",
  marginTop: "0.5rem",
};

const miniCardStyle = {
  borderRadius: "0.75rem",
  border: "1px solid #e5e7eb",
  padding: "0.6rem 0.7rem",
  background: "#f9fafb",
};

const miniTitleStyle = {
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#6b7280",
  marginBottom: "0.15rem",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.85rem",
};

const thStyle = {
  textAlign: "left",
  padding: "0.5rem 0.6rem",
  borderBottom: "1px solid #e5e7eb",
  background: "#f9fafb",
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "#4b5563",
};

const tdStyle = {
  padding: "0.45rem 0.6rem",
  borderBottom: "1px solid #e5e7eb",
  color: "#111827",
};

const emptyCellStyle = {
  padding: "0.6rem 0.6rem",
  textAlign: "center",
  color: "#6b7280",
};

const linkButtonStyle = {
  border: "none",
  background: "none",
  color: "#2563eb",
  fontSize: "0.8rem",
  cursor: "pointer",
  padding: 0,
};
