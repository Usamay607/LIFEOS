"use client";

import { useMemo, useState } from "react";
import type { CreateTaskInput, Entity, Project, ProjectStatus, Task, TaskStatus } from "@los/types";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { formatDate } from "@/lib/format";
import { getProjectTrackState, getTaskTrackState, trackBarClass, trackToneClass } from "@/lib/track";

const PROJECT_STATUSES: Array<ProjectStatus | "ALL"> = ["ALL", "ACTIVE", "ON_HOLD", "CEASED"];
const TASK_STATUSES: Array<TaskStatus | "ALL"> = ["ALL", "NEXT", "DOING", "WAITING", "DONE"];

interface ProjectsWorkspaceProps {
  initialProjects: Project[];
  initialTasks: Task[];
  entities: Entity[];
}

export function ProjectsWorkspace({ initialProjects, initialTasks, entities }: ProjectsWorkspaceProps) {
  const [projects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projectFilter, setProjectFilter] = useState<ProjectStatus | "ALL">("ALL");
  const [taskFilter, setTaskFilter] = useState<TaskStatus | "ALL">("ALL");
  const [focusedProjectId, setFocusedProjectId] = useState<string>(initialProjects[0]?.id ?? "");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProjectId, setNewTaskProjectId] = useState(initialProjects[0]?.id ?? "");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskEnergy, setNewTaskEnergy] = useState<CreateTaskInput["energy"]>("MEDIUM");
  const [newTaskContext, setNewTaskContext] = useState<CreateTaskInput["context"]>("LAPTOP");
  const [newTaskRecurring, setNewTaskRecurring] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  const entityById = useMemo(() => new Map(entities.map((entity) => [entity.id, entity.name])), [entities]);

  const filteredProjects = useMemo(() => {
    if (projectFilter === "ALL") {
      return projects;
    }
    return projects.filter((project) => project.status === projectFilter);
  }, [projects, projectFilter]);

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) => !focusedProjectId || task.projectId === focusedProjectId)
      .filter((task) => taskFilter === "ALL" || task.status === taskFilter)
      .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
  }, [tasks, focusedProjectId, taskFilter]);

  const metrics = useMemo(() => {
    const activeProjects = projects.filter((project) => project.status === "ACTIVE").length;
    const overdueTasks = tasks.filter((task) => task.status !== "DONE" && getTaskTrackState(task) === "AT_RISK").length;
    const dueSoonTasks = tasks.filter((task) => task.status !== "DONE" && getTaskTrackState(task) === "DUE_SOON").length;
    const doingTasks = tasks.filter((task) => task.status === "DOING").length;

    return {
      activeProjects,
      overdueTasks,
      dueSoonTasks,
      doingTasks,
    };
  }, [projects, tasks]);

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    setUpdatingTaskId(taskId);
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      const updated = (await response.json()) as Task;
      setTasks((current) => current.map((task) => (task.id === taskId ? updated : task)));
    }
    setUpdatingTaskId(null);
  }

  async function createTask() {
    if (!newTaskTitle.trim() || !newTaskProjectId) {
      return;
    }

    setCreatingTask(true);
    const payload: CreateTaskInput = {
      title: newTaskTitle.trim(),
      projectId: newTaskProjectId,
      dueDate: newTaskDueDate || undefined,
      energy: newTaskEnergy,
      context: newTaskContext,
      recurring: newTaskRecurring,
    };

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const created = (await response.json()) as Task;
      setTasks((current) => [created, ...current]);
      setNewTaskTitle("");
      setNewTaskDueDate("");
      setNewTaskRecurring(false);
      setFocusedProjectId(created.projectId);
      setNewTaskProjectId(created.projectId);
    }

    setCreatingTask(false);
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-emerald-300/50 bg-emerald-300/10 p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-white/70">Active Projects</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-100">{metrics.activeProjects}</p>
        </div>
        <div className="rounded-xl border border-blue-300/50 bg-blue-300/10 p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-white/70">Doing Tasks</p>
          <p className="mt-1 text-2xl font-semibold text-blue-100">{metrics.doingTasks}</p>
        </div>
        <div className="rounded-xl border border-amber-300/60 bg-amber-300/15 p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-white/70">Due Soon</p>
          <p className="mt-1 text-2xl font-semibold text-amber-100">{metrics.dueSoonTasks}</p>
        </div>
        <div className="rounded-xl border border-rose-300/60 bg-rose-300/15 p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-white/70">Overdue / At Risk</p>
          <p className="mt-1 text-2xl font-semibold text-rose-100">{metrics.overdueTasks}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {PROJECT_STATUSES.map((status) => (
            <Button
              key={status}
              variant={status === projectFilter ? "solid" : "ghost"}
              onClick={() => setProjectFilter(status)}
            >
              {status.replace("_", " ")}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const trackState = getProjectTrackState(project);
            return (
              <article key={project.id} className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                <div className={`mb-2 flex items-center justify-between rounded-lg border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em] ${trackToneClass(trackState)}`}>
                  <span>{trackState.replace("_", " ")}</span>
                  <span className={`inline-block h-2.5 w-12 rounded-full ${trackBarClass(trackState)}`} />
                </div>

                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-white">{project.name}</h3>
                  <StatusPill value={project.status} />
                </div>

                <p className="text-xs text-white/70">Entity: {entityById.get(project.entityId) ?? "Unknown"}</p>
                <p className="text-xs text-white/65">Deadline: {formatDate(project.deadline)}</p>
                <p className="mt-1 text-xs text-white/70">Next: {project.nextMilestone ?? "No milestone set"}</p>

                <Button
                  className="mt-3 w-full"
                  variant={project.id === focusedProjectId ? "solid" : "ghost"}
                  onClick={() => {
                    setFocusedProjectId(project.id);
                    setNewTaskProjectId(project.id);
                  }}
                >
                  {project.id === focusedProjectId ? "Focused" : "Focus Project"}
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 lg:col-span-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-white">Task Workflow</h2>
            <div className="flex flex-wrap gap-2">
              {TASK_STATUSES.map((status) => (
                <Button
                  key={status}
                  variant={status === taskFilter ? "solid" : "ghost"}
                  onClick={() => setTaskFilter(status)}
                >
                  {status.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {visibleTasks.length === 0 ? (
              <p className="rounded-xl border border-emerald-300/50 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">
                No tasks in this filter.
              </p>
            ) : (
              visibleTasks.map((task) => {
                const state = getTaskTrackState(task);
                return (
                  <article key={task.id} className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                    <div className={`mb-2 flex items-center justify-between rounded-lg border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em] ${trackToneClass(state)}`}>
                      <span>{state.replace("_", " ")}</span>
                      <span className={`inline-block h-2.5 w-12 rounded-full ${trackBarClass(state)}`} />
                    </div>

                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-white">{task.title}</p>
                        <p className="text-xs text-white/65">
                          Due {formatDate(task.dueDate)} · {task.context.toLowerCase()} · {task.energy.toLowerCase()} energy
                        </p>
                      </div>
                      <StatusPill value={task.status} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={task.status === "NEXT" ? "solid" : "ghost"}
                        disabled={updatingTaskId === task.id}
                        onClick={() => void updateTaskStatus(task.id, "NEXT")}
                      >
                        Next
                      </Button>
                      <Button
                        variant={task.status === "DOING" ? "solid" : "ghost"}
                        disabled={updatingTaskId === task.id}
                        onClick={() => void updateTaskStatus(task.id, "DOING")}
                      >
                        Doing
                      </Button>
                      <Button
                        variant={task.status === "WAITING" ? "solid" : "ghost"}
                        disabled={updatingTaskId === task.id}
                        onClick={() => void updateTaskStatus(task.id, "WAITING")}
                      >
                        Waiting
                      </Button>
                      <Button
                        variant={task.status === "DONE" ? "solid" : "ghost"}
                        disabled={updatingTaskId === task.id}
                        onClick={() => void updateTaskStatus(task.id, "DONE")}
                      >
                        Done
                      </Button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 lg:col-span-4">
          <h2 className="mb-3 text-base font-semibold text-white">Quick Add Task</h2>
          <div className="space-y-2">
            <input
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.currentTarget.value)}
              className="w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
              placeholder="Task title"
            />

            <select
              value={newTaskProjectId}
              onChange={(event) => setNewTaskProjectId(event.currentTarget.value)}
              className="w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={newTaskDueDate}
              onChange={(event) => setNewTaskDueDate(event.currentTarget.value)}
              className="w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={newTaskEnergy}
                onChange={(event) => setNewTaskEnergy(event.currentTarget.value as CreateTaskInput["energy"])}
                className="w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>

              <select
                value={newTaskContext}
                onChange={(event) => setNewTaskContext(event.currentTarget.value as CreateTaskInput["context"])}
                className="w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
              >
                <option value="LAPTOP">LAPTOP</option>
                <option value="PHONE">PHONE</option>
                <option value="ERRANDS">ERRANDS</option>
                <option value="CALLS">CALLS</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={newTaskRecurring}
                onChange={(event) => setNewTaskRecurring(event.currentTarget.checked)}
              />
              Recurring
            </label>

            <Button disabled={creatingTask} className="w-full" onClick={() => void createTask()}>
              {creatingTask ? "Adding..." : "Add Task"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
