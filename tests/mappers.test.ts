import { describe, expect, it } from "vitest";

import {
  mapCallLogSummary,
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

describe("meeting mappers", () => {
  it("maps meeting search results into compact structured output", () => {
    const result = mapSearchMeetingsResult(sampleMeetingSearchResponse);

    expect(result.page).toBe(1);
    expect(result.returned_count).toBe(1);
    expect(result.has_more).toBe(true);
    expect(result.meetings).toHaveLength(1);
    expect(result.meetings[0]).toEqual({
      id: 47202185,
      title: "Aamer Ayoob - NQB is 1 of the Leading Global E/Customer Success Manager (Netflix)",
      meeting_type: [
        {
          id: 20707,
          label: "Candidate Interview with Client",
        },
      ],
      description: "<p>Test</p>",
      address: "https://us04web.zoom.us/j/75090638594?pwd=U06ZW6PX4hTukaYGNRGv6YphA7nj9a.1",
      reminder: 30,
      start_date: "2025-10-31T09:30:00.000000Z",
      end_date: "2025-10-31T10:00:00.000000Z",
      related_to: "16367183842920002890gLG",
      related_to_type: "candidate",
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
      description: "GOOD CANDIDATE",
      related_to: "16367183842920002890gLG",
      related_to_type: "candidate",
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
      contact_number: "+19195234827",
      call_notes: null,
      related_to: "16367183842920002890gLG",
      related_to_type: "candidate",
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
