export const formatTime = (value?: string | Date): string => {
  if (!value) return "";

  // If value is string and has NO time part → DO NOT SHOW TIME
  if (typeof value === "string" && !value.includes("T")) {
    return "";
  }

  const d = new Date(value);
  if (isNaN(d.getTime())) return "";

  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
