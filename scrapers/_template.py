"""
StarBrief — Scraper Template
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Copy this file to create a new scraper. Replace the placeholders
with your source-specific logic.

Usage:
    1. Copy this file: `cp _template.py my_source.py`
    2. Rename the class
    3. Implement daily_check() and/or deep_crawl()
    4. Register in config/sources.yaml
    5. Add to pipeline/daily.py and/or pipeline/weekly.py

See docs/ADD_A_SCRAPER.md for a step-by-step guide.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from bs4 import BeautifulSoup

from scrapers.base import (
    BaseScraper,
    Breadcrumb,
    DailyCheckResult,
    OpportunityCategory,
    RawOpportunity,
)

logger = logging.getLogger(__name__)


class TemplateScraper(BaseScraper):
    """
    Template scraper — replace with your source name.

    Source:  https://example.com
    Method:  httpx + BeautifulSoup (server-rendered HTML)
    Daily:   ✓ / ✗
    Weekly:  ✓ / ✗
    Auth:    None / API key / etc.
    Gotchas: (note any rate limits, JS rendering, etc.)
    """

    name = "template"
    base_url = "https://example.com"
    supports_daily = True
    supports_weekly = True

    # ─── Daily Check ──────────────────────────────────────

    async def daily_check(self, known_urls: list[str]) -> DailyCheckResult:
        """
        Quick check for status updates + spot new URLs (breadcrumbs).
        Should run in < 2 minutes.
        """
        result = DailyCheckResult(scraper_name=self.name)

        try:
            response = await self.fetch(self.base_url)
            soup = BeautifulSoup(response.text, "lxml")

            # TODO: Parse listings from the page
            # For each listing:
            #   - If URL is in known_urls → check for changes
            #   - If URL is new → add as breadcrumb

            # Example breadcrumb:
            # result.breadcrumbs.append(Breadcrumb(
            #     url="https://example.com/listing/123",
            #     source_name=self.name,
            #     context="Found on front page, looks like AI internship",
            # ))

            result.urls_checked = 0  # TODO: set actual count

        except Exception as e:
            logger.error("Daily check failed for %s: %s", self.name, e)
            result.errors.append(str(e))

        return result

    # ─── Deep Crawl ───────────────────────────────────────

    async def deep_crawl(
        self,
        discovery_queue: list[str] | None = None,
    ) -> list[RawOpportunity]:
        """
        Full scrape: process discovery queue + paginate for new items.
        May run for 5-10 minutes.
        """
        opportunities: list[RawOpportunity] = []

        try:
            # Step 1: Process any URLs from the discovery queue
            for url in (discovery_queue or []):
                try:
                    opp = await self._scrape_single(url)
                    if opp:
                        opportunities.append(opp)
                except Exception as e:
                    logger.warning("Failed to scrape %s: %s", url, e)

            # Step 2: Paginate the main listing
            max_pages = self.config.get("weekly_pages", 3)
            for page in range(1, max_pages + 1):
                try:
                    page_opps = await self._scrape_page(page)
                    opportunities.extend(page_opps)
                except Exception as e:
                    logger.warning("Page %d failed for %s: %s", page, self.name, e)
                    break  # stop pagination on failure

        except Exception as e:
            logger.error("Deep crawl failed for %s: %s", self.name, e)

        logger.info(
            "%s deep crawl complete: %d opportunities found",
            self.name,
            len(opportunities),
        )
        return opportunities

    # ─── Helpers ──────────────────────────────────────────

    async def _scrape_single(self, url: str) -> Optional[RawOpportunity]:
        """Scrape a single listing page and extract an opportunity."""
        response = await self.fetch(url)
        soup = BeautifulSoup(response.text, "lxml")

        # TODO: Extract fields from the page
        # Return None if the page doesn't contain a valid opportunity

        return None  # TODO: implement

    async def _scrape_page(self, page: int) -> list[RawOpportunity]:
        """Scrape a single page of listings."""
        # TODO: Build paginated URL and parse listings
        return []  # TODO: implement
