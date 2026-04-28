"""
Cost grid builder — converts building layout into a weighted 2D traversal grid.
"""

from netra.models import BuildingLayout
from netra.constants import (
    CELL_WALL, CELL_BLOCKED, CELL_DANGER,
    DANGER_PENALTY, DANGER_SPREAD, DIRECTIONS,
)


def build_cost_grid(layout: BuildingLayout) -> list[list[float]]:
    """
    Convert the building layout into a 2-D cost grid.

    Rules
    -----
    • Walls / blocked cells  → inf  (impassable)
    • Danger cells           → 1.0 + severity penalty
    • Adjacent-to-danger     → 1.0 + penalty × DANGER_SPREAD  (smoke bleeds)
    • Free cells             → 1.0
    """
    rows, cols = layout.rows, layout.cols
    cost = [[1.0] * cols for _ in range(rows)]

    # Base grid (walls / pre-marked dangers)
    for r in range(min(rows, len(layout.grid))):
        for c in range(min(cols, len(layout.grid[r]))):
            cell = layout.grid[r][c]
            if cell == CELL_WALL or cell == CELL_BLOCKED:
                cost[r][c] = float("inf")
            elif cell == CELL_DANGER:
                cost[r][c] = 1.0 + DANGER_PENALTY["medium"]

    # Explicit blocked routes → impassable
    for b in layout.blocked_routes:
        if 0 <= b.r < rows and 0 <= b.c < cols:
            cost[b.r][b.c] = float("inf")

    # Danger zones with severity-aware cost + adjacency spread
    for dz in layout.danger_zones:
        r, c = dz.pos.r, dz.pos.c
        if 0 <= r < rows and 0 <= c < cols:
            penalty = DANGER_PENALTY.get(dz.severity, DANGER_PENALTY["medium"])
            cost[r][c] = 1.0 + penalty

            # Spread reduced penalty to neighbors (simulates smoke / heat)
            for dr, dc, _ in DIRECTIONS:
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and cost[nr][nc] != float("inf"):
                    spread = penalty * DANGER_SPREAD
                    cost[nr][nc] = max(cost[nr][nc], 1.0 + spread)

    return cost
