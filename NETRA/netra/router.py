"""
Main routing orchestrator — ties together parsing, grid building,
A* pathfinding, exit selection, and congestion balancing.
"""

from __future__ import annotations

import time
from typing import Optional

from netra.models import (
    Person, Exit, PersonRoute, PathResult, BuildingLayout,
)
from netra.constants import (
    CONGESTION_WEIGHT, OVERCAPACITY_PENALTY, SAFE_ROUTE_BONUS,
)
from netra.grid import build_cost_grid
from netra.pathfinder import astar
from netra.parser import parse_layout
from netra.visualizer import visualize


# ── Exit Selection & Load Balancing ──────────────────────────────────────────

def _select_best_exit(
    person: Person,
    open_exits: list[Exit],
    cost_grid: list[list[float]],
    rows: int,
    cols: int,
    exit_load: dict[str, int],
) -> PersonRoute:
    """
    Run A* from *person* to every open exit, then pick the exit with the
    lowest **effective cost** = path_cost + congestion_penalty + capacity_penalty
    minus a bonus for danger-free routes.
    """
    best_result: Optional[PathResult] = None
    best_eff_cost = float("inf")
    best_exit_id = ""

    for ex in open_exits:
        result = astar(person.pos, ex.pos, cost_grid, rows, cols)
        if result is None:
            continue

        result.exit_id = ex.id
        load = exit_load.get(ex.id, 0)

        eff_cost = result.cost
        eff_cost += load * CONGESTION_WEIGHT
        if load >= ex.capacity:
            eff_cost += OVERCAPACITY_PENALTY
        if not result.passes_danger:
            eff_cost -= SAFE_ROUTE_BONUS

        if eff_cost < best_eff_cost:
            best_eff_cost = eff_cost
            best_result = result
            best_exit_id = ex.id

    if best_result is None:
        return PersonRoute(
            person_id=person.id,
            assigned_exit="NONE",
            path=[],
            cost=0.0,
            safe=False,
            trapped=True,
            warning=(
                f"⚠ TRAPPED: {person.id} at ({person.pos.r},{person.pos.c}) "
                f"[{person.status}] — no reachable exit. "
                f"Dispatch rescue team immediately."
            ),
        )

    return PersonRoute(
        person_id=person.id,
        assigned_exit=best_exit_id,
        path=best_result.path,
        cost=round(best_result.cost, 2),
        safe=not best_result.passes_danger,
        trapped=False,
    )


# ── Main Entry Point ────────────────────────────────────────────────────────

def generate_routes(layout_payload: dict) -> dict:
    """
    Main NETRA routing function.

    Pipeline
    --------
    1. Parse JSON payload → typed BuildingLayout
    2. Build weighted cost grid (walls=inf, danger=penalty, free=1)
    3. Filter to open exits
    4. Sort persons by priority descending (critical first)
    5. For each person, A* to every open exit → pick best (cost + congestion)
    6. Update exit load after each assignment
    7. Detect & flag trapped persons
    8. Return structured JSON result

    Parameters
    ----------
    layout_payload : dict
        Raw JSON body matching the NETRA input schema.

    Returns
    -------
    dict
        Complete evacuation plan ready for API response.
    """
    t0 = time.perf_counter()

    # 1. Parse
    layout = parse_layout(layout_payload)

    # 2. Cost grid
    cost_grid = build_cost_grid(layout)

    # 3. Open exits
    open_exits = [e for e in layout.exits if e.status == "open"]
    if not open_exits:
        elapsed = round((time.perf_counter() - t0) * 1000, 2)
        return {
            "error": "NO_OPEN_EXITS",
            "warnings": [
                "🚨 CRITICAL: All exits are blocked or closed. "
                "Full building lockdown — await rescue."
            ],
            "compute_ms": elapsed,
        }

    # 4. Priority sort
    sorted_persons = sorted(
        layout.persons, key=lambda p: p.priority, reverse=True,
    )

    # 5. Route each person
    exit_load: dict[str, int] = {e.id: 0 for e in open_exits}
    routes: list[PersonRoute] = []

    for person in sorted_persons:
        route = _select_best_exit(
            person, open_exits, cost_grid,
            layout.rows, layout.cols, exit_load,
        )
        routes.append(route)
        if not route.trapped:
            exit_load[route.assigned_exit] += 1

    # 6. Build response
    assignments:  dict[str, str]        = {}
    route_paths:  dict[str, list[dict]] = {}
    route_costs:  dict[str, float]      = {}
    safe_flags:   dict[str, bool]       = {}
    warnings:     list[str]             = []

    for rt in routes:
        assignments[rt.person_id] = rt.assigned_exit
        route_paths[rt.person_id] = [c.to_dict() for c in rt.path]
        route_costs[rt.person_id] = rt.cost
        safe_flags[rt.person_id]  = rt.safe
        if rt.warning:
            warnings.append(rt.warning)

    compute_ms = round((time.perf_counter() - t0) * 1000, 2)

    # 7. Visualization (for terminal demos)
    viz = visualize(layout, routes)

    return {
        "event_type":    layout.event_type,
        "building":      layout.name,
        "timestamp":     layout.timestamp,
        "total_persons": len(layout.persons),
        "total_exits":   len(open_exits),
        "assignments":   assignments,
        "route_paths":   route_paths,
        "route_costs":   route_costs,
        "safe_flags":    safe_flags,
        "exit_load":     exit_load,
        "warnings":      warnings,
        "compute_ms":    compute_ms,
        "_visualization": viz,
    }
