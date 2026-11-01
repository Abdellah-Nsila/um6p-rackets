"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UM6P_DEPARTMENTS, FormErrors } from "./constants";
import { ProfileFormFields } from "./profile-form-fields";
import { editProfileSchema, type EditProfileInput } from "@/lib/schemas/users";

export type UpdateProfileBody = EditProfileInput;

export type SettingsProfile1Props = {
  defaultValues?: UpdateProfileBody;
  onSave?: (data: UpdateProfileBody) => void;
  onCancel?: () => void;
  className?: string;
  isPending?: boolean;
};

const SettingsProfile1 = ({
  defaultValues = {},
  onSave,
  onCancel,
  className,
  isPending = false,
}: SettingsProfile1Props) => {
  const isPresetDepartment = (dept?: string) =>
    dept ? UM6P_DEPARTMENTS.some((d) => d.code === dept) : false;

  const initialDeptValue = defaultValues.department || "";

  const [firstName, setFirstName] = useState(defaultValues.first_name || "");
  const [lastName, setLastName] = useState(defaultValues.last_name || "");
  const [phoneNumber, setPhoneNumber] = useState(defaultValues.phone_number || "");
  const [gender, setGender] = useState<boolean | undefined>(defaultValues.gender);

  const [department, setDepartment] = useState(
    isPresetDepartment(initialDeptValue) || !initialDeptValue ? initialDeptValue : "OTHER"
  );
  const [customDepartment, setCustomDepartment] = useState(
    isPresetDepartment(initialDeptValue) ? "" : initialDeptValue
  );

  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): EditProfileInput | null => {
    const finalDepartment = department === "OTHER" ? customDepartment.trim() : department;

    const payloadToValidate = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      department: finalDepartment,
      phone_number: phoneNumber.trim() || undefined,
      gender,
    };

    const result = editProfileSchema.safeParse(payloadToValidate);

    if (!result.success) {
      const formattedErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field === "first_name") formattedErrors.firstName = issue.message;
        if (field === "last_name") formattedErrors.lastName = issue.message;
        if (field === "department") {
          if (department === "OTHER") {
            formattedErrors.customDepartment = issue.message;
          } else {
            formattedErrors.department = issue.message;
          }
        }
        if (field === "phone_number") {
          (formattedErrors as { phoneNumber?: string }).phoneNumber = issue.message;
        }
      });

      setErrors(formattedErrors);
      return null;
    }

    setErrors({});
    return result.data;
  };

  const handleSave = () => {
    const validatedData = validate();
    if (!validatedData) return;

    onSave?.(validatedData);
  };

  return (
    <div
      className={cn(
        "w-full max-w-xl mx-auto bg-card rounded-2xl sm:rounded-3xl border border-border/80 shadow-2xl overflow-hidden flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="px-6 sm:px-7 pt-6 pb-4 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-4">
        <div className="w-8" />
        <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-brand-ink dark:text-white text-center">
          Profile Settings
        </h2>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="size-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-brand-ink dark:hover:text-white hover:bg-muted/80 transition-colors cursor-pointer border border-border/60 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Body */}
      <div className="p-6 sm:p-7 space-y-5">
        <ProfileFormFields
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          gender={gender}
          setGender={setGender}
          department={department}
          setDepartment={setDepartment}
          customDepartment={customDepartment}
          setCustomDepartment={setCustomDepartment}
          errors={errors}
          setErrors={setErrors}
        />
      </div>

      {/* Footer */}
      <div className="px-6 sm:px-7 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="h-10 px-4 rounded-xl font-bold italic text-xs border-border/80 hover:bg-muted text-brand-ink dark:text-gray-200 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="h-10 px-5 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-black italic text-xs tracking-wide shadow-md shadow-brand-orange/20 cursor-pointer disabled:opacity-70 flex items-center gap-2"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export { SettingsProfile1 };