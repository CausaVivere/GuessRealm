"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import Image from "~/components/ui/smart-image";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Loader2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { AnimeCharacter } from "../../../../../generated/prisma/client";

export type SelectableAnime = {
  mal_id: number;
  title: string;
  title_english?: string | null;
  images?: { jpg?: { image_url?: string | null } | null } | null;
  popularity?: number | null;
};

type SetSavePayload = {
  name: string;
  animeIds: number[];
  characterIds: number[];
  mostCommonAnimeId: number;
};

type SetEditorProps = {
  name: string;
  setName: (name: string) => void;
  characters: AnimeCharacter[];
  setCharacters: Dispatch<SetStateAction<AnimeCharacter[]>>;
  selectedAnime: SelectableAnime | null;
  setSelectedAnime: Dispatch<SetStateAction<SelectableAnime | null>>;
  animes: SelectableAnime[];
  setAnimes: (animes: SelectableAnime[]) => void;
  onSave: (payload: SetSavePayload) => void;
  isSaving: boolean;
  saveLabel: string;
  headerActions?: React.ReactNode;
  initialStep?: "selectAnime" | "selectCharacters";
};

export default function SetEditor({
  name,
  setName,
  characters,
  setCharacters,
  selectedAnime,
  setSelectedAnime,
  animes,
  setAnimes,
  onSave,
  isSaving,
  saveLabel,
  headerActions,
  initialStep = "selectAnime",
}: SetEditorProps) {
  const [step, setStep] = useState<"selectAnime" | "selectCharacters">(
    initialStep,
  );

  const layout = "6x4";

  useEffect(() => {
    if (selectedAnime && step === "selectAnime") {
      setStep("selectCharacters");
    }
  }, [selectedAnime, step]);

  const handleSave = () => {
    const ids = new Map<number, number>();

    characters.forEach((character) => {
      ids.set(
        character.animeId,
        ids.get(character.animeId) ? ids.get(character.animeId)! + 1 : 1,
      );
    });

    const mostCommonAnimeId =
      Array.from(ids).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;

    onSave({
      name: name.length > 45 ? name.slice(0, 45) : name,
      mostCommonAnimeId,
      animeIds: Array.from(ids.keys()),
      characterIds: characters.map((character) => character.id),
    });
  };

  const saveDisabled =
    name.trim().length < 1 || characters.length < 24 || isSaving;

  const showCharacters = step === "selectCharacters" && selectedAnime;

  return (
    <div className="bg-background flex min-h-screen w-full items-center justify-center">
      {headerActions ? (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {headerActions}
        </div>
      ) : null}
      <div className="border-foreground flex h-full w-4/5 items-center justify-center rounded-md p-5">
        <div className="flex h-full min-h-screen w-full gap-3">
          {showCharacters ? (
            <SelectCharacters
              anime={selectedAnime}
              setStep={setStep}
              characters={characters}
              setCharacters={setCharacters}
            />
          ) : (
            <SelectAnime
              selectedAnime={selectedAnime}
              setSelectedAnime={setSelectedAnime}
              setStep={setStep}
              animes={animes}
              setAnimes={setAnimes}
            />
          )}
          <div className="flex h-full w-full flex-col items-center justify-center">
            <div
              className={cn(
                "grid gap-4",
                layout === "6x4" ? "grid-cols-6" : "grid-cols-6",
              )}
            >
              {Array.from({ length: layout === "6x4" ? 24 : 36 }, (_, i) => {
                const character = characters[i];

                return character ? (
                  <div
                    key={character.id}
                    className="border-secondary group flex w-40 flex-col items-center justify-start gap-3 rounded-xl border bg-linear-to-b from-red-950/70 to-slate-950 p-2 hover:cursor-pointer"
                    onClick={() =>
                      setCharacters((prev) =>
                        prev.filter((c) => c.id !== character.id),
                      )
                    }
                  >
                    {character.image && (
                      <Image
                        src={character.image}
                        alt={character.name}
                        className="w-28 rounded-xl"
                        width={250}
                        height={250}
                      />
                    )}
                    <h3 className="my-auto hidden text-center text-lg font-semibold group-hover:block">
                      {character.name}
                    </h3>
                  </div>
                ) : (
                  <div
                    key={`placeholder-${i}`}
                    className="border-secondary flex h-52 w-40 flex-col items-center justify-center rounded-xl border bg-linear-to-b from-red-950/70 to-slate-950 p-2"
                  >
                    <User size={64} />
                    <h3 className="text-center text-2xl font-semibold">
                      GuessRealm
                    </h3>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex w-full items-center gap-3 px-5">
              <Input
                placeholder="Give a name for this anime set"
                value={name}
                onChange={(event) =>
                  event.target.value.length <= 45
                    ? setName(event.target.value)
                    : null
                }
                className="w-96"
              />
              <Button
                onClick={handleSave}
                disabled={saveDisabled}
                className="text-base font-semibold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Check />
                    {saveLabel}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectCharacters({
  anime,
  setStep,
  characters,
  setCharacters,
}: {
  anime: SelectableAnime;
  setStep: (step: "selectAnime" | "selectCharacters") => void;
  characters: AnimeCharacter[];
  setCharacters: Dispatch<SetStateAction<AnimeCharacter[]>>;
}) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 9;
  const [data, setData] = useState<AnimeCharacter[]>([]);
  const [pageCharacters, setPageCharacters] = useState<AnimeCharacter[]>([]);

  const lastAnimeId = useRef<number | null>(null);

  const getCharacters = api.sets.getAnimeCharacters.useMutation({
    onSuccess: (data: AnimeCharacter[]) => {
      const sorted = [...data].sort((a, b) => b.favorites - a.favorites);
      setData(sorted);
      setPageCharacters(
        sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
      );
    },
    onError: (err) => {
      toast.error("Failed to fetch characters from Jikan:", {
        description: err.message,
      });
      console.error(err);
    },
  });

  useEffect(() => {
    if (!anime) return;
    if (lastAnimeId.current === anime.mal_id) return;

    lastAnimeId.current = anime.mal_id;
    setSearch("");
    setCurrentPage(0);
    getCharacters.mutate({ animeId: String(anime.mal_id) });
  }, [anime, getCharacters]);

  useEffect(() => {
    setPageCharacters(
      data.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    );
  }, [currentPage, data]);

  useEffect(() => {
    const filtered = data.filter((char) =>
      char.name.toLowerCase().includes(search.toLowerCase()),
    );

    setCurrentPage(0);
    setPageCharacters(filtered.slice(0, pageSize));
  }, [search, data]);

  return (
    <div className="flex h-full w-1/2 flex-col items-center justify-start">
      <ButtonGroup className="w-full">
        <Input
          placeholder="Search for character..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full"
        />
        <Button className="hover:cursor-pointer" variant="secondary">
          Search
        </Button>
      </ButtonGroup>
      <div className="my-10 grid grid-cols-3 gap-4">
        {pageCharacters.map((character) => (
          <div
            key={character.id}
            className="border-secondary flex h-64 w-40 flex-col items-center justify-start gap-3 rounded-xl border bg-linear-to-b from-red-950/70 to-slate-950 p-2 hover:cursor-pointer"
            onClick={(event) => {
              event.preventDefault();
              const limit = 24;
              const alreadySelected = characters.some(
                (entry) => entry.id === character.id,
              );
              if (characters.length < limit && !alreadySelected) {
                setCharacters((prev) => [...prev, character]);
              }
            }}
          >
            {character.image && (
              <Image
                src={character.image}
                alt={character.name}
                className="w-28 rounded-xl"
                width={250}
                height={250}
              />
            )}
            <h3 className="my-auto text-center text-lg font-semibold">
              {character.name}
            </h3>
          </div>
        ))}
      </div>
      <div className="flex w-full items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => setStep("selectAnime")}
          className="w-1/5"
        >
          Back
        </Button>
        <Button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
          className="w-2/5"
          disabled={currentPage === 0}
        >
          <ChevronLeft />
          Previous
        </Button>
        <Button
          onClick={() =>
            setCurrentPage((prev) =>
              Math.min(prev + 1, Math.ceil(data.length / pageSize) - 1),
            )
          }
          className="w-2/5"
          disabled={currentPage === Math.ceil(data.length / pageSize) - 1}
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

function SelectAnime({
  selectedAnime,
  setSelectedAnime,
  setStep,
  animes,
  setAnimes,
}: {
  selectedAnime: SelectableAnime | null;
  setSelectedAnime: (anime: SelectableAnime) => void;
  setStep: (step: "selectAnime" | "selectCharacters") => void;
  animes: SelectableAnime[];
  setAnimes: (animes: SelectableAnime[]) => void;
}) {
  const [search, setSearch] = useState("");

  const searchAnimes = api.sets.getAnimes.useMutation({
    onSuccess: (data) => {
      setAnimes(data.data as SelectableAnime[]);
    },
    onError: (err) => {
      toast.error("Failed to fetch animes from Jikan:", {
        description: err.message,
      });
      console.error(err);
    },
  });

  return (
    <div className="flex w-1/2 flex-col rounded-md">
      <ButtonGroup className="w-full">
        <Input
          placeholder="Search for anime..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              searchAnimes.mutate({ search });
            }
          }}
        />
        <Button
          className="hover:cursor-pointer"
          onClick={(event) => {
            event.preventDefault();
            searchAnimes.mutate({ search });
          }}
          variant="secondary"
        >
          Search
        </Button>
      </ButtonGroup>
      <div className="mt-5 flex flex-col gap-2">
        {animes && animes.length > 0 ? (
          [...animes]
            .sort((a, b) => (a.popularity ?? 0) - (b.popularity ?? 0))
            .map((anime) => (
              <div
                key={anime.mal_id}
                className={cn(
                  "border-secondary flex items-center rounded-lg border px-4 py-2 hover:cursor-pointer hover:bg-zinc-800",
                  selectedAnime?.mal_id === anime.mal_id
                    ? "border border-zinc-300 bg-zinc-900"
                    : "",
                )}
                onClick={() => setSelectedAnime(anime)}
              >
                {anime.images?.jpg?.image_url ? (
                  <Image
                    src={anime.images.jpg.image_url}
                    alt={anime.title_english ?? anime.title}
                    className="mt-2 h-16 w-16 rounded-md"
                    width={500}
                    height={500}
                  />
                ) : (
                  <div className="border-secondary flex h-16 w-16 items-center justify-center rounded-md border">
                    <Gamepad2 />
                  </div>
                )}
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">{anime.title}</h3>
                </div>
              </div>
            ))
        ) : (
          <p>No animes found</p>
        )}
      </div>
      <Button
        className="mt-5"
        disabled={!selectedAnime}
        onClick={() => setStep("selectCharacters")}
      >
        Continue
        <ChevronRight />
      </Button>
    </div>
  );
}
