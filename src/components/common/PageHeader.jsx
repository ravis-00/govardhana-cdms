export default function PageHeader({ title, description, countText, action }) {
  return (
    <div style={styles.wrapper}>
      <div>
        <h1 style={styles.title}>{title}</h1>

        {description && <p style={styles.description}>{description}</p>}

        {countText && <div style={styles.count}>{countText}</div>}
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    flexWrap: "wrap",
    marginBottom: "1.25rem",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: 800,
    margin: 0,
    color: "#0f172a",
  },
  description: {
    margin: "4px 0 0",
    fontSize: "0.9rem",
    color: "#64748b",
  },
  count: {
    marginTop: "4px",
    fontSize: "0.9rem",
    color: "#64748b",
  },
};