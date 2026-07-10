"""
StarBrief — Database Models (Python-side)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Pydantic models that mirror the PostgreSQL schema.
These are used by the Python pipeline (scrapers, processing)
to validate data before inserting into the DB.

The TypeScript/Drizzle side has its own schema (dashboard/lib/db.ts).
This file is the Python source of truth for DB ↔ Python data flow.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl


# ═══════════════════════════════════════════════════════════
# Opportunity (main table)
# ═══════════════════════════════════════════════════════════

class OpportunityCreate(BaseModel):
    """Fields required when inserting a new opportunity."""

    title: str
    organization: str
    category: str = Field(
        ...,
        pattern=r"^(internship|hackathon|workshop|conference|open_source|research)$",
    )

    # Temporal
    deadline: Optional[datetime] = None
    event_date: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    # Location
    location: Optional[str] = None
    geo_scope: Optional[str] = Field(
        None,
        pattern=r"^(local|pan_india|global)$",
    )
    is_remote: bool = False

    # Requirements
    min_year: Optional[int] = None
    max_year: Optional[int] = None
    skills_required: list[str] = Field(default_factory=list)
    is_paid: Optional[bool] = None
    stipend_range: Optional[str] = None
    is_female_exclusive: bool = False

    # Links (MANDATORY)
    source_url: str
    apply_url: Optional[str] = None
    source_name: str

    # Content
    raw_description: Optional[str] = None
    summary: Optional[str] = None
    content_hash: Optional[str] = None

    # Scoring
    base_relevance: float = 0.0

    # Status
    status: str = "active"


class OpportunityRecord(OpportunityCreate):
    """Full opportunity record as stored in the database."""

    id: UUID
    discovered_at: datetime
    last_checked_at: datetime
    url_valid: bool = True


# ═══════════════════════════════════════════════════════════
# Discovery Queue
# ═══════════════════════════════════════════════════════════

class DiscoveryQueueItem(BaseModel):
    """A breadcrumb URL queued for the weekly deep crawler."""

    url: str
    source_name: str
    context: Optional[str] = None
    discovered_at: datetime = Field(default_factory=datetime.utcnow)
    processed: bool = False
    processed_at: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════
# Scraper Run Log
# ═══════════════════════════════════════════════════════════

class ScraperRunCreate(BaseModel):
    """Log entry for a scraper execution."""

    scraper_name: str
    run_type: str = Field(..., pattern=r"^(daily|weekly)$")
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    items_found: int = 0
    items_new: int = 0
    items_updated: int = 0
    items_expired: int = 0
    errors: list[str] = Field(default_factory=list)
    status: str = "running"


class ScraperRunRecord(ScraperRunCreate):
    """Full scraper run record from the database."""

    id: UUID


# ═══════════════════════════════════════════════════════════
# User Profile
# ═══════════════════════════════════════════════════════════

class UserProfile(BaseModel):
    """User profile for personalized scoring."""

    id: Optional[UUID] = None
    name: str
    email: Optional[str] = None
    year_of_study: Optional[int] = None
    graduation_year: Optional[int] = None
    degree: Optional[str] = None
    interests: dict = Field(default_factory=dict)
    filters: dict = Field(default_factory=dict)
    notification_prefs: dict = Field(default_factory=dict)
    scoring_weights: dict = Field(default_factory=dict)


# ═══════════════════════════════════════════════════════════
# User-Opportunity Score
# ═══════════════════════════════════════════════════════════

class UserOpportunityScore(BaseModel):
    """Per-user relevance score for an opportunity."""

    user_id: UUID
    opportunity_id: UUID
    relevance_score: float = Field(..., ge=0.0, le=1.0)
    priority: str = Field(
        ...,
        pattern=r"^(critical|high|medium|low)$",
    )
    is_dismissed: bool = False
    is_saved: bool = False
    computed_at: datetime = Field(default_factory=datetime.utcnow)
