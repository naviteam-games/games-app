"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1 style={{ color: "#dc2626" }}>Something went wrong</h1>
      <pre
        style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "0.5rem",
          padding: "1rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontSize: "0.875rem",
        }}
      >
        {error.message}
        {"\n\n"}
        {error.stack}
      </pre>
      {error.digest && (
        <p style={{ color: "#6b7280", fontSize: "0.75rem" }}>
          Digest: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "0.375rem",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
