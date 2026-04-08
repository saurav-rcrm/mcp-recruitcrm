import { describe, expect, it } from "vitest";

import { invalidApiResponse, mapFetchError, mapHttpError } from "../src/errors.js";

describe("error mapping", () => {
  it("maps auth errors", () => {
    expect(mapHttpError(401).message).toBe("Recruit CRM API authentication failed.");
    expect(mapHttpError(403).message).toBe("Recruit CRM API authentication failed.");
  });

  it("maps rate limit and server errors", () => {
    expect(mapHttpError(429).message).toBe("Recruit CRM API rate limit exceeded.");
    expect(mapHttpError(500).message).toBe("Recruit CRM API is unavailable right now.");
  });

  it("maps not found and invalid payload errors", () => {
    expect(mapHttpError(404).message).toBe("Candidate not found.");
    expect(invalidApiResponse().message).toBe("Recruit CRM API returned an invalid response.");
  });

  it("maps timeout and network failures", () => {
    const timeout = new DOMException("Timed out", "AbortError");

    expect(mapFetchError(timeout).message).toBe("Recruit CRM API request timed out.");
    expect(mapFetchError(new Error("socket hang up")).message).toBe("Unable to reach the Recruit CRM API.");
  });
});
