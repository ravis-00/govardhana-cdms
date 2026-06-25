export default function ProgressToast({
  show,
  type = "loading",
  message = "Processing...",
}) {
  if (!show) return null;

  const config = {
    loading: {
      icon: "⏳",
      bg: "#fff7ed",
      border: "#fdba74",
      color: "#9a3412",
    },
    success: {
      icon: "✅",
      bg: "#f0fdf4",
      border: "#86efac",
      color: "#166534",
    },
    error: {
      icon: "⚠️",
      bg: "#fef2f2",
      border: "#fecaca",
      color: "#991b1b",
    },
    info: {
      icon: "ℹ️",
      bg: "#eff6ff",
      border: "#93c5fd",
      color: "#1d4ed8",
    },
  };

  const current = config[type] || config.loading;

  return (
    <div
      style={{
        position: "fixed",
        top: "72px",
        right: "24px",
        zIndex: 3000,
        background: current.bg,
        border: `1px solid ${current.border}`,
        color: current.color,
        borderRadius: "12px",
        padding: "0.85rem 1rem",
        boxShadow: "0 10px 25px rgba(15,23,42,0.15)",
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        fontWeight: 700,
        minWidth: "240px",
      }}
    >
      <span style={{ fontSize: "1.1rem" }}>{current.icon}</span>
      <span>{message}</span>
    </div>
  );
}