export default function StatusBadge({ value }) {
  const text = String(value || "-");
  const key = text.toLowerCase();

  let colors = {
    background: "#e2e8f0",
    color: "#334155",
  };

  if (key === "active") colors = { background: "#dcfce7", color: "#166534" };
  else if (key.includes("deactive")) colors = { background: "#f1f5f9", color: "#475569" };
  else if (key.includes("death") || key.includes("dead")) colors = { background: "#fee2e2", color: "#991b1b" };
  else if (key.includes("sold") || key.includes("sale")) colors = { background: "#ffedd5", color: "#9a3412" };
  else if (key.includes("reactivated")) colors = { background: "#dbeafe", color: "#1d4ed8" };
  else if (key.includes("born") || key.includes("birth")) colors = { background: "#dcfce7", color: "#166534" };
  else if (key.includes("donation")) colors = { background: "#ede9fe", color: "#5b21b6" };
  else if (key.includes("purchase")) colors = { background: "#fef3c7", color: "#92400e" };

  return (
    <span
      style={{
        ...colors,
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 800,
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
      }}
    >
      {key === "active" ? "● " : ""}
      {text}
    </span>
  );
}