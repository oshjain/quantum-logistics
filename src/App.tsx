import React, { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { PageTransition } from "./components/animations/index.ts";
import { PageTracker } from "./components/analytics/index.ts";
import { FloatingGameBar } from "./components/likes/index.ts";
import { GlobalRatingButton } from "./components/ratings/index.ts";
import { DefaultProviders } from "./components/providers/default.tsx";
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

/** Handles GitHub Pages SPA fallback: restores the original path saved by 404.html */
function SpaRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const saved = sessionStorage.getItem("spa_redirect");
    if (saved && saved !== "/") {
      sessionStorage.removeItem("spa_redirect");
      navigate(saved, { replace: true });
    }
  }, [navigate]);
  return null;
}

function PageShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isGame = GAME_PATHS.has(pathname);
  return <div className={isGame ? "pb-24" : ""}>{children}</div>;
}

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <ScrollToTop />
        <SpaRedirect />
        <PageTracker />
        <FloatingGameBar />
        <GlobalRatingButton />
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
      </BrowserRouter>
    </DefaultProviders>
  );
}
