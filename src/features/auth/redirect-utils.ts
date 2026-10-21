const DEFAULT_FALLBACK_URL = "/me";

function hasTraversalSegment(path: string): boolean {
  const segments = path.split("/");
  return segments.some((segment) => segment === "..");
}

function hasInvalidPrefix(path: string): boolean {
  return !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\");
}

function containsControlChars(value: string): boolean {
  return /[\x00-\x1F\x7F]/.test(value);
}

function isSafeDecodedPath(decodedPath: string): boolean {
  if (hasInvalidPrefix(decodedPath) || decodedPath.includes("\\")) {
    return false;
  }
  return !hasTraversalSegment(decodedPath);
}

export function getSafeReturnUrl(
  target: string | null | undefined,
  fallback: string = DEFAULT_FALLBACK_URL,
): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }

  const trimmed = target.trim();
  if (trimmed.length === 0 || trimmed !== target || containsControlChars(trimmed)) {
    return fallback;
  }

  if (hasInvalidPrefix(trimmed)) {
    return fallback;
  }

  const pathOnly = trimmed.split(/[?#]/)[0] ?? "";
  if (pathOnly.includes("\\") || hasTraversalSegment(pathOnly)) {
    return fallback;
  }

  try {
    const decodedPath = decodeURIComponent(pathOnly);
    if (!isSafeDecodedPath(decodedPath)) {
      return fallback;
    }

    const parsed = new URL(trimmed, "http://localhost");
    if (parsed.origin !== "http://localhost") {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return trimmed;
}
