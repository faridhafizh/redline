import type { AdapterOutput } from "../types";
import { fetchJson } from "./http";

interface KeybaseProof {
  proof_type?: string;
  nametag?: string;
  service_url?: string;
}

interface KeybaseUser {
  id?: string;
  basics?: { username?: string; ctime?: number; mtime?: number };
  profile?: { full_name?: string; location?: string; bio?: string };
  proofs_summary?: { proofs?: KeybaseProof[]; proofs_raw?: string[] };
  public_keys?: { primary?: { kid?: string } };
}

interface KeybaseResponse {
  status?: { code?: number; name?: string };
  them?: KeybaseUser[] | KeybaseUser | null;
}

function toArray(value: KeybaseResponse["them"]): KeybaseUser[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function run(username: string): Promise<AdapterOutput> {
  const raw = await fetchJson<KeybaseResponse>(
    `https://keybase.io/_/api/1.0/user/lookup.json?username=${encodeURIComponent(
      username,
    )}`,
    { timeoutMs: 10_000, retries: 1 },
  );

  const user = toArray(raw.them)[0];
  if (!user?.id) {
    return { data: { username, found: false }, empty: true };
  }

  const proofs = (user.proofs_summary?.proofs ?? [])
    .map((proof) => {
      const tag = proof.nametag ?? proof.service_url;
      return tag ? `${proof.proof_type ?? "proof"}: ${tag}` : proof.proof_type ?? null;
    })
    .filter((value): value is string => Boolean(value));

  const data = {
    username,
    found: true,
    id: user.id,
    login: user.basics?.username ?? username,
    fullName: user.profile?.full_name ?? null,
    location: user.profile?.location ?? null,
    bio: user.profile?.bio ?? null,
    registeredAt: user.basics?.ctime
      ? new Date(user.basics.ctime * 1000).toISOString()
      : null,
    keyId: user.public_keys?.primary?.kid ?? null,
    proofs,
  };

  return { data, empty: false };
}
