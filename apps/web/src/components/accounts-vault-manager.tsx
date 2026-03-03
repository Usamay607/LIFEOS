"use client";

import { useMemo, useState } from "react";
import type { AccountRef, Entity, RedactionLevel } from "@los/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

type AccountsApiResponse = {
  redactionLevel: RedactionLevel;
  accounts: AccountRef[];
};

interface AccountsVaultManagerProps {
  initialAccounts: AccountRef[];
  entities: Entity[];
}

function getRotationState(lastRotated?: string): "ON_TRACK" | "DUE_SOON" | "AT_RISK" {
  if (!lastRotated) {
    return "AT_RISK";
  }

  const daysSince = Math.floor((Date.now() - new Date(lastRotated).getTime()) / (24 * 60 * 60 * 1000));
  if (daysSince <= 60) {
    return "ON_TRACK";
  }
  if (daysSince <= 90) {
    return "DUE_SOON";
  }
  return "AT_RISK";
}

function rotationClasses(state: "ON_TRACK" | "DUE_SOON" | "AT_RISK") {
  if (state === "ON_TRACK") {
    return { panel: "border-emerald-300/60 bg-emerald-300/15 text-emerald-100", bar: "bg-emerald-300" };
  }
  if (state === "DUE_SOON") {
    return { panel: "border-amber-300/60 bg-amber-300/15 text-amber-100", bar: "bg-amber-300" };
  }
  return { panel: "border-rose-300/70 bg-rose-300/20 text-rose-100", bar: "bg-rose-300" };
}

export function AccountsVaultManager({ initialAccounts, entities }: AccountsVaultManagerProps) {
  const [accounts, setAccounts] = useState<AccountRef[]>(initialAccounts);
  const [redactionLevel, setRedactionLevel] = useState<RedactionLevel>("STRICT");
  const [loading, setLoading] = useState(false);

  const entityNameById = useMemo(() => {
    return new Map(entities.map((entity) => [entity.id, entity.name]));
  }, [entities]);

  const stats = useMemo(() => {
    const twoFactorEnabled = accounts.filter((account) => account.twoFactorEnabled).length;
    const atRiskRotation = accounts.filter((account) => getRotationState(account.lastRotated) === "AT_RISK").length;
    return {
      total: accounts.length,
      twoFactorEnabled,
      twoFactorPercent: accounts.length ? Math.round((twoFactorEnabled / accounts.length) * 100) : 0,
      atRiskRotation,
    };
  }, [accounts]);

  async function switchRedaction(nextLevel: RedactionLevel) {
    if (nextLevel === redactionLevel) {
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/accounts?redactionLevel=${nextLevel}`);
    if (response.ok) {
      const payload = (await response.json()) as AccountsApiResponse;
      setAccounts(payload.accounts);
      setRedactionLevel(payload.redactionLevel);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/5 p-3">
        <p className="text-sm text-white/80">Vault references only. LOS stores no passwords or secret values.</p>
        <div className="flex items-center gap-2">
          <Button
            variant={redactionLevel === "STRICT" ? "solid" : "ghost"}
            disabled={loading}
            onClick={() => void switchRedaction("STRICT")}
          >
            Strict Redaction
          </Button>
          <Button
            variant={redactionLevel === "STANDARD" ? "solid" : "ghost"}
            disabled={loading}
            onClick={() => void switchRedaction("STANDARD")}
          >
            Standard Redaction
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-white/65">Accounts</p>
          <p className="mt-1 text-2xl font-semibold text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-300/50 bg-emerald-300/10 p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-white/70">2FA Coverage</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-100">{stats.twoFactorPercent}%</p>
          <p className="text-xs text-emerald-100/90">{stats.twoFactorEnabled}/{stats.total} accounts protected</p>
        </div>
        <div className="rounded-xl border border-rose-300/60 bg-rose-300/10 p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-white/70">Rotation At Risk</p>
          <p className="mt-1 text-2xl font-semibold text-rose-100">{stats.atRiskRotation}</p>
          <p className="text-xs text-rose-100/90">older than 90 days or missing rotation date</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="min-w-full text-left text-sm text-white/85">
          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/65">
            <tr>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Login</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">2FA</th>
              <th className="px-4 py-3">Rotation</th>
              <th className="px-4 py-3">Vault Ref</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => {
              const rotationState = getRotationState(account.lastRotated);
              const tone = rotationClasses(rotationState);

              return (
                <tr key={account.id} className="border-b border-white/10 last:border-none">
                  <td className="px-4 py-3 font-medium text-white">{account.service}</td>
                  <td className="px-4 py-3">{entityNameById.get(account.entityId) ?? "Unknown entity"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/80">{account.loginIdentifier || "-"}</td>
                  <td className="px-4 py-3">{account.role}</td>
                  <td className="px-4 py-3">
                    <Badge className={account.twoFactorEnabled ? "border-emerald-300/80 bg-emerald-300/20 text-emerald-100" : "border-rose-300/80 bg-rose-300/20 text-rose-100"}>
                      {account.twoFactorEnabled ? "Enabled" : "Missing"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-xs ${tone.panel}`}>
                      <span>{rotationState.replace("_", " ")}</span>
                      <span className={`inline-block h-2 w-10 rounded-full ${tone.bar}`} />
                    </div>
                    <p className="mt-1 text-xs text-white/60">{formatDate(account.lastRotated)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/70">Reference only</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
