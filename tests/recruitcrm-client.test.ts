import { afterEach, describe, expect, it, vi } from "vitest";

import { RecruitCrmClient } from "../src/recruitcrm/client.js";
import type { HttpRequestOptions, HttpResponse } from "../src/recruitcrm/http.js";
import {
  sampleCallLogSearchResponse,
  sampleHiringPipelineResponse,
  sampleCandidateJobAssignmentHiringStageHistoryResponse,
  sampleCandidateDetailResponse,
  sampleCompanyDetailResponse,
  sampleCompanySearchResponse,
  sampleContactDetailResponse,
  sampleContactSearchResponse,
  sampleCreatedHotlistResponse,
  sampleCreatedNoteResponse,
  sampleCreatedTaskResponse,
  sampleHotlistSearchResponse,
  sampleJobAssignedCandidatesResponse,
  sampleJobDetailResponse,
  sampleJobSearchResponse,
  sampleMeetingSearchResponse,
  sampleNoteSearchResponse,
  sampleNoteTypeListResponse,
  sampleSearchResponse,
  sampleTaskSearchResponse,
  sampleTaskTypeListResponse,
  sampleUserListResponse,
  sampleUserListResponseBareTeams,
} from "./fixtures.js";

const baseConfig = {
  apiToken: "test-token",
  baseUrl: "https://api.recruitcrm.io/v1",
  timeoutMs: 10_000,
  debugSchemaErrors: false,
};

describe("RecruitCrmClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ignores unused search field type changes", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify({
        current_page: 2,
        next_page_url: "https://api.recruitcrm.io/v1/candidates/search?page=3",
        data: [
          {
            slug: "010011",
            first_name: "Sample",
            last_name: "Candidate",
            position: "Software Developer",
            current_organization: "Acme Labs",
            current_status: "Employed",
            city: "Example City",
            updated_on: "2020-06-29T05:36:22.000000Z",
            current_salary: { amount: 150000 },
            candidate_summary: { html: "<p>summary</p>" },
            owner: { id: 10001 },
          },
        ],
      }),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchCandidates({ first_name: "Sample" });
    const candidate = result.data[0];

    expect(candidate).toMatchObject({
      slug: "010011",
      first_name: "Sample",
      last_name: "Candidate",
      position: "Software Developer",
    });
  });

  it("parses assigned candidates payloads while capping limit and preserving status_id filters", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      expect(request.url.pathname).toBe("/v1/jobs/job-sample-001/assigned-candidates");
      expect(request.url.searchParams.get("page")).toBe("2");
      expect(request.url.searchParams.get("limit")).toBe("100");
      expect(request.url.searchParams.get("status_id")).toBe("8,12");

      return {
        statusCode: 200,
        bodyText: JSON.stringify(sampleJobAssignedCandidatesResponse),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.getJobAssignedCandidates("job-sample-001", {
      page: 2,
      limit: 250,
      status_id: "8,12",
    });

    expect(result.current_page).toBe(1);
    expect(result.next_page_url).toBe("https://api.recruitcrm.io/v1/jobs/job-sample-001/assigned-candidates?page=2");
    expect(result.data[0]).toMatchObject({
      stage_date: "2026-02-20T09:08:45.000000Z",
      status: {
        status_id: "8",
        label: "Placed",
      },
      candidate: {
        slug: "candidate-assigned-sample-001",
        first_name: "Michael",
        last_name: "Scott",
        position: "Regional Manager",
        current_organization: "Dunder Mifflin",
        current_status: "Employed",
        city: "Scranton",
        country: "United States",
      },
    });
  });

  it("accepts empty assigned candidate pages", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify({
        current_page: 1,
        next_page_url: null,
        data: [],
      }),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.getJobAssignedCandidates("job-sample-001", {});

    expect(result).toEqual({
      current_page: 1,
      next_page_url: null,
      data: [],
    });
  });

  it("parses hiring pipeline payloads and tolerates status_id-backed rows", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      expect(request.url.pathname).toBe("/v1/hiring-pipeline");

      return {
        statusCode: 200,
        bodyText: JSON.stringify(sampleHiringPipelineResponse),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.listCandidateHiringStages();

    expect(result).toEqual(sampleHiringPipelineResponse);
  });

  it("parses task search payloads while tolerating large nested related objects", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(sampleTaskSearchResponse),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchTasks({
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
    });

    expect(result.current_page).toBe(1);
    expect(result.next_page_url).toBe("https://api.recruitcrm.io/v1/tasks/search?page=2");
    expect(result.data[0]).toMatchObject({
      id: 2572223,
      related_to: "candidate-related-sample-001",
      task_type: null,
      related: {
        first_name: "Sample",
        last_name: "Candidate",
      },
      title: "Follow up",
      status: 1,
    });
  });

  it("parses job search payloads while tolerating large nested payloads", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(sampleJobSearchResponse),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchJobs({
      job_slug: "job-sample-001",
      limit: 1,
    });

    expect(result.current_page).toBe(1);
    expect(result.next_page_url).toBe("https://api.recruitcrm.io/v1/jobs/search?page=2");
    expect(result.data[0]).toMatchObject({
      id: 313,
      slug: "job-sample-001",
      name: "Operations Analyst",
      company_slug: "company-sample-001",
      contact_slug: "contact-sample-001",
      salary_type: {
        id: "2",
        label: "Annual Salary",
      },
      job_status: {
        id: 1,
        label: "Open",
      },
      job_type: "Contract",
      enable_job_application_form: 1,
    });
    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.objectContaining({
          pathname: "/v1/jobs/search",
        }),
      }),
    );
  });

  it("accepts empty paginated job search payloads", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify({
        current_page: 1,
        next_page_url: null,
        data: [],
      }),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchJobs({ name: "Operations Analyst" });

    expect(result).toEqual({
      current_page: 1,
      next_page_url: null,
      data: [],
    });
  });

  it("parses company search payloads while tolerating large nested payloads", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(sampleCompanySearchResponse),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchCompanies({
      company_slug: "company-sample-001",
    });

    expect(result.current_page).toBe(1);
    expect(result.next_page_url).toBe("https://api.recruitcrm.io/v1/companies/search?page=2");
    expect(result.data[0]).toMatchObject({
      id: 403,
      slug: "company-sample-001",
      company_name: "Example Holdings",
      owner: 3735,
      contact_slug: ["contact-sample-001", "", null, "contact-sample-002"],
      is_child_company: "No",
      is_parent_company: "Yes",
      off_limit_status_id: "12",
      status_label: "Off Limits",
    });
    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.objectContaining({
          pathname: "/v1/companies/search",
        }),
      }),
    );
  });

  it("accepts empty paginated company search payloads", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify({
        current_page: 1,
        next_page_url: null,
        data: [],
      }),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchCompanies({ company_name: "Example Holdings" });

    expect(result).toEqual({
      current_page: 1,
      next_page_url: null,
      data: [],
    });
  });

  it("parses contact search payloads while tolerating large nested payloads", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(sampleContactSearchResponse),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchContacts({
      contact_slug: "contact-sample-001",
    });

    expect(result.current_page).toBe(1);
    expect(result.next_page_url).toBe("https://api.recruitcrm.io/v1/contacts/search?page=2");
    expect(result.data[0]).toMatchObject({
      id: 501,
      slug: "contact-sample-001",
      first_name: "Pam",
      last_name: "Beesly",
      email: "pam.beesly@example.com",
      contact_number: "+1-555-0142",
      linkedin: "https://www.linkedin.com/in/pam-beesly",
      company_slug: "company-sample-001",
      additional_company_slugs: ["company-sample-aux-001", "", null],
      designation: "Office Manager",
      city: "Scranton",
      locality: "Downtown",
    });
    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.objectContaining({
          pathname: "/v1/contacts/search",
        }),
      }),
    );
  });

  it("normalizes empty contact search arrays into an empty paginated response", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify([]),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchContacts({ first_name: "Pam" });

    expect(result).toEqual({
      current_page: 1,
      next_page_url: null,
      data: [],
    });
  });

  it("parses contact list payloads", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      expect(request.url.pathname).toBe("/v1/contacts");
      expect(request.url.searchParams.get("page")).toBe("2");
      expect(request.url.searchParams.get("limit")).toBe("25");
      expect(request.url.searchParams.get("sort_by")).toBe("createdon");
      expect(request.url.searchParams.get("sort_order")).toBe("asc");

      return {
        statusCode: 200,
        bodyText: JSON.stringify(sampleContactSearchResponse),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.listContacts({
      page: 2,
      limit: 25,
      sort_by: "createdon",
      sort_order: "asc",
    });

    expect(result.current_page).toBe(1);
    expect(result.data[0]).toMatchObject({
      slug: "contact-sample-001",
      company_slug: "company-sample-001",
    });
  });

  it("parses hotlist search payloads and preserves large related strings", async () => {
    const longRelated = Array.from({ length: 200 }, (_, index) => `candidate-hotlist-${index + 1}`).join(",");
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      expect(request.url.pathname).toBe("/v1/hotlists/search");
      expect(request.url.searchParams.get("page")).toBe("2");
      expect(request.url.searchParams.get("related_to_type")).toBe("candidate");
      expect(request.url.searchParams.get("name")).toBe("Product");
      expect(request.url.searchParams.get("shared")).toBe("1");

      return {
        statusCode: 200,
        bodyText: JSON.stringify({
          ...sampleHotlistSearchResponse,
          data: [
            {
              ...sampleHotlistSearchResponse.data[0],
              related: longRelated,
            },
            sampleHotlistSearchResponse.data[1],
          ],
        }),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchHotlists({
      page: 2,
      related_to_type: "candidate",
      name: "Product",
      shared: 1,
    });

    expect(result.current_page).toBe(1);
    expect(result.next_page_url).toBe("https://api.recruitcrm.io/v1/hotlists/search?page=2");
    expect(result.data[0]).toMatchObject({
      id: 702,
      name: "Product Leaders",
      related_to_type: "candidate",
      shared: 1,
      created_by: 66960,
      related: longRelated,
    });
    expect(result.data[1]?.related).toBeNull();
  });

  it("normalizes empty hotlist search arrays into an empty paginated response", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify([]),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchHotlists({ related_to_type: "candidate" });

    expect(result).toEqual({
      current_page: 1,
      next_page_url: null,
      data: [],
    });
  });

  it("posts createHotlist requests and parses the created hotlist response", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      expect(request.url.pathname).toBe("/v1/hotlists");
      expect(request.method).toBe("POST");
      expect(request.jsonBody).toEqual({
        name: "Product Leaders",
        related_to_type: "candidate",
        shared: 0,
        created_by: 453,
      });

      return {
        statusCode: 200,
        bodyText: JSON.stringify(sampleCreatedHotlistResponse),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.createHotlist({
      name: "Product Leaders",
      related_to_type: "candidate",
      shared: 0,
      created_by: 453,
    });

    expect(result).toMatchObject({
      id: 307309,
      name: "Product Leaders",
      related_to_type: "candidate",
      shared: 0,
      created_by: 453,
    });
  });

  it("maps createHotlist validation errors through the existing hotlist error handler", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 422,
      bodyText: JSON.stringify({ message: "created_by is required" }),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    await expect(
      client.createHotlist({
        name: "Product Leaders",
        related_to_type: "candidate",
        shared: 0,
        created_by: 453,
      }),
    ).rejects.toMatchObject({
      message: "Recruit CRM API validation error (422): created_by is required",
    });
  });

  it("posts addRecordToHotlist requests without requiring a JSON success payload", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      expect(request.url.pathname).toBe("/v1/hotlists/702/add-record");
      expect(request.method).toBe("POST");
      expect(request.jsonBody).toEqual({
        related: "candidate-sample-001",
      });

      return {
        statusCode: 204,
        bodyText: "",
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    await expect(client.addRecordToHotlist(702, "candidate-sample-001")).resolves.toBeUndefined();
  });

  it("maps hotlist add-record 404s to hotlist not found", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 404,
      bodyText: JSON.stringify({ message: "Not found" }),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    await expect(client.addRecordToHotlist(999, "candidate-sample-001")).rejects.toMatchObject({
      message: expect.stringMatching(/^Hotlist not found\./),
    });
  });

  it("lists users without expanding teams by default", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      expect(request.url.pathname).toBe("/v1/users");
      expect(request.url.searchParams.get("expand")).toBeNull();

      return {
        statusCode: 200,
        bodyText: JSON.stringify(sampleUserListResponse),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.listUsers({});

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      id: 453,
      first_name: "Sean",
      status: "Active",
    });
  });

  it("sends expand=team when listing users with teams", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      expect(request.url.pathname).toBe("/v1/users");
      expect(request.url.searchParams.get("expand")).toBe("team");

      return {
        statusCode: 200,
        bodyText: JSON.stringify(sampleUserListResponse),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.listUsers({ include_teams: true });

    expect(result[0]?.teams).toHaveLength(2);
  });

  it("parses user list response where teams is an array of bare numbers", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(sampleUserListResponseBareTeams),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.listUsers({});

    expect(result).toHaveLength(1);
    expect(result[0]?.teams).toEqual([1435, 2253, 9871]);
  });

  it("normalizes empty task search arrays into an empty paginated response", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify([]),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchTasks({});

    expect(result).toEqual({
      current_page: 1,
      next_page_url: null,
      data: [],
    });
  });

  it("accepts task_type as a single object in task search payloads", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify({
        current_page: 1,
        next_page_url: null,
        data: [
          {
            ...sampleTaskSearchResponse.data[0],
            task_type: {
              id: 209961,
              label: "Call Candidate",
            },
          },
        ],
      }),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchTasks({
      created_from: "2026-03-01",
      created_to: "2026-04-08",
    });

    expect(result.data[0]).toMatchObject({
      id: 2572223,
      task_type: {
        id: 209961,
        label: "Call Candidate",
      },
    });
  });

  it("parses task type list payloads", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      expect(request.url.pathname).toBe("/v1/task-types");

      return {
        statusCode: 200,
        bodyText: JSON.stringify(sampleTaskTypeListResponse),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.listTaskTypes();

    expect(result).toEqual(sampleTaskTypeListResponse);
  });

  it("creates tasks with rich text descriptions", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      expect(request.url.pathname).toBe("/v1/tasks");
      expect(request.method).toBe("POST");
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
        associated_candidates: "candidate-related-sample-001,candidate-related-sample-002",
        collaborators: "12654",
      });

      return {
        statusCode: 200,
        bodyText: JSON.stringify(sampleCreatedTaskResponse),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.createTask({
      task_type_id: 332,
      title: "Follow up call",
      description: "<p><strong>Rich task</strong></p>",
      reminder: 30,
      start_date: "2026-04-28T04:30:00.000000Z",
      owner_id: 453,
      created_by: 453,
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
      associated_candidates: ["candidate-related-sample-001", "candidate-related-sample-002"],
      collaborator_user_ids: [12654],
    });

    expect(result).toEqual(sampleCreatedTaskResponse);
  });

  it("parses meeting search payloads and tolerates large attendee payloads", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(sampleMeetingSearchResponse),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchMeetings({
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
    });

    expect(result.current_page).toBe(1);
    expect(result.next_page_url).toBe("https://api.recruitcrm.io/v1/meetings/search?page=2");
    expect(result.data[0]).toMatchObject({
      id: 47202185,
      title: "Sample Candidate/Product Manager (Acme Labs)",
      meeting_type: {
        id: 20707,
        label: "Candidate Interview with Client",
      },
      related: {
        first_name: "Sample",
        last_name: "Candidate",
      },
      all_day: 1,
    });
  });

  it("normalizes empty meeting search arrays into an empty paginated response", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify([]),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchMeetings({});

    expect(result).toEqual({
      current_page: 1,
      next_page_url: null,
      data: [],
    });
  });

  it("parses note search payloads and tolerates large related objects", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(sampleNoteSearchResponse),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchNotes({
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
    });

    expect(result.current_page).toBe(1);
    expect(result.next_page_url).toBe("https://api.recruitcrm.io/v1/notes/search?page=2");
    expect(result.data[0]).toMatchObject({
      id: 24667666,
      note_type: {
        id: 205989,
        label: "Candidate Interaction",
      },
      related_to: "candidate-related-sample-001",
      related: {
        first_name: "Sample",
        last_name: "Candidate",
      },
    });
  });

  it("normalizes empty note search arrays into an empty paginated response", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify([]),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchNotes({});

    expect(result).toEqual({
      current_page: 1,
      next_page_url: null,
      data: [],
    });
  });

  it("parses note type list payloads", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      expect(request.url.pathname).toBe("/v1/note-types");

      return {
        statusCode: 200,
        bodyText: JSON.stringify(sampleNoteTypeListResponse),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.listNoteTypes();

    expect(result).toEqual(sampleNoteTypeListResponse);
  });

  it("creates notes with rich text descriptions", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      expect(request.url.pathname).toBe("/v1/notes");
      expect(request.method).toBe("POST");
      expect(request.jsonBody).toEqual({
        note_type_id: 108871,
        description: "<p><strong>Rich text</strong></p>",
        related_to: "candidate-related-sample-001",
        related_to_type: "candidate",
        created_by: 453,
        associated_candidates: "candidate-related-sample-001,candidate-related-sample-002",
      });

      return {
        statusCode: 200,
        bodyText: JSON.stringify(sampleCreatedNoteResponse),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.createNote({
      note_type_id: 108871,
      description: "<p><strong>Rich text</strong></p>",
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
      created_by: 453,
      associated_candidates: ["candidate-related-sample-001", "candidate-related-sample-002"],
    });

    expect(result).toEqual(sampleCreatedNoteResponse);
  });

  it("parses call log search payloads and tolerates large related objects", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(sampleCallLogSearchResponse),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchCallLogs({
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
    });

    expect(result.current_page).toBe(1);
    expect(result.next_page_url).toBe("https://api.recruitcrm.io/v1/call-logs/search?page=2");
    expect(result.data[0]).toMatchObject({
      id: 498645,
      call_type: "CALL_OUTGOING",
      custom_call_type: {
        id: 2,
        label: "Pitch Attempt",
      },
      related: {
        first_name: "Sample",
        last_name: "Candidate",
      },
      duration: 17,
    });
  });

  it("normalizes empty call log search arrays into an empty paginated response", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify([]),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchCallLogs({});

    expect(result).toEqual({
      current_page: 1,
      next_page_url: null,
      data: [],
    });
  });

  it("parses candidate job assignment hiring stage history payloads", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(sampleCandidateJobAssignmentHiringStageHistoryResponse),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.getCandidateJobAssignmentHiringStageHistory("candidate-related-sample-001");

    expect(result).toEqual(sampleCandidateJobAssignmentHiringStageHistoryResponse);
    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.objectContaining({
          pathname: "/v1/candidates/candidate-related-sample-001/history",
        }),
      }),
    );
  });

  it("keeps invalid payload errors generic when debug logging is disabled", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify({
        current_page: 1,
        data: [
          {
            slug: "010011",
            position: { title: "bad-type" },
          },
        ],
      }),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    await expect(client.searchCandidates({ first_name: "Sample" })).rejects.toMatchObject({
      message: expect.stringContaining("Recruit CRM API returned an unexpected response shape"),
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("logs compact schema issues when debug logging is enabled", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify({
        current_page: 1,
        data: [
          {
            slug: "010011",
            position: { title: "bad-type" },
          },
        ],
      }),
    }));
    const client = new RecruitCrmClient({ ...baseConfig, debugSchemaErrors: true }, transport);

    await expect(client.searchCandidates({ first_name: "Sample" })).rejects.toMatchObject({
      message: expect.stringContaining("Recruit CRM API returned an unexpected response shape"),
    });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Recruit CRM schema mismatch for /candidates/search"),
    );
  });

  it("parses custom-field metadata without validating unused fields", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify([
        {
          field_id: "34",
          field_type: "dropdown",
          field_name: "Category",
          default_value: { unexpected: true },
          unused_metadata: {
            nested: true,
          },
        },
      ]),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.getCandidateCustomFields();

    expect(result).toEqual([
      {
        field_id: 34,
        field_type: "dropdown",
        field_name: "Category",
        default_value: { unexpected: true },
        unused_metadata: {
          nested: true,
        },
      },
    ]);
  });

  it("parses direct candidate detail payloads", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(sampleCandidateDetailResponse),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.getCandidateDetails("candidate-detail-sample-001");

    expect(result.slug).toBe("candidate-detail-sample-001");
    expect(result.current_salary).toBe(0);
    expect(result.resume).toEqual({
      filename: "Sample Resume.pdf",
      file_link: "https://api.recruitcrm.io/v1/candidates/candidate-detail-sample-001/resume/example",
    });
    expect(result.salary_type).toEqual({
      id: "2",
      label: "Annual Salary",
    });
    expect(result.custom_fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_id: 34,
          field_name: "Tech Stack",
        }),
      ]),
    );
    expect(result.work_history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Founder",
          work_company_name: "Acme Foods",
        }),
      ]),
    );
    expect(result.education_history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          institute_name: "Example Institute of Technology",
        }),
      ]),
    );
  });

  it("parses direct job detail payloads", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(sampleJobDetailResponse),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.getJobDetails("job-detail-sample-001");

    expect(result.slug).toBe("job-detail-sample-001");
    expect(result.salary_type).toEqual({
      id: 2,
      label: "Annual Salary",
    });
    expect(result.custom_fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_id: 1,
          field_name: "Region",
        }),
      ]),
    );
    expect(result.job_questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          question: "Why this role?",
        }),
      ]),
    );
    expect(result.resource_url).toBe("https://app.recruitcrm.io/job/job-detail-sample-001");
  });

  it("parses direct company detail payloads", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      expect(request.url.pathname).toBe("/v1/companies/company-detail-sample-001");

      return {
        statusCode: 200,
        bodyText: JSON.stringify(sampleCompanyDetailResponse),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.getCompanyDetails("company-detail-sample-001");

    expect(result.slug).toBe("company-detail-sample-001");
    expect(result.company_name).toBe("Example Holdings");
    expect(result.contact_slug).toEqual(["contact-sample-001", "", null, "contact-sample-002"]);
    expect(result.custom_fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_id: 1,
          field_name: "Parent Organization",
        }),
      ]),
    );
    expect(result.resource_url).toBe("https://app.recruitcrm.io/company/company-detail-sample-001");
  });

  it("parses direct contact detail payloads", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      expect(request.url.pathname).toBe("/v1/contacts/contact-detail-sample-001");

      return {
        statusCode: 200,
        bodyText: JSON.stringify(sampleContactDetailResponse),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.getContactDetails("contact-detail-sample-001");

    expect(result.slug).toBe("contact-detail-sample-001");
    expect(result.company_name).toBe("Example Holdings");
    expect(result.additional_company_slugs).toEqual(["company-sample-aux-001", "", null]);
    expect(result.custom_fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_id: 1,
          field_name: "Department",
        }),
      ]),
    );
    expect(result.resource_url).toBe("https://app.recruitcrm.io/contact/contact-detail-sample-001");
  });

  it("maps direct detail 404s to candidate not found", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 404,
      bodyText: JSON.stringify({ message: "Not found" }),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    await expect(client.getCandidateDetails("missing")).rejects.toMatchObject({
      message: expect.stringMatching(/^Candidate not found\./),
    });
  });

  it("maps direct job detail 404s to job not found", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 404,
      bodyText: JSON.stringify({ message: "Not found" }),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    await expect(client.getJobDetails("missing-job")).rejects.toMatchObject({
      message: expect.stringMatching(/^Job not found\./),
    });
  });

  it("maps direct company detail 404s to company not found", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 404,
      bodyText: JSON.stringify({ message: "Not found" }),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    await expect(client.getCompanyDetails("missing-company")).rejects.toMatchObject({
      message: expect.stringMatching(/^Company not found\./),
    });
  });

  it("maps direct contact detail 404s to contact not found", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 404,
      bodyText: JSON.stringify({ message: "Not found" }),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    await expect(client.getContactDetails("missing-contact")).rejects.toMatchObject({
      message: expect.stringMatching(/^Contact not found\./),
    });
  });

  it("logs compact schema issues for direct detail payloads when debug logging is enabled", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(["not-an-object"]),
    }));
    const client = new RecruitCrmClient({ ...baseConfig, debugSchemaErrors: true }, transport);

    await expect(client.getCandidateDetails("candidate-detail-sample-001")).rejects.toMatchObject({
      message: expect.stringContaining("Recruit CRM API returned an unexpected response shape"),
    });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Recruit CRM schema mismatch for /candidates/candidate-detail-sample-001: <root>:"),
    );
  });

  it("logs compact schema issues for direct company detail payloads when debug logging is enabled", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(["not-an-object"]),
    }));
    const client = new RecruitCrmClient({ ...baseConfig, debugSchemaErrors: true }, transport);

    await expect(client.getCompanyDetails("company-detail-sample-001")).rejects.toMatchObject({
      message: expect.stringContaining("Recruit CRM API returned an unexpected response shape"),
    });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Recruit CRM schema mismatch for /companies/company-detail-sample-001: <root>:"),
    );
  });

  it("logs compact schema issues for direct contact detail payloads when debug logging is enabled", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(["not-an-object"]),
    }));
    const client = new RecruitCrmClient({ ...baseConfig, debugSchemaErrors: true }, transport);

    await expect(client.getContactDetails("contact-detail-sample-001")).rejects.toMatchObject({
      message: expect.stringContaining("Recruit CRM API returned an unexpected response shape"),
    });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Recruit CRM schema mismatch for /contacts/contact-detail-sample-001: <root>:"),
    );
  });
});

describe("executeGetCandidateDetails", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a batch envelope for a single slug", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      const slug = request.url.pathname.split("/").pop() ?? "";
      return {
        statusCode: 200,
        bodyText: JSON.stringify({ slug, first_name: `name-${slug}` }),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeGetCandidateDetails } = await import("../src/server.js");
    const result = await executeGetCandidateDetails(client, {
      candidate_slugs: ["slug-a"],
    });

    expect(result).toMatchObject({
      requested_count: 1,
      successful_count: 1,
      failed_count: 0,
      errors: [],
      candidates: [expect.objectContaining({ slug: "slug-a" })],
    });
  });

  it("returns a result entry for each unique slug on the success path", async () => {
    const seen: string[] = [];
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      const slug = request.url.pathname.split("/").pop() ?? "";
      seen.push(slug);
      return {
        statusCode: 200,
        bodyText: JSON.stringify({ slug, first_name: `name-${slug}` }),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeGetCandidateDetails } = await import("../src/server.js");
    const result = await executeGetCandidateDetails(client, {
      candidate_slugs: ["slug-a", "slug-b", "slug-c"],
    });

    expect(result).toMatchObject({
      requested_count: 3,
      successful_count: 3,
      failed_count: 0,
      errors: [],
    });
    expect(result.candidates).toHaveLength(3);
    expect(seen.sort()).toEqual(["slug-a", "slug-b", "slug-c"]);
  });

  it("surfaces partial failures with status_code from the API error", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      const slug = request.url.pathname.split("/").pop() ?? "";
      if (slug === "bad-slug") {
        return { statusCode: 404, bodyText: JSON.stringify({ message: "Not found" }) };
      }
      return {
        statusCode: 200,
        bodyText: JSON.stringify({ slug, first_name: `name-${slug}` }),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeGetCandidateDetails } = await import("../src/server.js");
    const result = await executeGetCandidateDetails(client, {
      candidate_slugs: ["slug-a", "bad-slug", "slug-c"],
    });

    expect(result.requested_count).toBe(3);
    expect(result.successful_count).toBe(2);
    expect(result.failed_count).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      slug: "bad-slug",
      status_code: 404,
    });
    expect(result.errors[0].error).toMatch(/Candidate not found/i);
  });

  it("deduplicates input slugs before fan-out", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      const slug = request.url.pathname.split("/").pop() ?? "";
      return {
        statusCode: 200,
        bodyText: JSON.stringify({ slug }),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeGetCandidateDetails } = await import("../src/server.js");
    const result = await executeGetCandidateDetails(client, {
      candidate_slugs: ["slug-a", "slug-a", "slug-b"],
    });

    expect(transport).toHaveBeenCalledTimes(2);
    expect(result.requested_count).toBe(2);
    expect(result.successful_count).toBe(2);
  });
});

describe("executeGetContactDetails", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a result entry for each unique slug on the success path", async () => {
    const seen: string[] = [];
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      const slug = request.url.pathname.split("/").pop() ?? "";
      seen.push(slug);
      return {
        statusCode: 200,
        bodyText: JSON.stringify({ slug, first_name: `name-${slug}` }),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeGetContactDetails } = await import("../src/server.js");
    const result = await executeGetContactDetails(client, {
      contact_slugs: ["slug-a", "slug-b", "slug-c"],
    });

    expect(result).toMatchObject({
      requested_count: 3,
      successful_count: 3,
      failed_count: 0,
      errors: [],
    });
    expect(result.contacts).toHaveLength(3);
    expect(seen.sort()).toEqual(["slug-a", "slug-b", "slug-c"]);
  });

  it("surfaces partial failures with status_code from the API error", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      const slug = request.url.pathname.split("/").pop() ?? "";
      if (slug === "bad-slug") {
        return { statusCode: 404, bodyText: JSON.stringify({ message: "Not found" }) };
      }
      return {
        statusCode: 200,
        bodyText: JSON.stringify({ slug, first_name: `name-${slug}` }),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeGetContactDetails } = await import("../src/server.js");
    const result = await executeGetContactDetails(client, {
      contact_slugs: ["slug-a", "bad-slug", "slug-c"],
    });

    expect(result.requested_count).toBe(3);
    expect(result.successful_count).toBe(2);
    expect(result.failed_count).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      slug: "bad-slug",
      status_code: 404,
    });
    expect(result.errors[0].error).toMatch(/Contact not found/i);
  });

  it("deduplicates input slugs before fan-out", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      const slug = request.url.pathname.split("/").pop() ?? "";
      return {
        statusCode: 200,
        bodyText: JSON.stringify({ slug }),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeGetContactDetails } = await import("../src/server.js");
    const result = await executeGetContactDetails(client, {
      contact_slugs: ["slug-a", "slug-a", "slug-b"],
    });

    expect(transport).toHaveBeenCalledTimes(2);
    expect(result.requested_count).toBe(2);
    expect(result.successful_count).toBe(2);
  });
});

describe("executeGetCompanyDetails", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a batch envelope for a single slug", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      const slug = request.url.pathname.split("/").pop() ?? "";
      return {
        statusCode: 200,
        bodyText: JSON.stringify({ slug, company_name: `name-${slug}` }),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeGetCompanyDetails } = await import("../src/server.js");
    const result = await executeGetCompanyDetails(client, {
      company_slugs: ["slug-a"],
    });

    expect(result).toMatchObject({
      requested_count: 1,
      successful_count: 1,
      failed_count: 0,
      errors: [],
      companies: [expect.objectContaining({ slug: "slug-a" })],
    });
  });

  it("returns a result entry for each unique slug on the success path", async () => {
    const seen: string[] = [];
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      const slug = request.url.pathname.split("/").pop() ?? "";
      seen.push(slug);
      return {
        statusCode: 200,
        bodyText: JSON.stringify({ slug, company_name: `name-${slug}` }),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeGetCompanyDetails } = await import("../src/server.js");
    const result = await executeGetCompanyDetails(client, {
      company_slugs: ["slug-a", "slug-b", "slug-c"],
    });

    expect(result).toMatchObject({
      requested_count: 3,
      successful_count: 3,
      failed_count: 0,
      errors: [],
    });
    expect(result.companies).toHaveLength(3);
    expect(seen.sort()).toEqual(["slug-a", "slug-b", "slug-c"]);
  });

  it("surfaces partial failures with status_code from the API error", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      const slug = request.url.pathname.split("/").pop() ?? "";
      if (slug === "bad-slug") {
        return { statusCode: 404, bodyText: JSON.stringify({ message: "Not found" }) };
      }
      return {
        statusCode: 200,
        bodyText: JSON.stringify({ slug, company_name: `name-${slug}` }),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeGetCompanyDetails } = await import("../src/server.js");
    const result = await executeGetCompanyDetails(client, {
      company_slugs: ["slug-a", "bad-slug", "slug-c"],
    });

    expect(result.requested_count).toBe(3);
    expect(result.successful_count).toBe(2);
    expect(result.failed_count).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      slug: "bad-slug",
      status_code: 404,
    });
    expect(result.errors[0].error).toMatch(/Company not found/i);
  });

  it("deduplicates input slugs before fan-out", async () => {
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      const slug = request.url.pathname.split("/").pop() ?? "";
      return {
        statusCode: 200,
        bodyText: JSON.stringify({ slug }),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeGetCompanyDetails } = await import("../src/server.js");
    const result = await executeGetCompanyDetails(client, {
      company_slugs: ["slug-a", "slug-a", "slug-b"],
    });

    expect(transport).toHaveBeenCalledTimes(2);
    expect(result.requested_count).toBe(2);
    expect(result.successful_count).toBe(2);
  });
});

describe("executeCreateHotlist", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns normalized create_hotlist output", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(sampleCreatedHotlistResponse),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeCreateHotlist } = await import("../src/server.js");
    const result = await executeCreateHotlist(client, {
      name: "Product Leaders",
      related_to_type: "candidate",
      shared: 0,
      created_by: 453,
    });

    expect(result).toEqual({
      hotlist_id: 307309,
      name: "Product Leaders",
      related_to_type: "candidate",
      shared: false,
      created_by: 453,
    });
  });
});

describe("executeCreateTask", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates the task type before creating and returns compact output", async () => {
    const seenPaths: string[] = [];
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      seenPaths.push(request.url.pathname);

      if (request.url.pathname.endsWith("/task-types")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleTaskTypeListResponse),
        };
      }

      if (request.url.pathname.endsWith("/tasks")) {
        expect(request.method).toBe("POST");
        expect(request.jsonBody).toMatchObject({
          task_type_id: 332,
          title: "Follow up call",
          description: "<p><strong>Rich task</strong></p>",
          reminder: 30,
          start_date: "2026-04-28T04:30:00.000000Z",
          owner_id: 453,
          created_by: 453,
          related_to: "candidate-related-sample-001",
          related_to_type: "candidate",
        });

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleCreatedTaskResponse),
        };
      }

      throw new Error(`Unexpected request: ${request.url.toString()}`);
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeCreateTask } = await import("../src/server.js");
    const result = await executeCreateTask(client, {
      task_type_id: 332,
      title: "Follow up call",
      description: "<p><strong>Rich task</strong></p>",
      reminder: 30,
      start_date: "2026-04-28T04:30:00.000000Z",
      owner_id: 453,
      created_by: 453,
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
    });

    expect(seenPaths).toEqual(["/v1/task-types", "/v1/tasks"]);
    expect(result).toMatchObject({
      task_id: 66753909,
      task_type: {
        id: 332,
        label: "Follow up",
      },
      title: "Codex API test task",
      description: sampleCreatedTaskResponse.description,
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
      related_to_view_url: "https://app.recruitcrm.io/candidate/candidate-related-sample-001",
      owner: 453,
      created_by: 453,
      updated_by: 453,
    });
    expect(result).not.toHaveProperty("related");
  });
});

describe("executeCreateNote", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates the note type before creating and returns compact output", async () => {
    const seenPaths: string[] = [];
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      seenPaths.push(request.url.pathname);

      if (request.url.pathname.endsWith("/note-types")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleNoteTypeListResponse),
        };
      }

      if (request.url.pathname.endsWith("/notes")) {
        expect(request.method).toBe("POST");
        expect(request.jsonBody).toMatchObject({
          note_type_id: 108871,
          description: "<p><strong>Rich text</strong></p>",
          related_to: "candidate-related-sample-001",
          related_to_type: "candidate",
          created_by: 453,
        });

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleCreatedNoteResponse),
        };
      }

      throw new Error(`Unexpected request: ${request.url.toString()}`);
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeCreateNote } = await import("../src/server.js");
    const result = await executeCreateNote(client, {
      note_type_id: 108871,
      description: "<p><strong>Rich text</strong></p>",
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
      created_by: 453,
    });

    expect(seenPaths).toEqual(["/v1/note-types", "/v1/notes"]);
    expect(result).toMatchObject({
      note_id: 66752552,
      note_type: {
        id: 108871,
        label: "General Note",
      },
      description: sampleCreatedNoteResponse.description,
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
      created_by: 453,
      updated_by: 453,
    });
    expect(result).not.toHaveProperty("related");
  });
});

describe("executeAddRecordsToHotlist", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a stable batch envelope for a single slug", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 204,
      bodyText: "",
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeAddRecordsToHotlist } = await import("../src/server.js");
    const result = await executeAddRecordsToHotlist(client, {
      hotlist_id: 702,
      related_slugs: ["slug-a"],
    });

    expect(result).toEqual({
      hotlist_id: 702,
      requested_count: 1,
      successful_count: 1,
      failed_count: 0,
      added_slugs: ["slug-a"],
      errors: [],
    });
  });

  it("executes sequentially, deduplicates input, and preserves partial failures", async () => {
    const callOrder: string[] = [];
    const transport = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      const slug = String((request.jsonBody as { related: string }).related);
      callOrder.push(slug);

      if (slug === "bad-slug") {
        return {
          statusCode: 422,
          bodyText: JSON.stringify({ message: "Slug rejected" }),
        };
      }

      return {
        statusCode: 200,
        bodyText: JSON.stringify({ ok: true }),
      };
    });
    const client = new RecruitCrmClient(baseConfig, transport);

    const { executeAddRecordsToHotlist } = await import("../src/server.js");
    const result = await executeAddRecordsToHotlist(client, {
      hotlist_id: 702,
      related_slugs: ["slug-a", "slug-a", "bad-slug", "slug-b"],
    });

    expect(callOrder).toEqual(["slug-a", "bad-slug", "slug-b"]);
    expect(result).toMatchObject({
      hotlist_id: 702,
      requested_count: 3,
      successful_count: 2,
      failed_count: 1,
      added_slugs: ["slug-a", "slug-b"],
      errors: [
        {
          slug: "bad-slug",
          status_code: 422,
          error: expect.stringContaining("validation error"),
        },
      ],
    });
    expect(transport).toHaveBeenCalledTimes(3);
  });
});
