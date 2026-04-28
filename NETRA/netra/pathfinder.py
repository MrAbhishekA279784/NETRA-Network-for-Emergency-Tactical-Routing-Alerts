"""
A* pathfinding engine for the NETRA routing system.

Implements weighted A* with octile-distance heuristic on an 8-directional grid.
"""

from __future__ import annotations

import heapq
from typing import Optional

from netra.models import Coord, PathResult
from netra.constants import SQRT2, DIRECTIONS


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
                f_score = tentative + heuristic(Coord(nr, nc), goal)
                counter += 1
                heapq.heappush(open_set, (f_score, counter, nr, nc))

    return None  # unreachable
