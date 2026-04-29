import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import FontdueProvider, { loadFontdueProviderQuery } from "fontdue-js/FontdueProvider";
import StoreModal from "fontdue-js/StoreModal";
import CartButton, { loadCartButtonQuery } from "fontdue-js/CartButton";

import type { Route } from "./+types/root";
import "./app.css";
import "fontdue-js/fontdue.css";
import { fetchGraphql } from "./lib/graphql";
import RootLayoutDoc from "./queries/RootLayout.graphql?raw";
import type { RootLayoutQuery } from "./queries/operations-types";

// The route loader is the SSR data layer — equivalent to Astro's
// frontmatter or Next's `async function RootLayout()` server component.
// fontdue-js Relay preloads and the raw RootLayout GraphQL fetch run in
// parallel: one network round-trip's worth of latency for the whole
// layout. The fontdue payloads commit into the client Relay env on
// hydration; the GraphQL data drives the static chrome (logo, nav,
// footer, settings).
export async function loader() {
  const [fontduePreload, cartPreload, layoutData] = await Promise.all([
    loadFontdueProviderQuery(),
    loadCartButtonQuery(),
    fetchGraphql<RootLayoutQuery>("RootLayout", RootLayoutDoc),
  ]);
  return { fontduePreload, cartPreload, layoutData };
}

// CDN-side caching for SSR pages on Netlify. The edge serves cached
// HTML instantly while regenerating in the background, so the page
// feels static (sub-100ms TTFB) without prerendering. Browsers always
// revalidate (`max-age=0`) so users see whatever the edge currently
// holds. Tag every page with `fontdue` so /api/revalidate can purge
// them all at once when Fontdue data changes. Leaf-route headers in
// RR7 override these — api.revalidate.ts sets `no-store` to opt out.
export function headers() {
  return {
    "Netlify-CDN-Cache-Control":
      "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
    "Cache-Control": "public, max-age=0, must-revalidate",
    "Netlify-Cache-Tag": "fontdue",
  };
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  const { fontduePreload, cartPreload, layoutData } = loaderData;
  const { viewer } = layoutData;
  const settings = viewer.settings;
  const pages =
    viewer.pages?.edges?.flatMap((edge) => (edge?.node ? [edge.node] : [])) ??
    [];
  const moreThanOneCollection =
    (viewer.fontCollections?.edges?.length ?? 0) > 1;

  const ui = settings?.uiFontStyle;
  const uiSource = ui?.webfontSources?.find((s) => s?.format === "woff2");
  const uiFontFaceCSS =
    ui && uiSource?.url
      ? `@font-face {
           font-family: "${ui.cssFamily} ${ui.name}";
           src: url(${uiSource.url}) format("woff2");
           font-weight: 400; font-style: normal;
         }
         body { font-family: "${ui.cssFamily} ${ui.name}", -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif; }`
      : "";

  return (
    <FontdueProvider preloadedQuery={fontduePreload}>
      <StoreModal />
      {settings?.faviconMarkup && (
        <span dangerouslySetInnerHTML={{ __html: settings.faviconMarkup }} />
      )}
      {settings?.htmlHead && (
        <span dangerouslySetInnerHTML={{ __html: settings.htmlHead }} />
      )}
      {uiFontFaceCSS && <style dangerouslySetInnerHTML={{ __html: uiFontFaceCSS }} />}
      <SiteHeader
        viewer={viewer}
        pages={pages}
        moreThanOneCollection={moreThanOneCollection}
        cartPreload={cartPreload}
      />
      <main className="mx-auto max-w-[960px] p-8">
        <Outlet />
      </main>
      {settings?.footerText && (
        <footer
          className="mx-auto mt-16 mb-8 max-w-[960px] px-8 text-sm text-gray-500"
          dangerouslySetInnerHTML={{ __html: settings.footerText }}
        />
      )}
    </FontdueProvider>
  );
}

function SiteHeader({
  viewer,
  pages,
  moreThanOneCollection,
  cartPreload,
}: {
  viewer: RootLayoutQuery["viewer"];
  pages: NonNullable<
    NonNullable<
      NonNullable<RootLayoutQuery["viewer"]["pages"]>["edges"]
    >[number]
  >["node"][];
  moreThanOneCollection: boolean;
  cartPreload: Awaited<ReturnType<typeof loadCartButtonQuery>>;
}) {
  const { pathname } = useLocation();
  const isActive = (href: string) => pathname === href;
  const linkClass = (href: string) =>
    `text-gray-800 no-underline hover:underline ${isActive(href) ? "font-semibold" : "font-normal"}`;

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
      <nav className="flex items-center gap-4">
        <Link to="/" className={linkClass("/")}>
          {viewer.logo ? (
            <img
              src={viewer.logo.url}
              alt={viewer.settings?.title ?? "Logo"}
              width={(viewer.logo.meta.width ?? 100) / 2}
              height={(viewer.logo.meta.height ?? 100) / 2}
              className="block"
            />
          ) : (
            (viewer.settings?.title ?? "Home")
          )}
        </Link>
        {moreThanOneCollection && (
          <Link to="/" className={linkClass("/")}>
            Fonts
          </Link>
        )}
        {pages?.map(
          (node) =>
            node && (
              <Link
                key={node.id}
                to={`/${node.slug?.name ?? ""}`}
                className={linkClass(`/${node.slug?.name ?? ""}`)}
              >
                {node.title}
              </Link>
            ),
        )}
        <Link to="/test-fonts" className={linkClass("/test-fonts")}>
          Test fonts
        </Link>
      </nav>
      <CartButton preloadedQuery={cartPreload} suffix=" ({count})" />
    </header>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
