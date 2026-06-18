import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("fonts/:slug", "routes/fonts.$slug.tsx"),
  route("test-fonts", "routes/test-fonts.tsx"),
  route("api/preview", "routes/api.preview.ts"),
  route("api/revalidate", "routes/api.revalidate.ts"),
] satisfies RouteConfig;
