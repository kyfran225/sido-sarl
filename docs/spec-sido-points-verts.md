# Spécification Technique d'API — Système SIDO Points Verts

## 1. Vue d'ensemble
- REST JSON over HTTPS, dates ISO 8601 UTC.
- Auth : JWT (access 15 min) + refresh 30 j.
- Tous les objets exposent `createdAt`, `updatedAt`, `auditId` (si applicable) et `deviceId` pour opérations offline.
- Toute requête mutative : `Authorization: Bearer <accessToken>`.

## 2. Variables d'environnement
| Variable | Description | Exemple |
|----------|-------------|---------|
| `PORT` | Port HTTP | `4000` |
| `NODE_ENV` | Environnement | `production` |
| `MONGO_URI` | Connexion Mongo Atlas | `mongodb+srv://.../sido-prod` |
| `JWT_SECRET` | Secret HMAC | `quelquechose_tres_secret` |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh TTL | `30d` |
| `SALT_ROUNDS` | Coût bcrypt | `12` |
| `ADMIN_INIT_EMAIL` | Seed admin | `admin@sido.ci` |
| `AWS_S3_BUCKET` | Exports (opt.) | `sido-prod-exports` |
| `SENTRY_DSN` | Monitoring (opt.) | `https://...` |
| `RATE_LIMIT_WINDOW_MS` | Fenêtre RL | `60000` |
| `RATE_LIMIT_MAX` | Max requêtes | `200` |
| `PROMETHEUS_PORT` | Port métriques | `9100` |
| `REDIS_URI` | Cache (opt.) | `redis://` |
| `BATCH_MAX_SIZE` | Transactions max /sync | `200` |

## 3. Modèles MongoDB
### 3.1 `clients`
```js
sid: { type: String, required: true, unique: true }
firstName: { type: String, required: true }
lastName: { type: String }
phone: { type: String, required: true, index: true }
segment: { type: String, default: 'general' }
stationEnrolement: { type: ObjectId, ref: 'stations', required: true }
metadata: { type: Object }
createdAt: { type: Date, default: Date.now }
updatedAt: { type: Date }
```
Indexes : `sid` unique, `phone`, `stationEnrolement`.

### 3.2 `transactions`
```js
auditId: { type: String, required: true, unique: true }
clientSid: { type: String, required: true, index: true }
stationId: { type: ObjectId, ref: 'stations', required: true }
pompisteId: { type: ObjectId, ref: 'users', required: true }
deviceId: { type: String, required: true }
localTimestamp: { type: Date, required: true }
serverTimestamp: { type: Date, default: Date.now }
amountFCFA: { type: Number, required: true }
litres: { type: Number }
pointsAwarded: { type: Number, default: 0 }
status: { type: String, enum: ['pending','synced','rejected'], default: 'pending' }
reasonRejected: { type: String }
createdAt: { type: Date, default: Date.now }
```
Indexes : `auditId` unique, `clientSid`, composé `stationId+serverTimestamp`.

### 3.3 `points`
```js
clientSid: { type: String, required: true, unique: true }
totalPoints: { type: Number, default: 0 }
pointsHistory: [{ transactionId: ObjectId, points: Number, date: Date }]
lastUpdated: { type: Date, default: Date.now }
```

### 3.4 `bons`
```js
code: { type: String, required: true, unique: true }
clientSid: { type: String, required: true, index: true }
stationId: { type: ObjectId, ref: 'stations' }
montantFCFA: { type: Number, required: true }
generatedByTransaction: { type: ObjectId, ref: 'transactions' }
status: { type: String, enum: ['available','used','expired'], default: 'available' }
dateGenerated: { type: Date, default: Date.now }
dateUsed: { type: Date }
dateExpiry: { type: Date }
ruleVersion: { type: String }
```

### 3.5 `users`
```js
name: String
email: { type: String, required: true, unique: true }
phone: String
role: { type: String, enum: ['pompiste','manager','admin'], default: 'pompiste' }
stationId: { type: ObjectId, ref: 'stations' }
passwordHash: String
devices: [{ deviceId: String, lastSeen: Date, revoked: Boolean }]
createdAt: Date
updatedAt: Date
```

### 3.6 `stations`
```js
name: String
code: { type: String, unique: true }
address: String
createdAt: Date
```

### 3.7 `audit_logs`
```js
action: String
entityType: String
entityId: String
performedBy: ObjectId
deviceId: String
details: Object
createdAt: Date
```
Indexes : `entityType+entityId`, TTL sur `createdAt`.

### 3.8 `rules`
```js
name: String
version: String
effectiveFrom: Date
segment: String
pointsPerTransaction: Number
thresholdToBonus: [{ threshold, rewardType, rewardValue, expiryDays }]
metadata: Object
```

## 4. Contrats API principaux
### 4.1 Auth
- **POST /api/auth/login** : body `{ email, password, deviceId }`. Réponse 200 `{ accessToken, refreshToken, user }`. Enregistre device + audit LOGIN. Erreurs 400/401/429.
- **POST /api/auth/refresh** : `{ refreshToken, deviceId }` → nouveau accessToken (et refresh rotate). Vérifier device valide.
- **POST /api/auth/logout** : header Authorization, body `{ deviceId }`. Révoque refresh/device, audit LOGOUT.

### 4.2 Clients
- **POST /api/clients** : crée client + SID auto `SIDO-<station>-<seq>`. Valide téléphone (regex CI), segment, station. Crée doc points. Réponse 201 client + `pointsTotal:0`. Erreurs 400/403/409/422.
- **GET /api/clients/:sid** : renvoie client + `{ totalPoints, bonsDisponibles, pointsHistory(5) }`. 404 si absent.

### 4.3 Transactions
- **POST /api/transactions** : voir payload utilisateur. Vérifie rôle, station, device, client. Idempotence via `auditId`. En cas de duplicate -> 200 `{"message":"duplicate","existing":{...}}`. Sinon : calcul points (`bonusService`), update `points`, potentiellement générer bon, audit TRANSACTION_CREATE. Réponse 201 `{ transactionId, auditId, pointsAwarded, pointsTotalClient, bonGenerated?, serverTimestamp }`.
- **POST /api/transactions/batch** : `{ transactions: [...] }` max `BATCH_MAX_SIZE`. Réponse `{ accepted: [...], rejected: [{ auditId, reason }], duplicates: [...] }`.

### 4.4 Sync offline
- **POST /api/sync** : `{ deviceId, batchId, transactions[] }`. Idempotence `batchId+deviceId`. Réponse `{ acceptedCount, rejected[], duplicates[], serverTime, generatedBons[] }`. Chaque transaction passe par `transactionsService.ingest`.

### 4.5 Points & Bons
- **GET /api/clients/:sid/points** : solde + bons available + historique court.
- **POST /api/bons/:code/use** : body `{ stationId, deviceId }`. Rôle pompiste/manager. Vérifie status available + non expiré, associe station, audit BON_USE. Réponse `{ code, status:'used', clientSid }`.

### 4.6 Admin / Config
- CRUD stations `/api/admin/stations` (admin).
- CRUD users `/api/admin/users` (admin).
- Gestion règles `/api/admin/rules` (admin) : nouvelle version `effectiveFrom` futur, attachée aux transactions.
- Segments `/api/admin/segments` (admin).

### 4.7 Reporting
- **GET /api/reports/station/:stationId?from&to** : Accept `text/csv` pour export sinon JSON `{ stationId, stats }`. Rôle manager (sa station) ou admin.

## 5. Workflow points & bonus
1. Charger règle active (segment client, `effectiveFrom <= now`, version la plus récente).
2. `pointsAwarded = rule.pointsPerTransaction`.
3. Mettre à jour `points.totalPoints` + ajouter entrée `pointsHistory` (limiter à 100 via `$slice`).
4. Comparer `totalPoints` avec prochains paliers `threshold`. Pour chaque palier franchi : créer bon (`code`, `montantFCFA` ou `%`, `dateExpiry = now + expiryDays`, `ruleVersion`).
5. Retourner `bonGenerated[]` au client API.

## 6. Idempotency & anti-duplication
- Transactions : index unique `auditId`. Duplicate => renvoi transaction existante (200).
- Sync : index unique `batchId+deviceId` dans collection `sync_batches` stockant réponse.
- Clients : `sid` unique, `phone` non unique (configurable `ALLOW_DUPLICATE_PHONE`).
- Bons : `code` unique via service `bonCodeGenerator` (collection `counters`).

## 7. Sécurité & permissions
- Middleware `requireAuth`, `requireRole`, `requireStationAccess`.
- Rate limiting global + spécifique `/api/sync` par `deviceId`.
- Validation JSON Schema (ajv) + sanitization (`express-mongo-sanitize`, `xss-clean`, `helmet`).
- Refresh tokens stockés hashés, rotation obligatoire.
- Audit log pour login/logout, création client, transaction, bon, règles.
- Device management : `users.devices[].revoked`. Login depuis nouveau device -> ajout `revoked:false`.

## 8. Gestion des erreurs
Format : `{ "error": "Human readable", "code": "BAD_PAYLOAD", "details": {...} }`.
Codes : 200, 201, 400, 401, 403, 404, 409, 422, 429, 500.

## 9. Index & optimisation
- `transactions.auditId` unique.
- `transactions.clientSid + serverTimestamp` (compound).
- `clients.sid` unique.
- `bons.dateExpiry` TTL (ou job expiration).
- `audit_logs.createdAt` TTL selon politique (ex 365 j).
- `rules.segment+effectiveFrom` index.

## 10. Sync offline (détail)
1. Device crée transaction locale `pending` avec `auditId` UUID v4.
2. Transactions stockées dans file locale.
3. Device connecté : POST `/api/sync` avec `batchId` unique + liste.
4. Serveur :
   - Vérifie `batchId` (si déjà traité → renvoyer réponse stockée).
   - Pour chaque transaction : validation, insertion (gestion duplicate), calcul points, génération bons, audit.
   - Comptabilise `accepted`, `rejected`, `duplicates` + `serverTimestamp` par item.
   - Réponse contient résumé + bons générés.
5. Device : marque `synced`, garde `rejected` avec raison pour correction.

## 11. Services backend prioritaires
1. `authService`
2. `clientService`
3. `transactionsService`
4. `bonusService`
5. `syncService`
6. `auditService`
7. `reportService`
8. `cronService` (expiration bons, KPI nocturnes)

## 12. Tests recommandés
- Unitaires : `bonusService`, `transactionsService` (idempotence, validation), `clientService.generateSid`, `authService` (refresh rotation, revoke device).
- Intégration : `/api/transactions` (points + bon), `/api/sync` (batch), `/api/bons/:code/use`, `/api/reports/station` (CSV/JSON).
- E2E : duplicate auditId, transaction montant négatif, device révoqué, load test 1000 tx/min.

## 13. Monitoring & observabilité
- Logs JSON (Winston) incluant `auditId`, `deviceId`, `requestId`.
- Sentry pour erreurs.
- Endpoint `/metrics` Prometheus (req/sec, latence sync, rejects/s, bons générés).
- Alertes : spike 500, rejects > seuil, latence > 2s.

## 14. Exports & backups
- Endpoint reporting + script CLI (`scripts/export-station-report.js`).
- Backups Mongo Atlas + script `scripts/validate-backup.js` mensuel.
- Export CSV journaliers vers S3 si `AWS_S3_BUCKET` configuré.

## 15. Scripts & seed
- `scripts/seed.js` : crée station ST-001, admin (`ADMIN_INIT_EMAIL`), segments/règles de base, 5 clients, transactions démo, bons.
- `scripts/generateSid.js` : utilise collection `counters` (`{ _id:'ST-001', seq:123 }`).
- `scripts/expireBons.js` : cron quotidien -> `status=expired` si `dateExpiry < now`.

## 16. Exemple transaction
**Request**
```
POST /api/transactions
Authorization: Bearer <token>
{
  "auditId": "c0a8012e-7f4b-4f9b-9c5d-123e4567abcd",
  "clientSid": "SIDO-ST001-000123",
  "amountFCFA": 15000,
  "litres": 12.5,
  "localTimestamp": "2025-12-02T09:30:00Z",
  "deviceId": "device-xyz"
}
```
**Response 201**
```
{
  "transactionId": "649a12ab34cdef0011223344",
  "auditId": "c0a8012e-7f4b-4f9b-9c5d-123e4567abcd",
  "pointsAwarded": 1,
  "pointsTotalClient": 20,
  "bonGenerated": {
    "code": "BR-20251202-00001",
    "montantFCFA": 1000,
    "dateExpiry": "2026-01-01T00:00:00Z"
  },
  "serverTimestamp": "2025-12-02T09:30:12Z"
}
```
**Duplicate (200)**
```
{
  "message": "duplicate",
  "existing": { "transactionId": "649a12ab34cdef0011223344", "pointsAwarded": 1 }
}
```

## 17. Sécurité additionnelle
- `helmet`, `cors` whitelist, `hpp`, `express-rate-limit`.
- WAF/Firewall si besoin, blocage IP suspectes.
- JWT signé HS256, option `kid` pour rotation.
- Stocker `refreshTokenHash` + `deviceId` + `expiresAt`.
- Rôles forts :
  - `pompiste` : create tx, create client, voir clients, utiliser bons.
  - `manager` : idem + reporting station.
  - `admin` : full CRUD (users, stations, règles, segments).

## 18. Checklist avant dev/deploy
1. Confirmer paliers points/bonus initiaux par segment.
2. Provisionner cluster Mongo Atlas + utilisateur dédié.
3. Créer fichier `.env.example` avec variables ci-dessus.
4. Choisir stack mobile (Expo recommandé) pour aligner sur sync offline.
5. Vérifier quotas Sentry/Log pour prod.
6. Configurer pipeline CI (lint, tests, coverage, docker build).
7. Définir stratégie backups & rotation clés (`JWT_SECRET`).

## 19. Artefacts à générer ensuite
- OpenAPI/Swagger JSON.
- Schemas Mongoose `backend/src/models/*.js`.
- Controllers Express `backend/src/controllers/*.js`.
- Services (`bonusService`, `syncService`, `auditService`).
- Scripts seed + Postman collection.
- Tests (unit/intégration) + config CI.

## 20. Workflow déploiement (checklist)
1. `npm ci` + tests (`npm run test`).
2. Lint (`npm run lint`).
3. Build docker image `sido/backend:version`.
4. Secrets injectés via vault (pas commit `.env`).
5. Déployer (Kubernetes/VM) avec probes `/health` & `/metrics`.
6. Exécuter `scripts/seed.js` en prod (unique) pour admin/station.
7. Configurer monitoring (Sentry DSN, Prometheus scrape).
8. Vérifier indexes Mongo (`db.collection.createIndexes`).
9. Faire smoke test Postman (login, create client, transaction, sync, reporting).
10. Activer backups + alertes.

---
Document prêt pour génération automatique des fichiers backend (controllers/models/services).
