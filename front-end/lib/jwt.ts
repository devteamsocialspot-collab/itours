/** Decode a JWT payload without verifying it (the back-end verifies on every request). Works in the edge runtime. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    const json = new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const jwtExpiry = (token: string): number | undefined => {
  const exp = decodeJwtPayload(token)?.exp;
  return typeof exp === "number" ? exp : undefined;
};
