import { useState, useCallback } from "react";
import { postCarbonScoreReportPdf } from "../api";

function DownloadIcon({ className }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4 4 4-4m-4-9v13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function CarbonScorePdfButton({ footprint, habits, userDisplayName }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleClick = useCallback(async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const blob = await postCarbonScoreReportPdf({
        habits,
        displayName: userDisplayName,
      });
      downloadBlob(blob, "CUTThecarbon-Carbon-Score-Report.pdf");
    } catch (e1) {
      console.warn("Server PDF failed, trying client fallback:", e1);
      try {
        const { downloadCarbonScorePdf } = await import("../utils/carbonScorePdf");
        await downloadCarbonScorePdf({ footprint, habits, userDisplayName });
      } catch (e2) {
        console.error(e2);
        setErrorMessage(
          e2?.message || e1?.message || "Could not generate the PDF. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [footprint, habits, userDisplayName]);

  return (
    <div className="carbon-pdf-block">
      <button
        type="button"
        className={`btn-pdf-report ${loading ? "btn-pdf-report--loading" : ""}`}
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        aria-describedby={errorMessage ? "carbon-pdf-error-msg" : undefined}
      >
        <DownloadIcon className="btn-pdf-report__icon" />
        {loading ? "Generating…" : "Download PDF Report"}
      </button>
      {errorMessage ? (
        <p id="carbon-pdf-error-msg" className="carbon-pdf-block__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
