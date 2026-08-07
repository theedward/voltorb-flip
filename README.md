<div align="center">

# 🔴 VOLTORB<span>//</span>LAB ⚡

### FLIP SMARTER. KEEP YOUR COINS.

**An exact, instant Voltorb Flip solver for Pokémon HeartGold & SoulSilver.**

![TypeScript](https://img.shields.io/badge/TypeScript-191a17?style=for-the-badge&logo=typescript&logoColor=c9f04d)
![React](https://img.shields.io/badge/React-191a17?style=for-the-badge&logo=react&logoColor=c9f04d)
![Tests](https://img.shields.io/badge/tests-passing-c9f04d?style=for-the-badge&labelColor=191a17)
![License](https://img.shields.io/badge/fan_project-df3b32?style=for-the-badge&labelColor=191a17)

```text
        ╭─────────╮
      ╭─┤  ╲   ╱  ├─╮        ┌─────┬─────┬─────┬─────┬─────┐
     │  ╰────┬────╯  │       │100% │ 82% │100% │ 64% │ 91% │
     │     ╲ │ ╱     │       ├─────┼─────┼─────┼─────┼─────┤
      ╰──────┴──────╯        │  ?  │  3  │  ?  │  ?  │  2  │
         V O L T O R B        └─────┴─────┴─────┴─────┴─────┘
```

</div>

---

## ◆ What is this?

Voltorb Flip is part logic puzzle, part calculated risk, and part extremely effective frustration machine. Voltorb Lab turns the ten edge clues and your revealed tiles into exact constraint probabilities—then points you toward guaranteed-safe flips or the best available gamble.

No screenshots. No tedious board recreation. Just enter the clues exactly as they appear in-game and start flipping.

## ⚡ Features

- **Exact board enumeration** — considers every grid consistent with your clues
- **Guaranteed-safe highlighting** — acid green means there is no possible Voltorb
- **Best-move ranking** — balances survival odds with multiplier potential
- **Instant recalculation** — every reveal immediately narrows the board
- **Fast input** — touch controls plus keyboard shortcuts
- **Persistent record** — wins, losses, and win rate survive between sessions
- **Coin Case goals** — compare your balance with any HeartGold Game Corner prize and add cleared-board payouts automatically
- **Dramatic failure** — because hitting a Voltorb deserves a proper `KABOOM`
- **Responsive design** — built for a phone beside your DS, as nature intended

## 🎮 How to use it

1. Copy the point total and Voltorb count for all five rows and columns.
2. Flip any tile marked **100% SAFE**.
3. Choose its revealed value below the board, then tap that tile.
4. Repeat until every `2` and `3` is uncovered.
5. If the game declares victory before the solver can infer it, press **Board cleared +1 W**.

| Key | Action |
|:---:|:-------|
| `1` | Record a 1 |
| `2` | Record a 2× multiplier |
| `3` | Record a 3× multiplier |
| `V` or `0` | Record a Voltorb and a loss |
| `U` or `Backspace` | Clear a recorded tile |

> [!TIP]
> A line where **points + Voltorbs = 5** contains only `1`s and Voltorbs. It has no multipliers, so you can usually ignore it.

## 🧠 How the solver works

Brute-forcing every possible board would mean checking `4²⁵` grids. That is approximately **1.1 quadrillion** bad ideas.

Voltorb Lab instead:

1. Generates only the five-tile patterns that satisfy each row.
2. Rejects patterns that conflict with revealed tiles.
3. Combines rows using dynamic programming.
4. Prunes partial boards that can no longer satisfy a column.
5. Counts the remaining value frequencies for every tile.

```mermaid
flowchart TD
    A["Enter row clues, column clues,<br/>and revealed tiles"] --> B{"Are the inputs valid?"}
    B -- "No" --> C["Highlight the conflicting clues"]
    B -- "Yes" --> D["Generate only five-cell patterns<br/>that satisfy each row"]
    D --> E["Add one candidate row<br/>to the partial board"]
    E --> F{"Can every column still<br/>reach its sum and Voltorb total?"}
    F -- "No" --> G["Prune that branch"]
    F -- "Yes, rows remain" --> E
    F -- "Yes, board complete" --> H["Count the valid board"]
    H --> I["Count 0, 1, 2, and 3<br/>appearances for every tile"]
    I --> J["Calculate exact safety and<br/>multiplier probabilities"]
    J --> K{"Any tile guaranteed safe?"}
    K -- "Yes" --> L["Highlight it green"]
    K -- "No" --> M["Rank the best available risk"]
    M --> N{"Holding at least two<br/>round coins?"}
    N -- "No" --> O["Recommend the best flip"]
    N -- "Yes" --> P{"Best expected multiplier<br/>at most 1x?"}
    P -- "No" --> O
    P -- "Yes" --> Q["Recommend quitting<br/>and protecting the payout"]

    classDef input fill:#f2efd9,stroke:#191a17,color:#191a17;
    classDef process fill:#292b26,stroke:#c9f04d,color:#f2efd9;
    classDef decision fill:#df3b32,stroke:#8f201d,color:#ffffff;
    classDef result fill:#c9f04d,stroke:#191a17,color:#191a17;
    class A input;
    class D,E,H,I,J,M process;
    class B,F,K,N,P decision;
    class C,G,L,O,Q result;
```

The displayed probability is exact across all clue-compatible layouts treated equally. Level-dependent board generation can affect the game’s true prior odds, but it cannot invalidate a move shown as guaranteed safe.

## 🕹️ Run locally

Requires **Node.js 22.13+**.

```bash
git clone https://github.com/theedward/voltorb-flip.git
cd voltorb-flip
npm install
npm run dev
```

Open **[localhost:3000](http://localhost:3000)**.

## 🧪 Validate

```bash
npm run lint
npm test
```

The tests cover server rendering, known-board probability counts, safe-tile detection, and conflicting reveals.

## 🧰 Stack

`React 19` · `TypeScript` · `vinext` · `Cloudflare D1` · `Drizzle ORM` · `Tailwind CSS`

---

<div align="center">

### 🔴 DON'T FLIP ANGRY. FLIP INFORMED. 🔴

<sub>Unofficial fan-made utility. Pokémon, Voltorb, HeartGold, and SoulSilver are trademarks of their respective owners.</sub>

</div>
