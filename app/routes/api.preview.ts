import { handlePreviewRequest } from "fontdue-js/preview";
import type { Route } from "./+types/api.preview";

// Preview enter/exit. The Fontdue admin toolbar — shown only to logged-in staff
// by <FontdueProvider> — POSTs a short-lived token here to turn preview on, and
// DELETEs to turn it off. handlePreviewRequest sets the preview cookies (an
// httpOnly token + a readable marker that the toolbar checks); the root route's
// middleware (app/root.tsx) wraps each request in runWithPreview, which forwards
// the token to GraphQL and keeps preview pages out of the shared CDN cache so
// the public never sees unpublished fonts.
//
// `action` handles POST and DELETE. The default path is /api/preview — to use
// another, set config.preview.endpoint on <FontdueProvider> and update the
// route below to match.
export const action = ({ request }: Route.ActionArgs) =>
  handlePreviewRequest(request);
