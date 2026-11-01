"use client";

import { useState, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { AuthHydrator } from "@/providers/auth-hydrator";
import { ApiError } from "@/lib/api-error";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            // Never retry a 4xx: the answer will not change.
            // Network errors and 5xx get 2 retries (about 3 seconds in total).
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        {/* Wrap Hydrator in Suspense to safely useSearchParams */}
        <Suspense fallback={null}>
          <AuthHydrator>
            <NotificationProvider>{children}</NotificationProvider>
          </AuthHydrator>
        </Suspense>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
