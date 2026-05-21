'use client';

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

type DataSearchInputProps = {
  ariaLabel: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export default function DataSearchInput({
  ariaLabel,
  onChange,
  placeholder,
  value,
}: DataSearchInputProps) {
  return (
    <label
      style={{
        position: "relative",
        display: "block",
        width: "100%",
        maxWidth: "320px",
      }}
    >
      <span className="sr-only">{ariaLabel}</span>
      <MagnifyingGlassIcon
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "14px",
          top: "50%",
          width: "18px",
          height: "18px",
          transform: "translateY(-50%)",
          color: "#6b7280",
        }}
      />
      <input
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          color: "#e5e7eb",
          fontSize: "12px",
          outline: "none",
          padding: "10px 14px 10px 40px",
        }}
        value={value}
      />
    </label>
  );
}
