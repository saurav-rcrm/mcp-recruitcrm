import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";

import { createRecruitCrmServer } from "../src/server.js";
import type { HttpRequestOptions, HttpResponse } from "../src/recruitcrm/http.js";
import {
  sampleCandidateCustomFieldsResponse,
  sampleCandidateDetailResponse,
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
          expect(request.url.searchParams.get("first_name")).toBe("Michael");
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

      if (request.url.pathname.endsWith("/tasks/search")) {
        expect(request.url.searchParams.get("related_to")).toBe("16367183842920002890gLG");
        expect(request.url.searchParams.get("related_to_type")).toBe("candidate");

        return {
          statusCode: 200,
          bodyText: JSON.stringify(sampleTaskSearchResponse),
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
      "search_tasks",
      "get_candidate_details",
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
        first_name: "Michael",
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
          first_name: "Michael",
          last_name: "Scott",
          position: "Software Developer",
          current_organization: "Dunder Mifflin",
          current_status: "Employed",
          city: "New York",
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

    const taskResult = await client.callTool({
      name: "search_tasks",
      arguments: {
        related_to: "16367183842920002890gLG",
        related_to_type: "candidate",
      },
    });

    expect(detailResult.structuredContent).toMatchObject({
      slug: "010011",
      first_name: "Saurav",
      last_name: "Jordan",
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
          title: "Власник компанії",
          work_company_name: "TATfood",
        }),
      ]),
    );
    expect(
      (detailResult.structuredContent as { education_history: Array<Record<string, unknown>> }).education_history,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          institute_name: "National University of Food Technologies",
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
          related_to: "16367183842920002890gLG",
          task_type: null,
          related_to_type: "candidate",
          related_to_name: "Aamer Ayoob - NQB is 1 of the Leading Global E",
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
      "related",
    );
    expect((taskResult.structuredContent as { tasks: Array<Record<string, unknown>> }).tasks[0]).not.toHaveProperty(
      "associated_candidates",
    );
    expect((taskResult.structuredContent as { tasks: Array<Record<string, unknown>> }).tasks[0]).not.toHaveProperty(
      "collaborators",
    );

    expect(transportMock).toHaveBeenCalledTimes(6);

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
          text: "Candidate not found.",
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
          related_to: "16367183842920002890gLG",
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
