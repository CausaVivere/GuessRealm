import { NextResponse } from "next/server";
import { db } from "~/server/db";

function getUtcDayStart(date = new Date()) {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  return dayStart;
}

export async function POST() {
  try {
    const dayStart = getUtcDayStart();

    await db.$executeRaw`
      INSERT INTO analytics_daily_visits (date, visits, created_at, updated_at)
      VALUES (${dayStart}, 1, NOW(), NOW())
      ON CONFLICT (date)
      DO UPDATE SET
        visits = analytics_daily_visits.visits + 1,
        updated_at = NOW()
    `;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
