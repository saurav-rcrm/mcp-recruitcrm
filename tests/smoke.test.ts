import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, it } from "vitest";

const transports: StdioClientTransport[] = [];

describe("stdio smoke test", () => {
  afterEach(async () => {
    await Promise.all(transports.map(async (transport) => transport.close().catch(() => undefined)));
    transports.length = 0;
  });

  it("starts over stdio and exposes the expected tools", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx", "src/index.ts"],
      cwd: process.cwd(),
      stderr: "pipe",
      env: {
        RECRUITCRM_API_TOKEN: "test-token",
      },
    });
    transports.push(transport);

    const client = new Client({
      name: "smoke-client",
      version: "1.0.0",
    });

    await client.connect(transport);

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
      "search_meetings",
      "search_notes",
      "search_call_logs",
      "get_candidate_details",
      "get_job_details",
      "get_company_details",
      "get_contact_details",
      "get_job_assigned_candidates",
      "list_candidate_hiring_stages",
      "get_candidate_job_assignment_hiring_stage_history",
      "list_candidate_custom_fields",
      "get_candidate_custom_field_details",
    ]);

    await client.close();
  }, 15000);
});
