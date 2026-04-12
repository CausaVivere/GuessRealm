import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";

const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

const onlineSnapshotSchema = z.object({
  roomId: z.string().min(1).max(128),
  playerCount: z.number().int().min(0).max(1000),
});

function getCurrentMinuteBucket(date = new Date()) {
  const bucket = new Date(date);
  bucket.setUTCSeconds(0, 0);
  return bucket;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-internal-secret");
  if (!INTERNAL_SECRET || auth !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = onlineSnapshotSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const bucketStart = getCurrentMinuteBucket();

  try {
    await db.$executeRaw`
      INSERT INTO analytics_online_snapshots
        (bucket_start, room_id, player_count, created_at)
      VALUES
        (${bucketStart}, ${parsed.data.roomId}, ${parsed.data.playerCount}, NOW())
      ON CONFLICT (bucket_start, room_id)
      DO UPDATE SET player_count = EXCLUDED.player_count
    `;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
