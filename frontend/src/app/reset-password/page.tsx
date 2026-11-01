"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Lock, AlertCircle, ArrowRight, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { authInputClass, authLabelClass, FieldError } from "@/components/auth/form-parts";
import { useMe } from "@/hooks/use-me";
import { useResetPassword } from "@/hooks/use-auth-mutations";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/schemas/auth";

function LoadingState({ text }: { text: string }) {
  return (
    <div className="p-12 flex flex-col items-center justify-center">
      <Loader2 className="size-8 animate-spin text-brand-orange mb-4" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">{text}</p>
    </div>
  );
}

function InvalidLinkState({ onHome }: { onHome: () => void }) {
  return (
    <div className="text-center p-8">
      <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-black italic text-brand-ink dark:text-white mb-2">
        Invalid Link
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        This password reset link is invalid or missing a security token. Please request a new link.
      </p>
      <Button onClick={onHome} variant="outline" className="w-full h-11 rounded-xl">
        Return to Home
      </Button>
    </div>
  );
}

function SuccessState({ onHome }: { onHome: () => void }) {
  return (
    <div className="text-center p-8 animate-in fade-in zoom-in duration-500">
      <div className="mx-auto w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 border border-green-200">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-black italic text-brand-ink dark:text-white mb-2">
        Password Reset!
      </h2>
      <p className="text-muted-foreground text-sm mb-8">
        Your password has been successfully updated. You can now use your new password to sign in.
      </p>
      <Button
        onClick={onHome} // TODO: open the login popup automatically
        className="h-11 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-black italic w-full"
      >
        Sign In Now <ArrowRight className="ml-2 size-4" />
      </Button>
    </div>
  );
}

// Not exported: a Next.js page file can only export the page itself
function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");

  const { data: user, isPending: isCheckingUser } = useMe();
  const resetPassword = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // Guests only: a logged-in user has no reason to be here
  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  const goHome = () => router.push("/");

  const onSubmit = ({ password }: ResetPasswordValues) => {
    if (!token) return;
    resetPassword.mutate({ token, newPassword: password });
  };

  if (isCheckingUser) return <LoadingState text="Verifying secure session..." />;
  if (user) return null; // the redirect above is running
  if (!token) return <InvalidLinkState onHome={goHome} />;
  if (resetPassword.isSuccess) return <SuccessState onHome={goHome} />;

  return (
    <div className="w-full flex flex-col">
      <div className="border-b border-border/60 bg-muted/20 pb-6 pt-8 px-6 sm:px-8">
        <div className="mb-2 inline-flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-brand-orange border border-orange-200/60 dark:border-orange-900/40 text-[11px] font-black italic tracking-wide uppercase">
          <ShieldCheck className="size-3" />
          <span>Secure Update</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight text-brand-ink dark:text-white">
          Create New Password
        </h2>
        <p className="text-xs sm:text-sm italic font-medium mt-1 text-muted-foreground">
          Please enter and confirm your new password below.
        </p>
      </div>

      <div className="p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="space-y-4">
            <Field className="space-y-1.5">
              <FieldLabel htmlFor="password" className={authLabelClass(!!errors.password)}>
                <Lock className="size-3.5 text-brand-orange" /> New Password
              </FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={authInputClass(!!errors.password)}
                {...register("password")}
              />
              <FieldError message={errors.password?.message} />
            </Field>

            <Field className="space-y-1.5">
              <FieldLabel
                htmlFor="confirmPassword"
                className={authLabelClass(!!errors.confirmPassword)}
              >
                <Lock className="size-3.5 text-brand-orange" /> Confirm Password
              </FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={authInputClass(!!errors.confirmPassword)}
                {...register("confirmPassword")}
              />
              <FieldError message={errors.confirmPassword?.message} />
            </Field>

            {/* Error from the backend (expired link, server down...) */}
            {resetPassword.isError && (
              <div className="bg-destructive/10 text-destructive text-xs font-semibold p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p>{resetPassword.error.message}</p>
              </div>
            )}

            <Field className="pt-4 border-t border-border/60">
              <Button
                type="submit"
                disabled={resetPassword.isPending}
                className="h-11 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-black italic text-sm tracking-wide shadow-md shadow-brand-orange/20 w-full flex items-center justify-center gap-2"
              >
                {resetPassword.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Updating...
                  </>
                ) : (
                  <>
                    Reset Password <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md bg-card rounded-2xl md:rounded-3xl border border-border/80 shadow-xs overflow-hidden relative">
        <Suspense fallback={<LoadingState text="Loading secure session..." />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
