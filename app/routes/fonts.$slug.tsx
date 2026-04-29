import type { Route } from "./+types/fonts.$slug";
import TypeTesters, { loadTypeTestersQuery } from "fontdue-js/TypeTesters";
import CharacterViewer, {
  loadCharacterViewerQuery,
} from "fontdue-js/CharacterViewer";
import BuyButton, { loadBuyButtonQuery } from "fontdue-js/BuyButton";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `${params.slug} — fontdue-js on RR7` }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const [typeTestersPreload, characterViewerPreload, buyButtonPreload] =
    await Promise.all([
      loadTypeTestersQuery({ collectionSlug: params.slug }),
      loadCharacterViewerQuery({ collectionSlug: params.slug }),
      loadBuyButtonQuery({ collectionSlug: params.slug }),
    ]);
  return { typeTestersPreload, characterViewerPreload, buyButtonPreload };
}

export default function FontDetail({
  params,
  loaderData,
}: Route.ComponentProps) {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        margin: "0 auto",
        maxWidth: 960,
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>{params.slug}</h1>
      <p style={{ color: "#666", fontSize: "0.875rem" }}>
        Font detail with server-preloaded TypeTesters, CharacterViewer, and a
        BuyButton.
      </p>

      <div style={{ marginTop: "1rem" }}>
        <BuyButton
          preloadedQuery={loaderData.buyButtonPreload}
          collectionName={params.slug}
        />
      </div>

      <h2 style={{ fontSize: "1.125rem", marginTop: "2.5rem" }}>TypeTesters</h2>
      <div style={{ marginTop: "1rem", border: "1px solid #eee", padding: "1rem" }}>
        <TypeTesters
          preloadedQuery={loaderData.typeTestersPreload}
          defaultMode="local"
        />
      </div>

      <h2 style={{ fontSize: "1.125rem", marginTop: "2.5rem" }}>
        Character viewer
      </h2>
      <div style={{ marginTop: "1rem", border: "1px solid #eee", padding: "1rem" }}>
        <CharacterViewer preloadedQuery={loaderData.characterViewerPreload} />
      </div>
    </main>
  );
}
