import { defineConfig } from 'vitest/config'

// Test files share one emulator and clear it between tests, so they cannot run in parallel.
export default defineConfig({
  test: {
    fileParallelism: false,
  },
})
