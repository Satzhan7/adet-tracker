import { createClient } from "@/lib/supabase/server";
import { ThemeSync } from "./theme-sync";
import type { Theme } from "./theme";

/** Avatar initial, name and sign-out. Reads the session at request time, so it renders behind Suspense. */
export async function ProfileBlock() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("name, theme").eq("id", user.id).single();
  const name = profile?.name?.trim() || user.email?.split("@")[0] || "—";

  return (
    <>
      {profile?.theme && <ThemeSync theme={profile.theme as Theme} />}
      <span className="avatar" aria-hidden="true">
        {name.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{name}</span>
        <span className="block truncate text-[13px] text-[var(--t-text)]">{user.email}</span>
      </span>
      <form action="/auth/signout" method="post">
        <button type="submit" className="icon-btn" aria-label="Шығу" title="Шығу">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
            <path d="M10 16l-4-4 4-4M6 12h10" />
          </svg>
        </button>
      </form>
    </>
  );
}

export function ProfileSkeleton() {
  return (
    <>
      <span className="avatar" aria-hidden="true" />
      <span className="h-4 w-28 rounded bg-[var(--t-div)]" />
    </>
  );
}
