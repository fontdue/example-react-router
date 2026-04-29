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
      <h1 className="mb-4 text-2xl">Test fonts</h1>
      <p className="text-sm text-gray-500">
        Two preloaded forms — both hydrate without re-fetching their settings.
      </p>

      <h2 className="mt-10 text-lg">Test fonts form</h2>
      <div className="mt-4 border border-gray-200 p-4">
        <TestFontsForm preloadedQuery={loaderData.testFontsPreload} />
      </div>

      <h2 className="mt-10 text-lg">Newsletter signup</h2>
      <div className="mt-4 border border-gray-200 p-4">
        <NewsletterSignup
          preloadedQuery={loaderData.newsletterPreload}
          title="Join the newsletter"
          intro="Get notified about new releases."
        />
      </div>
    </>
  );
}
