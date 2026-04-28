# Implementation Plan — NETRA

---

## 1. Implementation Overview

### Timeline Summary

| Phase | Duration | Focus | Outcome |
|---|---|---|---|
| Sprint 0 | Week 1 | Foundation & infra | Working dev environment + CI/CD |
| Sprint 1 | Week 2 | Core engine | Exit allocation + routing algorithms |
| Sprint 2 | Week 3 | Backend APIs | Cloud Functions with full API surface |
| Sprint 3 | Week 3-4 | Mobile PWA | Navigation UI + push + voice |
| Sprint 4 | Week 4-5 | Dashboard | Authority controls + heatmap |
| Sprint 5 | Week 5-6 | Integration | E2E testing + demo + polish |
| Sprint 6-8 | Week 7-12 | Advanced | SMS, IVR, CCTV, drill mode |
| Sprint 9-12 | Week 13-18 | Scale | Multi-building, analytics, API |

---

## 2. Sprint 0: Foundation (Week 1)

### Day 1-2: Project Skeleton
```
Tasks:
  1. Initialize Git repository ✅
  2. Create monorepo structure: ✅
     mkdir -p apps/mobile apps/dashboard functions packages/shared scripts docs
  3. Initialize root package.json with workspaces ✅
  4. Initialize apps/mobile: (Planned) 📋
  5. Initialize apps/dashboard: (Vite + React) ✅
  6. Initialize functions: (Typescript setup) ✅
  7. Initialize packages/shared: (Setup complete) ✅
  8. Configure TypeScript (strict mode) for all packages ✅
  9. Configure ESLint + Prettier ✅
  10. Create .gitignore, .env.example ✅

Output: All packages build and type-check successfully ✅
```

### Day 2-3: Firebase Setup
```
Tasks:
  1. Create Firebase project (netra-dev) ✅
  2. Enable services: Firestore, RTDB, Auth, Hosting, Cloud Functions, Storage ✅
  3. Install firebase-tools globally ✅
  4. Run firebase init in project root ✅
  5. Configure firebase.json with dual hosting targets ✅
  6. Create .firebaserc with project aliases ✅
  7. Write initial firestore.rules ✅
  8. Write initial database.rules.json ✅
  9. Enable anonymous auth + email auth ✅
  10. Test emulators locally ✅

Output: Firebase emulators running locally with all services ✅
```

### Day 3-4: Shared Package & Types
```
Tasks:
  1. Define types: Emergency, Building, Exit, Graph (Planned) 📋
  2. Define types: User, CrowdDensity, HazardZone (Planned) 📋
  3. Define enums: EmergencyType, Severity, roles (Planned) 📋
  4. Define constants: thresholds, limits (Planned) 📋
  5. Implement geoUtils (Planned) 📋
  6. Implement validation schemas (Planned) 📋
  7. Write unit tests (Planned) 📋
  8. Export package as @netra/shared 📋

Output: Shared package importable from all other packages 📋
```

### Day 4-5: CI/CD & Design System
```
Tasks:
  1. Create .github/workflows/ci.yml (lint, test, build)
  2. Create .github/workflows/deploy-dev.yml
  3. Test CI pipeline with push to develop
  4. Define CSS custom properties: colors, typography, spacing, shadows
  5. Create emergency color scheme (high contrast red/orange/green)
  6. Install Inter font via Google Fonts
  7. Create base component styles

Output: CI passes; design tokens applied to both apps
```

---

## 3. Sprint 1: Core Engine (Week 2)

### Building Data Layer
```
Files to create:
  functions/src/services/firestoreService.ts
  functions/src/services/realtimeDbService.ts
  scripts/seed-building.ts

Tasks:
  1. Implement Firestore CRUD logic ✅
  2. Implement RTDB helpers ✅
  3. Create seed script: scripts/seed-building.ts (Draft) ✅
  4. Implement simulation simulation script: scripts/simulateUsers.ts ✅

Output: Sample building and simulation data available ✅
```

### Exit Allocation Engine
```
Files to create:
  functions/src/engine/graphUtils.ts
  functions/src/engine/weightCalculator.ts
  functions/src/engine/exitAllocation.ts
  functions/src/engine/__tests__/exitAllocation.test.ts

Tasks:
  1. Implement BuildingGraph logic ✅
  2. Implement weight calculator logic ✅
  3. Implement Dijkstra shortest path algorithm ✅
  4. Implement batch allocation logic ✅

Output: Exit allocation engine core logic implemented ✅
```

### Crowd Balancing Engine
```
Files to create:
  functions/src/engine/crowdBalancing.ts
  functions/src/engine/__tests__/crowdBalancing.test.ts

Tasks:
  1. Implement density calculator ✅
  2. Implement congestion detector ✅
  3. Implement rebalancing algorithm ✅

Output: Crowd balancing logic implemented ✅
```

---

## 4. Sprint 2: Backend APIs (Week 3)

### API Implementation
```
Files to create:
  functions/src/api/emergency.ts
  functions/src/api/location.ts
  functions/src/api/routing.ts
  functions/src/api/building.ts
  functions/src/api/notification.ts
  functions/src/api/dashboard.ts
  functions/src/middleware/auth.ts
  functions/src/middleware/rbac.ts
  functions/src/middleware/validator.ts
  functions/src/middleware/errorHandler.ts
  functions/src/index.ts

Tasks:
  1. Implement Express app within Cloud Function
  2. POST /emergency/trigger — create emergency, fire notifications
  3. POST /emergency/{id}/resolve — end emergency
  4. GET /emergency/{id} — get status
  5. PUT /emergency/{id}/hazard-zones — update hazards
  6. PUT /emergency/{id}/block-exit — block exit
  7. POST /location/report — receive location, return assignment
  8. GET /route/optimal — get user route
  9. POST /route/recalculate — trigger rebalancing
  10. POST /building — CRUD endpoints
  11. POST /notification/broadcast — multi-channel broadcast
  12. GET /dashboard/* — progress, health endpoints
  13. Auth middleware: verify Firebase JWT
  14. RBAC middleware: check custom claims for role
  15. Validation middleware: Zod schema validation
  16. Error handler: structured JSON errors
  17. Write integration tests against emulators

Output: All API endpoints functional; integration tests pass
```

### Notification Service
```
Files to create:
  functions/src/services/fcmService.ts
  functions/src/services/ttsService.ts

Tasks:
  1. FCM: Send topic-based push notifications
  2. FCM: Send targeted notifications to specific tokens
  3. TTS: Generate voice instructions from route text
  4. TTS: Cache audio responses by instruction hash

Output: Push notifications delivered; TTS audio generated
```

---

## 5. Sprint 3: Mobile PWA (Week 3-4)

### Implementation Order
```
Day 1: App shell, routing, Firebase init, service worker
Day 2: useGeolocation hook, location reporting service
Day 3: Emergency alert screen, FCM integration
Day 4: Navigation screen (DirectionArrow, DistanceBadge, ExitLabel)
Day 5: RTDB listeners for real-time route updates
Day 6: Voice guidance (TTS playback, instruction queue)
Day 7: Reroute alert overlay, offline fallback, settings
```

### Key Component Implementations
```
DirectionArrow:
  - CSS transform: rotate based on bearing to exit
  - Smooth transition (CSS transition 300ms)
  - High contrast (white arrow on red background)
  - Size: 200x200px minimum

Navigation Screen:
  - Subscribe to RTDB /assignments/{emergencyId}/{userId}
  - On assignment change: update arrow, distance, exit label
  - On version increment > previous: show reroute overlay
  - Voice queue: play instructions on route receive

Emergency Alert:
  - FCM foreground listener
  - Auto-navigate to /navigate on alert receive
  - Display emergency type, building name
  - Single "GO" button to start navigation
```

---

## 6. Sprint 4: Authority Dashboard (Week 4-5)

### Implementation Order
```
Tasks:
  1. High-fidelity Dashboard UI construction ✅
  2. Isometric map rendering with SVG ✅
  3. Real-time heatmap and crowd distribution ✅
  4. Exit utilization bars and progress tracker ✅
  5. Emergency trigger and resolution controls ✅
  6. Scenario regeneration logic (Mock) ✅

Output: Dashboard UI fully functional with simulation mode ✅
```

---

## 7. Sprint 5: Integration & Demo (Week 5-6)

### End-to-End Validation Checklist
```
 [ ] Seed building with sample data
 [ ] Admin logs in to dashboard
 [ ] Admin triggers emergency for City Centre Mall
 [ ] System detects 120 simulated user locations
 [ ] Exit allocation assigns users across 4 exits (Exit B blocked)
 [ ] Push notifications delivered to mobile PWA
 [ ] Mobile shows navigation with correct direction
 [ ] Voice guidance plays "Move straight for 50 meters"
 [ ] Dashboard heatmap shows crowd distribution
 [ ] Exit utilization bars reflect assignments
 [ ] Simulate congestion at Exit A (density > 0.8)
 [ ] Crowd balancer reroutes 8 users to Exit D
 [ ] Rerouted users see "Route Changed" on mobile + voice alert
 [ ] Dashboard reflects updated distribution
 [ ] Admin resolves emergency
 [ ] Mobile shows "All Clear" message
 [ ] Emergency log saved to Firestore with complete stats
```

### Demo Preparation
```
 [ ] Clean demo data set (predictable, impressive numbers)
 [ ] Simulation script that runs the 120-user scenario automatically
 [ ] Screen recording of full flow (mobile + dashboard side-by-side)
 [ ] 5-minute pitch presentation
 [ ] Architecture diagram for technical audience
 [ ] Performance benchmark results
```

---

## 8. Risk Mitigation During Implementation

| Risk | Probability | Mitigation |
|---|---|---|
| Firebase emulator instability | Medium | Pin firebase-tools version; document setup steps |
| Graph algorithm performance issues | Low | Profile early; optimize data structures in Sprint 1 |
| FCM delivery inconsistency in dev | Medium | Test with real device; use emulator for unit tests |
| Canvas heatmap rendering performance | Medium | Use OffscreenCanvas; limit update rate to 2fps |
| Indoor positioning inaccuracy | High | Accept floor-level accuracy for MVP; zone-based routing |
| Scope creep into advanced features | High | Strict MVP definition; defer P2/P3 features |

---

## 9. Definition of Done

### Per-Feature
- [ ] Code complete with TypeScript strict compliance
- [ ] Unit tests written (coverage target met)
- [ ] Integration tested against Firebase emulators
- [ ] Accessibility checked (WCAG AA for UI components)
- [ ] Code reviewed and approved
- [ ] Documentation updated (API docs, README if needed)
- [ ] Deployed to dev environment and verified

### Per-Sprint
- [ ] All sprint tasks completed
- [ ] Sprint demo prepared and reviewed
- [ ] Known issues documented
- [ ] Next sprint planning complete
- [ ] CI pipeline green on develop branch

### MVP Complete
- [ ] All P0 + P1 features implemented and tested
- [ ] End-to-end evacuation scenario validated
- [ ] Performance benchmarks met
- [ ] Security rules audited
- [ ] Demo walkthrough recorded
- [ ] Documentation complete (README, API docs, architecture)
- [ ] Deployed to staging environment
