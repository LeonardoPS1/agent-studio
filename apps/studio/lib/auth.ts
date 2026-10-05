// Sesión de un solo usuario: cookie firmada con HMAC-SHA256 (Web Crypto, válido en middleware y rutas).
export const COOKIE = "studio_session";

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const sessionToken = (secret: string) => hmacHex(secret, "studio-session-v1");

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const configured = () => Boolean(process.env.STUDIO_PASSWORD && process.env.STUDIO_SECRET);
