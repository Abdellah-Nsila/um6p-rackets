// ================== AUTH SERVICE ==================

export const AUTH_PATTERNS = {
  HEALTH: 'auth.health',
  // ================== AUTH SERVICE ==================
  REGISTER: 'auth.register',
  LOGIN: 'auth.login',
  REFRESH: 'auth.refresh',
  OAUTH_LOGIN: 'auth.oauth.login',
  OAUTH_CALLBACK: 'auth.oauth.callback',
  LOGOUT: 'auth.logout',
  COMPLETE_PROFILE: 'auth.complete-profile',
  FORGET_PASSWORD: 'auth.forget-password',
  RESET_PASSWORD: 'auth.reset-password',
  // ================== USER SERVICE ==================
  IS_LOGIN_AVAILABLE: 'auth.user.is_login_available',
  GET_USER_BY_ID: 'auth.user.get_by_id',
  GET_USER_BY_LOGIN: 'auth.user.get_by_login',
  GET_USERS_BY_IDS: 'auth.users.get_many_by_ids',
  UPDATE_USER: 'auth.user.update',
  // ================== ADMIN SERVICE ==================
  ADMIN_LIST_USERS: 'auth.admin.list_users',
  ADMIN_UPDATE_USER: 'auth.admin.update_user',
  ADMIN_DELETE_USER: 'auth.admin.delete_user',
  ADMIN_STATS: 'auth.admin.stats',
} as const;

// ================== CLUB SERVICE ==================

export const CLUB_PATTERNS = {
  GET_CLUBS: 'club.get-clubs',
  GET_CLUB: 'club.get-club',
  GET_CLUB_STATUS: 'club.get-club-status',
  PATCH_CLUB_UPDATE: 'club.patch-club-update',
  POST_CLUB_JOIN: 'club.post-club-join',
  DELETE_CLUB_JOIN: 'club.delete-club-join',
  GET_CLUB_LEADERBOARD: 'club.get-club-leaderboard',
  GET_CLUB_JOIN_REQUESTS: 'club.get-club-join-requests',
  POST_CLUB_JOIN_REQUEST_REJECT: 'club.post-club-join-request-reject',
  DELETE_CLUB_LEAVE: 'club.delete-club-leave',
  // ================== SESSIONS SERVICE ==================
  GET_CLUB_WEEK_SESSIONS: 'club.get-club-week-sessions',
  POST_CLUB_SESSION_ATTEND: 'club.post-club-session-attend',
  DELETE_CLUB_SESSION_ATTEND: 'club.delete-club-session-attend',
  POST_CLUB_SESSION_CREATE: 'club.post-club-session-create',
  PATCH_CLUB_SESSION_UPDATE: 'club.patch-club-session-update',
  DELETE_CLUB_SESSION_DELETE: 'club.delete-club-session-delete',
  // ================== MEMBERS SERVICE ==================
  GET_USER_PROFILE: 'club.get-user-profile',
  GET_USER_MEMBERSHIPS: 'club.get-user-memberships',
  GET_USER_ACHIEVEMENTS: 'club.get-user-achievements',
  GET_USER_MATCHES: 'club.get-user-matches',
  GET_CLUB_MEMBERS: 'club.get-club-members',
  POST_CLUB_MEMBER_ADD: 'club.post-club-member-add',
  DELETE_CLUB_MEMBER_REMOVE: 'club.delete-club-member-remove',
  PATCH_CLUB_MEMBER_ROLE_UPDATE: 'club.patch-club-member-role-update',
  // ================== ANNOUNCEMENTS SERVICE ==================
  GET_CLUB_ANNOUNCEMENTS: 'club.get-club-announcements',
  POST_CLUB_ANNOUNCEMENT_CREATE: 'club.post-club-announcement-create',
  DELETE_CLUB_ANNOUNCEMENT_DELETE: 'club.delete-club-announcement-delete',
  // ================== DOCUMENTS SERVICE ==================
  GET_CLUB_DOCUMENTS: 'club.get-club-documents',
  POST_CLUB_DOCUMENT_CREATE: 'club.post-club-document-create',
  DELETE_CLUB_DOCUMENT_DELETE: 'club.delete-club-document-delete',
  // ================== ACHIEVEMENTS SERVICE ==================
  GET_CLUB_ACHIEVEMENTS: 'club.get-club-achievements',
  POST_CLUB_ACHIEVEMENT_CREATE: 'club.post-club-achievement-create',
  DELETE_CLUB_ACHIEVEMENT_DELETE: 'club.delete-club-achievement-delete',
  // ================== MATCHES SERVICE ==================
  GET_CLUB_MATCHES: 'club.get-club-matches',
  POST_CLUB_MATCH_REQUEST: 'club.post-club-match-request',
  GET_CLUB_MATCH: 'club.get-club-match',
  POST_CLUB_MATCH_ACCEPT: 'club.post-club-match-accept',
  POST_CLUB_MATCH_REJECT: 'club.post-club-match-reject',
  POST_CLUB_MATCH_CANCEL: 'club.post-club-match-cancel',
  POST_CLUB_MATCH_RESULT: 'club.post-club-match-result',
  // ================== LEADERBOARD SERVICE ==================
  GET_USER_CLUB_LEADERBOARD: 'club.get-user-club-leaderboard',
  // ================== ADMIN SERVICE ==================
  GET_CLUB_ADMIN_STATS: 'club.admin.stats',
  POST_CLUB_ADMIN_CREATE: 'club.admin.create',
  DELETE_CLUB_ADMIN_DELETE: 'club.admin.delete',
  WHEN_USER_DELETED: 'club.when-user-deleted',
} as const;

// ================= NOTIFICATION SERVICE ==================

export const NOTIFICATION_PATTERNS = {
  HELLO: 'notification.hello',
  GET_INBOX: 'notification.get-inbox',
  CREATE_NOTIFICATION: 'notification.create',
  MARK_AS_READ: 'notification.mark-as-read',
  MARK_ALL_AS_READ: 'notification.mark-all-as-read',
} as const;
