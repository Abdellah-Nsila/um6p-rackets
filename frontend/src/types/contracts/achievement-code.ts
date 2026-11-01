// Stored as text in the database. Never rename or delete a code: old rows use it.
export enum AchievementCode {
  // competition
  FIRST_WIN = 'FIRST_WIN',
  TEN_WINS = 'TEN_WINS',
  FIFTY_WINS = 'FIFTY_WINS',
  WIN_STREAK_5 = 'WIN_STREAK_5',
  SEASON_CHAMPION = 'SEASON_CHAMPION',
  RUNNER_UP = 'RUNNER_UP',
  THIRD_PLACE = 'THIRD_PLACE',
  // attendance
  FIRST_SESSION = 'FIRST_SESSION',
  TEN_SESSIONS = 'TEN_SESSIONS',
  PERFECT_ATTENDANCE = 'PERFECT_ATTENDANCE',
  // club life
  FOUNDING_MEMBER = 'FOUNDING_MEMBER',
  MOST_IMPROVED = 'MOST_IMPROVED',
  MVP = 'MVP',
  BEST_TEAMMATE = 'BEST_TEAMMATE',
}