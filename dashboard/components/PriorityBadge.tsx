"use client";

import styles from "./PriorityBadge.module.css";
import { Priority, PRIORITY_LABELS } from "@/lib/types";

interface PriorityBadgeProps {
  priority: Priority;
  showDot?: boolean; // Ignored in new design, kept for API compatibility
  size?: "sm" | "md";
}

export function PriorityBadge({
  priority,
  size = "sm",
}: PriorityBadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[size]} ${styles[priority]}`}
      aria-label={`Priority: ${PRIORITY_LABELS[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
