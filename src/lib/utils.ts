// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/id";
import { twMerge } from "tailwind-merge";
import type { Pagination } from "@/types/social";

dayjs.extend(relativeTime);
dayjs.locale("id");

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | null) {
  if (!value) return "-";

  try {
    return dayjs(value).format("DD MMM YYYY, HH:mm");
  } catch {
    return value;
  }
}

export function formatRelativeTime(value?: string | null) {
  if (!value) return "Baru saja";

  try {
    return dayjs(value).fromNow();
  } catch {
    return "Baru saja";
  }
}

export function formatCount(value?: number | null) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

export function getNextPageParam(pagination?: Pagination | null) {
  if (!pagination) return undefined;

  if (pagination.page >= pagination.totalPages) {
    return undefined;
  }

  return pagination.page + 1;
}
