import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuthContext } from "@/lib/auth/index.ts";

const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/simulations": "Simulations",
  "/learn": "Learn",
  "/strategy": "Strategy",
  "/bb84": "BB84 Cryptography",
  "/grovers": "Grover's Search",
  "/delivery": "Sam's Delivery Dash",
  "/dock": "Dock Door Dilemma",
  "/container-stack": "Container Stack Shuffle",
  "/vessel-stowage": "Vessel Stowage Tetris",
  "/empty-container": "Empty Container Repositioning",
  "/berth-race": "Berth Race",
  "/trip-chain": "Trucker's Trip Chain",
  "/cross-dock": "Cross-Dock Sprint",
  "/intermodal": "Intermodal Puzzle",
  "/spot-bid": "Spot Bid Battle",
  "/uld-loading": "ULD Loading Challenge",
  "/flight-capacity": "Flight Capacity Auction",
  "/quantum-shipment": "Quantum Shipment Lifecycle",
  "/my-stats": "My Stats",
};

export function PageTracker() {
  const { pathname } = useLocation();
  const { email } = useAuthContext();
  const recordVisit = useMutation(api.pageVisits.recordVisit);
  const lastPathRef = useRef<string>("");

  useEffect(() => {
    if (!email) return;
    if (lastPathRef.current === pathname) return; // skip duplicate
    lastPathRef.current = pathname;
    const pageTitle = PAGE_TITLES[pathname] ?? pathname;
    recordVisit({ email, page: pathname, pageTitle });
  }, [email, pathname, recordVisit]);

  return null; // invisible component
}
