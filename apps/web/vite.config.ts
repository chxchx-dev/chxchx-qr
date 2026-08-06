import { webConfig } from "@acore/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

/** Robots según ambiente: el servidor de desarrollo no indexa; el build sí. */
function robotsMeta(): Plugin {
  return {
    name: "acore-robots-meta",
    transformIndexHtml(_html, ctx) {
      const content = ctx.server !== undefined ? "noindex,nofollow" : "index,follow";
      return [
        {
          tag: "meta",
          attrs: { name: "robots", content },
          injectTo: "head-prepend",
        },
      ];
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  webConfig(env);

  return {
    plugins: [react(), tailwindcss(), robotsMeta()],
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      // En desarrollo la API vive en :4000; el build estático usa VITE_API_BASE_URL.
      proxy: {
        "/api": {
          target: "http://127.0.0.1:4000",
          changeOrigin: true,
        },
      },
    },
  };
});
