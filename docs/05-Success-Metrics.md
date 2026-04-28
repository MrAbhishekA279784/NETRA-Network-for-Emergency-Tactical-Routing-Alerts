# Success Metrics — NETRA

## Key Performance Indicators

---

## 1. North Star Metric

> **Evacuation Time Reduction**: ≥50% reduction in evacuation completion time vs. unguided baseline.

---

## 2. Evacuation Efficiency

| Metric | Target (MVP) | Target (V1.0) |
|---|---|---|
| Avg Evacuation Time (500 people) | <5 min | <3 min |
| Exit Utilization Variance | <30% | <15% |
| Time-to-First-Guidance | <10s | <5s |
| Bottleneck Incidents per event | <3 | 0 |
| Rerouting Success Rate | >70% | >85% |

## 3. System Performance

| Metric | Target (MVP) | Target (V1.0) |
|---|---|---|
| Route Calc Latency (1K users) | <5s | <3s |
| API P95 Response Time | <1000ms | <500ms |
| System Availability | 99.5% | 99.99% |
| Push Notification Delivery | >90% | >95% |
| Heatmap Refresh Latency | <5s | <2s |
| Concurrent Users | 5,000 | 50,000 |

## 4. Communication Coverage

| Metric | Target (MVP) | Target (V1.0) |
|---|---|---|
| Channel Coverage (any channel) | >85% | >98% |
| SMS Delivery (within 30s) | >80% | >90% |
| IVR Call Completion | N/A | >60% |
| Offline User Coverage | >70% | >90% |

## 5. User Experience

| Metric | Target |
|---|---|
| Navigation Clarity Score (1-5) | ≥4.0 |
| Task Completion Rate | >95% |
| Time-to-Understand Direction | <3 seconds |
| WCAG 2.1 AA Compliance | 100% |
| Voice Guidance Clarity (1-5) | ≥4.0 |

## 6. Authority Dashboard

| Metric | Target |
|---|---|
| Dashboard Load Time | <2s |
| Heatmap Accuracy | >85% correlation |
| Emergency Trigger Time | <5s (2 clicks) |
| Operator Confidence Score (1-5) | ≥4.0 |

## 7. Business Metrics (Year 1)

| Metric | Target |
|---|---|
| Pilot Deployments | ≥5 |
| Paying Customers | ≥3 |
| MRR | $25K+ |
| Customer NPS | ≥40 |
| Churn Rate | <5% |
| Time-to-Deploy | <2 weeks |

## 8. Safety & Compliance

| Metric | Target |
|---|---|
| False Alarm Rate | <2% |
| Unauthorized Trigger Success | 0 |
| Data Retention Compliance | 100% |
| Audit Log Completeness | 100% |
| Privacy Incidents | 0 |

## 9. Measurement Infrastructure

```
Event Sources → Cloud Monitoring + Cloud Logging + Firestore Analytics
Reports:
  - Real-time: System Health (Engineering)
  - Per-event: Evacuation Drill Report (Customer)
  - Monthly: Business Metrics (Leadership)
  - Quarterly: Safety & Compliance Review
```

## 10. Phase Success Criteria

### MVP
- [ ] Emergency trigger <5s
- [ ] Route calc for 100 users <3s
- [ ] Mobile navigation renders correctly
- [ ] Push notification delivered
- [ ] Dashboard shows crowd distribution
- [ ] Exit variance <30%

### V1.0
- [ ] 50% evacuation time reduction (3+ drills)
- [ ] 99.9% uptime over 30 days
- [ ] 3+ paying customers
- [ ] WCAG 2.1 AA passed
- [ ] Complete audit trail
- [ ] NPS ≥40
