"""
Input parser — converts raw JSON payloads into typed BuildingLayout objects.
"""

from netra.models import (
    BuildingLayout, Person, Exit, DangerZone, Coord,
)
from netra.constants import CELL_FREE


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
