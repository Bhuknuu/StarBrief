"""
StarBrief — Test Configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Shared fixtures for pytest. All test files can use these.
"""

from __future__ import annotations

import pytest

from scrapers.base import OpportunityCategory, RawOpportunity


@pytest.fixture
def sample_opportunity() -> RawOpportunity:
    """A valid RawOpportunity for testing."""
    return RawOpportunity(
        title="AI/ML Research Internship",
        organization="IISc Bangalore",
        category=OpportunityCategory.INTERNSHIP,
        source_url="https://iisc.ac.in/internships/aiml-2026",
        source_name="iit_iisc",
        description=(
            "Summer research internship in the AI/ML lab. "
            "Work on cutting-edge deep learning research with faculty mentors. "
            "Stipend of ₹25,000/month."
        ),
        apply_url="https://iisc.ac.in/apply",
        location="Bangalore",
        is_remote=False,
        is_paid=True,
        stipend_info="₹25,000/month",
        skills_mentioned=["Python", "PyTorch", "Deep Learning"],
        year_requirement="pre-final",
    )


@pytest.fixture
def sample_excluded_opportunity() -> RawOpportunity:
    """An opportunity that should be filtered out by pre-filter."""
    return RawOpportunity(
        title="Marketing Intern",
        organization="SSZONE Technologies",
        category=OpportunityCategory.INTERNSHIP,
        source_url="https://sszone.com/jobs/marketing",
        source_name="internshala",
        description="Looking for a social media manager to handle our marketing.",
    )


@pytest.fixture
def sample_opportunities() -> list[RawOpportunity]:
    """A batch of varied opportunities for testing."""
    return [
        RawOpportunity(
            title="GSoC 2026 — LangChain",
            organization="Google",
            category=OpportunityCategory.OPEN_SOURCE,
            source_url="https://summerofcode.withgoogle.com/programs/2026",
            source_name="github_issues",
            description="Contribute to LangChain during Google Summer of Code.",
            is_remote=True,
            is_paid=True,
            stipend_info="$1,500 – $6,600",
            skills_mentioned=["Python", "LLM", "NLP"],
        ),
        RawOpportunity(
            title="Unstop ML Hackathon",
            organization="Unstop",
            category=OpportunityCategory.HACKATHON,
            source_url="https://unstop.com/hackathons/ml-hack-2026",
            source_name="unstop",
            description="48-hour machine learning hackathon with ₹1L prize pool.",
            is_remote=True,
            skills_mentioned=["Machine Learning", "Python", "TensorFlow"],
        ),
        RawOpportunity(
            title="MLH Global Hack Week",
            organization="Major League Hacking",
            category=OpportunityCategory.HACKATHON,
            source_url="https://mlh.io/events/ghw-2026",
            source_name="mlh",
            description="Week-long hackathon with workshops and prizes.",
            is_remote=True,
        ),
    ]
