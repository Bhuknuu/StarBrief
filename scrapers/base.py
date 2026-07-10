"""
StarBrief — Base Scraper Interface
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Every scraper MUST inherit from BaseScraper and implement the
`daily_check` and/or `deep_crawl` methods.

This module also defines the core data structures:
  - OpportunityCategory  (enum)
  - RawOpportunity       (dataclass — what a scraper emits)
  - DailyCheckResult     (dataclass — daily sentinel output)
"""

from __future__ import annotations

import hashlib
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════
# Enums
# ═══════════════════════════════════════════════════════════

class OpportunityCategory(str, Enum):
    """Classification categories for opportunities."""
    INTERNSHIP = "internship"
    HACKATHON = "hackathon"
    WORKSHOP = "workshop"
    CONFERENCE = "conference"
    OPEN_SOURCE = "open_source"
    RESEARCH = "research"


class OpportunityStatus(str, Enum):
    """Lifecycle states of an opportunity."""
    ACTIVE = "active"
    DEADLINE_APPROACHING = "deadline_approaching"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    UPDATED = "updated"
    UNVERIFIED = "unverified"


# ═══════════════════════════════════════════════════════════
# Data Classes
# ═══════════════════════════════════════════════════════════

@dataclass
class RawOpportunity:
    """
    The universal output format that every scraper produces.
    This gets fed into the processing pipeline (pre-filter → dedup → Gemini → DB).
    """
    title: str
    organization: str
    category: OpportunityCategory
    source_url: str                                 # MANDATORY: verified link
    source_name: str                                # e.g. "Internshala", "Unstop"
    description: str                                # raw text, LLM will summarize

    apply_url: Optional[str] = None                 # direct application link
    deadline: Optional[datetime] = None
    event_date: Optional[datetime] = None
    location: Optional[str] = None
    is_remote: bool = False
    is_paid: Optional[bool] = None
    stipend_info: Optional[str] = None
    skills_mentioned: list[str] = field(default_factory=list)
    year_requirement: Optional[str] = None          # "2nd year", "pre-final", etc.
    is_female_exclusive: bool = False
    raw_html: Optional[str] = None                  # for change detection (hash)

    @property
    def content_hash(self) -> str:
        """MD5 hash of key content fields for change detection."""
        content = f"{self.title}|{self.organization}|{self.description}|{self.deadline}"
        return hashlib.md5(content.encode()).hexdigest()  # noqa: S324


@dataclass
class Breadcrumb:
    """
    A URL spotted during daily sentinel that hasn't been fully processed yet.
    Gets queued for the weekly deep crawler.
    """
    url: str
    source_name: str
    context: str                                    # why we think this is relevant
    discovered_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class DailyCheckResult:
    """What the daily sentinel returns for each scraper run."""
    scraper_name: str
    urls_checked: int = 0
    urls_expired: int = 0
    urls_updated: int = 0
    breadcrumbs: list[Breadcrumb] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


# ═══════════════════════════════════════════════════════════
# Default HTTP Headers
# ═══════════════════════════════════════════════════════════

USER_AGENTS = [
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) "
        "Version/17.4.1 Safari/605.1.15"
    ),
    (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
]


# ═══════════════════════════════════════════════════════════
# Base Scraper Interface
# ═══════════════════════════════════════════════════════════

class BaseScraper(ABC):
    """
    Abstract base class for all StarBrief scrapers.

    Every scraper must:
      1. Set `name`, `base_url`, `supports_daily`, `supports_weekly`
      2. Implement at least one of `daily_check()` or `deep_crawl()`
      3. Return properly structured data (RawOpportunity / DailyCheckResult)

    The base class provides:
      - A shared async httpx client (with retry + timeout + UA rotation)
      - Logging helpers
      - Rate-limit aware request methods
    """

    name: str = "base"
    base_url: str = ""
    supports_daily: bool = False
    supports_weekly: bool = False

    def __init__(self, config: dict | None = None) -> None:
        """
        Initialize with optional source config from sources.yaml.

        Args:
            config: Source-specific config dict from sources.yaml
        """
        self.config = config or {}
        self.rate_limit_seconds: float = self.config.get("rate_limit_seconds", 1.0)
        self._client: httpx.AsyncClient | None = None

    async def get_client(self) -> httpx.AsyncClient:
        """Get or create the shared async HTTP client."""
        if self._client is None or self._client.is_closed:
            import random
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0, connect=10.0),
                follow_redirects=True,
                headers={
                    "User-Agent": random.choice(USER_AGENTS),  # noqa: S311
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                },
            )
        return self._client

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def fetch(self, url: str, **kwargs: object) -> httpx.Response:
        """
        Rate-limit aware GET request with error handling.

        Args:
            url: URL to fetch
            **kwargs: Additional args passed to httpx.get()

        Returns:
            httpx.Response

        Raises:
            httpx.HTTPStatusError: On 4xx/5xx responses
        """
        import asyncio

        client = await self.get_client()

        # Rotate User-Agent if configured
        if self.config.get("rotate_user_agent"):
            import random
            client.headers["User-Agent"] = random.choice(USER_AGENTS)  # noqa: S311

        # Rate limit
        await asyncio.sleep(self.rate_limit_seconds)

        logger.debug("Fetching %s", url)
        response = await client.get(url, **kwargs)  # type: ignore[arg-type]
        response.raise_for_status()
        return response

    async def fetch_json(self, url: str, **kwargs: object) -> dict:
        """Fetch a URL and parse the response as JSON."""
        response = await self.fetch(url, **kwargs)
        return response.json()  # type: ignore[no-any-return]

    # ─── Abstract Methods ─────────────────────────────────

    async def daily_check(self, known_urls: list[str]) -> DailyCheckResult:
        """
        Daily sentinel: quick check for status updates + breadcrumbs.

        Args:
            known_urls: List of source_urls already in our DB

        Returns:
            DailyCheckResult with status updates and new breadcrumbs
        """
        raise NotImplementedError(
            f"{self.name} does not support daily checks"
        )

    async def deep_crawl(
        self,
        discovery_queue: list[str] | None = None,
    ) -> list[RawOpportunity]:
        """
        Weekly deep crawl: full scrape + pagination + queue processing.

        Args:
            discovery_queue: URLs from the discovery_queue table to process

        Returns:
            List of RawOpportunity objects found
        """
        raise NotImplementedError(
            f"{self.name} does not support deep crawl"
        )

    # ─── Lifecycle ────────────────────────────────────────

    async def __aenter__(self) -> "BaseScraper":
        """Async context manager entry."""
        return self

    async def __aexit__(self, *args: object) -> None:
        """Async context manager exit — close client."""
        await self.close()

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name={self.name!r}>"
