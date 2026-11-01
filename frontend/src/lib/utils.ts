export { cn } from "cn"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1";

export const getUrl = (path: string) => {
	// Remove any duplicate slashes in the path to avoid issues with the backend
	const cleanPath = `${API_PREFIX}${path}`.replace(/\/+/g, "/");
	return `${API_URL}${cleanPath}`;
};

// "Is there probably a session?" The real tokens are httpOnly, so JS can't see them.
// The backend also sets a readable `logged_in=true` cookie with the same lifetime as the refresh token.
export function hasSessionHint(): boolean {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)logged_in=true(?:;|$)/.test(document.cookie);
}
