import { PublicClientApplication, type Configuration } from "@azure/msal-browser";

export const CLIENT_ID = "fabb7510-8cac-4f1d-a388-1620359a9142";
export const TENANT_ID = "23f8ecfb-6a90-46c2-96ca-4a362721b82c";
export const AUTHORITY = `https://login.microsoftonline.com/${TENANT_ID}`;

const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: AUTHORITY,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const LOGIN_SCOPES = ["openid", "profile", "email"];
