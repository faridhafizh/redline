import { createHash } from "node:crypto";
import type { AdapterOutput } from "../types";
import { HttpError, fetchJson } from "./http";

interface GravatarName {
  formatted?: string;
  given_name?: string;
  family_name?: string;
}

interface GravatarAccount {
  service_name?: string;
  service_label?: string;
  url?: string;
  is_hidden?: boolean;
}

interface GravatarLink {
  label?: string;
  url?: string;
}

interface GravatarProfile {
  hash?: string;
  display_name?: string;
  description?: string;
  job_title?: string;
  company?: string;
  location?: string;
  pronouns?: string;
  avatar_url?: string;
  profile_url?: string;
  name?: GravatarName;
  verified_accounts?: GravatarAccount[];
  links?: GravatarLink[];
}

function sha256(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export async function run(email: string): Promise<AdapterOutput> {
  const hash = sha256(email);

  let profile: GravatarProfile;
  try {
    profile = await fetchJson<GravatarProfile>(
      `https://api.gravatar.com/v3/profiles/${hash}`,
      { timeoutMs: 10_000, retries: 0 },
    );
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return { data: { email, hash, found: false }, empty: true };
    }
    throw error;
  }

  const data = {
    email,
    hash,
    found: true,
    displayName: profile.display_name ?? profile.name?.formatted ?? null,
    fullName: profile.name?.formatted ?? null,
    description: profile.description ?? null,
    jobTitle: profile.job_title ?? null,
    company: profile.company ?? null,
    location: profile.location ?? null,
    pronouns: profile.pronouns ?? null,
    avatarUrl: profile.avatar_url ?? null,
    profileUrl: profile.profile_url ?? null,
    verifiedAccounts: (profile.verified_accounts ?? [])
      .filter((account) => !account.is_hidden)
      .map((account) => ({
        service: account.service_label ?? account.service_name ?? null,
        url: account.url ?? null,
      })),
    links: (profile.links ?? []).map((link) => ({
      label: link.label ?? null,
      url: link.url ?? null,
    })),
  };

  return { data, empty: false };
}
