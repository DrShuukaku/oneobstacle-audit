"use client";

/** Shows a timestamp in the viewer's own time zone. */
export function LocalTime({ value }: { value: string }) {
  const d = new Date(value);
  const text = d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return (
    <time dateTime={value} suppressHydrationWarning>
      {text}
    </time>
  );
}
