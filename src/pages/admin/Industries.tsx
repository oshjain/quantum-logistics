import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuthContext } from "@/lib/auth/index.ts";
import NavBar from "@/components/NavBar.tsx";
import { FadeInView } from "@/components/animations/index.ts";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Pencil, Trash2, X, Check, GripVertical, Shield, Tags } from "lucide-react";

type Tab = "industries" | "domains";

export default function IndustryDomainManager() {
  const { email } = useAuthContext();
  const [tab, setTab] = useState<Tab>("industries");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const currentUser = useQuery(api.users.getUserByEmail, { email: email ?? "" });
  const industries = useQuery(api.industries.getAllIndustries);
  const domains = useQuery(api.industries.getAllDomains);

  const addIndustry = useMutation(api.industries.addIndustry);
  const updateIndustry = useMutation(api.industries.updateIndustry);
  const deleteIndustry = useMutation(api.industries.deleteIndustry);
  const addDomain = useMutation(api.industries.addDomain);
  const updateDomain = useMutation(api.industries.updateDomain);
  const deleteDomain = useMutation(api.industries.deleteDomain);

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

  const items = tab === "industries" ? (industries ?? []) : (domains ?? []);
  const addFn = tab === "industries" ? addIndustry : addDomain;
  const updateFn = tab === "industries" ? updateIndustry : updateDomain;
  const deleteFn = tab === "industries" ? deleteIndustry : deleteDomain;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addFn({ adminEmail: email, name: newName.trim() });
    setNewName("");
    setAdding(false);
  };

  const handleEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await updateFn({ adminEmail: email, [tab === "industries" ? "industryId" : "domainId"]: editingId as any, name: editName.trim() });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteFn({ adminEmail: email, [tab === "industries" ? "industryId" : "domainId"]: id as any });
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <section className="relative px-4 pt-16 pb-10 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, oklch(0.6 0.25 280), transparent 70%)" }} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <FadeInView>
            <div className="inline-flex items-center gap-2 border border-purple-500/25 bg-purple-500/8 text-purple-400 px-3 py-1 rounded-full text-[10px] font-medium mb-4 font-mono">
              <Tags className="size-3" />
              LIST MANAGEMENT
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              🏷️ Industry & Domain <span className="text-gradient">Manager</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Manage dropdown options for the idea submission form
            </p>
          </FadeInView>
        </div>
      </section>

      <div className="max-w-4xl mx-auto w-full px-4 pb-20">
        <FadeInView direction="up">
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl border border-border/40 bg-card/50 p-1 mb-6">
            {(["industries", "domains"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-purple-500/10 text-purple-400 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "industries" ? "🏭 Industries" : "📂 Domains"}
                <span className="ml-1.5 text-[10px] font-mono opacity-60">({items.length})</span>
              </button>
            ))}
          </div>

          {/* Add new */}
          <div className="mb-4">
            {adding ? (
              <div className="flex items-center gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={`New ${tab.slice(0, -1)} name...`}
                  className="flex-1 rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="px-4 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-semibold disabled:opacity-40 hover:bg-purple-600 transition-all flex items-center gap-1.5"
                >
                  <Check className="size-4" /> Add
                </button>
                <button
                  onClick={() => { setAdding(false); setNewName(""); }}
                  className="p-2.5 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-purple-500/30 transition-all w-full justify-center"
              >
                <Plus className="size-4" />
                Add New {tab === "industries" ? "Industry" : "Domain"}
              </button>
            )}
          </div>

          {/* List */}
          <div className="space-y-1.5">
            {items.length === 0 && (
              <div className="text-center py-12">
                <Tags className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No {tab} added yet</p>
              </div>
            )}
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="rounded-xl border border-border/40 bg-card/50 px-4 py-3 hover:border-border/60 transition-colors"
                >
                  {editingId === item._id ? (
                    <div className="flex items-center gap-2">
                      <GripVertical className="size-4 text-muted-foreground/30 shrink-0" />
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:border-purple-500/40"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="p-2 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <GripVertical className="size-4 text-muted-foreground/20 shrink-0" />
                      <span className="flex-1 text-sm">{item.name}</span>
                      <button
                        onClick={() => handleEdit(item._id, item.name)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      {deleteConfirm === item._id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Check className="size-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(item._id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </FadeInView>
      </div>

      <footer className="border-t border-border/30 px-4 py-8 mt-auto">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>WNS Quantum Lab</span>
          <span className="font-mono">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
