import { defineConfig, type Plugin } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const teachApk = fileURLToPath(new URL("./src/lib/teach.apk.ts", import.meta.url));
const aiApk = fileURLToPath(new URL("./src/lib/ai.apk.ts", import.meta.url));
const illustrateApk = fileURLToPath(
  new URL("./src/lib/illustrate.apk.ts", import.meta.url),
);
const fetchApk = fileURLToPath(new URL("./src/lib/fetch-page.apk.ts", import.meta.url));

function apkStubs(): Plugin {
  return {
    name: "apk-stubs",
    enforce: "pre",
    resolveId(source) {
      const id = source.split("?")[0] ?? source;
      if (id.includes(".apk.ts")) return null;
      if (id === "@/lib/ai" || /\/src\/lib\/ai(\.ts)?$/.test(id)) return aiApk;
      if (id === "@/lib/teach" || /\/src\/lib\/teach(\.ts)?$/.test(id)) return teachApk;
      if (id === "@/lib/illustrate" || /\/src\/lib\/illustrate(\.ts)?$/.test(id)) {
        return illustrateApk;
      }
      if (id === "@/lib/fetch-page" || /\/src\/lib\/fetch-page(\.ts)?$/.test(id)) {
        return fetchApk;
      }
      return null;
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [apkStubs(), tailwindcss(), viteReact()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    outDir: "dist-apk",
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL("./index.apk.html", import.meta.url)),
    },
  },
});
