"use client";

import styles from "./CategoryPill.module.css";
import { OpportunityCategory, CATEGORY_LABELS } from "@/lib/types";

interface CategoryPillProps {
  category: OpportunityCategory;
  size?: "sm" | "md";
}

export function CategoryPill({ category, size = "sm" }: CategoryPillProps) {
  return (
    <span
      className={`${styles.pill} ${styles[size]} ${styles[category]}`}
      aria-label={`Category: ${CATEGORY_LABELS[category]}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}
