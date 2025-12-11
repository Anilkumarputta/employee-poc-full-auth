import React, { useState } from "react";

const BULK_IMPORT_URL = "/bulk-actions/bulk-import";
const BULK_EXPORT_URL = "/bulk-actions/bulk-export";

export const BulkActionsPage: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const res = await fetch(BULK_IMPORT_URL, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      setImportResult(result);
    } catch (err) {
      setImportResult({ error: "Import failed." });
    }
    setImporting(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(BULK_EXPORT_URL);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "employees.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed.");
    }
    setExporting(false);
  };

  return (
    <div style={{ padding: "2rem", background: "#f5f7fa", minHeight: "100vh" }}>
      <h1 style={{ margin: 0, color: "#111827", fontSize: "2rem" }}>Bulk Actions</h1>
      <p style={{ margin: "0.5rem 0 2rem 0", color: "#6b7280" }}>
        Import, export, and batch update employees efficiently.
      </p>
      <div style={{ marginBottom: "2rem" }}>
        <h2>Import Employees (CSV)</h2>
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <button
          onClick={handleImport}
          disabled={!selectedFile || importing}
          style={{ marginLeft: "1rem", padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: importing ? "not-allowed" : "pointer" }}
        >
          {importing ? "Importing..." : "Import"}
        </button>
        {importResult && (
          <div style={{ marginTop: "1rem" }}>
            {importResult.error ? (
              <span style={{ color: "#e74c3c" }}>{importResult.error}</span>
            ) : (
              <div>
                <span style={{ color: "#10b981" }}>Imported: {importResult.imported}</span>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div style={{ color: "#e74c3c", marginTop: "0.5rem" }}>
                    <strong>Errors:</strong>
                    <ul>
                      {importResult.errors.map((err: any, idx: number) => (
                        <li key={idx}>{err.email}: {err.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ marginBottom: "2rem" }}>
        <h2>Export Employees (CSV)</h2>
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: exporting ? "not-allowed" : "pointer" }}
        >
          {exporting ? "Exporting..." : "Export"}
        </button>
      </div>
      {/* Advanced batch update UI can be added here (multi-select, edit fields, apply changes) */}
      <div style={{ marginBottom: "2rem" }}>
        <h2>Batch Update (Coming Soon)</h2>
        <p>Advanced batch update for selected employees will be available here.</p>
      </div>
    </div>
  );
};
