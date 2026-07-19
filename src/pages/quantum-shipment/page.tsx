import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { ChevronRight, RotateCcw, BookOpen } from "lucide-react";
import NavBar from "@/components/NavBar.tsx";
import WorldMap from "./_components/WorldMap.tsx";
import Dashboard from "./_components/Dashboard.tsx";
import Stage1 from "./_components/Stage1.tsx";
import Stage2 from "./_components/Stage2.tsx";
import Stage3 from "./_components/Stage3.tsx";
import Stage4 from "./_components/Stage4.tsx";
import Stage5 from "./_components/Stage5.tsx";
import Stage6 from "./_components/Stage6.tsx";
import Stage7 from "./_components/Stage7.tsx";
import Stage8 from "./_components/Stage8.tsx";
import Stage9 from "./_components/Stage9.tsx";
import Stage10 from "./_components/Stage10.tsx";
import SummaryScreen from "./_components/SummaryScreen.tsx";
import IntroScreen from "./_components/IntroScreen.tsx";
import {
  createInitialGameState,
  generateSeedsForStage,
  ROUTE_NODES,
  type StageId,
  type StageResult,
  type GameState,
} from "@/lib/quantum-shipment-game.ts";

const STAGE_TITLES: Record<StageId, string> = {
  1: "Empty Container Pickup",
  2: "Factory Loading",
  3: "Drayage to Port",
  4: "Container Yard Stacking",
  5: "Vessel Stowage",
  6: "Transshipment Hub",
  7: "Ocean Transit & Charter",
  8: "NY Port & Customs",
  9: "Rail Loading & Scheduling",
  10: "Last-Mile Truck Delivery",
};

const STAGE_SUBTITLES: Record<StageId, string> = {
  1: "Delhi → Mundra Factory",
  2: "Delhi Factory",
  3: "Delhi → Mundra Port (900km)",
  4: "Mundra Container Yard",
  5: "Mundra → Singapore",
  6: "Singapore Transshipment Hub",
  7: "Singapore → New York",
  8: "New York Port",
  9: "New York → Chicago",
  10: "Chicago Last Mile",
};

export default function QuantumShipmentPage() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const s = createInitialGameState();
    s.seeds[1] = generateSeedsForStage(1);
    return s;
  });

  const [pendingResult, setPendingResult] = useState<StageResult | null>(null);
  const [restartId, setRestartId] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const handleStageComplete = useCallback((result: StageResult) => {
    setPendingResult(result);
    setGameState((prev) => {
      const stageId = prev.currentStage;
      return {
        ...prev,
        stageResults: { ...prev.stageResults, [stageId]: result },
      };
    });
  }, []);

  const handleQuantumBoosted = useCallback(() => {
    setGameState((prev) => {
      const stageId = prev.currentStage;
      const existing = prev.stageResults[stageId];
      if (!existing) return prev;
      return {
        ...prev,
        stageResults: {
          ...prev.stageResults,
          [stageId]: { ...existing, quantumBoosted: true },
        },
      };
    });
  }, []);

  const handleNextStage = () => {
    if (!pendingResult) return;
    setGameState((prev) => {
      const stageId = prev.currentStage;
      const nextStage = (stageId + 1) as StageId;
      const newState: GameState = {
        ...prev,
        currentStage: nextStage > 10 ? prev.currentStage : nextStage,
        totalManualCost: prev.totalManualCost + pendingResult.manualCost,
        totalManualTime: prev.totalManualTime + pendingResult.manualTime,
        totalQuantumCost: prev.totalQuantumCost + pendingResult.quantumCost,
        totalQuantumTime: prev.totalQuantumTime + pendingResult.quantumTime,
        gameOver: stageId === 10,
      };
      if (stageId < 10) {
        newState.seeds[nextStage as StageId] = generateSeedsForStage(nextStage as StageId);
      }
      return newState;
    });
    setPendingResult(null);
  };

  const handleRestart = () => {
    const s = createInitialGameState();
    s.seeds[1] = generateSeedsForStage(1);
    setGameState(s);
    setPendingResult(null);
    setRestartId((id) => id + 1);
    setHasStarted(true);
  };

  const { currentStage, stageResults, seeds, gameOver } = gameState;
  const completedStages = Object.keys(stageResults).map(Number) as StageId[];
  const currentResult = stageResults[currentStage];
  const currentSeeds = seeds[currentStage] ?? [];
  const stageCompleted = !!currentResult?.completed;

  const showIntro = currentStage === 1 && !hasStarted && !currentResult;

  if (gameOver) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <SummaryScreen gameState={gameState} onRestart={handleRestart} />
        </div>
      </div>
    );
  }

  const renderStage = () => {
    const props = {
      seeds: currentSeeds,
      onComplete: handleStageComplete,
      result: currentResult,
      onQuantumBoosted: handleQuantumBoosted,
    };
    switch (currentStage) {
      case 1: return <Stage1 {...props} />;
      case 2: return <Stage2 {...props} />;
      case 3: return <Stage3 {...props} />;
      case 4: return <Stage4 {...props} />;
      case 5: return <Stage5 {...props} />;
      case 6: return <Stage6 {...props} />;
      case 7: return <Stage7 {...props} />;
      case 8: return <Stage8 {...props} />;
      case 9: return <Stage9 {...props} />;
      case 10: return <Stage10 {...props} />;
      default: return null;
    }
  };

  const stageContent = showIntro ? (
    <IntroScreen onBegin={() => setHasStarted(true)} />
  ) : (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Stage header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-card to-[oklch(0.12_0.04_200)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-primary font-bold text-sm">
            {currentStage}
          </div>
          <div>
            <h2 className="font-bold text-foreground">{STAGE_TITLES[currentStage]}</h2>
            <p className="text-xs text-muted-foreground">{STAGE_SUBTITLES[currentStage]}</p>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">Stage {currentStage} of 10</div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: `${((currentStage - 1) / 10) * 100}%` }}
            animate={{ width: `${(currentStage / 10) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      {/* Stage body */}
      <div className="p-4">{renderStage()}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      {/* Sub-header */}
      <div className="border-b border-border bg-card/50 backdrop-blur px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-primary">⬡</span> Quantum Shipment Lifecycle
            </h1>
            <p className="text-xs text-muted-foreground">Delhi, India → Chicago, USA</p>
          </div>
          <div className="flex items-center gap-1">
            {!showIntro && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setHasStarted(false);
                    setGameState((prev) => {
                      const newResults = { ...prev.stageResults };
                      delete newResults[1];
                      return { ...prev, currentStage: 1, stageResults: newResults };
                    });
                  }}
                  className="gap-1 text-xs"
                >
                  <BookOpen className="w-3 h-3" /> Intro
                </Button>
                <Button variant="ghost" size="sm" onClick={handleRestart} className="gap-1 text-xs">
                  <RotateCcw className="w-3 h-3" /> Restart
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        {/* World Map */}
        {!showIntro && <WorldMap currentStage={currentStage} completedStages={completedStages} />}

        {/* Dashboard */}
        {!showIntro && <Dashboard state={gameState} />}

        {/* Stage content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={showIntro ? `intro-${restartId}` : `${currentStage}-${restartId}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {stageContent}
          </motion.div>
        </AnimatePresence>

        {/* Next stage button */}
        {stageCompleted && currentResult?.quantumBoosted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={handleNextStage}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              {currentStage === 10 ? "View Final Summary" : `Next Stage: ${STAGE_TITLES[(currentStage + 1) as StageId]}`}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}
        {stageCompleted && !currentResult?.quantumBoosted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-muted-foreground"
          >
            Click <span className="text-primary font-semibold">Quantum Boost</span> above to reveal the optimal choice and unlock the next stage.
          </motion.div>
        )}
      </div>
    </div>
  );
}
