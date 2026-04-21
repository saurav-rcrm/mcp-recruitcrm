import { describe, expect, it } from "vitest";

import { invalidApiResponse, mapFetchError, mapHttpError } from "../src/errors.js";

describe("error mapping", () => {
  it("maps auth errors", () => {
    expect(mapHttpError(401).message).toMatch(/Recruit CRM API authentication failed/);
    expect(mapHttpError(403).message).toMatch(/Recruit CRM API authentication failed/);
  });

  it("maps rate limit and server errors", () => {
    expect(mapHttpError(429).message).toMatch(/rate limit exceeded/);
    expect(mapHttpError(500).message).toMatch(/unavailable right now/);
  });

  it("maps not found with entity label and 422 with body detail", () => {
    expect(mapHttpError(404, undefined, "Candidate").message).toBe("Candidate not found.");
    expect(mapHttpError(404).message).toBe("Resource not found.");
    expect(mapHttpError(422, JSON.stringify({ message: "owner_name invalid" })).message).toMatch(
      /validation error \(422\): owner_name invalid/,
    );
  });

  it("invalid payload errors expose endpoint and schema issues", () => {
    expect(invalidApiResponse().message).toBe("Recruit CRM API returned an invalid response.");
    expect(invalidApiResponse("/candidates/search").message).toBe(
      "Recruit CRM API returned an invalid response for /candidates/search.",
    );
    expect(
      invalidApiResponse("/candidates/search", [
        { path: ["data", 0, "slug"], message: "Expected string" },
      ]).message,
    ).toMatch(/Schema issues: data\.0\.slug: Expected string/);
  });

  it("maps timeout and network failures", () => {
    const timeout = new DOMException("Timed out", "AbortError");

    expect(mapFetchError(timeout).message).toBe("Recruit CRM API request timed out.");
    expect(mapFetchError(new Error("socket hang up")).message).toBe("Unable to reach the Recruit CRM API.");
  });
});
