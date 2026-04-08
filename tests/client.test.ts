import { describe, expect, it } from "vitest";

import {
  buildSearchCandidatesRequest,
  buildSearchCallLogsRequest,
  buildSearchJobsRequest,
  buildSearchMeetingsRequest,
  buildSearchNotesRequest,
  buildSearchTasksRequest,
} from "../src/recruitcrm/client.js";

describe("buildSearchCandidatesRequest", () => {
  it("builds query-only search requests by default", () => {
    const request = buildSearchCandidatesRequest({
      first_name: "Sample",
    });

    expect(request.query?.get("page")).toBe("1");
    expect(request.query?.get("first_name")).toBe("Sample");
    expect(request.query?.get("sort_by")).toBe("updatedon");
    expect(request.query?.get("sort_order")).toBe("desc");
    expect(request.jsonBody).toBeUndefined();
  });

  it("ignores other filters when candidate_slug is present", () => {
    const request = buildSearchCandidatesRequest({
      candidate_slug: "candidate-sample-001",
      first_name: "Sample",
      country: "Example Country",
      custom_fields: [
        {
          field_id: 34,
          filter_type: "equals",
          filter_value: "Python",
        },
      ],
      sort_by: "createdon",
    });

    expect(request.query?.get("candidate_slug")).toBe("candidate-sample-001");
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
      first_name: "Sample",
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

    expect(request.query?.get("first_name")).toBe("Sample");
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
      owner_name: "Sample Owner",
      related_to: "candidate-related-sample-001",
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
    expect(request.query?.get("owner_name")).toBe("Sample Owner");
    expect(request.query?.get("related_to")).toBe("candidate-related-sample-001");
    expect(request.query?.get("related_to_type")).toBe("candidate");
    expect(request.query?.get("starting_from")).toBe("2026-02-01");
    expect(request.query?.get("starting_to")).toBe("2026-02-28");
    expect(request.query?.get("title")).toBe("Follow up");
    expect(request.query?.get("updated_from")).toBe("2026-03-01");
    expect(request.query?.get("updated_to")).toBe("2026-03-31");
  });

  it("supports related_to and related_to_type together", () => {
    const request = buildSearchTasksRequest({
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
    });

    expect(request.query?.get("related_to")).toBe("candidate-related-sample-001");
    expect(request.query?.get("related_to_type")).toBe("candidate");
  });
});

describe("buildSearchJobsRequest", () => {
  it("defaults page, limit, and sort settings", () => {
    const request = buildSearchJobsRequest({
      name: "Operations Analyst",
    });

    expect(request.query?.get("page")).toBe("1");
    expect(request.query?.get("limit")).toBe("100");
    expect(request.query?.get("name")).toBe("Operations Analyst");
    expect(request.query?.get("sort_by")).toBe("updatedon");
    expect(request.query?.get("sort_order")).toBe("desc");
    expect(request.jsonBody).toBeUndefined();
  });

  it("serializes all supported job query params", () => {
    const request = buildSearchJobsRequest({
      page: 3,
      city: "Example City",
      company_name: "Acme Labs",
      company_slug: "company-sample-001",
      contact_email: "primary.contact@example.com",
      contact_name: "Sample Contact",
      contact_number: "+1-555-0102",
      contact_slug: "contact-sample-001",
      country: "Example Country",
      created_from: "2026-01-01",
      created_to: "2026-01-31",
      enable_job_application_form: 1,
      exact_search: true,
      full_address: "123 Example Street",
      job_category: "Operations",
      job_skill: "Project Management",
      job_status: 3,
      job_type: 4,
      limit: 25,
      locality: "Downtown",
      name: "Operations Analyst",
      note_for_candidates: "Bring sample documents.",
      owner_email: "owner@example.com",
      owner_id: "2890",
      owner_name: "Sample Owner",
      secondary_contact_email: "secondary.contact@example.com",
      secondary_contact_name: "Sample Secondary",
      secondary_contact_number: "+1-555-0103",
      secondary_contact_slug: "contact-sample-002",
      sort_by: "createdon",
      sort_order: "asc",
      updated_from: "2026-03-01",
      updated_to: "2026-03-31",
    });

    expect(request.query?.get("page")).toBe("3");
    expect(request.query?.get("city")).toBe("Example City");
    expect(request.query?.get("company_name")).toBe("Acme Labs");
    expect(request.query?.get("company_slug")).toBe("company-sample-001");
    expect(request.query?.get("contact_email")).toBe("primary.contact@example.com");
    expect(request.query?.get("contact_name")).toBe("Sample Contact");
    expect(request.query?.get("contact_number")).toBe("+1-555-0102");
    expect(request.query?.get("contact_slug")).toBe("contact-sample-001");
    expect(request.query?.get("country")).toBe("Example Country");
    expect(request.query?.get("created_from")).toBe("2026-01-01");
    expect(request.query?.get("created_to")).toBe("2026-01-31");
    expect(request.query?.get("enable_job_application_form")).toBe("1");
    expect(request.query?.get("exact_search")).toBe("true");
    expect(request.query?.get("full_address")).toBe("123 Example Street");
    expect(request.query?.get("job_category")).toBe("Operations");
    expect(request.query?.get("job_skill")).toBe("Project Management");
    expect(request.query?.get("job_status")).toBe("3");
    expect(request.query?.get("job_type")).toBe("4");
    expect(request.query?.get("limit")).toBe("25");
    expect(request.query?.get("locality")).toBe("Downtown");
    expect(request.query?.get("name")).toBe("Operations Analyst");
    expect(request.query?.get("note_for_candidates")).toBe("Bring sample documents.");
    expect(request.query?.get("owner_email")).toBe("owner@example.com");
    expect(request.query?.get("owner_id")).toBe("2890");
    expect(request.query?.get("owner_name")).toBe("Sample Owner");
    expect(request.query?.get("secondary_contact_email")).toBe("secondary.contact@example.com");
    expect(request.query?.get("secondary_contact_name")).toBe("Sample Secondary");
    expect(request.query?.get("secondary_contact_number")).toBe("+1-555-0103");
    expect(request.query?.get("secondary_contact_slug")).toBe("contact-sample-002");
    expect(request.query?.get("sort_by")).toBe("createdon");
    expect(request.query?.get("sort_order")).toBe("asc");
    expect(request.query?.get("updated_from")).toBe("2026-03-01");
    expect(request.query?.get("updated_to")).toBe("2026-03-31");
  });

  it("ignores other filters when job_slug is present", () => {
    const request = buildSearchJobsRequest({
      page: 2,
      limit: 10,
      job_slug: "job-sample-001",
      name: "Operations Analyst",
      city: "Example City",
      sort_by: "createdon",
      sort_order: "asc",
    });

    expect(request.query?.get("page")).toBe("2");
    expect(request.query?.get("limit")).toBe("10");
    expect(request.query?.get("job_slug")).toBe("job-sample-001");
    expect(request.query?.get("name")).toBeNull();
    expect(request.query?.get("city")).toBeNull();
    expect(request.query?.get("sort_by")).toBeNull();
    expect(request.query?.get("sort_order")).toBeNull();
    expect(request.jsonBody).toBeUndefined();
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
      owner_name: "Sample Owner",
      related_to: "candidate-related-sample-001",
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
    expect(request.query?.get("owner_name")).toBe("Sample Owner");
    expect(request.query?.get("related_to")).toBe("candidate-related-sample-001");
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
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
    });

    expect(request.query?.get("page")).toBe("1");
    expect(request.query?.get("related_to")).toBe("candidate-related-sample-001");
    expect(request.query?.get("related_to_type")).toBe("candidate");
    expect(request.jsonBody).toBeUndefined();
  });

  it("serializes all supported note query params", () => {
    const request = buildSearchNotesRequest({
      page: 4,
      added_from: "2026-01-01",
      added_to: "2026-01-31",
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
      updated_from: "2026-03-01",
      updated_to: "2026-03-31",
    });

    expect(request.query?.get("page")).toBe("4");
    expect(request.query?.get("added_from")).toBe("2026-01-01");
    expect(request.query?.get("added_to")).toBe("2026-01-31");
    expect(request.query?.get("related_to")).toBe("candidate-related-sample-001");
    expect(request.query?.get("related_to_type")).toBe("candidate");
    expect(request.query?.get("updated_from")).toBe("2026-03-01");
    expect(request.query?.get("updated_to")).toBe("2026-03-31");
  });
});

describe("buildSearchCallLogsRequest", () => {
  it("defaults page to 1 and keeps the request query-only", () => {
    const request = buildSearchCallLogsRequest({
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
    });

    expect(request.query?.get("page")).toBe("1");
    expect(request.query?.get("related_to")).toBe("candidate-related-sample-001");
    expect(request.query?.get("related_to_type")).toBe("candidate");
    expect(request.jsonBody).toBeUndefined();
  });

  it("serializes all supported call log query params", () => {
    const request = buildSearchCallLogsRequest({
      page: 5,
      call_type: "CALL_OUTGOING",
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
      starting_from: "2026-01-01",
      starting_to: "2026-01-31",
      updated_from: "2026-03-01",
      updated_to: "2026-03-31",
    });

    expect(request.query?.get("page")).toBe("5");
    expect(request.query?.get("call_type")).toBe("CALL_OUTGOING");
    expect(request.query?.get("related_to")).toBe("candidate-related-sample-001");
    expect(request.query?.get("related_to_type")).toBe("candidate");
    expect(request.query?.get("starting_from")).toBe("2026-01-01");
    expect(request.query?.get("starting_to")).toBe("2026-01-31");
    expect(request.query?.get("updated_from")).toBe("2026-03-01");
    expect(request.query?.get("updated_to")).toBe("2026-03-31");
  });
});
