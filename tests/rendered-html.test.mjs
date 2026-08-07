import assert from "node:assert/strict";
import test from "node:test";
import { solveBoard } from "../app/solver.ts";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders Voltorb Lab", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Voltorb Lab — Voltorb Flip Solver<\/title>/i);
  assert.match(html, /Flip smarter/);
  assert.match(html, /Voltorb Flip solver/);
  assert.match(html, /Load example/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("solver returns exact probabilities for a valid board", () => {
  const board = [
    1, 1, 2, 0, 1,
    1, 3, 1, 1, 0,
    2, 1, 0, 1, 2,
    0, 1, 1, 2, 1,
    1, 2, 1, 0, 3,
  ];
  const clues = (byRow) => Array.from({ length: 5 }, (_, outer) => {
    const values = Array.from({ length: 5 }, (_, inner) =>
      board[byRow ? outer * 5 + inner : inner * 5 + outer],
    );
    return {
      sum: values.reduce((total, value) => total + value, 0),
      bombs: values.filter((value) => value === 0).length,
    };
  });

  const result = solveBoard(clues(true), clues(false), Array(25).fill(-1));
  assert.ok(result);
  assert.equal(result.total, 10164);
  assert.equal(result.cells.filter((cell) => cell.safe === 1).length, 5);
  result.cells.forEach((cell) => {
    assert.ok(cell.safe >= 0 && cell.safe <= 1);
    assert.ok(Math.abs(cell.values.reduce((sum, value) => sum + value, 0) - 1) < 1e-10);
  });
});

test("solver rejects a revealed tile that conflicts with its clues", () => {
  const clues = Array.from({ length: 5 }, () => ({ sum: 5, bombs: 0 }));
  const cells = Array(25).fill(-1);
  cells[0] = 0;
  assert.equal(solveBoard(clues, clues, cells)?.total, 0);
});
