import { UnlockScreen } from "@/components/unlock-screen";

function resolveNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export default async function UnlockPage({
  searchParams,
}: {
  searchParams?: Promise<{ locked?: string; next?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const nextPath = resolveNextPath(params.next ?? null);
  const locked = params.locked === "1";

  return (
    <UnlockScreen locked={locked} nextPath={nextPath} />
  );
}
