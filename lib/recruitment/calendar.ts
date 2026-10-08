export function interviewCalendar(
  id: string,
  revision: number,
  input: {
    title: string;
    startsAt: string;
    duration: number;
    location: string;
    instructions: string;
  },
  cancelled = false,
) {
  const esc = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const dt = (v: Date) =>
    v
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//KumaWorks//Recruitment//ID",
      `METHOD:${cancelled ? "CANCEL" : "PUBLISH"}`,
      "BEGIN:VEVENT",
      `UID:${id}@jobs.kumaworks.id`,
      `SEQUENCE:${revision}`,
      `DTSTAMP:${dt(new Date())}`,
      `DTSTART:${dt(new Date(input.startsAt))}`,
      `DTEND:${dt(new Date(Date.parse(input.startsAt) + input.duration * 60000))}`,
      `SUMMARY:${esc(input.title)}`,
      `LOCATION:${esc(input.location)}`,
      `DESCRIPTION:${esc(input.instructions)}`,
      `STATUS:${cancelled ? "CANCELLED" : "CONFIRMED"}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n") + "\r\n"
  );
}
