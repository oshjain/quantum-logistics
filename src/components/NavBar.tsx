import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils.ts";
import { useAuthContext } from "@/lib/auth/index.ts";

const navItems = [
  { path: "/", label: "🏠 Home" },
  { path: "/learn", label: "📚 Learn" },
  { path: "/strategy", label: "📊 Strategy" },
];

export default function NavBar() {
  const location = useLocation();
  const { email } = useAuthContext();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const ALL_LINKS = [
    { group: "🚢 Shipping Lines", links: [
      { path: "/container-stack", label: "Container Stack Shuffle" },
      { path: "/vessel-stowage", label: "Vessel Stowage Tetris" },
      { path: "/empty-container", label: "Empty Container Dash" },
      { path: "/berth-race", label: "Berth Race" },
      { path: "/quantum-shipment", label: "Quantum Shipment Lifecycle" },
    ]},
    { group: "🚛 Trucking", links: [
      { path: "/trip-chain", label: "Trucker's Trip Chain" },
      { path: "/cross-dock", label: "Cross-Dock Sprint" },
    ]},
    { group: "🗺️ Forwarders", links: [
      { path: "/intermodal", label: "Intermodal Puzzle" },
      { path: "/spot-bid", label: "Spot Bid Battle" },
    ]},
    { group: "✈️ Air Cargo", links: [
      { path: "/uld-loading", label: "ULD Loading Challenge" },
      { path: "/flight-capacity", label: "Flight Capacity Auction" },
    ]},
    { group: "🚚 Logistics Basics", links: [
      { path: "/delivery", label: "Sam's Delivery Dash" },
      { path: "/dock", label: "Dock Door Dilemma" },
    ]},
    { group: "⚛ Quantum", links: [
      { path: "/bb84", label: "BB84 Protocol" },
      { path: "/grovers", label: "Grover's Search" },
    ]},
  ];

  return (
    <header className="border-b border-border/50 bg-background/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold font-mono">Q</span>
          </div>
          <span className="font-semibold text-sm tracking-tight">WNS Quantum Lab</span>
        </Link>

        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
              location.pathname === item.path
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            {item.label}
          </Link>
        ))}

        {/* Simulations dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1",
              open ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            🎮 Simulations
            <span className="text-xs opacity-60">{open ? "▲" : "▼"}</span>
          </button>

          {open && (
            <div
              className="absolute top-full left-0 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-2xl z-50 p-3 space-y-3 max-h-[calc(100vh-5rem)] overflow-y-auto"
            >
              <Link
                to="/simulations"
                onClick={() => setOpen(false)}
                className="block px-2 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10 transition-colors border-b border-border/30 mb-1"
              >
                🎮 Browse All Simulations →
              </Link>
              {ALL_LINKS.map((group) => (
                <div key={group.group}>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 px-1">{group.group}</p>
                  {group.links.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block px-2 py-1.5 rounded-lg text-sm transition-colors",
                        location.pathname === link.path
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Stats + User */}
        <div className="ml-auto flex items-center gap-3">
          <Link
            to="/my-stats"
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap hidden sm:block",
              location.pathname === "/my-stats"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            👤 My Stats
          </Link>
          {email && (
            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px] hidden lg:block" title={email}>
              {email}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
