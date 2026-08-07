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
    const payload = (await request.json()) as { result?: "win" | "loss" };
    if (payload.result !== "win" && payload.result !== "loss") {
      return Response.json({ error: "result must be win or loss" }, { status: 400 });
    }

    await readRecord();
    const db = getDb();
    const increment = payload.result === "win"
      ? { wins: sql`${gameStats.wins} + 1`, updatedAt: sql`CURRENT_TIMESTAMP` }
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
