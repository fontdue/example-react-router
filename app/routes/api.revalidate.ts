import type { Route } from "./+types/api.revalidate";
import { purgeCache } from "@netlify/functions";

// POST /api/revalidate?token=… — invalidate cached HTML so the next
// request regenerates against fresh Fontdue data. Authenticated with a
// shared secret in REVALIDATE_TOKEN. Wire the URL into the Fontdue
// Website settings → Deploy hook URL field.
//
// The Fontdue API does not currently include a collection id/slug in
// its change notifications, so this purges every page tagged `fontdue`
// (set in the root `headers` export) in one call. If per-collection
// tags become available later, switch the tag to `fontdue:${slug}` in
// `fonts.$slug.tsx` headers and pass the matching tag here.
export async function action({ request }: Route.ActionArgs) {
  const expected = process.env.REVALIDATE_TOKEN;
  if (!expected) {
    return new Response("REVALIDATE_TOKEN not configured", { status: 500 });
  }

  const provided = new URL(request.url).searchParams.get("token");
  if (provided !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  await purgeCache({ tags: ["fontdue"] });

  return new Response(JSON.stringify({ purged: ["fontdue"] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export function headers() {
  return { "Cache-Control": "no-store" };
}
