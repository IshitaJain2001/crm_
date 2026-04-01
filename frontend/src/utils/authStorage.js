/**
 * Auth tokens live in sessionStorage for normal login; registration and
 * invitation flows historically used localStorage. Reads both and prefer sessionStorage.
 */
export function getAuthToken() {
  return (
    sessionStorage.getItem("token") || localStorage.getItem("token") || ""
  );
}

export function getAuthUserJson() {
  return (
    sessionStorage.getItem("user") || localStorage.getItem("user") || null
  );
}

export function parseAuthUser() {
  const raw = getAuthUserJson();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
