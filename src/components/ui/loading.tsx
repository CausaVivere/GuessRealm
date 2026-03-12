import { Loader2 } from "lucide-react";

export default function Loading({
  message,
  fullScreen,
  ...props
}: {
  message: string;
  fullScreen?: boolean;
  props?: React.HTMLAttributes<HTMLDivElement>;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 ${fullScreen ? "min-h-screen w-full" : ""}`}
      {...props}
    >
      <Loader2 className="animate-spin" />
      <p className="text-lg font-semibold">{message}</p>
    </div>
  );
}
