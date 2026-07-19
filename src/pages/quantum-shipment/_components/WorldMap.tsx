import { motion } from "motion/react";
import { ROUTE_NODES, type StageId } from "@/lib/quantum-shipment-game.ts";

interface WorldMapProps {
  currentStage: StageId;
  completedStages: StageId[];
}

// SVG world map path (simplified continents)
const CONTINENTS = {
  northAmerica: "M 5 15 Q 10 10 20 12 Q 28 8 35 15 Q 38 22 35 30 Q 30 40 22 42 Q 15 45 10 38 Q 3 30 5 15 Z",
  southAmerica: "M 18 45 Q 22 43 28 48 Q 32 55 28 68 Q 24 75 18 72 Q 13 65 15 55 Q 16 50 18 45 Z",
  europe: "M 44 8 Q 52 6 58 10 Q 62 14 60 20 Q 55 22 48 20 Q 42 16 44 8 Z",
  africa: "M 46 22 Q 54 20 58 28 Q 62 38 58 52 Q 52 60 46 58 Q 40 52 40 42 Q 38 30 46 22 Z",
  asia: "M 58 8 Q 72 6 85 12 Q 92 16 95 22 Q 92 30 85 32 Q 78 34 70 30 Q 62 28 58 22 Q 54 16 58 8 Z",
  india: "M 60 28 Q 66 26 68 32 Q 70 38 66 44 Q 62 46 58 42 Q 56 36 60 28 Z",
  seAsia: "M 75 38 Q 82 36 84 42 Q 82 48 76 48 Q 72 44 75 38 Z",
  australia: "M 78 60 Q 88 58 92 64 Q 94 70 88 74 Q 80 76 76 70 Q 74 64 78 60 Z",
};

// Connection path between nodes
function buildPath(nodes: typeof ROUTE_NODES, from: number, to: number): string {
  const a = nodes.find((n) => n.id === from)!;
  const b = nodes.find((n) => n.id === to)!;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - 5;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

export default function WorldMap({ currentStage, completedStages }: WorldMapProps) {
  const stageIds: StageId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="relative w-full h-52 md:h-64 bg-[oklch(0.08_0.03_220)] rounded-xl overflow-hidden border border-border">
      <svg
        viewBox="0 0 100 80"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Ocean background */}
        <rect width="100" height="80" fill="oklch(0.06 0.03 220)" />

        {/* Grid lines */}
        {[20, 40, 60].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="oklch(0.15 0.02 220)" strokeWidth="0.3" />
        ))}
        {[25, 50, 75].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="80" stroke="oklch(0.15 0.02 220)" strokeWidth="0.3" />
        ))}

        {/* Continents */}
        <path d={CONTINENTS.northAmerica} fill="oklch(0.18 0.04 140)" stroke="oklch(0.25 0.05 140)" strokeWidth="0.3" />
        <path d={CONTINENTS.southAmerica} fill="oklch(0.18 0.04 140)" stroke="oklch(0.25 0.05 140)" strokeWidth="0.3" />
        <path d={CONTINENTS.europe} fill="oklch(0.18 0.04 140)" stroke="oklch(0.25 0.05 140)" strokeWidth="0.3" />
        <path d={CONTINENTS.africa} fill="oklch(0.18 0.04 140)" stroke="oklch(0.25 0.05 140)" strokeWidth="0.3" />
        <path d={CONTINENTS.asia} fill="oklch(0.18 0.04 140)" stroke="oklch(0.25 0.05 140)" strokeWidth="0.3" />
        <path d={CONTINENTS.india} fill="oklch(0.22 0.05 140)" stroke="oklch(0.3 0.06 140)" strokeWidth="0.2" />
        <path d={CONTINENTS.seAsia} fill="oklch(0.20 0.04 140)" stroke="oklch(0.28 0.05 140)" strokeWidth="0.2" />
        <path d={CONTINENTS.australia} fill="oklch(0.18 0.04 140)" stroke="oklch(0.25 0.05 140)" strokeWidth="0.3" />

        {/* Route connections */}
        {stageIds.slice(0, -1).map((id, i) => {
          const nextId = stageIds[i + 1];
          const isCompleted = completedStages.includes(id as StageId);
          const isActive = currentStage === id || currentStage === nextId;
          return (
            <path
              key={`${id}-${nextId}`}
              d={buildPath(ROUTE_NODES, id, nextId)}
              fill="none"
              stroke={isCompleted ? "oklch(0.72 0.22 200)" : isActive ? "oklch(0.72 0.22 200 / 0.5)" : "oklch(0.3 0.03 260)"}
              strokeWidth={isCompleted ? "0.6" : "0.4"}
              strokeDasharray={isCompleted ? "none" : "1 0.8"}
            />
          );
        })}

        {/* Route nodes */}
        {ROUTE_NODES.map((node) => {
          const isCompleted = completedStages.includes(node.id);
          const isCurrent = currentStage === node.id;
          return (
            <g key={node.id}>
              {isCurrent && (
                <>
                  <circle cx={node.x} cy={node.y} r="3" fill="oklch(0.72 0.22 200 / 0.2)">
                    <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={isCurrent ? "1.8" : "1.4"}
                fill={isCompleted ? "oklch(0.72 0.22 200)" : isCurrent ? "oklch(0.8 0.2 200)" : "oklch(0.3 0.04 260)"}
                stroke={isCurrent ? "white" : isCompleted ? "oklch(0.72 0.22 200 / 0.5)" : "oklch(0.4 0.04 260)"}
                strokeWidth="0.4"
              />
              <text
                x={node.x}
                y={node.y - 2.5}
                textAnchor="middle"
                fontSize="2"
                fill={isCurrent ? "white" : isCompleted ? "oklch(0.72 0.22 200)" : "oklch(0.5 0.04 260)"}
                fontWeight={isCurrent ? "bold" : "normal"}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Stage label overlay */}
      <div className="absolute bottom-2 left-3 text-xs text-muted-foreground">
        Stage {currentStage}/10 — {ROUTE_NODES.find((n) => n.id === currentStage)?.location}
      </div>
    </div>
  );
}
