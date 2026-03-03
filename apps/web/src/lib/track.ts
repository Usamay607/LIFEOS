import type { Project, Task } from "@los/types";

export type TrackState = "ON_TRACK" | "DUE_SOON" | "AT_RISK";

export function getTaskTrackState(task: Task): TrackState {
  if (task.status === "DONE") {
    return "ON_TRACK";
  }

  if (!task.dueDate) {
    return task.status === "DOING" ? "ON_TRACK" : "DUE_SOON";
  }

  const dueMs = new Date(task.dueDate).getTime();
  const diffDays = Math.ceil((dueMs - Date.now()) / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) {
    return "AT_RISK";
  }
  if (diffDays <= 2) {
    return "DUE_SOON";
  }
  return "ON_TRACK";
}

export function getProjectTrackState(project: Project): TrackState {
  if (project.status === "CEASED") {
    return "AT_RISK";
  }

  if (project.status === "ON_HOLD") {
    return "DUE_SOON";
  }

  if (!project.deadline) {
    return "ON_TRACK";
  }

  const dueMs = new Date(project.deadline).getTime();
  const diffDays = Math.ceil((dueMs - Date.now()) / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) {
    return "AT_RISK";
  }
  if (diffDays <= 5) {
    return "DUE_SOON";
  }
  return "ON_TRACK";
}

export function trackToneClass(state: TrackState): string {
  if (state === "ON_TRACK") {
    return "border-emerald-300/60 bg-emerald-300/15 text-emerald-100";
  }
  if (state === "DUE_SOON") {
    return "border-amber-300/60 bg-amber-300/15 text-amber-100";
  }
  return "border-rose-300/70 bg-rose-300/20 text-rose-100";
}

export function trackBarClass(state: TrackState): string {
  if (state === "ON_TRACK") {
    return "bg-emerald-300";
  }
  if (state === "DUE_SOON") {
    return "bg-amber-300";
  }
  return "bg-rose-300";
}
