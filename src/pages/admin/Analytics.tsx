import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuthContext } from "@/lib/auth/index.ts";
import NavBar from "@/components/NavBar.tsx";
import { cn } from "@/lib/utils.ts";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3, Users, FileText, Gamepad2, Menu, X,
  LayoutDashboard, Shield, Star,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/admin/analytics", label: "Platform Overview", icon: <LayoutDashboard className="size-4" />, end: true },
  { path: "/admin/analytics/users", label: "User Analytics", icon: <Users className="size-4" />, end: false },
  { path: "/admin/analytics/pages", label: "Page Analytics", icon: <FileText className="size-4" />, end: false },
  { path: "/admin/analytics/games", label: "Game Analysis", icon: <Gamepad2 className="size-4" />, end: false },
  { path: "/admin/analytics/ratings", label: "Rating Analytics", icon: <Star className="size-4" />, end: false },
];

export default function AnalyticsLayout() {
  const { email } = useAuthContext();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentUser = useQuery(api.users.getUserByEmail, { email: email ?? "" });
  const role = currentUser?.role;
  const isAdmin = role === "Admin" || role === "Super Admin";

  if (!email || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="size-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Access restricted to Admins and Super Admins.</p>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (item: typeof NAV_ITEMS[number]) => {
    if (item.end) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <div className="flex flex-1 relative">
        {/* ═══════ SIDEBAR ═══════ */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="border-r border-border/40 bg-card/30 shrink-0 overflow-hidden"
            >
              <div className="w-[240px] p-3 space-y-1">
                {/* Header */}
                <div className="flex items-center justify-between px-2 py-3 mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-4 text-primary" />
                    <span className="text-xs font-bold font-mono tracking-wider text-primary">ANALYTICS</span>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    aria-label="Close sidebar"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                {/* Nav items */}
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                      isActive(item)
                        ? "bg-primary/12 text-primary shadow-sm border border-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-transparent"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}

                {/* Divider */}
                <div className="border-t border-border/30 my-3" />

                {/* Quick links */}
                <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider px-3 pb-1">
                  Quick Links
                </p>
                <Link
                  to="/admin/users"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                >
                  <Users className="size-3.5" />
                  User Management
                </Link>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Hamburger - show when sidebar is closed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-3 z-30 flex items-center justify-center w-8 h-8 rounded-lg bg-card border border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary shadow-sm transition-all"
            aria-label="Open sidebar"
          >
            <Menu className="size-4" />
          </button>
        )}

        {/* ═══════ MAIN CONTENT ═══════ */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <footer className="border-t border-border/30 px-4 py-6 mt-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>WNS Quantum Lab</span>
          <span className="font-mono">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
