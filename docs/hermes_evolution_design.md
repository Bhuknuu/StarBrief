# StarBrief: Hermes Evolution System

Design and Research Document.

This document specifies the learning layer that transforms StarBrief from a static ranking system into one that adapts to user behavior over time. The name Hermes reflects the intent: a system that is fast, responsive, and changes its character based on what it observes, not just what it is initially configured to do.


## The Core Idea

The current scorer in StarBrief uses four fixed weights pulled from `default_profile.json`:

    field_match: 0.40
    deadline_urgency: 0.25
    organization_prestige: 0.20
    compensation: 0.15

These weights are a guess. They are the author's best estimate of what matters. But the actual behavior of a user tells you more than their initial estimate of their own preferences. When someone clicks through to a low-stipend research fellowship and ignores a high-stipend corporate internship, the numbers need to move.

The Hermes system watches what actually gets opened, liked, dismissed, and applied to, then adjusts the weights and the LLM prompt accordingly. It does not need a GPU. It does not need a training loop. It runs on math that fits in a Python file with no dependencies beyond the standard library.


## 1. Removing Personal Details

The first and simplest change. `config/default_profile.json` currently contains:

    "profile": {
        "name": "Developer",
        
        
        
    }

These details do not affect any scoring logic. The `profile` key is not read by any processing stage. The functional data is in `interests`, `filters`, `scoring_weights`, and `notification_prefs`.

The `profile` block will be removed entirely. The file becomes identity-free and safe to commit to a public repository.

### Updated default_profile.json Structure

```json
{
    "interests": {
        "primary": [
            "AI", "ML", "NLP", "LLM", "Deep Learning",
            "Data Science", "ANN", "CNN", "Computer Vision",
            "Generative AI", "Reinforcement Learning",
            "Natural Language Processing", "Transformers"
        ],
        "secondary": [
            "Hackathons", "Open Source", "Research",
            "Competitive Programming"
        ],
        "negative": [
            "Full Stack", "Frontend Development",
            "WordPress", "Marketing", "Sales", "HR"
        ]
    },
    "filters": {
        "locations": [],
        "paid_only": false,
        "female_exclusive": false,
        "min_stipend": null,
        "excluded_companies": ["SSZONE Technologies"],
        "target_companies": []
    },
    "notification_prefs": {
        "channels": ["web_push"],
        "frequency": "daily_digest",
        "digest_time": "08:00",
        "quiet_hours": { "start": "22:00", "end": "07:00" },
        "min_priority": "medium"
    },
    "scoring_weights": {
        "field_match": 0.40,
        "deadline_urgency": 0.25,
        "organization_prestige": 0.20,
        "compensation": 0.15
    }
}
```


## 2. Feedback Signal Architecture

### 2.1 What Gets Collected

The system collects two kinds of signals:

Explicit feedback, initiated by the user:
- `like`: User clicked the thumbs-up icon on a card.
- `unlike`: User clicked the thumbs-down icon on a card.

Implicit behavioral signals, collected automatically:
- `open`: User expanded a card to see its full detail.
- `dwell`: User had a card open for more than 8 seconds (indicates genuine reading, not accidental expansion).
- `apply_click`: User clicked the Apply button.
- `dismiss`: User dismissed a card (existing behavior, now feeds into the learning loop).

Signal weights for the adaptation engine:

    apply_click  +1.00   (strongest positive signal: actual intent to apply)
    like         +0.70   (explicit positive preference)
    dwell        +0.30   (implicit interest: read it properly)
    open         +0.10   (weak positive: at least noticed it)
    dismiss      -0.50   (explicit negative: do not want to see this)
    unlike       -0.80   (strong negative: actively disliked)

### 2.2 What Each Event Records

Every feedback event records:

```json
{
    "event_id": "evt_20260711_143022_abc",
    "timestamp": "2026-07-11T14:30:22+05:30",
    "signal": "like",
    "opportunity_id": "opp-uuid-here",
    "opportunity_snapshot": {
        "title": "GSoC 2026",
        "organization": "Google",
        "category": "open_source",
        "skills_required": ["Python", "Git", "C++"],
        "is_paid": true,
        "geo_scope": "global",
        "deadline_days_remaining": 2,
        "current_score": 0.84,
        "current_priority": "critical"
    }
}
```

The `opportunity_snapshot` is captured at event time because the opportunity record in the database can change (deadline updates, status changes). Storing the snapshot preserves the state the user actually reacted to.

### 2.3 Storage: feedback_log.json

Location: `config/feedback_log.json`. Created automatically on first feedback event. Never committed (add to .gitignore).

Structure:

```json
{
    "schema_version": 1,
    "created_at": "2026-07-11T00:00:00",
    "total_events": 47,
    "events": [
        { ... event objects ... }
    ]
}
```

The file grows linearly. At a rate of 10 feedback events per day, it reaches 1 MB after roughly 2 years. No rotation needed for a personal tool.


## 3. Bayesian Weight Adaptation

### 3.1 The Math

Each of the four scoring weights is governed by a Beta distribution. The Beta(alpha, beta) distribution models the probability of a "success" (positive outcome) from a continuous stream of observations.

Properties that make it ideal here:
- Domain is [0, 1], matching the weight domain.
- The expected value is alpha / (alpha + beta). Starts at 0.5 for symmetric priors.
- As observations accumulate, the distribution narrows: the system becomes more certain.
- Adding one observation is one line of arithmetic. No matrix operations.

Initial priors for each weight dimension, calibrated to the starting values in `default_profile.json`:

    field_match:           Beta(alpha=8.0,  beta=12.0)  -> E[X] = 0.40
    deadline_urgency:      Beta(alpha=5.0,  beta=15.0)  -> E[X] = 0.25
    organization_prestige: Beta(alpha=4.0,  beta=16.0)  -> E[X] = 0.20
    compensation:          Beta(alpha=3.0,  beta=17.0)  -> E[X] = 0.15

The alpha+beta sum (20 in each case) represents the "strength" of the prior: how many observations it takes to meaningfully shift the weight. Starting with sum=20 means the first 5 strong signals produce noticeable movement.

### 3.2 Update Rules

When a feedback event arrives with signal weight `w` (from the table in 2.1), decompose it into feature activations for the opportunity:

    field_match_active    = (len(skill_overlap) / len(primary_interests)) if skill_overlap else 0
    urgency_active        = 1.0 if deadline_days_remaining <= 7 else 0.5 if <= 30 else 0.0
    prestige_active       = get_org_prestige_score(organization)   # 0.0 to 1.0
    compensation_active   = 1.0 if is_paid else 0.5 if unknown else 0.0

For a positive signal (w > 0), add w * feature_active to alpha for that dimension:
    alpha += w * feature_active

For a negative signal (w < 0), add abs(w) * feature_active to beta:
    beta += abs(w) * feature_active

The new weight for that dimension is `alpha / (alpha + beta)`.

Normalize the four weights to sum to 1.0 after each update.

### 3.3 Thompson Sampling: Exploration Layer

Pure exploitation (always using the current best weights) causes the system to stop learning. If the weights converge early on "pay attention to deadline urgency", the system will stop showing rolling opportunities and never discover whether the user actually likes them.

Thompson Sampling adds an exploration layer. Instead of using `E[X] = alpha / (alpha + beta)` directly as the weight, the system samples from the distribution for each opportunity at scoring time:

```python
import random

def thompson_sample_weights(beta_state: dict) -> dict:
    """Sample weights from current Beta distributions."""
    sampled = {}
    for dim, (alpha, beta) in beta_state.items():
        # Sample from Beta distribution using gamma approximation
        # (no scipy needed: use the log-gamma trick)
        g1 = sample_gamma(alpha)
        g2 = sample_gamma(beta)
        sampled[dim] = g1 / (g1 + g2)
    
    # Normalize to sum to 1.0
    total = sum(sampled.values())
    return {k: v / total for k, v in sampled.items()}
```

Effect: most of the time, the sampled weights are close to the mean weights. Occasionally, one weight gets a high sample, causing an opportunity it would normally rank lower to surface higher. When the user reacts to that surfaced opportunity, the system learns something new.

As alpha+beta grows (more observations), the distribution narrows, samples converge toward the mean, and exploration naturally decreases. The system becomes more confident and more exploitative over time without any manual epsilon decay. This is the correct behavior: explore early, exploit late.

### 3.4 Gamma Sampling Without scipy

The standard Beta sampling trick using the ratio of two Gamma samples, implemented with only the Python standard library:

```python
import math
import random

def sample_gamma(shape: float) -> float:
    """
    Sample from Gamma(shape, 1) using Marsaglia-Tsang method.
    Works for shape >= 1. For shape < 1, use the boost trick.
    No scipy or numpy required.
    """
    if shape < 1.0:
        return sample_gamma(1.0 + shape) * (random.random() ** (1.0 / shape))
    
    d = shape - 1.0 / 3.0
    c = 1.0 / math.sqrt(9.0 * d)
    
    while True:
        x = random.gauss(0, 1)
        v = (1.0 + c * x) ** 3
        if v <= 0:
            continue
        u = random.random()
        if u < 1.0 - 0.0331 * (x ** 4):
            return d * v
        if math.log(u) < 0.5 * x**2 + d * (1.0 - v + math.log(v)):
            return d * v
```


## 4. Keyword List Evolution

Beyond shifting numeric weights, the system also evolves the keyword interest lists in the profile.

### 4.1 Skill Extraction from Feedback

Every liked opportunity has a `skills_required` array. Every dismissed opportunity has one too. The system tracks:

    skill_scores = {}   # skill -> (positive_count, negative_count)

After each feedback event:
- For a positive signal: increment `positive_count` for each skill in the opportunity.
- For a negative signal: increment `negative_count` for each skill in the opportunity.

A skill graduates to `interests.primary` when:
    positive_count >= 3 AND positive_count / (positive_count + negative_count) >= 0.75

A skill graduates to `interests.negative` when:
    negative_count >= 3 AND negative_count / (positive_count + negative_count) >= 0.75

Skills already in the hardcoded lists are not removed (those are the baseline).

### 4.2 Organization Affinity Tracking

Similarly, organizations that collect 3 or more positive signals move to `filters.target_companies`. Organizations that collect 3 or more negative signals move to `filters.excluded_companies`.

### 4.3 Category Affinity

If the user consistently likes or ignores an entire category (e.g., never engages with conferences), the system records this as a category preference multiplier in the evolved profile. This multiplier scales the final score:

    category_multipliers = {
        "internship":   1.0,   # neutral
        "hackathon":    1.3,   # liked more than expected
        "conference":   0.6,   # opened less than expected
        ...
    }

Updated using the same ratio logic as skill scores. Tracked per-category across all feedback events.


## 5. Prompt Evolution

### 5.1 What the LLM Prompt Currently Contains

The current structuring prompt has a fixed persona section and fixed output format. The persona section tells the LLM what kind of content to treat as "high quality":

    "You are a data extraction engine. Given this opportunity listing, return ONLY valid JSON..."

This prompt does not know that the user finds certain types of opportunities more interesting than others. It extracts everything equally.

### 5.2 What Should Change

Two prompt components evolve:

Component A: Persona rewrite. The persona section is regenerated daily to reflect the evolved profile. The LLM (Gemini Flash, called once per day during the daily sentinel) writes a new persona description based on the feedback log.

Input to the meta-prompt:

```
You are helping configure a data extraction system for an opportunity intelligence tool.

Based on this feedback history summary, rewrite the system persona for the extraction prompt:

Top liked categories: {top_liked_categories}
Top liked skills: {top_liked_skills}
Top dismissed organizations: {top_dismissed_orgs}
Apply click rate by category: {apply_rates}

The persona should tell the extraction system what to treat as "high quality" for this user.
It should be 2-3 sentences, written as a system instruction for an LLM.
Do not include any personal identifying information.
```

Output: a new persona string stored in `evolved_profile.json`.

Component B: Field emphasis tuning. The output format section of the prompt is adjusted based on which fields the user's feedback is most sensitive to.

If the user predominantly reacts to `skills_required` (liked opportunities always have matching skills, dismissed ones never do), the prompt gets an added instruction:

    "Be especially precise and complete when extracting skills_required. List all technical skills mentioned, including implicit ones."

If the user reacts heavily to `stipend_range`, the prompt adds:

    "Extract stipend_range in normalized format: '[amount]/[period] [currency]'. If stipend is not mentioned, output null rather than guessing."

The field emphasis decisions are computed from a simple correlation analysis over the feedback log: which fields show the highest variance between liked and dismissed opportunities.

### 5.3 Storage: evolved_profile.json

Location: `config/evolved_profile.json`. Created after 10 or more feedback events. Never committed. The pipeline loads this instead of `default_profile.json` when it exists.

Structure:

```json
{
    "schema_version": 1,
    "last_updated": "2026-07-11T03:00:00",
    "adaptation_count": 47,
    "beta_state": {
        "field_match":           [8.0, 12.0],
        "deadline_urgency":      [5.0, 15.0],
        "organization_prestige": [4.0, 16.0],
        "compensation":          [3.0, 17.0]
    },
    "current_weights": {
        "field_match": 0.40,
        "deadline_urgency": 0.25,
        "organization_prestige": 0.20,
        "compensation": 0.15
    },
    "category_multipliers": {
        "internship": 1.0,
        "hackathon": 1.0,
        "workshop": 1.0,
        "conference": 1.0,
        "open_source": 1.0,
        "research": 1.0
    },
    "skill_scores": {},
    "org_scores": {},
    "evolved_interests": {
        "primary": [],
        "negative": []
    },
    "evolved_companies": {
        "target": [],
        "excluded": []
    },
    "evolved_prompt_persona": null,
    "evolved_prompt_field_emphasis": []
}
```

The pipeline merges `default_profile.json` (baseline) with `evolved_profile.json` (learned delta) at scoring time. The evolved file never replaces the baseline: it supplements it.


## 6. Update Cadence

### 6.1 Event-Driven: Weight Updates (Immediate)

Every time a feedback event is logged by the dashboard, a client-side function immediately updates the Beta state in the browser's localStorage. This update is:
- Instant.
- No server round-trip.
- Synced to `evolved_profile.json` on the next API call (POST /api/feedback).

The server-side `evolved_profile.json` is updated asynchronously within a few seconds via a debounced background write. Weight changes take effect on the next scoring call (weekly pipeline or manual recompute).

### 6.2 Daily: Prompt Evolution (During Daily Sentinel)

The daily sentinel already runs at 2 AM IST. After completing its URL status checks and breadcrumb collection, it runs the adaptation step:

1. Reads `config/feedback_log.json`.
2. Computes the feedback summary statistics.
3. Calls Gemini Flash once with the meta-prompt to rewrite the persona.
4. Runs the field emphasis correlation analysis (pure Python, no LLM needed).
5. Writes the updated `evolved_profile.json`.

Cost: one Gemini Flash API call per day. Negligible.

### 6.3 Weekly: Score Recomputation

After the weekly deep crawl completes and new opportunities are inserted, the pipeline reads the current `evolved_profile.json` and recomputes scores for all active opportunities using the evolved weights and category multipliers. This is the step where the accumulated learning actually changes which items appear as Critical vs High vs Medium.


## 7. Dashboard UI Changes

### 7.1 Feedback Controls on Cards

The existing card layout:

```
┌─▌─────────────────────────────────────────────────────┐
│▌   CRITICAL   GSoC 2026                              │
│▌  2 days left · Open Source · Remote    [Apply →]      │
└─▌─────────────────────────────────────────────────────┘
```

Updated layout with feedback controls visible on hover:

```
┌─▌─────────────────────────────────────────────────────┐
│▌   CRITICAL   GSoC 2026                        [•]   │
│▌  2 days left · Open Source · Remote  [↑] [↓] [Apply] │
└─▌─────────────────────────────────────────────────────┘
                                          ^   ^
                                         like  unlike
                        [•] = read indicator dot (appears after card opened)
```

Controls behavior:
- `[↑]` and `[↓]` appear on card hover (desktop) or always visible (mobile).
- Active state: `[↑]` fills with sienna accent when liked; `[↓]` fills with carmine when unliked.
- Toggling a like/unlike: clicking the already-active icon reverts it to neutral (removes the signal).
- The two icons are mutually exclusive. Clicking `[↑]` while `[↓]` is active switches the signal.
- Read indicator dot `[•]` appears in the top-right corner after the card has been expanded once. Color: medium blue (`#4B7D8D`). Fades in on expand.

### 7.2 Sidebar: Adaptation Counter

The sidebar footer currently shows pipeline health. Add one line above it:

```
┌─────────────────────────────────────────┐
│  PROFILE ADAPTED 12 TIMES               │
│  Last update: 3 hours ago               │
│  ─────────────────────────────────────  │
│   6/6 scrapers active                  │
│  Last crawl: 2:15 AM                    │
└─────────────────────────────────────────┘
```

The counter reads from `evolved_profile.json.adaptation_count`. When the file does not exist (no feedback yet), the section reads: "Watching for feedback. Like or open cards to begin adapting."

### 7.3 New API Endpoints

```
POST /api/feedback
     Body: { opportunity_id, signal, opportunity_snapshot }
     Action: appends event to feedback_log.json, triggers async weight update
     Returns: { adaptation_count, weight_delta }

GET /api/profile/evolution
     Returns current evolved_profile.json summary:
     - current_weights (evolved vs baseline diff)
     - adaptation_count
     - top liked skills, top dismissed orgs
     - evolved_prompt_persona

POST /api/read
     Body: { opportunity_id, dwell_ms }
     Action: logs open/dwell events based on dwell_ms threshold (8000ms)
     Returns: { logged: true }

POST /api/profile/reset
     Deletes evolved_profile.json, resets to default_profile.json baseline
     Keeps feedback_log.json for audit purposes
```

### 7.4 Implicit Signal Collection: Implementation

In the dashboard, the `OpportunityCard` component already handles expand/collapse. Add:

```typescript
// On card expand
const expandedAt = Date.now();
logFeedbackEvent("open", opportunityId, opportunitySnapshot);

// On card collapse
const dwellMs = Date.now() - expandedAt;
if (dwellMs >= 8000) {
    logFeedbackEvent("dwell", opportunityId, opportunitySnapshot);
}

// On Apply button click
logFeedbackEvent("apply_click", opportunityId, opportunitySnapshot);
```

All implicit events are sent to `POST /api/read` (lightweight, no return value needed). Explicit like/unlike events go to `POST /api/feedback` (returns weight delta for immediate UI feedback).


## 8. Processing Pipeline Changes

### 8.1 Profile Loading

Current scorer:

```python
with open("config/default_profile.json") as f:
    profile = json.load(f)
```

Updated scorer:

```python
def load_active_profile() -> dict:
    """Load evolved profile if it exists, else fall back to default."""
    evolved_path = Path("config/evolved_profile.json")
    default_path = Path("config/default_profile.json")
    
    default = json.loads(default_path.read_text())
    
    if not evolved_path.exists():
        return default
    
    evolved = json.loads(evolved_path.read_text())
    
    # Merge: evolved data supplements, not replaces, the baseline
    merged = {
        "interests": {
            "primary": list(set(
                default["interests"]["primary"] + 
                evolved.get("evolved_interests", {}).get("primary", [])
            )),
            "secondary": default["interests"]["secondary"],
            "negative": list(set(
                default["interests"]["negative"] +
                evolved.get("evolved_interests", {}).get("negative", [])
            ))
        },
        "filters": {
            **default["filters"],
            "excluded_companies": list(set(
                default["filters"]["excluded_companies"] +
                evolved.get("evolved_companies", {}).get("excluded", [])
            )),
            "target_companies": list(set(
                default["filters"].get("target_companies", []) +
                evolved.get("evolved_companies", {}).get("target", [])
            ))
        },
        "scoring_weights": evolved.get("current_weights", default["scoring_weights"]),
        "category_multipliers": evolved.get("category_multipliers", {}),
        "notification_prefs": default["notification_prefs"],
        "evolved_prompt_persona": evolved.get("evolved_prompt_persona"),
        "evolved_prompt_field_emphasis": evolved.get("evolved_prompt_field_emphasis", [])
    }
    
    return merged
```

### 8.2 Evolved Scorer

The scoring function gets two additions: category multiplier and Thompson Sampling.

```python
def compute_relevance_evolved(
    opportunity: dict, 
    profile: dict,
    use_thompson_sampling: bool = True
) -> tuple[float, str]:
    """
    Evolved scorer using Bayesian weights with Thompson Sampling exploration.
    Returns (score: 0.0-1.0, priority: critical|high|medium|low)
    """
    from processing.adaptation import get_weights
    
    # Get weights: sampled (exploration) or expected value (exploitation)
    if use_thompson_sampling:
        weights = get_weights(sample=True)   # Thompson sample
    else:
        weights = get_weights(sample=False)  # Expected value
    
    score = 0.0
    
    # Field match
    skill_overlap = set(opportunity["skills_required"]) & set(profile["interests"]["primary"])
    field_match = len(skill_overlap) / max(len(profile["interests"]["primary"]), 1)
    score += weights["field_match"] * field_match
    
    # Deadline urgency
    if opportunity["deadline"]:
        days_left = (opportunity["deadline"] - datetime.now()).days
        urgency = 1.0 if days_left <= 3 else 0.8 if days_left <= 7 else 0.5 if days_left <= 14 else 0.2
        score += weights["deadline_urgency"] * urgency
    
    # Organization prestige
    prestige = get_org_prestige(opportunity["organization"])
    score += weights["organization_prestige"] * prestige
    
    # Compensation
    comp = 1.0 if opportunity["is_paid"] else 0.5 if opportunity["is_paid"] is None else 0.0
    score += weights["compensation"] * comp
    
    # Apply category multiplier (from evolved profile)
    category = opportunity.get("category", "internship")
    multiplier = profile.get("category_multipliers", {}).get(category, 1.0)
    score = min(1.0, score * multiplier)
    
    # Negative interest penalty
    for neg in profile["interests"].get("negative", []):
        if neg.lower() in opportunity.get("raw_description", "").lower():
            score *= 0.5
            break
    
    # Priority bucket
    priority = "critical" if score >= 0.75 else "high" if score >= 0.50 else "medium" if score >= 0.25 else "low"
    
    return (round(score, 3), priority)
```

### 8.3 Adaptation Module

New file: `processing/adaptation.py`

```python
"""
StarBrief Hermes Evolution System
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Bayesian weight adaptation with Thompson Sampling.

No external dependencies beyond the Python standard library.
"""

from __future__ import annotations

import json
import math
import random
from datetime import datetime
from pathlib import Path
from typing import Literal

EVOLVED_PROFILE_PATH = Path("config/evolved_profile.json")
FEEDBACK_LOG_PATH = Path("config/feedback_log.json")
DEFAULT_PROFILE_PATH = Path("config/default_profile.json")

SIGNAL_WEIGHTS = {
    "apply_click": +1.00,
    "like":        +0.70,
    "dwell":       +0.30,
    "open":        +0.10,
    "dismiss":     -0.50,
    "unlike":      -0.80,
}

INITIAL_BETA_STATE = {
    "field_match":           [8.0, 12.0],   # E[X] = 0.40
    "deadline_urgency":      [5.0, 15.0],   # E[X] = 0.25
    "organization_prestige": [4.0, 16.0],   # E[X] = 0.20
    "compensation":          [3.0, 17.0],   # E[X] = 0.15
}


def _sample_gamma(shape: float) -> float:
    """Marsaglia-Tsang gamma sampler. No scipy needed."""
    if shape < 1.0:
        return _sample_gamma(1.0 + shape) * (random.random() ** (1.0 / shape))
    d = shape - 1.0 / 3.0
    c = 1.0 / math.sqrt(9.0 * d)
    while True:
        x = random.gauss(0, 1)
        v = (1.0 + c * x) ** 3
        if v <= 0:
            continue
        u = random.random()
        if u < 1.0 - 0.0331 * (x ** 4):
            return d * v
        if math.log(u) < 0.5 * x**2 + d * (1.0 - v + math.log(v)):
            return d * v


def _sample_beta(alpha: float, beta: float) -> float:
    """Sample from Beta(alpha, beta) via gamma ratio."""
    g1 = _sample_gamma(alpha)
    g2 = _sample_gamma(beta)
    return g1 / (g1 + g2)


def get_weights(sample: bool = False) -> dict[str, float]:
    """
    Return current scoring weights.
    If sample=True, use Thompson Sampling (exploration).
    If sample=False, use expected value (exploitation).
    """
    state = _load_beta_state()
    
    if sample:
        raw = {dim: _sample_beta(a, b) for dim, (a, b) in state.items()}
    else:
        raw = {dim: a / (a + b) for dim, (a, b) in state.items()}
    
    total = sum(raw.values())
    return {k: v / total for k, v in raw.items()}


def record_feedback(
    signal: Literal["like", "unlike", "open", "dwell", "apply_click", "dismiss"],
    opportunity_snapshot: dict,
    profile: dict,
) -> dict:
    """
    Record a feedback event and update the Beta state.
    Returns the new weights dict.
    """
    event = _build_event(signal, opportunity_snapshot)
    _append_to_log(event)
    
    w = SIGNAL_WEIGHTS[signal]
    features = _extract_features(opportunity_snapshot, profile)
    
    state = _load_beta_state()
    
    for dim, activation in features.items():
        alpha, beta = state[dim]
        if w > 0:
            state[dim][0] += w * activation   # increment alpha
        else:
            state[dim][1] += abs(w) * activation  # increment beta
    
    _update_evolved_profile(state)
    _update_keyword_evolution(signal, opportunity_snapshot)
    _update_category_multipliers(signal, opportunity_snapshot.get("category"))
    
    return get_weights(sample=False)


def _extract_features(snapshot: dict, profile: dict) -> dict[str, float]:
    """Extract feature activations from an opportunity snapshot."""
    skills = set(snapshot.get("skills_required", []))
    primary = set(profile.get("interests", {}).get("primary", []))
    field_match = len(skills & primary) / max(len(primary), 1)
    
    days_left = snapshot.get("deadline_days_remaining", 30)
    urgency = 1.0 if days_left <= 7 else 0.5 if days_left <= 30 else 0.1
    
    # Placeholder prestige lookup (0.3 to 1.0 based on org name heuristics)
    org = snapshot.get("organization", "").lower()
    prestige_orgs = {"google", "meta", "microsoft", "amazon", "deepmind", "openai", "nvidia"}
    prestige = 0.9 if any(p in org for p in prestige_orgs) else 0.4
    
    comp = 1.0 if snapshot.get("is_paid") else 0.5 if snapshot.get("is_paid") is None else 0.0
    
    return {
        "field_match": field_match,
        "deadline_urgency": urgency,
        "organization_prestige": prestige,
        "compensation": comp,
    }
```


## 9. Daily Prompt Evolution Script

New function in `pipeline/daily.py` (to be created):

```python
async def evolve_prompt(profile: dict) -> str | None:
    """
    Calls Gemini Flash once to rewrite the LLM structuring prompt persona
    based on accumulated feedback patterns.
    Only runs if feedback_log.json has >= 10 events.
    """
    log = load_feedback_log()
    if log["total_events"] < 10:
        return None  # not enough data yet
    
    summary = compute_feedback_summary(log)
    
    meta_prompt = f"""
You are configuring a data extraction system for a personal opportunity intelligence tool.

Based on this feedback history, write a new system persona (2-3 sentences) for the
extraction LLM. The persona should tell it what to treat as high quality content.
Do not include any personal identifying information.

Feedback summary:
- Top liked categories: {summary['top_liked_categories']}
- Top liked skills: {summary['top_liked_skills']}
- Top dismissed organizations: {summary['top_dismissed_orgs']}
- Apply click rate by category: {summary['apply_rates']}
- User engages most with: {summary['top_engaged_sources']}

Write only the persona string. No JSON, no explanation.
"""

    response = await llm_router.call_llm(meta_prompt, max_tokens=150)
    return response.strip()
```


## 10. Reset and Rollback

The user can roll back the learning at any time.

Three reset levels:

1. Full reset: POST /api/profile/reset. Deletes `evolved_profile.json`. Reverts all weights to `default_profile.json` baseline. Keeps `feedback_log.json` for audit. The system starts re-learning from scratch.

2. Weight reset only: Resets `beta_state` to `INITIAL_BETA_STATE` in `evolved_profile.json`. Keeps keyword evolution and category multipliers. The scoring weights revert but discovered interests stay.

3. Prompt reset only: Sets `evolved_prompt_persona` to null in `evolved_profile.json`. Next structuring run uses the original fixed persona.

The sidebar footer link "Reset Learning" (small, muted, requires confirmation dialog) triggers a level-1 reset via the API.


## 11. New Files to Create

    config/feedback_log.json          Created automatically. Gitignored.
    config/evolved_profile.json       Created automatically. Gitignored.
    processing/adaptation.py          Bayesian adaptation engine.
    processing/prompt_evolution.py    Field emphasis correlation analysis.

### Updated Files

    config/default_profile.json       Remove personal details (profile block).
    config/.gitignore (or root)       Add feedback_log.json, evolved_profile.json.
    dashboard/components/OpportunityCard.tsx    Add like/unlike buttons, read dot.
    dashboard/components/Sidebar.tsx   Add adaptation counter in footer.
    dashboard/app/page.tsx             Wire feedback API calls.
    dashboard/lib/types.ts             Add FeedbackEvent, EvolvedProfile types.

### New API Routes

    dashboard/app/api/feedback/route.ts        POST /api/feedback
    dashboard/app/api/read/route.ts            POST /api/read
    dashboard/app/api/profile/evolution/route.ts   GET /api/profile/evolution
    dashboard/app/api/profile/reset/route.ts   POST /api/profile/reset


## 12. Future Scope: Neural Network Scorer

Deferred from current implementation. When feedback data reaches approximately 200 events (roughly 20-30 days of active use), a small neural network becomes viable.

Architecture: 8-12 input features (skill overlap, deadline urgency, org prestige, compensation, category one-hot), 2 hidden layers (16 and 8 units), 1 sigmoid output (relevance probability). Trained offline once per week on the feedback log as a supervised learning problem (liked/applied = 1, dismissed/unliked = 0).

Implementation path: use `numpy` only. Train with gradient descent over the feedback log. Serialize weights as a JSON array. Load at scoring time. The Beta adaptation system remains as the online learning layer on top of the neural network's base score.

Trigger for activation: system automatically proposes the neural network upgrade when `feedback_log.total_events >= 200`, showing a notice in the sidebar: "Enough feedback collected to upgrade to neural scoring. Enable?"


## 13. Implementation Priority Order

1. Remove personal details from `default_profile.json`. No code changes, immediate.
2. Add `feedback_log.json` and `evolved_profile.json` to `.gitignore`.
3. Write `processing/adaptation.py` with Beta state, Thompson Sampling, and `record_feedback`.
4. Add like/unlike UI to `OpportunityCard.tsx` with hover behavior.
5. Add read dot tracking to card expand logic.
6. Add POST /api/feedback and POST /api/read routes.
7. Add adaptation counter to `Sidebar.tsx` footer.
8. Update scorer to use `load_active_profile()` and `compute_relevance_evolved()`.
9. Write prompt evolution logic and wire into daily sentinel.
10. Add reset UI and POST /api/profile/reset route.
