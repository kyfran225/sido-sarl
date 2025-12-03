# TODO: Setup GitHub Repo for SIDO SARL

## Remaining Steps (require PAT with repo admin permissions)

- [ ] Set dev as default branch: `gh repo edit kyfran225/sido-sarl --default-branch dev`

- [ ] Create staging environment: `gh api repos/kyfran225/sido-sarl/environments/staging -X PUT`

- [ ] Set secrets for staging:
  - [ ] `echo "mongodb://staging:27017/sido" | gh secret set MONGO_URI --env staging`
  - [ ] `echo "vercel_token_staging" | gh secret set VERCEL_TOKEN --env staging`

- [ ] Set branch protections:
  - [ ] Staging (1 review): JSON API call with proper structure
  - [ ] Main (2 reviews): JSON API call with proper structure

## Completed Steps

- [x] Initialized git repo
- [x] Added remote origin (HTTPS)
- [x] Added all files
- [x] Initial commit
- [x] Pushed to origin main
- [x] Created and pushed dev branch
- [x] Created and pushed staging branch
- [x] Created and pushed main branch
- [x] Switched to dev
- [x] Created .github directories
- [x] Created PR template
- [x] Created issue templates (bug and feature)
- [x] Created CODEOWNERS
- [x] Created dependabot.yml
- [x] Committed and pushed .github
- [x] Created CI workflow
- [x] Created Deploy workflow
- [x] Created README.md
- [x] Committed and pushed README
- [x] Installed GitHub CLI
- [x] Authenticated with PAT
- [x] Created production environment
- [x] Set JWT_SECRET (repo level)
- [x] Set MONGO_URI for production
- [x] Set VERCEL_TOKEN for production
- [x] Set main branch protection (2 reviews)
