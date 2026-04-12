import { NextResponse, type NextRequest } from "next/server";
import type { AnimeGameSet } from "~/server/api/utils/jikan";
import { db } from "~/server/db";

// Simple shared-secret auth so only PartyKit can call this
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Verify the secret header
  const auth = req.headers.get("x-internal-secret");
  if (!INTERNAL_SECRET || auth !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let set: AnimeGameSet | null = null;

  if (id === "random") {
    const count = await db.animeGameset.count();
    const randomIndex = Math.floor(Math.random() * count);
    const randomSet = await db.animeGameset.findMany({
      skip: randomIndex,
      take: 1,
      include: {
        characters: {
          include: {
            voiceActors: true,
            anime: {
              include: {
                genres: true,
                explicitGenres: true,
                demographics: true,
                themes: true,
              },
            },
          },
        },
      },
    });
    set = randomSet[0] || null;
  } else if (id === "randomized") {
    const RANDOMIZED_CHARACTER_COUNT = 24;
    const randomizedIds = await db.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM "AnimeCharacter"
      WHERE POSITION('questionmark_' IN COALESCE(image, '')) = 0
      ORDER BY RANDOM()
      LIMIT ${RANDOMIZED_CHARACTER_COUNT}
    `;

    if (randomizedIds.length > 0) {
      const randomCharacters = await db.animeCharacter.findMany({
        where: {
          id: {
            in: randomizedIds.map((row) => row.id),
          },
        },
        include: {
          voiceActors: true,
          anime: {
            include: {
              genres: true,
              explicitGenres: true,
              demographics: true,
              themes: true,
            },
          },
        },
      });

      const byId = new Map(
        randomCharacters.map((character) => [character.id, character]),
      );
      const orderedCharacters = randomizedIds
        .map((row) => byId.get(row.id))
        .filter((character): character is (typeof randomCharacters)[number] =>
          Boolean(character),
        );

      set = {
        id: "randomized",
        name: "Randomized set",
        img: null,
        creatorId: "system",
        creatorName: "System",
        plays: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        characters: orderedCharacters,
      };
    }
  } else {
    set = await db.animeGameset.findUnique({
      where: { id },
      include: {
        characters: {
          include: {
            voiceActors: true,
            anime: {
              include: {
                genres: true,
                explicitGenres: true,
                demographics: true,
                themes: true,
              },
            },
          },
        },
      },
    });
  }

  if (!set) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(set);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Verify the secret header
  const auth = req.headers.get("x-internal-secret");
  if (!INTERNAL_SECRET || auth !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (id === "randomized") {
    return NextResponse.json({ id });
  }

  const set = await db.animeGameset.update({
    where: { id },
    data: {
      plays: {
        increment: 1,
      },
    },
    select: { id: true },
  });

  if (!set) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(set);
}
