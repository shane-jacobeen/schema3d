import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import posthog from "@posthog/rollup-plugin";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID ?? "294072";
const POSTHOG_HOST =
  process.env.POSTHOG_HOST ??
  process.env.VITE_PUBLIC_POSTHOG_HOST ??
  "https://us.i.posthog.com";

export default defineConfig(({ command, mode }) => {
  const personalApiKey = process.env.POSTHOG_API_KEY;
  // Personal API key (error tracking write), not the project token. Without it
  // the production build stays map-free so Vercel never serves .map files.
  const uploadSourceMaps =
    command === "build" && mode === "production" && Boolean(personalApiKey);

  return {
    plugins: [
      react(),
      ...(uploadSourceMaps && personalApiKey
        ? [
            posthog({
              personalApiKey,
              projectId: POSTHOG_PROJECT_ID,
              host: POSTHOG_HOST,
              sourcemaps: {
                enabled: true,
                releaseName: "schema3d",
                releaseVersion:
                  process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA,
                deleteAfterUpload: true,
              },
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      // Vite 7 CSS/import plugins read this flag directly. Hidden maps are
      // uploaded then deleted so they never ship with the public assets.
      sourcemap: uploadSourceMaps ? "hidden" : false,
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks - split large libraries
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "three-vendor": [
              "three",
              "@react-three/fiber",
              "@react-three/drei",
            ],
            "ui-vendor": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-collapsible",
              "@radix-ui/react-toggle-group",
              "@radix-ui/react-toggle",
              "@radix-ui/react-tooltip",
              "@radix-ui/react-label",
              "@radix-ui/react-separator",
              "@radix-ui/react-slot",
            ],
            // Utility libraries
            utils: ["clsx", "tailwind-merge"],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    // Add support for large models and audio files
    assetsInclude: [
      "**/*.gltf",
      "**/*.glb",
      "**/*.mp3",
      "**/*.ogg",
      "**/*.wav",
    ],
  };
});
