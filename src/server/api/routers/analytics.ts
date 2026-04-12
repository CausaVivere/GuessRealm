import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

type DailyVisitRow = {
  date: Date;
  visits: number;
};

type NumericRow = {
  value: number;
};

type OnlineBucketRow = {
  bucketStart: Date;
  players: number;
};

function getUtcDayStart(date = new Date()) {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  return dayStart;
}

function formatDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export const analyticsRouter = createTRPCRouter({
  getDashboard: protectedProcedure
    .input(
      z
        .object({
          days: z.number().int().min(7).max(90).default(30),
          onlineHours: z.number().int().min(6).max(72).default(24),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const days = input?.days ?? 30;
      const onlineHours = input?.onlineHours ?? 24;

      const startDay = getUtcDayStart();
      startDay.setUTCDate(startDay.getUTCDate() - (days - 1));

      const [dailyVisitRows, totalVisitRows, todayVisitRows, onlineBucketRows] =
        await Promise.all([
          ctx.db.$queryRaw<DailyVisitRow[]>`
            SELECT date, visits
            FROM analytics_daily_visits
            WHERE date >= ${startDay}
            ORDER BY date ASC
          `,
          ctx.db.$queryRaw<NumericRow[]>`
            SELECT COALESCE(SUM(visits)::int, 0) AS value
            FROM analytics_daily_visits
          `,
          ctx.db.$queryRaw<NumericRow[]>`
            SELECT COALESCE((
              SELECT visits
              FROM analytics_daily_visits
              WHERE date = CURRENT_DATE
            )::int, 0) AS value
          `,
          ctx.db.$queryRaw<OnlineBucketRow[]>`
            SELECT
              bucket_start AS "bucketStart",
              COALESCE(SUM(player_count)::int, 0) AS players
            FROM analytics_online_snapshots
            WHERE bucket_start >= NOW() - (${onlineHours} * INTERVAL '1 hour')
            GROUP BY bucket_start
            ORDER BY bucket_start ASC
          `,
        ]);

      const [currentOnlineRows, peakOnlineRows] = await Promise.all([
        ctx.db.$queryRaw<NumericRow[]>`
          WITH recent AS (
            SELECT DISTINCT ON (room_id)
              room_id,
              player_count,
              bucket_start
            FROM analytics_online_snapshots
            WHERE bucket_start >= NOW() - INTERVAL '2 minutes'
            ORDER BY room_id, bucket_start DESC
          )
          SELECT COALESCE(SUM(player_count)::int, 0) AS value
          FROM recent
        `,
        ctx.db.$queryRaw<NumericRow[]>`
          SELECT COALESCE(MAX(players), 0)::int AS value
          FROM (
            SELECT SUM(player_count)::int AS players
            FROM analytics_online_snapshots
            WHERE bucket_start >= NOW() - INTERVAL '24 hours'
            GROUP BY bucket_start
          ) buckets
        `,
      ]);

      const dailyVisitMap = new Map(
        dailyVisitRows.map((row) => [
          formatDayKey(new Date(row.date)),
          row.visits,
        ]),
      );

      const visits = Array.from({ length: days }, (_, index) => {
        const day = new Date(startDay);
        day.setUTCDate(startDay.getUTCDate() + index);
        const key = formatDayKey(day);

        return {
          date: key,
          visits: dailyVisitMap.get(key) ?? 0,
        };
      });

      return {
        summary: {
          totalVisits: totalVisitRows[0]?.value ?? 0,
          visitsToday: todayVisitRows[0]?.value ?? 0,
          currentOnlinePlayers: currentOnlineRows[0]?.value ?? 0,
          peakOnlinePlayers24h: peakOnlineRows[0]?.value ?? 0,
        },
        visits,
        online: onlineBucketRows.map((row) => ({
          timestamp: new Date(row.bucketStart).toISOString(),
          players: row.players,
        })),
      };
    }),
});
