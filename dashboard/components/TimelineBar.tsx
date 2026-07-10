"use client";

import styles from "./TimelineBar.module.css";
import { Opportunity, CATEGORY_CSS_VAR } from "@/lib/types";

interface TimelineBarProps {
  opportunity: Opportunity;
  onHover?: (opp: Opportunity) => void;
  onClick?: (opp: Opportunity) => void;
}

export function TimelineBar({ opportunity, onHover, onClick }: TimelineBarProps) {
  // In a real app, calculate width based on start/end dates.
  // For the MVP, we use fixed widths for aesthetic demo.
  const isEvent = opportunity.category === 'hackathon' || opportunity.category === 'workshop';
  const widthStr = isEvent ? '15%' : '40%'; 

  return (
    <div className={styles.row}>
      <div className={styles.labelGroup}>
        <span className={styles.title} title={opportunity.title}>{opportunity.title}</span>
        <span className={styles.org} title={opportunity.organization}>{opportunity.organization}</span>
      </div>
      
      <div className={styles.track}>
        <div 
          className={`${styles.bar} ${isEvent ? styles.barEvent : styles.barDuration}`}
          style={{ 
            width: widthStr, 
            backgroundColor: CATEGORY_CSS_VAR[opportunity.category] 
          }}
          onClick={() => onClick?.(opportunity)}
          onMouseEnter={() => onHover?.(opportunity)}
        />
      </div>
    </div>
  );
}
