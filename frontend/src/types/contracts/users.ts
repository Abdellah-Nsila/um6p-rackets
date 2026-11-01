import { User } from "./auth";
import { UserProfileData } from "./club";

export type UserProfile = {
    user: User;
    memberProfile: UserProfileData;
}

export type UpdateProfileBody = {
    first_name?: string;
    last_name?: string;
    department?: string;
    phone_number?: string;
    gender?: boolean;
}
