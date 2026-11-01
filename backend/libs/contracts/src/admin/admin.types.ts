export type AuthStats = {
  users: number;
  weekly: { week_start: string; signups: number }[];
};

export type ClubStats = {
  clubs: number;
  members: number;
  members_per_club: {
    club_id: number;
    name: string;
    slug: string;
    members_count: number;
  }[];
  weekly: { week_start: string; matches: number; bookings: number }[];
};

export type AdminStats = {
  totals: {
    users: number;
    clubs: number;
    members: number;
  };
  members_per_club: {
    club_id: number;
    name: string;
    slug: string;
    members_count: number;
  }[];
  weekly: { week_start: string; signups: number; matches: number; bookings: number }[];
};