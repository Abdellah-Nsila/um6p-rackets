"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileView from "@/components/profile/profile-view";
import { useUserProfile } from "@/hooks/use-profile";
import { ApiError } from "@/lib/api-error";

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id, 10);

  const { data: profile, isLoading, isError, error, refetch } = useUserProfile(userId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="size-10 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (isError || !profile) {
    const isNotFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="w-[92%] lg:w-[70%] mx-auto py-24 text-center">
        <h2 className="text-2xl font-black mb-2">
          {isNotFound ? "User not found" : "Could not load user profile"}
        </h2>
        {!isNotFound && (
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  return <ProfileView data={profile} />;
}