# Core Engine Spec — NETRA

## AI Exit Allocation, Crowd Balancing & Route Optimization

---

## 1. Exit Allocation Engine

### Purpose
Calculate the optimal exit assignment for every detected user during an emergency, minimizing total evacuation time while preventing congestion at any single exit.

### Algorithm: Capacity-Weighted Dijkstra with Load Balancing

#### Phase 1: Graph Construction
```
Input: Building floor plan data (nodes + edges from Firestore)

BuildingGraph {
  nodes: Map<NodeId, {
    id: string
    x: number          // position on floor plan
    y: number
    floor: number
    type: "WAYPOINT" | "EXIT" | "STAIRWELL" | "ELEVATOR"
    accessible: boolean
  }>

  edges: Map<EdgeId, {
    id: string
    from: NodeId
    to: NodeId
    distance: number   // meters
    width: number       // meters
    accessible: boolean
    capacity: number    // people per minute
    bidirectional: boolean
  }>
}

Processing:
1. Load graphData from Firestore for the affected building
2. Build adjacency list representation
3. Apply hazard masks:
   - For each hazard zone polygon:
     - Mark contained nodes as HAZARDOUS (weight = Infinity)
     - Mark edges crossing hazard zone as BLOCKED
4. Apply blocked exit masks:
   - For each blocked exit: mark node as BLOCKED
5. Result: Clean traversable graph with updated weights
```

#### Phase 2: Weight Function
```
EdgeWeight(edge, user) =
  base_distance                           // edge.distance in meters
  × density_multiplier                    // exponential penalty for crowded paths
  × safety_multiplier                     // inverse of safety score
  × accessibility_multiplier              // blocks inaccessible paths for disabled users
  × capacity_factor                       // penalizes narrow corridors

Where:
  density_multiplier = 1 + max(0, (edge.currentDensity - 0.4) × 5)
    // No penalty below 40% density
    // Linear penalty 40-80%
    // Exponential penalty above 80%

  safety_multiplier = 1 / max(0.1, edge.safetyScore)
    // safetyScore: 1.0 = fully safe, 0.0 = hazardous

  accessibility_multiplier =
    if (user.needsAccessible && !edge.accessible): Infinity
    else: 1.0

  capacity_factor = 1 + max(0, (1 - edge.width / 2.0) × 2)
    // Penalize corridors narrower than 2 meters
```

#### Phase 3: Exit Assignment Algorithm
```
function allocateExits(users: User[], graph: BuildingGraph, exits: Exit[]): Map<UserId, ExitAssignment>

Algorithm:
1. Initialize exit remaining capacity: exitCapacity[exitId] = exit.maxCapacity
2. Sort users by priority:
   - Priority 1: Accessibility needs (wheelchair, visual impairment)
   - Priority 2: Farthest from any exit (highest evacuation risk)
   - Priority 3: All other users
3. For each user (in priority order):
   a. Run modified Dijkstra from user's nearest graph node to ALL exit nodes
   b. For each reachable exit, compute:
      - pathCost = sum of EdgeWeight along shortest path
      - queuePenalty = max(0, (1 - exitCapacity[exit] / exit.maxCapacity) × pathCost)
      - totalCost = pathCost + queuePenalty
   c. Select exit with minimum totalCost WHERE exitCapacity[exit] > 0
   d. Assign user to selected exit
   e. Decrement exitCapacity[selectedExit] by 1
   f. Update density on edges along assigned path
4. Return assignment map

Complexity: O(U × (N + E) × log(N))
  where U = users, N = graph nodes, E = graph edges
```

#### Phase 4: Post-Assignment Balancing
```
After initial assignment:
1. Calculate utilization ratio for each exit:
   utilization[exit] = assignedUsers[exit] / exit.maxCapacity
2. If any exit has utilization > 1.5 × averageUtilization:
   a. Identify "overloaded" exits
   b. For users assigned to overloaded exits (farthest first):
      - Recalculate with overloaded exit weight increased by 3×
      - If alternative exit reduces totalCost by >20%: reassign
      - Stop when utilization drops below 1.2 × average
3. Output final balanced assignments
```

---

## 2. Crowd Balancing Engine

### Purpose
Continuously monitor crowd density and dynamically rebalance exit assignments as conditions change during an active emergency.

### Trigger Conditions
```
CrowdBalancingTrigger:
  DENSITY_THRESHOLD   — Any exit density exceeds 80% capacity
  EXIT_BLOCKED        — An exit is marked as blocked
  HAZARD_SPREAD       — New hazard zone added or expanded
  TIMER_RECHECK       — Periodic recheck (every 10 seconds)
  MANUAL_TRIGGER      — Authority operator requests rebalancing
```

### Rebalancing Algorithm
```
function rebalanceCrowd(emergencyId: string): RebalanceResult

1. Snapshot current state:
   - All user positions from RTDB /locations/{emergencyId}/
   - All current assignments from RTDB /assignments/{emergencyId}/
   - All exit densities from RTDB /exit_density/{emergencyId}/
   - Current hazard zones and blocked exits

2. Identify congested exits:
   congestedExits = exits.filter(e => e.currentDensity > CONGESTION_THRESHOLD)

3. For each congested exit:
   a. Get users assigned to this exit
   b. Filter to eligible users (NOT within MIN_DISTANCE_TO_EXIT meters)
   c. Sort by distance to congested exit (farthest first = easiest to reroute)
   d. For each eligible user:
      - Recalculate optimal exit with CONGESTION_PENALTY on current exit
      - If alternative exit saves >20% estimated time:
        - Check user's reroute count < MAX_REROUTES
        - Create new assignment
        - Push reroute notification to user's RTDB path
        - Increment user's reroute count
      - Stop when congested exit density < TARGET_DENSITY

4. Update RTDB:
   - /assignments/{emergencyId}/{userId} for rerouted users
   - /exit_density/{emergencyId}/{exitId} for updated counts

5. Log rebalancing event to Firestore emergency timeline

Constraints:
  CONGESTION_THRESHOLD = 0.80 (80% capacity)
  TARGET_DENSITY = 0.65 (65% capacity after rebalancing)
  MIN_DISTANCE_TO_EXIT = 30 meters (don't reroute users almost at exit)
  MAX_REROUTES = 2 per user per emergency
  IMPROVEMENT_THRESHOLD = 0.20 (20% improvement required to justify reroute)
```

### Real-Time Density Calculation
```
function calculateExitDensity(exitId, emergencyId): DensityData

1. Count users assigned to exit: assignedCount
2. Count users within PROXIMITY_RADIUS of exit: nearbyCount
3. Get exit maximum capacity: maxCapacity
4. Calculate:
   assignedDensity = assignedCount / maxCapacity
   physicalDensity = nearbyCount / (PROXIMITY_RADIUS² × π / AREA_PER_PERSON)
   combinedDensity = max(assignedDensity, physicalDensity)

5. Estimate queue length:
   queueEstimate = max(0, nearbyCount - exit.throughputPerMinute)

6. Determine status:
   if combinedDensity < 0.5: "OPEN"
   elif combinedDensity < 0.8: "MODERATE"
   elif combinedDensity < 1.0: "CONGESTED"
   else: "CRITICAL"

Constants:
  PROXIMITY_RADIUS = 20 meters
  AREA_PER_PERSON = 1.5 sq meters (comfortable density)
```

---

## 3. Route Optimizer

### Dijkstra Implementation
```typescript
interface RouteResult {
  path: GraphNode[];
  totalDistance: number;
  estimatedTimeSeconds: number;
  instructions: NavigationInstruction[];
}

function findOptimalRoute(
  startNode: NodeId,
  endNode: NodeId,
  graph: BuildingGraph,
  user: UserProfile
): RouteResult {
  // Priority queue: (cost, nodeId)
  const pq = new MinHeap<[number, NodeId]>();
  const dist: Map<NodeId, number> = new Map();
  const prev: Map<NodeId, NodeId> = new Map();

  dist.set(startNode, 0);
  pq.push([0, startNode]);

  while (!pq.isEmpty()) {
    const [cost, current] = pq.pop();
    if (current === endNode) break;
    if (cost > (dist.get(current) ?? Infinity)) continue;

    for (const edge of graph.getEdges(current)) {
      const weight = calculateEdgeWeight(edge, user);
      const newCost = cost + weight;

      if (newCost < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, newCost);
        prev.set(edge.to, current);
        pq.push([newCost, edge.to]);
      }
    }
  }

  // Reconstruct path
  const path = reconstructPath(prev, startNode, endNode);
  const instructions = generateInstructions(path, graph);
  const walkingSpeed = user.needsAccessible ? 0.8 : 1.4; // m/s
  const estimatedTime = totalDistance / walkingSpeed;

  return { path, totalDistance, estimatedTimeSeconds: estimatedTime, instructions };
}
```

### Navigation Instruction Generation
```
function generateInstructions(path: GraphNode[], graph: BuildingGraph): NavigationInstruction[]

For each segment of the path:
1. Calculate direction change from previous segment
2. Calculate segment distance
3. Generate instruction:
   - STRAIGHT: "Move straight for {distance} meters"
   - TURN_LEFT: "Turn left"
   - TURN_RIGHT: "Turn right"
   - FLOOR_CHANGE_UP: "Go up to floor {N} via {stairs/elevator}"
   - FLOOR_CHANGE_DOWN: "Go down to floor {N} via {stairs/elevator}"
   - APPROACHING_EXIT: "Exit {name} is {distance} meters ahead"

4. Merge consecutive STRAIGHT instructions
5. Add exit approach instruction for final segment
```

---

## 4. CCTV Crowd Analysis (Post-MVP)

### Vision AI Integration
```
function analyzeCCTVFrame(imageBase64: string, cameraConfig: CameraConfig): CrowdAnalysis

1. Send image to Google Cloud Vision AI:
   - Object detection: count person instances
   - If model supports: estimate density heatmap regions

2. Map pixel coordinates to floor plan coordinates:
   - Use camera calibration matrix (pre-configured)
   - Transform detected positions to floor plan (x, y)

3. Estimate crowd density:
   - Count detected persons in camera field of view
   - Divide by camera coverage area
   - Apply occlusion correction factor (×1.3 for dense crowds)

4. Detect motion direction:
   - Compare with previous frame (if available)
   - Calculate dominant motion vector

5. Output:
   {
     estimatedCount: number,
     densityScore: 0-1,
     densityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
     motionDirection: "N"|"S"|"E"|"W"|"STATIC",
     congestionDetected: boolean,
     positions: [{x, y, confidence}]
   }
```

---

## 5. Voice Guidance Engine

### TTS Instruction Pipeline
```
function generateVoiceGuidance(instructions: NavigationInstruction[]): AudioBuffer[]

1. For each instruction:
   a. Construct natural language text
   b. Call Google Text-to-Speech API:
      - Voice: en-US-Standard-C (or configured language)
      - Speed: 1.1x (slightly faster for urgency)
      - Audio encoding: MP3 (or OGG for web)
   c. Cache audio buffer keyed by instruction hash

2. Emergency-specific instructions:
   - Opening: "Emergency evacuation. Follow these directions."
   - Reroute: "Attention. Your route has changed. Follow new directions."
   - Arrival: "You have reached the exit. Move to the assembly point."
   - Hazard: "Warning. Avoid the area ahead. Follow the updated route."

3. Playback rules:
   - Play instructions sequentially with 2-second gaps
   - Reroute announcements interrupt current playback
   - Repeat last instruction if user appears stationary for >15 seconds
   - Volume: maximum system volume
```

---

## 6. Performance Targets

| Operation | Target Latency | Max Users |
|---|---|---|
| Single route calculation | <50ms | 1 |
| Full exit allocation (batch) | <3s | 1,000 |
| Crowd rebalancing cycle | <2s | 1,000 |
| CCTV frame analysis | <1s | 1 frame |
| Voice instruction generation | <500ms | 1 instruction |
| Density calculation update | <100ms | per exit |

---

## 7. Demo Scenario: Mall Evacuation

```
Scenario: Fire in City Centre Mall
- Building: 3 floors, 5 exits, 120 users detected
- Emergency: Fire on Level 2 East Wing

Timeline:
  T+0s    Authority triggers FIRE emergency for City Centre Mall
  T+1s    System loads building graph, identifies 5 exits
  T+2s    120 user locations fetched from RTDB
  T+3s    Exit Allocation Engine assigns users:
            Exit A (North): 28 users
            Exit B (East): BLOCKED (near fire) → 0 users
            Exit C (South): 32 users
            Exit D (West): 30 users
            Exit E (Stairwell): 30 users
  T+4s    Push notifications sent to 105 online users
  T+5s    SMS sent to 15 offline users
  T+5s    Navigation screens activate on user devices

  T+30s   RTDB shows 25 users near Exit A (density: 0.83)
  T+31s   Crowd Balancing Engine triggers:
            - Exit A congested (>0.80 threshold)
            - 8 users (farthest from Exit A) rerouted to Exit D
            - Exit A density drops to 0.65
            - Rerouted users receive "Route Changed" notification

  T+60s   40 users have exited (33% complete)
  T+120s  85 users have exited (71% complete)
  T+180s  115 users have exited (96% complete)
  T+210s  All 120 users evacuated. Emergency resolved.

Result:
  - Average evacuation time: 175 seconds (vs ~400s unguided estimate)
  - Exit utilization variance: 12%
  - Zero bottleneck incidents
  - 2 accessibility users received priority routing + authority alerts
```

> **Dashboard crossref**: The `generateScenarioData()` function in `App.tsx` implements a simplified client-side version of this scenario. Congestion flags (`exitACongested`, `exitBCongested`) are randomized booleans, not computed from the Dijkstra-based density model above. Crowd counts are uniformly distributed across walkable zones rather than following the priority-ordered allocation in Phase 3.
