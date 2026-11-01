"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail, Lock, SlidersHorizontal, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { authInputClass, authLabelClass, FieldError } from "@/components/auth/form-parts";
// eslint-disable-next-line no-restricted-imports -- oauthLogin is a page redirect, not a data call
import { AuthApi } from "@/lib/api/auth";
import { useLogin } from "@/hooks/use-auth-mutations";
import { loginSchema, type LoginValues } from "@/lib/schemas/auth";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToForgot?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister, onSwitchToForgot }: LoginFormProps) {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = ({ email, password }: LoginValues) => {
    login.mutate({ email, password }, { onSuccess: () => onSuccess?.() });
  };

  return (
    <div className="w-full flex flex-col">
      <div className="border-b border-border/60 bg-muted/20 pb-6 pt-6 sm:pt-8 px-6 sm:px-8">
        <div className="mb-2 inline-flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-brand-orange border border-orange-200/60 dark:border-orange-900/40 text-[11px] font-black italic tracking-wide uppercase">
          <SlidersHorizontal className="size-3" />
          <span>Welcome Back</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight text-brand-ink dark:text-white">
          Login to Account
        </h2>
        <p className="text-xs sm:text-sm italic font-medium mt-1 text-muted-foreground">
          Enter your credentials to access your UM6P Racket dashboard.
        </p>
      </div>

      <div className="p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="space-y-4">
            <Field className="space-y-1.5">
              <FieldLabel htmlFor="email" className={authLabelClass(!!errors.email)}>
                <Mail className="size-3.5 text-brand-orange" /> Email Address
              </FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="user@um6p.ma"
                className={authInputClass(!!errors.email)}
                {...register("email")}
              />
              <FieldError message={errors.email?.message} />
            </Field>

            <Field className="space-y-1.5">
              <div className="flex items-center justify-between w-full">
                <FieldLabel htmlFor="password" className={authLabelClass(!!errors.password)}>
                  <Lock className="size-3.5 text-brand-orange" /> Password
                </FieldLabel>

                {onSwitchToForgot && (
                  <button
                    type="button"
                    onClick={onSwitchToForgot}
                    className="text-[11px] font-bold text-brand-teal hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={authInputClass(!!errors.password)}
                {...register("password")}
              />
              <FieldError message={errors.password?.message} />
            </Field>

            {/* Error from the backend (wrong password, server down...) */}
            {login.isError && <FieldError message={login.error.message} />}

            <Field className="pt-2 border-t border-border/60">
              <Button
                type="submit"
                disabled={login.isPending}
                className="h-11 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-black italic text-sm tracking-wide shadow-md shadow-brand-orange/20 w-full flex items-center justify-center gap-2"
              >
                {login.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </Field>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                <span className="bg-background px-2">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => AuthApi.oauthLogin()}
              className="h-11 rounded-xl w-full border-border/80 font-bold text-sm shadow-sm hover:bg-muted/50 transition-colors"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>

            <p className="text-center text-[13px] font-medium text-muted-foreground mt-3">
              Dont have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-brand-orange hover:text-brand-orange/80 hover:underline font-bold transition-colors cursor-pointer"
              >
                Sign up
              </button>
            </p>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
