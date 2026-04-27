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
  sampleCompanyDetailResponse,
  sampleCompanySearchResponse,
  sampleContactDetailResponse,
  sampleContactSearchResponse,
  sampleCreatedHotlistResponse,
  sampleCreatedNoteResponse,
  sampleCreatedTaskResponse,
  sampleHiringPipelineResponse,
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
} from "./fixtures.js";

describe("Recruit CRM MCP tools", () => {
  it("lists tools and returns structured metadata, search, and detail results", async () => {
    const addedHotlistSlugs: string[] = [];
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

      if (request.url.pathname.endsWith("/companies/company-detail-sample-001")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleCompanyDetailResponse),
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

      if (request.url.pathname.endsWith("/contacts/search")) {
        expect(request.url.searchParams.get("first_name")).toBe("Pam");
        expect(request.url.searchParams.get("sort_by")).toBe("updatedon");
        expect(request.url.searchParams.get("sort_order")).toBe("desc");

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleContactSearchResponse),
        };
      }

      if (request.url.pathname.endsWith("/contacts") && !request.url.pathname.endsWith("/contacts/search")) {
        expect(request.url.searchParams.get("page")).toBe("1");
        expect(request.url.searchParams.get("limit")).toBe("100");
        expect(request.url.searchParams.get("sort_by")).toBe("updatedon");
        expect(request.url.searchParams.get("sort_order")).toBe("desc");

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleContactSearchResponse),
        };
      }

      if (request.url.pathname.endsWith("/contacts/contact-detail-sample-001")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleContactDetailResponse),
        };
      }

      if (request.url.pathname.endsWith("/hotlists/search")) {
        expect(request.url.searchParams.get("page")).toBe("1");
        expect(request.url.searchParams.get("related_to_type")).toBe("candidate");
        expect(request.url.searchParams.get("name")).toBe("Product");
        expect(request.url.searchParams.get("shared")).toBe("1");

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleHotlistSearchResponse),
        };
      }

      if (request.url.pathname.endsWith("/hotlists")) {
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
      }

      if (request.url.pathname.endsWith("/hotlists/702/add-record")) {
        expect(request.method).toBe("POST");
        expect(request.jsonBody).toEqual({
          related: expect.any(String),
        });
        addedHotlistSlugs.push(String((request.jsonBody as { related: string }).related));

        return {
          statusCode: 204,
          bodyText: "",
        };
      }

      if (request.url.pathname.endsWith("/users")) {
        const expand = request.url.searchParams.get("expand");
        if (expand !== null) {
          expect(expand).toBe("team");
        }

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleUserListResponse),
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

      if (request.url.pathname.endsWith("/task-types")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleTaskTypeListResponse),
        };
      }

      if (request.url.pathname.endsWith("/tasks")) {
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
          associated_candidates: "candidate-related-sample-001",
        });

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleCreatedTaskResponse),
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

      if (request.url.pathname.endsWith("/note-types")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleNoteTypeListResponse),
        };
      }

      if (request.url.pathname.endsWith("/notes")) {
        expect(request.method).toBe("POST");
        expect(request.jsonBody).toEqual({
          note_type_id: 108871,
          description: "<p><strong>Rich text</strong></p>",
          related_to: "candidate-related-sample-001",
          related_to_type: "candidate",
          created_by: 453,
          associated_candidates: "candidate-related-sample-001",
        });

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleCreatedNoteResponse),
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
      "search_contacts",
      "list_contacts",
      "list_users",
      "search_hotlists",
      "create_hotlist",
      "add_records_to_hotlist",
      "search_tasks",
      "list_task_types",
      "create_task",
      "search_meetings",
      "search_notes",
      "list_note_types",
      "create_note",
      "search_call_logs",
      "get_candidate_details",
      "get_job_details",
      "get_company_details",
      "get_contact_details",
      "get_job_assigned_candidates",
      "list_candidate_hiring_stages",
      "list_job_statuses",
      "get_candidate_job_assignment_hiring_stage_history",
      "list_candidate_custom_fields",
      "get_candidate_custom_field_details",
      "analyze_job_pipeline",
    ]);
    const toolDescription = (name: string) => tools.tools.find((tool) => tool.name === name)?.description ?? "";
    expect(toolDescription("search_jobs")).toContain("'my'");
    expect(toolDescription("search_jobs")).toContain("owner_id");
    expect(toolDescription("list_jobs")).toContain("'my jobs'");
    expect(toolDescription("list_jobs")).toContain("search_jobs");
    expect(toolDescription("search_notes")).toContain("does not support owner filters");
    expect(toolDescription("search_call_logs")).toContain("does not support owner filters");
    expect(tools.tools.find((tool) => tool.name === "create_hotlist")).toMatchObject({
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    });
    expect(tools.tools.find((tool) => tool.name === "add_records_to_hotlist")).toMatchObject({
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    });
    expect(toolDescription("create_task")).toContain("list_task_types");
    expect(toolDescription("create_task")).toContain("owner_id");
    expect(toolDescription("create_task")).toContain("created_by");
    expect(tools.tools.find((tool) => tool.name === "list_task_types")).toMatchObject({
      annotations: {
        readOnlyHint: true,
      },
    });
    expect(tools.tools.find((tool) => tool.name === "create_task")).toMatchObject({
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    });
    expect(toolDescription("create_note")).toContain("list_note_types");
    expect(toolDescription("create_note")).toContain("created_by");
    expect(tools.tools.find((tool) => tool.name === "list_note_types")).toMatchObject({
      annotations: {
        readOnlyHint: true,
      },
    });
    expect(tools.tools.find((tool) => tool.name === "create_note")).toMatchObject({
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    });
    expect(tools.tools.find((tool) => tool.name === "list_users")).toMatchObject({
      annotations: {
        readOnlyHint: true,
      },
    });

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
        candidate_slugs: ["010011"],
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

    const companyDetailResult = await client.callTool({
      name: "get_company_details",
      arguments: {
        company_slugs: ["company-detail-sample-001"],
      },
    });

    const searchContactsResult = await client.callTool({
      name: "search_contacts",
      arguments: {
        first_name: "Pam",
        include_contact_info: true,
      },
    });

    const listContactsResult = await client.callTool({
      name: "list_contacts",
      arguments: {},
    });

    const contactDetailResult = await client.callTool({
      name: "get_contact_details",
      arguments: {
        contact_slugs: ["contact-detail-sample-001"],
      },
    });

    const listUsersResult = await client.callTool({
      name: "list_users",
      arguments: {},
    });

    const listUsersExpandedResult = await client.callTool({
      name: "list_users",
      arguments: {
        include_teams: true,
        include_contact_info: true,
      },
    });

    const searchHotlistsResult = await client.callTool({
      name: "search_hotlists",
      arguments: {
        related_to_type: "candidate",
        name: "Product",
        shared: 1,
      },
    });

    const createHotlistResult = await client.callTool({
      name: "create_hotlist",
      arguments: {
        name: "Product Leaders",
        related_to_type: "candidate",
        shared: 0,
        created_by: 453,
      },
    });

    const addRecordsToHotlistResult = await client.callTool({
      name: "add_records_to_hotlist",
      arguments: {
        hotlist_id: 702,
        related_slugs: [
          "candidate-related-sample-001",
          "candidate-related-sample-002",
          "candidate-related-sample-001",
        ],
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

    const taskTypesResult = await client.callTool({
      name: "list_task_types",
      arguments: {},
    });

    const createTaskResult = await client.callTool({
      name: "create_task",
      arguments: {
        task_type_id: 332,
        title: "Follow up call",
        description: "<p><strong>Rich task</strong></p>",
        reminder: 30,
        start_date: "2026-04-28T04:30:00.000000Z",
        owner_id: 453,
        created_by: 453,
        related_to: "candidate-related-sample-001",
        related_to_type: "candidate",
        associated_candidates: ["candidate-related-sample-001"],
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

    const noteTypesResult = await client.callTool({
      name: "list_note_types",
      arguments: {},
    });

    const createNoteResult = await client.callTool({
      name: "create_note",
      arguments: {
        note_type_id: 108871,
        description: "<p><strong>Rich text</strong></p>",
        related_to: "candidate-related-sample-001",
        related_to_type: "candidate",
        created_by: 453,
        associated_candidates: ["candidate-related-sample-001"],
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
      requested_count: 1,
      successful_count: 1,
      failed_count: 0,
      errors: [],
      candidates: [
        expect.objectContaining({
          slug: "010011",
          first_name: "Sample",
          last_name: "Profile",
          current_salary: 0,
          salary_type: {
            id: "2",
            label: "Annual Salary",
          },
        }),
      ],
    });
    expect(
      (detailResult.structuredContent as { candidates: Array<Record<string, unknown>> }).candidates[0]?.custom_fields,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_id: 34,
          field_name: "Tech Stack",
        }),
      ]),
    );
    expect(
      (detailResult.structuredContent as { candidates: Array<Record<string, unknown>> }).candidates[0]?.work_history,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Founder",
          work_company_name: "Acme Foods",
        }),
      ]),
    );
    expect(
      (detailResult.structuredContent as { candidates: Array<Record<string, unknown>> }).candidates[0]
        ?.education_history,
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
    expect(companyDetailResult.structuredContent).toMatchObject({
      requested_count: 1,
      successful_count: 1,
      failed_count: 0,
      errors: [],
      companies: [
        expect.objectContaining({
          slug: "company-detail-sample-001",
          company_name: "Example Holdings",
          website: "https://www.example-holdings.test",
          owner: 3735,
          resource_url: "https://app.recruitcrm.io/company/company-detail-sample-001",
          contact_slug: ["contact-sample-001", "", null, "contact-sample-002"],
          is_child_company: "No",
          is_parent_company: "Yes",
        }),
      ],
    });
    expect(
      (companyDetailResult.structuredContent as { companies: Array<Record<string, unknown>> }).companies[0]
        ?.custom_fields,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_id: 1,
          field_name: "Parent Organization",
        }),
      ]),
    );
    expect(searchContactsResult.structuredContent).toMatchObject({
      page: 1,
      returned_count: 1,
      has_more: true,
      contacts: [
        {
          slug: "contact-sample-001",
          first_name: "Pam",
          last_name: "Beesly",
          designation: "Office Manager",
          company_slug: "company-sample-001",
          additional_company_slugs: ["company-sample-aux-001"],
          city: "Scranton",
          locality: "Downtown",
          updated_on: "2026-04-09T11:30:00.000000Z",
          email: "pam.beesly@example.com",
          contact_number: "+1-555-0142",
          linkedin: "https://www.linkedin.com/in/pam-beesly",
        },
      ],
    });
    expect(
      (searchContactsResult.structuredContent as { contacts: Array<Record<string, unknown>> }).contacts[0],
    ).not.toHaveProperty("custom_fields");
    expect(listContactsResult.structuredContent).toMatchObject({
      page: 1,
      returned_count: 1,
      has_more: true,
      contacts: [
        {
          slug: "contact-sample-001",
          first_name: "Pam",
          last_name: "Beesly",
          designation: "Office Manager",
          company_slug: "company-sample-001",
          additional_company_slugs: ["company-sample-aux-001"],
          city: "Scranton",
          locality: "Downtown",
          updated_on: "2026-04-09T11:30:00.000000Z",
        },
      ],
    });
    expect(
      (listContactsResult.structuredContent as { contacts: Array<Record<string, unknown>> }).contacts[0],
    ).not.toHaveProperty("email");
    expect(contactDetailResult.structuredContent).toMatchObject({
      requested_count: 1,
      successful_count: 1,
      failed_count: 0,
      errors: [],
      contacts: [
        expect.objectContaining({
          slug: "contact-detail-sample-001",
          first_name: "Pam",
          last_name: "Beesly",
          company_name: "Example Holdings",
          resource_url: "https://app.recruitcrm.io/contact/contact-detail-sample-001",
        }),
      ],
    });
    expect(listUsersResult.structuredContent).toMatchObject({
      returned_count: 3,
      users: [
        {
          id: 453,
          first_name: "Sean",
          last_name: "Mallapurkar",
          status: "Active",
        },
        {
          id: 999,
          first_name: "Brandon",
          last_name: "McArthur",
          status: "Deactivated",
        },
        {
          id: 3557,
          first_name: "Sarvesh",
          last_name: null,
          status: "Deactivated",
        },
      ],
    });
    expect((listUsersResult.structuredContent as { users: Array<Record<string, unknown>> }).users[0]).not.toHaveProperty(
      "teams",
    );
    expect((listUsersResult.structuredContent as { users: Array<Record<string, unknown>> }).users[0]).not.toHaveProperty(
      "email",
    );
    expect(listUsersExpandedResult.structuredContent).toMatchObject({
      returned_count: 3,
      users: expect.arrayContaining([
        expect.objectContaining({
          id: 453,
          email: "sean@example.com",
          contact_number: "+1-555-0191",
          teams: [
            {
              team_id: 1435,
              team_name: "Legal Recruitment Team",
            },
            {
              team_id: 2253,
              team_name: "US Team",
            },
          ],
        }),
        expect.objectContaining({
          id: 999,
          email: null,
          contact_number: "+1-555-0199",
          teams: [],
        }),
      ]),
    });

    expect(searchHotlistsResult.structuredContent).toMatchObject({
      page: 1,
      returned_count: 2,
      has_more: true,
      hotlists: [
        {
          id: 702,
          name: "Product Leaders",
          related_to_type: "candidate",
          shared: true,
          created_by: 66960,
          related_count: 3,
          related_slugs: ["candidate-sample-001", "candidate-sample-002", "candidate-sample-003"],
        },
        {
          id: 703,
          name: "Private shortlist",
          related_to_type: "candidate",
          shared: false,
          created_by: 68596,
          related_count: 0,
          related_slugs: [],
        },
      ],
    });
    expect(createHotlistResult.structuredContent).toEqual({
      hotlist_id: 307309,
      name: "Product Leaders",
      related_to_type: "candidate",
      shared: false,
      created_by: 453,
    });
    expect(addRecordsToHotlistResult.structuredContent).toMatchObject({
      hotlist_id: 702,
      requested_count: 2,
      successful_count: 2,
      failed_count: 0,
      added_slugs: ["candidate-related-sample-001", "candidate-related-sample-002"],
      errors: [],
    });
    expect(addedHotlistSlugs).toEqual([
      "candidate-related-sample-001",
      "candidate-related-sample-002",
    ]);
    expect(
      (contactDetailResult.structuredContent as { contacts: Array<Record<string, unknown>> }).contacts[0]
        ?.additional_company_slugs,
    ).toEqual(["company-sample-aux-001", "", null]);
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
    expect(taskTypesResult.structuredContent).toEqual({
      returned_count: 3,
      task_types: [
        {
          id: 332,
          label: "Follow up",
        },
        {
          id: 53794,
          label: "Interview scheduling",
        },
        {
          id: 209961,
          label: "Call Candidate",
        },
      ],
    });
    expect(createTaskResult.structuredContent).toMatchObject({
      task_id: 66753909,
      title: "Codex API test task",
      task_type: {
        id: 332,
        label: "Follow up",
      },
      description: "<p><strong>Created by Codex</strong></p>",
      reminder: 30,
      start_date: "2026-04-28T04:30:00.000000Z",
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
      related_to_view_url: "https://app.recruitcrm.io/candidate/candidate-related-sample-001",
      owner: 453,
      associated_candidates: ["candidate-related-sample-001"],
      created_by: 453,
      updated_by: 453,
    });
    expect(createTaskResult.structuredContent as Record<string, unknown>).not.toHaveProperty("related");
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
          resource_url: "https://app.recruitcrm.io/notes/24667666",
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
    expect(noteTypesResult.structuredContent).toEqual({
      returned_count: 3,
      note_types: [
        {
          id: 42,
          label: "Internal Note",
        },
        {
          id: 108871,
          label: "General Note",
        },
        {
          id: 205989,
          label: "Candidate Interaction",
        },
      ],
    });
    expect(createNoteResult.structuredContent).toMatchObject({
      note_id: 66752552,
      note_type: {
        id: 108871,
        label: "General Note",
      },
      description:
        "<p><strong>Codex rich text API test</strong></p><ul><li><em>Bold and italic formatting</em></li></ul>",
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
      related_to_view_url: "https://app.recruitcrm.io/candidate/candidate-related-sample-001",
      associated_candidates: ["candidate-related-sample-001", "candidate-related-sample-002"],
      created_by: 453,
      updated_by: 453,
    });
    expect(createNoteResult.structuredContent as Record<string, unknown>).not.toHaveProperty("related");
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

    expect(transportMock).toHaveBeenCalledTimes(31);

    await client.close();
    await server.close();
  });

  it("returns partial failures for get_candidate_details without failing the whole tool call", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/candidates/candidate-good")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify({
            ...sampleCandidateDetailResponse,
            slug: "candidate-good",
          }),
        };
      }

      if (request.url.pathname.endsWith("/candidates/candidate-missing")) {
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
          candidate_slugs: ["candidate-good", "candidate-missing"],
        },
      }),
    ).resolves.toMatchObject({
      structuredContent: {
        requested_count: 2,
        successful_count: 1,
        failed_count: 1,
        candidates: [expect.objectContaining({ slug: "candidate-good" })],
        errors: [
          expect.objectContaining({
            slug: "candidate-missing",
            status_code: 404,
            error: expect.stringMatching(/^Candidate not found\./),
          }),
        ],
      },
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

  it("returns partial failures for get_company_details without failing the whole tool call", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/companies/company-good")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify({
            ...sampleCompanyDetailResponse,
            slug: "company-good",
          }),
        };
      }

      if (request.url.pathname.endsWith("/companies/company-missing")) {
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
        name: "get_company_details",
        arguments: {
          company_slugs: ["company-good", "company-missing"],
        },
      }),
    ).resolves.toMatchObject({
      structuredContent: {
        requested_count: 2,
        successful_count: 1,
        failed_count: 1,
        companies: [expect.objectContaining({ slug: "company-good" })],
        errors: [
          expect.objectContaining({
            slug: "company-missing",
            status_code: 404,
            error: expect.stringMatching(/^Company not found\./),
          }),
        ],
      },
    });

    await client.close();
    await server.close();
  });

  it("returns partial failures for get_contact_details without failing the whole tool call", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/contacts/contact-good")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify({
            ...sampleContactDetailResponse,
            slug: "contact-good",
          }),
        };
      }

      if (request.url.pathname.endsWith("/contacts/contact-missing")) {
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
        name: "get_contact_details",
        arguments: {
          contact_slugs: ["contact-good", "contact-missing"],
        },
      }),
    ).resolves.toMatchObject({
      structuredContent: {
        requested_count: 2,
        successful_count: 1,
        failed_count: 1,
        contacts: [expect.objectContaining({ slug: "contact-good" })],
        errors: [
          expect.objectContaining({
            slug: "contact-missing",
            status_code: 404,
            error: expect.stringMatching(/^Contact not found\./),
          }),
        ],
      },
    });

    await client.close();
    await server.close();
  });

  it("rejects sort-only search_contacts requests before making an API request", async () => {
    const transportMock = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => {
      throw new Error("Contact search should fail before making an API request.");
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
        name: "search_contacts",
        arguments: {
          sort_by: "updatedon",
          sort_order: "desc",
          page: 1,
          exact_search: true,
          include_contact_info: true,
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text:
            "search_contacts requires at least one filter. sort_by, sort_order, page, exact_search, and include_contact_info do not count by themselves.",
        },
      ],
    });

    expect(transportMock).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });

  it("searches hotlists with related_to_type only", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/hotlists/search")) {
        expect(request.url.searchParams.get("page")).toBe("1");
        expect(request.url.searchParams.get("related_to_type")).toBe("candidate");
        expect(request.url.searchParams.get("name")).toBeNull();
        expect(request.url.searchParams.get("shared")).toBeNull();

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleHotlistSearchResponse),
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

    const compactHotlists = (
      await client.callTool({
        name: "search_hotlists",
        arguments: {
          related_to_type: "candidate",
        },
      })
    ).structuredContent as { page: number; returned_count: number; has_more: boolean; hotlists: Array<Record<string, unknown>> };
    expect(compactHotlists).toMatchObject({
      page: 1,
      returned_count: 2,
      has_more: true,
      hotlists: expect.arrayContaining([
        expect.objectContaining({
          id: 702,
          name: "Product Leaders",
          related_count: 3,
        }),
        expect.objectContaining({
          id: 703,
          name: "Private shortlist",
          related_count: 0,
        }),
      ]),
    });
    expect(compactHotlists.hotlists[0]).not.toHaveProperty("related_slugs");
    expect(compactHotlists.hotlists[1]).not.toHaveProperty("related_slugs");

    await client.close();
    await server.close();
  });

  it("keeps search_hotlists compact when only shared is used as a narrowing filter", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/hotlists/search")) {
        expect(request.url.searchParams.get("page")).toBe("1");
        expect(request.url.searchParams.get("related_to_type")).toBe("candidate");
        expect(request.url.searchParams.get("name")).toBeNull();
        expect(request.url.searchParams.get("shared")).toBe("1");

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleHotlistSearchResponse),
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

    const compactHotlists = (
      await client.callTool({
        name: "search_hotlists",
        arguments: {
          related_to_type: "candidate",
          shared: 1,
        },
      })
    ).structuredContent as { hotlists: Array<Record<string, unknown>> };

    expect(compactHotlists.hotlists[0]).not.toHaveProperty("related_slugs");
    expect(compactHotlists.hotlists[1]).not.toHaveProperty("related_slugs");

    await client.close();
    await server.close();
  });

  it("normalizes empty hotlist search results", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/hotlists/search")) {
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
        name: "search_hotlists",
        arguments: {
          related_to_type: "candidate",
        },
      }),
    ).resolves.toMatchObject({
      structuredContent: {
        page: 1,
        returned_count: 0,
        has_more: false,
        hotlists: [],
      },
    });

    await client.close();
    await server.close();
  });

  it("rejects boolean-style shared search_hotlists requests before making an API request", async () => {
    const transportMock = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => {
      throw new Error("Hotlist search should fail before making an API request.");
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
        name: "search_hotlists",
        arguments: {
          related_to_type: "candidate",
          shared: "true",
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: expect.stringContaining("shared"),
        },
      ],
    });

    expect(transportMock).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });

  it("rejects boolean-style shared create_hotlist requests before making an API request", async () => {
    const transportMock = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => {
      throw new Error("Hotlist creation should fail before making an API request.");
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
        name: "create_hotlist",
        arguments: {
          name: "Product Leaders",
          related_to_type: "candidate",
          shared: "true",
          created_by: 453,
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: expect.stringContaining("shared"),
        },
      ],
    });

    expect(transportMock).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });

  it("adds records to hotlists sequentially and returns partial failures", async () => {
    const callOrder: string[] = [];
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/hotlists/702/add-record")) {
        expect(request.method).toBe("POST");
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
      name: "add_records_to_hotlist",
      arguments: {
        hotlist_id: 702,
        related_slugs: ["slug-a", "slug-a", "bad-slug", "slug-b"],
      },
    });

    expect(result.structuredContent).toMatchObject({
      hotlist_id: 702,
      requested_count: 3,
      successful_count: 2,
      failed_count: 1,
      added_slugs: ["slug-a", "slug-b"],
      errors: [
        expect.objectContaining({
          slug: "bad-slug",
          status_code: 422,
        }),
      ],
    });
    expect((result.structuredContent as { errors: Array<{ error: string }> }).errors[0]?.error).toContain(
      "validation error",
    );
    expect(callOrder).toEqual(["slug-a", "bad-slug", "slug-b"]);

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

  it("rejects create_note when created_by is missing before making an API request", async () => {
    const transportMock = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => {
      throw new Error("Note creation should fail before making an API request.");
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
        name: "create_note",
        arguments: {
          note_type_id: 108871,
          description: "<p>Missing creator</p>",
          related_to: "candidate-related-sample-001",
          related_to_type: "candidate",
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: expect.stringContaining("created_by"),
        },
      ],
    });

    expect(transportMock).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });

  it.each([
    [
      "description",
      {
        task_type_id: 332,
        title: "Follow up call",
        reminder: 30,
        start_date: "2026-04-28T04:30:00.000000Z",
        owner_id: 453,
        created_by: 453,
      },
    ],
    [
      "owner_id",
      {
        task_type_id: 332,
        title: "Follow up call",
        description: "<p>Missing owner</p>",
        reminder: 30,
        start_date: "2026-04-28T04:30:00.000000Z",
        created_by: 453,
      },
    ],
    [
      "created_by",
      {
        task_type_id: 332,
        title: "Follow up call",
        description: "<p>Missing creator</p>",
        reminder: 30,
        start_date: "2026-04-28T04:30:00.000000Z",
        owner_id: 453,
      },
    ],
  ])("rejects create_task when %s is missing before making an API request", async (fieldName, args) => {
    const transportMock = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => {
      throw new Error("Task creation should fail before making an API request.");
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
        name: "create_task",
        arguments: args,
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: expect.stringContaining(fieldName),
        },
      ],
    });

    expect(transportMock).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });

  it("rejects create_task when related_to is not paired with related_to_type before making an API request", async () => {
    const transportMock = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => {
      throw new Error("Task creation should fail before making an API request.");
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
        name: "create_task",
        arguments: {
          task_type_id: 332,
          title: "Follow up call",
          description: "<p>Missing related type</p>",
          reminder: 30,
          start_date: "2026-04-28T04:30:00.000000Z",
          owner_id: 453,
          created_by: 453,
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

  it("validates create_task task_type_id against task types before posting", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/task-types")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleTaskTypeListResponse),
        };
      }

      throw new Error("Task creation should not post with an unknown task_type_id.");
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
        name: "create_task",
        arguments: {
          task_type_id: 999999,
          title: "Follow up call",
          description: "<p>Unknown type</p>",
          reminder: 30,
          start_date: "2026-04-28T04:30:00.000000Z",
          owner_id: 453,
          created_by: 453,
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: expect.stringContaining("Unknown task_type_id 999999"),
        },
      ],
    });

    expect(transportMock).toHaveBeenCalledTimes(1);
    expect(transportMock.mock.calls[0]?.[0].url.pathname).toBe("/v1/task-types");

    await client.close();
    await server.close();
  });

  it("validates create_note note_type_id against note types before posting", async () => {
    const transportMock = vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
      if (request.url.pathname.endsWith("/note-types")) {
        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleNoteTypeListResponse),
        };
      }

      throw new Error("Note creation should not post with an unknown note_type_id.");
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
        name: "create_note",
        arguments: {
          note_type_id: 999999,
          description: "<p>Unknown type</p>",
          related_to: "candidate-related-sample-001",
          related_to_type: "candidate",
          created_by: 453,
        },
      }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        {
          text: expect.stringContaining("Unknown note_type_id 999999"),
        },
      ],
    });

    expect(transportMock).toHaveBeenCalledTimes(1);
    expect(transportMock.mock.calls[0]?.[0].url.pathname).toBe("/v1/note-types");

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
