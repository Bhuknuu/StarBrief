"use client";

import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TaskView } from "@/components/TaskView";
import { TimelineView } from "@/components/TimelineView";
import { ViewToggle } from "@/components/ViewToggle";
import { FilterState, DEFAULT_FILTERS, ViewMode, Opportunity, TimelineBucket } from "@/lib/types";

// --- Dummy Data for UI Verification ---
const DUMMY_OPPS: Opportunity[] = [
  {
    id: "1",
    title: "Software Engineering Intern - Core ML",
    organization: "Meta",
    category: "internship",
    discoveredAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
    eventDate: null,
    expiresAt: null,
    location: "London, UK",
    geoScope: "global",
    isRemote: false,
    minYear: 2,
    maxYear: 4,
    skillsRequired: ["Python", "PyTorch"],
    isPaid: true,
    stipendRange: "£4,500/mo",
    isFemaleExclusive: false,
    sourceUrl: "https://meta.com",
    applyUrl: null,
    sourceName: "LinkedIn",
    summary: "Meta is seeking interns to work on their PyTorch acceleration framework. Strong C++ and Python skills required. Interviews rolling.",
    status: "active",
    urlValid: true,
    lastCheckedAt: new Date().toISOString(),
    relevanceScore: 0.94,
    priority: "critical",
    isDismissed: false,
    isSaved: true,
    relevanceJustification: "Strong match for your PyTorch background."
  },
  {
    id: "2",
    title: "GenAI Hackathon 2026",
    organization: "Google Cloud",
    category: "hackathon",
    discoveredAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    eventDate: new Date(Date.now() + 86400000 * 10).toISOString(),
    expiresAt: null,
    location: "Remote",
    geoScope: "global",
    isRemote: true,
    minYear: null,
    maxYear: null,
    skillsRequired: [],
    isPaid: null,
    stipendRange: "$50k Prize Pool",
    isFemaleExclusive: false,
    sourceUrl: "https://devpost.com",
    applyUrl: null,
    sourceName: "DevPost",
    summary: "Build agentic workflows using the new Gemini 3 APIs. Open to all students.",
    status: "deadline_approaching",
    urlValid: true,
    lastCheckedAt: new Date().toISOString(),
    relevanceScore: 0.88,
    priority: "high",
    isDismissed: false,
    isSaved: false,
    relevanceJustification: "Relevant to your interest in Agentic AI."
  }
];

const DUMMY_BUCKETS: TimelineBucket[] = [
  {
    label: "This Week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    opportunities: DUMMY_OPPS
  }
];

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>("task");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    try {
      const savedFilters = localStorage.getItem("sb_filters");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedFilters) setFilters(JSON.parse(savedFilters));
      const savedDismissed = localStorage.getItem("sb_dismissed");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedDismissed) setDismissedIds(new Set(JSON.parse(savedDismissed)));
    } catch (e) {
      console.warn("Could not load from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("sb_filters", JSON.stringify(filters));
      localStorage.setItem("sb_dismissed", JSON.stringify(Array.from(dismissedIds)));
    }
  }, [filters, dismissedIds, isMounted]);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id); // Restore
      } else {
        next.add(id); // Dismiss
      }
      return next;
    });
  };

  const filteredOpps = useMemo(() => {
    return DUMMY_OPPS.map(opp => ({
      ...opp,
      isDismissed: dismissedIds.has(opp.id) || opp.isDismissed
    })).filter((opp) => {
      if (filters.showDismissed) {
        if (!opp.isDismissed) return false;
      } else {
        if (opp.isDismissed) return false;
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!opp.title.toLowerCase().includes(q) && !opp.organization.toLowerCase().includes(q)) return false;
      }
      if (filters.categories.length > 0 && !filters.categories.includes(opp.category)) return false;
      if (filters.isRemote && !opp.isRemote) return false;
      if (filters.isPaid && !opp.isPaid) return false;
      if (filters.showSavedOnly && !opp.isSaved) return false;
      return true;
    });
  }, [dismissedIds, filters]);

  const filteredBuckets = useMemo(() => {
    return DUMMY_BUCKETS.map(b => ({
      ...b,
      opportunities: b.opportunities.filter(opp => filteredOpps.some(f => f.id === opp.id))
    })).filter(b => b.opportunities.length > 0);
  }, [filteredOpps]);

  return (
    <div className="app-shell">
      <Sidebar filters={filters} onFilterChange={setFilters} isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
      
      <main className="main-content">
        <header className="dashboard-header flex items-center justify-between" style={{ marginBottom: "var(--space-6)" }}>
          <div className="flex items-center gap-4">
            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsMobileOpen(true)}
              style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', display: 'var(--mobile-btn-display, none)', color: 'var(--text-light)', padding: 0 }}
            >
              ☰
            </button>
            <div>
              <h2 className="heading-black" style={{ fontSize: "var(--text-xl)" }}>
              {(() => {
                if (filters.showDismissed) return "Dismissed Bin";
                if (filters.showSavedOnly) return "Saved Archive";
                if (filters.search) return `Search: "${filters.search}"`;
                if (filters.categories.length === 1) {
                  const cat = filters.categories[0];
                  return `${cat.charAt(0).toUpperCase() + cat.slice(1)} Briefing`;
                }
                return "Intelligence Briefing";
              })()}
            </h2>
            <p style={{ marginTop: "4px", color: "var(--text-light-dim)", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase" }}>
              {(() => {
                const highPriorityCount = filteredOpps.filter(o => o.priority === 'critical' || o.priority === 'high').length;
                if (highPriorityCount > 0) {
                  return `${highPriorityCount} high-priority ${highPriorityCount === 1 ? 'item requires' : 'items require'} your attention.`;
                }
                return `${filteredOpps.length} ${filteredOpps.length === 1 ? 'item matches' : 'items match'} your criteria.`;
              })()}
            </p>
          </div>
          </div>
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </header>

        {viewMode === "task" ? (
          <TaskView opportunities={filteredOpps} onDismiss={handleDismiss} />
        ) : (
          <TimelineView buckets={filteredBuckets} />
        )}
      </main>
    </div>
  );
}
