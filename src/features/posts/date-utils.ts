import dayjs from "dayjs";

export function formatRelativeTime(
  dateInput?: string | number | Date | null,
  referenceTime?: string | number | Date,
): string {
  if (!dateInput) {
    return "Recently";
  }

  const date = dayjs(dateInput);
  if (!date.isValid()) {
    return "Recently";
  }

  const reference = referenceTime ? dayjs(referenceTime) : dayjs();
  const diffInSeconds = reference.diff(date, "second");

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = reference.diff(date, "minute");
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = reference.diff(date, "hour");
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = reference.diff(date, "day");
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.format("DD MMM YYYY");
}
