import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export function Toast({ show, message, tone = "success", duration, onDismiss }) {
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show && message) {
      setRendered(true);
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => setRendered(false), 380);
      return () => clearTimeout(t);
    }
  }, [show, message]);

  if (!rendered || !message) return null;

  const isError = tone === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  const iconColor = isError ? "#DC2626" : "#16A34A";
  const barColor = isError ? "#DC2626" : "#16A34A";

  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
        left: 0,
        right: 0,
        margin: "0 auto",
        width: "fit-content",
        minWidth: "300px",
        maxWidth: "480px",
        zIndex: 9999,
        borderRadius: "16px",
        overflow: "hidden",
        background: "#FFFFFF",
        border: `1px solid ${isError ? "#FECACA" : "#86EFAC"}`,
        boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(-20px)",
        transition: "opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1)",
      }}
      role="status"
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px 20px" }}>
        <Icon size={18} style={{ flexShrink: 0, marginTop: "1px", color: iconColor }} />
        <span style={{ fontSize: "14px", fontWeight: 500, lineHeight: 1.55, flex: 1, color: "#141414" }}>
          {message}
        </span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            type="button"
            style={{ flexShrink: 0, color: "#9A9A9A", padding: "2px", lineHeight: 1 }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {duration && (
        <div style={{ height: "3px", background: "#F0EFEB" }}>
          <div
            style={{
              height: "100%",
              background: barColor,
              opacity: 0.45,
              width: visible ? "0%" : "100%",
              transition: visible ? `width ${duration}ms linear` : "none",
            }}
          />
        </div>
      )}
    </div>
  );
}
