export default function FormActions({
  onCancel,
  submitText = "Save",
  cancelText = "Cancel",
  loading = false,
}) {
  return (
    <div style={styles.wrapper}>
      {onCancel && (
        <button type="button" onClick={onCancel} style={styles.cancel}>
          {cancelText}
        </button>
      )}

      <button type="submit" disabled={loading} style={styles.submit}>
        {loading ? "Saving..." : submitText}
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
    marginTop: "2rem",
  },
  cancel: {
    background: "#ffffff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.6rem 1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  submit: {
    background: "#ea580c",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "0.6rem 1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
};