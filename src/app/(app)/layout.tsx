import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { ProfileBlock, ProfileSkeleton } from "@/components/shell/profile-block";

/** Signed-in area. The proxy already redirects signed-out visitors to /login. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell
      profile={
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileBlock />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
