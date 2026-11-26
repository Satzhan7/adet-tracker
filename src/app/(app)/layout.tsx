import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { ProfileBlock, ProfileSkeleton } from "@/components/shell/profile-block";
import { QazaBadge } from "@/components/shell/qaza-badge";

/** Signed-in area. The proxy already redirects signed-out visitors to /login. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell
      badges={{
        "/namaz": (
          <Suspense fallback={null}>
            <QazaBadge />
          </Suspense>
        ),
      }}
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
