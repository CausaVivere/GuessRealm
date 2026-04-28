"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";
import { format } from "date-fns";
import {
  Activity,
  CalendarDays,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "~/components/ui/button";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

const visitsChartConfig = {
  visits: {
    label: "Visits",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const onlineChartConfig = {
  players: {
    label: "Players online",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const RANGE_OPTIONS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "60d", value: 60 },
] as const;

function MetricCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <div className="bg-background/70 border-border/60 rounded-xl border p-4 backdrop-blur-sm">
      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <span>{title}</span>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
        {value.toLocaleString()}
      </div>
      {hint ? (
        <p className="text-muted-foreground mt-2 text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [days, setDays] = useState<(typeof RANGE_OPTIONS)[number]["value"]>(30);

  const dashboard = api.analytics.getDashboard.useQuery(
    { days, onlineHours: 24 },
    {
      refetchInterval: 60_000,
      staleTime: 20_000,
    },
  );

  const visitsData = useMemo(() => {
    if (!dashboard.data) return [];

    return dashboard.data.visits.map((row) => {
      const date = new Date(`${row.date}T00:00:00.000Z`);
      return {
        ...row,
        label: format(date, days > 14 ? "MMM d" : "EEE"),
      };
    });
  }, [dashboard.data, days]);

  const onlineData = useMemo(() => {
    if (!dashboard.data) return [];

    return dashboard.data.online.map((row) => ({
      ...row,
      label: format(new Date(row.timestamp), "HH:mm"),
    }));
  }, [dashboard.data]);

  return (
    <div className="bg-background min-h-screen w-full p-6 md:p-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Privacy-minimal analytics with aggregate-only data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/admin/sets">Set Builder</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/admin/games">Games</Link>
            </Button>
          </div>
        </div>

        <div className="bg-muted/50 inline-flex w-fit rounded-lg p-1">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                days === option.value
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setDays(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {dashboard.isLoading ? (
          <div className="bg-background/70 border-border/60 flex h-64 items-center justify-center rounded-xl border">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : dashboard.error ? (
          <div className="bg-destructive/10 border-destructive/30 rounded-xl border p-5 text-sm">
            Failed to load analytics: {dashboard.error.message}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total visits"
                value={dashboard.data?.summary.totalVisits ?? 0}
                icon={TrendingUp}
              />
              <MetricCard
                title="Visits today"
                value={dashboard.data?.summary.visitsToday ?? 0}
                icon={CalendarDays}
              />
              <MetricCard
                title="Players online now"
                value={dashboard.data?.summary.currentOnlinePlayers ?? 0}
                icon={Users}
                hint="Approximate, based on last 2 minutes."
              />
              <MetricCard
                title="Peak online (24h)"
                value={dashboard.data?.summary.peakOnlinePlayers24h ?? 0}
                icon={Activity}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="bg-background/70 border-border/60 rounded-xl border p-4">
                <div className="mb-4">
                  <h2 className="text-lg font-medium">Visits</h2>
                  <p className="text-muted-foreground text-sm">
                    Daily session-level visit events for the selected range.
                  </p>
                </div>

                <ChartContainer config={visitsChartConfig}>
                  <BarChart
                    data={visitsData}
                    margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="4 4" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={22}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={36}
                    />
                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar
                      dataKey="visits"
                      radius={[6, 6, 2, 2]}
                      fill="var(--color-visits)"
                    />
                  </BarChart>
                </ChartContainer>
              </div>

              <div className="bg-background/70 border-border/60 rounded-xl border p-4">
                <div className="mb-4">
                  <h2 className="text-lg font-medium">
                    Online Players (Last 24h)
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Minute snapshots aggregated across active rooms.
                  </p>
                </div>

                <ChartContainer config={onlineChartConfig}>
                  <AreaChart
                    data={onlineData}
                    margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="fill-online"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-players)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-players)"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={28}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={36}
                    />
                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                    <Area
                      type="monotone"
                      dataKey="players"
                      stroke="var(--color-players)"
                      fill="url(#fill-online)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
