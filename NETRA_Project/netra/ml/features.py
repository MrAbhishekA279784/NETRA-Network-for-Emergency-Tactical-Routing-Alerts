from __future__ import annotations

import math
from netra.models import BuildingLayout, Person, Coord
from netra.constants import CELL_WALL, CELL_BLOCKED, CELL_DANGER, SQRT2


def _heuristic(a: Coord, b: Coord) -> float:
    """Octile distance to safely estimate nearest exit distance."""
    dx = abs(a.r - b.r)
    dy = abs(a.c - b.c)
    return max(dx, dy) + (SQRT2 - 1) * min(dx, dy)


def compute_features_for_cell(
    r: int, c: int,
    layout: BuildingLayout,
    person: Person,
    base_cost_grid: list[list[float]]
) -> list[float]:
    """
    Extract ML features for a specific grid cell given the building context.
    
    Returns a vector [ 
        distance_to_nearest_exit,
        nearby_blocked_count,
        nearby_danger_count,
        danger_severity_score,
        person_mobility_score,
        base_cost,
        congestion_estimate
    ]
    """
    rows, cols = layout.rows, layout.cols
    current = Coord(r, c)
    
    # Feature 1: Distance to nearest open exit
    open_exits = [e for e in layout.exits if e.status == "open"]
    if open_exits:
        dist_to_exit = min(_heuristic(current, e.pos) for e in open_exits)
    else:
        dist_to_exit = 100.0  # arbitrary large number if no exits
        
    # Feature 2 & 3: Local neighborhood counts (3x3 area)
    nearby_blocked = 0
    nearby_danger = 0
    for dr in [-1, 0, 1]:
        for dc in [-1, 0, 1]:
            if dr == 0 and dc == 0:
                continue
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                cell_val = layout.grid[nr][nc]
                if cell_val in (CELL_WALL, CELL_BLOCKED):
                    nearby_blocked += 1
                elif cell_val == CELL_DANGER:
                    nearby_danger += 1
            else:
                # Out of bounds counts as blocked
                nearby_blocked += 1
                
    # Feature 4: Danger severity at this cell
    severity_map = {"low": 1.0, "medium": 2.0, "high": 3.0}
    severity_score = 0.0
    for dz in layout.danger_zones:
        if dz.pos.r == r and dz.pos.c == c:
            severity_score = max(severity_score, severity_map.get(dz.severity, 2.0))
            
    # Feature 5: Person mobility score (mobile=1.0, child=0.8, elderly=0.5, injured=0.3)
    mobility_map = {"mobile": 1.0, "child": 0.8, "elderly": 0.5, "injured": 0.3}
    mobility_score = mobility_map.get(person.status, 1.0)
    
    # Feature 6: Base A* cost (already includes wall/block/danger spread)
    base_cost = base_cost_grid[r][c]
    # Cap infinite cost heavily for ML processing
    if base_cost == float("inf"):
        base_cost = 1000.0
        
    # Feature 7: Congestion estimate (how many other active persons are nearby)
    congestion_est = 0
    for p in layout.persons:
        if p.id != person.id and abs(p.pos.r - r) <= 2 and abs(p.pos.c - c) <= 2:
            congestion_est += 1

    return [
        dist_to_exit,
        float(nearby_blocked),
        float(nearby_danger),
        severity_score,
        mobility_score,
        base_cost,
        float(congestion_est)
    ]
