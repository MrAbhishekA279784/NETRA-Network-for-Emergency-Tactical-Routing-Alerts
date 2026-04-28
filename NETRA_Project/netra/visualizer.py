"""
ASCII grid visualizer for NETRA — renders building state with paths overlaid.
Used for terminal demos and debugging.
"""

from netra.models import BuildingLayout, PersonRoute

# ANSI color codes
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
            if layout.grid[r][c] == 1:
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

    # Paths (drawn before persons/exits so they aren't covered)
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


def print_banner():
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
