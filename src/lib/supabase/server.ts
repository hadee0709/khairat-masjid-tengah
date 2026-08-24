import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gcpfsxqapvhqjwvieeiy.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_q53yXGSiQJ_g9XeX58PWLA_GinMfax5",
    { cookies: { getAll: () => store.getAll(), setAll: (items) => { try { items.forEach(({name,value,options}) => store.set(name,value,options)); } catch {} } } }
  );
}
