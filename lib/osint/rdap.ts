import type { AdapterOutput } from "../types";
import { fetchJson } from "./http";

interface RdapEvent {
  eventAction?: string;
  eventDate?: string;
}

interface RdapEntity {
  roles?: string[];
  vcardArray?: unknown[];
  handle?: string;
}

interface RdapResponse {
  handle?: string;
  ldhName?: string;
  name?: string;
  status?: string[];
  events?: RdapEvent[];
  entities?: RdapEntity[];
  nameservers?: { ldhName?: string }[];
  links?: { href?: string; rel?: string }[];
}

function entityNames(entities: RdapEntity[] | undefined): string[] {
  if (!entities) return [];
  const names: string[] = [];
  for (const entity of entities) {
    const vcard = entity.vcardArray;
    if (Array.isArray(vcard) && Array.isArray(vcard[1])) {
      for (const field of vcard[1] as unknown[]) {
        if (Array.isArray(field) && field[0] === "fn" && typeof field[3] === "string") {
          names.push(field[3]);
        }
      }
    }
  }
  return [...new Set(names)];
}

export async function run(
  query: string,
  type: "domain" | "ip",
): Promise<AdapterOutput> {
  const kind = type === "ip" ? "ip" : "domain";
  const raw = await fetchJson<RdapResponse>(
    `https://rdap.org/${kind}/${encodeURIComponent(query)}`,
    { timeoutMs: 10_000, retries: 1 },
  );

  const data = {
    handle: raw.handle ?? null,
    name: raw.ldhName ?? raw.name ?? query,
    status: raw.status ?? [],
    events: (raw.events ?? []).map((event) => ({
      action: event.eventAction ?? null,
      date: event.eventDate ?? null,
    })),
    nameservers: (raw.nameservers ?? [])
      .map((ns) => ns.ldhName)
      .filter((value): value is string => Boolean(value)),
    entities: entityNames(raw.entities),
    roles: [
      ...new Set(
        (raw.entities ?? []).flatMap((entity) => entity.roles ?? []),
      ),
    ],
  };

  const empty =
    data.status.length === 0 &&
    data.events.length === 0 &&
    data.nameservers.length === 0 &&
    data.entities.length === 0;

  return { data, empty };
}
