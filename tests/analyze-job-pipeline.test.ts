import { describe, expect, it, vi } from "vitest";

import { RecruitCrmApiError } from "../src/errors.js";
import { RecruitCrmClient } from "../src/recruitcrm/client.js";
import type { HttpRequestOptions, HttpResponse } from "../src/recruitcrm/http.js";
import { executeAnalyzeJobPipeline } from "../src/server.js";
import { sampleJobDetailResponse } from "./fixtures.js";

const baseConfig = {
  apiToken: "test-token",
  baseUrl: "https://api.recruitcrm.io/v1",
  timeoutMs: 10_000,
  debugSchemaErrors: false,
};

const TEST_JOB_SLUG = "job-detail-sample-001";
const ACTIVE_STATUS = { status_id: 5, label: "1st Interview" };
const TERMINAL_STATUS = { status_id: 8, label: "Placed" };

type AssignmentRaw = {
  stage_date: string | null;
  status: { status_id: number | string; label: string };
  candidate: {
    slug: string;
    first_name?: string;
    last_name?: string;
    [key: string]: unknown;
  };
};

function makeAssignment(slug: string, status: { status_id: number; label: string } = ACTIVE_STATUS): AssignmentRaw {
  return {
    stage_date: "2026-04-01T00:00:00.000000Z",
    status,
    candidate: {
      slug,
      first_name: "First",
      last_name: slug,
      email: `${slug}@example.com`,
      contact_number: "+1-555-0000",
      avatar: "https://example.com/avatar.png",
      current_organization: "Acme",
      current_status: "Employed",
      city: "City",
      country: "Country",
      updated_on: "2026-04-01T00:00:00.000000Z",
      position: "Engineer",
      current_salary: 100000,
      salary_expectation: 120000,
      linkedin: "https://linkedin.com/in/x",
      custom_fields: [],
      resource_url: `https://app.recruitcrm.io/candidate/${slug}`,
      is_email_opted_out: false,
      email_opt_out_source: null,
    },
  };
}

function assignedPagePayload(
  jobSlug: string,
  page: number,
  candidates: AssignmentRaw[],
  hasNext: boolean,
) {
  return {
    current_page: page,
    next_page_url: hasNext
      ? `https://api.recruitcrm.io/v1/jobs/${jobSlug}/assigned-candidates?page=${page + 1}`
      : null,
    data: candidates,
  };
}

function makeStageHistory(jobSlug: string, candidateSlug: string, daysAgo: number) {
  const updatedOn = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
  return [
    {
      job_slug: jobSlug,
      job_name: "Operations Analyst",
      company_slug: "company-sample-001",
      company_name: "Acme",
      job_status_id: 1,
      job_status_label: "Open",
      candidate_status_id: ACTIVE_STATUS.status_id,
      candidate_status: ACTIVE_STATUS.label,
      remark: "",
      updated_by: 0,
      updated_on: updatedOn,
      candidate_slug: candidateSlug,
    },
  ];
}

function emptyActivityResponse() {
  return { current_page: 1, next_page_url: null, data: [] };
}

type RouteFn = (request: HttpRequestOptions) => HttpResponse | Promise<HttpResponse> | undefined;

function buildTransport(route: RouteFn): ReturnType<typeof vi.fn> {
  return vi.fn(async (request: HttpRequestOptions): Promise<HttpResponse> => {
    const response = await route(request);
    if (!response) {
      throw new Error(`Unmocked path: ${request.method} ${request.url.pathname}`);
    }
    return response;
  });
}

function ok(payload: unknown): HttpResponse {
  return { statusCode: 200, bodyText: JSON.stringify(payload) };
}

describe("executeAnalyzeJobPipeline", () => {
  it("happy path — single page, mix of active and terminal candidates", async () => {
    const activeAssignments = [
      makeAssignment("cand-a"),
      makeAssignment("cand-b"),
      makeAssignment("cand-c"),
      makeAssignment("cand-d"),
      makeAssignment("cand-e"),
    ];
    const terminalAssignments = [
      makeAssignment("cand-t1", TERMINAL_STATUS),
      makeAssignment("cand-t2", TERMINAL_STATUS),
    ];

    const transport = buildTransport((request) => {
      const path = request.url.pathname;
      if (path === `/v1/jobs/${TEST_JOB_SLUG}`) return ok(sampleJobDetailResponse);
      if (path === `/v1/jobs/${TEST_JOB_SLUG}/assigned-candidates`) {
        return ok(assignedPagePayload(TEST_JOB_SLUG, 1, [...activeAssignments, ...terminalAssignments], false));
      }
      if (path.startsWith("/v1/candidates/") && path.endsWith("/history")) {
        const slug = path.replace("/v1/candidates/", "").replace("/history", "");
        return ok(makeStageHistory(TEST_JOB_SLUG, slug, 5));
      }
      if (path === "/v1/notes/search") return ok(emptyActivityResponse());
      if (path === "/v1/meetings/search") return ok(emptyActivityResponse());
      if (path === "/v1/tasks/search") return ok(emptyActivityResponse());
      return undefined;
    });

    const client = new RecruitCrmClient(baseConfig, transport);
    const result = await executeAnalyzeJobPipeline(client, { job_slug: TEST_JOB_SLUG });

    expect(result.job.slug).toBe(TEST_JOB_SLUG);
    expect(result.job.view_url).toBe(`https://app.recruitcrm.io/job/${TEST_JOB_SLUG}`);
    expect(result.pipeline.window).toEqual({ start_page: 1, end_page: 1, analyzed_count: 7 });
    expect(result.pipeline.next_window).toBeNull();
    expect(result.pipeline.active_count).toBe(5);
    expect(result.pipeline.terminal_count).toBe(2);
    expect(result.pipeline.terminal_stages_summary).toEqual({ Placed: 2 });
    expect(result.pipeline.stages).toHaveLength(1);
    expect(result.pipeline.stages[0]).toMatchObject({ label: "1st Interview", count: 5 });
    expect(result.activity).not.toBeNull();
    expect(result.errors).toEqual([]);
    expect(result.suggested_actions.some((s) => s.includes("Analyzed candidates"))).toBe(false);
  });

  it("populates next_window when last fetched page returns next_page_url", async () => {
    const transport = buildTransport((request) => {
      const path = request.url.pathname;
      const page = Number(request.url.searchParams.get("page") ?? "1");
      if (path === `/v1/jobs/${TEST_JOB_SLUG}`) return ok(sampleJobDetailResponse);
      if (path === `/v1/jobs/${TEST_JOB_SLUG}/assigned-candidates`) {
        const candidates = Array.from({ length: 100 }, (_, i) =>
          makeAssignment(`cand-p${page}-${i}`),
        );
        // All three pages return next_page_url present
        return ok(assignedPagePayload(TEST_JOB_SLUG, page, candidates, true));
      }
      if (path.startsWith("/v1/candidates/") && path.endsWith("/history")) {
        const slug = path.replace("/v1/candidates/", "").replace("/history", "");
        return ok(makeStageHistory(TEST_JOB_SLUG, slug, 5));
      }
      if (path === "/v1/notes/search") return ok(emptyActivityResponse());
      if (path === "/v1/meetings/search") return ok(emptyActivityResponse());
      if (path === "/v1/tasks/search") return ok(emptyActivityResponse());
      return undefined;
    });

    const client = new RecruitCrmClient(baseConfig, transport);
    const result = await executeAnalyzeJobPipeline(client, { job_slug: TEST_JOB_SLUG });

    expect(result.pipeline.window).toEqual({ start_page: 1, end_page: 3, analyzed_count: 300 });
    expect(result.pipeline.next_window).toEqual({ start_page: 4 });
    expect(result.truncated.assignments).toBe(true);
    expect(
      result.suggested_actions.some(
        (s) => s.includes("Analyzed candidates 1–300") && s.includes("start_page=4"),
      ),
    ).toBe(true);
  });

  it("returns next_window null and no pagination nudge when API signals no next page", async () => {
    const transport = buildTransport((request) => {
      const path = request.url.pathname;
      if (path === `/v1/jobs/${TEST_JOB_SLUG}`) return ok(sampleJobDetailResponse);
      if (path === `/v1/jobs/${TEST_JOB_SLUG}/assigned-candidates`) {
        return ok(assignedPagePayload(TEST_JOB_SLUG, 1, [makeAssignment("cand-only")], false));
      }
      if (path.startsWith("/v1/candidates/") && path.endsWith("/history")) {
        const slug = path.replace("/v1/candidates/", "").replace("/history", "");
        return ok(makeStageHistory(TEST_JOB_SLUG, slug, 1));
      }
      if (path === "/v1/notes/search") return ok(emptyActivityResponse());
      if (path === "/v1/meetings/search") return ok(emptyActivityResponse());
      if (path === "/v1/tasks/search") return ok(emptyActivityResponse());
      return undefined;
    });

    const client = new RecruitCrmClient(baseConfig, transport);
    const result = await executeAnalyzeJobPipeline(client, { job_slug: TEST_JOB_SLUG });

    expect(result.pipeline.next_window).toBeNull();
    expect(result.suggested_actions.some((s) => s.includes("Analyzed candidates"))).toBe(false);
  });

  it("auto-skips activity when start_page > 1 and starts pagination at the requested page", async () => {
    const seenAssignmentPages: number[] = [];
    let activityHits = 0;

    const transport = buildTransport((request) => {
      const path = request.url.pathname;
      if (path === `/v1/jobs/${TEST_JOB_SLUG}`) return ok(sampleJobDetailResponse);
      if (path === `/v1/jobs/${TEST_JOB_SLUG}/assigned-candidates`) {
        const page = Number(request.url.searchParams.get("page") ?? "1");
        seenAssignmentPages.push(page);
        return ok(assignedPagePayload(TEST_JOB_SLUG, page, [makeAssignment(`cand-p${page}`)], false));
      }
      if (path.startsWith("/v1/candidates/") && path.endsWith("/history")) {
        const slug = path.replace("/v1/candidates/", "").replace("/history", "");
        return ok(makeStageHistory(TEST_JOB_SLUG, slug, 1));
      }
      if (path === "/v1/notes/search" || path === "/v1/meetings/search" || path === "/v1/tasks/search") {
        activityHits += 1;
        return ok(emptyActivityResponse());
      }
      return undefined;
    });

    const client = new RecruitCrmClient(baseConfig, transport);
    const result = await executeAnalyzeJobPipeline(client, {
      job_slug: TEST_JOB_SLUG,
      start_page: 4,
    });

    expect(seenAssignmentPages[0]).toBe(4);
    expect(activityHits).toBe(0);
    expect(result.activity).toBeNull();
    expect(result.pipeline.window.start_page).toBe(4);
  });

  it("records errors[] when one candidate's stage history fails but others succeed", async () => {
    const transport = buildTransport((request) => {
      const path = request.url.pathname;
      if (path === `/v1/jobs/${TEST_JOB_SLUG}`) return ok(sampleJobDetailResponse);
      if (path === `/v1/jobs/${TEST_JOB_SLUG}/assigned-candidates`) {
        return ok(
          assignedPagePayload(
            TEST_JOB_SLUG,
            1,
            [
              makeAssignment("cand-a"),
              makeAssignment("cand-b"),
              makeAssignment("cand-c"),
              makeAssignment("cand-d"),
              makeAssignment("cand-fail"),
            ],
            false,
          ),
        );
      }
      if (path === "/v1/candidates/cand-fail/history") {
        return { statusCode: 500, bodyText: JSON.stringify({ message: "boom" }) };
      }
      if (path.startsWith("/v1/candidates/") && path.endsWith("/history")) {
        const slug = path.replace("/v1/candidates/", "").replace("/history", "");
        return ok(makeStageHistory(TEST_JOB_SLUG, slug, 5));
      }
      if (path === "/v1/notes/search") return ok(emptyActivityResponse());
      if (path === "/v1/meetings/search") return ok(emptyActivityResponse());
      if (path === "/v1/tasks/search") return ok(emptyActivityResponse());
      return undefined;
    });

    const client = new RecruitCrmClient(baseConfig, transport);
    const result = await executeAnalyzeJobPipeline(client, {
      job_slug: TEST_JOB_SLUG,
      include_time_metrics: true,
    });

    expect(result.pipeline.active_count).toBe(5);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ source: "stage_history", slug: "cand-fail" });
  });

  it("propagates a 404 from getJobDetails as RecruitCrmApiError", async () => {
    const transport = buildTransport((request) => {
      if (request.url.pathname === `/v1/jobs/${TEST_JOB_SLUG}`) {
        return { statusCode: 404, bodyText: JSON.stringify({ message: "Job not found" }) };
      }
      return undefined;
    });

    const client = new RecruitCrmClient(baseConfig, transport);
    await expect(executeAnalyzeJobPipeline(client, { job_slug: TEST_JOB_SLUG })).rejects.toBeInstanceOf(
      RecruitCrmApiError,
    );
  });

  it("skips stage-history fan-out entirely when all candidates are terminal", async () => {
    let stageHistoryHits = 0;
    const transport = buildTransport((request) => {
      const path = request.url.pathname;
      if (path === `/v1/jobs/${TEST_JOB_SLUG}`) return ok(sampleJobDetailResponse);
      if (path === `/v1/jobs/${TEST_JOB_SLUG}/assigned-candidates`) {
        return ok(
          assignedPagePayload(
            TEST_JOB_SLUG,
            1,
            [
              makeAssignment("cand-x", TERMINAL_STATUS),
              makeAssignment("cand-y", TERMINAL_STATUS),
              makeAssignment("cand-z", TERMINAL_STATUS),
            ],
            false,
          ),
        );
      }
      if (path.startsWith("/v1/candidates/") && path.endsWith("/history")) {
        stageHistoryHits += 1;
        return ok([]);
      }
      if (path === "/v1/notes/search") return ok(emptyActivityResponse());
      if (path === "/v1/meetings/search") return ok(emptyActivityResponse());
      if (path === "/v1/tasks/search") return ok(emptyActivityResponse());
      return undefined;
    });

    const client = new RecruitCrmClient(baseConfig, transport);
    const result = await executeAnalyzeJobPipeline(client, { job_slug: TEST_JOB_SLUG });

    expect(stageHistoryHits).toBe(0);
    expect(result.pipeline.stages).toEqual([]);
    expect(result.pipeline.active_count).toBe(0);
    expect(result.pipeline.terminal_count).toBe(3);
    expect(result.pipeline.terminal_stages_summary).toEqual({ Placed: 3 });
    expect(result.bottleneck).toBeNull();
  });

  it("sets truncated.active_candidates when active count exceeds max_active_candidates", async () => {
    const candidates = Array.from({ length: 8 }, (_, i) => makeAssignment(`cand-${i}`));
    const transport = buildTransport((request) => {
      const path = request.url.pathname;
      if (path === `/v1/jobs/${TEST_JOB_SLUG}`) return ok(sampleJobDetailResponse);
      if (path === `/v1/jobs/${TEST_JOB_SLUG}/assigned-candidates`) {
        return ok(assignedPagePayload(TEST_JOB_SLUG, 1, candidates, false));
      }
      if (path.startsWith("/v1/candidates/") && path.endsWith("/history")) {
        const slug = path.replace("/v1/candidates/", "").replace("/history", "");
        return ok(makeStageHistory(TEST_JOB_SLUG, slug, 1));
      }
      if (path === "/v1/notes/search") return ok(emptyActivityResponse());
      if (path === "/v1/meetings/search") return ok(emptyActivityResponse());
      if (path === "/v1/tasks/search") return ok(emptyActivityResponse());
      return undefined;
    });

    const client = new RecruitCrmClient(baseConfig, transport);
    const result = await executeAnalyzeJobPipeline(client, {
      job_slug: TEST_JOB_SLUG,
      max_active_candidates: 3,
      include_time_metrics: true,
    });

    expect(result.truncated.active_candidates).toBe(true);
    expect(
      result.suggested_actions.some((s) => s.includes("Active-candidate stage history was truncated")),
    ).toBe(true);
  });

  it("default behavior (no flag) skips all /history calls and uses stage_date for days_in_current_stage", async () => {
    let stageHistoryHits = 0;
    const transport = buildTransport((request) => {
      const path = request.url.pathname;
      if (path === `/v1/jobs/${TEST_JOB_SLUG}`) return ok(sampleJobDetailResponse);
      if (path === `/v1/jobs/${TEST_JOB_SLUG}/assigned-candidates`) {
        return ok(
          assignedPagePayload(
            TEST_JOB_SLUG,
            1,
            [makeAssignment("cand-a"), makeAssignment("cand-b"), makeAssignment("cand-c")],
            false,
          ),
        );
      }
      if (path.startsWith("/v1/candidates/") && path.endsWith("/history")) {
        stageHistoryHits += 1;
        return ok([]);
      }
      if (path === "/v1/notes/search") return ok(emptyActivityResponse());
      if (path === "/v1/meetings/search") return ok(emptyActivityResponse());
      if (path === "/v1/tasks/search") return ok(emptyActivityResponse());
      return undefined;
    });

    const client = new RecruitCrmClient(baseConfig, transport);
    const result = await executeAnalyzeJobPipeline(client, { job_slug: TEST_JOB_SLUG });

    expect(stageHistoryHits).toBe(0);
    expect(result.time_metrics).toBeNull();
    // Each candidate should have days_in_current_stage populated from stage_date.
    for (const stage of result.pipeline.stages) {
      for (const c of stage.candidates) {
        expect(c.days_in_current_stage).not.toBeNull();
      }
    }
  });

  it("include_time_metrics=true fetches placed candidate history and computes time_to_hire", async () => {
    let placedHistoryHits = 0;
    const placedSlug = "cand-placed";
    const transport = buildTransport((request) => {
      const path = request.url.pathname;
      if (path === `/v1/jobs/${TEST_JOB_SLUG}`) return ok(sampleJobDetailResponse);
      if (path === `/v1/jobs/${TEST_JOB_SLUG}/assigned-candidates`) {
        return ok(
          assignedPagePayload(
            TEST_JOB_SLUG,
            1,
            [makeAssignment("cand-active"), makeAssignment(placedSlug, TERMINAL_STATUS)],
            false,
          ),
        );
      }
      if (path === `/v1/candidates/${placedSlug}/history`) {
        placedHistoryHits += 1;
        // Two-entry timeline: assigned 30 days ago, placed today
        const start = new Date(Date.now() - 30 * 86_400_000).toISOString();
        const end = new Date().toISOString();
        return ok([
          {
            job_slug: TEST_JOB_SLUG,
            candidate_status_id: TERMINAL_STATUS.status_id,
            candidate_status: TERMINAL_STATUS.label,
            updated_on: end,
            candidate_slug: placedSlug,
          },
          {
            job_slug: TEST_JOB_SLUG,
            candidate_status_id: ACTIVE_STATUS.status_id,
            candidate_status: ACTIVE_STATUS.label,
            updated_on: start,
            candidate_slug: placedSlug,
          },
        ]);
      }
      if (path.startsWith("/v1/candidates/") && path.endsWith("/history")) {
        return ok([]);
      }
      if (path === "/v1/notes/search") return ok(emptyActivityResponse());
      if (path === "/v1/meetings/search") return ok(emptyActivityResponse());
      if (path === "/v1/tasks/search") return ok(emptyActivityResponse());
      return undefined;
    });

    const client = new RecruitCrmClient(baseConfig, transport);
    const result = await executeAnalyzeJobPipeline(client, {
      job_slug: TEST_JOB_SLUG,
      include_time_metrics: true,
    });

    expect(placedHistoryHits).toBe(1);
    expect(result.time_metrics).not.toBeNull();
    expect(result.time_metrics?.time_to_hire).not.toBeNull();
    expect(result.time_metrics?.time_to_hire?.sample_size).toBe(1);
    expect(result.time_metrics?.time_to_hire?.first_days).toBe(30);
    expect(result.time_metrics?.coverage.placed_history_fetched).toBe(1);
    expect(result.time_metrics?.coverage.placed_total).toBe(1);
  });
});
