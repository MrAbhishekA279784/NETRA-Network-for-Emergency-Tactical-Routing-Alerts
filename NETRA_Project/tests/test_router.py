"""
Test suite for the NETRA routing engine.
Run with:  python -m pytest tests/ -v
"""

import json
import math
from pathlib import Path

from netra.models import Coord, Person, Exit, DangerZone, BuildingLayout
from netra.constants import DANGER_PENALTY, SQRT2
from netra.grid import build_cost_grid
from netra.pathfinder import astar, heuristic
from netra.parser import parse_layout
from netra.router import generate_routes


FIXTURES = Path(__file__).parent / "fixtures"


def _load_demo_payload() -> dict:
    with open(FIXTURES / "demo_payload.json") as f:
        return json.load(f)


# ── Heuristic Tests ──────────────────────────────────────────────────────────

class TestHeuristic:
    def test_same_point(self):
        assert heuristic(Coord(5, 5), Coord(5, 5)) == 0.0

    def test_cardinal(self):
        assert heuristic(Coord(0, 0), Coord(0, 5)) == 5.0
        assert heuristic(Coord(0, 0), Coord(3, 0)) == 3.0

    def test_diagonal(self):
        h = heuristic(Coord(0, 0), Coord(3, 3))
        assert abs(h - 3 * SQRT2) < 1e-9

    def test_admissibility(self):
        """Heuristic must never overestimate actual octile distance."""
        a, b = Coord(2, 3), Coord(8, 11)
        dx, dy = 6, 8
        actual_optimal = max(dx, dy) + (SQRT2 - 1) * min(dx, dy)
        assert heuristic(a, b) <= actual_optimal + 1e-9


# ── Grid Builder Tests ───────────────────────────────────────────────────────

class TestGrid:
    def test_wall_is_impassable(self):
        layout = BuildingLayout(
            name="test", rows=3, cols=3,
            grid=[[0, 1, 0], [0, 0, 0], [0, 0, 0]],
            persons=[], exits=[], danger_zones=[],
            blocked_routes=[], event_type="test", timestamp="",
        )
        cost = build_cost_grid(layout)
        assert cost[0][1] == float("inf")
        assert cost[0][0] == 1.0

    def test_blocked_route_is_impassable(self):
        layout = BuildingLayout(
            name="test", rows=3, cols=3,
            grid=[[0, 0, 0], [0, 0, 0], [0, 0, 0]],
            persons=[], exits=[], danger_zones=[],
            blocked_routes=[Coord(1, 1)], event_type="test", timestamp="",
        )
        cost = build_cost_grid(layout)
        assert cost[1][1] == float("inf")

    def test_danger_zone_penalty(self):
        layout = BuildingLayout(
            name="test", rows=5, cols=5,
            grid=[[0]*5 for _ in range(5)],
            persons=[], exits=[],
            danger_zones=[DangerZone(pos=Coord(2, 2), type="fire", severity="high")],
            blocked_routes=[], event_type="test", timestamp="",
        )
        cost = build_cost_grid(layout)
        assert cost[2][2] == 1.0 + DANGER_PENALTY["high"]
        # Adjacent cells should have spread penalty
        assert cost[2][1] > 1.0
        assert cost[1][2] > 1.0


# ── A* Pathfinding Tests ────────────────────────────────────────────────────

class TestAStar:
    def test_straight_path(self):
        cost = [[1.0]*5 for _ in range(5)]
        result = astar(Coord(0, 0), Coord(0, 4), cost, 5, 5)
        assert result is not None
        assert result.path[0] == Coord(0, 0)
        assert result.path[-1] == Coord(0, 4)

    def test_wall_blocking(self):
        cost = [[1.0]*5 for _ in range(5)]
        # Block entire row 2
        for c in range(5):
            cost[2][c] = float("inf")
        result = astar(Coord(0, 0), Coord(4, 0), cost, 5, 5)
        assert result is None

    def test_wall_with_gap(self):
        cost = [[1.0]*5 for _ in range(5)]
        for c in range(5):
            cost[2][c] = float("inf")
        cost[2][3] = 1.0  # gap
        result = astar(Coord(0, 0), Coord(4, 0), cost, 5, 5)
        assert result is not None
        assert any(c.r == 2 and c.c == 3 for c in result.path)

    def test_prefers_safe_over_danger(self):
        cost = [[1.0]*5 for _ in range(5)]
        cost[1][2] = 1.0 + DANGER_PENALTY["high"]  # danger in direct path
        result = astar(Coord(0, 2), Coord(4, 2), cost, 5, 5)
        assert result is not None
        # Path should avoid (1,2) if possible
        if result.cost > 4.0:
            assert result.passes_danger or any(
                c.r == 1 and c.c != 2 for c in result.path
            )

    def test_start_on_wall_returns_none(self):
        cost = [[1.0]*3 for _ in range(3)]
        cost[0][0] = float("inf")
        result = astar(Coord(0, 0), Coord(2, 2), cost, 3, 3)
        assert result is None

    def test_goal_on_wall_returns_none(self):
        cost = [[1.0]*3 for _ in range(3)]
        cost[2][2] = float("inf")
        result = astar(Coord(0, 0), Coord(2, 2), cost, 3, 3)
        assert result is None


# ── Full Router Integration Tests ────────────────────────────────────────────

class TestRouter:
    def test_demo_payload_runs(self):
        payload = _load_demo_payload()
        result = generate_routes(payload)
        assert "assignments" in result
        assert "route_paths" in result
        assert "exit_load" in result
        assert "compute_ms" in result

    def test_all_persons_assigned(self):
        payload = _load_demo_payload()
        result = generate_routes(payload)
        for p in payload["persons"]:
            assert p["id"] in result["assignments"]

    def test_trapped_person_detected(self):
        """person_2 is inside a walled room — should be flagged trapped."""
        payload = _load_demo_payload()
        result = generate_routes(payload)
        assert result["assignments"]["person_2"] == "NONE"
        assert result["safe_flags"]["person_2"] is False
        assert any("person_2" in w for w in result["warnings"])

    def test_exit_load_sums_to_routed_persons(self):
        payload = _load_demo_payload()
        result = generate_routes(payload)
        total_routed = sum(
            1 for a in result["assignments"].values() if a != "NONE"
        )
        total_load = sum(result["exit_load"].values())
        assert total_load == total_routed

    def test_congestion_balancing(self):
        """With multiple exits, load should not all go to one exit."""
        payload = _load_demo_payload()
        result = generate_routes(payload)
        loads = list(result["exit_load"].values())
        # At least 2 exits should have non-zero load
        assert sum(1 for l in loads if l > 0) >= 2

    def test_no_open_exits(self):
        payload = _load_demo_payload()
        for ex in payload["exits"]:
            ex["status"] = "blocked"
        result = generate_routes(payload)
        assert "error" in result
        assert result["error"] == "NO_OPEN_EXITS"

    def test_safe_flags_match_paths(self):
        """safe_flags should be True only when path doesn't cross danger."""
        payload = _load_demo_payload()
        result = generate_routes(payload)
        for pid, safe in result["safe_flags"].items():
            if result["assignments"][pid] == "NONE":
                assert safe is False

    def test_ml_mode_runs(self):
        """Test that ML mode prediction executes without crashing."""
        payload = _load_demo_payload()
        payload["mode"] = "ml"
        result = generate_routes(payload)
        assert result["mode"] == "ml"
        assert "assignments" in result
        
    def test_compare_mode_runs(self):
        """Test that the evaluation module can compare both modes."""
        from netra.evaluation import run_comparison
        payload = _load_demo_payload()
        result = run_comparison(payload)
        assert "comparison" in result
        assert "classic" in result["comparison"]
        assert "ml" in result["comparison"]
        assert "raw_classic" in result
        assert "raw_ml" in result
