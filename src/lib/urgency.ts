import { Task } from "./types";
import { differenceInHours } from "date-fns";

export function calculateUrgency(task: Task): number {
  if (
    task.status === "done" ||
    task.status === "discarded" ||
    task.status === "archived" ||
    task.status === "-"
  )
    return 0;

  let score = 0;

  // Priority Score
  switch (task.priority) {
    case "critical":
      score += 100;
      break;
    case "high":
      score += 50;
      break;
    case "medium":
      score += 20;
      break;
    case "-":
      score += 0;
      break;
    case "low":
    default:
      score += 5;
      break;
  }

  // Time-based Score
  if (task.dueAt) {
    const hoursLeft = differenceInHours(new Date(task.dueAt), new Date());

    if (hoursLeft < 0) {
      // Overdue
      score += 50;
    } else if (hoursLeft < 24) {
      score += 30;
    } else if (hoursLeft < 72) {
      score += 15;
    }
  }

  return score;
}
