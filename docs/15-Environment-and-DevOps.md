# Environment & DevOps — NETRA

---

## 1. Environment Configuration

### Environment Matrix

| Environment | Firebase Project | Purpose | Deploy Trigger |
|---|---|---|---|
| **Local** | Emulators | Development & debugging | Manual (`npm run dev`) |
| **Dev** | `netra-dev` | Integration testing | Merge to `develop` branch |
| **Staging** | `netra-staging` | Pre-production validation | Merge to `release/*` branch |
| **Production** | `netra-prod` | Live system | Merge to `main` branch |

### Environment Variables

```bash
# .env.example — All required environment variables

# Firebase Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_DATABASE_URL=

# Google Maps Platform
VITE_GOOGLE_MAPS_API_KEY=

# Cloud Functions (server-side only)
GOOGLE_MAPS_SERVER_API_KEY=
GOOGLE_CLOUD_VISION_API_KEY=
GOOGLE_TTS_API_KEY=

# SMS Gateway (Post-MVP)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Application Config
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:5001/netra-dev/us-central1/api
```

### Secret Management

| Secret | Storage | Access |
|---|---|---|
| Firebase service account | GCP Secret Manager | Cloud Functions only |
| Google Maps server key | GCP Secret Manager | Cloud Functions only |
| Vision AI credentials | GCP Secret Manager | Cloud Functions only |
| TTS API key | GCP Secret Manager | Cloud Functions only |
| Twilio credentials | GCP Secret Manager | Cloud Functions only |
| Firebase client config | `.env` files (non-secret) | Frontend apps |

```bash
# Store secrets in GCP Secret Manager
gcloud secrets create GOOGLE_MAPS_SERVER_API_KEY --data-file=key.txt
gcloud secrets create TWILIO_AUTH_TOKEN --data-file=token.txt

# Access in Cloud Functions
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
```

---

## 2. Firebase Configuration

### firebase.json
```json
{
  "hosting": [
    {
      "target": "mobile",
      "public": "apps/mobile/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }],
      "headers": [
        {
          "source": "/sw.js",
          "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
        }
      ]
    },
    {
      "target": "dashboard",
      "public": "apps/dashboard/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ],
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "codebase": "default"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "database": {
    "rules": "database.rules.json"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "functions": { "port": 5001 },
    "firestore": { "port": 8080 },
    "database": { "port": 9000 },
    "hosting": { "port": 5000 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

### .firebaserc
```json
{
  "projects": {
    "default": "netra-dev",
    "dev": "netra-dev",
    "staging": "netra-staging",
    "prod": "netra-prod"
  },
  "targets": {
    "netra-dev": {
      "hosting": {
        "mobile": ["netra-dev-mobile"],
        "dashboard": ["netra-dev-dashboard"]
      }
    },
    "netra-prod": {
      "hosting": {
        "mobile": ["netra-mobile"],
        "dashboard": ["netra-dashboard"]
      }
    }
  }
}
```

---

## 3. CI/CD Pipelines

### CI Pipeline (`ci.yml`)
```yaml
name: CI
on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  lint-test-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint:all

      - name: Type check
        run: npm run typecheck --workspaces

      - name: Unit tests
        run: npm run test:all

      - name: Build all
        run: npm run build:all

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: functions/coverage/lcov.info
```

### Deploy Dev (`deploy-dev.yml`)
```yaml
name: Deploy Dev
on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: [lint-test-build]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run build:all

      - name: Deploy to Firebase Dev
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_DEV }}
          projectId: netra-dev

      - name: Deploy Functions
        run: npx firebase-tools deploy --only functions --project dev
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

### Deploy Production (`deploy-prod.yml`)
```yaml
name: Deploy Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run build:all
      - run: npm run test:all

      - name: Deploy to Firebase Prod
        run: npx firebase-tools deploy --project prod
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN_PROD }}
```

---

## 4. Local Development Setup

### Prerequisites
```bash
# Required
Node.js 20 LTS
npm 10+
Firebase CLI: npm install -g firebase-tools
Git

# Optional
Google Cloud SDK (for Secret Manager access)
```

### Quick Start
```bash
# 1. Clone and install
git clone https://github.com/org/netra.git
cd netra
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your Firebase project config

# 3. Start Firebase emulators
npx firebase emulators:start

# 4. Start development servers (separate terminals)
npm run dev:mobile       # http://localhost:5173
npm run dev:dashboard    # http://localhost:5174
npm run dev:functions    # Served via emulator on :5001

# 5. Seed sample data
npm run seed
```

---

## 5. Monitoring & Observability

### Cloud Monitoring Setup

| Metric | Alert Threshold | Channel |
|---|---|---|
| Cloud Function error rate | >5% over 5 minutes | Email + Slack |
| API latency P95 | >2 seconds | Email |
| Firestore read/write errors | >10 per minute | Email + Slack |
| RTDB connection count | >80% of limit | Email |
| FCM delivery failure rate | >10% | Email |
| Function memory usage | >80% of limit | Email |
| Hosting 5xx error rate | >1% | Email + Slack |

### Structured Logging Format
```json
{
  "severity": "INFO",
  "timestamp": "2026-03-31T16:30:00Z",
  "service": "exit-allocation-engine",
  "function": "calculateRoutes",
  "emergencyId": "emg_xyz789",
  "buildingId": "bldg_abc123",
  "message": "Route calculation completed",
  "metadata": {
    "usersProcessed": 120,
    "executionTimeMs": 1250,
    "exitsUsed": 4,
    "reroutesGenerated": 8
  },
  "requestId": "req_abc123"
}
```

### Log Categories
```
emergency.*     — Emergency trigger, resolve, hazard updates
routing.*       — Route calculations, rebalancing decisions
notification.*  — Push, SMS, IVR send/delivery/failure
location.*      — User location updates, batch processing
crowd.*         — Density calculations, CCTV analysis
dashboard.*     — Admin actions, configuration changes
auth.*          — Login, logout, permission checks
system.*        — Health checks, startup, shutdown
```

### Dashboards
1. **Operations Dashboard** — Real-time system health, error rates, latency
2. **Emergency Dashboard** — Active emergencies, evacuation metrics, comms delivery
3. **Cost Dashboard** — API call volumes, storage usage, function invocations

---

## 6. Infrastructure Scaling

### Cloud Functions Scaling Config
```typescript
// Per-function scaling configuration
export const calculateRoutes = onRequest({
  region: "us-central1",
  memory: "1GiB",
  timeoutSeconds: 60,
  minInstances: 1,        // Keep warm for emergency response
  maxInstances: 100,
  concurrency: 80,
});

export const reportLocation = onRequest({
  region: "us-central1",
  memory: "256MiB",
  timeoutSeconds: 10,
  minInstances: 0,
  maxInstances: 500,      // High concurrency for location reports
  concurrency: 200,
});
```

### Cost Optimization
- Cloud Functions: `minInstances: 1` only for critical emergency functions
- Firestore: Use Realtime Database for hot path (cheaper for frequent small reads)
- Cloud Storage: Lifecycle policy to archive old floor plans after 90 days
- Maps API: Cache geocoding results; use session tokens for Places
- Vision AI: Process frames at 1 FPS max (not real-time video)

---

## 7. Disaster Recovery

| Component | Backup Strategy | RTO | RPO |
|---|---|---|---|
| Firestore | Automatic daily exports to Cloud Storage | 4 hours | 24 hours |
| Realtime Database | Manual export before major changes | 1 hour | Event-level |
| Cloud Storage | Cross-region replication | 1 hour | Near-zero |
| Cloud Functions | Source in Git; redeploy from CI/CD | 30 minutes | Zero (code) |
| Configuration | Stored in Firestore (backed up with DB) | 4 hours | 24 hours |
