import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { gameStats } from "../../../db/schema";

const RECORD_ID = 1;

async function readRecord() {
  const db = getDb();
  await db.insert(gameStats).values({ id: RECORD_ID }).onConflictDoNothing();
  const [record] = await db.select().from(gameStats).where(eq(gameStats.id, RECORD_ID)).limit(1);
  return record;
}

export async function GET() {
  try {
    return Response.json({ record: await readRecord() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load record" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { result?: "win" | "loss"; coinsEarned?: number };
    if (payload.result !== "win" && payload.result !== "loss") {
      return Response.json({ error: "result must be win or loss" }, { status: 400 });
    }
    const coinsEarned = payload.coinsEarned ?? 0;
    if (!Number.isInteger(coinsEarned) || coinsEarned < 0 || coinsEarned > 50_000) {
      return Response.json({ error: "coinsEarned must be a whole number from 0 to 50000" }, { status: 400 });
    }

    await readRecord();
    const db = getDb();
    const increment = payload.result === "win"
      ? {
          wins: sql`${gameStats.wins} + 1`,
          coinBalance: sql`MIN(50000, ${gameStats.coinBalance} + ${coinsEarned})`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        }
      : { losses: sql`${gameStats.losses} + 1`, updatedAt: sql`CURRENT_TIMESTAMP` };
    const [record] = await db
      .update(gameStats)
      .set(increment)
      .where(eq(gameStats.id, RECORD_ID))
      .returning();

    return Response.json({ record });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update record" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as {
      coinBalance?: number;
      targetName?: string;
      targetCost?: number;
    };
    const targetName = payload.targetName?.trim();
    if (
      !Number.isInteger(payload.coinBalance) || payload.coinBalance! < 0 || payload.coinBalance! > 50_000
      || !targetName || targetName.length > 40
      || !Number.isInteger(payload.targetCost) || payload.targetCost! < 1 || payload.targetCost! > 50_000
    ) {
      return Response.json({ error: "Use a balance from 0–50000 and a valid prize name and cost" }, { status: 400 });
    }

    await readRecord();
    const db = getDb();
    const [record] = await db
      .update(gameStats)
      .set({
        coinBalance: payload.coinBalance!,
        targetName,
        targetCost: payload.targetCost!,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(gameStats.id, RECORD_ID))
      .returning();
    return Response.json({ record });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update coin goal" },
      { status: 500 },
    );
  }
}
