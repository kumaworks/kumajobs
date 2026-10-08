import { interviewCalendar } from "./calendar";
test("calendar updates retain UID and increment sequence; text cannot inject properties", () => {
  const input = {
    title: "Interview\nATTENDEE:bad",
    startsAt: "2027-01-01T03:00:00Z",
    duration: 60,
    location: "Office, Jakarta",
    instructions: "Bring CV",
  };
  const value = interviewCalendar("meeting", 2, input, true);
  expect(value).toContain("UID:meeting@jobs.kumaworks.id");
  expect(value).toContain("SEQUENCE:2");
  expect(value).toContain("DTEND:20270101T040000Z");
  expect(value).toContain("STATUS:CANCELLED");
  expect(value).not.toContain("\r\nATTENDEE:");
});
