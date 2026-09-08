import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  entry: ["src/server.ts"],
  outDir: "dist",
  sourcemap: true,
  splitting: false,
});
