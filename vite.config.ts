import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import fontdueJs from "fontdue-js/vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), fontdueJs()],
  resolve: {
    tsconfigPaths: true,
  },
});
