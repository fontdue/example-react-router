import type { Route } from "./+types/fonts.$slug";
import TypeTesters, { loadTypeTestersQuery } from "fontdue-js/TypeTesters";
import CharacterViewer, {
  loadCharacterViewerQuery,
} from "fontdue-js/CharacterViewer";
import BuyButton, { loadBuyButtonQuery } from "fontdue-js/BuyButton";
import { FontduePasswordProtectedError } from "fontdue-js/server";
import NodePasswordForm from "fontdue-js/NodePasswordForm";
import { fetchGraphql } from "../lib/graphql";
import FontDoc from "../queries/Font.graphql?raw";
import type {
  FontQuery,
  FontQueryVariables,
} from "../queries/operations-types";

export function meta({ data }: Route.MetaArgs) {
  if (data?.locked) {
    return [{ title: "Password required — fontdue-js on RR7" }];
  }
  const collection = data?.collection;
  const title =
    collection?.pageMetadata?.title ?? collection?.name ?? "Font detail";
  return [{ title: `${title} — fontdue-js on RR7` }];
}

// Server-preloaded fontdue-js queries hydrate the islands; the GraphQL
// fetch supplies the page chrome (title, description, hero image, buy
// button props). All four run in parallel in one Promise.all. In preview
// this page resolves even for an unpublished collection and its islands
// reveal unpublished styles — preview rides the ambient context, so nothing
// is threaded here (see app/lib/graphql.ts).
export async function loader({ params }: Route.LoaderArgs) {
  let fontData,
    typeTestersPreload,
    characterViewerPreload,
    buyButtonPreload;
  try {
    [fontData, typeTestersPreload, characterViewerPreload, buyButtonPreload] =
      await Promise.all([
        fetchGraphql<FontQuery, FontQueryVariables>("Font", FontDoc, {
          slug: params.slug,
        }),
        loadTypeTestersQuery({ collectionSlug: params.slug }),
        loadCharacterViewerQuery({ collectionSlug: params.slug }),
        loadBuyButtonQuery({ collectionSlug: params.slug }),
      ]);
  } catch (error) {
    // The collection is password-protected and the visitor hasn't unlocked it.
    // Render the password form instead of a 404 — it exists, it's just gated.
    if (error instanceof FontduePasswordProtectedError) {
      return { locked: true as const, slug: params.slug };
    }
    throw error;
  }

  const collection = fontData.viewer.slug?.fontCollection;
  if (!collection) {
    throw new Response("Not found", { status: 404 });
  }

  return {
    locked: false as const,
    collection,
    typeTestersPreload,
    characterViewerPreload,
    buyButtonPreload,
  };
}

export default function FontDetail({ loaderData }: Route.ComponentProps) {
  if (loaderData.locked) {
    return (
      <>
        <h1 className="my-2 mb-4 text-5xl leading-[1.05]">Password required</h1>
        <p className="mb-6 text-lg text-gray-700">
          This collection is password-protected. Enter the password to view it.
        </p>
        <NodePasswordForm collectionSlug={loaderData.slug} />
      </>
    );
  }

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
        className="my-2 mb-4 text-5xl leading-[1.05]"
        style={
          feature
            ? {
                fontFamily: `"${feature.cssFamily} ${feature.name}", system-ui, sans-serif`,
              }
            : undefined
        }
      >
        {collection.name}
        {collection.collectionType === "superfamily" && " Collection"}
      </h1>

      {collection.shortDescription && (
        <p className="mb-6 text-lg text-gray-700">{collection.shortDescription}</p>
      )}

      {heroImage && (
        <figure className="mb-6">
          {heroImage.meta?.mimeType === "video/mp4" ? (
            <video
              src={heroImage.url!}
              playsInline
              muted
              autoPlay
              loop
              className="block h-auto w-full"
            />
          ) : (
            <img
              src={heroImage.url!}
              width={heroImage.meta?.width ?? undefined}
              height={heroImage.meta?.height ?? undefined}
              alt={heroImage.description ?? ""}
              className="block h-auto w-full"
            />
          )}
        </figure>
      )}

      <div className="my-4 mb-8 flex items-center gap-4">
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

      <h2 className="mt-10 text-lg">TypeTesters</h2>
      <div className="mt-4 border border-gray-200 p-4">
        <TypeTesters
          preloadedQuery={typeTestersPreload}
          defaultMode="local"
        />
      </div>

      {collection.description && (
        <section
          className="my-8 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: collection.description }}
        />
      )}

      <h2 className="mt-10 text-lg">Character viewer</h2>
      <div className="mt-4 border border-gray-200 p-4">
        <CharacterViewer preloadedQuery={characterViewerPreload} />
      </div>
    </>
  );
}
