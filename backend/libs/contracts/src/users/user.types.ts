import { User } from "../auth/auth.types.js";
import { UserProfileData } from "../club/index.js";

export type UserProfile = {
    user: User;
    memberProfile: UserProfileData;
}