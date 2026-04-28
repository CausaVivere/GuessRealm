"use client";

import Image from "~/components/ui/smart-image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { Input } from "~/components/ui/input";
import Loading from "~/components/ui/loading";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

export default function AdminSetsPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const utils = api.useUtils();

  useEffect(() => {
    const handle = setTimeout(() => {
      setQuery(search);
    }, 400);

    return () => clearTimeout(handle);
  }, [search]);

  const {
    data: sets,
    isLoading,
    error,
  } = api.sets.getAdminAnimeSets.useQuery({
    search: query,
    limit: 50,
  });

  const refreshSet = api.sets.refreshAnimeSetFromJikan.useMutation({
    onSuccess: async (_, variables) => {
      toast.success("Jikan data refreshed for this set.");
      setRefreshingId(null);
      await utils.sets.getAdminAnimeSets.invalidate();
      await utils.sets.getAdminAnimeSet.invalidate({ setId: variables.setId });
    },
    onError: (err) => {
      console.error(err);
      setRefreshingId(null);
      toast.error("Failed to refresh set from Jikan.", {
        description: err.message,
      });
    },
  });

  return (
    <div className="bg-background min-h-screen w-full p-6 md:p-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Anime Sets
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Edit sets or refresh data when Jikan updates character images.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/admin">Dashboard</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/admin/sets/create">Create</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/admin/games">Games</Link>
            </Button>
          </div>
        </div>

        <ButtonGroup className="w-full">
          <Input
            placeholder="Search by set, anime, or character name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full"
            maxLength={45}
          />
          <Button
            className="hover:cursor-pointer"
            variant="secondary"
            onClick={() => setQuery(search)}
          >
            Search
          </Button>
        </ButtonGroup>

        {isLoading ? (
          <Loading message="Loading anime sets..." className="h-64 w-full" />
        ) : error ? (
          <div className="bg-destructive/10 border-destructive/30 rounded-xl border p-5 text-sm">
            Failed to load sets: {error.message}
          </div>
        ) : sets && sets.length > 0 ? (
          <div className="flex flex-col gap-3">
            {sets.map((set) => (
              <div
                key={set.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-200/25 bg-zinc-900/60 px-5 py-4",
                  "transition-all duration-300 hover:border-red-200/55 hover:bg-zinc-800/80",
                )}
              >
                <div className="flex min-w-65 items-center gap-4">
                  {set.img ? (
                    <Image
                      alt={set.name + " photo"}
                      src={set.img}
                      width={96}
                      height={96}
                      className="h-20 w-20 rounded-lg border border-white/20 object-cover"
                    />
                  ) : (
                    <div className="border-secondary text-muted-foreground flex h-20 w-20 items-center justify-center rounded-lg border bg-zinc-950/40 text-xs">
                      No image
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold">{set.name}</h3>
                    <div className="text-muted-foreground text-sm">
                      By {set.creatorName}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {set.plays} plays
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Updated {format(new Date(set.updatedAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild variant="secondary">
                    <Link href={`/admin/sets/${set.id}`}>Edit</Link>
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={refreshSet.isPending}
                    onClick={() => {
                      setRefreshingId(set.id);
                      refreshSet.mutate({ setId: set.id });
                    }}
                  >
                    {refreshSet.isPending && refreshingId === set.id ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Updating
                      </>
                    ) : (
                      <>
                        <RefreshCw />
                        Update from Jikan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground rounded-xl border border-dashed border-white/10 p-10 text-center text-sm">
            No anime sets found for: {query}
          </div>
        )}
      </div>
    </div>
  );
}
