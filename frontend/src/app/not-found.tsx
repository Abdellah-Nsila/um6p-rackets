// app/not-found.tsx
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-6xl font-black italic text-accent">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you are looking for does not exist or has been moved !
      </p>
      <div className="flex gap-2">
        <Button render={<Link href="/" />} nativeButton={false}>
          Go home
        </Button>
        <Button
          variant="outline"
          render={<Link href="/#clubs" />}
          nativeButton={false}
        >
          Browse clubs
        </Button>
      </div>
    </div>
  );
}