import type { Config } from "@react-router/dev/config";

export default {
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  future: {
    // Route middleware (stable since React Router 7.9). The root route's
    // middleware wraps every loader in runWithPreview so the staff preview
    // token reaches fontdue-js fetches/preloads automatically. Opt-in now; the
    // default in the next major.
    v8_middleware: true,
  },
} satisfies Config;
