const SUPABASE_UNREACHABLE_MESSAGE =
  "Cannot reach Supabase Auth. Check NEXT_PUBLIC_SUPABASE_URL in .env.local, make sure the project exists, then restart pnpm dev.";

type SupabaseHealthResponse = {
  ok: boolean;
  message?: string;
};

export async function assertSupabaseReachable() {
  const response = await fetch("/api/health/supabase", {
    cache: "no-store",
  });

  const result = (await response.json().catch(() => null)) as
    | SupabaseHealthResponse
    | null;

  if (!response.ok || !result?.ok) {
    throw new Error(result?.message || SUPABASE_UNREACHABLE_MESSAGE);
  }
}

export function getSupabaseAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (/fetch failed|failed to fetch|authretryablefetcherror/i.test(message)) {
    return SUPABASE_UNREACHABLE_MESSAGE;
  }

  return message || "An error occurred";
}
