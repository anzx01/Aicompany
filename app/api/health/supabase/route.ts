import { NextResponse } from "next/server";

const CONFIG_MESSAGE =
  "Cannot reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL in .env.local, make sure the project exists, then restart pnpm dev.";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      ok: false,
      message:
        "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    });
  }

  let url: URL;

  try {
    url = new URL(supabaseUrl);
  } catch {
    return NextResponse.json({
      ok: false,
      message: "NEXT_PUBLIC_SUPABASE_URL is not a valid URL.",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url.origin, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });

    return NextResponse.json({
      ok: true,
      host: url.hostname,
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      host: url.hostname,
      message: CONFIG_MESSAGE,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    clearTimeout(timeout);
  }
}
