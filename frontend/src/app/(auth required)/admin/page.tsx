"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats } from "@/hooks/use-admin";

const WEEK_OPTIONS = [4, 8, 12, 26]; // backend allows 1..26

const chartConfig = {
  signups: { label: "Signups", color: "var(--chart-1)" },
  matches: { label: "Matches", color: "var(--chart-2)" },
  bookings: { label: "Bookings", color: "var(--chart-3)" },
} satisfies ChartConfig;

export default function AdminStatsPage() {
  const [weeks, setWeeks] = useState(8);
  const { data, isLoading, isError, error, refetch } = useAdminStats(weeks);

  if (isLoading) return <StatsSkeleton />;

  if (isError || !data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{error?.message || "Failed to load stats."}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const maxMembers = Math.max(1, ...data.members_per_club.map((c) => c.members_count));

  return (
    <div className="space-y-6">
      {/* totals */}
      <div className="grid gap-4 sm:grid-cols-3">
        <TotalCard title="Users" value={data.totals.users} />
        <TotalCard title="Clubs" value={data.totals.clubs} />
        <TotalCard title="Active members" value={data.totals.members} />
      </div>

      {/* weekly chart */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>Weekly activity</CardTitle>
            <CardDescription>Weeks start on Monday.</CardDescription>
          </div>
          <Select value={String(weeks)} onValueChange={(v) => setWeeks(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEK_OPTIONS.map((w) => (
                <SelectItem key={w} value={String(w)}>
                  Last {w} weeks
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <BarChart data={data.weekly}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="week_start"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => v.slice(5)} // "2026-10-12" -> "10-12"
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="signups" fill="var(--color-signups)" radius={3} />
              <Bar dataKey="matches" fill="var(--color-matches)" radius={3} />
              <Bar dataKey="bookings" fill="var(--color-bookings)" radius={3} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* members per club */}
      <Card>
        <CardHeader>
          <CardTitle>Members per club</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.members_per_club.length === 0 && (
            <p className="text-sm text-muted-foreground">No clubs yet.</p>
          )}
          {data.members_per_club.map((c) => (
            <div key={c.club_id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground">{c.members_count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${(c.members_count / maxMembers) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TotalCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96" />
      <Skeleton className="h-48" />
    </div>
  );
}