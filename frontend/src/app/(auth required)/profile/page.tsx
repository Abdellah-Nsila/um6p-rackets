"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileView from "@/components/profile/profile-view";
import { useMyProfile } from "@/hooks/use-profile";

export default function MyProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useMyProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="size-10 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="w-[92%] lg:w-[70%] mx-auto py-24 text-center">
        <h2 className="text-2xl font-black mb-2">Could not load your profile</h2>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  // The backend guarantees memberProfile and global_stats are always fully populated
  return <ProfileView data={profile} />;
}