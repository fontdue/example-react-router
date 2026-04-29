import type { Route } from "./+types/home";
import TypeTester, { loadTypeTesterQuery } from "fontdue-js/TypeTester";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "fontdue-js on React Router 7" },
    {
      name: "description",
      content: "Server-preloaded TypeTester hydrated with no re-fetch.",
    },
  ];
}

export async function loader() {
  const [preloadedA, preloadedB] = await Promise.all([
    loadTypeTesterQuery({ familyName: "IBM Plex Sans", styleName: "Regular" }),
    loadTypeTesterQuery({ familyName: "Rubik", styleName: "Regular" }),
  ]);
  return { preloadedA, preloadedB };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        margin: "0 auto",
        maxWidth: 960,
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        fontdue-js on React Router 7
      </h1>
      <p style={{ color: "#666", fontSize: "0.875rem" }}>
        Each TypeTester below is server-preloaded in the route loader and
        hydrated with no re-fetch.
      </p>
      <h2 style={{ fontSize: "1.125rem", marginTop: "2.5rem" }}>
        TypeTester (preloaded)
      </h2>
      <div style={{ marginTop: "1.5rem", border: "1px solid #eee", padding: "1rem" }}>
        <TypeTester
          preloadedQuery={loaderData.preloadedA}
          content="The quick brown fox jumps over the lazy dog"
          fontSize={64}
        />
      </div>
      <div style={{ marginTop: "1.5rem", border: "1px solid #eee", padding: "1rem" }}>
        <TypeTester
          preloadedQuery={loaderData.preloadedB}
          content="Sphinx of black quartz, judge my vow"
          fontSize={48}
        />
      </div>
    </main>
  );
}
