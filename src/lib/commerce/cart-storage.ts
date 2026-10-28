const eventName = "archive-cart-change";
export function readCart(): string[] {
  try {
    const encoded = document.cookie.split("; ").find(value => value.startsWith("archive_cart="))?.slice("archive_cart=".length);
    const value = encoded ? JSON.parse(decodeURIComponent(encoded)) : [];
    return Array.isArray(value) ? [...new Set(value.filter((slug): slug is string => typeof slug === "string" && /^[a-z0-9-]{1,120}$/.test(slug)))].slice(0, 4) : [];
  } catch { return []; }
}
export function saveCart(slugs: string[]) {
  document.cookie = `archive_cart=${encodeURIComponent(JSON.stringify(slugs))}; Path=/; Max-Age=2592000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  window.dispatchEvent(new Event(eventName));
}
export function subscribeCart(callback: () => void) {
  window.addEventListener(eventName, callback);
  window.addEventListener("focus", callback);
  window.addEventListener("pageshow", callback);
  return () => {
    window.removeEventListener(eventName, callback);
    window.removeEventListener("focus", callback);
    window.removeEventListener("pageshow", callback);
  };
}
export const cartCount = () => readCart().length;
export const emptyCartCount = () => 0;
