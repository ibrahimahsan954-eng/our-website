import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

export function RequireAuth({
  children,
  requireOwner = false,
}: {
  children: ReactNode;
  /**
   * When true, the route is restricted to the site owner — not just any signed-in
   * user. Convex Auth treats one-click "Continue as Guest" (anonymous) sessions as
   * authenticated, so without this a guest could reach the owner dashboard shell.
   * The owner's data is already protected server-side (queries return null and
   * mutations throw for non-owners), but this keeps non-owners out of the UI too.
   */
  requireOwner?: boolean;
}) {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Only subscribe to the owner check when this route demands it and the user is
  // signed in — the "skip" token keeps the query off everywhere else. It returns
  // a plain boolean (no inquiry data), so exposing it to the client is safe.
  const isOwner = useQuery(
    api.inquiries.isOwner,
    requireOwner && isAuthenticated ? {} : "skip",
  );
  const ownerCheckPending =
    requireOwner && isAuthenticated && isOwner === undefined;

  if (isLoading || ownerCheckPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  // Signed in, but not the owner (a guest or a different account) — send them
  // back to the public site rather than the owner-only area.
  if (requireOwner && !isOwner) {
    return <Navigate to="/" replace />;
  }

  return children;
}
