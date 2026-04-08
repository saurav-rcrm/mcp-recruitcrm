import { describe, expect, it } from "vitest";

import {
  mapCallLogSummary,
  mapCandidateJobAssignmentHiringStageHistoryItem,
  mapCandidateJobAssignmentHiringStageHistoryResult,
  mapCandidateSummary,
  mapMeetingSummary,
  mapSearchMeetingsResult,
  mapSearchNotesResult,
  mapSearchCallLogsResult,
  mapSearchCandidatesResult,
  mapSearchTasksResult,
  mapNoteSummary,
  mapTaskSummary,
} from "../src/recruitcrm/mappers.js";
import {
  sampleCallLogSearchResponse,
  sampleCandidateJobAssignmentHiringStageHistoryResponse,
  sampleMeetingSearchResponse,
  sampleNoteSearchResponse,
  sampleSearchResponse,
  sampleTaskSearchResponse,
} from "./fixtures.js";

describe("candidate mappers", () => {
  it("omits contact fields from search summaries", () => {
    const summary = mapCandidateSummary(sampleSearchResponse.data[0]!);

    expect(summary).toEqual({
      slug: "010011",
      first_name: "Sample",
      last_name: "Candidate",
      position: "Software Developer",
      current_organization: "Acme Labs",
      current_status: "Employed",
      city: "Example City",
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

  it("maps company related payloads into a compact company_name object", () => {
    const summary = mapTaskSummary({
      ...sampleTaskSearchResponse.data[0],
      related_to_type: "company",
      related_to_name: null,
      related: {
        slug: "company-related-sample-001",
        company_name: "Acme Labs",
        website: "https://www.example.com",
      },
    });

    expect(summary.related).toEqual({
      company_name: "Acme Labs",
    });
  });
});

describe("meeting mappers", () => {
  it("maps meeting search results into compact structured output", () => {
    const result = mapSearchMeetingsResult(sampleMeetingSearchResponse);

    expect(result.page).toBe(1);
    expect(result.returned_count).toBe(1);
    expect(result.has_more).toBe(true);
    expect(result.meetings).toHaveLength(1);
    expect(result.meetings[0]).toEqual({
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
    });
  });

  it("accepts array meeting_type payloads and keeps only id and label", () => {
    const summary = mapMeetingSummary({
      ...sampleMeetingSearchResponse.data[0],
      meeting_type: [
        {
          id: "12",
          label: "Client Meeting",
          color: "blue",
        },
      ],
      do_not_send_calendar_invites: "0",
      all_day: "1",
    });

    expect(summary.meeting_type).toEqual([
      {
        id: "12",
        label: "Client Meeting",
      },
    ]);
    expect(summary.do_not_send_calendar_invites).toBe(false);
    expect(summary.all_day).toBe(true);
  });
});

describe("note mappers", () => {
  it("maps note search results into compact structured output", () => {
    const result = mapSearchNotesResult(sampleNoteSearchResponse);

    expect(result.page).toBe(1);
    expect(result.returned_count).toBe(1);
    expect(result.has_more).toBe(true);
    expect(result.notes).toHaveLength(1);
    expect(result.notes[0]).toEqual({
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
    });
  });

  it("accepts null note_type payloads", () => {
    const summary = mapNoteSummary({
      ...sampleNoteSearchResponse.data[0],
      note_type: null,
    });

    expect(summary.note_type).toBeNull();
  });

  it("maps job related payloads into a compact name object", () => {
    const summary = mapNoteSummary({
      ...sampleNoteSearchResponse.data[0],
      related_to_type: "job",
      related: {
        slug: "job-related-sample-001",
        name: "Sample Role",
        company: "Acme Labs",
      },
    });

    expect(summary.related).toEqual({
      name: "Sample Role",
    });
  });
});

describe("call log mappers", () => {
  it("maps call log search results into compact structured output", () => {
    const result = mapSearchCallLogsResult(sampleCallLogSearchResponse);

    expect(result.page).toBe(1);
    expect(result.returned_count).toBe(1);
    expect(result.has_more).toBe(true);
    expect(result.call_logs).toHaveLength(1);
    expect(result.call_logs[0]).toEqual({
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
    });
  });

  it("accepts null custom_call_type payloads", () => {
    const summary = mapCallLogSummary({
      ...sampleCallLogSearchResponse.data[0],
      custom_call_type: null,
      call_notes: null,
    });

    expect(summary.custom_call_type).toBeNull();
    expect(summary.call_notes).toBeNull();
  });
});

describe("candidate job assignment hiring stage history mappers", () => {
  it("maps history results into compact structured output", () => {
    const result = mapCandidateJobAssignmentHiringStageHistoryResult(
      "candidate-related-sample-001",
      sampleCandidateJobAssignmentHiringStageHistoryResponse,
    );

    expect(result).toEqual({
      candidate_slug: "candidate-related-sample-001",
      returned_count: 3,
      history: [
        {
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
        },
        {
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
        },
        {
          job_slug: "16540132164740000453lqF",
          job_name: "Chief of Staff",
          company_slug: "7063184",
          company_name: "Google",
          job_status_id: 1,
          job_status_label: "Open",
          candidate_status_id: 364508,
          candidate_status: null,
          remark: "great candidate",
          updated_by: 0,
          updated_on: "2024-12-02T15:14:51.000000Z",
        },
      ],
    });
  });

  it("normalizes blank remark values to null", () => {
    const summary = mapCandidateJobAssignmentHiringStageHistoryItem(
      sampleCandidateJobAssignmentHiringStageHistoryResponse[1]!,
    );

    expect(summary.remark).toBeNull();
    expect(summary.updated_by).toBe(453);
  });
});
