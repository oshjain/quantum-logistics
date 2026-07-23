import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { HeartButton } from "./HeartButton.tsx";
import { useAuthContext } from "@/lib/auth/index.ts";
import { CATEGORIES } from "@/lib/site-data.ts";

interface LikeBarProps {
  gamePath: string;
  gameTitle: string;
  topicName?: string;    // e.g. "Shipping Lines"
}

export function LikeBar({ gamePath, gameTitle, topicName }: LikeBarProps) {
  const { email } = useAuthContext();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const toggleLike = useMutation(api.likes.toggleLike);
  const toggleDislike = useMutation(api.likes.toggleDislike);

  const gameLikes = useQuery(api.likes.getLikeCount, { targetType: "game", targetId: gamePath });
  const userGameStatus = useQuery(api.likes.getUserLikeStatus, {
    email: email ?? "",
    targetType: "game",
    targetId: gamePath,
  });

  const topicLikes = useQuery(api.likes.getLikeCount, {
    targetType: "topic",
    targetId: topicName ?? "",
  });
  const userTopicStatus = useQuery(api.likes.getUserLikeStatus, {
    email: email ?? "",
    targetType: "topic",
    targetId: topicName ?? "",
  });

  const isGameLiked = userGameStatus?.action === "like";
  const isGameDisliked = userGameStatus?.action === "dislike";
  const isTopicLiked = userTopicStatus?.action === "like";

  if (!email) return null;
  if (!gameLikes) return <div className="h-8" />;

  const handleGameLike = () => {
    toggleLike({ email, targetType: "game", targetId: gamePath, action: "like" });
  };

  const handleGameDislike = () => {
    toggleDislike({ email, targetType: "game", targetId: gamePath, feedback: feedbackText || undefined });
    setShowFeedback(false);
    setFeedbackText("");
  };

  const handleTopicLike = () => {
    if (topicName) {
      toggleLike({ email, targetType: "topic", targetId: topicName, action: "like" });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-5 py-3 px-4 rounded-xl border border-border/40 bg-card/60">
      {/* Game likes */}
      <div className="flex items-center gap-1">
        <HeartButton
          count={gameLikes.likeCount}
          isLiked={isGameLiked}
          onToggle={handleGameLike}
          size="lg"
        />
        <span className="text-xs text-muted-foreground font-mono ml-1">likes</span>
      </div>

      {/* Game dislike */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowFeedback(!showFeedback)}
          className={`transition-all duration-200 hover:scale-110 active:scale-90 text-2xl ${
            isGameDisliked ? "text-amber-400" : "text-muted-foreground"
          }`}
          title="Dislike"
        >
          👎
        </button>
        {gameLikes.dislikeCount > 0 && (
          <span className="text-xs font-mono text-muted-foreground">{gameLikes.dislikeCount}</span>
        )}
      </div>

      {/* Divider */}
      {topicName && <div className="w-px h-6 bg-border/50" />}

      {/* Topic likes */}
      {topicName && topicLikes && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground font-mono">{topicName}</span>
          <HeartButton
            count={topicLikes.likeCount}
            isLiked={isTopicLiked}
            onToggle={handleTopicLike}
            size="md"
          />
        </div>
      )}

      {/* Feedback popover */}
      {showFeedback && (
        <div className="w-full mt-2 flex items-start gap-2">
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="What didn't you like? (optional)"
            className="flex-1 text-xs rounded-lg border border-border/50 bg-background px-3 py-2 resize-none h-10 focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={handleGameDislike}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
