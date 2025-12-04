# CI Workflow Implementation TODO

- [ ] Create .github/workflows/ci.yml with CI Build & Test workflow
  - [ ] Define workflow name: "CI Build & Test"
  - [ ] Set triggers: push to main/master and pull requests
  - [ ] Add steps: checkout, setup Node.js, install pnpm, pnpm install, build admin-web, lint backend, lint admin-web, test backend, test admin-web
