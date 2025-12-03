# Fix Mongoose Duplicate Schema Index Warnings

## Completed Tasks
- [x] Identified duplicate indexes in Mongoose models
- [x] Removed `unique: true` and `index: true` from schema field definitions in transaction.model.js (auditId, clientSid)
- [x] Removed `unique: true` and `index: true` from schema field definitions in client.model.js (sid, phone)
- [x] Removed `unique: true` from schema field definition in points.model.js (clientSid)
- [x] Removed `unique: true` and `index: true` from schema field definitions in bon.model.js (code, clientSid)
- [x] Kept the `schema.index()` calls intact to maintain the indexes
- [x] Updated TODO.md with progress

## Verification
- [ ] Run the application and check if the warnings are resolved
- [ ] Ensure database operations still work correctly

# Fix ESLint Errors

## Completed Tasks
- [x] Fixed unused imports 'User' and 'Station' in dailyAggregate.job.js
- [x] Removed unused parameter 'amountFCFA' from calculatePointsAwarded function in bonus.service.js
- [x] Removed unused parameter 'amountFCFA' from processBonusForTransaction function in bonus.service.js
- [x] Updated JSDoc comments accordingly
- [x] Verified that npm run lint passes without errors
- [x] Updated TODO.md with ESLint fixes
