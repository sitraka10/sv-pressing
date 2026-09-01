// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, "client"),
  resolve: {
    alias: {
      "@": resolve(__dirname, "client", "src"),
      "@shared": resolve(__dirname, "shared"),
      "@assets": resolve(__dirname, "attached_assets"),
    },
  },
  build: {
    outDir: resolve(__dirname, "client", "dist"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
    fs: {
      strict: true,
      deny: ["**/.*"],
      allow: [
        resolve(__dirname, "client"),
        resolve(__dirname, "shared"),
        resolve(__dirname, "attached_assets"),
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => console.error('❌ [Vite Proxy] Erreur:', err.message));
          proxy.on('proxyReq', (proxyReq, req) => console.log('➡️ [Vite Proxy]', req.method, req.url));
          proxy.on('proxyRes', (proxyRes, req) => console.log('⬅️ [Vite Proxy]', proxyRes.statusCode, req.url));
        }
      },
    }
  },
});