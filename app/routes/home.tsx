import { Link } from "react-router";
import type { Route } from "./+types/home";
import TypeTester, { loadTypeTesterQuery } from "fontdue-js/TypeTester";
import { fetchGraphql } from "../lib/graphql";
import IndexDoc from "../queries/Index.graphql?raw";
import type { IndexQuery } from "../queries/operations-types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "fontdue-js on React Router 7" },
    {
      name: "description",
      content: "Server-preloaded TypeTester hydrated with no re-fetch.",
    },
  ];
}

// The loader is the SSR data layer: a regular GraphQL fetch and the
// fontdue-js Relay preloads run together in one Promise.all. The Relay
// payloads hydrate the islands without an extra round-trip; the GraphQL
// data drives the static markup of the page.
export async function loader() {
  const indexData = await fetchGraphql<IndexQuery>("Index", IndexDoc);

  const collections =
    indexData.viewer.fontCollections?.edges?.flatMap((edge) =>
      edge?.node && edge.node.slug ? [edge.node] : [],
    ) ?? [];

  // Demo: hydrate a TypeTester for the first two collections returned
  // by the API instead of hard-coding family/style names.
  const testerCollections = collections
    .filter((c) => c.featureStyle?.cssFamily && c.featureStyle.name)
    .slice(0, 2);

  const testerPreloads = await Promise.all(
    testerCollections.map((c) =>
      loadTypeTesterQuery({
        familyName: c.featureStyle!.cssFamily!,
        styleName: c.featureStyle!.name!,
      }),
    ),
  );

  return { collections, testerCollections, testerPreloads };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { collections, testerCollections, testerPreloads } = loaderData;

  // Inject @font-face for each collection's feature style so the
  // homepage can render collection names in their own font without an
  // extra island.
  const featureFontFaces = collections
    .map((c) => {
      const style = c.featureStyle;
      const src = style?.webfontSources?.find((s) => s?.format === "woff2");
      if (!style || !src?.url) return "";
      return `@font-face {
        font-family: "${style.cssFamily} ${style.name}";
        src: url(${src.url}) format("woff2");
        font-weight: 400; font-style: normal;
      }`;
    })
    .filter(Boolean)
    .join("\n");

  return (
    <>
      {featureFontFaces && (
        <style dangerouslySetInnerHTML={{ __html: featureFontFaces }} />
      )}
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Fonts</h1>
      <p style={{ color: "#666", fontSize: "0.875rem" }}>
        Server-rendered from <code>Index.graphql</code>. Each collection name
        is set in its own feature style; the type testers below are
        server-preloaded Relay islands.
      </p>

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          margin: "1.5rem 0",
        }}
      >
        {collections.map((node) => (
          <h2
            key={node.id}
            style={{
              fontSize: "2.5rem",
              margin: 0,
              lineHeight: 1.1,
              ["--optical-adjustment" as never]: node.opticalAdjustment ?? 0,
            }}
          >
            <Link
              to={`/fonts/${node.slug!.name}`}
              style={{
                color: "inherit",
                textDecoration: "none",
                fontFamily: `"${node.featureStyle?.cssFamily} ${node.featureStyle?.name}", system-ui, sans-serif`,
              }}
            >
              {node.name}
            </Link>
            {node.isNew && (
              <span
                style={{
                  color: "#c00",
                  fontSize: "0.75rem",
                  verticalAlign: "super",
                }}
              >
                &nbsp;New
              </span>
            )}
          </h2>
        ))}
      </section>

      {testerCollections.length > 0 && (
        <>
          <h2 style={{ fontSize: "1.125rem", marginTop: "2.5rem" }}>
            Try them out
          </h2>
          {testerCollections.map((c, i) => (
            <div
              key={c.id}
              style={{
                marginTop: "1.5rem",
                border: "1px solid #eee",
                padding: "1rem",
              }}
            >
              <p
                style={{
                  margin: "0 0 0.5rem",
                  color: "#666",
                  fontSize: "0.875rem",
                }}
              >
                {c.name} — {c.featureStyle?.name}
              </p>
              <TypeTester
                preloadedQuery={testerPreloads[i]}
                content="The quick brown fox jumps over the lazy dog"
                fontSize={48}
              />
            </div>
          ))}
        </>
      )}
    </>
  );
}
