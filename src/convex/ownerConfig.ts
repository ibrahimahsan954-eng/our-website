/**
 * Single source of truth for the site owner's identity.
 *
 * The owner is the only account that can read the inquiry inbox and manage
 * video assets. Everything (access control in inquiries.ts, the notification
 * recipient in emails.ts, the dashboard status in emailStatus.ts, and the
 * public contact link) resolves the address through here so it can never drift
 * out of sync again.
 *
 * To change the owner:
 *   - Preferred: set OWNER_NOTIFICATION_EMAIL in the project's Keys/API keys
 *     tab (Convex environment variables). No redeploy of code required.
 *   - Or edit DEFAULT_OWNER_EMAIL below (used when the env var is unset).
 */
export const DEFAULT_OWNER_EMAIL = "ibrahimahsan954@gmail.com";

/** Resolve the owner email at call time so env changes take effect immediately. */
export function getOwnerEmail(): string {
  const configured = process.env.OWNER_NOTIFICATION_EMAIL?.trim().toLowerCase();
  return configured && configured.length > 0
    ? configured
    : DEFAULT_OWNER_EMAIL;
}
