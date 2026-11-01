"use client";

import { useState, use } from "react";
import LeaderboardHeader from "@/components/leaderboard/leaderboard-header";
import LeaderboardTable from "@/components/leaderboard/leaderboard-table";
import { useClubLeaderboard } from "@/hooks/use-leaderboard";
import { useMe } from "@/hooks/use-me";

export default function LeaderboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ target_user_id?: string }>;
}) {
  const { slug } = use(params);
  const unwrappedSearchParams = use(searchParams);

  const { data: userData } = useMe();
  const targetUserId = unwrappedSearchParams.target_user_id
    ? parseInt(unwrappedSearchParams.target_user_id, 10)
    : userData?.id;

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data, isLoading, isError } = useClubLeaderboard(
    slug,
    currentPage,
    itemsPerPage,
    targetUserId,
  );

  if (isError) {
    return (
      <main className="min-h-screen px-4 py-16 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-black italic text-brand-ink dark:text-white uppercase">
          Club Not Found
        </h1>
        <p className="text-muted-foreground italic mt-2">
          The club <span className="font-bold text-brand-orange">&quot;{slug}&quot;</span> does not exist or
          you do not have permission to view its leaderboard.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:p-8 md:p-15 flex flex-col items-center">
      <LeaderboardHeader slug={slug} />

      <LeaderboardTable
        leaderboardData={data?.leaderboard.data || []}
        targetUserRow={data?.target_user_row || null}
        currentPage={currentPage}
        totalPages={Math.max(1, Math.ceil((data?.leaderboard.total || 0) / itemsPerPage))}
        totalItems={data?.leaderboard.total || 0}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
      />
    </main>
  );
}
