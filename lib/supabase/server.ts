import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Host-only cookies; employment workspace hints never enter candidate queries.
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(values) {
          try {
            values.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Proxy refreshes cookies for server components. */
          }
        },
      },
    },
  );
}
