#!/usr/bin/env python3
"""
NETRA Demo Runner — CLI entry point for terminal demos.

Usage:
    python -m examples.demo                  # run built-in scenario
    python -m examples.demo payload.json     # run custom payload
"""

import json
import sys
from pathlib import Path

# Allow running from project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from netra.router import generate_routes
from netra.visualizer import print_banner

# ANSI helpers
_RESET  = "\033[0m"
_RED    = "\033[91m"
_GREEN  = "\033[92m"
_YELLOW = "\033[93m"
_BOLD   = "\033[1m"


def run_demo(payload: dict) -> None:
    """Execute routing and print formatted results."""
    print_banner()
    print(f"{_BOLD}▸ Running evacuation routing…{_RESET}\n")

    result = generate_routes(payload)

    # ASCII grid
    print(result.pop("_visualization", ""))

    # Summary
    print(f"\n{_BOLD}▸ Evacuation Plan{_RESET}")
    print(f"  Building : {result['building']}")
    print(f"  Event    : {result['event_type']}")
    print(f"  Persons  : {result['total_persons']}")
    print(f"  Exits    : {result['total_exits']}")
    print(f"  Compute  : {result['compute_ms']} ms")

    # Assignments
    print(f"\n{_BOLD}▸ Assignments{_RESET}")
    for pid, exit_id in result["assignments"].items():
        cost = result["route_costs"][pid]
        safe = result["safe_flags"][pid]
        tag = f"{_GREEN}SAFE{_RESET}" if safe else f"{_YELLOW}⚠ UNSAFE{_RESET}"
        steps = len(result["route_paths"][pid])
        print(f"  {pid:12s} → {exit_id:8s}  cost={cost:6.1f}  steps={steps:3d}  {tag}")

    # Exit load bars
    print(f"\n{_BOLD}▸ Exit Load{_RESET}")
    for eid, load in result["exit_load"].items():
        bar = "█" * load + "░" * (15 - load)
        print(f"  {eid:8s}  [{bar}] {load}")

    # Warnings
    if result["warnings"]:
        print(f"\n{_BOLD}{_RED}▸ Warnings{_RESET}")
        for w in result["warnings"]:
            print(f"  {w}")

    # JSON
    print(f"\n{_BOLD}▸ JSON Output (API-ready){_RESET}")
    print(json.dumps(result, indent=2))


def main():
    if len(sys.argv) > 1:
        path = Path(sys.argv[1])
        if not path.exists():
            print(f"Error: file not found: {path}")
            sys.exit(1)
        with open(path) as f:
            payload = json.load(f)
    else:
        fixtures = Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "demo_payload.json"
        with open(fixtures) as f:
            payload = json.load(f)

    run_demo(payload)


if __name__ == "__main__":
    main()
