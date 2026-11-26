import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** OAuth (Google) and magic-link (PKCE) both land here with ?code=… */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  // Supabase redirects with ?error=… when the allowlist trigger rejects the sign-up.
  const authError = searchParams.get("error_description") ?? searchParams.get("error");
  if (authError) {
    const reason = /database error saving new user|email_not_allowed/i.test(authError)
      ? "not_allowed"
      : "auth_failed";
    return NextResponse.redirect(`${origin}/login?error=${reason}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
