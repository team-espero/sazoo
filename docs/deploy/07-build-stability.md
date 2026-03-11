# 07 Build Stability

## Problems Found
1. Duplicate/conflicting toolchain versions in `package.json`
2. Frontend direct secret references
3. Corrupted string literals in UI source causing parse failures
4. Windows path issue when writing build output inside current workspace path

## Fixes Applied
1. Dependency cleanup
- consolidated `vite`, `@vitejs/plugin-react`
- removed react compiler plugin wiring

2. Build config stabilization
- `vite.config.ts` simplified
- added `optimizeDeps.entries=['index.html']`
- set `build.outDir` to platform-aware default:
  - Windows: `C:/temp/sazoo-dist`
  - Others: `dist`

3. Source fixes
- corrected broken string literals in `components.tsx`

4. Asset path cleanup
- moved oversized legacy image asset folder out of public build path
- kept required files under `public/avatars`

## Validation
- `npm ci` => PASS (after releasing locked node process)
- `npm run build` => PASS
- Output generated at `C:/temp/sazoo-dist` on Windows

## Note
- In CI/Linux, set `BUILD_OUT_DIR=dist` (already applied in workflow).
