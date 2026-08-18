/**
 * Single guarded service-worker registration point.
 * Never registers in dev, inside an iframe, or in Lovable preview hosts.
 */
const BLOCKED_HOST_SUFFIXES = [
  "lovableproject.com",
  "lovableproject-dev.com",
  "beta.lovable.dev",
];

function isBlockedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const { hostname, search } = window.location;
  if (new URLSearchParams(search).has("sw") && new URLSearchParams(search).get("sw") === "off") {
    return true;
  }
  if (hostname.startsWith("id-preview--") || hostname.startsWith("preview--")) return true;
  return BLOCKED_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
  );
}

async function unregisterAppWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((registration) => {
        const scriptURL =
          registration.active?.scriptURL ??
          registration.waiting?.scriptURL ??
          registration.installing?.scriptURL ??
          "";
        return scriptURL.endsWith("/sw.js");
      })
      .map((registration) => registration.unregister()),
  );
}

export function setupServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (isBlockedContext()) {
    void unregisterAppWorker();
    return;
  }
  void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
    /* registration failures are non-fatal */
  });
}
