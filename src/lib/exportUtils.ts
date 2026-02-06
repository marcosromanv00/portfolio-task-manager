import { Task } from "./types";
import { saveAs } from "file-saver";

function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function generateICS(tasks: Task[]): string {
  let icsContent =
    "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//BubbleTaskManager//EN\n";

  tasks.forEach((task) => {
    // Only export tasks that have a specific time or are active?
    // Let's export all, or allow filtering. For now, export those with dueAt or startAt.
    if (!task.dueAt && !task.startAt) return; // Skip non-scheduled tasks?
    // Actually, let's export tasks with due dates as events.

    // If no startAt, use dueAt - 1 hour, or just dueAt.
    const start =
      task.startAt ||
      (task.dueAt
        ? new Date(task.dueAt.getTime() - 60 * 60 * 1000)
        : new Date());
    const end =
      task.dueAt ||
      (task.startAt
        ? new Date(task.startAt.getTime() + 60 * 60 * 1000)
        : new Date(start.getTime() + 3600000));

    icsContent += "BEGIN:VEVENT\n";
    icsContent += `UID:${task.id}\n`;
    icsContent += `DTSTAMP:${formatDateToICS(new Date())}\n`;
    icsContent += `DTSTART:${formatDateToICS(new Date(start))}\n`;
    icsContent += `DTEND:${formatDateToICS(new Date(end))}\n`;
    icsContent += `SUMMARY:${task.title}\n`;
    if (task.description) {
      icsContent += `DESCRIPTION:${task.description}\n`;
    }
    icsContent += `STATUS:${task.status === "done" ? "CONFIRMED" : "TENTATIVE"}\n`;
    icsContent += "END:VEVENT\n";
  });

  icsContent += "END:VCALENDAR";
  return icsContent;
}

export function downloadICS(tasks: Task[], filename: string = "tasks.ics") {
  const content = generateICS(tasks);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  saveAs(blob, filename);
}
