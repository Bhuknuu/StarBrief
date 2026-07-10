"use client";

import styles from "./TimelineView.module.css";
import { TimelineBucket } from "@/lib/types";
import { TimelineBar } from "./TimelineBar";

interface TimelineViewProps {
  buckets: TimelineBucket[];
}

export function TimelineView({ buckets }: TimelineViewProps) {
  if (buckets.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>◱</div>
        <h3 className={styles.emptyTitle}>No timeline data</h3>
        <p className={styles.emptyDesc}>Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Time axis header - aligned to grid */}
      <div className={styles.axisHeader}>
        <div className={styles.axisSpacer} />
        <div className={styles.axisMarks}>
          <span className={styles.mark}>Oct 1</span>
          <span className={styles.mark}>Oct 15</span>
          <span className={styles.mark}>Nov 1</span>
          <span className={styles.mark}>Nov 15</span>
        </div>
      </div>

      {/* Buckets with vertical grid background */}
      <div className={styles.buckets}>
        {buckets.map((bucket) => (
          <div key={bucket.label} className={styles.bucket}>
            <h4 className={styles.bucketLabel}>{bucket.label}</h4>
            <div className={styles.bucketContent}>
              <div className={styles.gridOverlay} />
              <div className={styles.bucketItems}>
                {bucket.opportunities.map((opp) => (
                  <TimelineBar key={opp.id} opportunity={opp} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
