# Batch Transaction Optimization TODO

## Tasks
- [ ] Update `createBatchTransactions` in `transaction.service.js` to use bulkWrite
  - [ ] Validate all transactions first and collect valid ones
  - [ ] Build bulk insert operations for valid transactions
  - [ ] Execute bulkWrite with ordered: false
  - [ ] Process bulkWriteResult to identify successful inserts and handle duplicates/errors
  - [ ] Process points and bonuses for successful inserts (post-bulk)
  - [ ] Return same response format: accepted, rejected, duplicates
- [ ] Test the implementation with existing integration tests
- [ ] Update tests if needed for new behavior

## Notes
- Keep same API response format
- Handle duplicates properly by checking existing transactions
- Process bonus/points after bulk insert since bulkWrite doesn't support transactions easily
- Use ordered: false for partial success tolerance
