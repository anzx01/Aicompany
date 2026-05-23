import Link from "next/link";

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to home
        </Link>
        <h1 className="mt-8 text-4xl font-bold">Security</h1>
        <p className="mt-4 text-muted-foreground">Last updated: May 23, 2026</p>

        <div className="mt-10 space-y-8 leading-7 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">Secrets</h2>
            <p className="mt-2">
              Store API keys, database URLs, OAuth secrets, cron secrets, and
              service-role keys in environment variables or a managed secret
              store. Do not commit local environment files.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Deployment Checklist</h2>
            <p className="mt-2">
              Enable row-level security where applicable, restrict service-role
              keys to server-side code, rotate exposed credentials, configure
              webhook verification, and review logs for sensitive data before
              public launch.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Reporting</h2>
            <p className="mt-2">
              Add a project-specific security contact before operating a public
              hosted service.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
