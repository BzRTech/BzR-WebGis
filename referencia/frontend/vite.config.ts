import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // We register manually in main.tsx so we can surface update/offline UX.
      injectRegister: false,
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "EIXO WebGIS",
        short_name: "EIXO",
        description:
          "Coleta e gestão de Boletins de Cadastro Imobiliário (BCI) em campo.",
        lang: "pt-BR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#FFD500",
        background_color: "#FAFAF7",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallback: "index.html",
        // SPA fallback must not swallow API calls.
        navigateFallbackDenylist: [/^\/api\//],
        // App shell (js/css/html) is precached automatically.
        // Writes are NOT replayed by the service worker: the app-level
        // outbox (src/lib/offline) owns mutation replay so it can attach
        // auth, rebuild multipart photo uploads and drive the sync UI.
        runtimeCaching: [
          {
            // API reads — usable offline from last successful response.
            urlPattern: /\/api\/v1\/.*$/i,
            method: "GET",
            handler: "NetworkFirst",
            options: {
              cacheName: "eixo-api",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Map tiles for the working area ("tiles do bairro atual").
            urlPattern: /^https:\/\/[a-z]\.tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "eixo-map-tiles",
              expiration: {
                maxEntries: 2000,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/server\.arcgisonline\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "eixo-map-tiles",
              expiration: {
                maxEntries: 2000,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "eixo-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        // Keep the SW off under `vite dev` (HMR + polling). Test offline with
        // `npm run build && npm run preview`.
        enabled: false,
        type: "module",
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    // usePolling é necessário no Docker/Windows, mas poll em pastas
    // gigantes (ex.: pirâmide de ortofoto) trava o dev server.
    watch: {
      usePolling: true,
      ignored: ["**/orto/**", "**/public/orto/**"],
    },
  },
});
