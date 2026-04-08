import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";

import { createRecruitCrmServer } from "../src/server.js";
import type { HttpRequestOptions, HttpResponse } from "../src/recruitcrm/http.js";
import { sampleCandidateCustomFieldsResponse, sampleSearchResponse } from "./fixtures.js";

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

      throw new Error(`Unexpected request: ${request.url.toString()}`);
    });

    const server = createRecruitCrmServer({
      config: {
        apiToken: "test-token",
        baseUrl: "https://api.recruitcrm.io/v1",
        timeoutMs: 10_000,
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
          full_name: "Michael Scott",
        },
      ],
    });

    const detailResult = await client.callTool({
      name: "get_candidate_details",
      arguments: {
        candidate_slug: "010011",
      },
    });

    expect(detailResult.structuredContent).toMatchObject({
      slug: "010011",
      email: "mscott@gmail.com",
      contact_number: "+1123226666",
      location: "New York, New York, United States",
    });

    expect(transportMock).toHaveBeenCalledTimes(5);

    await client.close();
    await server.close();
  });
});
