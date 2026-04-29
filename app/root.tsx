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
import { loadFontdueProviderQuery } from "fontdue-js";
import FontdueProvider from "fontdue-js/FontdueProvider";
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
      <main
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: "0 auto",
          maxWidth: 960,
          padding: "2rem",
        }}
      >
        <Outlet />
      </main>
      {settings?.footerText && (
        <footer
          style={{
            maxWidth: 960,
            margin: "4rem auto 2rem",
            padding: "0 2rem",
            color: "#666",
            fontSize: "0.875rem",
          }}
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
  const linkStyle = (href: string) => ({
    color: "#333",
    textDecoration: "none",
    fontWeight: isActive(href) ? 600 : 400,
  });

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        background: "white",
        borderBottom: "1px solid #eee",
        padding: "1rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 10,
      }}
    >
      <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Link to="/" style={linkStyle("/")}>
          {viewer.logo ? (
            <img
              src={viewer.logo.url}
              alt={viewer.settings?.title ?? "Logo"}
              width={(viewer.logo.meta.width ?? 100) / 2}
              height={(viewer.logo.meta.height ?? 100) / 2}
              style={{ display: "block" }}
            />
          ) : (
            (viewer.settings?.title ?? "Home")
          )}
        </Link>
        {moreThanOneCollection && (
          <Link to="/" style={linkStyle("/")}>
            Fonts
          </Link>
        )}
        {pages?.map(
          (node) =>
            node && (
              <Link
                key={node.id}
                to={`/${node.slug?.name ?? ""}`}
                style={linkStyle(`/${node.slug?.name ?? ""}`)}
              >
                {node.title}
              </Link>
            ),
        )}
        <Link to="/test-fonts" style={linkStyle("/test-fonts")}>
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
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
