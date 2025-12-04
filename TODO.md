# TODO: Fix npm config error and Next.js warnings

## Completed Tasks
- [x] Remove `package-manager=pnpm` from `.npmrc` to fix npm config warnings and workspace errors
- [x] Remove deprecated `experimental.appDir: true` from `admin-web/next.config.js` (stable in Next.js 14)

## Notes
- Use `pnpm` for all package management commands in this monorepo
- Example commands: `pnpm install`, `pnpm dev`, `pnpm --filter admin-web dev`
