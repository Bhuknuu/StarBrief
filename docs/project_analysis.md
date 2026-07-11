# StarBrief: Project Description and Technical Analysis

Source: `D:\Programs\Github\StarBrief`


## 1. Project Overview

StarBrief (the name combines A* search with "brief" for concise intelligence) is an Automated CS Opportunity Intelligence Pipeline. It aggregates computer science opportunities from 14 online sources, filters them through a multi-stage Python pipeline backed by LLMs, and presents the results on a custom web dashboard.

The project exists to solve a personal frustration: relevant internships, hackathons, and research programs get posted to a dozen different platforms, and checking all of them manually means either missing deadlines or spending half an hour every morning doing repetitive searches.

The system runs entirely on free-tier infrastructure. GitHub Actions handles scheduling. Neon PostgreSQL stores the data. Vercel hosts the dashboard. The only external cost is the developer's time.


## 2. Directory Structure

    StarBrief/
    ├── config/
    │   ├── default_profile.json    User interests, scoring weights, notification prefs
    │   ├── exclusions.yaml         Disqualifying keywords, include keywords, regex patterns
    │   └── sources.yaml            Per-source crawl config (URLs, method, rate limits, filters)
    │
    ├── dashboard/                  Next.js 16 web app (TypeScript, React 19, Framer Motion)
    │   ├── app/                    Page entry point, global CSS, layout wrapper
    │   ├── components/             UI components: Sidebar, OpportunityCard, TaskView, TimelineView
    │   └── lib/                    TypeScript type definitions and Sanzo Wada color tokens
    │
    ├── db/
    │   ├── connection.py           Async connection pool via asyncpg, sync via psycopg2
    │   └── models.py               Pydantic v2 models mirroring the PostgreSQL schema
    │
    ├── docs/
    │   ├── design_research.md      Full UX design system: palette, layout, component specs
    │   ├── implementation_plan.md  Complete architectural blueprint: schema, API, scraper specs
    │   └── analysis.html           Self-contained project analysis report
    │
    ├── pipeline/                   Orchestrators for daily sentinel and weekly deep crawler
    ├── processing/                 Pipeline stages: filter, dedup, LLM structuring, scoring, validation
    ├── scrapers/                   Source-specific implementations extending BaseScraper
    ├── tests/                      Pytest suite with shared fixtures in conftest.py
    │
    ├── pyproject.toml              Project metadata, Ruff linting rules, MyPy config
    └── requirements.txt            Pip dependency list


## 3. Core Architecture

The entire backend is free-tier and stateless. There is no always-on server. Every compute job is a GitHub Actions cron that runs, does its work, and exits.

Hosting decisions:

    Component           Service             Rationale
    Scheduler           GitHub Actions      Free for public repos. 2000 min/month private.
    Database            Neon PostgreSQL     Scale-to-zero. 0.5 GB free. Real SQL.
    LLM                 Groq + Gemini       Both free tiers. Groq for speed, Gemini as fallback.
    Dashboard           Vercel Hobby        Free static + serverless. Built-in cron backup.

### A. Dual-Cadence Crawl Engine

The key architectural decision is the dual cadence. Rather than running a full scrape every day (expensive, slow, likely to get rate-limited), the system splits the work:

Daily Sentinel (runs at 2 AM IST):
- Re-checks all active opportunity URLs with async HEAD requests, marking expired or updated ones in the database.
- Skims the front page or RSS feed of each source, collecting new URLs into the discovery_queue table without scraping the full listing. These are called breadcrumbs.
- Runtime budget: 10 to 15 minutes.

Weekly Deep Crawler (runs Sunday at 3 AM IST):
- Consumes the discovery queue, scraping each breadcrumb URL fully.
- Paginates 3 to 5 pages deep into each source.
- Hits Reddit, university portals (IIT, IISc), and newsletter archives.
- Runs all new items through the full processing pipeline.
- Runtime budget: 30 to 45 minutes.

### B. Processing Pipeline

Every raw scraped item goes through five stages:

Stage 1: Rule-Based Pre-Filter. A keyword filter using inclusions and exclusions from exclusions.yaml discards irrelevant items before any API call. Expected elimination rate: approximately 60% of raw items. This is the most important cost-saving measure in the pipeline.

Stage 2: Fuzzy and Semantic Deduplication. The thefuzz library compares title and organization strings with an 85% similarity threshold. For items that pass fuzzy dedup, cosine similarity of Google text-embedding-004 vectors catches semantic duplicates: the same opportunity listed on three platforms with different wording.

Stage 3: LLM Structuring. The remaining items go to a Groq (Llama 3 70B) prompt that returns structured JSON: category, 2-3 line summary, skills array, year requirements, stipend range, geo scope, and a base quality score. LiteLLM automatically falls back to Gemini 1.5 Flash on any Groq error. A two-prompt Actor-Critic reflection loop then checks the output for hallucinated dates or URLs not found in the source text, rerouting to Gemini for re-extraction if the critic says YES.

Stage 4: Persona Scoring. A local Python function (no LLM) computes relevance against default_profile.json using four weighted factors: field match (skill overlap with user interests), deadline urgency (days remaining mapped to a score), organization prestige (simple tier lookup), and compensation status. The result determines the priority bucket.

Stage 5: URL Validation and Write. HTTP HEAD requests verify that apply URLs are live. Valid items are bulk-inserted into Neon PostgreSQL. The discovery queue row is marked processed.

### C. Database Schema

Six tables, all in PostgreSQL:

    opportunities              Main table. One row per unique source_url.
    opportunity_changes        Audit log. Tracks field-level changes over time.
    discovery_queue            Breadcrumbs from the daily sentinel.
    scraper_runs               Execution logs: items found, new, updated, expired, errors.
    user_profiles              User configuration and interests (multi-user ready for Phase 3).
    user_opportunity_scores    Materialized per-user relevance scores and priority buckets.

Key design choices in the schema: source_url is a UNIQUE constraint on the opportunities table, preventing duplicates at the database level as a final safeguard. Deadlines can be NULL, representing rolling opportunities. The geo_scope enum (local, pan_india, global) is separate from the location text field.

Estimated steady-state data volume: under 10 MB, comfortably within Neon's 500 MB free tier.


## 4. Frontend and Design

The dashboard is a Next.js 16 App Router application using TypeScript, Pydantic v2, and Framer Motion.

### Sanzo Wada Color System

The palette derives from Japanese artist Sanzo Wada's 1933 color combinations, originally published as "A Dictionary of Color Combinations." The appeal is that Wada's combinations were curated for harmony rather than trend. They feel warm and timeless. On a screen, they read as distinctive rather than generic.

Primary tokens:

    Background (dark)   #0C0A09   Sumi-ink black
    Surface (dark)      #1A1614   Charred wood
    Background (light)  #FAF6F1   Washi paper
    Text primary        #E8E0D4   Unbleached silk
    Brand accent        #BB7125   Raw Sienna
    Critical priority   #CC1236   Wada Carmine
    Medium priority     #4B7D8D   Gobelin Blue

All text color combinations pass WCAG 2.1 AA contrast minimums on the dark background.

An animated film grain overlay at 5 to 8% opacity runs via a CSS SVG filter animation on the body element. It adds perceived depth to the flat dark background without any performance cost.

### The Bookshelf Principle

The information architecture follows one rule: data lives in one canonical place. The sidebar is the single source of truth for all filter state (categories, priority levels, location). Both the Task View and Timeline View read from it. Switching views does not trigger a re-fetch. No filter state is duplicated in tabs or overlays.

Task View: the default. A prioritized list grouped into time buckets (Today, This Week, This Month, Rolling). Cards show a priority-colored left border, organization, deadline, and skills. Clicking a card expands an inline detail section.

Timeline View: a Gantt-style calendar where each opportunity is a horizontal bar spanning from its start date or discovery date to its deadline. Bar colors encode category. Bar left caps encode priority. Useful for seeing the density of upcoming deadlines at a glance.


## 5. Implementation Status

The project is in the skeleton-to-core phase. The foundation is solid. The moving parts are not yet connected.

    Component                   Status      Notes
    Config files                Complete     sources.yaml, exclusions.yaml, default_profile.json
    Database connection         Complete     Async pool + sync context managers
    Database models             Complete     Pydantic v2 models for all 6 tables
    Scraper base class          Complete     BaseScraper with httpx client, UA rotation, rate limiting
    Scraper template            Complete     _template.py for adding new scrapers
    Scraper implementations     Not started  6 Phase 1 sources need concrete implementations
    Processing pipeline         Not started  pre_filter.py, dedup.py, llm_router.py, scorer.py
    Pipeline orchestrators      Not started  daily.py and weekly.py in pipeline/
    Database migrations         Not started  SQL migration scripts for creating tables
    GitHub Actions workflows    Not started  .github/workflows/daily.yml and weekly.yml
    Dashboard UI                Complete     All components built, Wada styles applied
    Dashboard API routes        Not started  Next.js route handlers connecting to Neon
    Dashboard data integration  Not started  page.tsx currently uses hardcoded dummy data


## 6. Technical Notes

Tailwind is not installed. The dashboard uses CSS Modules for component-scoped styles and defines a small set of utility classes in globals.css. The page.tsx file references class names like "flex items-center gap-4" which are custom-defined utilities, not Tailwind. This is intentional based on the globals.css source, but worth confirming before adding any new utility classes.

For Unstop, the implementation plan specifies using their public JSON API endpoint at /api/public/opportunity/search-new rather than parsing HTML. This is strongly recommended. Their HTML structure is complex and likely to break; their API response is stable and well-structured.

For Internshala, the plan specifies a 3-second rate limit delay between requests and user-agent rotation. The BaseScraper already implements both. The rate_limit_seconds value in sources.yaml is picked up automatically.

The reflection loop in Stage 3 adds two Groq API calls per item that passes through structuring. At 50 to 100 items per weekly run, this costs approximately 100 to 200 total Groq calls per week, well within the free tier. The reflection loop fires on every item, not just suspicious ones, which is the simplest implementation. A future optimization would be to run the critic only when the Actor output contains a future date or an external URL.
