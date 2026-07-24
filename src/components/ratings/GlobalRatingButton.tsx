import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import { RatingModal } from "@/components/ratings/RatingModal.tsx";

const GAME_PATHS = new Set([
  "/bb84", "/grovers", "/delivery", "/dock",
  "/container-stack", "/vessel-stowage", "/empty-container", "/berth-race",
  "/trip-chain", "/cross-dock", "/intermodal", "/spot-bid",
  "/uld-loading", "/flight-capacity", "/quantum-shipment",
]);

export function GlobalRatingButton() {
  const { pathname } = useLocation();
  const isGame = GAME_PATHS.has(pathname);

  return (
    <div
      className={cn(
        "fixed right-4 z-50",
        isGame ? "bottom-28 sm:bottom-24" : "bottom-4 sm:bottom-20"
      )}
    >
      <RatingModal />
    </div>
  );
}
