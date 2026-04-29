import type { Route } from "./+types/fonts.$slug";
import TypeTesters, { loadTypeTestersQuery } from "fontdue-js/TypeTesters";
import CharacterViewer, {
  loadCharacterViewerQuery,
} from "fontdue-js/CharacterViewer";
import BuyButton, { loadBuyButtonQuery } from "fontdue-js/BuyButton";
import { fetchGraphql } from "../lib/graphql";
import FontDoc from "../queries/Font.graphql?raw";
import type {
  FontQuery,
  FontQueryVariables,
} from "../queries/operations-types";

export function meta({ data }: Route.MetaArgs) {
  const collection = data?.collection;
  const title =
    collection?.pageMetadata?.title ?? collection?.name ?? "Font detail";
  return [{ title: `${title} — fontdue-js on RR7` }];
}

// Server-preloaded fontdue-js queries hydrate the islands; the GraphQL
// fetch supplies the page chrome (title, description, hero image, buy
// button props). All four run in parallel in one Promise.all.
export async function loader({ params }: Route.LoaderArgs) {
  const [
    fontData,
    typeTestersPreload,
    characterViewerPreload,
    buyButtonPreload,
  ] = await Promise.all([
    fetchGraphql<FontQuery, FontQueryVariables>("Font", FontDoc, {
      slug: params.slug,
    }),
    loadTypeTestersQuery({ collectionSlug: params.slug }),
    loadCharacterViewerQuery({ collectionSlug: params.slug }),
    loadBuyButtonQuery({ collectionSlug: params.slug }),
  ]);

  const collection = fontData.viewer.slug?.fontCollection;
  if (!collection) {
    throw new Response("Not found", { status: 404 });
  }

  return {
    collection,
    typeTestersPreload,
    characterViewerPreload,
    buyButtonPreload,
  };
}

export default function FontDetail({ loaderData }: Route.ComponentProps) {
  const {
    collection,
    typeTestersPreload,
    characterViewerPreload,
    buyButtonPreload,
  } = loaderData;

  const feature = collection.featureStyle;
  const featureSrc = feature?.webfontSources?.find(
    (s) => s?.format === "woff2",
  );
  const featureFontFace =
    feature && featureSrc?.url
      ? `@font-face {
          font-family: "${feature.cssFamily} ${feature.name}";
          src: url(${featureSrc.url}) format("woff2");
          font-weight: 400; font-style: normal;
        }`
      : "";

  const heroImage = collection.images?.find((img) => img && img.url);

  return (
    <>
      {featureFontFace && (
        <style dangerouslySetInnerHTML={{ __html: featureFontFace }} />
      )}
      <h1
        style={{
          fontSize: "3rem",
          lineHeight: 1.05,
          margin: "0.5rem 0 1rem",
          fontFamily: feature
            ? `"${feature.cssFamily} ${feature.name}", system-ui, sans-serif`
            : undefined,
        }}
      >
        {collection.name}
        {collection.collectionType === "superfamily" && " Collection"}
      </h1>

      {collection.shortDescription && (
        <p
          style={{
            color: "#444",
            fontSize: "1.125rem",
            margin: "0 0 1.5rem",
          }}
        >
          {collection.shortDescription}
        </p>
      )}

      {heroImage && (
        <figure style={{ margin: "0 0 1.5rem" }}>
          {heroImage.meta?.mimeType === "video/mp4" ? (
            <video
              src={heroImage.url!}
              playsInline
              muted
              autoPlay
              loop
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          ) : (
            <img
              src={heroImage.url!}
              width={heroImage.meta?.width ?? undefined}
              height={heroImage.meta?.height ?? undefined}
              alt={heroImage.description ?? ""}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          )}
        </figure>
      )}

      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          margin: "1rem 0 2rem",
        }}
      >
        <BuyButton
          preloadedQuery={buyButtonPreload}
          collectionName={collection.name}
        />
        {collection.minisiteLink && (
          <a href={collection.minisiteLink} target="_blank" rel="noopener">
            {collection.name} Minisite
          </a>
        )}
      </div>

      <h2 style={{ fontSize: "1.125rem", marginTop: "2.5rem" }}>TypeTesters</h2>
      <div
        style={{
          marginTop: "1rem",
          border: "1px solid #eee",
          padding: "1rem",
        }}
      >
        <TypeTesters
          preloadedQuery={typeTestersPreload}
          defaultMode="local"
        />
      </div>

      {collection.description && (
        <section
          style={{ margin: "2rem 0", lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: collection.description }}
        />
      )}

      <h2 style={{ fontSize: "1.125rem", marginTop: "2.5rem" }}>
        Character viewer
      </h2>
      <div
        style={{
          marginTop: "1rem",
          border: "1px solid #eee",
          padding: "1rem",
        }}
      >
        <CharacterViewer preloadedQuery={characterViewerPreload} />
      </div>
    </>
  );
}
