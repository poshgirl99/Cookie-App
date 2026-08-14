import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const makeBrowserClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        storageKey: "zale-auth-v2",
      },
    },
  );

type BrowserClient = ReturnType<typeof makeBrowserClient>;
let browserClient: BrowserClient | null = null;

export function createClient(): BrowserClient {
  if (!browserClient) browserClient = makeBrowserClient();
  return browserClient;
}
