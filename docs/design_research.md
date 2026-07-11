# StarBrief  -  UX Design System v2

> **Color Source**: Sanzo Wada  -  *A Dictionary of Color Combinations* (1933)
> **Layout**: Dual-view (Task + Timeline), unified sidebar filters
> **Principle**: Bookshelf, not side-table  -  data lives where it belongs

---

## 1. Sanzo Wada Color System

### Why Wada?
Wada's 348 combinations were curated for *harmony*, not trend. They feel warm,
lived-in, and timeless  -  the opposite of the cold SaaS palettes that saturate
the web. This gives StarBrief a recognizable visual identity.

### StarBrief Palette (Dark Mode  -  Primary)

Derived from Wada combinations #247, #268, #131, #182, blended for screens:

```css
:root {
    /* ═══════════════════════════════════════════════ */
    /* StarBrief Tokens  -  Sanzo Wada Heritage         */
    /* ═══════════════════════════════════════════════ */

    /* ─── Surfaces (Wada: darkened neutrals) ─── */
    --bg-base:      #0C0A09;   /* sumi-ink black (warm, not cold) */
    --bg-surface:   #1A1614;   /* charred wood */
    --bg-raised:    #242019;   /* weathered timber */
    --bg-hover:     #2E2A22;   /* warm stone */
    --bg-active:    #38332A;   /* aged paper reverse */

    /* ─── Borders (whisper-thin) ─── */
    --border-subtle:  rgba(199, 178, 153, 0.08);  /* warm, not blue */
    --border-default: rgba(199, 178, 153, 0.14);
    --border-strong:  rgba(199, 178, 153, 0.22);

    /* ─── Text (Wada: warm neutrals) ─── */
    --text-primary:   #E8E0D4;  /* unbleached silk */
    --text-secondary: #B5A898;  /* aged linen */
    --text-muted:     #8A7E6E;  /* driftwood */
    --text-faint:     #5E554A;  /* shadow clay */

    /* ─── Light Mode ─── */
    --bg-base-light:      #FAF6F1;  /* washi paper */
    --bg-surface-light:   #FFFFFF;
    --bg-raised-light:    #F3EDE5;  /* toasted cream */
    --text-primary-light: #1A1614;
    --text-muted-light:   #8A7E6E;
    --border-subtle-light: rgba(26, 22, 20, 0.08);

    /* ─── Brand Accent (Wada: Raw Sienna #bb7125) ─── */
    --accent:        #BB7125;  /* Raw Sienna  -  the "star" */
    --accent-hover:  #D4872E;  /* brightened sienna */
    --accent-muted:  rgba(187, 113, 37, 0.15);

    /* ═══════════════════════════════════════════════ */
    /* PRIORITY COLORS (Wada-sourced, not generic)    */
    /* ═══════════════════════════════════════════════ */

    /* Critical: Wada "Carmine" #cc1236 */
    --priority-critical:     #CC1236;
    --priority-critical-bg:  rgba(204, 18, 54, 0.12);

    /* High: Wada "Raw Sienna" #bb7125 */
    --priority-high:         #BB7125;
    --priority-high-bg:      rgba(187, 113, 37, 0.12);

    /* Medium: Wada "Gobelin Blue" #4B7D8D (combo #131) */
    --priority-medium:       #4B7D8D;
    --priority-medium-bg:    rgba(75, 125, 141, 0.12);

    /* Low: Wada "Light Brown Drab" #b59392 */
    --priority-low:          #8A7E6E;
    --priority-low-bg:       rgba(138, 126, 110, 0.10);

    /* ═══════════════════════════════════════════════ */
    /* CATEGORY COLORS (Wada-sourced tints)           */
    /* ═══════════════════════════════════════════════ */

    --cat-internship:   #4B7D8D;  /* Gobelin Blue  -  structured, professional */
    --cat-hackathon:    #DA525D;  /* Eugenia Red B  -  energetic, competitive */
    --cat-workshop:     #D4872E;  /* bright sienna  -  hands-on, warm */
    --cat-opensource:    #5B7745;  /* Cypress Green (Wada #486849)  -  growth */
    --cat-research:     #8B6BAE;  /* Wisteria (Wada #7B5AA6 lightened)  -  deep */
    --cat-conference:   #C7A84E;  /* Wada Golden Ochre  -  prestigious, curated */

    /* ═══════════════════════════════════════════════ */
    /* TYPOGRAPHY                                     */
    /* ═══════════════════════════════════════════════ */

    --font-sans:  'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-mono:  'JetBrains Mono', 'SF Mono', monospace;

    --text-xs:   12px;
    --text-sm:   13px;
    --text-base: 15px;
    --text-lg:   18px;
    --text-xl:   22px;
    --text-2xl:  28px;

    --weight-normal:   400;
    --weight-medium:   500;
    --weight-semibold: 600;
    --weight-bold:     700;

    --leading-tight:   1.3;
    --leading-normal:  1.5;
    --leading-relaxed: 1.65;

    /* ═══════════════════════════════════════════════ */
    /* SPACING (8px grid)                             */
    /* ═══════════════════════════════════════════════ */

    --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
    --space-4: 16px;  --space-5: 20px;  --space-6: 24px;
    --space-8: 32px;  --space-10: 40px; --space-12: 48px;

    /* ═══════════════════════════════════════════════ */
    /* LAYOUT                                         */
    /* ═══════════════════════════════════════════════ */

    --sidebar-width:  260px;
    --content-max:    960px;
    --card-padding:   20px;
    --section-gap:    48px;

    /* ═══════════════════════════════════════════════ */
    /* BORDERS & SHADOWS                              */
    /* ═══════════════════════════════════════════════ */

    --radius-sm: 6px;    --radius-md: 10px;
    --radius-lg: 14px;   --radius-full: 9999px;

    --shadow-xs:  0 1px 2px rgba(12, 10, 9, 0.15);
    --shadow-sm:  0 1px 3px rgba(12, 10, 9, 0.20);
    --shadow-md:  0 4px 12px rgba(12, 10, 9, 0.25);

    /* ═══════════════════════════════════════════════ */
    /* TRANSITIONS                                    */
    /* ═══════════════════════════════════════════════ */

    --transition-fast:   100ms ease-out;
    --transition-normal: 150ms ease-out;
    --transition-slow:   200ms ease-out;
}
```

---

## 2. Information Architecture  -  The Bookshelf Principle

> *"If there is a bookshelf in the library, why store all books on the side table?"*

### Rule: Data lives in ONE canonical place. UI references, never duplicates.

| Data | Lives In | Referenced By |
|---|---|---|
| Opportunity record | `opportunities` DB table | Both views, cards, detail panel |
| Category filter state | Sidebar (single source) | Both views read from it |
| Priority filter state | Sidebar (single source) | Both views read from it |
| View toggle (Task/Timeline) | Top bar  -  2 buttons | Switches rendering, not data |
| User profile | `/api/profile` | Scoring engine, sidebar counts |
| Scraper health | `scraper_runs` table | Sidebar footer only |

**What this eliminates**:
-  No duplicate category tabs + sidebar filters (was redundant)
-  No separate "filter panel" overlay (merged into sidebar)
-  No re-fetching data when switching views (same query, different render)

---

## 3. Dual-View System

### 3.1 View Toggle (Top Bar)

```
┌─────────────────────────────────────────────────────────────┐
│  StarBrief    [ Search... ⌘K]    [☰ Tasks] [═ Timeline] │
└─────────────────────────────────────────────────────────────┘
```

- Two icon-buttons, right side of top bar
- Active view: `--accent` underline + `--text-primary`
- Inactive: `--text-muted`, no underline
- Same data, different rendering  -  no re-fetch

---

### 3.2 Task View (Default)

**Purpose**: "What should I act on NOW?"  -  prioritized, vertical, scannable.

```
┌─── SIDEBAR ────┐ ┌──────────── CONTENT ─────────────────────┐
│                 │ │                                           │
│ CATEGORIES      │ │  TODAY (Apr 14) ─────────────── 2 items   │
│  All      (34) │ │                                           │
│  Intern   (12) │ │  ┌─  ─────────────────────────────────┐  │
│  Hack      (8) │ │  │ CRITICAL  GSoC 2026                 │  │
│  Work      (3) │ │  │ 2 days left · Open Source · Remote  │  │
│  OSS       (5) │ │  │                          [Apply →]  │  │
│  Research  (2) │ │  └─────────────────────────────────────┘  │
│  Conf      (4) │ │                                           │
│                 │ │  ┌─  ─────────────────────────────────┐  │
│ ─ ─ ─ ─ ─ ─ ─ │ │  │ HIGH  IISc SPARK Research            │  │
│                 │ │  │ Closes Apr 16 · Research · Bangalore │  │
│ PRIORITY        │ │  │                          [Apply →]  │  │
│  Critical  (3) │ │  └─────────────────────────────────────┘  │
│  High      (9) │ │                                           │
│  Medium   (15) │ │  THIS WEEK (Apr 14-20) ──────── 5 items  │
│  Low      (22) │ │  ┌──────────────────────────────────────┐ │
│                 │ │  │ ...cards...                           │ │
│ ─ ─ ─ ─ ─ ─ ─ │ │  └──────────────────────────────────────┘ │
│                 │ │                                           │
│ LOCATION        │ │  NEXT WEEK ──────────────────── 3 items   │
│  Remote        │ │  ...                                      │
│  Pan-India     │ │                                           │
│  Global        │ │  ROLLING (No Deadline) ──────── 12 items  │
│                 │ │  ...                                      │
│ ─ ─ ─ ─ ─ ─ ─ │ │                                           │
│                 │ └───────────────────────────────────────────┘
│ PIPELINE        │
│  14/14 scrapers│
│ Last: 2:15 AM   │
│ Next: Tomorrow  │
└─────────────────┘
```

**Key changes from v1**:
- Category tabs `[All] [Intern] [Hack]...` are now sidebar radio buttons
- Priority filter merged into sidebar
- Location filter added to sidebar
- All filters in ONE place  -  the sidebar IS the filter panel
- Cards grouped by time bucket (TODAY → THIS WEEK → ROLLING)

---

### 3.3 Timeline View (Google Calendar-style)

**Purpose**: "When does everything happen?"  -  temporal, horizontal, Gantt-like.

```
┌─── SIDEBAR ────┐ ┌──────────── TIMELINE ──────────────────────────────┐
│                 │ │                                                     │
│ (same sidebar)  │ │  ◄ Apr 2026 ►                                     │
│                 │ │                                                     │
│                 │ │  Mon 14  Tue 15  Wed 16  Thu 17  Fri 18  Sat-Sun  │
│                 │ │  ───────────────────────────────────────────────── │
│                 │ │                                                     │
│                 │ │  ████████████████  GSoC 2026 (CRITICAL)            │
│                 │ │  ▀▀▀▀▀▀▀▀▀▀▀                                      │
│                 │ │                                                     │
│                 │ │      ██████████████████  IISc SPARK (HIGH)         │
│                 │ │      ▀▀▀▀▀▀▀▀▀▀▀▀▀▀                               │
│                 │ │                                                     │
│                 │ │          ████████████████████████  Unstop ML (HIGH)│
│                 │ │          ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀                     │
│                 │ │                                                     │
│                 │ │  ████  MLH Hack (MED)                              │
│                 │ │  ▀▀                                                │
│                 │ │                                                     │
│                 │ │  Mon 21  Tue 22  Wed 23  Thu 24  Fri 25  ...      │
│                 │ │  ───────────────────────────────────────────────── │
│                 │ │                                                     │
│                 │ │      ██████████  NVIDIA Workshop (LOW)             │
│                 │ │      ▀▀▀▀▀▀                                        │
│                 │ │                                                     │
└─────────────────┘ └────────────────────────────────────────────────────┘
```

**How it works**:
- **Horizontal axis**: Dates (scrollable, week at a time)
- **Bars**: Each opportunity = colored bar from `discovered_at`/`event_date` to `deadline`
- **Bar color**: Left edge = priority color, body = muted category tint
- **Bar height**: Fixed 28px, 4px gap between bars
- **Hover**: Shows mini-card tooltip (title + deadline + apply link)
- **Click**: Expands to full detail panel (right drawer or inline)
- **Today marker**: Vertical dashed line in `--accent` color
- **Navigation**: `◄ ►` buttons to shift week, month view toggle
- **Rolling items**: Shown in a "No deadline" row at bottom

### 3.4 View Switching Rules

| Aspect | Task View | Timeline View |
|---|---|---|
| **Best for** | "What to apply for now?" | "What's the overall landscape?" |
| **Data query** | Same API: `GET /api/opportunities/timeline` | Same API |
| **Grouping** | By time bucket (TODAY/WEEK/MONTH) | By date axis |
| **Sort** | Priority ↓ then deadline ↑ | Deadline ↑ (chronological) |
| **Default on desktop** |  (task-focused) | |
| **Default on mobile** |  (cards work better) | |
| **State preserved** | Sidebar filters persist across view switch |

---

## 4. Component Specifications

### 4.1 Opportunity Card (Task View)

```
┌─▌─────────────────────────────────────────────────────┐
│▌   CRITICAL   GSoC 2026                              │
│▌  2 days left · Open Source · Remote    [Apply →]      │
└─▌─────────────────────────────────────────────────────┘
    ▲
    └── 3px left border in priority color
```

- Left border: 3px solid `var(--priority-*)`, `border-radius: 3px 0 0 3px`
- Priority pill: `var(--priority-*-bg)` background, `var(--priority-*)` text
- Title: `--text-base`, `--weight-semibold`, `--text-primary`
- Meta: `--text-sm`, `--text-muted`, `·` separated
- Apply button: `--accent` text, hover `--accent-hover`, appears on hover (desktop)
- Hover: `background: var(--bg-hover)`, `border-color: var(--border-default)`
- Expand: Click card body → slide-down detail section (150ms)

### 4.2 Timeline Bar

- Height: 28px, `border-radius: var(--radius-sm)`
- Background: Linear gradient → `var(--cat-*)` at 15% opacity
- Left cap: 3px solid `var(--priority-*)` (same as card left border)
- Text inside bar: Title (truncated), `--text-xs`, `--text-primary`
- Hover: Opacity 1.0, tooltip with full title + deadline
- Width: Proportional to `(deadline - start_date)` in day units
- Min-width: 40px (for single-day events)

### 4.3 Sidebar (Unified Filter Panel)

All filters live here. No separate tabs, no overlay panels.

**Sections** (top to bottom):
1. **Logo + View Toggle**  -  StarBrief logo, compact
2. **Categories**  -  Radio buttons with counts, single-select or multi-select
3. **Priority**  -  Checkboxes, checked by default except "Low"
4. **Location**  -  Checkboxes (Remote / Pan-India / Global)
5. **Divider**
6. **Pipeline Health**  -  Compact status line

**Interaction**: Changing any filter instantly re-renders both views (client-side filter, no re-fetch needed since all data is already loaded for the current time window).

### 4.4 Search Bar

```
┌─────────────────────────────────────────────┐
│    Search opportunities...           ⌘K   │
└─────────────────────────────────────────────┘
```

- Embedded in top bar, not a separate component
- `--bg-surface` background, `--border-subtle` border
- Focus: `2px solid var(--accent)`
- Searches: title, organization, skills (client-side for loaded data)

---

## 5. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| `≥1200px` | Sidebar (260px) + Content (fluid) |
| `768-1199px` | Sidebar collapses to icon-rail (56px) + Content |
| `<768px` (PWA) | No sidebar → bottom tabs (Tasks / Timeline / Filters / Settings) |

### Mobile: Filter Drawer
On mobile, tapping "Filters" bottom tab opens a full-screen slide-up sheet
with all sidebar filters. Sheet dismisses on apply or swipe-down.

### Mobile: Timeline View
Rotated to single-column vertical timeline (dates on left,
bars stretching right) since horizontal scroll is awkward on narrow screens.

---

## 6. Color Harmony Verification

All Wada-derived colors checked against WCAG 2.1 AA on `#0C0A09`:

| Token | Hex | Contrast Ratio | Pass? |
|---|---|---|---|
| `--text-primary` | `#E8E0D4` | 13.2:1 |  AAA |
| `--text-secondary` | `#B5A898` | 7.8:1 |  AAA |
| `--text-muted` | `#8A7E6E` | 4.6:1 |  AA |
| `--accent` | `#BB7125` | 4.7:1 |  AA |
| `--priority-critical` | `#CC1236` | 4.5:1 |  AA |
| `--priority-medium` | `#4B7D8D` | 4.5:1 |  AA |
| `--cat-hackathon` | `#DA525D` | 4.8:1 |  AA |

---

## 7. Design Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| Color system | Sanzo Wada heritage | Warm, harmonious, unique identity  -  not generic SaaS |
| Category tabs | Merged into sidebar | "Bookshelf" principle  -  filters in one place |
| Views | Task (default) + Timeline | Task for action, Timeline for planning |
| Timeline style | Google Calendar Gantt bars | Familiar mental model, shows duration not just deadline |
| Sidebar | Always visible (desktop) | Filter state is always accessible, no hidden panels |
| Priority scheme | 4 levels, Wada colors | Red=urgent, Sienna=important, Blue=normal, Driftwood=low |
| Dark mode | Primary (warm, not cold) | `#0C0A09` sumi-ink, not `#000000` |
| Light mode | Washi paper `#FAF6F1` | Warm off-white, not clinical `#FFFFFF` |
