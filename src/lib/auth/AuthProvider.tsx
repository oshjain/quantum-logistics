import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { CLIENT_ID, TENANT_ID, AUTHORITY } from "./config.ts";

/* ─── Types ────────────────────────────────────────────────────── */
interface AuthContextValue {
  email: string | null;
  name: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  email: null,
  name: null,
  isAuthenticated: false,
  isLoading: true,
  signOut: () => {},
});

export function useAuthContext() {
  return useContext(AuthContext);
}

/* ─── PKCE helpers ─────────────────────────────────────────────── */
function base64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(plain));
}

const STATE_KEY = "quantum_auth_state";
const VERIFIER_KEY = "quantum_auth_verifier";

function generateState(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(16)));
}

/* ─── Initiate Microsoft login (redirect) ──────────────────────── */
async function startLogin() {
  const state = generateState();
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64Url(await sha256(verifier));

  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: window.location.origin,
    response_mode: "query",
    scope: "openid profile email",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });

  window.location.href = `${AUTHORITY}/oauth2/v2.0/authorize?${params}`;
}

/* ─── AuthProvider ──────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const convex = useConvex();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // 1. Check if returning from Microsoft redirect
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const returnedState = params.get("state");

        if (code && returnedState) {
          // Clear URL immediately to prevent reprocessing
          window.history.replaceState(null, "", window.location.pathname);

          // Validate state
          const savedState = sessionStorage.getItem(STATE_KEY);
          sessionStorage.removeItem(STATE_KEY);
          if (!savedState || savedState !== returnedState) {
            console.error("[Auth] State mismatch");
            setLoading(false);
            return;
          }

          // Get PKCE verifier
          const verifier = sessionStorage.getItem(VERIFIER_KEY);
          sessionStorage.removeItem(VERIFIER_KEY);
          if (!verifier) {
            console.error("[Auth] No verifier found");
            setLoading(false);
            return;
          }

          // Exchange code via Convex (server-side, no CORS)
          const result = await convex.action(api.authActions.exchangeCodeForTokens, {
            code,
            codeVerifier: verifier,
            redirectUri: window.location.origin,
          });

          setEmail(result.email);
          setName(result.name);
          setLoading(false);
          return;
        }

        // 2. Check if we already have stored auth
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

        // 3. No auth — redirect to Microsoft
        setLoading(false);
        startLogin();
      } catch (err) {
        console.error("[Auth] Bootstrap error:", err);
        setLoading(false);
      }
    })();
  }, [convex]);

  // Store auth in sessionStorage when we get it
  useEffect(() => {
    if (email) {
      sessionStorage.setItem("quantum_auth_user", JSON.stringify({
        email,
        name,
        expiresAt: Date.now() + 3600000, // 1 hour
      }));
    }
  }, [email, name]);

  const signOut = () => {
    sessionStorage.removeItem("quantum_auth_user");
    const logoutUrl = `${AUTHORITY}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
    window.location.href = logoutUrl;
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
    <AuthContext.Provider value={{ email, name, isAuthenticated: !!email, isLoading: false, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
