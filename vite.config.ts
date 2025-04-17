import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: path.resolve(__dirname, "./src/react-app/routes"),
      generatedRouteTree: path.resolve(
        __dirname,
        "./src/react-app/routeTree.gen.ts",
      ),
    }),
    react(),
    cloudflare(),
    tailwindcss(),
  ],
});
