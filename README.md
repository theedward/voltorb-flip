# Voltorb Lab

A fast, exact Voltorb Flip solver for Pokémon HeartGold and SoulSilver. Enter the five row clues and five column clues, record revealed tiles, and the app calculates every board that still fits.

## What it shows

- Exact safe-flip probability for every unknown tile
- Guaranteed-safe tiles highlighted in green
- Best available move when no guaranteed move remains
- Instant updates after every clue or revealed tile
- Touch controls plus `1`, `2`, `3`, `V`, and `U` keyboard shortcuts

The solver generates valid patterns per row, then uses dynamic programming and column-bound pruning to count consistent boards and calculate tile marginals without brute-forcing all `4²⁵` grids.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validate

```bash
npm run lint
npm test
```

This is an unofficial fan-made utility. Pokémon and Voltorb are trademarks of their respective owners.
