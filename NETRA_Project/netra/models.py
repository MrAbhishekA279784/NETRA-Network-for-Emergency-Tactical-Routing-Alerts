"""
Typed data models for the NETRA routing engine.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Coord:
    """Immutable (row, col) grid coordinate."""
    r: int
    c: int

    def to_dict(self) -> dict:
        return {"r": self.r, "c": self.c}


@dataclass
class Person:
    """A person in the building requiring evacuation."""
    id: str
    pos: Coord
    priority: int       # 1 = normal … 5 = critical (injured, child, elderly)
    status: str         # "mobile" | "injured" | "elderly" | "child"


@dataclass
class Exit:
    """An exit point in the building."""
    id: str
    pos: Coord
    capacity: int
    status: str         # "open" | "blocked"


@dataclass
class DangerZone:
    """A hazardous area in the building."""
    pos: Coord
    type: str           # "fire" | "smoke" | "gas" | "collapse" …
    severity: str       # "low" | "medium" | "high"


@dataclass
class BuildingLayout:
    """Full building state snapshot for a routing request."""
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
