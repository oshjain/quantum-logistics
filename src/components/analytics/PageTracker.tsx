import { useEffect, useRef } from "react";
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
  const { email } = useAuthContext();
  const recordVisit = useMutation(api.pageVisits.recordVisit);
  const trackedRef = useRef<string>("");

  useEffect(() => {
    if (!email) return;
    const path = window.location.pathname;
    if (trackedRef.current === path) return; // only track once per page load
    trackedRef.current = path;
    const pageTitle = PAGE_TITLES[path] ?? path;
    recordVisit({ email, page: path, pageTitle });
  }, [email, recordVisit]);

  return null; // invisible component
}
