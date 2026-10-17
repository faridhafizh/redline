import type { AdapterOutput, QueryType, SourceId } from "../types";
import * as crtsh from "./crtsh";
import * as dns from "./dns";
import * as gdelt from "./gdelt";
import * as githubsearch from "./githubsearch";
import * as githubuser from "./githubuser";
import * as gitlabuser from "./gitlabuser";
import * as gravatar from "./gravatar";
import * as hackernews from "./hackernews";
import * as ipgeolocation from "./ipgeolocation";
import * as keybase from "./keybase";
import * as numverify from "./numverify";
import * as phoneinfo from "./phoneinfo";
import * as rdap from "./rdap";
import * as ripestat from "./ripestat";
import * as secedgar from "./secedgar";
import * as shodan from "./shodan";
import * as stackexchange from "./stackexchange";
import * as wayback from "./wayback";
import * as wikidata from "./wikidata";
import * as wikipedia from "./wikipedia";
import * as xposedornot from "./xposedornot";

type AdapterFn = (query: string, type: QueryType) => Promise<AdapterOutput>;

const ADAPTERS: Record<SourceId, AdapterFn> = {
  "shodan-internetdb": (query) => shodan.run(query),
  rdap: (query, type) => rdap.run(query, type === "ip" ? "ip" : "domain"),
  crtsh: (query) => crtsh.run(query),
  xposedornot: (query) => xposedornot.run(query),
  ipgeolocation: (query) => ipgeolocation.run(query),
  ripestat: (query) => ripestat.run(query),
  gdelt: (query) => gdelt.run(query),
  wikidata: (query) => wikidata.run(query),
  "sec-edgar": (query) => secedgar.run(query),
  wayback: (query) => wayback.run(query),
  "dns-doh": (query) => dns.run(query),
  hackernews: (query, type) =>
    hackernews.run(query, type === "username" ? "username" : "keyword"),
  "github-search": (query) => githubsearch.run(query),
  wikipedia: (query) => wikipedia.run(query),
  stackexchange: (query) => stackexchange.run(query),
  "github-user": (query) => githubuser.run(query),
  "gitlab-user": (query) => gitlabuser.run(query),
  keybase: (query) => keybase.run(query),
  gravatar: (query) => gravatar.run(query),
  "phone-info": (query) => phoneinfo.run(query),
  numverify: (query) => numverify.run(query),
};

export function getAdapter(id: SourceId): AdapterFn {
  return ADAPTERS[id];
}

export function withTimeout<T>(
  promise: Promise<T>,
  label: string,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} melebihi batas waktu ${timeoutMs}ms`)),
      timeoutMs,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export { SOURCES, getSourcesForType, getSource } from "./registry";
