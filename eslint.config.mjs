import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  {
    ignores: [
      "**/.next/**",
      "**/.agents/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/.pgdata/**",
      "**/.minio-data/**",
      "**/*.tsbuildinfo",
      "**/*.generated.*",
      "**/schema.ts",
    ],
  },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
]);
