export default function MetricCard({
  label,
  value,
  color = "#2563eb",
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderLeft: `4px solid ${color}`,
        borderRadius: "10px",
        padding: "0.65rem 0.9rem",
        minWidth: "105px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          fontSize: "0.7rem",
          color: "#64748b",
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "1.15rem",
          color: "#0f172a",
          fontWeight: 800,
        }}
      >
        {value}
      </div>
    </button>
  );
}