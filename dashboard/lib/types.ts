/**
 * StarBrief — TypeScript Interfaces
 * Single source of truth for all data shapes used across
 * the Next.js dashboard (API responses, components, state).
 */

// ═══════════════════════════════════════════════════════════
// Core Enums
// ═══════════════════════════════════════════════════════════

export type OpportunityCategory =
  | "internship"
  | "hackathon"
  | "workshop"
  | "conference"
  | "open_source"
  | "research";

export type OpportunityStatus =
  | "active"
  | "deadline_approaching"
  | "expired"
  | "cancelled"
  | "updated"
  | "unverified";

export type Priority = "critical" | "high" | "medium" | "low";

export type GeoScope = "local" | "pan_india" | "global";

// ═══════════════════════════════════════════════════════════
// Core Data Models
// ═══════════════════════════════════════════════════════════

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: OpportunityCategory;

  // Temporal
  discoveredAt: string;       // ISO 8601
  deadline: string | null;
  eventDate: string | null;
  expiresAt: string | null;

  // Location
  location: string | null;
  geoScope: GeoScope | null;
  isRemote: boolean;

  // Requirements
  minYear: number | null;
  maxYear: number | null;
  skillsRequired: string[];
  isPaid: boolean | null;
  stipendRange: string | null;
  isFemaleExclusive: boolean;

  // Links
  sourceUrl: string;
  applyUrl: string | null;
  sourceName: string;

  // Content
  summary: string | null;

  // Status
  status: OpportunityStatus;
  urlValid: boolean;
  lastCheckedAt: string;

  // Scoring (from user_opportunity_scores join)
  relevanceScore: number | null;
  priority: Priority | null;
  isDismissed: boolean;
  isSaved: boolean;
  relevanceJustification: string | null;   // Persona Critic output
}

// ═══════════════════════════════════════════════════════════
// Timeline-specific
// ═══════════════════════════════════════════════════════════

export interface TimelineBucket {
  label: string;           // "Today", "This Week", "Next Week", etc.
  startDate: string;
  endDate: string;
  opportunities: Opportunity[];
}

// ═══════════════════════════════════════════════════════════
// Filters (Sidebar State)
// ═══════════════════════════════════════════════════════════

export interface FilterState {
  search: string;
  categories: OpportunityCategory[];
  priorities: Priority[];
  statuses: OpportunityStatus[];
  sources: string[];
  isPaid: boolean | null;
  isRemote: boolean | null;
  showDismissed: boolean;
  showSavedOnly: boolean;
  deadlineBefore: string | null;    // ISO date string
  minRelevanceScore: number;        // 0.0 – 1.0
}

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  categories: [],
  priorities: [],
  statuses: ["active", "deadline_approaching"],
  sources: [],
  isPaid: null,
  isRemote: null,
  showDismissed: false,
  showSavedOnly: false,
  deadlineBefore: null,
  minRelevanceScore: 0,
};

// ═══════════════════════════════════════════════════════════
// API Response Types
// ═══════════════════════════════════════════════════════════

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface DashboardStats {
  totalActive: number;
  deadlineThisWeek: number;
  newThisWeek: number;
  savedCount: number;
  byCategory: Record<OpportunityCategory, number>;
  byPriority: Record<Priority, number>;
  lastCrawledAt: string | null;
}

export interface ScraperStatus {
  name: string;
  lastRun: string | null;
  status: "success" | "failed" | "running" | "never";
  itemsFound: number;
  itemsNew: number;
  errors: string[];
}

// ═══════════════════════════════════════════════════════════
// View Mode
// ═══════════════════════════════════════════════════════════

export type ViewMode = "task" | "timeline";

// ═══════════════════════════════════════════════════════════
// Colour Helpers
// ═══════════════════════════════════════════════════════════

export const CATEGORY_LABELS: Record<OpportunityCategory, string> = {
  internship:   "Internship",
  hackathon:    "Hackathon",
  workshop:     "Workshop",
  conference:   "Conference",
  open_source:  "Open Source",
  research:     "Research",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  critical: "Critical",
  high:     "High",
  medium:   "Medium",
  low:      "Low",
};

export const CATEGORY_CSS_VAR: Record<OpportunityCategory, string> = {
  internship:   "var(--cat-internship)",
  hackathon:    "var(--cat-hackathon)",
  workshop:     "var(--cat-workshop)",
  conference:   "var(--cat-conference)",
  open_source:  "var(--cat-open-source)",
  research:     "var(--cat-research)",
};

export const PRIORITY_CSS_VAR: Record<Priority, string> = {
  critical: "var(--priority-critical)",
  high:     "var(--priority-high)",
  medium:   "var(--priority-medium)",
  low:      "var(--priority-low)",
};

export const PRIORITY_BG_CSS_VAR: Record<Priority, string> = {
  critical: "var(--priority-critical-bg)",
  high:     "var(--priority-high-bg)",
  medium:   "var(--priority-medium-bg)",
  low:      "var(--priority-low-bg)",
};
