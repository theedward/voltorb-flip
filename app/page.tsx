"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { solveBoard, type CellValue, type Clue } from "./solver";

const SIZE = 5;
const UNKNOWN = -1 as const;
const emptyClues = (): Clue[] => Array.from({ length: SIZE }, () => ({ sum: null, bombs: null }));
const emptyCells = (): CellValue[] => Array<CellValue>(SIZE * SIZE).fill(UNKNOWN);
type RecordScore = { wins: number; losses: number };
type RoundState = "playing" | "lost" | "won";

const demoBoard = [
  1, 1, 2, 0, 1,
  1, 3, 1, 1, 0,
  2, 1, 0, 1, 2,
  0, 1, 1, 2, 1,
  1, 2, 1, 0, 3,
];

function cluesFromBoard(board: number[], byRow: boolean): Clue[] {
  return Array.from({ length: SIZE }, (_, outer) => {
    const values = Array.from({ length: SIZE }, (_, inner) =>
      board[byRow ? outer * SIZE + inner : inner * SIZE + outer],
    );
    return {
      sum: values.reduce((total, value) => total + value, 0),
      bombs: values.filter((value) => value === 0).length,
    };
  });
}

function VoltorbMark({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "voltorb voltorb--small" : "voltorb"} aria-hidden="true">
      <span className="voltorb__eye voltorb__eye--left" />
      <span className="voltorb__eye voltorb__eye--right" />
    </span>
  );
}

function ClueInput({
  clue,
  label,
  onChange,
}: {
  clue: Clue;
  label: string;
  onChange: (next: Clue) => void;
}) {
  const parse = (value: string, max: number) =>
    value === "" ? null : Math.min(max, Math.max(0, Number.parseInt(value, 10) || 0));

  return (
    <div className="clue-card" aria-label={label}>
      <label>
        <span className="clue-icon">◆</span>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={clue.sum ?? ""}
          onChange={(event) => onChange({ ...clue, sum: parse(event.target.value, 15) })}
          aria-label={`${label} point total`}
          placeholder="–"
        />
      </label>
      <label>
        <VoltorbMark small />
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={clue.bombs ?? ""}
          onChange={(event) => onChange({ ...clue, bombs: parse(event.target.value, 5) })}
          aria-label={`${label} Voltorb count`}
          placeholder="–"
        />
      </label>
    </div>
  );
}

export default function Home() {
  const [rowClues, setRowClues] = useState<Clue[]>(emptyClues);
  const [colClues, setColClues] = useState<Clue[]>(emptyClues);
  const [cells, setCells] = useState<CellValue[]>(emptyCells);
  const [brush, setBrush] = useState<0 | 1 | 2 | 3 | -1>(1);
  const [showHelp, setShowHelp] = useState(false);
  const [record, setRecord] = useState<RecordScore | null>(null);
  const [roundState, setRoundState] = useState<RoundState>("playing");
  const [recordSyncFailed, setRecordSyncFailed] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const solved = useMemo(() => solveBoard(rowClues, colClues, cells), [rowClues, colClues, cells]);
  const cluesReady = [...rowClues, ...colClues].every(
    (clue) => clue.sum !== null && clue.bombs !== null,
  );

  const bestIndex = useMemo(() => {
    if (!solved || solved.total === 0) return -1;
    let best = -1;
    let score = -Infinity;
    solved.cells.forEach((cell, index) => {
      if (cells[index] !== UNKNOWN) return;
      const current = cell.safe * 100 + cell.multiplier * 7;
      if (current > score) {
        score = current;
        best = index;
      }
    });
    return best;
  }, [solved, cells]);

  const reset = useCallback(() => {
    setRowClues(emptyClues());
    setColClues(emptyClues());
    setCells(emptyCells());
  }, []);

  const recordResult = useCallback(async (result: "win" | "loss") => {
    setRecordSyncFailed(false);
    setRecord((current) => ({
      wins: (current?.wins ?? 0) + (result === "win" ? 1 : 0),
      losses: (current?.losses ?? 0) + (result === "loss" ? 1 : 0),
    }));
    try {
      const response = await fetch("/api/record", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ result }),
      });
      if (!response.ok) throw new Error("Record update failed");
      const payload = (await response.json()) as { record: RecordScore };
      setRecord(payload.record);
    } catch {
      setRecordSyncFailed(true);
    }
  }, []);

  const setCell = (index: number) => {
    if (roundState !== "playing") return;
    const previous = cells[index];
    const next = previous === brush ? UNKNOWN : brush;
    const nextCells = cells.map((value, i) => (i === index ? next : value));
    setCells(nextCells);
    if (next === 0 && previous !== 0) {
      setRoundState("lost");
      void recordResult("loss");
      return;
    }
    const nextSolved = solveBoard(rowClues, colClues, nextCells);
    const hasRevealedMultiplier = nextCells.some((value) => value === 2 || value === 3);
    const multipliersRemain = nextSolved?.cells.some((cell, cellIndex) =>
      nextCells[cellIndex] === UNKNOWN && cell.values[2] + cell.values[3] > 1e-12,
    );
    if (cluesReady && nextSolved && nextSolved.total > 0 && hasRevealedMultiplier && !multipliersRemain) {
      setRoundState("won");
      void recordResult("win");
    }
  };

  const loadDemo = () => {
    setRowClues(cluesFromBoard(demoBoard, true));
    setColClues(cluesFromBoard(demoBoard, false));
    setCells(emptyCells());
    setRoundState("playing");
  };

  useEffect(() => {
    let active = true;
    fetch("/api/record")
      .then((response) => {
        if (!response.ok) throw new Error("Record unavailable");
        return response.json() as Promise<{ record: RecordScore }>;
      })
      .then((payload) => { if (active) setRecord(payload.record); })
      .catch(() => { if (active) setRecordSyncFailed(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (roundState === "playing") return;
    const timeout = window.setTimeout(() => {
      reset();
      setRoundState("playing");
    }, roundState === "lost" ? 2400 : 2000);
    return () => window.clearTimeout(timeout);
  }, [reset, roundState]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      const key = event.key.toLowerCase();
      if (["1", "2", "3"].includes(key)) setBrush(Number(key) as 1 | 2 | 3);
      if (key === "v" || key === "0") setBrush(0);
      if (key === "u" || key === "backspace") setBrush(UNKNOWN);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const status = !cluesReady
    ? { eyebrow: "AWAITING CLUES", title: "Enter the edge numbers", detail: "The board updates the instant all 10 clues are filled." }
    : !solved || solved.total === 0
      ? { eyebrow: "NO MATCH", title: "Something conflicts", detail: "Check the clues or tap a revealed tile again to clear it." }
      : solved.cells.some((cell, index) => cells[index] === UNKNOWN && cell.safe === 1)
        ? { eyebrow: "SAFE FLIP FOUND", title: "Green means go", detail: `${solved.cells.filter((cell, index) => cells[index] === UNKNOWN && cell.safe === 1).length} guaranteed safe ${solved.cells.filter((cell, index) => cells[index] === UNKNOWN && cell.safe === 1).length === 1 ? "tile" : "tiles"}.` }
        : { eyebrow: "RISK REQUIRED", title: "Best odds highlighted", detail: "The pulsing tile has the strongest survival odds, with multiplier potential breaking ties." };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Voltorb Lab home">
          <VoltorbMark />
          <span>VOLTORB<span>{"//"}</span>LAB</span>
        </a>
        <div className="top-actions">
          <div className="record-chip" aria-label={`${record?.wins ?? 0} wins and ${record?.losses ?? 0} losses`} title={recordSyncFailed ? "Record will retry on the next result" : "Your persistent record"}>
            <span>RECORD</span>
            <strong><i>W</i> {record?.wins ?? "–"}</strong>
            <strong><i>L</i> {record?.losses ?? "–"}</strong>
            <small>{record && record.wins + record.losses > 0 ? `${Math.round(record.wins / (record.wins + record.losses) * 100)}%` : "—"}</small>
          </div>
          <button className="text-button" onClick={loadDemo}>Load example</button>
          <button className="text-button" onClick={() => setShowHelp(true)}>How to use</button>
          <button className="reset-button" onClick={reset}>Reset board <span>↻</span></button>
        </div>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="kicker">GOLDENROD GAME CORNER // UTILITY 01</p>
          <h1>Flip smarter.<br /><em>Keep your coins.</em></h1>
        </div>
        <p className="hero-copy">An exact, instant solver for the most deceptively stressful game in Johto. Enter the clues. Reveal what you know. Make the best move.</p>
      </section>

      <section className={`workspace workspace--${roundState}`} aria-label="Voltorb Flip solver">
        <aside className="status-panel">
          <div className="status-light" />
          <p className="status-eyebrow">{status.eyebrow}</p>
          <h2>{status.title}</h2>
          <p>{status.detail}</p>
          {solved && solved.total > 0 && (
            <div className="possibility-count">
              <span>VALID BOARDS</span>
              <strong>{solved.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
            </div>
          )}
          <div className="legend">
            <div><span className="legend-swatch legend-swatch--safe" />Guaranteed safe</div>
            <div><span className="legend-swatch legend-swatch--best" />Best available</div>
            <div><span className="legend-swatch legend-swatch--risk" />Voltorb risk</div>
          </div>
          <p className="solver-mode"><strong>LEVEL NOTE</strong> Level changes the game’s board mix, but not guaranteed deductions from these clues.</p>
          <button
            className="win-button"
            disabled={!cluesReady || roundState !== "playing" || !cells.some((value) => value === 2 || value === 3)}
            onClick={() => {
              setRoundState("won");
              void recordResult("win");
            }}
            title="Use only when the game announces that the board is cleared"
          >
            <span><strong>Game says I won</strong><small>Manual result</small></span>
            <i>Record win →</i>
          </button>
        </aside>

        <div className="game-area">
          <div className={`board-shell ${roundState !== "playing" ? "board-shell--locked" : ""}`} ref={boardRef}>
            <div className="grid board-grid">
              {cells.map((value, index) => {
                const probability = solved?.cells[index];
                const isUnknown = value === UNKNOWN;
                const isSafe = isUnknown && probability?.safe === 1;
                const isBest = isUnknown && index === bestIndex && !isSafe;
                const bombRisk = probability ? 1 - probability.safe : null;
                return (
                  <button
                    key={index}
                    className={`tile ${isSafe ? "tile--safe" : ""} ${isBest ? "tile--best" : ""} ${!isUnknown ? "tile--revealed" : ""}`}
                    onClick={() => setCell(index)}
                    disabled={roundState !== "playing"}
                    aria-label={`Row ${Math.floor(index / SIZE) + 1}, column ${(index % SIZE) + 1}${isUnknown && probability ? `, ${Math.round(probability.safe * 100)} percent safe` : ""}`}
                  >
                    {value === UNKNOWN ? (
                      probability && solved?.total ? (
                        <>
                          <strong>{Math.round(probability.safe * 100)}<small>%</small></strong>
                          <span className="tile-note">{isSafe ? "SAFE" : bombRisk !== null && bombRisk >= 0.5 ? "CAUTION" : "FLIP ODDS"}</span>
                          <span className="risk-meter"><i style={{ width: `${Math.round((bombRisk ?? 0) * 100)}%` }} /></span>
                        </>
                      ) : <span className="tile-unknown">?</span>
                    ) : value === 0 ? <VoltorbMark /> : <span className={`tile-value tile-value--${value}`}>{value}</span>}
                  </button>
                );
              })}
            </div>
            <div className="grid row-clues">
              {rowClues.map((clue, index) => (
                <ClueInput key={index} clue={clue} label={`Row ${index + 1}`} onChange={(next) => setRowClues((all) => all.map((item, i) => i === index ? next : item))} />
              ))}
            </div>
            <div className="grid col-clues">
              {colClues.map((clue, index) => (
                <ClueInput key={index} clue={clue} label={`Column ${index + 1}`} onChange={(next) => setColClues((all) => all.map((item, i) => i === index ? next : item))} />
              ))}
            </div>
            <div className="corner-mark"><span>Σ</span><small>CLUES</small></div>
            {roundState !== "playing" && (
              <div className={`round-result round-result--${roundState}`} role="status" aria-live="assertive">
                <div className="result-burst" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
                {roundState === "lost" ? <VoltorbMark /> : <span className="result-crown">◆</span>}
                <p>{roundState === "lost" ? "KABOOM" : "BOARD CLEARED"}</p>
                <strong>{roundState === "lost" ? "Loss recorded" : "Win recorded"}</strong>
                <small>New board incoming…</small>
              </div>
            )}
          </div>

          <div className="brush-bar" aria-label="Revealed tile value">
            <div className="brush-label"><span>REVEALED TILE</span><small>Choose, then tap the board</small></div>
            {([1, 2, 3, 0, -1] as const).map((value) => (
              <button
                key={value}
                onClick={() => setBrush(value)}
                disabled={roundState !== "playing"}
                className={brush === value ? "active" : ""}
                aria-pressed={brush === value}
                title={value === -1 ? "Clear tile (U)" : value === 0 ? "Voltorb (V)" : `Revealed ${value} (${value})`}
              >
                {value === 0 ? <VoltorbMark small /> : value === -1 ? "×" : value}
                <kbd>{value === 0 ? "V" : value === -1 ? "U" : value}</kbd>
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <span>UNOFFICIAL FAN TOOL</span>
        <p>No guesses disguised as certainty. Every percentage is calculated from all boards that fit your clues.</p>
        <span>v1.0 // JOHTO</span>
      </footer>

      {showHelp && (
        <div className="modal-backdrop">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
            <button className="modal-close" onClick={() => setShowHelp(false)} aria-label="Close help">×</button>
            <p className="kicker">THREE QUICK STEPS</p>
            <h2 id="help-title">From clues to coins</h2>
            <ol>
              <li><strong>Copy the edge clues.</strong> ◆ is the point total; the red face is the Voltorb count.</li>
              <li><strong>Flip a green tile.</strong> 100% means no possible matching board has a Voltorb there.</li>
              <li><strong>Record the result.</strong> Choose 1, 2, 3, or Voltorb below the board, then tap that tile.</li>
              <li><strong>Your record is automatic.</strong> Voltorbs count as losses; uncovering every multiplier counts as a win. The next board appears after the result animation.</li>
            </ol>
            <button className="primary-button" onClick={() => setShowHelp(false)}>Got it — let’s flip</button>
          </section>
        </div>
      )}
    </main>
  );
}
