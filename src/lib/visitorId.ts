/**
 * Anonymous session-scoped visitor ID for correlating search events.
 * PII-free — just a UUID in sessionStorage. Reuses the key UTMCapture
 * already populates so we don't fragment the same visitor across keys.
 */
const KEY = "analytics_session_id";

const randomId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `vid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getVisitorId = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    let id = window.sessionStorage.getItem(KEY);
    if (!id) {
      id = randomId();
      window.sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null;
  }
};
