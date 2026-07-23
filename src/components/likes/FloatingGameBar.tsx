import { useLocation } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { HeartButton } from "@/components/likes/HeartButton.tsx";
import { useAuthContext } from "@/lib/auth/index.ts";
import { getTopicForGame } from "@/lib/topic-map.ts";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

// Paths that are game/simulation pages
const GAME_PATHS = new Set([
  "/bb84", "/grovers", "/delivery", "/dock",
  "/container-stack", "/vessel-stowage", "/empty-container", "/berth-race",
  "/trip-chain", "/cross-dock", "/intermodal", "/spot-bid",
  "/uld-loading", "/flight-capacity", "/quantum-shipment",
]);

const GAME_TITLES: Record<string, string> = {
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
};

export function FloatingGameBar() {
  const { pathname } = useLocation();
  const { email } = useAuthContext();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const toggleLike = useMutation(api.likes.toggleLike);
  const toggleDislike = useMutation(api.likes.toggleDislike);

  const isGame = GAME_PATHS.has(pathname);
  const gameTitle = GAME_TITLES[pathname] ?? "";
  const topicName = getTopicForGame(pathname);

  const gameLikes = useQuery(api.likes.getLikeCount, {
    targetType: "game", targetId: pathname,
  });
  const userGameStatus = useQuery(api.likes.getUserLikeStatus, {
    email: email ?? "", targetType: "game", targetId: pathname,
  });

  const topicLikes = useQuery(api.likes.getLikeCount, {
    targetType: "topic", targetId: topicName ?? "",
  });
  const userTopicStatus = useQuery(api.likes.getUserLikeStatus, {
    email: email ?? "", targetType: "topic", targetId: topicName ?? "",
  });

  const isGameLiked = userGameStatus?.action === "like";
  const isGameDisliked = userGameStatus?.action === "dislike";
  const isTopicLiked = userTopicStatus?.action === "like";

  if (!isGame || !email) return null;

  const handleGameLike = () => {
    toggleLike({ email, targetType: "game", targetId: pathname, action: "like" });
  };

  const handleGameDislike = () => {
    toggleDislike({ email, targetType: "game", targetId: pathname, feedback: feedbackText || undefined });
    setShowFeedback(false);
    setFeedbackText("");
  };

  const handleTopicLike = () => {
    if (topicName) {
      toggleLike({ email, targetType: "topic", targetId: topicName, action: "like" });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
      >
        <div className="pointer-events-auto mx-auto max-w-2xl px-4 pb-4">
          <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl px-5 py-4 flex flex-wrap items-center gap-5">
            {/* Game title */}
            <span className="text-sm font-semibold text-muted-foreground hidden sm:block truncate max-w-[160px]">
              {gameTitle}
            </span>

            <div className="h-7 w-px bg-border/50 hidden sm:block" />

            {/* Game likes */}
            <div className="flex items-center gap-1">
              <HeartButton
                count={gameLikes?.likeCount ?? 0}
                isLiked={isGameLiked}
                onToggle={handleGameLike}
                size="lg"
              />
            </div>

            {/* Dislike */}
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className={`transition-all duration-200 hover:scale-110 active:scale-90 text-2xl ${
                isGameDisliked ? "text-amber-400" : "text-muted-foreground"
              }`}
              title="Dislike"
            >
              👎
            </button>

            {/* Topic like */}
            {topicName && topicLikes && (
              <>
                <div className="h-7 w-px bg-border/50" />
                <span className="text-xs text-muted-foreground font-mono">{topicName}</span>
                <HeartButton
                  count={topicLikes.likeCount}
                  isLiked={isTopicLiked}
                  onToggle={handleTopicLike}
                  size="lg"
                />
              </>
            )}

            {/* Feedback input */}
            {showFeedback && (
              <div className="w-full flex items-start gap-2 mt-1">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What didn't you like? (optional)"
                  className="flex-1 text-xs rounded-lg border border-border/50 bg-background px-3 py-2 resize-none h-9 focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={handleGameDislike}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition-colors shrink-0"
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
