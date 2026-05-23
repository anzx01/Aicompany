import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to home
        </Link>
        <h1 className="mt-8 text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">Last updated: May 23, 2026</p>

        <div className="mt-10 space-y-8 leading-7 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">Overview</h2>
            <p className="mt-2">
              AI Company Builder is an open-source application template. A deployed
              operator is responsible for configuring hosting, authentication,
              databases, logging, and third-party integrations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Data Processed</h2>
            <p className="mt-2">
              Depending on deployment settings, the app may process account data,
              company configuration, task content, platform connection metadata,
              AI prompts and outputs, usage metrics, and operational logs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Third Parties</h2>
            <p className="mt-2">
              Deployments may use providers such as Supabase, OpenAI, Anthropic,
              GitHub, Twitter/X, Product Hunt, Sentry, Vercel, or other services
              configured by the operator.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Operator Duties</h2>
            <p className="mt-2">
              Before offering a hosted service to users, replace this template with
              a policy that accurately describes your data collection, retention,
              subprocessors, user rights, and contact details.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
