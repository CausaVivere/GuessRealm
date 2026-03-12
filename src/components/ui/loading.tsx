import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

export default function Loading({
  message,
  fullScreen,
  className,
  ...props
}: {
  message: string;
  fullScreen?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5",
        fullScreen ? "min-h-screen w-full" : "",
        className,
      )}
      {...props}
    >
      <Loader2 className="animate-spin" />
      <p className="text-lg font-semibold">{message}</p>
    </div>
  );
}
