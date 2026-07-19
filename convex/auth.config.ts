import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.CONVEX_OIDC_AUTHORITY!,
      applicationID: process.env.CONVEX_OIDC_CLIENT_ID!,
    },
  ],
} satisfies AuthConfig;
