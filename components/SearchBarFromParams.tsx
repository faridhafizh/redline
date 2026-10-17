"use client";

import { useParams } from "next/navigation";
import { SearchBar } from "./SearchBar";

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function SearchBarFromParams() {
  const params = useParams<{ query: string }>();
  const raw = typeof params?.query === "string" ? params.query : "";
  return <SearchBar initialQuery={safeDecode(raw)} />;
}
