# Development Phases — NETRA

---

## Overview

```
Phase 0: Foundation     [Week 1]      → Project setup, infra, design system
Phase 1: Core Engine    [Week 2-3]    → Exit allocation, routing, balancing
Phase 2: Mobile UX      [Week 3-4]    → Navigation PWA, push, voice
Phase 3: Dashboard      [Week 4-5]    → Authority controls, heatmap, monitoring
Phase 4: Integration    [Week 5-6]    → End-to-end testing, polish, demo
Phase 5: Advanced       [Week 7-12]   → SMS, IVR, CCTV, accessibility+
Phase 6: Scale          [Week 13-18]  → Multi-building, drill mode, analytics, API
```

---

## Phase 0: Foundation (Week 1)

### Goal
Set up the entire development infrastructure and project skeleton.

### Tasks

#### P0.1: Repository & Workspace Setup
- [ ] Initialize Git repository
- [ ] Create monorepo structure: `apps/mobile`, `apps/dashboard`, `functions`, `packages/shared`
- [ ] Configure root `package.json` with workspaces
- [ ] Set up TypeScript config for all packages
- [ ] Configure ESLint + Prettier rules
- [ ] Create `.env.example` with all required variables

#### P0.2: Firebase Project Setup
- [ ] Create Firebase project (netra-dev)
- [ ] Enable Firestore, Realtime Database, Authentication, Hosting, Cloud Functions
- [ ] Configure `.firebaserc` with dev project alias (netra-dev)
- [ ] Set up `firebase.json` with hosting targets (mobile + dashboard)
- [ ] Create initial Firestore security rules
- [ ] Create initial RTDB security rules
- [ ] Enable Firebase Auth (email + anonymous)
- [ ] Configure Cloud Storage bucket

#### P0.3: CI/CD Pipeline
- [ ] GitHub Actions CI: lint → test → build on push
- [ ] GitHub Actions deploy-dev: auto-deploy on merge to develop
- [ ] Firebase emulator setup for local development

#### P0.4: Shared Package
- [ ] Define core TypeScript types (Emergency, Building, Floor, Exit, Route, User)
- [ ] Define constants (roles, device types, emergency types, severity levels)
- [ ] Implement geo utility functions (distance, bearing, point-in-polygon)
- [ ] Set up package exports

#### P0.5: Design System
- [ ] Define emergency color palette (high contrast)
- [ ] Select typography (Inter or similar, high readability)
- [ ] Create CSS custom properties / design tokens
- [ ] Create base component styles (buttons, cards, badges, modals)

### Exit Criteria
- [ ] `npm run dev:mobile` launches mobile PWA dev server
- [ ] `npm run dev:dashboard` launches dashboard dev server
- [ ] `npm run dev:functions` launches Functions emulator
- [ ] All TypeScript compiles without errors
- [ ] CI pipeline runs successfully

---

## Phase 1: Core Engine (Week 2-3)

### Goal
Implement the AI exit allocation engine, crowd balancing logic, and route optimization.

### Tasks

#### P1.1: Building Data Model
- [ ] Implement Firestore CRUD for buildings, floors, exits
- [ ] Create seed script with sample mall (3 floors, 5 exits, route graph)
- [ ] Implement graph data structure utilities (adjacency list, traversal)

#### P1.2: Exit Allocation Engine
- [ ] Implement BuildingGraph class with node/edge management
- [ ] Implement weight calculation function (distance, density, safety, accessibility)
- [ ] Implement modified Dijkstra algorithm with capacity constraints
- [ ] Implement batch exit allocation (all users simultaneously)
- [ ] Implement post-allocation balancing pass
- [ ] Write unit tests (≥90% coverage)
- [ ] Benchmark: <3 seconds for 1,000 users

#### P1.3: Route Optimizer
- [ ] Implement single-source Dijkstra for individual route calculation
- [ ] Implement path reconstruction
- [ ] Implement navigation instruction generation (straight, turn, floor change)
- [ ] Implement walking time estimation
- [ ] Write unit tests

#### P1.4: Crowd Balancing Engine
- [ ] Implement density calculation from RTDB location data
- [ ] Implement congestion detection (threshold-based)
- [ ] Implement rebalancing algorithm (selective rerouting)
- [ ] Implement reroute constraints (max reroutes, min distance, improvement threshold)
- [ ] Write unit tests

#### P1.5: API Layer — Core
- [ ] Implement `POST /emergency/trigger` endpoint
- [ ] Implement `POST /emergency/{id}/resolve` endpoint
- [ ] Implement `POST /location/report` endpoint
- [ ] Implement `GET /route/optimal` endpoint
- [ ] Implement `POST /route/recalculate` endpoint
- [ ] Implement authentication middleware
- [ ] Implement RBAC middleware
- [ ] Implement request validation (Zod schemas)
- [ ] Implement error handling middleware

### Exit Criteria
- [ ] Seed script populates sample building in Firestore
- [ ] Exit allocation calculates routes for 100+ simulated users
- [ ] Rebalancing correctly reroutes users from congested exits
- [ ] All API endpoints return correct responses
- [ ] Unit test coverage ≥90% for engine modules

---

## Phase 2: Mobile UX (Week 3-4)

### Goal
Build the evacuee-facing PWA with navigation guidance, push notifications, and voice support.

### Tasks

#### P2.1: Mobile App Shell
- [ ] Set up React + Vite with PWA plugin
- [ ] Configure service worker (app shell caching)
- [ ] Create router with emergency/navigation/safe-zone/settings routes
- [ ] Implement emergency-mode color scheme (high contrast)
- [ ] Create responsive layout (mobile-first)

#### P2.2: Geolocation Integration
- [ ] Implement `useGeolocation` hook (Geolocation API)
- [ ] Implement location reporting service (POST to API every 5s)
- [ ] Handle permission denied gracefully
- [ ] Implement location accuracy display

#### P2.3: Emergency Alert Screen
- [ ] Design panic-optimized alert interface
- [ ] Implement FCM notification listener
- [ ] Auto-open app on push notification
- [ ] Large "START NAVIGATION" button
- [ ] Emergency type and building display

#### P2.4: Navigation Screen (Core)
- [ ] Implement DirectionArrow component (CSS animated)
- [ ] Implement DistanceBadge component
- [ ] Implement ExitLabel component
- [ ] Subscribe to RTDB for real-time route updates
- [ ] Implement smooth direction transitions
- [ ] Implement reroute alert overlay

#### P2.5: Voice Guidance
- [ ] Integrate Google TTS API
- [ ] Implement voice instruction queue
- [ ] Implement auto-play on navigation start
- [ ] Implement reroute voice interrupt
- [ ] Add voice on/off toggle

#### P2.6: Push Notifications
- [ ] Register FCM service worker
- [ ] Implement notification permission request
- [ ] Handle foreground + background notifications
- [ ] Deep link to navigation on notification tap

#### P2.7: Offline Support
- [ ] Cache floor plan data in IndexedDB
- [ ] Display last known route when offline
- [ ] Show offline mode indicator
- [ ] Queue location updates for sync on reconnect

### Exit Criteria
- [ ] Emergency notification received and opens navigation
- [ ] Direction arrow correctly points toward assigned exit
- [ ] Voice guidance plays navigation instructions
- [ ] Reroute notification updates UI and plays voice alert
- [ ] App works offline with cached fallback

---

## Phase 3: Dashboard (Week 4-5)

### Goal
Build the authority dashboard with emergency controls, building map, and real-time monitoring.

### Tasks

#### P3.1: Dashboard Shell
- [ ] Set up React + Vite with router
- [ ] Implement sidebar navigation
- [ ] Implement authentication flow (email + MFA)
- [ ] Implement RBAC-based view controls
- [ ] Create responsive layout

#### P3.2: Emergency Control Panel
- [ ] Building/zone selector
- [ ] Emergency type + severity selector
- [ ] "TRIGGER EMERGENCY" button with confirmation modal
- [ ] "END EMERGENCY" button with confirmation
- [ ] Active emergency status display

#### P3.3: Building Map View
- [ ] Floor plan image renderer (pan/zoom)
- [ ] Floor selector tabs
- [ ] Exit markers with status colors (green/yellow/red)
- [ ] Crowd density heatmap overlay (Canvas 2D)
- [ ] Real-time user position dots (anonymized)

#### P3.4: Evacuation Progress
- [ ] Overall progress bar with percentage
- [ ] Per-exit utilization bars
- [ ] Estimated completion time
- [ ] Users needing assistance list
- [ ] Event timeline log

#### P3.5: Building Management
- [ ] Building CRUD interface
- [ ] Floor plan upload
- [ ] Exit configuration form
- [ ] Basic route graph editor (node + edge placement)

### Exit Criteria
- [ ] Authority can trigger and resolve emergency from dashboard
- [ ] Heatmap shows real-time crowd distribution
- [ ] Exit utilization bars update in real-time
- [ ] Building configuration creates functional routing graph
- [ ] Dashboard is responsive and RBAC-protected

---

## Phase 4: Integration & Demo (Week 5-6)

### Goal
End-to-end integration testing, performance optimization, demo preparation.

### Tasks

#### P4.1: End-to-End Integration
- [ ] Full scenario test: trigger → locate → assign → navigate → evacuate
- [ ] Multi-user simulation (100 users)
- [ ] Rerouting scenario test (blocked exit)
- [ ] Offline fallback scenario test
- [ ] Accessibility routing scenario test

#### P4.2: Performance Optimization
- [ ] Route calculation benchmarking (target: <3s for 1K users)
- [ ] API response time profiling
- [ ] Frontend bundle size audit (<300KB mobile, <500KB dashboard)
- [ ] Heatmap rendering performance (60fps)
- [ ] Service worker cache optimization

#### P4.3: Demo Data & Scenario
- [ ] Prepare demo building (City Centre Mall)
- [ ] Create 120-user simulation script
- [ ] Record demo video walkthrough
- [ ] Create demo presentation slides

#### P4.4: Documentation
- [ ] README with setup instructions
- [ ] API documentation
- [ ] Demo walkthrough guide
- [ ] Architecture overview diagram

### Exit Criteria
- [ ] Complete evacuation demo runs without errors
- [ ] Performance targets met
- [ ] Demo presentation ready
- [ ] Documentation complete

---

## Phase 5: Advanced Features (Week 7-12)

### Goal
Add SMS/IVR fallback, CCTV analysis, enhanced accessibility, and communication tools.

### Tasks
- [ ] SMS gateway integration (Twilio)
- [ ] IVR voice call integration
- [ ] CCTV frame analysis with Cloud Vision AI
- [ ] Hazard zone drawing tool on dashboard
- [ ] Communication broadcast center
- [ ] Enhanced accessibility (wearable vibration patterns)
- [ ] Multi-language voice guidance
- [ ] Emergency drill mode (non-alerting simulation)

---

## Phase 6: Scale & Polish (Week 13-18)

### Goal
Production hardening, multi-building support, analytics, and public API.

### Tasks
- [ ] Multi-building dashboard management
- [ ] Historical analytics and reporting
- [ ] Load testing (10,000 concurrent users)
- [ ] Security audit and penetration testing
- [ ] WCAG 2.1 AA accessibility audit
- [ ] Third-party API design and documentation
- [ ] Cell broadcast integration research
- [ ] Production deployment with multi-region
- [ ] Monitoring and alerting setup
- [ ] User acceptance testing with pilot customers
