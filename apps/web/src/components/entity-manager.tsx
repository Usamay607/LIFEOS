"use client";

import { useMemo, useState } from "react";
import type { Area, Entity } from "@los/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EntityManagerProps {
  initialEntities: Entity[];
  areas: Area[];
}

export function EntityManager({ initialEntities, areas }: EntityManagerProps) {
  const [entities, setEntities] = useState<Entity[]>(initialEntities);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newAreaId, setNewAreaId] = useState(areas[0]?.id ?? "");
  const [newType, setNewType] = useState<Entity["type"]>("PROJECT");

  const activeCount = useMemo(
    () => entities.filter((entity) => entity.status === "ACTIVE").length,
    [entities],
  );

  async function renameEntity(id: string, name: string) {
    setSavingId(id);
    const response = await fetch(`/api/entities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (response.ok) {
      const updated = (await response.json()) as Entity;
      setEntities((current) => current.map((entity) => (entity.id === id ? updated : entity)));
    }
    setSavingId(null);
  }

  async function archiveEntity(id: string) {
    setSavingId(id);
    const response = await fetch(`/api/entities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ARCHIVED" }),
    });

    if (response.ok) {
      const updated = (await response.json()) as Entity;
      setEntities((current) => current.map((entity) => (entity.id === id ? updated : entity)));
    }
    setSavingId(null);
  }

  async function createEntity() {
    if (!newName.trim() || !newAreaId) {
      return;
    }

    setSavingId("new");
    const response = await fetch("/api/entities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        areaId: newAreaId,
        type: newType,
        status: "ACTIVE",
        priority: 3,
      }),
    });

    if (response.ok) {
      const created = (await response.json()) as Entity;
      setEntities((current) => [created, ...current]);
      setNewName("");
    }
    setSavingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 p-3">
        <p className="text-sm text-white/80">Starter pack loaded with fully editable entities.</p>
        <Badge>{activeCount} active</Badge>
      </div>

      <div className="grid gap-2 rounded-xl border border-white/15 bg-white/5 p-3 md:grid-cols-4">
        <input
          value={newName}
          onChange={(event) => setNewName(event.currentTarget.value)}
          className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
          placeholder="New entity name"
        />
        <select
          value={newAreaId}
          onChange={(event) => setNewAreaId(event.currentTarget.value)}
          className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
        >
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
        <select
          value={newType}
          onChange={(event) => setNewType(event.currentTarget.value as Entity["type"])}
          className="rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
        >
          <option value="PERSONAL">PERSONAL</option>
          <option value="BUSINESS">BUSINESS</option>
          <option value="PROJECT">PROJECT</option>
          <option value="CLIENT">CLIENT</option>
          <option value="ROLE">ROLE</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <Button disabled={savingId === "new"} onClick={() => void createEntity()}>
          {savingId === "new" ? "Adding..." : "Add Entity"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="min-w-full text-left text-sm text-white/85">
          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/65">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entities.map((entity) => (
              <tr key={entity.id} className="border-b border-white/10 last:border-none">
                <td className="px-4 py-3">
                  <input
                    className="w-full rounded-lg border border-white/20 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-teal-300"
                    defaultValue={entity.name}
                    onBlur={(event) => {
                      const nextName = event.currentTarget.value.trim();
                      if (nextName && nextName !== entity.name) {
                        void renameEntity(entity.id, nextName);
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-3">{entity.type}</td>
                <td className="px-4 py-3">{entity.status}</td>
                <td className="px-4 py-3">{entity.priority}</td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    disabled={savingId === entity.id || entity.status === "ARCHIVED"}
                    onClick={() => {
                      void archiveEntity(entity.id);
                    }}
                  >
                    {savingId === entity.id ? "Saving..." : "Archive"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
