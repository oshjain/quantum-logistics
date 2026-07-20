<div align="center">

<img src="public/favicon.svg" alt="WNS Quantum Lab" width="80" />

# WNS Quantum Lab

### The Future of Logistics is Quantum

16 interactive simulations that explore how quantum computing will reshape global supply chains — built on algorithms that power logistics operations today.

**[🌐 Launch App](https://oshjain.github.io/quantum-logistics)**

---

</div>

## What This Is

A hands-on learning platform that demonstrates quantum computing concepts through logistics puzzles. Each simulation uses an actual optimisation algorithm — the same logic quantum computers will one day run at industrial scale. The goal: help teams across operations, training, quality, transformation, IT, networking, and leadership understand the technologies shaping the next decade.

## Simulations

### 🚢 Shipping Lines

| Simulation | Difficulty | Algorithm |
|---|---|---|
| Container Stack Shuffle | Easy | BFS (Breadth-First Search) |
| Vessel Stowage Tetris | Medium | Constraint Satisfaction |
| Empty Container Repositioning | Easy | Integer Linear Programming |
| Berth Race | Medium | Permutation Search |

### 🚛 Trucking

| Simulation | Difficulty | Algorithm |
|---|---|---|
| Trucker's Trip Chain | Medium | Permutation + Time-Window Filtering |
| Cross-Dock Sprint | Medium | Assignment Optimisation |

### 🗺️ Freight Forwarders

| Simulation | Difficulty | Algorithm |
|---|---|---|
| Intermodal Puzzle | Medium | Graph Search (DFS) |
| Spot Bid Battle | Easy | Exhaustive Combination Search |

### ✈️ Air Cargo

| Simulation | Difficulty | Algorithm |
|---|---|---|
| ULD Loading Challenge | Medium | Backtracking Search |
| Flight Capacity Auction | Easy | 0/1 Knapsack + Greedy Heuristic |

### 🚚 Logistics Basics

| Simulation | Difficulty | Algorithm |
|---|---|---|
| Sam's Delivery Dash | Easy | Brute-Force TSP |
| Dock Door Dilemma | Easy | Makespan Minimisation |

### ⚛️ Quantum Algorithms

| Simulation | Difficulty | Algorithm |
|---|---|---|
| BB84 Cryptography | Medium | Quantum Key Distribution |
| Grover's Search | Advanced | Amplitude Amplification |

### ⭐ Featured

| Simulation | Description |
|---|---|
| Quantum Shipment Lifecycle | Follow one container from Delhi to Chicago through 10 logistics touchpoints |

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Motion
- **UI Components:** shadcn/ui (Radix primitives)
- **Backend:** Convex
- **Routing:** React Router v7
- **Deployment:** GitHub Pages via GitHub Actions

## Running Locally

```bash
pnpm install
pnpm dev
```

The app runs at `http://localhost:5173`. For the Convex backend, run `npx convex dev` in a separate terminal.

---

<div align="center">

**WNS · Part of Capgemini**

*Built to help teams understand the technologies shaping the next decade of logistics.*

</div>
