"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail, KeyRound, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { authInputClass, authLabelClass, FieldError } from "@/components/auth/form-parts";
import { useForgotPassword } from "@/hooks/use-auth-mutations";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/schemas/auth";

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

export function ForgotPasswordForm({ onSwitchToLogin }: ForgotPasswordFormProps) {
  const forgot = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: ForgotPasswordValues) => forgot.mutate(values);

  return (
    <div className="w-full flex flex-col">
      <div className="border-b border-border/60 bg-muted/20 pb-6 pt-6 sm:pt-8 px-6 sm:px-8">
        <div className="mb-2 inline-flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-brand-teal border border-teal-200/60 dark:border-teal-900/40 text-[11px] font-black italic tracking-wide uppercase">
          <KeyRound className="size-3" />
          <span>Account Recovery</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight text-brand-ink dark:text-white">
          Reset Password
        </h2>
        <p className="text-xs sm:text-sm italic font-medium mt-1 text-muted-foreground">
          Enter your email and we’ll send you a link to securely reset your password.
        </p>
      </div>

      <div className="p-6 sm:p-8">
        {forgot.isSuccess ? (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Check your inbox</h3>
            <p className="text-sm text-muted-foreground font-medium">
              We’ve sent a secure reset link to <strong>{forgot.variables.email}</strong>. The link
              will expire in 15 minutes.
            </p>
            <Button
              onClick={onSwitchToLogin}
              variant="outline"
              className="mt-4 w-full h-11 rounded-xl font-bold"
            >
              Return to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup className="space-y-4">
              <Field className="space-y-1.5">
                <FieldLabel htmlFor="reset-email" className={authLabelClass(!!errors.email)}>
                  <Mail className="size-3.5 text-brand-orange" /> Email Address
                </FieldLabel>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="user@um6p.ma"
                  className={authInputClass(!!errors.email)}
                  {...register("email")}
                />
                <FieldError message={errors.email?.message} />
              </Field>

              {/* Error from the backend */}
              {forgot.isError && <FieldError message={forgot.error.message} />}

              <Field className="pt-4 border-t border-border/60">
                <Button
                  type="submit"
                  disabled={forgot.isPending}
                  className="h-11 rounded-xl bg-brand-ink hover:bg-brand-ink/90 text-white font-black italic text-sm tracking-wide shadow-md w-full flex items-center justify-center gap-2"
                >
                  {forgot.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      Send Reset Link <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </Field>

              <p className="text-center text-[13px] font-medium text-muted-foreground mt-3">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-brand-orange hover:text-brand-orange/80 hover:underline font-bold transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            </FieldGroup>
          </form>
        )}
      </div>
    </div>
  );
}
