import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuthContext } from "@/lib/auth/index.ts";
import NavBar from "@/components/NavBar.tsx";
import { FadeInView } from "@/components/animations/index.ts";
import { motion, AnimatePresence } from "motion/react";
import { Search, UserCog, Trash2, Shield, ShieldCheck, Eye, Pencil, X, Check } from "lucide-react";

const ROLE_OPTIONS = ["Viewer", "Admin", "Super Admin"] as const;

export default function UserManagement() {
  const { email } = useAuthContext();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<string>("Viewer");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const currentUser = useQuery(api.users.getUserByEmail, { email: email ?? "" });
  const allUsers = useQuery(api.users.getAllUsers, { adminEmail: email ?? "" });

  const updateUser = useMutation(api.users.updateUser);
  const deleteUser = useMutation(api.users.deleteUser);

  const isSuperAdmin = currentUser?.role === "Super Admin";

  if (!email || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="size-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Access restricted to Super Admins only.</p>
          </div>
        </div>
      </div>
    );
  }

  const filtered = allUsers?.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.email.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q));
  });

  const handleEdit = (user: NonNullable<typeof allUsers>[number]) => {
    setEditingId(user._id);
    setEditName(user.name ?? "");
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  const handleSave = async () => {
    if (!editingId) return;
    await updateUser({
      adminEmail: email,
      userId: editingId as any,
      name: editName || undefined,
      email: editEmail || undefined,
      role: editRole,
    });
    setEditingId(null);
  };

  const handleDelete = async (userId: string) => {
    await deleteUser({ adminEmail: email, userId: userId as any });
    setDeleteConfirm(null);
  };

  const roleColors: Record<string, string> = {
    "Super Admin": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Admin: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Viewer: "bg-muted/30 text-muted-foreground border-border/30",
  };

  const roleIcons: Record<string, React.ReactNode> = {
    "Super Admin": <ShieldCheck className="size-3" />,
    Admin: <Shield className="size-3" />,
    Viewer: <Eye className="size-3" />,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <section className="relative px-4 pt-16 pb-10 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, oklch(0.6 0.25 280), transparent 70%)" }} />
        <div className="relative z-10 max-w-6xl mx-auto">
          <FadeInView>
            <div className="inline-flex items-center gap-2 border border-purple-500/25 bg-purple-500/8 text-purple-400 px-3 py-1 rounded-full text-[10px] font-medium mb-4 font-mono">
              <ShieldCheck className="size-3" />
              SUPER ADMIN
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              👥 User <span className="text-gradient">Management</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {allUsers?.length ?? 0} registered users
            </p>
          </FadeInView>
        </div>
      </section>

      <div className="max-w-6xl mx-auto w-full px-4 pb-20">
        <FadeInView direction="up">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by email or name..."
              className="w-full rounded-xl border border-border/50 bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all"
            />
          </div>

          {/* User list */}
          <div className="space-y-2">
            {filtered?.length === 0 && (
              <div className="text-center py-12">
                <UserCog className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No users found</p>
              </div>
            )}
            {filtered?.map((user) => (
              <motion.div
                key={user._id}
                layout
                className="rounded-xl border border-border/40 bg-card/50 p-4 hover:border-border/60 transition-colors"
              >
                {editingId === user._id ? (
                  /* Edit mode */
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Name</label>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:border-purple-500/40"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Email</label>
                        <input
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:border-purple-500/40"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Role</label>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:border-purple-500/40"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="size-3" /> Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500 text-white text-xs font-semibold hover:bg-purple-600 transition-colors"
                      >
                        <Check className="size-3" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(user.name?.[0] || user.email[0]).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">{user.name || "Unnamed"}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-mono font-medium ${roleColors[user.role] || roleColors.Viewer}`}>
                          {roleIcons[user.role] || roleIcons.Viewer}
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <p className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        title="Edit user"
                      >
                        <Pencil className="size-4" />
                      </button>
                      {deleteConfirm === user._id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            title="Confirm delete"
                          >
                            <Check className="size-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            title="Cancel"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(user._id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </FadeInView>
      </div>

      <footer className="border-t border-border/30 px-4 py-8 mt-auto">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>WNS Quantum Lab</span>
          <span className="font-mono">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
