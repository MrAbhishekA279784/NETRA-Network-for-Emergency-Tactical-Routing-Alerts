"""
NETRA — Intelligent Crisis Awareness & Evacuation Guidance System
AI Routing Engine v1.0

Core module implementing A* pathfinding with:
  • Severity-aware danger zone penalties
  • Congestion-aware exit load balancing
  • Priority-based person routing (injured/elderly/children first)
  • Trapped-person detection & rescue warnings
  • ASCII grid visualization for demo

Team AGNI | Hackathon 2026
"""

from __future__ import annotations

import heapq
import json
import math
import time
from dataclasses import dataclass, field
from typing import Optional

# ──────────────────────────────────────────────────────────────────────────────
#  Constants
# ──────────────────────────────────────────────────────────────────────────────

SQRT2 = math.sqrt(2)

# Grid cell semantics
CELL_FREE    = 0
CELL_WALL    = 1
CELL_BLOCKED = 2
CELL_DANGER  = 3

# Danger severity → additive penalty on cell cost
# High enough to discourage, low enough to allow if no alternative exists
DANGER_PENALTY: dict[str, float] = {
    "low":    5.0,
    "medium": 15.0,
    "high":   50.0,
}

# Penalty multiplied by current load when scoring an exit for congestion
CONGESTION_WEIGHT = 3.0

# Bonus subtracted from effective cost when a route avoids all danger
SAFE_ROUTE_BONUS = 2.0

# Penalty when an exit is already at or over capacity
OVERCAPACITY_PENALTY = 100.0

# Spread factor — adjacent cells get this fraction of the danger penalty
DANGER_SPREAD = 0.3

# 8-directional movement vectors: (Δrow, Δcol, base_move_cost)
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


# ──────────────────────────────────────────────────────────────────────────────
#  Data Models
# ──────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class Coord:
    """Immutable (row, col) grid coordinate."""
    r: int
    c: int

    def to_dict(self) -> dict:
        return {"r": self.r, "c": self.c}


@dataclass
class Person:
    id: str
    pos: Coord
    priority: int       # 1 = normal … 5 = critical (injured, child, elderly)
    status: str         # "mobile" | "injured" | "elderly" | "child"


@dataclass
class Exit:
    id: str
    pos: Coord
    capacity: int
    status: str         # "open" | "blocked"


@dataclass
class DangerZone:
    pos: Coord
    type: str           # "fire" | "smoke" | "gas" | "collapse" …
    severity: str       # "low" | "medium" | "high"


@dataclass
class BuildingLayout:
    name: str
    rows: int
    cols: int
    grid: list[list[int]]
    persons: list[Person]
    exits: list[Exit]
    danger_zones: list[DangerZone]
    blocked_routes: list[Coord]
    event_type: str
    timestamp: str


@dataclass
class PathResult:
    """A* result from one person to one exit."""
    exit_id: str
    path: list[Coord]
    cost: float
    passes_danger: bool
    reachable: bool


@dataclass
class PersonRoute:
    """Final route assignment for a single person."""
    person_id: str
    assigned_exit: str
    path: list[Coord]
    cost: float
    safe: bool
    trapped: bool
    warning: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────────────
#  Grid Builder
# ──────────────────────────────────────────────────────────────────────────────

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


# ──────────────────────────────────────────────────────────────────────────────
#  A* Pathfinding
# ──────────────────────────────────────────────────────────────────────────────

def heuristic(a: Coord, b: Coord) -> float:
    """
    Octile distance — the optimal heuristic for 8-directional grids.
    Always admissible (never overestimates), tighter than Manhattan.
    """
    dx = abs(a.r - b.r)
    dy = abs(a.c - b.c)
    return max(dx, dy) + (SQRT2 - 1) * min(dx, dy)


def _get_neighbors(
    r: int, c: int,
    rows: int, cols: int,
    cost_grid: list[list[float]],
) -> list[tuple[int, int, float]]:
    """
    Return traversable neighbors of (r, c) with move costs.
    Diagonal moves are blocked if either adjacent cardinal cell is a wall
    (prevents corner-cutting through walls).
    """
    out: list[tuple[int, int, float]] = []
    for dr, dc, base in DIRECTIONS:
        nr, nc = r + dr, c + dc
        if not (0 <= nr < rows and 0 <= nc < cols):
            continue
        if cost_grid[nr][nc] == float("inf"):
            continue
        # Diagonal corner-cut guard
        if dr != 0 and dc != 0:
            if (cost_grid[r + dr][c] == float("inf") or
                    cost_grid[r][c + dc] == float("inf")):
                continue
        out.append((nr, nc, base * cost_grid[nr][nc]))
    return out


def astar(
    start: Coord,
    goal: Coord,
    cost_grid: list[list[float]],
    rows: int,
    cols: int,
) -> Optional[PathResult]:
    """
    A* search from *start* to *goal* on the weighted cost grid.

    Returns a PathResult on success, None if no path exists.

    Complexity
    ----------
    Time:  O(V log V)  where V = rows × cols  (heap operations dominate)
    Space: O(V)        for g-scores, came-from map, and open set
    """
    if cost_grid[start.r][start.c] == float("inf"):
        return None
    if cost_grid[goal.r][goal.c] == float("inf"):
        return None

    counter = 0                       # tie-breaker for heap stability
    open_set: list[tuple[float, int, int, int]] = []
    heapq.heappush(open_set, (heuristic(start, goal), counter, start.r, start.c))

    g_score: dict[tuple[int, int], float] = {(start.r, start.c): 0.0}
    came_from: dict[tuple[int, int], Optional[tuple[int, int]]] = {
        (start.r, start.c): None,
    }
    closed: set[tuple[int, int]] = set()

    while open_set:
        _f, _, cr, cc = heapq.heappop(open_set)

        if (cr, cc) in closed:
            continue
        closed.add((cr, cc))

        # Goal reached — reconstruct path
        if cr == goal.r and cc == goal.c:
            path: list[Coord] = []
            passes_danger = False
            node: Optional[tuple[int, int]] = (cr, cc)
            while node is not None:
                path.append(Coord(node[0], node[1]))
                if cost_grid[node[0]][node[1]] > 1.0:
                    passes_danger = True
                node = came_from[node]
            path.reverse()
            return PathResult(
                exit_id="",
                path=path,
                cost=g_score[(cr, cc)],
                passes_danger=passes_danger,
                reachable=True,
            )

        for nr, nc, move_cost in _get_neighbors(cr, cc, rows, cols, cost_grid):
            if (nr, nc) in closed:
                continue
            tentative = g_score[(cr, cc)] + move_cost
            if tentative < g_score.get((nr, nc), float("inf")):
                g_score[(nr, nc)] = tentative
                came_from[(nr, nc)] = (cr, cc)
                counter += 1
                heapq.heappush(
                    open_set,
                    (tentative + heuristic(Coord(nr, nc), goal), counter, nr, nc),
                )

    return None  # unreachable


# ──────────────────────────────────────────────────────────────────────────────
#  Exit Selection & Load Balancing
# ──────────────────────────────────────────────────────────────────────────────

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
        eff_cost += load * CONGESTION_WEIGHT                # congestion
        if load >= ex.capacity:
            eff_cost += OVERCAPACITY_PENALTY                # over capacity
        if not result.passes_danger:
            eff_cost -= SAFE_ROUTE_BONUS                    # prefer safe paths

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


# ──────────────────────────────────────────────────────────────────────────────
#  Input Parser
# ──────────────────────────────────────────────────────────────────────────────

def parse_layout(payload: dict) -> BuildingLayout:
    """Deserialize raw JSON dict into a typed BuildingLayout."""
    b = payload["building"]
    rows, cols = b["rows"], b["cols"]

    # Normalize grid to exact (rows × cols), padding with CELL_FREE
    raw = b.get("grid", [])
    grid: list[list[int]] = []
    for r in range(rows):
        if r < len(raw):
            row = list(raw[r][:cols])
            row += [CELL_FREE] * (cols - len(row))
        else:
            row = [CELL_FREE] * cols
        grid.append(row)

    persons = [
        Person(
            id=p["id"],
            pos=Coord(p["r"], p["c"]),
            priority=p.get("priority", 1),
            status=p.get("status", "mobile"),
        )
        for p in payload.get("persons", [])
    ]

    exits = [
        Exit(
            id=e["id"],
            pos=Coord(e["r"], e["c"]),
            capacity=e.get("capacity", 20),
            status=e.get("status", "open"),
        )
        for e in payload.get("exits", [])
    ]

    danger_zones = [
        DangerZone(
            pos=Coord(d["r"], d["c"]),
            type=d.get("type", "unknown"),
            severity=d.get("severity", "medium"),
        )
        for d in payload.get("danger_zones", [])
    ]

    blocked_routes = [
        Coord(br["r"], br["c"]) for br in payload.get("blocked_routes", [])
    ]

    return BuildingLayout(
        name=b.get("name", "Unknown"),
        rows=rows,
        cols=cols,
        grid=grid,
        persons=persons,
        exits=exits,
        danger_zones=danger_zones,
        blocked_routes=blocked_routes,
        event_type=payload.get("event_type", "unknown"),
        timestamp=payload.get("timestamp", ""),
    )


# ──────────────────────────────────────────────────────────────────────────────
#  ASCII Grid Visualizer (demo / debugging)
# ──────────────────────────────────────────────────────────────────────────────

# ANSI color codes for terminal output
_RESET  = "\033[0m"
_RED    = "\033[91m"
_GREEN  = "\033[92m"
_YELLOW = "\033[93m"
_BLUE   = "\033[94m"
_CYAN   = "\033[96m"
_BOLD   = "\033[1m"
_DIM    = "\033[2m"

_LEGEND = (
    f"\n{_BOLD}Legend:{_RESET}  "
    f"{_DIM}·{_RESET}=floor  "
    f"█=wall  "
    f"{_RED}▓{_RESET}=blocked  "
    f"{_YELLOW}🔥{_RESET}=fire  "
    f"{_YELLOW}💨{_RESET}=smoke  "
    f"{_GREEN}E{_RESET}=exit  "
    f"{_CYAN}P{_RESET}=person  "
    f"{_BLUE}○{_RESET}=path"
)


def visualize(layout: BuildingLayout, routes: list[PersonRoute]) -> str:
    """
    Render an ASCII map of the building with overlaid danger zones,
    exits, person positions, and computed evacuation paths.
    """
    rows, cols = layout.rows, layout.cols
    canvas = [[f"{_DIM}·{_RESET}" for _ in range(cols)] for _ in range(rows)]

    # Walls
    for r in range(rows):
        for c in range(cols):
            if layout.grid[r][c] == CELL_WALL:
                canvas[r][c] = "█"

    # Blocked routes
    for b in layout.blocked_routes:
        if 0 <= b.r < rows and 0 <= b.c < cols:
            canvas[b.r][b.c] = f"{_RED}▓{_RESET}"

    # Danger zones
    icon_map = {"fire": "🔥", "smoke": "💨", "gas": "☢ ", "collapse": "⚠ "}
    for dz in layout.danger_zones:
        if 0 <= dz.pos.r < rows and 0 <= dz.pos.c < cols:
            icon = icon_map.get(dz.type, f"{_YELLOW}!{_RESET}")
            canvas[dz.pos.r][dz.pos.c] = icon

    # Paths (draw before persons/exits so they don't cover them)
    path_cells: set[tuple[int, int]] = set()
    for route in routes:
        if route.trapped:
            continue
        for coord in route.path:
            path_cells.add((coord.r, coord.c))
    for r, c in path_cells:
        canvas[r][c] = f"{_BLUE}○{_RESET}"

    # Exits
    for ex in layout.exits:
        label = f"{_GREEN}{_BOLD}{ex.id[-1]}{_RESET}"
        if 0 <= ex.pos.r < rows and 0 <= ex.pos.c < cols:
            canvas[ex.pos.r][ex.pos.c] = label

    # Persons
    for p in layout.persons:
        if 0 <= p.pos.r < rows and 0 <= p.pos.c < cols:
            canvas[p.pos.r][p.pos.c] = f"{_CYAN}{_BOLD}P{_RESET}"

    # Assemble
    header = f"\n{_BOLD}  NETRA Grid — {layout.name}{_RESET}\n"
    col_idx = "  " + "".join(f"{c % 10}" for c in range(cols))
    lines = [header, col_idx]
    for r in range(rows):
        row_label = f"{r:2d}"
        lines.append(row_label + "".join(canvas[r][c] for c in range(cols)))
    lines.append(_LEGEND)
    return "\n".join(lines)


# ──────────────────────────────────────────────────────────────────────────────
#  Main Entry Point
# ──────────────────────────────────────────────────────────────────────────────

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

    # ── 1. Parse ──────────────────────────────────────────────────────────
    layout = parse_layout(layout_payload)

    # ── 2. Cost grid ──────────────────────────────────────────────────────
    cost_grid = build_cost_grid(layout)

    # ── 3. Open exits ─────────────────────────────────────────────────────
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

    # ── 4. Priority sort ──────────────────────────────────────────────────
    sorted_persons = sorted(
        layout.persons, key=lambda p: p.priority, reverse=True,
    )

    # ── 5. Route each person ──────────────────────────────────────────────
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

    # ── 6. Build response ─────────────────────────────────────────────────
    assignments:  dict[str, str]           = {}
    route_paths:  dict[str, list[dict]]    = {}
    route_costs:  dict[str, float]         = {}
    safe_flags:   dict[str, bool]          = {}
    warnings:     list[str]                = []

    for rt in routes:
        assignments[rt.person_id]  = rt.assigned_exit
        route_paths[rt.person_id]  = [c.to_dict() for c in rt.path]
        route_costs[rt.person_id]  = rt.cost
        safe_flags[rt.person_id]   = rt.safe
        if rt.warning:
            warnings.append(rt.warning)

    compute_ms = round((time.perf_counter() - t0) * 1000, 2)

    # ── 7. Visualization (for terminal demos) ─────────────────────────────
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
        "_visualization": viz,      # stripped before API response
    }


# ──────────────────────────────────────────────────────────────────────────────
#  Demo Payload & Runner
# ──────────────────────────────────────────────────────────────────────────────

DEMO_PAYLOAD = {
    "building": {
        "name": "Phoenix Mall — Floor 2",
        "rows": 20,
        "cols": 30,
        "grid": [
            # Row 0  — exit row
            [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            # Row 5
            [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            [0,0,0,0,0, 0,0,0,0,0, 1,1,1,1,1, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            [0,0,0,0,0, 0,0,0,0,0, 1,0,0,0,1, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            [0,0,0,0,0, 0,0,0,0,0, 1,0,0,0,1, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            [0,0,0,0,0, 0,0,0,0,0, 1,1,1,1,1, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            # Row 10  — partial interior wall with chokepoints
            [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            [1,1,1,1,1, 0,1,1,1,1, 1,1,1,1,1, 0,1,1,1,1, 1,1,1,1,1, 0,1,1,1,1],
            [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            # Row 15
            [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
            [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
        ],
    },
    "persons": [
        {"id": "person_1", "r": 3,  "c": 4,  "priority": 1, "status": "mobile"},
        {"id": "person_2", "r": 8,  "c": 12, "priority": 5, "status": "injured"},
        {"id": "person_3", "r": 15, "c": 20, "priority": 3, "status": "elderly"},
        {"id": "person_4", "r": 5,  "c": 25, "priority": 2, "status": "mobile"},
        {"id": "person_5", "r": 18, "c": 2,  "priority": 4, "status": "child"},
        {"id": "person_6", "r": 14, "c": 8,  "priority": 1, "status": "mobile"},
        {"id": "person_7", "r": 16, "c": 14, "priority": 2, "status": "mobile"},
    ],
    "exits": [
        {"id": "Exit A", "r": 0,  "c": 1,  "capacity": 15, "status": "open"},
        {"id": "Exit B", "r": 0,  "c": 28, "capacity": 10, "status": "open"},
        {"id": "Exit C", "r": 19, "c": 15, "capacity": 12, "status": "open"},
    ],
    "danger_zones": [
        {"r": 3,  "c": 10, "type": "fire",  "severity": "high"},
        {"r": 4,  "c": 10, "type": "smoke", "severity": "medium"},
        {"r": 4,  "c": 11, "type": "smoke", "severity": "low"},
        {"r": 13, "c": 22, "type": "fire",  "severity": "high"},
    ],
    "blocked_routes": [
        {"r": 6, "c": 5},
        {"r": 7, "c": 5},
    ],
    "event_type": "fire_incident",
    "timestamp": "2026-04-09T15:30:00Z",
}


def _print_banner():
    """Print a stylish ASCII banner for demo presentations."""
    banner = f"""
{_BOLD}{_CYAN}
    ███╗   ██╗███████╗████████╗██████╗  █████╗
    ████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗
    ██╔██╗ ██║█████╗     ██║   ██████╔╝███████║
    ██║╚██╗██║██╔══╝     ██║   ██╔══██╗██╔══██║
    ██║ ╚████║███████╗   ██║   ██║  ██║██║  ██║
    ╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝
{_RESET}
{_BOLD}    Intelligent Crisis Awareness & Evacuation Guidance{_RESET}
{_DIM}    Team AGNI · AI Routing Engine v1.0{_RESET}
{"─" * 56}
"""
    print(banner)


if __name__ == "__main__":
    _print_banner()

    print(f"{_BOLD}▸ Running evacuation routing on demo scenario…{_RESET}\n")
    result = generate_routes(DEMO_PAYLOAD)

    # Print the ASCII visualization
    print(result.pop("_visualization", ""))

    # Print summary
    print(f"\n{_BOLD}▸ Evacuation Plan{_RESET}")
    print(f"  Building : {result['building']}")
    print(f"  Event    : {result['event_type']}")
    print(f"  Persons  : {result['total_persons']}")
    print(f"  Exits    : {result['total_exits']}")
    print(f"  Compute  : {result['compute_ms']} ms")

    print(f"\n{_BOLD}▸ Assignments{_RESET}")
    for pid, exit_id in result["assignments"].items():
        cost = result["route_costs"][pid]
        safe = result["safe_flags"][pid]
        tag = f"{_GREEN}SAFE{_RESET}" if safe else f"{_YELLOW}⚠ UNSAFE{_RESET}"
        steps = len(result["route_paths"][pid])
        print(f"  {pid:12s} → {exit_id:8s}  cost={cost:6.1f}  steps={steps:3d}  {tag}")

    print(f"\n{_BOLD}▸ Exit Load{_RESET}")
    for eid, load in result["exit_load"].items():
        bar = "█" * load + "░" * (15 - load)
        print(f"  {eid:8s}  [{bar}] {load}")

    if result["warnings"]:
        print(f"\n{_BOLD}{_RED}▸ Warnings{_RESET}")
        for w in result["warnings"]:
            print(f"  {w}")

    # JSON output (API-ready, without visualization)
    print(f"\n{_BOLD}▸ JSON Output (API-ready){_RESET}")
    print(json.dumps(result, indent=2))
