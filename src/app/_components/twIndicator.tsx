"use client";
import { useEffect, useState } from "react";

export default function TailwindIndicator() {
  const [breakpoint, setBreakpoint] = useState<string>("");

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      let bp = "unknown";

      if (width < 640) bp = "sm";
      else if (width < 768) bp = "md";
      else if (width < 1024) bp = "lg";
      else if (width < 1280) bp = "xl";
      else if (width < 1536) bp = "2xl";
      else bp = "2xl+";

      setBreakpoint(bp);
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 rounded-md bg-slate-900/75 px-3 py-1 font-mono text-sm text-white/80">
      {breakpoint}
    </div>
  );
}
