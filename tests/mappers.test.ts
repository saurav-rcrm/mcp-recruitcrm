import { describe, expect, it } from "vitest";

import {
  mapCandidateSummary,
  mapSearchCandidatesResult,
  mapSearchTasksResult,
  mapTaskSummary,
} from "../src/recruitcrm/mappers.js";
import { sampleSearchResponse, sampleTaskSearchResponse } from "./fixtures.js";

describe("candidate mappers", () => {
  it("omits contact fields from search summaries", () => {
    const summary = mapCandidateSummary(sampleSearchResponse.data[0]!);

    expect(summary).toEqual({
      slug: "010011",
      first_name: "Michael",
      last_name: "Scott",
      position: "Software Developer",
      current_organization: "Dunder Mifflin",
      current_status: "Employed",
      city: "New York",
      updated_on: "2020-06-29T05:36:22.000000Z",
    });
    expect("email" in summary).toBe(false);
    expect("contact_number" in summary).toBe(false);
    expect("full_name" in summary).toBe(false);
  });

  it("maps search results into compact structured output", () => {
    const result = mapSearchCandidatesResult(sampleSearchResponse);

    expect(result.page).toBe(2);
    expect(result.returned_count).toBe(1);
    expect(result.has_more).toBe(true);
    expect(result.candidates).toHaveLength(1);
  });
});

describe("task mappers", () => {
  it("maps task search results into compact structured output", () => {
    const result = mapSearchTasksResult(sampleTaskSearchResponse);

    expect(result.page).toBe(1);
    expect(result.returned_count).toBe(1);
    expect(result.has_more).toBe(true);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]).toEqual({
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
    });
  });

  it("keeps only id and label when task_type is populated", () => {
    const summary = mapTaskSummary({
      ...sampleTaskSearchResponse.data[0],
      task_type: [
        {
          id: "12",
          label: "Follow up",
          color: "blue",
        },
      ],
    });

    expect(summary.task_type).toEqual([
      {
        id: "12",
        label: "Follow up",
      },
    ]);
  });

  it("normalizes single-object task_type payloads into the compact array shape", () => {
    const summary = mapTaskSummary({
      ...sampleTaskSearchResponse.data[0],
      task_type: {
        id: 209961,
        label: "Call Candidate",
        ignored: true,
      },
    });

    expect(summary.task_type).toEqual([
      {
        id: 209961,
        label: "Call Candidate",
      },
    ]);
  });
});
