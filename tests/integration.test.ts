import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";

import { createRecruitCrmServer } from "../src/server.js";
import type { HttpRequestOptions, HttpResponse } from "../src/recruitcrm/http.js";
import {
  sampleCallLogSearchResponse,
  sampleCandidateCustomFieldsResponse,
  sampleCandidateDetailResponse,
  sampleCandidateJobAssignmentHiringStageHistoryResponse,
  sampleCompanySearchResponse,
  sampleHiringPipelineResponse,
  sampleJobAssignedCandidatesResponse,
  sampleJobDetailResponse,
  sampleJobSearchResponse,
  sampleMeetingSearchResponse,
  sampleNoteSearchResponse,
  sampleSearchResponse,
  sampleTaskSearchResponse,
} from "./fixtures.js";

describe("Recruit CRM MCP tools", () => {
  it("lists tools and returns structured metadata, search, and detail results", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/custom-fields/candidates")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleCandidateCustomFieldsResponse),
        };
      }

      if (request.url.pathname.endsWith("/candidates/search")) {
        if (request.jsonBody) {
          expect(request.url.searchParams.get("first_name")).toBe("Sample");
          expect(request.jsonBody).toEqual({
            custom_fields: [
              {
                field_id: 34,
                filter_type: "equals",
                filter_value: "Python",
              },
            ],
          });
        }

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleSearchResponse),
        };
      }

      if (request.url.pathname.endsWith("/candidates/010011")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify({
            ...sampleCandidateDetailResponse,
            slug: "010011",
          }),
        };
      }

      if (request.url.pathname.endsWith("/jobs/job-detail-sample-001")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleJobDetailResponse),
        };
      }

      if (request.url.pathname.endsWith("/jobs/job-sample-001/assigned-candidates")) {
        expect(request.url.searchParams.get("page")).toBe("1");
        expect(request.url.searchParams.get("limit")).toBe("100");
        expect(request.url.searchParams.get("status_id")).toBe("8");

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleJobAssignedCandidatesResponse),
        };
      }

      if (request.url.pathname.endsWith("/jobs/search")) {
        expect(request.url.searchParams.get("job_slug")).toBe("job-sample-001");
        expect(request.url.searchParams.get("limit")).toBe("10");

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleJobSearchResponse),
        };
      }

      if (request.url.pathname.endsWith("/hiring-pipeline")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleHiringPipelineResponse),
        };
      }

      if (request.url.pathname.endsWith("/companies/search")) {
        expect(request.url.searchParams.get("company_slug")).toBe("company-sample-001");

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleCompanySearchResponse),
        };
      }

      if (request.url.pathname.endsWith("/candidates/010011/history")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleCandidateJobAssignmentHiringStageHistoryResponse),
        };
      }

      if (request.url.pathname.endsWith("/tasks/search")) {
        expect(request.url.searchParams.get("related_to")).toBe("candidate-related-sample-001");
        expect(request.url.searchParams.get("related_to_type")).toBe("candidate");

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleTaskSearchResponse),
        };
      }

      if (request.url.pathname.endsWith("/meetings/search")) {
        expect(request.url.searchParams.get("related_to")).toBe("candidate-related-sample-001");
        expect(request.url.searchParams.get("related_to_type")).toBe("candidate");

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleMeetingSearchResponse),
        };
      }

      if (request.url.pathname.endsWith("/notes/search")) {
        expect(request.url.searchParams.get("related_to")).toBe("candidate-related-sample-001");
        expect(request.url.searchParams.get("related_to_type")).toBe("candidate");

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleNoteSearchResponse),
        };
      }

      if (request.url.pathname.endsWith("/call-logs/search")) {
        expect(request.url.searchParams.get("related_to")).toBe("candidate-related-sample-001");
        expect(request.url.searchParams.get("related_to_type")).toBe("candidate");

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleCallLogSearchResponse),
        };
      }

      throw new Error(`Unexpected request: ${request.url.toString()}`);
    });

    const server = createRecruitCrmServer({
      config: {
        apiToken: "test-token",
        baseUrl: "https://api.recruitcrm.io/v1",
        timeoutMs: 10_000,
        debugSchemaErrors: false,
      },
      transport: transportMock,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual([
      "search_candidates",
      "list_candidates",
      "search_jobs",
      "list_jobs",
      "search_companies",
      "list_companies",
      "search_tasks",
      "search_meetings",
      "search_notes",
      "search_call_logs",
      "get_candidate_details",
      "get_job_details",
      "get_job_assigned_candidates",
      "list_candidate_hiring_stages",
      "get_candidate_job_assignment_hiring_stage_history",
      "list_candidate_custom_fields",
      "get_candidate_custom_field_details",
    ]);

    const fieldsResult = await client.callTool({
      name: "list_candidate_custom_fields",
      arguments: {},
    });

    expect(fieldsResult.structuredContent).toMatchObject({ returned_count: 4 });
    expect((fieldsResult.structuredContent as { fields: Array<Record<string, unknown>> }).fields[0]).toMatchObject({
      field_id: 34,
      field_name: "Tech Stack",
      searchable: true,
    });

    const fieldDetailResult = await client.callTool({
      name: "get_candidate_custom_field_details",
      arguments: {
        field_id: 34,
      },
    });

    expect(fieldDetailResult.structuredContent).toMatchObject({
      field_id: 34,
      field_name: "Tech Stack",
      option_values: ["Python", "Java", "XYZ"],
    });

    const searchResult = await client.callTool({
      name: "search_candidates",
      arguments: {
        first_name: "Sample",
        custom_fields: [
          {
            field_id: 34,
            filter_type: "equals",
            filter_value: "Python",
          },
        ],
      },
    });

    expect(searchResult.structuredContent).toMatchObject({
      page: 2,
      returned_count: 1,
      has_more: true,
      candidates: [
        {
          slug: "010011",
          first_name: "Sample",
          last_name: "Candidate",
          position: "Software Developer",
          current_organization: "Acme Labs",
          current_status: "Employed",
          city: "Example City",
          updated_on: "2020-06-29T05:36:22.000000Z",
        },
      ],
    });

    const detailResult = await client.callTool({
      name: "get_candidate_details",
      arguments: {
        candidate_slug: "010011",
      },
    });

    const jobResult = await client.callTool({
      name: "search_jobs",
      arguments: {
        job_slug: "job-sample-001",
        limit: 10,
      },
    });

    const companyResult = await client.callTool({
      name: "search_companies",
      arguments: {
        company_slug: "company-sample-001",
      },
    });

    const jobDetailResult = await client.callTool({
      name: "get_job_details",
      arguments: {
        job_slug: "job-detail-sample-001",
      },
    });

    const hiringStagesResult = await client.callTool({
      name: "list_candidate_hiring_stages",
      arguments: {},
    });

    const placedStageId = (
      (hiringStagesResult.structuredContent as { stages: Array<{ stage_id: number | null; label: string | null }> }).stages
        .find((stage) => stage.label === "Placed")
    )?.stage_id;

    expect(placedStageId).toBe(8);

    const assignedCandidatesResult = await client.callTool({
      name: "get_job_assigned_candidates",
      arguments: {
        job_slug: "job-sample-001",
        status_id: String(placedStageId),
      },
    });

    const historyResult = await client.callTool({
      name: "get_candidate_job_assignment_hiring_stage_history",
      arguments: {
        candidate_slug: "010011",
      },
    });

    const taskResult = await client.callTool({
      name: "search_tasks",
      arguments: {
        related_to: "candidate-related-sample-001",
        related_to_type: "candidate",
      },
    });

    const meetingResult = await client.callTool({
      name: "search_meetings",
      arguments: {
        related_to: "candidate-related-sample-001",
        related_to_type: "candidate",
      },
    });

    const noteResult = await client.callTool({
      name: "search_notes",
      arguments: {
        related_to: "candidate-related-sample-001",
        related_to_type: "candidate",
      },
    });

    const callLogResult = await client.callTool({
      name: "search_call_logs",
      arguments: {
        related_to: "candidate-related-sample-001",
        related_to_type: "candidate",
      },
    });

    expect(detailResult.structuredContent).toMatchObject({
      slug: "010011",
      first_name: "Sample",
      last_name: "Profile",
      current_salary: 0,
      salary_type: {
        id: "2",
        label: "Annual Salary",
      },
    });
    expect((detailResult.structuredContent as { custom_fields: Array<Record<string, unknown>> }).custom_fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_id: 34,
          field_name: "Tech Stack",
        }),
      ]),
    );
    expect((detailResult.structuredContent as { work_history: Array<Record<string, unknown>> }).work_history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Founder",
          work_company_name: "Acme Foods",
        }),
      ]),
    );
    expect(
      (detailResult.structuredContent as { education_history: Array<Record<string, unknown>> }).education_history,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          institute_name: "Example Institute of Technology",
        }),
      ]),
    );
    expect(jobResult.structuredContent).toMatchObject({
      page: 1,
      returned_count: 1,
      has_more: true,
      jobs: [
        {
          id: 313,
          slug: "job-sample-001",
          name: "Operations Analyst",
          company_slug: "company-sample-001",
          contact_slug: "contact-sample-001",
          secondary_contact_slugs: ["contact-sample-002"],
          job_status: {
            id: 1,
            label: "Open",
          },
          note_for_candidates: "Please bring sample documents.",
          number_of_openings: 2,
          minimum_experience: 2,
          maximum_experience: 3,
          min_annual_salary: 90000,
          max_annual_salary: 110000,
          pay_rate: 80,
          bill_rate: 100,
          salary_type: "Annual Salary",
          job_type: "Contract",
          job_category: "Operations",
          job_skill: "Data Analysis, Project Management",
          city: "Example City",
          locality: "Downtown",
          state: "Example State",
          country: "Example Country",
          enable_job_application_form: true,
          application_form_url: "https://recruitcrm.io/apply/job-sample-001",
          owner: 8772,
          created_on: "2026-04-01T09:15:00.000000Z",
          updated_on: "2026-04-07T10:30:00.000000Z",
        },
      ],
    });
    expect((jobResult.structuredContent as { jobs: Array<Record<string, unknown>> }).jobs[0]).not.toHaveProperty(
      "job_status_comment",
    );
    expect((jobResult.structuredContent as { jobs: Array<Record<string, unknown>> }).jobs[0]).not.toHaveProperty(
      "contact_email",
    );
    expect((jobResult.structuredContent as { jobs: Array<Record<string, unknown>> }).jobs[0]).not.toHaveProperty(
      "custom_fields",
    );
    expect(companyResult.structuredContent).toMatchObject({
      page: 1,
      returned_count: 1,
      has_more: true,
      companies: [
        {
          id: 403,
          slug: "company-sample-001",
          company_name: "Example Holdings",
          website: "https://www.example-holdings.test",
          city: null,
          locality: null,
          state: "Example State",
          country: "Example Country",
          postal_code: "10001",
          address: "123 Example Street",
          owner: 3735,
          contact_slugs: ["contact-sample-001", "contact-sample-002"],
          is_child_company: false,
          is_parent_company: true,
          child_company_slugs: ["company-sample-child-001"],
          parent_company_slug: null,
          marked_as_off_limit: true,
          off_limit: {
            status_id: 12,
            status_label: "Off Limits",
            reason: "Existing exclusive agreement",
            end_date: "2026-12-31",
          },
          created_on: "2020-06-03T17:05:48.000000Z",
          updated_on: "2026-04-08T08:18:32.000000Z",
        },
      ],
    });
    expect(
      (companyResult.structuredContent as { companies: Array<Record<string, unknown>> }).companies[0],
    ).not.toHaveProperty("custom_fields");
    expect(
      (companyResult.structuredContent as { companies: Array<Record<string, unknown>> }).companies[0],
    ).not.toHaveProperty("resource_url");
    expect(
      (companyResult.structuredContent as { companies: Array<Record<string, unknown>> }).companies[0],
    ).not.toHaveProperty("logo");
    expect(jobDetailResult.structuredContent).toMatchObject({
      slug: "job-detail-sample-001",
      name: "Operations Analyst",
      company_slug: "company-sample-001",
      contact_slug: "contact-sample-001",
      salary_type: {
        id: 2,
        label: "Annual Salary",
      },
      resource_url: "https://app.recruitcrm.io/job/job-detail-sample-001",
      application_form_url: "https://recruitcrm.io/apply/job-detail-sample-001",
    });
    expect(
      (jobDetailResult.structuredContent as { custom_fields: Array<Record<string, unknown>> }).custom_fields,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_id: 1,
          field_name: "Region",
        }),
      ]),
    );
    expect(hiringStagesResult.structuredContent).toEqual({
      returned_count: 3,
      stages: [
        {
          stage_id: 1,
          label: "Assigned",
        },
        {
          stage_id: 8,
          label: "Placed",
        },
        {
          stage_id: 10,
          label: "Applied",
        },
      ],
    });
    expect(
      (hiringStagesResult.structuredContent as { stages: Array<Record<string, unknown>> }).stages[0],
    ).not.toHaveProperty("status_id");
    expect(assignedCandidatesResult.structuredContent).toEqual({
      job_slug: "job-sample-001",
      page: 1,
      returned_count: 1,
      has_more: true,
      assigned_candidates: [
        {
          candidate_slug: "candidate-assigned-sample-001",
          first_name: "Michael",
          last_name: "Scott",
          position: "Regional Manager",
          current_organization: "Dunder Mifflin",
          current_status: "Employed",
          city: "Scranton",
          country: "United States",
          updated_on: "2026-02-21T10:00:00.000000Z",
          stage_date: "2026-02-20T09:08:45.000000Z",
          status_id: 8,
          status_label: "Placed",
        },
      ],
    });
    expect(
      (assignedCandidatesResult.structuredContent as { assigned_candidates: Array<Record<string, unknown>> })
        .assigned_candidates[0],
    ).not.toHaveProperty("email");
    expect(
      (assignedCandidatesResult.structuredContent as { assigned_candidates: Array<Record<string, unknown>> })
        .assigned_candidates[0],
    ).not.toHaveProperty("contact_number");
    expect(
      (assignedCandidatesResult.structuredContent as { assigned_candidates: Array<Record<string, unknown>> })
        .assigned_candidates[0],
    ).not.toHaveProperty("resource_url");
    expect(historyResult.structuredContent).toMatchObject({
      candidate_slug: "010011",
      returned_count: 3,
    });
    expect(
      (historyResult.structuredContent as { history: Array<Record<string, unknown>> }).history,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_slug: "16540132164740000453lqF",
          job_name: "Chief of Staff",
          company_slug: "7063184",
          company_name: "Google",
          job_status_id: 1,
          job_status_label: "Open",
          candidate_status_id: 231169,
          candidate_status: "1st Interview",
          remark: "great profile",
          updated_by: 0,
          updated_on: "2025-02-27T14:53:15.000000Z",
        }),
        expect.objectContaining({
          job_slug: "17331412929920063396kmG",
          job_name: "Pool for XYZ client",
          company_slug: "16868200767130002890hdW",
          company_name: "Apple",
          job_status_id: 1,
          job_status_label: "Open",
          candidate_status_id: 503354,
          candidate_status: "Phone Screen",
          remark: null,
          updated_by: 453,
          updated_on: "2025-02-28T13:26:04.000000Z",
        }),
      ]),
    );
    expect(taskResult.structuredContent).toMatchObject({
      page: 1,
      returned_count: 1,
      has_more: true,
      tasks: [
        {
          id: 2572223,
          related_to: "candidate-related-sample-001",
          task_type: null,
          related_to_type: "candidate",
          related_to_name: "Sample Candidate",
          related: {
            first_name: "Sample",
            last_name: "Candidate",
          },
          description: null,
          title: "Follow up",
          status: 1,
          start_date: "2021-11-19T08:30:00.000000Z",
          reminder_date: "2021-11-19T08:00:00.000000Z",
          reminder: 30,
          owner: 2890,
          created_on: "2021-11-12T12:02:45.000000Z",
          updated_on: "2022-11-16T18:33:57.000000Z",
          created_by: 2890,
          updated_by: 453,
        },
      ],
    });
    expect((taskResult.structuredContent as { tasks: Array<Record<string, unknown>> }).tasks[0]).not.toHaveProperty(
      "associated_candidates",
    );
    expect((taskResult.structuredContent as { tasks: Array<Record<string, unknown>> }).tasks[0]).not.toHaveProperty(
      "collaborators",
    );
    expect(meetingResult.structuredContent).toMatchObject({
      page: 1,
      returned_count: 1,
      has_more: true,
      meetings: [
        {
          id: 47202185,
          title: "Sample Candidate/Product Manager (Acme Labs)",
          meeting_type: [
            {
              id: 20707,
              label: "Candidate Interview with Client",
            },
          ],
          description: "<p>Test</p>",
          address: "https://meet.example.com/sample-meeting",
          reminder: 30,
          start_date: "2025-10-31T09:30:00.000000Z",
          end_date: "2025-10-31T10:00:00.000000Z",
          related_to: "candidate-related-sample-001",
          related_to_type: "candidate",
          related: {
            first_name: "Sample",
            last_name: "Candidate",
          },
          do_not_send_calendar_invites: true,
          status: 0,
          reminder_date: "2025-10-31T09:00:00.000000Z",
          all_day: true,
          owner: 69232,
          created_on: "2025-10-24T07:45:45.000000Z",
          updated_on: "2025-10-31T08:50:30.000000Z",
          created_by: 69232,
          updated_by: 69232,
        },
      ],
    });
    expect(
      (meetingResult.structuredContent as { meetings: Array<Record<string, unknown>> }).meetings[0],
    ).not.toHaveProperty("attendees");
    expect(
      (meetingResult.structuredContent as { meetings: Array<Record<string, unknown>> }).meetings[0],
    ).not.toHaveProperty("associated_candidates");
    expect(noteResult.structuredContent).toMatchObject({
      page: 1,
      returned_count: 1,
      has_more: true,
      notes: [
        {
          id: 24667666,
          note_type: [
            {
              id: 205989,
              label: "Candidate Interaction",
            },
          ],
          description: "Sample note content",
          related_to: "candidate-related-sample-001",
          related_to_type: "candidate",
          related: {
            first_name: "Sample",
            last_name: "Candidate",
          },
          created_on: "2024-07-30T11:10:30.000000Z",
          updated_on: "2024-07-30T11:10:30.000000Z",
          created_by: 66960,
          updated_by: 66960,
        },
      ],
    });
    expect((noteResult.structuredContent as { notes: Array<Record<string, unknown>> }).notes[0]).not.toHaveProperty(
      "associated_candidates",
    );
    expect(callLogResult.structuredContent).toMatchObject({
      page: 1,
      returned_count: 1,
      has_more: true,
      call_logs: [
        {
          id: 498645,
          call_type: "CALL_OUTGOING",
          custom_call_type: [
            {
              id: 2,
              label: "Pitch Attempt",
            },
          ],
          call_started_on: "2022-03-10T17:16:43.000000Z",
          contact_number: "+1-555-0101",
          call_notes: null,
          related_to: "candidate-related-sample-001",
          related_to_type: "candidate",
          related: {
            first_name: "Sample",
            last_name: "Candidate",
          },
          duration: 17,
          created_on: "2022-03-10T17:16:43.000000Z",
          updated_on: "2022-03-10T17:17:20.000000Z",
          created_by: 8772,
          updated_by: 8772,
        },
      ],
    });
    expect(
      (callLogResult.structuredContent as { call_logs: Array<Record<string, unknown>> }).call_logs[0],
    ).not.toHaveProperty("associated_candidates");

    expect(transportMock).toHaveBeenCalledTimes(15);

    await client.close();
    await server.close();
  });

  it("maps a direct detail 404 to candidate not found", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/candidates/missing")) {
        return {
          statusCode: 404,
          bodyText: JSON.stringify({ message: "Not found" }),
        };
      }

      throw new Error(`Unexpected request: ${request.url.toString()}`);
    });

    const server = createRecruitCrmServer({
      config: {
        apiToken: "test-token",
        baseUrl: "https://api.recruitcrm.io/v1",
        timeoutMs: 10_000,
        debugSchemaErrors: false,
      },
      transport: transportMock,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    await expect(
      client.callTool({
        name: "get_candidate_details",
        arguments: {
          candidate_slug: "missing",
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: expect.stringMatching(/^Candidate not found\./),
        },
      ],
    });

    await client.close();
    await server.close();
  });

  it("maps a direct job detail 404 to job not found", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/jobs/missing-job")) {
        return {
          statusCode: 404,
          bodyText: JSON.stringify({ message: "Not found" }),
        };
      }

      throw new Error(`Unexpected request: ${request.url.toString()}`);
    });

    const server = createRecruitCrmServer({
      config: {
        apiToken: "test-token",
        baseUrl: "https://api.recruitcrm.io/v1",
        timeoutMs: 10_000,
        debugSchemaErrors: false,
      },
      transport: transportMock,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    await expect(
      client.callTool({
        name: "get_job_details",
        arguments: {
          job_slug: "missing-job",
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: expect.stringMatching(/^Job not found\./),
        },
      ],
    });

    await client.close();
    await server.close();
  });

  it("validates related_to and related_to_type together for task search", async () => {
    const transportMock = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => {
      throw new Error("Task search should fail before making an API request.");
    });

    const server = createRecruitCrmServer({
      config: {
        apiToken: "test-token",
        baseUrl: "https://api.recruitcrm.io/v1",
        timeoutMs: 10_000,
        debugSchemaErrors: false,
      },
      transport: transportMock,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    await expect(
      client.callTool({
        name: "search_tasks",
        arguments: {
          related_to: "candidate-related-sample-001",
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: "related_to and related_to_type must be provided together.",
        },
      ],
    });

    expect(transportMock).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });

  it("validates related_to and related_to_type together for meeting search", async () => {
    const transportMock = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => {
      throw new Error("Meeting search should fail before making an API request.");
    });

    const server = createRecruitCrmServer({
      config: {
        apiToken: "test-token",
        baseUrl: "https://api.recruitcrm.io/v1",
        timeoutMs: 10_000,
        debugSchemaErrors: false,
      },
      transport: transportMock,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    await expect(
      client.callTool({
        name: "search_meetings",
        arguments: {
          related_to: "candidate-related-sample-001",
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: "related_to and related_to_type must be provided together.",
        },
      ],
    });

    expect(transportMock).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });

  it("validates related_to and related_to_type together for note search", async () => {
    const transportMock = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => {
      throw new Error("Note search should fail before making an API request.");
    });

    const server = createRecruitCrmServer({
      config: {
        apiToken: "test-token",
        baseUrl: "https://api.recruitcrm.io/v1",
        timeoutMs: 10_000,
        debugSchemaErrors: false,
      },
      transport: transportMock,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    await expect(
      client.callTool({
        name: "search_notes",
        arguments: {
          related_to: "candidate-related-sample-001",
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: "related_to and related_to_type must be provided together.",
        },
      ],
    });

    expect(transportMock).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });

  it("validates related_to and related_to_type together for call log search", async () => {
    const transportMock = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => {
      throw new Error("Call log search should fail before making an API request.");
    });

    const server = createRecruitCrmServer({
      config: {
        apiToken: "test-token",
        baseUrl: "https://api.recruitcrm.io/v1",
        timeoutMs: 10_000,
        debugSchemaErrors: false,
      },
      transport: transportMock,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    await expect(
      client.callTool({
        name: "search_call_logs",
        arguments: {
          related_to: "candidate-related-sample-001",
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: "related_to and related_to_type must be provided together.",
        },
      ],
    });

    expect(transportMock).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });

  it("rejects deal related_to_type for call log search before making an API request", async () => {
    const transportMock = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => {
      throw new Error("Call log search should fail before making an API request.");
    });

    const server = createRecruitCrmServer({
      config: {
        apiToken: "test-token",
        baseUrl: "https://api.recruitcrm.io/v1",
        timeoutMs: 10_000,
        debugSchemaErrors: false,
      },
      transport: transportMock,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    await expect(
      client.callTool({
        name: "search_call_logs",
        arguments: {
          related_to: "deal-related-sample-001",
          related_to_type: "deal",
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: "Recruit CRM call log search does not support related_to_type=job or related_to_type=deal.",
        },
      ],
    });

    expect(transportMock).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });

  it("rejects job related_to_type for call log search before making an API request", async () => {
    const transportMock = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => {
      throw new Error("Call log search should fail before making an API request.");
    });

    const server = createRecruitCrmServer({
      config: {
        apiToken: "test-token",
        baseUrl: "https://api.recruitcrm.io/v1",
        timeoutMs: 10_000,
        debugSchemaErrors: false,
      },
      transport: transportMock,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    await expect(
      client.callTool({
        name: "search_call_logs",
        arguments: {
          related_to: "job-related-sample-001",
          related_to_type: "job",
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: "Recruit CRM call log search does not support related_to_type=job or related_to_type=deal.",
        },
      ],
    });

    expect(transportMock).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });

  it("returns an empty task list when the API responds with an empty array", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/tasks/search")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify([]),
        };
      }

      throw new Error(`Unexpected request: ${request.url.toString()}`);
    });

    const server = createRecruitCrmServer({
      config: {
        apiToken: "test-token",
        baseUrl: "https://api.recruitcrm.io/v1",
        timeoutMs: 10_000,
        debugSchemaErrors: false,
      },
      transport: transportMock,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "search_tasks",
      arguments: {},
    });

    expect(result.structuredContent).toEqual({
      page: 1,
      returned_count: 0,
      has_more: false,
      tasks: [],
    });

    await client.close();
    await server.close();
  });

  it("normalizes upper-bound-only task date filters into full ranges before calling the API", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/tasks/search")) {
        const createdFrom = request.url.searchParams.get("created_from");
        const createdTo = request.url.searchParams.get("created_to");
        const startingFrom = request.url.searchParams.get("starting_from");
        const startingTo = request.url.searchParams.get("starting_to");
        const updatedFrom = request.url.searchParams.get("updated_from");
        const updatedTo = request.url.searchParams.get("updated_to");

        if (createdTo) {
          expect(createdFrom).toBe("1970-01-01");
          expect(createdTo).toBe("2026-04-08");
        }

        if (startingTo) {
          expect(startingFrom).toBe("1970-01-01");
          expect(startingTo).toBe("2026-04-08");
        }

        if (updatedTo) {
          expect(updatedFrom).toBe("1970-01-01");
          expect(updatedTo).toBe("2026-04-08");
        }

        return {
          statusCode: 200,
          bodyText: JSON.stringify([]),
        };
      }

      throw new Error(`Unexpected request: ${request.url.toString()}`);
    });

    const server = createRecruitCrmServer({
      config: {
        apiToken: "test-token",
        baseUrl: "https://api.recruitcrm.io/v1",
        timeoutMs: 10_000,
        debugSchemaErrors: false,
      },
      transport: transportMock,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    await expect(
      client.callTool({
        name: "search_tasks",
        arguments: {
          created_to: "2026-04-08",
        },
      }),
    ).resolves.toMatchObject({
      structuredContent: {
        page: 1,
        returned_count: 0,
        has_more: false,
        tasks: [],
      },
    });

    await expect(
      client.callTool({
        name: "search_tasks",
        arguments: {
          starting_to: "2026-04-08",
        },
      }),
    ).resolves.toMatchObject({
      structuredContent: {
        page: 1,
        returned_count: 0,
        has_more: false,
        tasks: [],
      },
    });

    await expect(
      client.callTool({
        name: "search_tasks",
        arguments: {
          updated_to: "2026-04-08",
        },
      }),
    ).resolves.toMatchObject({
      structuredContent: {
        page: 1,
        returned_count: 0,
        has_more: false,
        tasks: [],
      },
    });

    expect(transportMock).toHaveBeenCalledTimes(3);

    await client.close();
    await server.close();
  });

  it("returns a clearer error when Recruit CRM fails updated date task searches", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/tasks/search")) {
        return {
          statusCode: 500,
          bodyText: "Internal Server Error!",
        };
      }

      throw new Error(`Unexpected request: ${request.url.toString()}`);
    });

    const server = createRecruitCrmServer({
      config: {
        apiToken: "test-token",
        baseUrl: "https://api.recruitcrm.io/v1",
        timeoutMs: 10_000,
        debugSchemaErrors: false,
      },
      transport: transportMock,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    await expect(
      client.callTool({
        name: "search_tasks",
        arguments: {
          updated_from: "2026-03-01",
          updated_to: "2026-04-08",
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: "Recruit CRM task search failed for this updated-on date range. Try a narrower updated_from/updated_to range.",
        },
      ],
    });

    await client.close();
    await server.close();
  });

  it("returns clearer errors when Recruit CRM fails created-on and due-date task ranges", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/tasks/search")) {
        return {
          statusCode: 500,
          bodyText: "Internal Server Error!",
        };
      }

      throw new Error(`Unexpected request: ${request.url.toString()}`);
    });

    const server = createRecruitCrmServer({
      config: {
        apiToken: "test-token",
        baseUrl: "https://api.recruitcrm.io/v1",
        timeoutMs: 10_000,
        debugSchemaErrors: false,
      },
      transport: transportMock,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    await expect(
      client.callTool({
        name: "search_tasks",
        arguments: {
          created_to: "2026-04-08",
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: "Recruit CRM task search failed for this created-on date range. Try adding created_from or narrowing the created_from/created_to window.",
        },
      ],
    });

    await expect(
      client.callTool({
        name: "search_tasks",
        arguments: {
          starting_to: "2026-04-08",
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: "Recruit CRM task search failed for this due-date range. Try adding starting_from or narrowing the starting_from/starting_to window.",
        },
      ],
    });

    await client.close();
    await server.close();
  });

  it("forwards custom-field filters that were previously blocked by the hardcoded matrix", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/custom-fields/candidates")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleCandidateCustomFieldsResponse),
        };
      }

      if (request.url.pathname.endsWith("/candidates/search")) {
        expect(request.jsonBody).toEqual({
          custom_fields: [
            {
              field_id: 55,
              filter_type: "equals",
              filter_value: "Acme",
            },
          ],
        });

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleSearchResponse),
        };
      }

      throw new Error(`Unexpected request: ${request.url.toString()}`);
    });

    const server = createRecruitCrmServer({
      config: {
        apiToken: "test-token",
        baseUrl: "https://api.recruitcrm.io/v1",
        timeoutMs: 10_000,
        debugSchemaErrors: false,
      },
      transport: transportMock,
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "search_candidates",
      arguments: {
        custom_fields: [
          {
            field_id: 55,
            filter_type: "equals",
            filter_value: "Acme",
          },
        ],
      },
    });

    expect(result.structuredContent).toMatchObject({
      returned_count: 1,
      candidates: [
        {
          slug: "010011",
        },
      ],
    });
    expect(transportMock).toHaveBeenCalledTimes(2);

    await client.close();
    await server.close();
  });
});
