import { createFontdueFetch, FontdueNotFoundError } from "fontdue-js/server";
import { previewAuthHeaders, readPreviewToken } from "fontdue-js/preview";

// Bind a Fontdue GraphQL fetcher for the current request. When a staff member
// is previewing, their token — set as a cookie by the /api/preview route — is
// forwarded so the response includes unpublished ("hidden") fonts; for the
// public it's a plain fetch. createFontdueFetch (from fontdue-js) handles the
// URL, the POST and error handling, so there's no transport boilerplate here.
//
// Call it at the top of a loader, which receives the request:
//
//   export async function loader({ request }: Route.LoaderArgs) {
//     const { fetchGraphql, preview } = fontdueGraphql(request);
//     const data = await fetchGraphql<IndexQuery>("Index", IndexDoc);
//   }
//
// `preview` is an options object ({ headers }) understood by both
// createFontdueFetch and every fontdue-js preload helper, so the same object
// wires preview into all of them — pass it to preloads too, e.g.
// loadTypeTesterQuery(vars, preview), so they reveal unpublished fonts. For the
// public the headers are empty, so it's always safe to pass. `previewing` lets
// the root loader keep preview pages out of the CDN cache.
export function fontdueGraphql(request: Request) {
  const token = readPreviewToken(request.headers.get("cookie"));
  const preview = { headers: previewAuthHeaders(token) };
  return {
    fetchGraphql: createFontdueFetch(preview),
    preview,
    previewing: token != null,
  };
}

export { FontdueNotFoundError };
