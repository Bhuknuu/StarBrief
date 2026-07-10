"""
StarBrief Scrapers Package
~~~~~~~~~~~~~~~~~~~~~~~~~~
Source-specific scrapers that implement the BaseScraper interface.
Each scraper knows how to extract RawOpportunity objects from its target site.
"""

from scrapers.base import BaseScraper, RawOpportunity, OpportunityCategory

__all__ = ["BaseScraper", "RawOpportunity", "OpportunityCategory"]
