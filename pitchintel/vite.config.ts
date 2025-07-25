import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
          dest: "",
          rename: "pdf.worker.min.js",
        },
      ],
    }),
  ],
  define: {
    "process.env": {
      VITE_OPENAI_API_KEY: JSON.stringify(process.env.VITE_OPENAI_API_KEY),
    },
  },
  optimizeDeps: {
    include: ["pdfjs-dist"],
  },
  worker: {
    format: "es",
  },
});
