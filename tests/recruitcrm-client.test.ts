import { afterEach, describe, expect, it, vi } from "vitest";

import { RecruitCrmClient } from "../src/recruitcrm/client.js";
import type { HttpRequestOptions, HttpResponse } from "../src/recruitcrm/http.js";
import {
  sampleCallLogSearchResponse,
  sampleHiringPipelineResponse,
  sampleCandidateJobAssignmentHiringStageHistoryResponse,
  sampleCandidateDetailResponse,
  sampleCompanySearchResponse,
  sampleJobAssignedCandidatesResponse,
  sampleJobDetailResponse,
  sampleJobSearchResponse,
  sampleMeetingSearchResponse,
  sampleNoteSearchResponse,
  sampleSearchResponse,
  sampleTaskSearchResponse,
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
      message: "Recruit CRM API returned an invalid response.",
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
      message: "Recruit CRM API returned an invalid response.",
    });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Recruit CRM schema mismatch for /candidates/search: data.0.position"),
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

  it("maps direct detail 404s to candidate not found", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 404,
      bodyText: JSON.stringify({ message: "Not found" }),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    await expect(client.getCandidateDetails("missing")).rejects.toMatchObject({
      message: "Candidate not found.",
    });
  });

  it("maps direct job detail 404s to job not found", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 404,
      bodyText: JSON.stringify({ message: "Not found" }),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    await expect(client.getJobDetails("missing-job")).rejects.toMatchObject({
      message: "Job not found.",
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
      message: "Recruit CRM API returned an invalid response.",
    });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Recruit CRM schema mismatch for /candidates/candidate-detail-sample-001: <root>:"),
    );
  });
});
