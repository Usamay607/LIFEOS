import type { CreateTaskInput, Project, Task, UpdateTaskInput } from "@los/types";

export function assertProjectIntegrity(project: Project): void {
  if (!project.entityId) {
    throw new Error("Project must belong to an entity.");
  }
  if (project.status === "CEASED" && !project.postMortem?.trim()) {
    throw new Error("Ceased projects require a post-mortem.");
  }
}

export function assertTaskCreateIntegrity(input: CreateTaskInput, projects: Project[]): void {
  const project = projects.find((item) => item.id === input.projectId);
  if (!project) {
    throw new Error("Task must belong to an existing project.");
  }
}

export function assertTaskUpdateIntegrity(existing: Task, input: UpdateTaskInput): void {
  if (input.status === "DONE" && existing.status === "DONE") {
    return;
  }
}
