# Testing Strategy — NETRA

---

## 1. Testing Pyramid

```
         ╱╲
        ╱  ╲         E2E Tests (5%)
       ╱    ╲        Full evacuation scenario, multi-user simulation
      ╱──────╲
     ╱        ╲      Integration Tests (25%)
    ╱          ╲     API endpoints, Firebase triggers, multi-module flows
   ╱────────────╲
  ╱              ╲   Unit Tests (70%)
 ╱                ╲  Engine algorithms, utilities, components, hooks
╱──────────────────╲
```

---

## 2. Unit Testing

### Framework & Tools
- **Test Runner**: Vitest (for apps), Jest (for functions)
- **Assertion**: Built-in expect
- **Mocking**: Vitest mock / Jest mock
- **Coverage**: Istanbul/c8

### Coverage Targets

| Module | Target | Critical Files |
|---|---|---|
| Core Engine (`functions/src/engine/`) | ≥90% | exitAllocation.ts, crowdBalancing.ts, routeOptimizer.ts |
| API Handlers (`functions/src/api/`) | ≥80% | emergency.ts, routing.ts, notification.ts |
| Services (`functions/src/services/`) | ≥75% | firestoreService.ts, fcmService.ts |
| Shared Utils (`packages/shared/`) | ≥90% | geoUtils.ts, validation.ts |
| React Components | ≥70% | DirectionArrow, Navigation, EmergencyAlert |
| React Hooks | ≥80% | useGeolocation, useEmergency, useRoute |

### Core Engine Unit Tests

```typescript
// exitAllocation.test.ts — Example test cases

describe('ExitAllocationEngine', () => {
  describe('allocateExits', () => {
    it('assigns all users to reachable exits', () => {});
    it('distributes users evenly across exits of equal distance', () => {});
    it('assigns closer exit when distances differ significantly', () => {});
    it('respects exit capacity limits', () => {});
    it('avoids hazard zones in route calculation', () => {});
    it('skips blocked exits completely', () => {});
    it('prioritizes accessible exits for wheelchair users', () => {});
    it('handles single exit scenario', () => {});
    it('handles all exits blocked (returns error)', () => {});
    it('handles user at exit location (zero distance)', () => {});
    it('completes for 1000 users within 3 seconds', () => {});
  });

  describe('weightCalculation', () => {
    it('increases weight for high density edges', () => {});
    it('returns Infinity for hazardous edges', () => {});
    it('returns Infinity for non-accessible edges when user needs accessibility', () => {});
    it('penalizes narrow corridors', () => {});
    it('applies no penalty below 40% density', () => {});
  });
});

// crowdBalancing.test.ts
describe('CrowdBalancingEngine', () => {
  it('triggers rebalancing when exit exceeds 80% capacity', () => {});
  it('does NOT reroute users within 30m of assigned exit', () => {});
  it('limits reroutes to 2 per user', () => {});
  it('only reroutes when improvement exceeds 20%', () => {});
  it('reduces congested exit density below target after rebalancing', () => {});
  it('handles newly blocked exit by rerouting all assigned users', () => {});
  it('handles multiple congested exits simultaneously', () => {});
});

// routeOptimizer.test.ts
describe('RouteOptimizer', () => {
  it('finds shortest path in simple graph', () => {});
  it('avoids blocked edges', () => {});
  it('generates correct turn instructions', () => {});
  it('handles multi-floor routing via stairwell', () => {});
  it('prefers elevator for accessible routing', () => {});
  it('estimates walking time correctly', () => {});
});
```

### Frontend Component Tests

```typescript
// DirectionArrow.test.tsx
describe('DirectionArrow', () => {
  it('renders arrow pointing in correct bearing', () => {});
  it('updates rotation smoothly on bearing change', () => {});
  it('displays in high contrast emergency colors', () => {});
  it('meets minimum size requirements (48x48px touch target)', () => {});
});

// useGeolocation.test.ts
describe('useGeolocation', () => {
  it('returns position when geolocation available', () => {});
  it('handles permission denied gracefully', () => {});
  it('falls back to last known position on error', () => {});
  it('updates position every 5 seconds', () => {});
});
```

---

## 3. Integration Testing

### API Integration Tests
```typescript
// Test against Firebase Emulators

describe('Emergency API', () => {
  it('POST /emergency/trigger creates emergency and returns ID', () => {});
  it('POST /emergency/trigger requires ADMIN or OPERATOR role', () => {});
  it('POST /emergency/trigger rejects duplicate active emergency', () => {});
  it('POST /emergency/{id}/resolve ends active emergency', () => {});
  it('triggered emergency creates RTDB entries', () => {});
  it('triggered emergency sends push notifications', () => {});
});

describe('Location + Routing Flow', () => {
  it('location report returns route assignment', () => {});
  it('multiple location reports update crowd density', () => {});
  it('density threshold triggers rebalancing', () => {});
  it('rebalanced users receive updated assignments in RTDB', () => {});
});

describe('Building Management', () => {
  it('create building with floors and exits', () => {});
  it('update graph data updates routing calculations', () => {});
  it('block exit triggers rerouting for assigned users', () => {});
});
```

### Firebase Trigger Tests
```typescript
describe('Firestore Triggers', () => {
  it('onEmergencyCreate initiates location scan and notification dispatch', () => {});
});

describe('RTDB Triggers', () => {
  it('onDensityThreshold triggers crowd rebalancing', () => {});
});
```

---

## 4. End-to-End Testing

### E2E Framework
- **Tool**: Playwright (browser-based E2E)
- **Scope**: Critical user flows only (not comprehensive UI testing)

### Critical E2E Scenarios

#### Scenario 1: Full Evacuation Flow
```
1. Admin logs into dashboard
2. Admin triggers emergency for "City Centre Mall"
3. Verify emergency status shows ACTIVE on dashboard
4. Simulate 10 user location reports via API
5. Verify route assignments created for all users
6. Open mobile PWA — verify navigation screen displays
7. Verify directional arrow points toward assigned exit
8. Simulate congestion at Exit A
9. Verify rebalancing reroutes users
10. Admin resolves emergency
11. Verify "All Clear" message on mobile
```

#### Scenario 2: Offline Fallback
```
1. Mobile PWA loads and caches floor plan
2. Emergency triggered — navigation starts
3. Simulate network disconnection
4. Verify offline mode activates with cached data
5. Verify last known directions still displayed
6. Simulate reconnection
7. Verify data sync resumes
```

#### Scenario 3: Accessibility Routing
```
1. User sets accessibility preference: wheelchair
2. Emergency triggered
3. Verify assigned route avoids stairs
4. Verify elevator route is selected
5. Verify authority dashboard shows user needing assistance
```

---

## 5. Performance Testing

### Load Testing
- **Tool**: Artillery.io or k6
- **Environment**: Staging (Firebase emulators for isolation)

#### Load Test Scenarios

| Scenario | Users | Duration | Target |
|---|---|---|---|
| Location report burst | 1,000 concurrent | 2 minutes | <500ms P95 response |
| Route calculation batch | 1,000 users | Single batch | <3 seconds total |
| RTDB listener updates | 5,000 listeners | 5 minutes | <100ms propagation |
| Dashboard concurrent | 50 admin users | 5 minutes | <2s page load |
| Emergency trigger peak | 10 simultaneous | 1 minute | <5s notification delivery |

### Load Test Script Example
```javascript
// k6 load test: location reporting
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 1000 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const payload = JSON.stringify({
    emergencyId: 'emg_loadtest',
    lat: 28.6139 + Math.random() * 0.01,
    lng: 77.2090 + Math.random() * 0.01,
    floor: Math.floor(Math.random() * 3) + 1,
    accuracy: 10,
    deviceType: 'SMARTPHONE_ONLINE',
  });

  const res = http.post(`${BASE_URL}/location/report`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(5);
}
```

---

## 6. Security Testing

### Automated Security Checks
- [ ] Firebase Security Rules unit tests (via `@firebase/rules-unit-testing`)
- [ ] API endpoint authentication enforcement (test without token, wrong role)
- [ ] Input validation (SQL injection patterns, XSS payloads, oversized inputs)
- [ ] Rate limiting verification
- [ ] CORS policy validation

### Manual Security Review
- [ ] Secret exposure audit (no keys in code, logs, or client bundles)
- [ ] Firestore/RTDB rules audit (principle of least privilege)
- [ ] Admin MFA enforcement verification
- [ ] Audit log completeness check
- [ ] Data retention policy validation

---

## 7. Accessibility Testing

### Automated
- **Lighthouse**: Score ≥90 for accessibility on all pages
- **axe-core**: Zero critical/serious violations
- **Pa11y**: Automated WCAG 2.1 AA scan

### Manual
- [ ] Screen reader testing (NVDA/VoiceOver) on dashboard
- [ ] Keyboard-only navigation on dashboard
- [ ] Color contrast verification (emergency UI)
- [ ] Touch target size verification (mobile — minimum 48x48px)
- [ ] Voice guidance clarity testing (TTS output quality)

---

## 8. Test Environments

| Test Type | Environment | Data |
|---|---|---|
| Unit tests | Local (no Firebase) | Mocked |
| Integration tests | Firebase Emulators | Seed data |
| E2E tests | Firebase Emulators | Seed data |
| Load tests | Staging Firebase project | Generated data |
| Security tests | Local + Staging | Minimal data |
| Accessibility tests | Local dev server | Sample screens |

### CI Test Execution
```yaml
# Tests run in CI pipeline order:
1. Lint (ESLint + TypeScript type check)
2. Unit tests (Vitest + Jest) with coverage report
3. Integration tests (Firebase Emulators in CI)
4. Build verification (all packages build successfully)
# E2E and load tests run on staging deploy only
```
