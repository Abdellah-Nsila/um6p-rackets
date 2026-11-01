export const UM6P_DEPARTMENTS = [
    { code: "1337", name: "1337" },
    { code: "EMINES", name: "EMINES" },
    { code: "FMS", name: "FMS" },
    { code: "CS", name: "CS" },
    { code: "SAP-D", name: "SAP-D" },
    { code: "GUP+", name: "GUP+" },
{ code: "OTHER", name: "Other" },
] as const;

export type Um6pDepartmentCode = (typeof UM6P_DEPARTMENTS)[number]["code"];

export interface ProfileFormData {
    first_name?: string;
    last_name?: string;
    name: string;
    username: string;
    email: string;
    avatar?: string | null;
    department: string;
    customDepartment?: string;
}

export interface SettingsProfile1Props {
    defaultValues?: Partial<ProfileFormData>;
    onSave?: (data: ProfileFormData) => void;
    onCancel?: () => void;
    className?: string;
}

export interface FormErrors {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    department?: string;
    customDepartment?: string;
}
