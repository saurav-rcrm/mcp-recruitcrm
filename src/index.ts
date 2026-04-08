#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createRecruitCrmServer } from "./server.js";

async function main(): Promise<void> {
  const server = createRecruitCrmServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error("Recruit CRM MCP Server running on stdio");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error.";
  console.error(`Recruit CRM MCP Server failed to start: ${message}`);
  process.exit(1);
});
