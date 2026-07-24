import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuthContext } from "@/lib/auth/index.ts";
import { Lightbulb, Sparkles, Send, X } from "lucide-react";

const INDUSTRIES = [
  "Logistics & Supply Chain",
  "Manufacturing",
  "Healthcare",
  "Finance & Banking",
  "Insurance",
  "Retail & E-commerce",
  "Travel & Hospitality",
  "Technology",
  "Telecommunications",
  "Energy & Utilities",
  "Pharmaceuticals",
  "Automotive",
  "Aerospace & Defense",
  "Other",
];

const DOMAINS = [
  "Back Office Operations",
  "Front Office Operations",
  "Finance & Accounting",
  "Shipping & Maritime",
  "Vessel Operations",
  "Trucking & Freight",
  "Air Cargo",
  "Freight Forwarding",
  "Port & Terminals",
  "Ground Force / Ramp Operations",
  "Warehousing & Distribution",
  "Supply Chain Planning",
  "Procurement & Sourcing",
  "Customer Experience",
  "Data, Analytics & AI",
  "Digital Transformation",
  "Operations Excellence",
  "Sustainability / ESG",
  "Risk & Compliance",
  "Information Technology",
  "Sales & Marketing",
  "Human Resources",
  "Legal & Contracts",
  "Other",
];

export function IdeaModal() {
  const { email, name } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(true);
  const [step, setStep] = useState<"welcome" | "form" | "submitted">("welcome");
  const [industry, setIndustry] = useState("");
  const [domain, setDomain] = useState("");
  const [process, setProcess] = useState("");
  const [idea, setIdea] = useState("");
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");
  const [domainSearch, setDomainSearch] = useState("");

  const submitIdea = useMutation(api.ideas.submitIdea);

  if (!email) return null;

  const filteredIndustries = INDUSTRIES.filter((i) =>
    i.toLowerCase().includes(industrySearch.toLowerCase()),
  );
  const filteredDomains = DOMAINS.filter((d) =>
    d.toLowerCase().includes(domainSearch.toLowerCase()),
  );

  const handleSubmit = async () => {
    if (!email || !industry || !domain || !process.trim() || !idea.trim()) return;
    await submitIdea({
      email,
      name: name || undefined,
      industry,
      domain,
      process: process.trim(),
      idea: idea.trim(),
    });
    setStep("submitted");
    setTimeout(() => {
      setOpen(false);
      setTimeout(() => {
        setStep("welcome");
        setIndustry("");
        setDomain("");
        setProcess("");
        setIdea("");
        setIndustrySearch("");
        setDomainSearch("");
      }, 200);
    }, 2000);
  };

  const openModal = () => {
    setTooltipVisible(false);
    setOpen(true);
  };

  const resetAndClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStep("welcome");
      setIndustry("");
      setDomain("");
      setProcess("");
      setIdea("");
      setIndustrySearch("");
      setDomainSearch("");
    }, 200);
  };

  const isFormValid = industry && domain && process.trim() && idea.trim();

  return (
    <>
      {/* ──────── FLOATING TRIGGER BUTTON ──────── */}
      <div className="fixed bottom-4 left-4 sm:left-6 z-50 flex flex-col items-start gap-2">
        {/* Tooltip - desktop only */}
        <AnimatePresence>
          {tooltipVisible && (
            <motion.div
              className="relative hidden sm:block"
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              transition={{ delay: 1, type: "spring", stiffness: 200 }}
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-lg shadow-amber-500/25 whitespace-nowrap">
                <span className="flex items-center gap-1">
                  <Sparkles className="size-3" />
                  Have an idea? Click here! 😊
                </span>
              </div>
              <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-orange-500 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mobile: Compact FAB (icon only) ── */}
        <motion.button
          onClick={openModal}
          className="relative group sm:hidden"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(251, 191, 36, 0.4)",
              "0 0 0 12px rgba(251, 191, 36, 0)",
              "0 0 0 0 rgba(251, 191, 36, 0)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
          <div className="relative flex items-center justify-center size-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 overflow-hidden">
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)" }}
            />
            <motion.div
              animate={{ rotate: [0, -8, 8, -8, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              <Lightbulb className="size-6" />
            </motion.div>
          </div>
        </motion.button>

        {/* ── Desktop: Full button with text ── */}
        <motion.button
          onClick={openModal}
          className="relative group hidden sm:flex"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(251, 191, 36, 0.4)",
              "0 0 0 12px rgba(251, 191, 36, 0)",
              "0 0 0 0 rgba(251, 191, 36, 0)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />

          {/* Button body */}
          <div className="relative flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 overflow-hidden">
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
              }}
            />

            {/* Bulb icon with animation */}
            <motion.div
              animate={{
                rotate: [0, -8, 8, -8, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              <Lightbulb className="size-5" />
            </motion.div>

            {/* Text */}
            <span className="text-xs font-bold whitespace-nowrap">
              Have an Idea?{" "}
              <motion.span
                className="inline-block"
                animate={{ rotate: [0, 15, 0, 15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
              >
                😊
              </motion.span>
            </span>

            {/* Sparkle */}
            <motion.span
              className="text-[10px]"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ✨
            </motion.span>
          </div>
        </motion.button>
      </div>

      {/* ──────── MODAL ──────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={resetAndClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Panel */}
            <motion.div
              className="relative z-10 w-full max-w-lg rounded-3xl border border-amber-500/20 bg-gradient-to-b from-card via-card to-amber-500/5 p-6 sm:p-8 shadow-2xl shadow-amber-500/10"
              initial={{ scale: 0.85, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Close button */}
              <button
                onClick={resetAndClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <X className="size-4" />
              </button>

              {/* ──────── WELCOME STEP ──────── */}
              {step === "welcome" && (
                <motion.div
                  className="text-center py-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {/* Animated bulb */}
                  <motion.div
                    className="text-6xl mb-4 inline-block"
                    animate={{
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  >
                    💡
                  </motion.div>

                  {/* Decorative sparkles */}
                  <motion.div
                    className="absolute top-12 left-8 text-amber-400/30 text-2xl"
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✦
                  </motion.div>
                  <motion.div
                    className="absolute top-16 right-12 text-amber-400/20 text-xl"
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                  >
                    ✧
                  </motion.div>

                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 border border-amber-500/25 bg-amber-500/8 text-amber-400 px-3 py-1 rounded-full text-[10px] font-medium mb-4 font-mono">
                    <Sparkles className="size-3" />
                    WE WANT TO HEAR FROM YOU
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                    Hey{name ? ` ${name.split(" ")[0]}` : ""}! Got an{" "}
                    <span className="text-amber-400">idea</span>?{" "}
                    <span className="inline-block">🤔💡</span>
                  </h2>

                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
                    We're <strong className="text-amber-400/80">super excited</strong> you want to share your bright ideas
                    with us! Whether it's a game-changer or a tiny spark — every idea matters.{" "}
                    <span className="inline-block">🚀</span>
                  </p>

                  <motion.button
                    onClick={() => setStep("form")}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg shadow-amber-500/25"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="flex items-center gap-2">
                      <Lightbulb className="size-4" />
                      Spill the Idea! 💫
                    </span>
                  </motion.button>

                  <p className="text-[10px] text-muted-foreground/50 font-mono mt-4">
                    It'll take just 2 minutes ⏱️
                  </p>
                </motion.div>
              )}

              {/* ──────── FORM STEP ──────── */}
              {step === "form" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <Lightbulb className="size-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Share Your Idea</h3>
                      <p className="text-xs text-muted-foreground">Tell us what's on your mind</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Industry */}
                    <div className="relative">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Industry <span className="text-amber-400">*</span>
                      </label>
                      <div
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between hover:border-amber-500/30 transition-colors"
                        onClick={() => {
                          setShowIndustryDropdown(!showIndustryDropdown);
                          setShowDomainDropdown(false);
                        }}
                      >
                        <span className={industry ? "text-foreground" : "text-muted-foreground"}>
                          {industry || "Select industry..."}
                        </span>
                        <motion.span
                          animate={{ rotate: showIndustryDropdown ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          ▼
                        </motion.span>
                      </div>
                      <AnimatePresence>
                        {showIndustryDropdown && (
                          <motion.div
                            className="absolute z-20 top-full mt-1 left-0 right-0 rounded-xl border border-border/50 bg-card shadow-2xl overflow-hidden"
                            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                            animate={{ opacity: 1, y: 0, scaleY: 1 }}
                            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                            style={{ transformOrigin: "top" }}
                          >
                            <div className="p-2">
                              <input
                                value={industrySearch}
                                onChange={(e) => setIndustrySearch(e.target.value)}
                                placeholder="Search industries..."
                                className="w-full rounded-lg border border-border/30 bg-background px-3 py-2 text-xs mb-1 focus:outline-none focus:border-amber-500/30"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="max-h-44 overflow-y-auto px-1 pb-1">
                              {filteredIndustries.map((ind) => (
                                <button
                                  key={ind}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                    industry === ind
                                      ? "bg-amber-500/10 text-amber-400 font-medium"
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                  }`}
                                  onClick={() => {
                                    setIndustry(ind);
                                    setShowIndustryDropdown(false);
                                    setIndustrySearch("");
                                  }}
                                >
                                  {ind}
                                </button>
                              ))}
                              {filteredIndustries.length === 0 && (
                                <button
                                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-muted/50"
                                  onClick={() => {
                                    setIndustry(industrySearch);
                                    setShowIndustryDropdown(false);
                                    setIndustrySearch("");
                                  }}
                                >
                                  + Use "{industrySearch}"
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Domain */}
                    <div className="relative">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Domain <span className="text-amber-400">*</span>
                      </label>
                      <div
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between hover:border-amber-500/30 transition-colors"
                        onClick={() => {
                          setShowDomainDropdown(!showDomainDropdown);
                          setShowIndustryDropdown(false);
                        }}
                      >
                        <span className={domain ? "text-foreground" : "text-muted-foreground"}>
                          {domain || "Select domain..."}
                        </span>
                        <motion.span
                          animate={{ rotate: showDomainDropdown ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          ▼
                        </motion.span>
                      </div>
                      <AnimatePresence>
                        {showDomainDropdown && (
                          <motion.div
                            className="absolute z-20 top-full mt-1 left-0 right-0 rounded-xl border border-border/50 bg-card shadow-2xl overflow-hidden"
                            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                            animate={{ opacity: 1, y: 0, scaleY: 1 }}
                            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                            style={{ transformOrigin: "top" }}
                          >
                            <div className="p-2">
                              <input
                                value={domainSearch}
                                onChange={(e) => setDomainSearch(e.target.value)}
                                placeholder="Search domains..."
                                className="w-full rounded-lg border border-border/30 bg-background px-3 py-2 text-xs mb-1 focus:outline-none focus:border-amber-500/30"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="max-h-44 overflow-y-auto px-1 pb-1">
                              {filteredDomains.map((dom) => (
                                <button
                                  key={dom}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                    domain === dom
                                      ? "bg-amber-500/10 text-amber-400 font-medium"
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                  }`}
                                  onClick={() => {
                                    setDomain(dom);
                                    setShowDomainDropdown(false);
                                    setDomainSearch("");
                                  }}
                                >
                                  {dom}
                                </button>
                              ))}
                              {filteredDomains.length === 0 && (
                                <button
                                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-muted/50"
                                  onClick={() => {
                                    setDomain(domainSearch);
                                    setShowDomainDropdown(false);
                                    setDomainSearch("");
                                  }}
                                >
                                  + Use "{domainSearch}"
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Process / Sub-process */}
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Process / Sub-process <span className="text-amber-400">*</span>
                      </label>
                      <input
                        value={process}
                        onChange={(e) => setProcess(e.target.value)}
                        placeholder="e.g., Invoice Processing / AP Automation"
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      />
                    </div>

                    {/* Idea */}
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Your Idea <span className="text-amber-400">*</span>
                      </label>
                      <textarea
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        placeholder="Describe your idea — what, why, and how? Be as detailed as you'd like! ✨"
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm resize-none h-28 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      />
                      <div className="text-right mt-1">
                        <span className="text-[10px] font-mono text-muted-foreground">{idea.length} chars</span>
                      </div>
                    </div>

                    {/* User info (read-only) */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/30">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
                        {name?.[0]?.toUpperCase() || email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{name || "Anonymous"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setStep("welcome")}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Back
                    </button>
                    <motion.button
                      onClick={handleSubmit}
                      disabled={!isFormValid}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold disabled:opacity-40 hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2"
                      whileHover={isFormValid ? { scale: 1.02 } : {}}
                      whileTap={isFormValid ? { scale: 0.98 } : {}}
                    >
                      <Send className="size-4" />
                      Submit Idea
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ──────── SUBMITTED STEP ──────── */}
              {step === "submitted" && (
                <motion.div
                  className="text-center py-8"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <motion.div
                    className="text-6xl mb-4"
                    initial={{ rotate: -20, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  >
                    🚀
                  </motion.div>
                  <motion.div
                    className="text-3xl mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    💡✨
                  </motion.div>
                  <h3 className="text-xl font-bold text-amber-400 mt-2">Idea Received! 🎉</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
                    Your brilliant idea has been captured! Our team will review it and who knows — it might just be the next big thing!{" "}
                    <span className="inline-block">🌟</span>
                  </p>
                  <motion.div
                    className="mt-6 text-2xl"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ⭐🚀⭐
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
