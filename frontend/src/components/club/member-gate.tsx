"use client";

import Link from "next/link";
import { PageLoader } from "@/components/page-loader";
import { useClubStatus } from "@/hooks/use-clubs";

// Renders its content only for members of the club, and hands it the member id.
// The member id is NOT the user id: it comes from the club status endpoint.
export function MemberGate({
  slug,
  children,
}: {
  slug: string;
  children: (memberId: number) => React.ReactNode;
}) {
  const { data: status, isPending, isError, error } = useClubStatus(slug);

  if (isPending) return <PageLoader />;

  if (isError) {
    return <p className="px-4 pt-32 text-center text-muted-foreground">{error.message}</p>;
  }

  if (status.member_id === null) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 pt-32 text-center">
        <h1 className="text-2xl font-black italic tracking-tight text-brand-ink dark:text-white">
          Members only
        </h1>
        <p className="text-muted-foreground">
          You need to be a member of this club to use this page.
        </p>
        <Link
          href={`/clubs/${slug}`}
          className="inline-block font-bold text-brand-orange hover:underline"
        >
          Back to the club
        </Link>
      </div>
    );
  }

  return <>{children(status.member_id)}</>;
}