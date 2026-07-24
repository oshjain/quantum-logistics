import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils.ts";
import { useAuthContext } from "@/lib/auth/index.ts";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Menu, X, Shield, ShieldCheck, BarChart3 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet.tsx";

const navItems = [
  { path: "/", label: "🏠 Home" },
  { path: "/learn", label: "📚 Learn" },
  { path: "/strategy", label: "📊 Strategy" },
];

const SIMULATION_GROUPS = [
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

function MobileNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { email } = useAuthContext();
  const currentUser = useQuery(api.users.getUserByEmail, { email: email ?? "" });
  const role = currentUser?.role;
  const isAdmin = role === "Admin" || role === "Super Admin";
  const isSuperAdmin = role === "Super Admin";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="flex sm:hidden items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-sm p-0 gap-0">
        <div className="flex items-center justify-between px-4 h-14 border-b border-border/50">
          <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold font-mono">Q</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">WNS Quantum Lab</span>
          </Link>
          <SheetClose asChild>
            <button className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X className="size-5" />
            </button>
          </SheetClose>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {/* Main navigation items */}
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {item.label}
            </Link>
          ))}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-1">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider px-3 pb-1">
                  🔐 Admin
                </p>
                <Link
                  to="/admin/analytics"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === "/admin/analytics"
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <BarChart3 className="size-4 mr-2" />
                  Master Analytics
                </Link>
                {isSuperAdmin && (
                  <>
                    <Link
                      to="/admin/users"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        location.pathname === "/admin/users"
                          ? "bg-purple-500/15 text-purple-400"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <ShieldCheck className="size-4 mr-2" />
                      User Management
                    </Link>
                    <Link
                      to="/admin/industries"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        location.pathname === "/admin/industries"
                          ? "bg-purple-500/15 text-purple-400"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <Shield className="size-4 mr-2" />
                      Industry & Domains
                    </Link>
                  </>
                )}
              </div>
            </>
          )}

          {/* Simulations section header */}
          <div className="pt-4 pb-1">
            <Link
              to="/simulations"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                location.pathname === "/simulations"
                  ? "bg-primary/15 text-primary"
                  : "text-primary hover:bg-primary/10"
              )}
            >
              🎮 Browse All Simulations →
            </Link>
          </div>

          {/* Simulation groups */}
          {SIMULATION_GROUPS.map((group) => (
            <div key={group.group} className="pt-3">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider px-3 pb-1">
                {group.group}
              </p>
              {group.links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm transition-colors",
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
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function DesktopNav() {
  const location = useLocation();
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

  return (
    <>
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
          <div className="absolute top-full left-0 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-2xl z-50 p-3 space-y-3 max-h-[calc(100vh-5rem)] overflow-y-auto">
            <Link
              to="/simulations"
              onClick={() => setOpen(false)}
              className="block px-2 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10 transition-colors border-b border-border/30 mb-1"
            >
              🎮 Browse All Simulations →
            </Link>
            {SIMULATION_GROUPS.map((group) => (
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
    </>
  );
}

export default function NavBar() {
  const location = useLocation();
  const { email } = useAuthContext();
  const currentUser = useQuery(api.users.getUserByEmail, { email: email ?? "" });
  const role = currentUser?.role;
  const isAdmin = role === "Admin" || role === "Super Admin";
  const isSuperAdmin = role === "Super Admin";

  return (
    <header className="border-b border-border/50 bg-background/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        {/* Mobile: hamburger menu */}
        <div className="flex sm:hidden">
          <MobileNav />
        </div>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold font-mono">Q</span>
          </div>
          <span className="font-semibold text-sm tracking-tight">WNS Quantum Lab</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden sm:flex items-center gap-1">
          <DesktopNav />

          {/* Admin links */}
          {isAdmin && (
            <>
              <div className="w-px h-5 bg-border/50 mx-1" />
              <Link
                to="/admin/analytics"
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1",
                  location.pathname === "/admin/analytics"
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <BarChart3 className="size-3.5" />
                Analytics
              </Link>
              {isSuperAdmin && (
                <>
                  <Link
                    to="/admin/users"
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1",
                      location.pathname === "/admin/users"
                        ? "bg-purple-500/15 text-purple-400"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <ShieldCheck className="size-3.5" />
                    Users
                  </Link>
                  <Link
                    to="/admin/industries"
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1",
                      location.pathname === "/admin/industries"
                        ? "bg-purple-500/15 text-purple-400"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Shield className="size-3.5" />
                    Lists
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* My Stats + User — always visible */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            to="/my-stats"
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
              location.pathname === "/my-stats"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            👤 My Stats
          </Link>
          {email && (
            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[100px] sm:max-w-[120px] hidden lg:block" title={email}>
              {email}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
