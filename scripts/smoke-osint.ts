import { getAdapter } from "../lib/osint";
import type { QueryType, SourceId } from "../lib/types";

const cases: { id: SourceId; query: string; type: QueryType }[] = [
  { id: "shodan-internetdb", query: "8.8.8.8", type: "ip" },
  { id: "rdap", query: "example.com", type: "domain" },
  { id: "crtsh", query: "example.com", type: "domain" },
  { id: "xposedornot", query: "test@example.com", type: "email" },
  { id: "ipgeolocation", query: "8.8.8.8", type: "ip" },
  { id: "ripestat", query: "8.8.8.8", type: "ip" },
  { id: "gdelt", query: "Indonesia", type: "keyword" },
  { id: "wikidata", query: "Jakarta", type: "keyword" },
  { id: "sec-edgar", query: "Apple", type: "keyword" },
  { id: "wayback", query: "example.com", type: "domain" },
  { id: "dns-doh", query: "example.com", type: "domain" },
  { id: "hackernews", query: "Indonesia", type: "keyword" },
  { id: "github-search", query: "osint", type: "keyword" },
  { id: "wikipedia", query: "Jakarta", type: "keyword" },
  { id: "stackexchange", query: "osint", type: "keyword" },
  { id: "github-user", query: "torvalds", type: "username" },
  { id: "gitlab-user", query: "root", type: "username" },
  { id: "keybase", query: "keybase", type: "username" },
  { id: "gravatar", query: "test@example.com", type: "email" },
  { id: "phone-info", query: "+6281234567890", type: "phone" },
  { id: "numverify", query: "+6281234567890", type: "phone" },
];

let passed = 0;
let failed = 0;

for (const testCase of cases) {
  const started = Date.now();
  try {
    const output = await getAdapter(testCase.id)(testCase.query, testCase.type);
    passed += 1;
    const preview = JSON.stringify(output.data).slice(0, 220);
    console.log(
      `PASS ${testCase.id} (${Date.now() - started}ms) empty=${output.empty}\n  ${preview}\n`,
    );
  } catch (error) {
    failed += 1;
    console.log(
      `FAIL ${testCase.id} (${Date.now() - started}ms) ${(error as Error).message}\n`,
    );
  }
}

console.log(`\nSummary: ${passed} passed, ${failed} failed, ${cases.length} total`);
