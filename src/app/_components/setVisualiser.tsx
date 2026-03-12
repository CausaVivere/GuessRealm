import { cn } from "~/lib/utils";
import type { AnimeCharacter } from "../../../generated/prisma/client";
import Image from "next/image";
import type { AnimeGameSet } from "~/server/api/utils/jikan";

export default function SetVisualizer({
  set,
  className,
}: {
  set: AnimeGameSet;
  className?: string;
}) {
  return (
    <div className={cn("grid h-full w-fit grid-cols-6 gap-6", className)}>
      {set.characters.map((char) => (
        <CharacterCard key={char.id} char={char} />
      ))}
    </div>
  );
}

export function CharacterCard({
  char,
  className,
  ...props
}: {
  char: AnimeCharacter;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "group flex h-44 w-30 flex-col items-center justify-center rounded-3xl bg-linear-to-b from-red-950/40 to-zinc-950 p-2 hover:cursor-pointer",
        className,
      )}
      {...props}
    >
      <Image
        alt={char.name + " image"}
        src={char.image!}
        width={500}
        height={800}
        className="h-40 w-28 rounded-2xl"
      />
    </div>
  );
}
