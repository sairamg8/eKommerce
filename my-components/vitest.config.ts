import { mergeConfig, defineConfig } from "vitest/config";

import viteCfg from "./vite.config";

export default mergeConfig(
  viteCfg,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./vitest.setup.ts"],
    },
  }),
);
