import { query } from "./_generated/server";
import { getOwnerUserId } from "./inquiries";
import { getOwnerEmail } from "./ownerConfig";

/**
 * Owner-only configuration status for the inquiry email pipeline. Lets the
 * owner verify at runtime that email delivery is actually configured.
 *
 * Returns null for anyone who isn't the site owner: no secrets are ever
 * exposed, and — unlike before — the configured inbox address is no longer
 * leaked to the public either. The boolean names match the env vars actually
 * read by src/convex/emails.ts.
 */
export const getEmailStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getOwnerUserId(ctx);
    if (userId === null) {
      return null;
    }
    return {
      // Primary channel: Resend (RESEND_API_KEY).
      resendConfigured: Boolean(process.env.RESEND_API_KEY),
      // Fallback channel: Web3Forms — forwards to the email registered with the key.
      web3formsConfigured: Boolean(process.env.WEB3FORMS_ACCESS_KEY),
      // Verified "from" address used for Resend sends.
      fromConfigured: Boolean(process.env.EMAIL_FROM),
      ownerEmail: getOwnerEmail(),
    };
  },
});
