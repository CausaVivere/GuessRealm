import { Heart } from "lucide-react";
import Image from "next/image";
import { cn } from "~/lib/utils";
import type { AnimeCharacter } from "~/server/api/utils/jikan";

export default function AnimeCharacterInfo({
  character,
  className,
  ...props
}: {
  character: AnimeCharacter;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const anime = character?.anime;

  if (!character) {
    return (
      <div
        className={cn(
          "border-accent flex flex-col gap-5 rounded-xl border p-5",
          className,
        )}
        {...props}
      >
        <p>Character not found</p>
      </div>
    );
  }

  if (!anime) {
    return (
      <div
        className={cn(
          "border-accent flex flex-col gap-5 rounded-xl border p-5",
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-4">
          <Image
            alt={character.name ?? "Character Image"}
            src={character.image!}
            width={150}
            height={300}
            className="rounded-lg"
          />
          <div className="">
            <p className="text-lg font-bold 2xl:text-2xl"> {character.name}</p>
            <div className="flex gap-3">
              <p className="text-lg font-semibold 2xl:text-xl">
                {" "}
                {character.role}
              </p>
              <p className="inline-flex items-center gap-1 text-lg font-semibold 2xl:text-xl">
                <Heart className="h-5 w-5" />
                {character.favorites}
              </p>
            </div>
            <p className="text-muted-foreground pt-2 text-xs 2xl:text-sm">
              Anime details unavailable for this character payload.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const genres = anime.genres?.map((g) => g.name).filter(Boolean) ?? [];
  const explicitGenres =
    anime.explicitGenres?.map((g) => g.name).filter(Boolean) ?? [];
  const themes = anime.themes?.map((t) => t.name).filter(Boolean) ?? [];
  const demographics =
    anime.demographics?.map((d) => d.name).filter(Boolean) ?? [];

  const tags = [
    ...genres.map((t) => ({ t, k: "genre" })),
    ...explicitGenres.map((t) => ({ t, k: "explicit" })),
    ...themes.map((t) => ({ t, k: "theme" })),
    ...demographics.map((t) => ({ t, k: "demo" })),
  ];

  return (
    <div
      className={cn(
        "border-accent flex flex-col gap-5 rounded-xl border p-5",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-4">
        <Image
          alt={character.name}
          src={character.image!}
          width={150}
          height={300}
          className="max-h-28 max-w-20 rounded-lg 2xl:max-h-none 2xl:max-w-none"
        />
        <div className="w-full">
          <p className="text-xl font-bold 2xl:text-3xl"> {character.name}</p>
          <div className="flex gap-3">
            <p className="text-base font-semibold 2xl:text-lg">
              {" "}
              {character.role}
            </p>
            <p className="inline-flex items-center gap-1 text-lg font-semibold 2xl:text-xl">
              <Heart className="h-5 w-5" />
              {character.favorites}
            </p>
          </div>
          <div className="ml-auto flex flex-col gap-2">
            {character.voiceActors
              .filter(
                (va) => va.language === "Japanese" || va.language === "English",
              )
              .map((va) => (
                <a
                  key={`${va.language}-${va.name}`}
                  className="flex cursor-pointer gap-2 text-sm"
                  href={va.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="text-muted-foreground">{va.language}:</span>
                  <span className="font-medium">{va.name}</span>
                </a>
              ))}
          </div>
        </div>
      </div>

      {/* anime info */}
      <div className="flex items-start gap-4">
        <Image
          alt={anime.title}
          src={anime.image!}
          width={150}
          height={300}
          className="max-h-28 max-w-20 rounded-lg 2xl:max-h-none 2xl:max-w-none"
        />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col">
            <p className="text-lg leading-tight font-bold 2xl:text-xl">
              {anime.title}
            </p>
            {anime.titleEnglish && anime.titleEnglish !== anime.title ? (
              <p className="text-muted-foreground text-sm">
                {anime.titleEnglish}
              </p>
            ) : null}
            {anime.titleJapanese ? (
              <p className="text-muted-foreground text-xs">
                {anime.titleJapanese}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-x-1 gap-y-1 2xl:gap-x-4">
            <CompactStat label="Type" value={anime.type} />
            <CompactStat label="Source" value={anime.source} />
            <CompactStat label="Episodes" value={anime.episodes} />
            <CompactStat label="Status" value={anime.status} />
            <CompactStat label="Season" value={anime.season} />
            <CompactStat label="Year" value={anime.year} />
            <CompactStat label="Rating" value={anime.rating} />
            <CompactStat label="Score" value={anime.score} />
          </div>

          {anime.airedString ? (
            <div className="text-muted-foreground text-xs">
              Aired: {anime.airedString}
            </div>
          ) : null}

          {tags.length ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {tags.slice(0, 10).map(({ t, k }, idx) => (
                <Chip key={`${k}-${t}-${idx}`}>{t}</Chip>
              ))}
              {tags.length > 10 ? <Chip>+{tags.length - 10} more</Chip> : null}
            </div>
          ) : null}

          {anime.url ? (
            <a
              href={anime.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary text-xs underline underline-offset-4"
            >
              View on MAL
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-1 text-xs">
      {children}
    </span>
  );
}

function CompactStat({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="text-xs">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
