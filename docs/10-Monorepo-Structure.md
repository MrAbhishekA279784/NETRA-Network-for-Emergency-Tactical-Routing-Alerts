# Monorepo Structure — NETRA

---

## Repository Layout

```
netra/
│
├── README.md                          # Project overview and setup instructions
├── LICENSE
├── .gitignore
├── .env.example                       # Environment variable template
├── .env.local                         # Local dev environment
├── firebase.json                      # Firebase project configuration
├── firestore.rules                    # Firestore security rules
├── firestore.indexes.json            # Firestore composite indexes
├── database.rules.json               # Realtime Database security rules
├── .firebaserc                        # Firebase project aliases (netra-dev/staging/prod)
├── package.json                       # Root workspace configuration
├── turbo.json                         # Turborepo build pipeline
│
├── apps/
│   ├── mobile/                        # 📋 Evacuee PWA (Empty)
│   │
│   └── dashboard/                     # ✅ Authority Dashboard (React + Vite)
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── index.html
│       └── src/                       # Current state: High-fidelity single-file UI
│           ├── main.tsx               # ✅ Entry point
│           ├── App.tsx                # ✅ Core Dashboard (Isometric Map + Simulation)
│           └── index.css              # ✅ Design system styles
│
├── functions/                         # Google Cloud Functions (Backend)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .eslintrc.js
│   └── src/
│       ├── index.ts                   # Function exports entry point
│       ├── config/
│       │   ├── firebase.ts            # Admin SDK init
│       │   ├── environment.ts         # Env variable loader
│       │   └── constants.ts           # System constants
│       ├── api/
│       │   ├── emergency.ts           # Emergency CRUD handlers
│       │   ├── location.ts            # Location processing handlers
│       │   ├── routing.ts             # Route calculation handlers
│       │   ├── building.ts            # Building management handlers
│       │   ├── notification.ts        # Notification handlers
│       │   ├── crowd.ts               # Crowd analysis handlers
│       │   └── dashboard.ts           # Dashboard data handlers
│       ├── engine/
│       │   ├── exitAllocation.ts      # Core exit allocation algorithm
│       │   ├── crowdBalancing.ts      # Dynamic crowd rebalancing
│       │   ├── routeOptimizer.ts      # Graph-based route optimizer
│       │   ├── graphUtils.ts          # Graph traversal utilities
│       │   └── weightCalculator.ts    # Edge weight computation
│       ├── services/
│       │   ├── firestoreService.ts    # Firestore operations
│       │   ├── realtimeDbService.ts   # RTDB operations
│       │   ├── fcmService.ts          # Firebase Cloud Messaging
│       │   ├── smsService.ts          # SMS gateway integration
│       │   ├── ivrService.ts          # IVR call integration
│       │   ├── visionService.ts       # Cloud Vision AI client
│       │   ├── ttsService.ts          # Text-to-Speech client
│       │   └── mapsService.ts         # Google Maps client
│       ├── middleware/
│       │   ├── auth.ts                # Authentication middleware
│       │   ├── rbac.ts                # Role-based access control
│       │   ├── validator.ts           # Request validation
│       │   ├── rateLimiter.ts         # Rate limiting
│       │   └── errorHandler.ts        # Global error handler
│       ├── triggers/
│       │   ├── onEmergencyCreate.ts   # Firestore trigger: new emergency
│       │   ├── onLocationUpdate.ts    # RTDB trigger: location change
│       │   └── onDensityThreshold.ts  # RTDB trigger: density alert
│       ├── utils/
│       │   ├── types.ts               # Shared TypeScript types
│       │   ├── errors.ts              # Custom error classes
│       │   ├── logger.ts              # Structured logging
│       │   └── validators.ts          # Validation schemas
│       └── __tests__/
│           ├── exitAllocation.test.ts
│           ├── crowdBalancing.test.ts
├── functions/                         # ✅ Google Cloud Functions
│   ├── src/
│   │   ├── api/                       # 📋 Planned Handlers
│   │   ├── engine/                    # ✅ Core AI Logic
│   │   │   ├── exitAllocation.ts      # ✅ Dijkstra engine
│   │   │   ├── crowdBalancing.ts      # ✅ Density logic
│   │   │   └── routeOptimizer.ts      # ✅ Route refinement
│   │   └── services/
│   │       └── mapsService.ts         # ✅ Google Maps integration
│   └── __tests__/                      # 📋 Planned Tests
│
├── packages/                          # 📋 Shared logic (Empty)
│   └── shared/
│       └── src/
│           ├── types/                 # 📋 Planned Type Definitions
│           └── utils/                 # 📋 Planned Shared Utils
│
├── scripts/
│   └── simulateUsers.ts               # ✅ Real-time load generation script
│
├── docs/                              # ✅ Project Documentation
│   └── (18 aligned markdown files)
│
└── .github/                           # 📋 CI/CD Workflows
```

---

## Workspace Configuration

### Root `package.json`
```json
{
  "name": "netra",
  "private": true,
  "workspaces": [
    "apps/*",
    "functions",
    "packages/*"
  ],
  "scripts": {
    "dev:mobile": "npm run dev --workspace=apps/mobile",
    "dev:dashboard": "npm run dev --workspace=apps/dashboard",
    "dev:functions": "npm run serve --workspace=functions",
    "build:all": "npm run build --workspaces",
    "test:all": "npm run test --workspaces",
    "lint:all": "npm run lint --workspaces",
    "deploy:dev": "firebase deploy --project dev",
    "deploy:staging": "firebase deploy --project staging",
    "deploy:prod": "firebase deploy --project prod",
    "seed": "ts-node scripts/seed-building.ts",
    "simulate": "ts-node scripts/simulate-emergency.ts"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "firebase-tools": "^13.0.0"
  }
}
```

### Dependency Graph
```
packages/shared ─────────────────────────┐
    │                                     │
    ▼                                     ▼
apps/mobile          apps/dashboard    functions/
(React + Vite)       (React + Vite)    (Cloud Functions)
    │                    │                 │
    └────────────────────┴─────────────────┘
                         │
                    Firebase Platform
                 (Hosting + Functions)
```
