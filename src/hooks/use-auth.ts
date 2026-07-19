import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";

export function useAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  const signIn = () => {
    const authority = import.meta.env.VITE_OIDC_AUTHORITY;
    const clientId = import.meta.env.VITE_OIDC_CLIENT_ID;
    const redirectUri =
      import.meta.env.VITE_OIDC_REDIRECT_URI ??
      `${window.location.origin}/auth/callback`;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "openid profile email offline_access",
      prompt: "select_account",
    });

    window.location.href = `${authority}/authorize?${params.toString()}`;
  };

  const signOut = () => {
    // Clear Convex session and reload
    window.location.href = "/api/auth/logout";
  };

  return { isAuthenticated, isLoading, signIn, signOut };
}

export function useUser() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.getCurrentUser);
  return isAuthenticated ? user : null;
}
