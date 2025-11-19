// In-memory access token storage. Refresh token is stored server-side in an httpOnly cookie.
let slidingToken: string | null = null;

// LocalStorage-based helpers for access (sliding) & refresh tokens.

const ACCESS_KEY = 'lms_access_token';
const REFRESH_KEY = 'lms_refresh_token';

export function getSlidingToken(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null;
  } catch {
    return null;
  }
}

export function setSlidingToken(token: string) {
  try {
    if (typeof window !== 'undefined') localStorage.setItem(ACCESS_KEY, token);
  } catch {}
}

export function clearSlidingToken() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  } catch {}
}

export function setRefreshToken(refresh: string) {
  try {
    if (typeof window !== 'undefined') localStorage.setItem(REFRESH_KEY, refresh);
  } catch {}
}

export default {
  getSlidingToken,
  setSlidingToken,
  clearSlidingToken,
  setRefreshToken,
};
