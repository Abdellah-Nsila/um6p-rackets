"use client";

import { useEffect } from "react";
import { Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { useAuthPopupStore } from "@/store/auth_popup";

function CheckingSession() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="size-8 animate-spin text-brand-orange" />
    </div>
  );
}

// Clean locked background behind the login popup
function LockedScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-orange-50 dark:bg-orange-950/40 text-brand-orange border border-orange-200/60 dark:border-orange-900/40 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <Lock className="w-10 h-10" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black italic tracking-tight text-brand-ink dark:text-white mb-3">
        Authentication Required
      </h1>
      <p className="text-muted-foreground font-medium mb-8 max-w-sm text-sm sm:text-base">
        You must be logged in to view club details, leaderboards, and your athlete profile.
      </p>
      <Button
        onClick={onSignIn}
        className="h-11 px-8 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-black italic text-base tracking-wide shadow-md shadow-brand-orange/20"
      >
        Sign In to Access
      </Button>
    </div>
  );
}

export default function AuthRequiredLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isPending } = useMe();
  const openPopup = useAuthPopupStore((state) => state.open);

  // A visitor on a protected page gets the login popup
  useEffect(() => {
    if (user === null) openPopup("login");
  }, [user, openPopup]);

  // Still asking the backend: do not show "Authentication Required" by mistake
  if (isPending) return <CheckingSession />;

  if (!user) return <LockedScreen onSignIn={() => openPopup("login")} />;

  // Logged in: the Navbar is shared by all protected pages
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}