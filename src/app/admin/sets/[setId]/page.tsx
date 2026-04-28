"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import Loading from "~/components/ui/loading";
import { api } from "~/trpc/react";
import type { AnimeCharacter } from "../../../../../generated/prisma/client";
import SetEditor, { type SelectableAnime } from "../_components/setEditor";

type DbAnime = {
  id: number;
  title: string;
  titleEnglish: string | null;
  image: string | null;
};

function toSelectableAnime(anime: DbAnime): SelectableAnime {
  return {
    mal_id: anime.id,
    title: anime.title,
    title_english: anime.titleEnglish,
    images: anime.image ? { jpg: { image_url: anime.image } } : null,
    popularity: null,
  };
}

function getMostCommonAnimeId(characters: AnimeCharacter[]) {
  const counts = new Map<number, number>();
  characters.forEach((character) => {
    counts.set(
      character.animeId,
      counts.get(character.animeId) ? counts.get(character.animeId)! + 1 : 1,
    );
  });

  return Array.from(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
}

export default function AnimeSetEditPage() {
  const params = useParams<{ setId: string }>();
  const setId = Array.isArray(params.setId) ? params.setId[0] : params.setId;

  const utils = api.useUtils();

  const { data, isLoading, error } = api.sets.getAdminAnimeSet.useQuery(
    { setId },
    { enabled: Boolean(setId) },
  );

  const [name, setName] = useState("");
  const [characters, setCharacters] = useState<AnimeCharacter[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<SelectableAnime | null>(
    null,
  );
  const [animes, setAnimes] = useState<SelectableAnime[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  const initialAnime = useMemo(() => {
    if (!data?.animes || data.animes.length === 0) return null;
    const mostCommon = getMostCommonAnimeId(data.characters);
    const primary =
      data.animes.find((anime) => anime.id === mostCommon) ?? data.animes[0];
    return primary ? toSelectableAnime(primary) : null;
  }, [data]);

  useEffect(() => {
    if (data && !hasInitialized) {
      setName(data.name);
      setCharacters(data.characters);
      setSelectedAnime(initialAnime);
      setHasInitialized(true);
    }
  }, [data, hasInitialized, initialAnime]);

  const updateSet = api.sets.updateAnimeSet.useMutation({
    onSuccess: () => {
      toast.success("Anime set updated.");
      void utils.sets.getAdminAnimeSet.invalidate({ setId });
      void utils.sets.getAdminAnimeSets.invalidate();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to update anime set.", {
        description: err.message,
      });
    },
  });

  if (isLoading) {
    return <Loading fullScreen message="Loading anime set..." />;
  }

  if (error) {
    return (
      <div className="bg-background flex min-h-screen w-full items-center justify-center">
        <div className="border-destructive/30 bg-destructive/10 rounded-xl border p-6 text-sm">
          Failed to load anime set: {error.message}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-background flex min-h-screen w-full items-center justify-center">
        <div className="border-border/60 bg-background/70 rounded-xl border p-6 text-sm">
          Anime set not found.
        </div>
      </div>
    );
  }

  return (
    <SetEditor
      name={name}
      setName={setName}
      characters={characters}
      setCharacters={setCharacters}
      selectedAnime={selectedAnime}
      setSelectedAnime={setSelectedAnime}
      animes={animes}
      setAnimes={setAnimes}
      onSave={(payload) => updateSet.mutate({ setId, ...payload })}
      isSaving={updateSet.isPending}
      saveLabel="Update"
      initialStep={selectedAnime ? "selectCharacters" : "selectAnime"}
      headerActions={
        <>
          <Button asChild variant="secondary">
            <Link href="/admin/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/admin/sets">Sets</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/admin/sets/create">Create</Link>
          </Button>
        </>
      }
    />
  );
}
