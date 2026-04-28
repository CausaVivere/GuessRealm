"use client";

import Link from "next/link";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useSessionStorage } from "~/utils/hooks";
import type { AnimeCharacter } from "../../../../../generated/prisma/client";
import SetEditor, { type SelectableAnime } from "../_components/setEditor";

export default function AnimeSetCreatePage() {
  const [animes, setAnimes] = useSessionStorage<SelectableAnime[]>(
    "foundAnimes",
    [],
  );
  const [selectedAnime, setSelectedAnime] =
    useSessionStorage<SelectableAnime | null>("selectedAnime", null);
  const [characters, setCharacters] = useSessionStorage<AnimeCharacter[]>(
    "set",
    [],
  );
  const [name, setName] = useSessionStorage<string>("name", "");

  const createSet = api.sets.createAnimeSet.useMutation({
    onSuccess: () => {
      toast.success("Successfully created anime set: " + name);
      setSelectedAnime(null);
      setAnimes([]);
      setCharacters([]);
      setName("");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to create anime set!", {
        description: "Please try again!",
      });
    },
  });

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
      onSave={(payload) => createSet.mutate(payload)}
      isSaving={createSet.isPending}
      saveLabel="Create"
      headerActions={
        <>
          <Button asChild variant="secondary">
            <Link href="/admin/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/admin/sets">Sets</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/admin/games">Games</Link>
          </Button>
        </>
      }
    />
  );
}
