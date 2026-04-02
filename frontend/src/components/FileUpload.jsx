import { useState, useRef } from "react";
import { uploadFile } from "../api";

const styles = {
  wrapper: {
    background: "var(--surface)",
    border: "2px dashed var(--border)",
    borderRadius: "var(--radius)",
    padding: "32px",
    textAlign: "center",
    transition: "border-color 0.2s",
    cursor: "pointer",
  },
  wrapperDrag: { borderColor: "var(--accent)" },
  icon: { fontSize: "36px", marginBottom: "12px" },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--text)",
    marginBottom: "6px",
  },
  sub: { color: "var(--text-muted)", fontSize: "13px" },
  btn: {
    marginTop: "16px",
    padding: "10px 24px",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-sm)",
    fontFamily: "var(--font-body)",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
  },
  progressBar: {
    marginTop: "16px",
    height: "6px",
    background: "var(--surface2)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, var(--accent), var(--accent2))",
    transition: "width 0.3s",
  },
  result: {
    marginTop: "16px",
    padding: "12px 16px",
    borderRadius: "var(--radius-sm)",
    fontSize: "13px",
    fontWeight: 500,
  },
  success: { background: "#0d2e1f", color: "var(--success)", border: "1px solid #134d30" },
  error:   { background: "#2e0d0d", color: "var(--danger)",  border: "1px solid #4d1313" },
};

export default function FileUpload({ onSuccess }) {
  const inputRef = useRef(null);
  const [drag, setDrag]         = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setResult({ type: "error", msg: "Please upload a valid .xlsx or .xls file." });
      return;
    }
    setLoading(true);
    setResult(null);
    setProgress(0);
    try {
      const { data } = await uploadFile(file, setProgress);
      const s = data.summary;
      setResult({
        type: "success",
        msg: `✅ Upload complete — ${s.total} rows processed: ${s.inserted} new, ${s.updated} updated, ${s.skipped} skipped.`,
      });
      onSuccess && onSuccess();
    } catch (err) {
      setResult({ type: "error", msg: err.response?.data?.error || "Upload failed." });
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      style={{ ...styles.wrapper, ...(drag ? styles.wrapperDrag : {}) }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={() => !loading && inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <div style={styles.icon}>📊</div>
      <div style={styles.title}>Upload Excel File</div>
      <div style={styles.sub}>Drag & drop your pipeline .xlsx here, or click to browse</div>
      {!loading && (
        <button style={styles.btn} onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}>
          Choose File
        </button>
      )}
      {loading && (
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
      )}
      {result && (
        <div style={{ ...styles.result, ...(result.type === "success" ? styles.success : styles.error) }}>
          {result.msg}
        </div>
      )}
    </div>
  );
}
