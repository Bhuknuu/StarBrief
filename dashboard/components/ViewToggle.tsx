"use client";

import styles from "./ViewToggle.module.css";
import { ViewMode } from "@/lib/types";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const OPTIONS: { value: ViewMode; label: string; icon: string }[] = [
  { value: "task",     label: "Task View",     icon: "▤" },
  { value: "timeline", label: "Timeline View", icon: "▦" },
];

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className={styles.container} role="tablist" aria-label="View mode">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={value === opt.value}
          className={`${styles.tab} ${value === opt.value ? styles.active : ""}`}
          onClick={() => onChange(opt.value)}
          id={`view-toggle-${opt.value}`}
        >
          <span className={styles.icon} aria-hidden="true">{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
