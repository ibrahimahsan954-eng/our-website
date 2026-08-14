import { query } from "./_generated/server";

/**
 * Public configuration status for the inquiry email pipeline. Lets the owner
 * verify at runtime that email delivery is actually configured — no secrets
 * are exposed, just booleans and the configured inbox address.
 */
export const getEmailStatus = query({
  args: {},
  handler: async () => ({
    // Primary channel: VLY integration (Resend-backed), key injected at runtime.
    vlyConfigured: Boolean(process.env.VLY_INTEGRATION_KEY),
    // Fallback channel: Web3Forms — forwards to the email registered with the key.
    web3formsConfigured: Boolean(process.env.WEB3FORMS_ACCESS_KEY),
    fromConfigured: Boolean(process.env.VLY_EMAIL_FROM),
    ownerEmail:
      process.env.OWNER_NOTIFICATION_EMAIL ?? "onepunchman5005@gmail.com",
  }),
});
