import type { Route } from "./+types/test-fonts";
import TestFontsForm, { loadTestFontsFormQuery } from "fontdue-js/TestFontsForm";
import NewsletterSignup, {
  loadNewsletterSignupQuery,
} from "fontdue-js/NewsletterSignup";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Test fonts — fontdue-js on RR7" }];
}

export async function loader() {
  const [testFontsPreload, newsletterPreload] = await Promise.all([
    loadTestFontsFormQuery(),
    loadNewsletterSignupQuery(),
  ]);
  return { testFontsPreload, newsletterPreload };
}

export default function TestFonts({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Test fonts</h1>
      <p style={{ color: "#666", fontSize: "0.875rem" }}>
        Two preloaded forms — both hydrate without re-fetching their settings.
      </p>

      <h2 style={{ fontSize: "1.125rem", marginTop: "2.5rem" }}>
        Test fonts form
      </h2>
      <div style={{ marginTop: "1rem", border: "1px solid #eee", padding: "1rem" }}>
        <TestFontsForm preloadedQuery={loaderData.testFontsPreload} />
      </div>

      <h2 style={{ fontSize: "1.125rem", marginTop: "2.5rem" }}>
        Newsletter signup
      </h2>
      <div style={{ marginTop: "1rem", border: "1px solid #eee", padding: "1rem" }}>
        <NewsletterSignup
          preloadedQuery={loaderData.newsletterPreload}
          title="Join the newsletter"
          intro="Get notified about new releases."
        />
      </div>
    </>
  );
}
