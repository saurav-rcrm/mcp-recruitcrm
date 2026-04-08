import { afterEach, describe, expect, it, vi } from "vitest";

import { RecruitCrmClient } from "../src/recruitcrm/client.js";
import type { HttpRequestOptions, HttpResponse } from "../src/recruitcrm/http.js";
import { sampleSearchResponse } from "./fixtures.js";

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

  it("parses live-like mixed scalar search payloads", async () => {
    const transport = vi.fn(async (_request: HttpRequestOptions): Promise<HttpResponse> => ({
      statusCode: 200,
      bodyText: JSON.stringify(sampleSearchResponse),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    const result = await client.searchCandidates({ first_name: "Michael" });
    const candidate = result.data[0];

    expect(candidate).toMatchObject({
      slug: "010011",
      current_salary: 150000,
      salary_expectation: 180000,
      salary_type: {
        id: "1",
        label: "Monthly Salary",
      },
    });
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
            current_salary: { amount: 150000 },
          },
        ],
      }),
    }));
    const client = new RecruitCrmClient(baseConfig, transport);

    await expect(client.searchCandidates({ first_name: "Michael" })).rejects.toMatchObject({
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
            current_salary: { amount: 150000 },
          },
        ],
      }),
    }));
    const client = new RecruitCrmClient({ ...baseConfig, debugSchemaErrors: true }, transport);

    await expect(client.searchCandidates({ first_name: "Michael" })).rejects.toMatchObject({
      message: "Recruit CRM API returned an invalid response.",
    });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Recruit CRM schema mismatch for /candidates/search: data.0.current_salary"),
    );
  });
});
