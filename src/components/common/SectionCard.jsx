export default function SectionCard({ title, children, style = {} }) {
  return (
    <div style={{ ...styles.card, ...style }}>
      {title && <h3 style={styles.title}>{title}</h3>}
      {children}
    </div>
  );
}

const styles = {
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
    padding: "1rem",
    marginBottom: "1rem",
  },
  title: {
    fontSize: "0.85rem",
    fontWeight: 800,
    color: "#ea580c",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    borderBottom: "1px solid #fdba74",
    paddingBottom: "0.5rem",
    marginTop: 0,
    marginBottom: "1rem",
  },
};