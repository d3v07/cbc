"use client";

import { useEffect } from "react";

export interface StampMarkProps {
  label?: string;
  size?: number;
}

export function StampMark({ label, size = 56 }: StampMarkProps) {
  return (
    <div
      aria-label={label ?? "stamp"}
      style={{
        width: size,
        height: size,
        border: "1.5px solid var(--t-ink)",
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--t-mono)",
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
      }}
    >
      {label ?? "M"}
    </div>
  );
}

export interface CopyLineProps {
  value: string;
  label?: string;
}

export function CopyLine({ value, label }: CopyLineProps) {
  const onCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(value);
    }
  };
  return (
    <div
      role="group"
      aria-label={label ?? "copyable"}
      style={{ display: "flex", gap: 8, alignItems: "center" }}
    >
      <code
        style={{
          flex: 1,
          fontFamily: "var(--t-mono)",
          fontSize: 11,
          padding: "6px 8px",
          border: "1px solid var(--t-ink-faint)",
          borderRadius: 3,
          overflow: "auto",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </code>
      <button type="button" onClick={onCopy} className="btn ghost sm">
        copy
      </button>
    </div>
  );
}

export interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: number;
  children: React.ReactNode;
}

export function ModalShell({ open, onClose, title, maxWidth = 480, children }: ModalShellProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          maxWidth,
          width: "90%",
          padding: 24,
          background: "var(--t-paper)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="h-display tiny" style={{ marginTop: 0, marginBottom: 12 }}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
