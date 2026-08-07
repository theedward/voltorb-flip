import type { Clue } from "./solver";

export type ClueValidation = {
  complete: boolean;
  valid: boolean;
  rowIssues: Array<string | null>;
  colIssues: Array<string | null>;
  globalIssues: string[];
};

function validateLine(clue: Clue): string | null {
  if (clue.sum === null || clue.bombs === null) return null;
  if (!Number.isInteger(clue.sum) || clue.sum < 0 || clue.sum > 15) {
    return "Point total must be a whole number from 0 to 15.";
  }
  if (!Number.isInteger(clue.bombs) || clue.bombs < 0 || clue.bombs > 5) {
    return "Voltorb count must be a whole number from 0 to 5.";
  }

  const nonBombs = 5 - clue.bombs;
  const minimum = nonBombs;
  const maximum = nonBombs * 3;
  if (clue.sum < minimum) {
    return `${clue.bombs} Voltorb${clue.bombs === 1 ? " leaves" : "s leave"} ${nonBombs} numbered tiles, so the total must be at least ${minimum}.`;
  }
  if (clue.sum > maximum) {
    return `${nonBombs} numbered tile${nonBombs === 1 ? " can" : "s can"} total at most ${maximum}.`;
  }
  return null;
}

export function validateClues(rowClues: Clue[], colClues: Clue[]): ClueValidation {
  const rowIssues = rowClues.map(validateLine);
  const colIssues = colClues.map(validateLine);
  const complete = [...rowClues, ...colClues].every(
    (clue) => clue.sum !== null && clue.bombs !== null,
  );
  const globalIssues: string[] = [];

  if (complete && ![...rowIssues, ...colIssues].some(Boolean)) {
    const rowPoints = rowClues.reduce((total, clue) => total + (clue.sum ?? 0), 0);
    const colPoints = colClues.reduce((total, clue) => total + (clue.sum ?? 0), 0);
    const rowBombs = rowClues.reduce((total, clue) => total + (clue.bombs ?? 0), 0);
    const colBombs = colClues.reduce((total, clue) => total + (clue.bombs ?? 0), 0);
    if (rowPoints !== colPoints) {
      globalIssues.push(`Row points total ${rowPoints}, but column points total ${colPoints}. Recheck one of the clues.`);
    }
    if (rowBombs !== colBombs) {
      globalIssues.push(`Rows contain ${rowBombs} Voltorbs, but columns contain ${colBombs}. Recheck one of the clues.`);
    }
  }

  return {
    complete,
    valid: complete && ![...rowIssues, ...colIssues].some(Boolean) && globalIssues.length === 0,
    rowIssues,
    colIssues,
    globalIssues,
  };
}
