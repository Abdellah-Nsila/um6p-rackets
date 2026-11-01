export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export type User = {
  id: number; // bigserial PK
  login: string; // varchar(255) UNIQUE
  first_name: string; // varchar(255)
  last_name: string; // varchar(255)
  gender: boolean | null; // boolean
  department: string | null; // text
  phone_number: string | null; // varchar(50)
  email: string; // varchar(255) UNIQUE
  avatar: string | null; // text
  role: UserRole; // enum('USER', 'ADMIN')
  joined_at: string; // timestamptz
};

export type registerPayload = {
  first_name: string;
  last_name: string;
  login: string;
  gender?: boolean | null;
  department?: string | null;
  phone_number?: string | null;
  email: string;
  password: string;
  avatar?: string | null;
};

export type loginPayload = {
  email: string;
  password: string;
  rememberMe?: boolean; // Optional field for "Remember Me" functionality
};

export type forgotPasswordPayload = {
  email: string;
};

export type resetPasswordPayload = {
  token: string;
  newPassword: string;
};