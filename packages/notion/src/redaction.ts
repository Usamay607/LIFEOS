import type { AccountRef, RedactionLevel } from "@los/types";

const MASK = "[REDACTED]";

function redactEmail(value: string): string {
  const atIndex = value.indexOf("@");
  if (atIndex <= 1) {
    return MASK;
  }
  const prefix = value.slice(0, 1);
  const domain = value.slice(atIndex);
  return `${prefix}***${domain}`;
}

export function redactAccountsForSummary(accounts: AccountRef[], level: RedactionLevel): AccountRef[] {
  if (level === "STANDARD") {
    return accounts.map((account) => ({
      ...account,
      vaultItemUrl: MASK,
      vaultItemId: account.vaultItemId ? MASK : undefined,
    }));
  }

  return accounts.map((account) => ({
    ...account,
    loginIdentifier: redactEmail(account.loginIdentifier),
    notes: account.notes ? MASK : undefined,
    vaultItemUrl: MASK,
    vaultItemId: account.vaultItemId ? MASK : undefined,
  }));
}
