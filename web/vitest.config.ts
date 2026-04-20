import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Vitest config — unit tests rapidos sin arrancar Next.
 *
 * Tests viven en `web/__tests__/*.test.ts` (co-ubicados logicamente con
 * lo que testean, pero separados para no contaminar el bundle de prod).
 *
 * Coverage gate: 70% lines en `lib/delivery`, `lib/security`, `lib/observability`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["__tests__/**/*.test.ts", "lib/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["lib/delivery/**", "lib/security/**", "lib/observability/**"],
      exclude: [
        "**/*.test.ts",
        "**/__tests__/**",
        "**/types.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
});
