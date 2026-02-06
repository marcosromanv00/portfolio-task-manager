import { describe, it, expect } from "vitest";
import { generateICS } from "./exportUtils";
import { Task } from "./types";

const createMockTask = (overrides: Partial<Task>): Task =>
  ({
    id: "abc-123",
    title: "Export Test Task",
    status: "todo",
    priority: "low",
    tags: [],
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
    isGroup: false,
    bubble: { x: 0, y: 0, radius: 20 },
    ...overrides,
  }) as Task;

describe("generateICS", () => {
  it("should generate valid ICS structure", () => {
    const start = new Date("2023-10-27T10:00:00Z");
    const end = new Date("2023-10-27T11:00:00Z");

    const task = createMockTask({
      title: "Meeting with Client",
      startAt: start,
      dueAt: end,
      description: "Discuss project details",
    });

    const ics = generateICS([task]);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:abc-123");
    expect(ics).toContain("SUMMARY:Meeting with Client");
    expect(ics).toContain("DESCRIPTION:Discuss project details");
    expect(ics).toContain("DTSTART:20231027T100000Z");
    expect(ics).toContain("DTEND:20231027T110000Z");
    expect(ics).toContain("STATUS:TENTATIVE");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("should handle tasks with only due date (default duration)", () => {
    const due = new Date("2023-10-27T10:00:00Z");
    const task = createMockTask({
      title: "Due Only Task",
      dueAt: due,
    });

    const ics = generateICS([task]);

    // Default logic: start = due - 1h
    expect(ics).toContain("DTEND:20231027T100000Z");
    expect(ics).toContain("DTSTART:20231027T090000Z");
  });
});
