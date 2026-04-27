import { describe, expect, it } from "vitest";

import {
  buildCreateNoteRequest,
  buildCreateTaskRequest,
  buildListContactsRequest,
  buildListUsersRequest,
  buildGetJobAssignedCandidatesRequest,
  buildSearchCandidatesRequest,
  buildSearchCallLogsRequest,
  buildSearchCompaniesRequest,
  buildSearchContactsRequest,
  buildSearchHotlistsRequest,
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

describe("buildListUsersRequest", () => {
  it("omits expand by default", () => {
    const request = buildListUsersRequest({});

    expect(request.query).toBeUndefined();
  });

  it("expands teams only when requested", () => {
    const request = buildListUsersRequest({ include_teams: true });

    expect(request.query?.get("expand")).toBe("team");
  });
});

describe("buildGetJobAssignedCandidatesRequest", () => {
  it("defaults page and caps limit at 100", () => {
    const request = buildGetJobAssignedCandidatesRequest({
      limit: 250,
    });

    expect(request.query?.get("page")).toBe("1");
    expect(request.query?.get("limit")).toBe("100");
    expect(request.query?.get("status_id")).toBeNull();
    expect(request.jsonBody).toBeUndefined();
  });

  it("serializes page, limit, and comma-separated status ids", () => {
    const request = buildGetJobAssignedCandidatesRequest({
      page: 3,
      limit: 25,
      status_id: "8,12",
    });

    expect(request.query?.get("page")).toBe("3");
    expect(request.query?.get("limit")).toBe("25");
    expect(request.query?.get("status_id")).toBe("8,12");
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

describe("buildSearchCompaniesRequest", () => {
  it("defaults page and sort settings", () => {
    const request = buildSearchCompaniesRequest({
      company_name: "Example Holdings",
    });

    expect(request.query?.get("page")).toBe("1");
    expect(request.query?.get("company_name")).toBe("Example Holdings");
    expect(request.query?.get("sort_by")).toBe("updatedon");
    expect(request.query?.get("sort_order")).toBe("desc");
    expect(request.jsonBody).toBeUndefined();
  });

  it("serializes all supported company query params", () => {
    const request = buildSearchCompaniesRequest({
      page: 4,
      company_name: "Example Holdings",
      created_from: "2026-01-01",
      created_to: "2026-01-31",
      marked_as_off_limit: true,
      owner_email: "owner@example.com",
      owner_id: 2890,
      owner_name: "Sample Owner",
      updated_from: "2026-03-01",
      updated_to: "2026-03-31",
      exact_search: false,
      sort_by: "createdon",
      sort_order: "asc",
    });

    expect(request.query?.get("page")).toBe("4");
    expect(request.query?.get("company_name")).toBe("Example Holdings");
    expect(request.query?.get("created_from")).toBe("2026-01-01");
    expect(request.query?.get("created_to")).toBe("2026-01-31");
    expect(request.query?.get("marked_as_off_limit")).toBe("true");
    expect(request.query?.get("owner_email")).toBe("owner@example.com");
    expect(request.query?.get("owner_id")).toBe("2890");
    expect(request.query?.get("owner_name")).toBe("Sample Owner");
    expect(request.query?.get("updated_from")).toBe("2026-03-01");
    expect(request.query?.get("updated_to")).toBe("2026-03-31");
    expect(request.query?.get("exact_search")).toBe("false");
    expect(request.query?.get("sort_by")).toBe("createdon");
    expect(request.query?.get("sort_order")).toBe("asc");
  });

  it("ignores other filters when company_slug is present", () => {
    const request = buildSearchCompaniesRequest({
      page: 2,
      company_slug: "company-sample-001",
      company_name: "Example Holdings",
      marked_as_off_limit: true,
      sort_by: "createdon",
      sort_order: "asc",
    });

    expect(request.query?.get("page")).toBe("2");
    expect(request.query?.get("company_slug")).toBe("company-sample-001");
    expect(request.query?.get("company_name")).toBeNull();
    expect(request.query?.get("marked_as_off_limit")).toBeNull();
    expect(request.query?.get("sort_by")).toBeNull();
    expect(request.query?.get("sort_order")).toBeNull();
    expect(request.jsonBody).toBeUndefined();
  });
});

describe("buildSearchContactsRequest", () => {
  it("defaults page and sort settings", () => {
    const request = buildSearchContactsRequest({
      first_name: "Pam",
    });

    expect(request.query?.get("page")).toBe("1");
    expect(request.query?.get("first_name")).toBe("Pam");
    expect(request.query?.get("sort_by")).toBe("updatedon");
    expect(request.query?.get("sort_order")).toBe("desc");
    expect(request.jsonBody).toBeUndefined();
  });

  it("serializes all supported contact query params", () => {
    const request = buildSearchContactsRequest({
      page: 3,
      created_from: "2026-01-01",
      created_to: "2026-01-31",
      email: "pam.beesly@example.com",
      first_name: "Pam",
      last_name: "Beesly",
      linkedin: "https://www.linkedin.com/in/pam-beesly",
      marked_as_off_limit: false,
      owner_email: "owner@example.com",
      owner_id: "2890",
      owner_name: "Sample Owner",
      updated_from: "2026-03-01",
      updated_to: "2026-03-31",
      company_slug: "company-sample-001",
      contact_number: "+1-555-0142",
      exact_search: true,
      sort_by: "createdon",
      sort_order: "asc",
    });

    expect(request.query?.get("page")).toBe("3");
    expect(request.query?.get("created_from")).toBe("2026-01-01");
    expect(request.query?.get("created_to")).toBe("2026-01-31");
    expect(request.query?.get("email")).toBe("pam.beesly@example.com");
    expect(request.query?.get("first_name")).toBe("Pam");
    expect(request.query?.get("last_name")).toBe("Beesly");
    expect(request.query?.get("linkedin")).toBe("https://www.linkedin.com/in/pam-beesly");
    expect(request.query?.get("marked_as_off_limit")).toBe("false");
    expect(request.query?.get("owner_email")).toBe("owner@example.com");
    expect(request.query?.get("owner_id")).toBe("2890");
    expect(request.query?.get("owner_name")).toBe("Sample Owner");
    expect(request.query?.get("updated_from")).toBe("2026-03-01");
    expect(request.query?.get("updated_to")).toBe("2026-03-31");
    expect(request.query?.get("company_slug")).toBe("company-sample-001");
    expect(request.query?.get("contact_number")).toBe("+1-555-0142");
    expect(request.query?.get("exact_search")).toBe("true");
    expect(request.query?.get("sort_by")).toBe("createdon");
    expect(request.query?.get("sort_order")).toBe("asc");
  });

  it("ignores other filters when contact_slug is present", () => {
    const request = buildSearchContactsRequest({
      page: 2,
      contact_slug: "contact-sample-001",
      first_name: "Pam",
      company_slug: "company-sample-001",
      sort_by: "createdon",
      sort_order: "asc",
    });

    expect(request.query?.get("page")).toBe("2");
    expect(request.query?.get("contact_slug")).toBe("contact-sample-001");
    expect(request.query?.get("first_name")).toBeNull();
    expect(request.query?.get("company_slug")).toBeNull();
    expect(request.query?.get("sort_by")).toBeNull();
    expect(request.query?.get("sort_order")).toBeNull();
    expect(request.jsonBody).toBeUndefined();
  });
});

describe("buildSearchHotlistsRequest", () => {
  it("requires related_to_type and defaults page to 1", () => {
    const request = buildSearchHotlistsRequest({
      related_to_type: "candidate",
    });

    expect(request.query?.get("page")).toBe("1");
    expect(request.query?.get("related_to_type")).toBe("candidate");
    expect(request.query?.get("name")).toBeNull();
    expect(request.query?.get("shared")).toBeNull();
    expect(request.jsonBody).toBeUndefined();
  });

  it("serializes optional name and shared filters", () => {
    const request = buildSearchHotlistsRequest({
      page: 3,
      related_to_type: "contact",
      name: "Leadership",
      shared: 1,
    });

    expect(request.query?.get("page")).toBe("3");
    expect(request.query?.get("related_to_type")).toBe("contact");
    expect(request.query?.get("name")).toBe("Leadership");
    expect(request.query?.get("shared")).toBe("1");
  });
});

describe("buildListContactsRequest", () => {
  it("reuses pagination defaults for contact listing", () => {
    const request = buildListContactsRequest({});

    expect(request.query?.get("page")).toBe("1");
    expect(request.query?.get("limit")).toBe("100");
    expect(request.query?.get("sort_by")).toBe("updatedon");
    expect(request.query?.get("sort_order")).toBe("desc");
    expect(request.jsonBody).toBeUndefined();
  });
});

describe("buildCreateTaskRequest", () => {
  it("builds a POST body while preserving rich text descriptions", () => {
    const request = buildCreateTaskRequest({
      task_type_id: 332,
      title: "Follow up call",
      description: "<p><strong>Rich task</strong></p>",
      reminder: 30,
      start_date: "2026-04-28T04:30:00.000000Z",
      owner_id: 453,
      created_by: 453,
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
      updated_by: 453,
      associated_candidates: ["candidate-related-sample-001", "candidate-related-sample-002"],
      associated_companies: ["company-sample-001"],
      associated_contacts: ["contact-sample-001"],
      associated_jobs: ["job-sample-001"],
      associated_deals: ["deal-sample-001"],
      collaborator_user_ids: [12654, 12655],
      collaborator_team_ids: [16, 17],
      enable_auto_populate_teams: true,
    });

    expect(request.method).toBe("POST");
    expect(request.query).toBeUndefined();
    expect(request.jsonBody).toEqual({
      task_type_id: 332,
      title: "Follow up call",
      description: "<p><strong>Rich task</strong></p>",
      reminder: 30,
      start_date: "2026-04-28T04:30:00.000000Z",
      owner_id: 453,
      created_by: 453,
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
      updated_by: 453,
      associated_candidates: "candidate-related-sample-001,candidate-related-sample-002",
      associated_companies: "company-sample-001",
      associated_contacts: "contact-sample-001",
      associated_jobs: "job-sample-001",
      associated_deals: "deal-sample-001",
      collaborators: "12654,12655",
      collaborator_team_ids: "16,17",
      enable_auto_populate_teams: 1,
    });
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

describe("buildCreateNoteRequest", () => {
  it("builds a POST body while preserving rich text descriptions", () => {
    const request = buildCreateNoteRequest({
      note_type_id: 108871,
      description: "<p><strong>Rich text</strong></p>",
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
      created_by: 453,
      updated_by: 453,
      associated_candidates: ["candidate-related-sample-001", "candidate-related-sample-002"],
      associated_companies: ["company-sample-001"],
      associated_contacts: ["contact-sample-001"],
      associated_jobs: ["job-sample-001"],
      associated_deals: ["deal-sample-001"],
      collaborator_user_ids: [11496, 11497],
      collaborator_team_ids: [16, 17],
      enable_auto_populate_teams: true,
    });

    expect(request.method).toBe("POST");
    expect(request.query).toBeUndefined();
    expect(request.jsonBody).toEqual({
      note_type_id: 108871,
      description: "<p><strong>Rich text</strong></p>",
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
      created_by: 453,
      updated_by: 453,
      associated_candidates: "candidate-related-sample-001,candidate-related-sample-002",
      associated_companies: "company-sample-001",
      associated_contacts: "contact-sample-001",
      associated_jobs: "job-sample-001",
      associated_deals: "deal-sample-001",
      collaborator_user_ids: "11496,11497",
      collaborator_team_ids: "16,17",
      enable_auto_populate_teams: 1,
    });
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
