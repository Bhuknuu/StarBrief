"use client";

import { useState } from "react";
import styles from "./TaskView.module.css";
import { Opportunity } from "@/lib/types";
import { OpportunityCard } from "./OpportunityCard";
import { motion, AnimatePresence } from "framer-motion";

interface TaskViewProps {
  opportunities: Opportunity[];
  onDismiss: (id: string) => void;
}

export function TaskView({ opportunities, onDismiss }: TaskViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (opportunities.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>✦</div>
        <h3 className={styles.emptyTitle}>All caught up</h3>
        <p className={styles.emptyDesc}>No opportunities match your current filters.</p>
      </div>
    );
  }

  return (
    <motion.div 
      className={styles.grid}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1 }
        }
      }}
    >
      <AnimatePresence mode="popLayout">
        {opportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            isExpanded={expandedId === opp.id}
            onToggleExpand={() => setExpandedId(expandedId === opp.id ? null : opp.id)}
            onDismiss={() => onDismiss(opp.id)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
