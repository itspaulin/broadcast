import { defineConfig } from 'tsup'

// Only `dependencies` stay external. `@broadcast/shared` and zod are bundled
// because the deploy uploads just this folder, outside the npm workspace.
export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: 'esm',
  target: 'node22',
  platform: 'node',
  sourcemap: true,
  clean: true,
})
