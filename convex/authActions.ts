import { v } from "convex/values";
import { action } from "./_generated/server";

const CLIENT_ID = "fabb7510-8cac-4f1d-a388-1620359a9142";
const TENANT_ID = "23f8ecfb-6a90-46c2-96ca-4a362721b82c";
const TOKEN_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

/**
 * Exchange an authorization code for tokens via Microsoft's token endpoint.
 * This runs on Convex's server, avoiding CORS issues.
 */
export const exchangeCodeForTokens = action({
  args: {
    code: v.string(),
    codeVerifier: v.string(),
    redirectUri: v.string(),
  },
  handler: async (_, args) => {
    try {
      const body = new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: "authorization_code",
        code: args.code,
        redirect_uri: args.redirectUri,
        code_verifier: args.codeVerifier,
      });

      console.log("[Convex Auth] Exchanging code for tokens...");
      const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("[Convex Auth] Token exchange failed:", response.status, text);
        throw new Error(`Token exchange failed: ${response.status} ${text}`);
      }

      const tokens = await response.json();
      console.log("[Convex Auth] Token response keys:", Object.keys(tokens));
      const idToken = tokens.id_token as string;

      if (!idToken) {
        throw new Error(`No id_token in response. Keys: ${Object.keys(tokens).join(", ")}`);
      }

      // Decode ID token JWT to extract user info
      const payload = JSON.parse(atob(idToken.split(".")[1]));
      const email: string = payload.preferred_username ?? payload.email ?? payload.unique_name ?? "";
      const name: string = payload.name ?? email;

      if (!email) {
        throw new Error("No email found in token payload");
      }

      return {
        email,
        name,
        expiresAt: payload.exp * 1000,
      };
    } catch (err) {
      console.error("[Convex Auth] exchangeCodeForTokens error:", err);
      throw err;
    }
  },
});
