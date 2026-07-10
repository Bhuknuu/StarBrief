"use client";

import styles from "./OpportunityCard.module.css";
import { Opportunity } from "@/lib/types";
import { CategoryPill } from "./CategoryPill";
import { PriorityBadge } from "./PriorityBadge";
import { motion } from "framer-motion";

interface OpportunityCardProps {
  opportunity: Opportunity;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onDismiss?: () => void;
}

export function OpportunityCard({ opportunity, isExpanded = false, onToggleExpand, onDismiss }: OpportunityCardProps) {
  const { title, organization, category, priority, relevanceScore, deadline, location, summary, isRemote, stipendRange } = opportunity;

  // Format date
  const deadlineStr = deadline ? new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Rolling';
  
  // Format score
  const scorePercent = relevanceScore ? Math.round(relevanceScore * 100) : 0;

  return (
    <motion.article 
      layout="position"
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15, ease: "easeOut" } }}
      transition={{ 
        layout: { type: "spring", stiffness: 400, damping: 35 },
        default: { duration: 0.25, ease: [0.32, 0.72, 0, 1] }
      }}
      className={`${styles.card} ${isExpanded ? styles.expanded : ''}`} 
      onClick={onToggleExpand}
    >
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>{title}</h3>
          <span className={styles.org}>{organization}</span>
        </div>
        <div className={styles.metaTop}>
          {priority && <PriorityBadge priority={priority} />}
          <span className={styles.score}>{scorePercent}% Match</span>
        </div>
      </div>

      <div className={styles.tags}>
        <CategoryPill category={category} />
        {isRemote ? (
          <span className={styles.tag}>Remote</span>
        ) : location ? (
          <span className={styles.tag}>{location}</span>
        ) : null}
        <span className={styles.tag}>Due {deadlineStr}</span>
        {stipendRange && <span className={styles.tag}>{stipendRange}</span>}
      </div>

      {isExpanded && summary && (
        <div className={styles.expandedContent}>
          <p className={styles.summary}>{summary}</p>
          <div className={styles.actions}>
            <button className={styles.btnSecondary} onClick={(e) => { 
              e.stopPropagation(); 
              if (onDismiss) onDismiss(); 
            }}>
              {opportunity.isDismissed ? "Restore" : "Dismiss"}
            </button>
            <a href={opportunity.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.btnPrimary} onClick={(e) => e.stopPropagation()}>
              View Details ↗
            </a>
          </div>
        </div>
      )}
    </motion.article>
  );
}
