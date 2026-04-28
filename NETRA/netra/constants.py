"""
Tunable constants for the NETRA routing engine.

Adjust these values to change routing behavior without touching algorithm code.
"""

import math

SQRT2 = math.sqrt(2)

# ── Grid Cell Semantics ──────────────────────────────────────────────────────

CELL_FREE    = 0   # Walkable floor
CELL_WALL    = 1   # Permanent wall (impassable)
CELL_BLOCKED = 2   # Temporary blockage (impassable)
CELL_DANGER  = 3   # Hazardous area (passable with penalty)

# ── Danger Severity → Additive Cell Cost ─────────────────────────────────────
# High enough to discourage routing through danger,
# low enough to allow it when no safe alternative exists.

DANGER_PENALTY: dict[str, float] = {
    "low":    5.0,
    "medium": 15.0,
    "high":   50.0,
}

# Fraction of penalty that bleeds into adjacent cells (smoke / heat spread)
DANGER_SPREAD = 0.3

# ── Congestion & Exit Balancing ──────────────────────────────────────────────

# Additive cost per person already assigned to an exit
CONGESTION_WEIGHT = 3.0

# Large penalty when exit is at or over capacity
OVERCAPACITY_PENALTY = 100.0

# Cost bonus (subtracted) when a route avoids all danger zones
SAFE_ROUTE_BONUS = 2.0

# ── Movement Vectors ─────────────────────────────────────────────────────────
# 8-directional: (Δrow, Δcol, base_move_cost)

DIRECTIONS = [
    (-1,  0, 1.0),        # ↑
    ( 1,  0, 1.0),        # ↓
    ( 0, -1, 1.0),        # ←
    ( 0,  1, 1.0),        # →
    (-1, -1, SQRT2),      # ↖
    (-1,  1, SQRT2),      # ↗
    ( 1, -1, SQRT2),      # ↙
    ( 1,  1, SQRT2),      # ↘
]
