import type { QueryType } from "./types";

export interface UnsupportedNotice {
  message: string;
  links: { label: string; url: string }[];
}

export function getUnsupportedNotice(
  type: QueryType,
  query: string,
): UnsupportedNotice {
  const encoded = encodeURIComponent(query);

  const fallbackLinks: { label: string; url: string }[] = [
    { label: "WhatsMyName", url: `https://whatsmyname.app/?q=${encoded}` },
    { label: "Truecaller Web", url: `https://www.truecaller.com/search/${encoded}` },
  ];

  return {
    message: `Tidak ada sumber yang cocok untuk tipe "${type}" saat ini. Gunakan tool eksternal berikut sebagai alternatif.`,
    links: fallbackLinks,
  };
}
