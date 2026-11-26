import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[1760px] flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-extrabold text-[var(--accent-head)]">Әдет трекер</h1>
      <Suspense fallback={<p className="text-sm text-[var(--ink-dim)]">Жүктелуде…</p>}>
        <Account />
      </Suspense>
    </main>
  );
}

/** Reads the session at request time, so it streams in behind Suspense. */
async function Account() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  return (
    <>
      <p>
        Сәлем, <strong>{profile?.name ?? "—"}</strong>
      </p>
      <p className="text-sm text-[var(--ink-dim)]">{user.email}</p>
      <form action="/auth/signout" method="post">
        <button type="submit" className="btn btn-secondary">
          Шығу
        </button>
      </form>
    </>
  );
}
