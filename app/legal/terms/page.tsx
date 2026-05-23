import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to home
        </Link>
        <h1 className="mt-8 text-4xl font-bold">Terms of Use</h1>
        <p className="mt-4 text-muted-foreground">Last updated: May 23, 2026</p>

        <div className="mt-10 space-y-8 leading-7 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">Open-Source Software</h2>
            <p className="mt-2">
              This repository is provided under the MIT License. The software is
              provided as-is, without warranties or guarantees.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Hosted Deployments</h2>
            <p className="mt-2">
              If you deploy this application for other users, publish your own
              service terms that describe acceptable use, billing, account
              management, support, and termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Third-Party Services</h2>
            <p className="mt-2">
              Integrations are subject to the terms of the third-party providers
              configured by the deployment operator.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
