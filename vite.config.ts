import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import fontdueJs from "fontdue-js/vite";
import netlifyReactRouter from "@netlify/vite-plugin-react-router";

export default defineConfig({
  // Run under `run-p dev:rr codegen:watch`, so don't let Vite wipe the
  // terminal on boot/dep-reoptimize — that erases the dev-server URL banner
  // and the codegen watcher's output. Keep both visible.
  clearScreen: false,
  plugins: [tailwindcss(), reactRouter(), netlifyReactRouter(), fontdueJs()],
  resolve: {
    tsconfigPaths: true,
  },
});
