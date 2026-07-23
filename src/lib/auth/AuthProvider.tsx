import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { msalInstance, LOGIN_SCOPES } from "./config.ts";

/* ─── Types ────────────────────────────────────────────────────── */
interface AuthContextValue {
  email: string | null;
  name: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  email: null,
  name: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: () => {},
  signOut: () => {},
});

export function useAuthContext() {
  return useContext(AuthContext);
}

/* ─── Decode JWT to extract user info ──────────────────────────── */
function decodeIdToken(idToken: string): { email: string; name: string } {
  try {
    const payload = JSON.parse(atob(idToken.split(".")[1]));
    return {
      email: payload.preferred_username ?? payload.email ?? payload.unique_name ?? "",
      name: payload.name ?? payload.preferred_username ?? "",
    };
  } catch {
    return { email: "", name: "" };
  }
}

/* ─── AuthProvider ──────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Clear any stale SPA redirect from previous 404.html visits
        sessionStorage.removeItem("spa_redirect");

        await msalInstance.initialize();

        // MSAL handles the redirect and token exchange in-browser
        const response = await msalInstance.handleRedirectPromise();

        if (response && response.accessToken) {
          // Successfully returned from Microsoft login
          const user = decodeIdToken(response.idToken);
          if (user.email) {
            setEmail(user.email);
            setName(user.name);
            sessionStorage.setItem("quantum_auth_user", JSON.stringify({
              email: user.email,
              name: user.name,
              expiresAt: Date.now() + 3600000,
            }));
            setLoading(false);
            return;
          }
        }

        // Check session storage for existing auth
        const stored = sessionStorage.getItem("quantum_auth_user");
        if (stored) {
          const user = JSON.parse(stored);
          if (user.expiresAt > Date.now()) {
            setEmail(user.email);
            setName(user.name);
            setLoading(false);
            return;
          }
          sessionStorage.removeItem("quantum_auth_user");
        }

        setLoading(false);
      } catch (err) {
        console.error("[Auth] Bootstrap error:", err);
        setLoading(false);
      }
    })();
  }, []);

  const signIn = () => {
    msalInstance.loginRedirect({
      scopes: LOGIN_SCOPES,
    });
  };

  const signOut = () => {
    sessionStorage.removeItem("quantum_auth_user");
    setEmail(null);
    setName(null);
    msalInstance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-mono">Signing in...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ email, name, isAuthenticated: !!email, isLoading: false, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
