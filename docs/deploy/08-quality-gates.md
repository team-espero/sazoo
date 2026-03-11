# 08 Quality Gates

## Scripts
- `npm run lint` -> secret-lint
- `npm run typecheck` -> TypeScript check
- `npm run test` -> Vitest
- `npm run quality` -> lint + typecheck + test + build

## Added Tests
- `server/env.test.ts`
- `server/app.test.ts`

## Executed Results
- `npm run lint` => PASS
- `npm run typecheck` => PASS
- `npm run test` => PASS (5 tests)
- `npm run quality` => PASS

## Failure Reporting
- API errors return standard envelope:
  - `error.code`
  - `error.message`
  - optional `error.details`
