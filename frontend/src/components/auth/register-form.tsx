"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AtSign,
  Mail,
  GraduationCap,
  SlidersHorizontal,
  AlertCircle,
  Lock,
  ArrowRight,
  Phone,
  Users,
  Loader2,
  User,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthField, authInputClass, authSelectClass } from "@/components/auth/form-parts";
import { useRegister } from "@/hooks/use-auth-mutations";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLoginAvailable } from "@/hooks/use-login-available";
import { registerSchema, type RegisterValues } from "@/lib/schemas/auth";
import type { registerPayload } from "@/types";
import { Controller, useForm, useWatch } from "react-hook-form";

export const UM6P_DEPARTMENTS = [
  { code: "1337", name: "1337" },
  { code: "EMINES", name: "EMINES" },
  { code: "FMS", name: "FMS" },
  { code: "CS", name: "CS" },
  { code: "SAP-D", name: "SAP-D" },
  { code: "GUP+", name: "GUP+" },
  { code: "OTHER", name: "Other" },
] as const;

// Form values (camelCase) -> what the backend expects
function toRegisterPayload(values: RegisterValues): registerPayload {
  return {
    first_name: values.firstName,
    last_name: values.lastName,
    login: values.username,
    email: values.email,
    phone_number: values.phone,
    gender: values.gender === "Male",
    password: values.password,
    department: values.department === "OTHER" ? values.customDepartment! : values.department,
  };
}

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const signUp = useRegister();

  const {
    register,
    handleSubmit,
    control,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phone: "",
      gender: undefined,
      department: "",
      customDepartment: "",
      password: "",
    },
  });


  const department = useWatch({ control, name: "department" });
  // Username availability: wait until the user stops typing, then ask the backend
  const username = useWatch({ control, name: "username" }).trim();
  const debouncedUsername = useDebouncedValue(username);
  const availability = useLoginAvailable(debouncedUsername);

  const canCheck = username.length >= 3;
  const isChecking = canCheck && (username !== debouncedUsername || availability.isFetching);
  const isTaken = canCheck && !isChecking && availability.data?.available === false;
  const isFree = canCheck && !isChecking && availability.data?.available === true;

  const onSubmit = (values: RegisterValues) => {
    signUp.mutate(toRegisterPayload(values), { onSuccess: () => onSuccess?.() });
  };

  return (
    <div className="w-full flex flex-col">
      <div className="border-b border-border/60 bg-muted/20 pb-4 pt-6 sm:pt-8 px-6 sm:px-8 shrink-0">
        <div className="mb-2 inline-flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-brand-orange border border-orange-200/60 dark:border-orange-900/40 text-[11px] font-black italic tracking-wide uppercase">
          <SlidersHorizontal className="size-3" />
          <span>Create Account</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight text-brand-ink dark:text-white">
          Join UM6P Racket
        </h2>
        <p className="text-xs sm:text-sm italic font-medium mt-1 text-muted-foreground">
          Set up your athlete profile to start booking matches.
        </p>
      </div>

      <div className="p-6 sm:p-8">
        {/* Error from the backend (email already used, server down...) */}
        {signUp.isError && (
          <div className="mb-6 bg-destructive/10 text-destructive text-xs font-semibold p-3.5 rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <p>{signUp.error.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AuthField
                id="firstName"
                label="First Name"
                icon={User}
                error={errors.firstName?.message}
              >
                <Input
                  id="firstName"
                  maxLength={50}
                  autoComplete="given-name"
                  className={authInputClass(!!errors.firstName)}
                  {...register("firstName")}
                />
              </AuthField>

              <AuthField
                id="lastName"
                label="Last Name"
                icon={User}
                error={errors.lastName?.message}
              >
                <Input
                  id="lastName"
                  maxLength={50}
                  autoComplete="family-name"
                  className={authInputClass(!!errors.lastName)}
                  {...register("lastName")}
                />
              </AuthField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AuthField
                id="username"
                label="Username"
                icon={AtSign}
                error={
                  errors.username?.message ??
                  (isTaken ? "This username is already taken" : undefined)
                }
              >
                <div className="relative">
                  <Input
                    id="username"
                    maxLength={15}
                    autoComplete="username"
                    className={authInputClass(!!errors.username || isTaken) + " pr-10"}
                    {...register("username")}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isChecking && (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    )}
                    {isFree && <CheckCircle2 className="size-4 text-green-500" />}
                  </div>
                </div>
              </AuthField>

              <AuthField id="phone" label="Phone" icon={Phone} error={errors.phone?.message}>
                <Input
                  id="phone"
                  type="tel"
                  maxLength={15}
                  autoComplete="tel"
                  className={authInputClass(!!errors.phone)}
                  {...register("phone")}
                />
              </AuthField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AuthField id="email" label="Email" icon={Mail} error={errors.email?.message}>
                <Input
                  id="email"
                  type="email"
                  maxLength={50}
                  autoComplete="email"
                  className={authInputClass(!!errors.email)}
                  {...register("email")}
                />
              </AuthField>

              <AuthField
                id="reg-password"
                label="Password"
                icon={Lock}
                error={errors.password?.message}
              >
                <Input
                  id="reg-password"
                  type="password"
                  maxLength={20}
                  autoComplete="new-password"
                  className={authInputClass(!!errors.password)}
                  {...register("password")}
                />
              </AuthField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AuthField
                id="department"
                label="Department"
                icon={GraduationCap}
                error={errors.department?.message ?? errors.customDepartment?.message}
              >
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value !== "OTHER") clearErrors("customDepartment");
                      }}
                    >
                      <SelectTrigger
                        id="department"
                        className={authSelectClass(!!errors.department)}
                      >
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-60 z-100">
                        {UM6P_DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept.code} value={dept.code}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {department === "OTHER" && (
                  <Input
                    maxLength={50}
                    placeholder="Specify your department..."
                    className={
                      authInputClass(!!errors.customDepartment) +
                      " mt-3 animate-in fade-in slide-in-from-top-2 duration-200"
                    }
                    {...register("customDepartment", {
                      onChange: () => clearErrors("customDepartment"),
                    })}
                  />
                )}
              </AuthField>

              <AuthField id="gender" label="Gender" icon={Users} error={errors.gender?.message}>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger id="gender" className={authSelectClass(!!errors.gender)}>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl z-100">
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </AuthField>
            </div>

            <div className="pt-4 border-t border-border/60">
              <Button
                type="submit"
                disabled={signUp.isPending || isTaken}
                className="h-11 w-full rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-black italic text-sm tracking-wide shadow-md shadow-brand-orange/20 flex items-center justify-center gap-2"
              >
                {signUp.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Creating Account...
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-[13px] font-medium text-muted-foreground mt-3">
              Already have an account?{" "}
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
      </div>
    </div>
  );
}
