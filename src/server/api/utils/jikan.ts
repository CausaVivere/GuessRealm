import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import type { Prisma } from "../../../../generated/prisma/client";

export async function cacheAnime(animeId: string) {
  const animeRes = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`, {
    method: "GET",
  });

  if (!animeRes.ok) {
    console.error("Failed to fetch characters from Jikan:", animeRes);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Failed to fetch characters",
    });
  }

  const animeObject = await animeRes.json();
  const anime = animeObject.data as AnimeObject;

  if (!anime)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Failed to fetch anime, might not exist",
    });

  try {
    const animeData = formatAnime(anime);
    const connectEntities = (entities: JikanEntity[], kind: EntityKind) =>
      entities.map((e) => ({ id: toEntityId(kind, e.mal_id) }));

    // Pre-create all JikanEntities so the upsert can just connect to them
    const allEntities: { entity: JikanEntity; kind: EntityKind }[] = [
      ...anime.studios.map((entity) => ({ entity, kind: "studio" as const })),
      ...anime.genres.map((entity) => ({ entity, kind: "genre" as const })),
      ...anime.explicit_genres.map((entity) => ({
        entity,
        kind: "explicitGenre" as const,
      })),
      ...anime.themes.map((entity) => ({ entity, kind: "theme" as const })),
      ...anime.demographics.map((entity) => ({
        entity,
        kind: "demographic" as const,
      })),
    ];

    if (allEntities.length > 0) {
      await db.jikanEntity.createMany({
        data: allEntities.map(({ entity, kind }) => ({
          id: toEntityId(kind, entity.mal_id),
          name: entity.name,
          // Persist our normalized category so DB rows remain internally consistent.
          type: kind,
          url: entity.url,
        })),
        skipDuplicates: true,
      });
    }

    const data = await db.anime.upsert({
      where: { id: anime.mal_id },
      update: {
        ...animeData,
        studios: { set: connectEntities(anime.studios, "studio") },
        genres: { set: connectEntities(anime.genres, "genre") },
        explicitGenres: {
          set: connectEntities(anime.explicit_genres, "explicitGenre"),
        },
        themes: { set: connectEntities(anime.themes, "theme") },
        demographics: {
          set: connectEntities(anime.demographics, "demographic"),
        },
      },
      create: {
        id: anime.mal_id,
        ...animeData,
        studios: { connect: connectEntities(anime.studios, "studio") },
        genres: { connect: connectEntities(anime.genres, "genre") },
        explicitGenres: {
          connect: connectEntities(anime.explicit_genres, "explicitGenre"),
        },
        themes: { connect: connectEntities(anime.themes, "theme") },
        demographics: {
          connect: connectEntities(anime.demographics, "demographic"),
        },
      },
      include: {
        studios: true,
        genres: true,
        explicitGenres: true,
        themes: true,
        demographics: true,
      },
    });
    return data;
  } catch (err) {
    console.error("Failed to cache anime:", err);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to cache anime",
    });
  }
}

type EntityKind =
  | "studio"
  | "genre"
  | "explicitGenre"
  | "theme"
  | "demographic";

const ENTITY_ID_OFFSET: Record<EntityKind, number> = {
  studio: 0,
  genre: 200000000,
  explicitGenre: 400000000,
  theme: 600000000,
  demographic: 800000000,
};

function toEntityId(kind: EntityKind, malId: number): number {
  return ENTITY_ID_OFFSET[kind] + malId;
}

export async function cacheAnimeCharacters(animeId: number) {
  const response = await fetch(
    `https://api.jikan.moe/v4/anime/${animeId}/characters`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    console.error("Failed to fetch characters from Jikan:", response);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Failed to fetch characters",
    });
  }

  try {
    const characters = (await response.json()).data as CharacterObject[];

    await db.$transaction([
      db.animeCharacter.createMany({
        data: characters.map((char) => ({
          id: char.character.mal_id,
          animeId: animeId,
          name: char.character.name,
          url: char.character.url,
          image: char.character.images.jpg.image_url,
          role: char.role,
          favorites: char.favorites,
        })),
        skipDuplicates: true,
      }),

      db.voiceActor.createMany({
        data: characters.flatMap((char) =>
          char.voice_actors.map((va) => ({
            id: va.person.mal_id,
            url: va.person.url,
            image: va.person.images.jpg.image_url,
            name: va.person.name,
            language: va.language,
          })),
        ),
        skipDuplicates: true,
      }),
    ]);

    // Link voice actors to characters via a single raw INSERT into the join table
    const pairs = characters.flatMap((char) =>
      char.voice_actors.map((va) => [char.character.mal_id, va.person.mal_id]),
    );

    if (pairs.length > 0) {
      const values = pairs
        .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
        .join(", ");
      await db.$executeRawUnsafe(
        `INSERT INTO "_AnimeCharacterToVoiceActor" ("A", "B") VALUES ${values} ON CONFLICT DO NOTHING`,
        ...pairs.flat(),
      );
    }

    const data = await db.animeCharacter.findMany({
      where: { animeId },
    });

    return data;
  } catch (err) {
    console.error("Failed to cache anime characters:", err);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to cache anime characters",
    });
  }
}

export async function refreshAnimeCharacters(animeId: number) {
  const response = await fetch(
    `https://api.jikan.moe/v4/anime/${animeId}/characters`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    console.error("Failed to fetch characters from Jikan:", response);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Failed to fetch characters",
    });
  }

  try {
    const characters = (await response.json()).data as CharacterObject[];

    const characterUpserts = characters.map((char) => {
      const image = char.character.images?.jpg?.image_url ?? null;
      const updateData: Prisma.AnimeCharacterUpdateInput = {
        animeId,
        name: char.character.name,
        url: char.character.url,
        role: char.role,
        favorites: char.favorites ?? 0,
        ...(image ? { image } : {}),
      };

      return db.animeCharacter.upsert({
        where: { id: char.character.mal_id },
        update: updateData,
        create: {
          id: char.character.mal_id,
          animeId,
          name: char.character.name,
          url: char.character.url,
          image,
          role: char.role,
          favorites: char.favorites ?? 0,
        },
      });
    });

    const voiceActorUpserts = characters.flatMap((char) =>
      char.voice_actors.map((va) => {
        const image = va.person.images?.jpg?.image_url ?? null;
        const updateData: Prisma.VoiceActorUpdateInput = {
          name: va.person.name,
          url: va.person.url,
          ...(image ? { image } : {}),
        };

        return db.voiceActor.upsert({
          where: { id: va.person.mal_id },
          update: updateData,
          create: {
            id: va.person.mal_id,
            url: va.person.url,
            image,
            name: va.person.name,
            language: va.language,
          },
        });
      }),
    );

    const upserts = [...characterUpserts, ...voiceActorUpserts];
    if (upserts.length > 0) {
      const batchSize = 20;

      for (let i = 0; i < upserts.length; i += batchSize) {
        await Promise.all(upserts.slice(i, i + batchSize));
      }
    }

    const pairs = characters.flatMap((char) =>
      char.voice_actors.map((va) => [char.character.mal_id, va.person.mal_id]),
    );

    if (pairs.length > 0) {
      const values = pairs
        .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
        .join(", ");
      await db.$executeRawUnsafe(
        `INSERT INTO "_AnimeCharacterToVoiceActor" ("A", "B") VALUES ${values} ON CONFLICT DO NOTHING`,
        ...pairs.flat(),
      );
    }

    const data = await db.animeCharacter.findMany({
      where: { animeId },
    });

    return data;
  } catch (err) {
    console.error("Failed to refresh anime characters:", err);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to refresh anime characters",
    });
  }
}

export function formatAnime(anime: AnimeObject) {
  return {
    url: anime.url,
    image: anime.images?.jpg?.image_url,
    smallImage: anime.images?.jpg?.small_image_url,
    largeImage: anime.images?.jpg?.large_image_url,
    title: anime.title,
    titleEnglish: anime.title_english,
    titleJapanese: anime.title_japanese,
    titleSynonyms: anime.title_synonyms,
    type: anime.type,
    source: anime.source,
    episodes: anime.episodes,
    status: anime.status,
    airing: anime.airing,
    airedFrom: anime.aired?.from ? new Date(anime.aired.from) : null,
    airedTo: anime.aired?.to ? new Date(anime.aired.to) : null,
    airedString: anime.aired?.string,
    rating: anime.rating,
    score: anime.score,
    season: anime.season,
    year: anime.year,
  };
}

export type AnimeGameSet = Prisma.AnimeGamesetGetPayload<{
  include: {
    characters: {
      include: {
        voiceActors: true;
        anime: {
          include: {
            genres: true;
            explicitGenres: true;
            demographics: true;
            themes: true;
          };
        };
      };
    };
  };
}>;

export type AnimeCharacter = Prisma.AnimeCharacterGetPayload<{
  include: {
    voiceActors: true;
    anime: {
      include: {
        genres: true;
        explicitGenres: true;
        demographics: true;
        themes: true;
      };
    };
  };
}>;

export type AnimeObject = {
  mal_id: number;
  url: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
    webp: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  trailer: {
    youtube_id: string | null;
    url: string | null;
    embed_url: string | null;
    images: {
      image_url: string | null;
      small_image_url: string | null;
      medium_image_url: string | null;
      large_image_url: string | null;
      maximum_image_url: string | null;
    } | null;
  };
  approved: boolean;
  titles: {
    type: string;
    title: string;
  }[];
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  title_synonyms: string[];
  type: string | null;
  source: string | null;
  episodes: number | null;
  status: string | null;
  airing: boolean;
  aired: {
    from: string | null;
    to: string | null;
    prop: {
      from: { day: number | null; month: number | null; year: number | null };
      to: { day: number | null; month: number | null; year: number | null };
    };
    string: string | null;
  };
  duration: string | null;
  rating: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background: string | null;
  season: string | null;
  year: number | null;
  broadcast: {
    day: string | null;
    time: string | null;
    timezone: string | null;
    string: string | null;
  };
  producers: JikanEntity[];
  licensors: JikanEntity[];
  studios: JikanEntity[];
  genres: JikanEntity[];
  explicit_genres: JikanEntity[];
  themes: JikanEntity[];
  demographics: JikanEntity[];
};

export type JikanEntity = {
  mal_id: number;
  type: string;
  name: string;
  url: string;
};

export type CharacterObject = {
  character: {
    mal_id: number;
    url: string;
    images: {
      jpg: {
        image_url: string;
      };
      webp: {
        image_url: string;
        small_image_url: string;
      };
    };
    name: string;
  };
  role: string;
  favorites: number;
  voice_actors: {
    person: {
      mal_id: number;
      url: string;
      images: {
        jpg: {
          image_url: string;
        };
      };
      name: string;
    };
    language: string;
  }[];
};
