import { describe, expect, it } from "vitest";

import {
  buildSearchCandidatesRequest,
  buildSearchCallLogsRequest,
  buildSearchMeetingsRequest,
  buildSearchNotesRequest,
  buildSearchTasksRequest,
} from "../src/recruitcrm/client.js";

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

describe("buildSearchTasksRequest", () => {
  it("defaults page to 1 and keeps the request query-only", () => {
    const request = buildSearchTasksRequest({
      title: "Follow up",
    });

    expect(request.query?.get("page")).toBe("1");
    expect(request.query?.get("title")).toBe("Follow up");
    expect(request.jsonBody).toBeUndefined();
  });

  it("serializes all supported query params", () => {
    const request = buildSearchTasksRequest({
      page: 3,
      created_from: "2026-01-01",
      created_to: "2026-01-31",
      owner_email: "owner@example.com",
      owner_id: "2890",
      owner_name: "Jane Scott",
      related_to: "16367183842920002890gLG",
      related_to_type: "candidate",
      starting_from: "2026-02-01",
      starting_to: "2026-02-28",
      title: "Follow up",
      updated_from: "2026-03-01",
      updated_to: "2026-03-31",
    });

    expect(request.query?.get("page")).toBe("3");
    expect(request.query?.get("created_from")).toBe("2026-01-01");
    expect(request.query?.get("created_to")).toBe("2026-01-31");
    expect(request.query?.get("owner_email")).toBe("owner@example.com");
    expect(request.query?.get("owner_id")).toBe("2890");
    expect(request.query?.get("owner_name")).toBe("Jane Scott");
    expect(request.query?.get("related_to")).toBe("16367183842920002890gLG");
    expect(request.query?.get("related_to_type")).toBe("candidate");
    expect(request.query?.get("starting_from")).toBe("2026-02-01");
    expect(request.query?.get("starting_to")).toBe("2026-02-28");
    expect(request.query?.get("title")).toBe("Follow up");
    expect(request.query?.get("updated_from")).toBe("2026-03-01");
    expect(request.query?.get("updated_to")).toBe("2026-03-31");
  });

  it("supports related_to and related_to_type together", () => {
    const request = buildSearchTasksRequest({
      related_to: "16367183842920002890gLG",
      related_to_type: "candidate",
    });

    expect(request.query?.get("related_to")).toBe("16367183842920002890gLG");
    expect(request.query?.get("related_to_type")).toBe("candidate");
  });
});

describe("buildSearchMeetingsRequest", () => {
  it("defaults page to 1 and keeps the request query-only", () => {
    const request = buildSearchMeetingsRequest({
      title: "Demo",
    });

    expect(request.query?.get("page")).toBe("1");
    expect(request.query?.get("title")).toBe("Demo");
    expect(request.jsonBody).toBeUndefined();
  });

  it("serializes all supported meeting query params", () => {
    const request = buildSearchMeetingsRequest({
      page: 2,
      created_from: "2026-01-01",
      created_to: "2026-01-31",
      owner_email: "owner@example.com",
      owner_id: "2890",
      owner_name: "Jane Scott",
      related_to: "16367183842920002890gLG",
      related_to_type: "candidate",
      starting_from: "2026-02-01",
      starting_to: "2026-02-28",
      title: "Demo",
      updated_from: "2026-03-01",
      updated_to: "2026-03-31",
    });

    expect(request.query?.get("page")).toBe("2");
    expect(request.query?.get("created_from")).toBe("2026-01-01");
    expect(request.query?.get("created_to")).toBe("2026-01-31");
    expect(request.query?.get("owner_email")).toBe("owner@example.com");
    expect(request.query?.get("owner_id")).toBe("2890");
    expect(request.query?.get("owner_name")).toBe("Jane Scott");
    expect(request.query?.get("related_to")).toBe("16367183842920002890gLG");
    expect(request.query?.get("related_to_type")).toBe("candidate");
    expect(request.query?.get("starting_from")).toBe("2026-02-01");
    expect(request.query?.get("starting_to")).toBe("2026-02-28");
    expect(request.query?.get("title")).toBe("Demo");
    expect(request.query?.get("updated_from")).toBe("2026-03-01");
    expect(request.query?.get("updated_to")).toBe("2026-03-31");
  });
});

describe("buildSearchNotesRequest", () => {
  it("defaults page to 1 and keeps the request query-only", () => {
    const request = buildSearchNotesRequest({
      related_to: "16367183842920002890gLG",
      related_to_type: "candidate",
    });

    expect(request.query?.get("page")).toBe("1");
    expect(request.query?.get("related_to")).toBe("16367183842920002890gLG");
    expect(request.query?.get("related_to_type")).toBe("candidate");
    expect(request.jsonBody).toBeUndefined();
  });

  it("serializes all supported note query params", () => {
    const request = buildSearchNotesRequest({
      page: 4,
      added_from: "2026-01-01",
      added_to: "2026-01-31",
      related_to: "16367183842920002890gLG",
      related_to_type: "candidate",
      updated_from: "2026-03-01",
      updated_to: "2026-03-31",
    });

    expect(request.query?.get("page")).toBe("4");
    expect(request.query?.get("added_from")).toBe("2026-01-01");
    expect(request.query?.get("added_to")).toBe("2026-01-31");
    expect(request.query?.get("related_to")).toBe("16367183842920002890gLG");
    expect(request.query?.get("related_to_type")).toBe("candidate");
    expect(request.query?.get("updated_from")).toBe("2026-03-01");
    expect(request.query?.get("updated_to")).toBe("2026-03-31");
  });
});

describe("buildSearchCallLogsRequest", () => {
  it("defaults page to 1 and keeps the request query-only", () => {
    const request = buildSearchCallLogsRequest({
      related_to: "16367183842920002890gLG",
      related_to_type: "candidate",
    });

    expect(request.query?.get("page")).toBe("1");
    expect(request.query?.get("related_to")).toBe("16367183842920002890gLG");
    expect(request.query?.get("related_to_type")).toBe("candidate");
    expect(request.jsonBody).toBeUndefined();
  });

  it("serializes all supported call log query params", () => {
    const request = buildSearchCallLogsRequest({
      page: 5,
      call_type: "CALL_OUTGOING",
      related_to: "16367183842920002890gLG",
      related_to_type: "candidate",
      starting_from: "2026-01-01",
      starting_to: "2026-01-31",
      updated_from: "2026-03-01",
      updated_to: "2026-03-31",
    });

    expect(request.query?.get("page")).toBe("5");
    expect(request.query?.get("call_type")).toBe("CALL_OUTGOING");
    expect(request.query?.get("related_to")).toBe("16367183842920002890gLG");
    expect(request.query?.get("related_to_type")).toBe("candidate");
    expect(request.query?.get("starting_from")).toBe("2026-01-01");
    expect(request.query?.get("starting_to")).toBe("2026-01-31");
    expect(request.query?.get("updated_from")).toBe("2026-03-01");
    expect(request.query?.get("updated_to")).toBe("2026-03-31");
  });
});
