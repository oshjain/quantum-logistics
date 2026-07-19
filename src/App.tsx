import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
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

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter basename="/quantum-logistics">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/bb84" element={<BB84Page />} />
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
      </BrowserRouter>
    </DefaultProviders>
  );
}
