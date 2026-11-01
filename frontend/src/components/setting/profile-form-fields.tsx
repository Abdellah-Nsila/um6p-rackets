"use client";

import { cn } from "@/lib/utils";
import { User, Phone, GraduationCap, Users, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UM6P_DEPARTMENTS, FormErrors } from "./constants";

interface ProfileFormFieldsProps {
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  gender: boolean | undefined;
  setGender: (val: boolean) => void;
  department: string;
  setDepartment: (val: string) => void;
  customDepartment: string;
  setCustomDepartment: (val: string) => void;
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
}

export function ProfileFormFields({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phoneNumber,
  setPhoneNumber,
  gender,
  setGender,
  department,
  setDepartment,
  customDepartment,
  setCustomDepartment,
  errors,
  setErrors,
}: ProfileFormFieldsProps) {
  const phoneNumberError = (errors as FormErrors & { phoneNumber?: string }).phoneNumber;

  return (
    <div className="space-y-5">
      {/* First & Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="first_name"
            className={cn(
              "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5",
              errors.firstName ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <User className="size-3.5 text-brand-orange" />
            First Name *
          </Label>
          <Input
            id="first_name"
            placeholder="e.g. Alex"
            value={firstName}
            aria-invalid={!!errors.firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
            }}
            className={cn(
              "h-10.5 rounded-xl bg-background/60 focus-visible:ring-2 font-medium text-sm transition-all",
              errors.firstName
                ? "border-destructive focus-visible:ring-destructive/30"
                : "border-border/80 focus-visible:ring-brand-orange/40",
            )}
          />
          {errors.firstName && (
            <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="size-3 shrink-0" />
              {errors.firstName}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="last_name"
            className={cn(
              "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5",
              errors.lastName ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <User className="size-3.5 text-brand-orange" />
            Last Name *
          </Label>
          <Input
            id="last_name"
            placeholder="e.g. Morgan"
            value={lastName}
            aria-invalid={!!errors.lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
            }}
            className={cn(
              "h-10.5 rounded-xl bg-background/60 focus-visible:ring-2 font-medium text-sm transition-all",
              errors.lastName
                ? "border-destructive focus-visible:ring-destructive/30"
                : "border-border/80 focus-visible:ring-brand-orange/40",
            )}
          />
          {errors.lastName && (
            <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="size-3 shrink-0" />
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Phone Number & Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="phone_number"
            className={cn(
              "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5",
              phoneNumberError ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <Phone className="size-3.5 text-brand-orange" />
            Phone Number
          </Label>
          <Input
            id="phone_number"
            placeholder="+212 600 000 000"
            value={phoneNumber}
            aria-invalid={!!phoneNumberError}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              if (phoneNumberError) setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
            }}
            className={cn(
              "h-10.5 rounded-xl bg-background/60 focus-visible:ring-2 font-medium text-sm transition-all border-border/80 focus-visible:ring-brand-orange/40",
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="gender"
            className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground"
          >
            <Users className="size-3.5 text-brand-orange" />
            Gender
          </Label>
          <Select
            // FIX: Fallback to "" instead of undefined to keep the component controlled from render 1
            value={gender === undefined ? "" : gender ? "male" : "female"}
            onValueChange={(val) => setGender(val === "male")}
          >
            <SelectTrigger
              id="gender"
              className="w-full h-10.5 rounded-xl bg-background/60 px-3.5 text-sm font-medium focus-visible:ring-2 transition-all border-border/80 focus-visible:ring-brand-orange/40"
            >
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent className="max-h-60 rounded-xl border border-border/80 shadow-2xl bg-popover z-100">
              <SelectGroup>
                <SelectItem value="male" className="py-2.5 px-3.5 rounded-lg cursor-pointer">
                  <span className="font-semibold text-xs text-brand-ink dark:text-gray-200">
                    Male
                  </span>
                </SelectItem>
                <SelectItem value="female" className="py-2.5 px-3.5 rounded-lg cursor-pointer">
                  <span className="font-semibold text-xs text-brand-ink dark:text-gray-200">
                    Female
                  </span>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* UM6P Department Select */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="department"
            className={cn(
              "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5",
              errors.department || errors.customDepartment
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            <GraduationCap className="size-3.5 text-brand-orange" />
            Department *
          </Label>
          <span className="text-[11px] font-bold italic text-brand-orange">Required</span>
        </div>
        <Select
          value={department}
          onValueChange={(val) => {
            if (val) {
              setDepartment(val);
              if (errors.department) setErrors((prev) => ({ ...prev, department: undefined }));
              if (val !== "OTHER" && errors.customDepartment)
                setErrors((prev) => ({ ...prev, customDepartment: undefined }));
            }
          }}
        >
          <SelectTrigger
            id="department"
            aria-invalid={!!errors.department}
            className={cn(
              "w-full h-10.5 rounded-xl bg-background/60 px-3.5 text-sm font-medium focus-visible:ring-2 transition-all",
              errors.department || errors.customDepartment
                ? "border-destructive focus-visible:ring-destructive/30"
                : "border-border/80 focus-visible:ring-brand-orange/40",
            )}
          >
            <SelectValue placeholder="Select Department">
              {(val) => {
                if (!val) return "Select Department";
                const found = UM6P_DEPARTMENTS.find((d) => d.code === val);
                return found ? (
                  <span className="font-semibold text-brand-ink dark:text-white">{found.code}</span>
                ) : (
                  val
                );
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-60 rounded-xl border border-border/80 shadow-2xl bg-popover z-100">
            <SelectGroup>
              <SelectLabel className="text-[11px] font-black italic uppercase tracking-wider text-muted-foreground px-2.5 py-1.5">
                UM6P Schools & Departments
              </SelectLabel>
              {UM6P_DEPARTMENTS.map((dept) => (
                <SelectItem
                  key={dept.code}
                  value={dept.code}
                  className="py-2.5 px-3.5 rounded-lg cursor-pointer"
                >
                  <span className="font-semibold text-xs text-brand-ink dark:text-gray-200">
                    {dept.code}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {department === "OTHER" && (
          <Input
            value={customDepartment}
            maxLength={50}
            placeholder="Specify your department..."
            onChange={(e) => {
              setCustomDepartment(e.target.value);
              if (errors.customDepartment)
                setErrors((prev) => ({ ...prev, customDepartment: undefined }));
            }}
            className={cn(
              "mt-3 h-10.5 w-full rounded-xl bg-background/60 animate-in fade-in slide-in-from-top-2 duration-200",
              errors.customDepartment
                ? "border-destructive focus-visible:ring-destructive/30"
                : "border-border/80 focus-visible:ring-brand-orange/40",
            )}
          />
        )}

        {errors.department ? (
          <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="size-3 shrink-0" />
            {errors.department}
          </p>
        ) : errors.customDepartment ? (
          <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="size-3 shrink-0" />
            {errors.customDepartment}
          </p>
        ) : null}
      </div>
    </div>
  );
}
