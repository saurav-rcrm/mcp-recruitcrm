import { describe, expect, it } from "vitest";

import { buildSearchCandidatesRequest } from "../src/recruitcrm/client.js";

describe("buildSearchCandidatesRequest", () => {
  it("builds query-only search requests by default", () => {
    const request = buildSearchCandidatesRequest({
      first_name: "Michael",
    });

    expect(request.query?.get("page")).toBe("1");
    expect(request.query?.get("first_name")).toBe("Michael");
    expect(request.query?.get("sort_by")).toBe("updatedon");
    expect(request.query?.get("sort_order")).toBe("desc");
    expect(request.jsonBody).toBeUndefined();
  });

  it("ignores other filters when candidate_slug is present", () => {
    const request = buildSearchCandidatesRequest({
      candidate_slug: "010011",
      first_name: "Michael",
      country: "United States",
      custom_fields: [
        {
          field_id: 34,
          filter_type: "equals",
          filter_value: "Python",
        },
      ],
      sort_by: "createdon",
    });

    expect(request.query?.get("candidate_slug")).toBe("010011");
    expect(request.query?.get("first_name")).toBeNull();
    expect(request.query?.get("country")).toBeNull();
    expect(request.query?.get("sort_by")).toBeNull();
    expect(request.jsonBody).toBeUndefined();
  });

  it("serializes booleans as lowercase strings", () => {
    const request = buildSearchCandidatesRequest({
      marked_as_off_limit: true,
      exact_search: false,
    });

    expect(request.query?.get("marked_as_off_limit")).toBe("true");
    expect(request.query?.get("exact_search")).toBe("false");
  });

  it("moves custom fields into a GET body", () => {
    const request = buildSearchCandidatesRequest({
      first_name: "Michael",
      custom_fields: [
        {
          field_id: 34,
          filter_type: "equals",
          filter_value: "Python",
        },
        {
          field_id: 80,
          filter_type: "available",
        },
      ],
    });

    expect(request.query?.get("first_name")).toBe("Michael");
    expect(request.jsonBody).toEqual({
      custom_fields: [
        {
          field_id: 34,
          filter_type: "equals",
          filter_value: "Python",
        },
        {
          field_id: 80,
          filter_type: "available",
        },
      ],
    });
  });
});
