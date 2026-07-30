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

## Prerequisites

- **Node.js 22+** — [Download](https://nodejs.org/)
- **pnpm** — Install via npm:

  ```bash
  npm install -g pnpm
  ```

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env.local
```

`.env.local` (use your own OIDC provider — Auth0, Azure AD, Keycloak, etc.):

```env
# Convex backend URL (local dev)
VITE_CONVEX_URL=http://127.0.0.1:3210

# OIDC Authentication
VITE_OIDC_AUTHORITY=https://your-provider.com
VITE_OIDC_CLIENT_ID=your-client-id
VITE_OIDC_REDIRECT_URI=http://localhost:5173/auth/callback
```

Then set the Convex backend auth environment variables:

```bash
npx convex env set CONVEX_OIDC_AUTHORITY https://your-provider.com
npx convex env set CONVEX_OIDC_CLIENT_ID your-client-id
```

### 3. Start the dev server

This starts both the Vite frontend and the Convex backend:

```bash
pnpm dev
```

Or run them separately:

```bash
pnpm dev:frontend    # Vite at http://localhost:5173
pnpm dev:backend     # Convex at http://127.0.0.1:3210
```

### 4. Open the app

Visit **[http://localhost:5173](http://localhost:5173)**.

## Deploying

### Frontend (GitHub Pages)

Push to `main` — GitHub Actions builds and deploys automatically via `.github/workflows/deploy.yml`.

Or deploy manually:

```bash
pnpm build
```

### Backend (Convex)

```bash
npx convex deploy
```

Or use the combined deploy script:

```bash
pnpm deploy
```

This auto-detects Convex backend changes, deploys them, then pushes to git.

---

<div align="center">

**WNS · Part of Capgemini**

*Built to help teams understand the technologies shaping the next decade of logistics.*

</div>
