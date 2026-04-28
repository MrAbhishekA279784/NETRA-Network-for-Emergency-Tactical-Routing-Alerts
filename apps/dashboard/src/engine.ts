// NETRA v2.0 — Production-Grade Evacuation Simulation Engine
// Binary-heap Dijkstra • Exit/Edge blocking • Danger zones • Load balancing

/* ═══════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════ */

export type XY = { x: number; y: number };

export type Node = { id: string; x: number; y: number; pct: XY; type: string };
export type EdgeRaw = { from: string; to: string };
export type ExitRaw = { id: string; node: string };
export type MeshRaw = { type: string; id: string; pos: { x: number; y: number; z: number }; size: { w: number; h: number; d: number }; label?: string };

export type MapData = {
  map_name: string;
  nodes: { id: string; type: string; x: number; y: number }[];
  edges: EdgeRaw[];
  exits: ExitRaw[];
  meshes: MeshRaw[];
};

export type ExitDef = { id: string; exitLabel: string; node: string; label: string; blocked: boolean };
export type Person = { id: string; node: string };
export type Incident = { node: string; pct: XY; radiusWorld: number; severity: 'low' | 'medium' | 'high' };

export type MeshNorm = {
  type: string; id: string; label?: string;
  pos: { x: number; y: number; z: number; pctX: number; pctY: number };
  size: { w: number; h: number; d: number; pctW: number; pctD: number };
};

export type Route = {
  person_id: string; exit_id: string;
  path_nodes: string[]; path_pcts: XY[];
  path_costs: number[]; cost: number;
};

export type ScenarioResult = {
  building: { nodes: Node[]; edges: { a: string; b: string }[]; meshes: MeshNorm[] };
  mapName: string;
  people: Person[];
  exits: ExitDef[];
  incident: Incident;
  blocked_edges: { a: string; b: string }[];
  routes: Route[];
  exitLoad: Record<string, number>;
  computeMs: number;
  spawnBatches: string[][];
  ui: UIData;
};

export type UIData = {
  totalPeople: number;
  blockedExitCount: number;
  blockedRouteCount: number;
  activeExits: ExitDef[];
  dangerPct: XY;
  incidentRadiusMeters: number;
  exitLoads: Record<string, number>;
  exitPcts: Record<string, number>;
  peopleDots: { id: string; x: number; y: number; exitId: string; color: string }[];
  routeOverlays: { userId: string; exitId: string; points: XY[]; style: string; color: string }[];
};

/* ═══════════════════════════════════════
   BINARY MIN-HEAP (Priority Queue)
   ═══════════════════════════════════════ */

class MinHeap {
  private h: { k: number; v: string }[] = [];

  push(key: number, value: string) {
    this.h.push({ k: key, v: value });
    let i = this.h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.h[i].k < this.h[p].k) {
        [this.h[i], this.h[p]] = [this.h[p], this.h[i]];
        i = p;
      } else break;
    }
  }

  pop(): { k: number; v: string } | undefined {
    if (!this.h.length) return undefined;
    const top = this.h[0];
    const last = this.h.pop()!;
    if (this.h.length > 0) {
      this.h[0] = last;
      let i = 0;
      while (true) {
        let s = i;
        const l = 2 * i + 1, r = 2 * i + 2;
        if (l < this.h.length && this.h[l].k < this.h[s].k) s = l;
        if (r < this.h.length && this.h[r].k < this.h[s].k) s = r;
        if (s !== i) { [this.h[i], this.h[s]] = [this.h[s], this.h[i]]; i = s; }
        else break;
      }
    }
    return top;
  }

  get size() { return this.h.length; }
}

/* ═══════════════════════════════════════
   SEEDED PRNG (Mulberry32)
   ═══════════════════════════════════════ */

function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/* ═══════════════════════════════════════
   CONFIGURABLE PACING
   ═══════════════════════════════════════ */

export const NETRA_PACING = {
  agent_step_ms_min: 700,
  agent_step_ms_max: 1600,
  spawn_delay_min: 400,
  spawn_delay_max: 900,
  think_delay_ms: 2500,
  incident_reveal_ms: 2000,
  route_draw_ms: 1500,
};

const SEVERITY_PEN: Record<string, number> = { low: 1.5, medium: 3.0, high: 8.0 };
const EXIT_COLORS: Record<string, string> = {
  A: '#4ADE80', B: '#60A5FA', C: '#FBBF24', D: '#C084FC', E: '#22D3EE', F: '#FB923C'
};

/* ═══════════════════════════════════════
   MAP PARSER — Normalize coordinates to 0-100 pct space
   ═══════════════════════════════════════ */

export function parseGeneratedMap(mapJson: MapData) {
  const rawNodes = mapJson.nodes;
  const rawEdges = mapJson.edges;
  const rawExits = mapJson.exits;
  const rawMeshes = mapJson.meshes;

  // Bounding box for normalization
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  rawNodes.forEach(n => {
    minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y);
  });
  const rX = maxX - minX || 1;
  const rY = maxY - minY || 1;
  const pad = 10; // 10% padding each side

  const toPctX = (x: number) => pad + ((x - minX) / rX) * (100 - 2 * pad);
  const toPctY = (y: number) => pad + ((y - minY) / rY) * (100 - 2 * pad);

  const nodes: Node[] = rawNodes.map(n => ({
    id: n.id, x: n.x, y: n.y, type: n.type,
    pct: { x: toPctX(n.x), y: toPctY(n.y) }
  }));

  const edges = rawEdges.map(e => ({ a: e.from, b: e.to }));

  const exitLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
  const exits: ExitDef[] = rawExits.map((ex, i) => ({
    id: exitLabels[i] || `E${i}`,
    exitLabel: ex.id,
    node: ex.node,
    label: `Exit ${exitLabels[i] || i}`,
    blocked: false
  }));

  const meshes: MeshNorm[] = rawMeshes.map(m => ({
    type: m.type, id: m.id, label: m.label,
    pos: { ...m.pos, pctX: toPctX(m.pos.x), pctY: toPctY(m.pos.z) },
    size: { ...m.size, pctW: (m.size.w / rX) * (100 - 2 * pad), pctD: (m.size.d / rY) * (100 - 2 * pad) }
  }));

  return { nodes, edges, meshes, exits };
}

/* ═══════════════════════════════════════
   DIJKSTRA with Binary Heap — O((V+E)logV)
   ═══════════════════════════════════════ */

type AdjEntry = { to: string; baseDist: number };

function buildAdjacency(nodes: Node[], edges: { a: string; b: string }[], blockedSet: Set<string>) {
  const adj = new Map<string, AdjEntry[]>();
  const nodeMap = new Map<string, Node>();
  nodes.forEach(n => { nodeMap.set(n.id, n); adj.set(n.id, []); });

  edges.forEach(e => {
    const key1 = `${e.a}|${e.b}`, key2 = `${e.b}|${e.a}`;
    if (blockedSet.has(key1) || blockedSet.has(key2)) return;
    const a = nodeMap.get(e.a), b = nodeMap.get(e.b);
    if (!a || !b) return;
    const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    adj.get(e.a)!.push({ to: e.b, baseDist: d });
    adj.get(e.b)!.push({ to: e.a, baseDist: d });
  });

  return { adj, nodeMap };
}

function bidirectionalDijkstra(
  nodes: Node[],
  adj: Map<string, AdjEntry[]>,
  costFn: (id: string) => number,
  source: string,
  target: string
) {
  if (source === target) return { path: [source], cost: 0 };

  const distF = new Map<string, number>();
  const distB = new Map<string, number>();
  const prevF = new Map<string, string | null>();
  const prevB = new Map<string, string | null>();

  nodes.forEach(n => {
    distF.set(n.id, Infinity);
    distB.set(n.id, Infinity);
    prevF.set(n.id, null);
    prevB.set(n.id, null);
  });

  distF.set(source, 0);
  distB.set(target, 0);

  const heapF = new MinHeap();
  const heapB = new MinHeap();
  heapF.push(0, source);
  heapB.push(0, target);

  let bestCost = Infinity;
  let meetingNode: string | null = null;

  while (heapF.size > 0 && heapB.size > 0) {
    const topF = heapF.pop()!;
    const topB = heapB.pop()!;

    if (topF.k + topB.k >= bestCost) {
      break;
    }

    if (topF.k <= (distF.get(topF.v) ?? Infinity)) {
      const neighbors = adj.get(topF.v) || [];
      for (const edge of neighbors) {
        const w = edge.baseDist * costFn(edge.to);
        const alt = topF.k + w;
        if (alt < (distF.get(edge.to) ?? Infinity)) {
          distF.set(edge.to, alt);
          prevF.set(edge.to, topF.v);
          heapF.push(alt, edge.to);
          
          const bDist = distB.get(edge.to) ?? Infinity;
          if (alt + bDist < bestCost) {
            bestCost = alt + bDist;
            meetingNode = edge.to;
          }
        }
      }
    }

    if (topB.k <= (distB.get(topB.v) ?? Infinity)) {
      const neighbors = adj.get(topB.v) || [];
      for (const edge of neighbors) {
        const w = edge.baseDist * costFn(topB.v);
        const alt = topB.k + w;
        if (alt < (distB.get(edge.to) ?? Infinity)) {
          distB.set(edge.to, alt);
          prevB.set(edge.to, topB.v);
          heapB.push(alt, edge.to);

          const fDist = distF.get(edge.to) ?? Infinity;
          if (alt + fDist < bestCost) {
            bestCost = alt + fDist;
            meetingNode = edge.to;
          }
        }
      }
    }
  }

  if (meetingNode === null) return null;

  const pathF: string[] = [];
  let curr: string | null = meetingNode;
  while (curr !== null) {
    pathF.push(curr);
    curr = prevF.get(curr) ?? null;
  }
  pathF.reverse();

  const pathB: string[] = [];
  curr = prevB.get(meetingNode) ?? null;
  while (curr !== null) {
    pathB.push(curr);
    curr = prevB.get(curr) ?? null;
  }

  return { path: [...pathF, ...pathB], cost: bestCost };
}

/** BFS reachability check — can `from` reach any node in `targets`? */
function canReachAny(adj: Map<string, AdjEntry[]>, from: string, targets: Set<string>): boolean {
  const visited = new Set<string>();
  const queue = [from];
  visited.add(from);
  while (queue.length > 0) {
    const u = queue.shift()!;
    if (targets.has(u)) return true;
    for (const e of (adj.get(u) || [])) {
      if (!visited.has(e.to)) { visited.add(e.to); queue.push(e.to); }
    }
  }
  return false;
}

/* ═══════════════════════════════════════
   MAIN: Generate Scenario + Route
   ═══════════════════════════════════════ */

export function generateScenarioAndRoute(mapData: MapData, seed?: number): ScenarioResult {
  const baseSeed = (typeof seed === 'number' ? seed : Date.now()) >>> 0;
  const rand = rng(baseSeed);

  const { nodes, edges, meshes, exits } = parseGeneratedMap(mapData);
  const nodeMap = new Map<string, Node>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // ── 1. INCIDENT PLACEMENT ──
  const exitNodeIds = new Set(exits.map(e => e.node));
  const candidateNodes = nodes.filter(n => !exitNodeIds.has(n.id) && n.type !== 'exit');
  const incidentNode = candidateNodes[Math.floor(rand() * candidateNodes.length)] || nodes[0];
  const incident: Incident = {
    node: incidentNode.id,
    pct: incidentNode.pct,
    radiusWorld: 8 + rand() * 15,
    severity: rand() < 0.3 ? 'low' : rand() < 0.7 ? 'medium' : 'high'
  };

  // ── 2. BLOCK 2 EXITS ──
  const shuffledExitIdx = exits.map((_, i) => i).sort(() => rand() - 0.5);
  const blockedExitIndices = shuffledExitIdx.slice(0, 2);
  blockedExitIndices.forEach(i => { exits[i].blocked = true; });

  // ── 3. BLOCK EDGES near incident ──
  const blocked_edges: { a: string; b: string }[] = [];
  const blockedEdgeSet = new Set<string>();

  // Block 2-3 edges closest to incident
  const edgesWithDist = edges.map(e => {
    const na = nodeMap.get(e.a), nb = nodeMap.get(e.b);
    if (!na || !nb) return { e, d: Infinity };
    const mx = (na.x + nb.x) / 2, my = (na.y + nb.y) / 2;
    const d = Math.sqrt((mx - incidentNode.x) ** 2 + (my - incidentNode.y) ** 2);
    return { e, d };
  }).filter(x => x.d < incident.radiusWorld * 1.5).sort((a, b) => a.d - b.d);

  const blockCount = Math.min(2 + Math.floor(rand()), edgesWithDist.length);
  for (let i = 0; i < blockCount; i++) {
    const e = edgesWithDist[i].e;
    // Don't block edges connecting to active exit nodes
    const activeExitNodes = new Set(exits.filter(ex => !ex.blocked).map(ex => ex.node));
    if (activeExitNodes.has(e.a) || activeExitNodes.has(e.b)) continue;
    blocked_edges.push(e);
    blockedEdgeSet.add(`${e.a}|${e.b}`);
    blockedEdgeSet.add(`${e.b}|${e.a}`);
  }

  // ── 4. BUILD ADJACENCY ──
  const { adj } = buildAdjacency(nodes, edges, blockedEdgeSet);

  // ── 5. CONNECTIVITY CHECK — ensure all people can reach active exits ──
  const activeExitNodes = new Set(exits.filter(e => !e.blocked).map(e => e.node));
  const spawnCandidates = nodes.filter(n => {
    if (n.type === 'exit') return false;
    // Must not be inside incident radius
    const dx = n.x - incidentNode.x, dy = n.y - incidentNode.y;
    if (Math.sqrt(dx * dx + dy * dy) < incident.radiusWorld * 0.5) return false;
    return true;
  });

  // Verify connectivity — unblock exits if needed
  const roomNodes = spawnCandidates.filter(n => n.type === 'room');
  const testNodes = roomNodes.length > 5 ? roomNodes.slice(0, 5) : roomNodes;
  let allReachable = testNodes.every(n => canReachAny(adj, n.id, activeExitNodes));
  if (!allReachable && blockedExitIndices.length > 1) {
    // Unblock one exit
    exits[blockedExitIndices[1]].blocked = false;
    activeExitNodes.add(exits[blockedExitIndices[1]].node);
    allReachable = testNodes.every(n => canReachAny(adj, n.id, activeExitNodes));
    if (!allReachable) {
      exits[blockedExitIndices[0]].blocked = false;
      activeExitNodes.add(exits[blockedExitIndices[0]].node);
    }
  }

  // ── 6. COST FUNCTION — danger zone + congestion ──
  const corridorNodes = nodes.filter(n => n.type === 'corridor');
  const congestionNode = corridorNodes.length > 0
    ? corridorNodes[Math.floor(rand() * corridorNodes.length)]
    : null;
  const congestionWeight = 1.5 + rand() * 2.0;

  const costAtNode = (id: string): number => {
    const n = nodeMap.get(id);
    if (!n) return 1.0;
    let mult = 1.0;
    // Incident zone penalty
    const dx = n.x - incidentNode.x, dy = n.y - incidentNode.y;
    const distToInc = Math.sqrt(dx * dx + dy * dy);
    if (distToInc < incident.radiusWorld) {
      const proximity = 1 - (distToInc / incident.radiusWorld);
      mult *= 1 + proximity * SEVERITY_PEN[incident.severity];
    }
    // Congestion penalty
    if (congestionNode && n.id === congestionNode.id) mult *= congestionWeight;
    return mult;
  };

  // ── 7. SPAWN PEOPLE ──
  const peopleCount = 100 + Math.floor(rand() * 51); // 100-150
  const people: Person[] = [];
  const spawnPool = spawnCandidates.filter(n => n.type === 'room');
  
  const numClusters = 5 + Math.floor(rand() * 4);
  const clusterCenters = [];
  for (let i = 0; i < numClusters; i++) {
    clusterCenters.push(spawnPool[Math.floor(rand() * spawnPool.length)] || spawnCandidates[0] || nodes[0]);
  }
  
  for (let i = 0; i < peopleCount; i++) {
    const n = clusterCenters[Math.floor(rand() * clusterCenters.length)];
    people.push({ id: `user_${i + 1}`, node: n.id });
  }

  // Spawn batches — group by node for cluster reveal
  const nodeGroups = new Map<string, string[]>();
  people.forEach(p => {
    if (!nodeGroups.has(p.node)) nodeGroups.set(p.node, []);
    nodeGroups.get(p.node)!.push(p.id);
  });
  const spawnBatches = Array.from(nodeGroups.values());

  // ── 8. ROUTING — Bidirectional Dijkstra from each person to each active exit ──
  const t0 = performance.now();
  const activeExits = exits.filter(e => !e.blocked);
  const exitLoad: Record<string, number> = {};
  activeExits.forEach(e => { exitLoad[e.id] = 0; });

  const routes: Route[] = [];
  const LOAD_BALANCE_FACTOR = 6.0;

  for (const p of people) {
    let best: { exitId: string; cost: number; path: string[] } | null = null;

    for (const ex of activeExits) {
      const res = bidirectionalDijkstra(nodes, adj, costAtNode, p.node, ex.node);
      if (!res) continue;
      
      const effectiveCost = res.cost + exitLoad[ex.id] * LOAD_BALANCE_FACTOR;

      if (!best || effectiveCost < best.cost) {
        best = { exitId: ex.id, cost: effectiveCost, path: res.path };
      }
    }

    if (best) {
      exitLoad[best.exitId] += 1;
      const pathPcts = best.path.map(nid => nodeMap.get(nid)!.pct);
      routes.push({
        person_id: p.id,
        exit_id: best.exitId,
        path_nodes: best.path,
        path_pcts: pathPcts,
        path_costs: best.path.map(nid => costAtNode(nid)),
        cost: Math.round(best.cost * 10) / 10
      });
    }
  }
  const computeMs = Math.round(performance.now() - t0);

  // ── 9. BUILD UI DATA ──
  const totalPeople = people.length;
  const exitPcts: Record<string, number> = {};
  Object.entries(exitLoad).forEach(([k, v]) => {
    exitPcts[k] = totalPeople > 0 ? Math.round((v / totalPeople) * 100) : 0;
  });

  const ui: UIData = {
    totalPeople,
    blockedExitCount: exits.filter(e => e.blocked).length,
    blockedRouteCount: blocked_edges.length,
    activeExits,
    dangerPct: incidentNode.pct,
    incidentRadiusMeters: incident.radiusWorld * 2.0, // Base scale for visibility
    exitLoads: exitLoad,
    exitPcts,
    peopleDots: people.map(p => {
      const node = nodeMap.get(p.node)!;
      const route = routes.find(r => r.person_id === p.id);
      return {
        id: p.id,
        x: node.pct.x, y: node.pct.y,
        exitId: route?.exit_id || 'A',
        color: EXIT_COLORS[route?.exit_id || 'A'] || '#60A5FA'
      };
    }),
    routeOverlays: routes.map(r => ({
      userId: r.person_id,
      exitId: r.exit_id,
      points: r.path_pcts,
      style: 'safe',
      color: EXIT_COLORS[r.exit_id] || '#60A5FA'
    }))
  };

  return {
    building: { nodes, edges, meshes },
    mapName: mapData.map_name,
    people,
    exits,
    incident,
    blocked_edges,
    routes,
    exitLoad,
    computeMs,
    spawnBatches,
    ui
  };
}
