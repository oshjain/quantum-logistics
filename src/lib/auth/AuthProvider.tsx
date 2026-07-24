import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { msalInstance, CLIENT_ID, LOGIN_SCOPES } from "./config.ts";

/* ─── Types ────────────────────────────────────────────────────── */
interface AuthContextValue {
  email: string | null;
  name: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signedOut: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  email: null,
  name: null,
  isAuthenticated: false,
  isLoading: true,
  signedOut: false,
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

/* ─── Clear MSAL's local cache for this app only ──────────────── */
function clearAppLocalCache() {
  sessionStorage.removeItem("quantum_auth_user");
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes(CLIENT_ID)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/* ─── AuthProvider ──────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);

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

        // Check if user just signed out — show signed-out page instead of redirecting
        const params = new URLSearchParams(window.location.search);
        if (params.has("signedOut")) {
          window.history.replaceState({}, "", "/");
          setSignedOut(true);
          setLoading(false);
          return;
        }

        // ═══ SSO: try silent auth from cached MSAL accounts ═══
        // If the user has logged into this app before (or any other
        // O365 app in this browser), MSAL has cached account info
        // in localStorage. We can try to get a token silently without
        // redirecting — this uses O365 session cookies under the hood.
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          try {
            const silentResult = await msalInstance.acquireTokenSilent({
              scopes: LOGIN_SCOPES,
              account: accounts[0],
            });
            if (silentResult.idToken) {
              const user = decodeIdToken(silentResult.idToken);
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
          } catch {
            // Silent acquisition failed (session expired, password
            // changed, etc.) — fall through to redirect login below
          }
        }

        // No auth found and not a sign-out — auto-redirect to Microsoft login
        setLoading(false);
        msalInstance.loginRedirect({ scopes: LOGIN_SCOPES });
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
    // Clear local session only — does NOT call Microsoft logout
    // so other org apps stay signed in
    setEmail(null);
    setName(null);
    setSignedOut(true);
    clearAppLocalCache();
    window.location.href = "/?signedOut=true";
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
    <AuthContext.Provider value={{ email, name, isAuthenticated: !!email, isLoading: false, signedOut, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
