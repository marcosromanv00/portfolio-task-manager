import { describe, it, expect } from "vitest";
import { calculateUrgency } from "./urgency";
import { Task } from "./types";
import { addHours, subHours } from "date-fns";

// Helper to create a partial mock task
const createMockTask = (overrides: Partial<Task>): Task =>
  ({
    id: "1",
    title: "Test Task",
    status: "todo",
    priority: "low",
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isGroup: false,
    bubble: { x: 0, y: 0, radius: 20 },
    ...overrides,
  }) as Task;

describe("calculateUrgency", () => {
  it("should return 0 for done or discarded tasks", () => {
    expect(
      calculateUrgency(
        createMockTask({ status: "done", priority: "critical" }),
      ),
    ).toBe(0);
    expect(
      calculateUrgency(
        createMockTask({ status: "discarded", priority: "critical" }),
      ),
    ).toBe(0);
  });

  it("should calculate priority score correctly", () => {
    expect(calculateUrgency(createMockTask({ priority: "low" }))).toBe(5);
    expect(calculateUrgency(createMockTask({ priority: "medium" }))).toBe(20);
    expect(calculateUrgency(createMockTask({ priority: "high" }))).toBe(50);
    expect(calculateUrgency(createMockTask({ priority: "critical" }))).toBe(
      100,
    );
  });

  it("should add urgency for approaching deadlines", () => {
    const now = new Date();
    const dueSoon = addHours(now, 2); // < 24h
    const dueLater = addHours(now, 30); // < 72h
    const dueFar = addHours(now, 100); // > 72h

    // Base(20) + <24h(30) = 50
    expect(
      calculateUrgency(createMockTask({ priority: "medium", dueAt: dueSoon })),
    ).toBe(50);

    // Base(20) + <72h(15) = 35
    expect(
      calculateUrgency(createMockTask({ priority: "medium", dueAt: dueLater })),
    ).toBe(35);

    // Base(20) + >72h(0) = 20
    expect(
      calculateUrgency(createMockTask({ priority: "medium", dueAt: dueFar })),
    ).toBe(20);
  });

  it("should add extra urgency for overdue tasks", () => {
    const overdue = subHours(new Date(), 2);
    // Base(20) + Overdue(50) = 70
    expect(
      calculateUrgency(createMockTask({ priority: "medium", dueAt: overdue })),
    ).toBe(70);
  });
});
