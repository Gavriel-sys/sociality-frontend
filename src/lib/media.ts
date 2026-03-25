const DEFAULT_AVATAR = "/avatars/default-avatar.png";

function sanitizeMediaValue(value?: string | null) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const lowered = normalized.toLowerCase();
  if (lowered === "null" || lowered === "undefined") {
    return null;
  }

  return normalized;
}

function getApiOrigin() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    return null;
  }

  try {
    return new URL(baseUrl).origin;
  } catch {
    return null;
  }
}

export function resolveMediaUrl(value?: string | null) {
  const normalized = sanitizeMediaValue(value);
  if (!normalized) {
    return null;
  }

  if (/^(https?:|data:|blob:)/i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith("//")) {
    return `https:${normalized}`;
  }

  const apiOrigin = getApiOrigin();
  if (!apiOrigin) {
    return normalized;
  }

  try {
    const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return new URL(path, apiOrigin).toString();
  } catch {
    return normalized;
  }
}

export function getAvatarSrc(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const resolved = resolveMediaUrl(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return DEFAULT_AVATAR;
}

export { DEFAULT_AVATAR };
