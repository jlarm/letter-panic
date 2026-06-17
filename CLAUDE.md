# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Wordle-like word-guessing game built with React, TanStack Router, TanStack Query, and Three.js for 3D visuals/animations.

## Commands

```bash
npm run dev        # start Vite dev server
npm run build      # production build
npm run preview    # preview production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest (unit tests)
npm test -- --run src/path/to/file.test.ts  # run a single test file
```

## Stack

- **Vite** — build tool and dev server
- **React 18 + TypeScript** — UI
- **TanStack Router** — file-based routing (`src/routes/`)
- **TanStack Query** — server state (word validation API calls, word-of-the-day fetch)
- **Three.js / React Three Fiber** — 3D scene for tile flip and win animations
- **Vitest + Testing Library** — unit and component tests

## Architecture

### Game state

All game logic lives in `src/store/` (Zustand or similar). The store owns the canonical game state: current guesses, evaluation results (correct / present / absent), game status (playing / won / lost), and the target word. Components read from the store; they do not derive game logic themselves.

### Word checking

`src/lib/words.ts` exports the allowed-guess list and the answer list. Evaluation (comparing a guess against the target letter-by-letter with correct duplicate-letter handling) lives in `src/lib/evaluate.ts` and is pure — no side effects, easy to unit-test.

### Three.js integration

Three.js/R3F scenes live in `src/components/scene/`. The React component tree drives the scene declaratively; game state changes (new guess submitted, win/loss) trigger animation sequences via refs or a small animation queue, not re-renders. Keep Three.js code isolated from game logic.

### Routing

TanStack Router with file-based routes. `src/routes/index.tsx` is the main game view. Additional routes (e.g. `/stats`, `/help`) live alongside it.

### Data fetching

TanStack Query handles any network calls (word-of-the-day endpoint, word validation if server-side). Query keys follow the pattern `['word', date]` / `['validate', guess]`.

## Key conventions

- Evaluate guess correctness with the "mark correct first, then present" algorithm to handle duplicate letters correctly — do not use a naive single-pass approach.
- Tile state machine: `empty → filled → revealed`. Reveal happens after submission, one tile at a time with a delay, driven by CSS animation or R3F animation, not `setTimeout` chains in components.
- Keep Three.js scene state (camera, renderer, materials) inside R3F and never in React state or Zustand.
