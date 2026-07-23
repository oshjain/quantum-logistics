import React, { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { PageTransition } from "./components/animations/index.ts";
import { PageTracker } from "./components/analytics/index.ts";
import { FloatingGameBar } from "./components/likes/index.ts";
import { GlobalRatingButton } from "./components/ratings/index.ts";
import { DefaultProviders } from "./components/providers/default.tsx";
import { useAuthContext } from "@/lib/auth/index.ts";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import Simulations from "./pages/Simulations.tsx";
import Learn from "./pages/Learn.tsx";
import Strategy from "./pages/Strategy.tsx";
import MyStats from "./pages/MyStats.tsx";
import NotFound from "./pages/NotFound.tsx";
import BB84Page from "./pages/bb84/page.tsx";
import GroversPage from "./pages/grovers/page.tsx";
import DeliveryPage from "./pages/delivery/page.tsx";
import DockPage from "./pages/dock/page.tsx";
import ContainerStackPage from "./pages/container-stack/page.tsx";
import VesselStowagedPage from "./pages/vessel-stowage/page.tsx";
import EmptyContainerPage from "./pages/empty-container/page.tsx";
import BerthRacePage from "./pages/berth-race/page.tsx";
import TripChainPage from "./pages/trip-chain/page.tsx";
import CrossDockPage from "./pages/cross-dock/page.tsx";
import IntermodalPage from "./pages/intermodal/page.tsx";
import SpotBidPage from "./pages/spot-bid/page.tsx";
import ULDPage from "./pages/uld-loading/page.tsx";
import FlightCapacityPage from "./pages/flight-capacity/page.tsx";
import QuantumShipmentPage from "./pages/quantum-shipment/page.tsx";

const GAME_PATHS = new Set([
  "/bb84", "/grovers", "/delivery", "/dock",
  "/container-stack", "/vessel-stowage", "/empty-container", "/berth-race",
  "/trip-chain", "/cross-dock", "/intermodal", "/spot-bid",
  "/uld-loading", "/flight-capacity", "/quantum-shipment",
]);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isGame = GAME_PATHS.has(pathname);
  return <div className={isGame ? "pb-24" : ""}>{children}</div>;
}

/* ─── Signed-out standalone page ────────────────────────────────── */
function SignedOutPage() {
  const { signIn } = useAuthContext();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[150px] opacity-8"
          style={{ background: "radial-gradient(ellipse, oklch(0.72 0.22 200), transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] opacity-6"
          style={{ background: "radial-gradient(ellipse, oklch(0.6 0.25 280), transparent 70%)" }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        {/* Icon */}
        <div className="text-6xl mb-6 animate-bounce">👋</div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 border border-primary/25 bg-primary/8 text-primary px-3 py-1 rounded-full text-[10px] font-medium mb-4 font-mono">
          SIGNED OUT
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-center">
          You've been <span className="text-gradient">signed out</span>
        </h1>

        <p className="text-sm text-muted-foreground mt-3 text-center max-w-md">
          Your local session has been cleared. Other apps stay signed in.
        </p>

        {/* Sign back in button */}
        <button
          onClick={signIn}
          className="mt-8 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
        >
          Sign Back In
        </button>

        {/* Close hint */}
        <p className="text-[10px] text-muted-foreground/50 font-mono mt-6">
          or close this tab and come back later
        </p>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 px-4 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>WNS Quantum Lab</span>
          <span className="font-mono">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

/* ─── Gate: show signed-out page or normal app ─────────────────── */
function SignedOutGate({ children }: { children: React.ReactNode }) {
  const { signedOut, email, isLoading } = useAuthContext();

  if (!isLoading && signedOut && !email) {
    return <SignedOutPage />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <ScrollToTop />
        <PageTracker />
        <FloatingGameBar />
        <GlobalRatingButton />
        <SignedOutGate>
          <PageShell>
            <Routes>
              <Route path="/" element={<PageTransition><Index /></PageTransition>} />
              <Route path="/simulations" element={<PageTransition><Simulations /></PageTransition>} />
              <Route path="/learn" element={<PageTransition><Learn /></PageTransition>} />
              <Route path="/strategy" element={<PageTransition><Strategy /></PageTransition>} />
              <Route path="/my-stats" element={<PageTransition><MyStats /></PageTransition>} />
              <Route path="/bb84" element={<PageTransition><BB84Page /></PageTransition>} />
              <Route path="/grovers" element={<GroversPage />} />
              <Route path="/delivery" element={<DeliveryPage />} />
              <Route path="/dock" element={<DockPage />} />
              <Route path="/container-stack" element={<ContainerStackPage />} />
              <Route path="/vessel-stowage" element={<VesselStowagedPage />} />
              <Route path="/empty-container" element={<EmptyContainerPage />} />
              <Route path="/berth-race" element={<BerthRacePage />} />
              <Route path="/trip-chain" element={<TripChainPage />} />
              <Route path="/cross-dock" element={<CrossDockPage />} />
              <Route path="/intermodal" element={<IntermodalPage />} />
              <Route path="/spot-bid" element={<SpotBidPage />} />
              <Route path="/uld-loading" element={<ULDPage />} />
              <Route path="/flight-capacity" element={<FlightCapacityPage />} />
              <Route path="/quantum-shipment" element={<QuantumShipmentPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageShell>
        </SignedOutGate>
      </BrowserRouter>
    </DefaultProviders>
  );
}
