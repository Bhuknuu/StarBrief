"""
StarBrief — Database Connection
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Manages connections to Neon PostgreSQL for both sync (psycopg2)
and async (asyncpg) usage.

The scraper pipeline uses async connections.
One-off scripts / migrations can use sync connections.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager, contextmanager
from typing import AsyncGenerator, Generator

import asyncpg
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════

DATABASE_URL: str = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    logger.warning(
        "DATABASE_URL not set. Database operations will fail. "
        "Copy .env.example to .env and fill in your Neon connection string."
    )


# ═══════════════════════════════════════════════════════════
# Async Connection Pool (asyncpg — used by scrapers/pipeline)
# ═══════════════════════════════════════════════════════════

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    """
    Get or create the global async connection pool.

    Returns:
        asyncpg.Pool instance connected to Neon PostgreSQL.

    Raises:
        RuntimeError: If DATABASE_URL is not configured.
    """
    global _pool  # noqa: PLW0603

    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not set. Cannot connect to database."
        )

    if _pool is None or _pool._closed:  # type: ignore[attr-defined]
        logger.info("Creating async connection pool to Neon PostgreSQL...")
        _pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=1,
            max_size=5,       # free tier is fine with small pool
            command_timeout=30,
            statement_cache_size=0,  # Neon compatibility
        )
        logger.info("Connection pool created successfully.")

    return _pool


async def close_pool() -> None:
    """Close the global async connection pool."""
    global _pool  # noqa: PLW0603
    if _pool and not _pool._closed:  # type: ignore[attr-defined]
        await _pool.close()
        _pool = None
        logger.info("Connection pool closed.")


@asynccontextmanager
async def get_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    """
    Async context manager for a single database connection.

    Usage:
        async with get_connection() as conn:
            rows = await conn.fetch("SELECT * FROM opportunities LIMIT 10")
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn


# ═══════════════════════════════════════════════════════════
# Sync Connection (psycopg2 — used by migrations/one-off scripts)
# ═══════════════════════════════════════════════════════════

@contextmanager
def get_sync_connection() -> Generator[psycopg2.extensions.connection, None, None]:
    """
    Sync context manager for a psycopg2 connection.

    Usage:
        with get_sync_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
    """
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not set. Cannot connect to database."
        )

    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ═══════════════════════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════════════════════

async def check_health() -> dict:
    """
    Quick health check — returns connection status and server version.

    Returns:
        dict with keys: connected (bool), version (str), error (str|None)
    """
    try:
        async with get_connection() as conn:
            version = await conn.fetchval("SELECT version()")
            return {
                "connected": True,
                "version": version,
                "error": None,
            }
    except Exception as e:
        return {
            "connected": False,
            "version": None,
            "error": str(e),
        }
