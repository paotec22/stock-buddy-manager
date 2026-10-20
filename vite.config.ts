import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-slot",
      "cmdk",
      "framer-motion",
    ],
  },
  build: {
    target: "es2020",
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Heavy document/pdf and spreadsheet generation tools split out
            if (
              id.includes("jspdf") ||
              id.includes("html2canvas") ||
              id.includes("xlsx") ||
              id.includes("papaparse")
            ) {
              return "vendor-export";
            }
            // PDF parser engine
            if (id.includes("pdfjs-dist")) {
              return "vendor-pdf";
            }
            // Charting engine
            if (id.includes("recharts") || id.includes("d3-")) {
              return "vendor-charts";
            }
            // Motion engine
            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }
            // UI primitives and icons
            if (
              id.includes("@radix-ui") ||
              id.includes("cmdk") ||
              id.includes("lucide-react")
            ) {
              return "vendor-ui";
            }
            // Supabase backend client
            if (id.includes("@supabase")) {
              return "vendor-supabase";
            }
            // Core react framework
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom") ||
              id.includes("@tanstack")
            ) {
              return "vendor-core";
            }
          }
        },
      },
    },
  },
});
