"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "~/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

type ChartTooltipPayloadItem = {
  dataKey?: string | number;
  value?: number | string;
  color?: string;
};

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: React.ReactNode;
  hideLabel?: boolean;
};

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const entries = Object.entries(config).filter(([, value]) => value.color);

  if (!entries.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
[data-chart='${id}'] {
${entries.map(([key, value]) => `  --color-${key}: ${value.color};`).join("\n")}
}
`,
      }}
    />
  );
}

export function ChartContainer({
  id,
  className,
  config,
  children,
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
}) {
  const uniqueId = React.useId().replace(/:/g, "");
  const chartId = `chart-${id ?? uniqueId}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "text-muted-foreground [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/60 [&_.recharts-tooltip-cursor]:stroke-border h-72 w-full [&_.recharts-layer]:outline-none",
          className,
        )}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-background/95 border-border/70 grid min-w-40 gap-1.5 rounded-lg border px-3 py-2 text-sm shadow-xl backdrop-blur-sm">
      {!hideLabel && label ? (
        <div className="text-foreground/90 font-medium">{label}</div>
      ) : null}
      <div className="grid gap-1">
        {payload.map((item) => {
          const key = String(item.dataKey ?? "value");
          const itemConfig = config[key];
          const color = item.color ?? `var(--color-${key})`;

          return (
            <div key={key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-xs"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground">
                  {itemConfig?.label ?? key}
                </span>
              </div>
              <span className="text-foreground font-medium tabular-nums">
                {Number(item.value ?? 0).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
