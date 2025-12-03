# Implementation Plan for Missing Backend Components

## Priority 1: Critical Missing Components
- [x] Create backend/src/controllers/reports.controller.js - GET /api/reports/station/:stationId (CSV/JSON export)
- [x] Create backend/src/services/reports.service.js - Report generation logic
- [x] Mount reports routes in backend/src/routes/index.js
- [x] Implement createBatchTransactions function in transaction.service.js - Batch transaction processing
- [ ] Create backend/scripts/seed.js - Initialize admin, station ST-001, sample clients/transactions
- [ ] Create backend/src/jobs/expireBons.job.js - Cron job for bon expiration

## Priority 2: Testing & QA
- [ ] Complete backend/tests/bonus.service.test.js - Unit tests for bonus service methods

## Priority 3: Documentation & Contracts
- [ ] Create backend/docs/openapi.yaml - OpenAPI 3.0 specification
- [ ] Update backend/README.md - Installation/setup instructions and .env sample

## Priority 4: CI/CD & Deployment
- [ ] Create backend/.github/workflows/ci.yml - GitHub Actions CI pipeline
- [ ] Create backend/Dockerfile - Docker containerization
- [ ] Create backend/docker-compose.yml - Local development environment

## Priority 5: Verification
- [ ] Run application and verify Mongoose index warnings are resolved
- [ ] Test all new endpoints and functionality
- [ ] Run npm test to ensure all tests pass
