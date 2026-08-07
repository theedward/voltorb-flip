export type CellValue = -1 | 0 | 1 | 2 | 3;
export type Clue = { sum: number | null; bombs: number | null };

type Pattern = [number, number, number, number, number];
type State = { sums: number[]; bombs: number[] };

export type SolveResult = {
  total: number;
  cells: Array<{
    safe: number;
    multiplier: number;
    values: [number, number, number, number];
  }>;
};

const SIZE = 5;
const allPatterns: Pattern[] = [];

for (let encoded = 0; encoded < 4 ** SIZE; encoded += 1) {
  let value = encoded;
  const pattern = [] as unknown as Pattern;
  for (let cell = 0; cell < SIZE; cell += 1) {
    pattern[cell] = value % 4;
    value = Math.floor(value / 4);
  }
  allPatterns.push(pattern);
}

function stateKey(state: State) {
  return `${state.sums.join(",")}|${state.bombs.join(",")}`;
}

function addPattern(state: State, pattern: Pattern): State {
  return {
    sums: state.sums.map((sum, col) => sum + pattern[col]),
    bombs: state.bombs.map((bombs, col) => bombs + (pattern[col] === 0 ? 1 : 0)),
  };
}

function transitionValid(state: State, columns: Clue[], rowsLeft: number) {
  return columns.every((clue, col) => {
    if (clue.sum === null || clue.bombs === null) return false;
    const sum = state.sums[col];
    const bombs = state.bombs[col];
    const nonBombSlots = rowsLeft - Math.max(0, clue.bombs - bombs);
    return (
      sum <= clue.sum &&
      bombs <= clue.bombs &&
      bombs + rowsLeft >= clue.bombs &&
      sum + nonBombSlots <= clue.sum &&
      sum + nonBombSlots * 3 >= clue.sum
    );
  });
}

export function solveBoard(rowClues: Clue[], colClues: Clue[], cells: CellValue[]): SolveResult | null {
  if ([...rowClues, ...colClues].some((clue) => clue.sum === null || clue.bombs === null)) return null;

  const rowPatterns = rowClues.map((clue, row) =>
    allPatterns.filter((pattern) => {
      const sum = pattern.reduce((total, value) => total + value, 0);
      const bombs = pattern.filter((value) => value === 0).length;
      return sum === clue.sum && bombs === clue.bombs && pattern.every((value, col) => {
        const known = cells[row * SIZE + col];
        return known === -1 || known === value;
      });
    }),
  );

  if (rowPatterns.some((patterns) => patterns.length === 0)) {
    return { total: 0, cells: Array.from({ length: SIZE * SIZE }, () => ({ safe: 0, multiplier: 0, values: [0, 0, 0, 0] })) };
  }

  const initial: State = { sums: Array(SIZE).fill(0), bombs: Array(SIZE).fill(0) };
  const layers: Array<Map<string, { state: State; count: number }>> = [new Map([[stateKey(initial), { state: initial, count: 1 }]])];

  for (let row = 0; row < SIZE; row += 1) {
    const next = new Map<string, { state: State; count: number }>();
    for (const { state, count } of layers[row].values()) {
      for (const pattern of rowPatterns[row]) {
        const candidate = addPattern(state, pattern);
        if (!transitionValid(candidate, colClues, SIZE - row - 1)) continue;
        const key = stateKey(candidate);
        const existing = next.get(key);
        if (existing) existing.count += count;
        else next.set(key, { state: candidate, count });
      }
    }
    layers.push(next);
  }

  const goal: State = {
    sums: colClues.map((clue) => clue.sum as number),
    bombs: colClues.map((clue) => clue.bombs as number),
  };
  const total = layers[SIZE].get(stateKey(goal))?.count ?? 0;
  const valueCounts = Array.from({ length: SIZE * SIZE }, () => [0, 0, 0, 0] as [number, number, number, number]);
  if (total === 0) return { total, cells: valueCounts.map(() => ({ safe: 0, multiplier: 0, values: [0, 0, 0, 0] })) };

  const memo = new Map<string, number>();
  const suffixCount = (row: number, state: State): number => {
    if (row === SIZE) return stateKey(state) === stateKey(goal) ? 1 : 0;
    const memoKey = `${row}:${stateKey(state)}`;
    const cached = memo.get(memoKey);
    if (cached !== undefined) return cached;
    let count = 0;
    for (const pattern of rowPatterns[row]) {
      const candidate = addPattern(state, pattern);
      if (transitionValid(candidate, colClues, SIZE - row - 1)) count += suffixCount(row + 1, candidate);
    }
    memo.set(memoKey, count);
    return count;
  };

  for (let row = 0; row < SIZE; row += 1) {
    for (const { state, count: prefixCount } of layers[row].values()) {
      for (const pattern of rowPatterns[row]) {
        const candidate = addPattern(state, pattern);
        if (!transitionValid(candidate, colClues, SIZE - row - 1)) continue;
        const completions = suffixCount(row + 1, candidate);
        if (!completions) continue;
        const paths = prefixCount * completions;
        pattern.forEach((value, col) => { valueCounts[row * SIZE + col][value] += paths; });
      }
    }
  }

  return {
    total,
    cells: valueCounts.map((counts) => ({
      safe: (total - counts[0]) / total,
      multiplier: (counts[2] * 2 + counts[3] * 3) / total,
      values: counts.map((count) => count / total) as [number, number, number, number],
    })),
  };
}
