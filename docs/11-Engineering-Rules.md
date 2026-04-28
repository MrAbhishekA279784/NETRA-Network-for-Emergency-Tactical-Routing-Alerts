# Engineering Rules — NETRA

---

## 1. Code Standards

### Language & Runtime
- **TypeScript** for all code (strict mode enabled)
- **Node.js 20 LTS** for Cloud Functions
- **React 18+** for frontend applications
- **ES2022** target for all TypeScript compiled output

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  }
}
```

### Naming Conventions
| Element | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `DirectionArrow.tsx` |
| Files (utils/services) | camelCase | `locationService.ts` |
| Files (types) | camelCase | `emergency.ts` |
| Components | PascalCase | `<HazardWarning />` |
| Functions | camelCase | `calculateOptimalRoute()` |
| Constants | UPPER_SNAKE_CASE | `MAX_REROUTES_PER_USER` |
| Types/Interfaces | PascalCase | `EmergencyEvent`, `RouteAssignment` |
| Enums | PascalCase with UPPER values | `Severity.HIGH` |
| CSS classes | kebab-case | `.direction-arrow` |
| API endpoints | kebab-case | `/emergency/hazard-zones` |
| Database fields | camelCase | `buildingId`, `triggeredAt` |
| Environment variables | UPPER_SNAKE_CASE | `GOOGLE_MAPS_API_KEY` |

---

## 2. Architecture Rules

### Rule A1: Separation of Concerns
- Frontend: UI rendering and user interaction only
- Backend (Cloud Functions): Business logic, data access, external API calls
- Shared package: Type definitions and pure utility functions only

### Rule A2: No Direct Database Access from Frontend
- Frontend must call Cloud Functions API endpoints
- Exception: Firebase Realtime Database listeners for live data (read-only)
- Firestore Security Rules enforce server-side validation

### Rule A3: Stateless Backend Functions
- Cloud Functions must be stateless — no in-memory state between invocations
- All state stored in Firestore or Realtime Database
- Configuration loaded from environment variables or Firestore `system_config`

### Rule A4: Single Responsibility Functions
- Each Cloud Function handles one specific responsibility
- Maximum function size: 200 lines (excluding imports and types)
- Complex logic extracted to engine/ or services/ modules

### Rule A5: Shared Types Across Workspace
- All shared TypeScript types live in `packages/shared/src/types/`
- Frontend and backend import from `@netra/shared`
- No type duplication across packages

---

## 3. Security Rules

### Rule S1: No Hardcoded Secrets
- All API keys, credentials, and secrets in environment variables
- Production secrets in Google Cloud Secret Manager
- `.env.example` documents required variables (without values)
- `.env.local` is git-ignored

### Rule S2: Authentication on Every Endpoint
- All API endpoints require Firebase Auth JWT (except health check)
- Anonymous auth for evacuee endpoints (minimal permissions)
- Admin endpoints require verified admin role in custom claims

### Rule S3: Input Validation
- All API inputs validated using Zod schemas
- Reject requests with invalid/unexpected fields
- Sanitize strings to prevent injection

### Rule S4: RBAC Enforcement
- Four roles: `SUPER_ADMIN`, `ADMIN`, `OPERATOR`, `VIEWER`
- Emergency trigger requires `ADMIN` or `OPERATOR`
- Building configuration requires `ADMIN`
- Dashboard viewing requires any authenticated admin role

### Rule S5: Audit Logging
- Log all emergency triggers with operator ID and timestamp
- Log all hazard zone changes and exit blocks
- Log all broadcast messages
- Log all configuration changes
- Logs are immutable (append-only)

---

## 4. Data Rules

### Rule D1: Privacy by Design
- Use anonymous/pseudonymous user identifiers
- Never store names, emails, or phone numbers of evacuees
- Location data auto-expires after configurable TTL (default: 24 hours)
- Emergency logs retained for 365 days, then archived

### Rule D2: Data Separation
- Hot data (real-time) in Firebase Realtime Database
- Cold data (persistent) in Firestore
- Binary assets in Cloud Storage
- Never mix hot and cold data in the same store

### Rule D3: Optimistic UI Updates
- Dashboard updates via Firestore `onSnapshot` listeners
- Mobile app updates via RTDB listeners
- No polling — always use real-time listeners
- Display optimistic state while confirming with server

---

## 5. Frontend Rules

### Rule F1: Panic-Optimized UI
- Maximum 2 taps to reach navigation during emergency
- Primary direction visible without scrolling
- Minimum touch target: 48x48px
- High contrast colors (WCAG AA minimum, AAA preferred)
- No decorative animations during emergency mode

### Rule F2: Offline-First PWA
- Service worker caches app shell and floor plans
- IndexedDB stores last known route and building data
- Graceful degradation message when fully offline
- Automatic reconnection and data sync

### Rule F3: Accessibility Compliance
- WCAG 2.1 Level AA for all interfaces
- Semantic HTML elements
- ARIA labels on all interactive elements
- Keyboard navigable dashboard
- Screen reader tested

### Rule F4: Component Structure
- One component per file
- Props typed with TypeScript interfaces
- No inline styles — use CSS modules or styled components
- Custom hooks for reusable logic
- Components under 150 lines (extract sub-components)

---

## 6. API Rules

### Rule API1: RESTful Conventions
- Use HTTP methods correctly: GET (read), POST (create), PUT (update), DELETE (remove)
- Consistent response envelope: `{ data, error, pagination }`
- HTTP status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)

### Rule API2: Versioning
- API version prefix: `/api/v1/`
- Breaking changes require version increment
- Deprecation warnings for 2 releases before removal

### Rule API3: Error Handling
- All errors return structured JSON with `code`, `status`, `message`, `requestId`
- Never expose stack traces in production
- Log full error details server-side with correlation ID

### Rule API4: Rate Limiting
- Apply rate limits per endpoint category
- Return `429 Too Many Requests` with `Retry-After` header
- Emergency endpoints have higher limits than management endpoints

---

## 7. Testing Rules

### Rule T1: Test Coverage
- Core engine: ≥90% line coverage
- API handlers: ≥80% line coverage
- Frontend components: ≥70% line coverage
- Integration tests for critical paths

### Rule T2: Test Structure
- Unit tests co-located with source (`.test.ts` suffix)
- Integration tests in `__tests__/` directories
- E2E tests in dedicated `e2e/` directory

### Rule T3: Test Before Merge
- All tests must pass before PR merge
- No skipped tests in main branch
- New features require corresponding tests

---

## 8. Git & CI/CD Rules

### Branch Strategy
```
main                 — production-ready code
├── develop          — integration branch
├── feature/*        — new features
├── fix/*            — bug fixes
├── hotfix/*         — production hotfixes
└── release/*        — release preparation
```

### Commit Messages
Format: `type(scope): description`
```
feat(engine): add crowd density weight to exit allocation
fix(dashboard): correct heatmap color scale rendering
docs(api): update emergency trigger response schema
test(routing): add edge case test for blocked exits
chore(ci): update Node.js version in GitHub Actions
```

### PR Requirements
- Description with context and testing notes
- All CI checks passing
- At least 1 code review approval
- No merge conflicts
- Linked to issue/ticket

---

## 9. Performance Rules

### Rule P1: Response Time Budgets
- API P95: <500ms
- Route calculation (1K users): <3s
- Dashboard page load: <2s
- Mobile first contentful paint: <1.5s
- Push notification delivery: <5s

### Rule P2: Bundle Size Limits
- Mobile PWA: <300KB initial JS bundle
- Dashboard: <500KB initial JS bundle
- Code splitting for route-based lazy loading
- Tree shaking for unused code elimination

### Rule P3: Real-Time Performance
- Realtime Database listeners: <100ms propagation
- Heatmap rendering: 60fps (no janky updates)
- Geolocation updates: every 5 seconds during emergency
