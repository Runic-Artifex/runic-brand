import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const studioRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: studioRoot,
  publicDir: fileURLToPath(new URL("../assets/generated", import.meta.url)),
  build: {
    outDir: fileURLToPath(new URL("../studio-dist", import.meta.url)),
    emptyOutDir: true,
  },
});
