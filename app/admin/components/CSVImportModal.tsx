"use client";

import React, { useRef, useState } from "react";
import { X, Upload, AlertCircle, CheckCircle, FileText } from "lucide-react";
import { importMembersFromCSV } from "@/app/actions/members";

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: Record<string, unknown>;
  }>;
  warnings?: string[];
}

interface CSVImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CSVImportModal({ onClose, onSuccess }: CSVImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [csvContent, setCSVContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      setResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: [{
          row: 0,
          error: "Only CSV files are allowed",
        }],
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: [{
          row: 0,
          error: "File size must not exceed 10MB",
        }],
      });
      return;
    }

    try {
      const content = await file.text();
      setCSVContent(content);
      setFileName(file.name);
      setResult(null);
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: [{
          row: 0,
          error: "Failed to read file",
        }],
      });
    }
  };

  const handleImport = async () => {
    if (!csvContent) {
      setResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: [{
          row: 0,
          error: "No CSV file selected",
        }],
      });
      return;
    }

    setIsLoading(true);
    try {
      const importResult = await importMembersFromCSV(csvContent);
      setResult(importResult);

      if (importResult.success && importResult.imported > 0) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: [{
          row: 0,
          error: error instanceof Error ? error.message : "Import failed",
        }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `firstName,lastName,email,role,schoolId,age,certificateUrl
John,Doe,john.doe@example.com,MEMBER,1,25,https://example.com/cert.pdf
Jane,Smith,jane.smith@example.com,SCANNER,1,28,
Bob,Johnson,bob.johnson@example.com,ADMIN,2,35,https://example.com/cert2.pdf`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "members-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="rounded-2xl border border-cyan-400/25 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto neon-panel" style={{ background: "var(--card-bg)" }}>
        {/* Header */}
        <div className="sticky top-0 border-b border-cyan-400/20 p-6 flex items-center justify-between" style={{ background: "var(--card-bg)" }}>
          <h3 className="orbitron text-xl text-cyan-400 font-bold">Import Members from CSV</h3>
          <button onClick={onClose} className="p-2 hover:bg-cyan-400/10 rounded-lg transition-all cursor-pointer">
            <X className="w-5 h-5 text-cyan-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Instructions */}
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-4">
            <p className="text-[11px] text-cyan-300/80 mb-3">
              <strong>CSV Format Required:</strong> firstName, lastName, email, role, schoolId, age (optional), certificateUrl (optional)
            </p>
            <p className="text-[11px] text-cyan-300/80">
              <strong>Supported Roles:</strong> ADMIN, SCANNER, MEMBER
            </p>
            <p className="text-[11px] text-cyan-300/80 mt-2">
              <strong>Password:</strong> All imported members will use the temporary password: <code className="bg-black/40 px-2 py-1 rounded text-cyan-200">Aysipep.se@2026</code>
            </p>
          </div>

          {/* File Input */}
          {!csvContent && !result && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-cyan-400/40 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-300/60 hover:bg-cyan-500/5 transition-all"
              >
                <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                <p className="text-sm text-cyan-300 font-medium">
                  Drag and drop your CSV file here, or click to select
                </p>
                <p className="text-[11px] text-cyan-300/70 mt-2">
                  Max file size: 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Download Template Button */}
              <button
                onClick={downloadTemplate}
                className="w-full h-10 rounded-md border border-cyan-400/40 text-cyan-400 font-medium text-sm transition-all hover:border-cyan-300/60 hover:bg-cyan-500/5"
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Download CSV Template
              </button>
            </div>
          )}

          {/* Selected File Info */}
          {csvContent && !result && (
            <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-4">
              <p className="text-[11px] text-cyan-300/80">
                <strong>Selected File:</strong> {fileName}
              </p>
              <p className="text-[11px] text-cyan-300/70 mt-1">
                {csvContent.split("\n").length - 1} row(s) to import
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className={`rounded-lg border p-4 ${
              result.success
                ? "border-emerald-400/40 bg-emerald-500/5"
                : "border-red-400/40 bg-red-500/5"
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${
                    result.success ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {result.success && result.imported > 0
                      ? `✅ Import Successful`
                      : "❌ Import Failed"}
                  </p>

                  <div className="mt-2 space-y-1">
                    <p className="text-[11px] text-cyan-300">
                      Imported: <span className="font-semibold text-emerald-400">{result.imported}</span>
                    </p>
                    {result.failed > 0 && (
                      <p className="text-[11px] text-cyan-300">
                        Failed: <span className="font-semibold text-red-400">{result.failed}</span>
                      </p>
                    )}
                  </div>

                  {/* Warnings */}
                  {result.warnings && result.warnings.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {result.warnings.map((warning, idx) => (
                        <p key={idx} className="text-[10px] text-cyan-300/80">
                          • {warning}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Errors */}
                  {result.errors.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto space-y-2 bg-black/30 rounded p-3">
                      {result.errors.slice(0, 5).map((error, idx) => (
                        <div key={idx} className="text-[10px] text-red-300/80">
                          <strong>Row {error.row}:</strong> {error.error}
                        </div>
                      ))}
                      {result.errors.length > 5 && (
                        <p className="text-[10px] text-red-300/80">
                          ... and {result.errors.length - 5} more error(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            {!result ? (
              <>
                <button
                  onClick={handleImport}
                  disabled={!csvContent || isLoading}
                  className="flex-1 h-10 rounded-md bg-teal-500/90 text-black font-semibold text-sm transition-all hover:bg-teal-400 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Importing..." : "Import Members"}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 h-10 rounded-md border border-cyan-400/40 text-sm transition-all hover:border-cyan-300/60 active:scale-95 cursor-pointer"
                  style={{ color: "var(--text-primary)" }}
                >
                  Cancel
                </button>
              </>
            ) : result.success && result.imported > 0 ? (
              <button
                onClick={() => {
                  setResult(null);
                  setCSVContent("");
                  setFileName("");
                }}
                className="flex-1 h-10 rounded-md bg-teal-500/90 text-black font-semibold text-sm transition-all hover:bg-teal-400 active:scale-95 cursor-pointer"
              >
                Import Another File
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setResult(null);
                    setCSVContent("");
                    setFileName("");
                    fileInputRef.current?.click();
                  }}
                  className="flex-1 h-10 rounded-md border border-cyan-400/40 text-sm transition-all hover:border-cyan-300/60 active:scale-95 cursor-pointer"
                  style={{ color: "var(--text-primary)" }}
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="px-6 h-10 rounded-md bg-teal-500/90 text-black font-semibold text-sm transition-all hover:bg-teal-400 active:scale-95 cursor-pointer"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
