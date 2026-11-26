"use server";

import { createClient } from "@/lib/supabase/server";
import type { Theme } from "@/components/shell/theme";

/** Saves the theme on the profile so other devices pick it up. */
export async function saveTheme(theme: Theme) {
  if (theme !== "dark" && theme !== "light") return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ theme }).eq("id", user.id);
}
