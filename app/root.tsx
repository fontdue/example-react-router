import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { loadFontdueProviderQuery } from "fontdue-js";
import FontdueProvider from "fontdue-js/FontdueProvider";
import StoreModal from "fontdue-js/StoreModal";
import CartButton, { loadCartButtonQuery } from "fontdue-js/CartButton";

import type { Route } from "./+types/root";
import "./app.css";
import "fontdue-js/fontdue.css";

// Layout-level preloads: aux UI (theme, test mode, tracking config) + cart
// count. Both run in parallel server-side; the FontdueProvider commits the
// aux payload into the client Relay env, and CartButton receives its own
// preloadedQuery so the header reflects current cart state on first paint.
export async function loader() {
  const [fontduePreload, cartPreload] = await Promise.all([
    loadFontdueProviderQuery(),
    loadCartButtonQuery(),
  ]);
  return { fontduePreload, cartPreload };
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
  return (
    <FontdueProvider preloadedQuery={loaderData.fontduePreload}>
      <StoreModal />
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
        <nav style={{ display: "flex", gap: "1rem" }}>
          <Link to="/" style={{ color: "#333", textDecoration: "none" }}>
            Home
          </Link>
          <Link
            to="/fonts/ibm-plex"
            style={{ color: "#333", textDecoration: "none" }}
          >
            IBM Plex
          </Link>
          <Link
            to="/fonts/rubik"
            style={{ color: "#333", textDecoration: "none" }}
          >
            Rubik
          </Link>
          <Link
            to="/test-fonts"
            style={{ color: "#333", textDecoration: "none" }}
          >
            Test fonts
          </Link>
        </nav>
        <CartButton preloadedQuery={loaderData.cartPreload} suffix=" ({count})" />
      </header>
      <Outlet />
    </FontdueProvider>
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
