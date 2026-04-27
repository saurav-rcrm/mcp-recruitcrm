import { describe, expect, it } from "vitest";

import {
  mapCallLogSummary,
  mapCandidateHiringStagesResult,
  mapCandidateJobAssignmentHiringStageHistoryItem,
  mapCandidateJobAssignmentHiringStageHistoryResult,
  mapCandidateSummary,
  mapCompanySummary,
  mapContactSummary,
  mapCreateHotlistResult,
  mapCreateNoteResult,
  mapCreateTaskResult,
  mapHiringStageSummary,
  mapAssignedCandidateSummary,
  mapJobSummary,
  mapJobAssignedCandidatesResult,
  mapListNoteTypesResult,
  mapListTaskTypesResult,
  mapListUsersResult,
  mapMeetingSummary,
  mapSearchMeetingsResult,
  mapSearchNotesResult,
  mapSearchCallLogsResult,
  mapSearchCandidatesResult,
  mapSearchCompaniesResult,
  mapSearchContactsResult,
  mapSearchHotlistsResult,
  mapSearchJobsResult,
  mapSearchTasksResult,
  mapNoteSummary,
  mapTaskSummary,
  mapUserSummary,
} from "../src/recruitcrm/mappers.js";
import {
  sampleCallLogSearchResponse,
  sampleCandidateJobAssignmentHiringStageHistoryResponse,
  sampleCompanySearchResponse,
  sampleContactSearchResponse,
  sampleCreatedHotlistResponse,
  sampleCreatedNoteResponse,
  sampleCreatedTaskResponse,
  sampleHiringPipelineResponse,
  sampleHotlistSearchResponse,
  sampleJobSearchResponse,
  sampleJobAssignedCandidatesResponse,
  sampleMeetingSearchResponse,
  sampleNoteSearchResponse,
  sampleNoteTypeListResponse,
  sampleSearchResponse,
  sampleTaskSearchResponse,
  sampleTaskTypeListResponse,
  sampleUserListResponse,
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

describe("job assigned candidate mappers", () => {
  it("maps assigned candidate results into compact structured output", () => {
    const result = mapJobAssignedCandidatesResult("job-sample-001", sampleJobAssignedCandidatesResponse);

    expect(result).toEqual({
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
  });

  it("omits raw candidate contact fields from assigned candidate summaries", () => {
    const summary = mapAssignedCandidateSummary(sampleJobAssignedCandidatesResponse.data[0]!);

    expect(summary).not.toHaveProperty("email");
    expect(summary).not.toHaveProperty("contact_number");
    expect(summary).not.toHaveProperty("resource_url");
    expect(summary).not.toHaveProperty("custom_fields");
  });
});

describe("candidate hiring stage mappers", () => {
  it("maps hiring pipeline results into compact stage rows", () => {
    const result = mapCandidateHiringStagesResult(sampleHiringPipelineResponse);

    expect(result).toEqual({
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
  });

  it("accepts upstream status_id or stage_id fields", () => {
    expect(mapHiringStageSummary(sampleHiringPipelineResponse[0]!)).toEqual({
      stage_id: 1,
      label: "Assigned",
    });
    expect(mapHiringStageSummary(sampleHiringPipelineResponse[2]!)).toEqual({
      stage_id: 10,
      label: "Applied",
    });
  });
});

describe("task mappers", () => {
  it("maps task types into compact structured output", () => {
    expect(mapListTaskTypesResult(sampleTaskTypeListResponse)).toEqual({
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
  });

  it("maps created tasks without exposing the related entity payload", () => {
    const result = mapCreateTaskResult(sampleCreatedTaskResponse);

    expect(result).toEqual({
      task_id: 66753909,
      title: "Codex API test task",
      task_type: {
        id: 332,
        label: "Follow up",
      },
      description: "<p><strong>Created by Codex</strong></p>",
      reminder: 30,
      start_date: "2026-04-28T04:30:00.000000Z",
      reminder_date: "2026-04-28T04:00:00.000000Z",
      related_to: "candidate-related-sample-001",
      related_to_type: "candidate",
      related_to_name: "Sample Candidate",
      related_to_view_url: "https://app.recruitcrm.io/candidate/candidate-related-sample-001",
      status: null,
      owner: 453,
      associated_candidates: ["candidate-related-sample-001"],
      associated_companies: [],
      associated_contacts: [],
      associated_jobs: [],
      associated_deals: [],
      created_on: "2026-04-27T12:13:47.000000Z",
      updated_on: "2026-04-27T12:13:47.000000Z",
      created_by: 453,
      updated_by: 453,
      collaborators: [
        {
          attendee_type: "user",
          attendee_id: "12654",
          display_name: "Jane Scott",
        },
      ],
      collaborator_users: [
        {
          id: 34,
          first_name: "Jane",
          last_name: "Scott",
        },
      ],
      collaborator_teams: [
        {
          team_id: 1435,
          team_name: null,
        },
        {
          team_id: 16,
          team_name: "Delivery",
        },
      ],
    });
    expect(result).not.toHaveProperty("related");
  });

  it("returns null related_to_view_url for created tasks with unsupported or missing related context", () => {
    expect(
      mapCreateTaskResult({
        ...sampleCreatedTaskResponse,
        related_to_type: "unsupported",
      }).related_to_view_url,
    ).toBeNull();

    expect(
      mapCreateTaskResult({
        ...sampleCreatedTaskResponse,
        related_to: null,
      }).related_to_view_url,
    ).toBeNull();
  });

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

describe("job mappers", () => {
  it("maps job search results into compact structured output", () => {
    const result = mapSearchJobsResult(sampleJobSearchResponse);

    expect(result.page).toBe(1);
    expect(result.returned_count).toBe(1);
    expect(result.has_more).toBe(true);
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0]).toEqual({
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
    });
  });

  it("normalizes numeric job types and removes blank secondary contact slugs", () => {
    const summary = mapJobSummary({
      ...sampleJobSearchResponse.data[0],
      job_type: 4,
      secondary_contact_slugs: ["contact-sample-002", "", null, 4040],
      enable_job_application_form: "0",
      salary_type: "Annual Salary",
    });

    expect(summary.job_type).toBe("Contract to Permanent");
    expect(summary.secondary_contact_slugs).toEqual(["contact-sample-002", "4040"]);
    expect(summary.enable_job_application_form).toBe(false);
    expect(summary.salary_type).toBe("Annual Salary");
  });
});

describe("company mappers", () => {
  it("maps company search results into compact structured output", () => {
    const result = mapSearchCompaniesResult(sampleCompanySearchResponse);

    expect(result.page).toBe(1);
    expect(result.returned_count).toBe(1);
    expect(result.has_more).toBe(true);
    expect(result.companies).toHaveLength(1);
    expect(result.companies[0]).toEqual({
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
    });
  });

  it("normalizes scalar contact_slug values and absent off-limit metadata", () => {
    const summary = mapCompanySummary({
      ...sampleCompanySearchResponse.data[0],
      contact_slug: "contact-sample-009",
      is_child_company: "Yes",
      is_parent_company: "No",
      off_limit_status_id: null,
      status_label: null,
      off_limit_reason: null,
      off_limit_end_date: null,
    });

    expect(summary.contact_slugs).toEqual(["contact-sample-009"]);
    expect(summary.is_child_company).toBe(true);
    expect(summary.is_parent_company).toBe(false);
    expect(summary.marked_as_off_limit).toBe(false);
    expect(summary.off_limit).toBeNull();
  });
});

describe("contact mappers", () => {
  it("maps contact search results into compact structured output", () => {
    const result = mapSearchContactsResult(sampleContactSearchResponse);

    expect(result.page).toBe(1);
    expect(result.returned_count).toBe(1);
    expect(result.has_more).toBe(true);
    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0]).toEqual({
      slug: "contact-sample-001",
      first_name: "Pam",
      last_name: "Beesly",
      designation: "Office Manager",
      company_slug: "company-sample-001",
      additional_company_slugs: ["company-sample-aux-001"],
      city: "Scranton",
      locality: "Downtown",
      updated_on: "2026-04-09T11:30:00.000000Z",
    });
  });

  it("omits contact info from summaries by default", () => {
    const summary = mapContactSummary(sampleContactSearchResponse.data[0]!);

    expect("email" in summary).toBe(false);
    expect("contact_number" in summary).toBe(false);
    expect("linkedin" in summary).toBe(false);
  });

  it("includes contact info when explicitly requested", () => {
    const summary = mapContactSummary(sampleContactSearchResponse.data[0]!, {
      includeContactInfo: true,
    });

    expect(summary).toMatchObject({
      email: "pam.beesly@example.com",
      contact_number: "+1-555-0142",
      linkedin: "https://www.linkedin.com/in/pam-beesly",
    });
  });

  it("normalizes blank additional company slugs out of the summary", () => {
    const summary = mapContactSummary({
      ...sampleContactSearchResponse.data[0],
      additional_company_slugs: ["company-sample-aux-001", "", null, 1234],
    });

    expect(summary.additional_company_slugs).toEqual(["company-sample-aux-001", "1234"]);
  });
});

describe("hotlist mappers", () => {
  it("maps created hotlists into stable output", () => {
    expect(mapCreateHotlistResult(sampleCreatedHotlistResponse)).toEqual({
      hotlist_id: 307309,
      name: "Product Leaders",
      related_to_type: "candidate",
      shared: false,
      created_by: 453,
    });
  });

  it("maps hotlist search results into compact output by default", () => {
    const result = mapSearchHotlistsResult(sampleHotlistSearchResponse);

    expect(result).toEqual({
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
        },
        {
          id: 703,
          name: "Private shortlist",
          related_to_type: "candidate",
          shared: false,
          created_by: 68596,
          related_count: 0,
        },
      ],
    });
  });

  it("includes related slugs when explicitly requested", () => {
    const result = mapSearchHotlistsResult(sampleHotlistSearchResponse, {
      includeRelatedSlugs: true,
    });

    expect(result.hotlists).toEqual([
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
    ]);
  });
});

describe("user mappers", () => {
  it("maps users into compact output by default", () => {
    const result = mapListUsersResult(sampleUserListResponse);

    expect(result).toEqual({
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
  });

  it("omits teams and contact info unless explicitly requested", () => {
    const summary = mapUserSummary(sampleUserListResponse[0]!);

    expect(summary).not.toHaveProperty("teams");
    expect(summary).not.toHaveProperty("email");
    expect(summary).not.toHaveProperty("contact_number");
  });

  it("includes normalized teams when requested", () => {
    const summary = mapUserSummary(sampleUserListResponse[0]!, {
      includeTeams: true,
    });

    expect(summary.teams).toEqual([
      {
        team_id: 1435,
        team_name: "Legal Recruitment Team",
      },
      {
        team_id: 2253,
        team_name: "US Team",
      },
    ]);
  });

  it("includes contact info when explicitly requested", () => {
    const summary = mapUserSummary(sampleUserListResponse[0]!, {
      includeContactInfo: true,
    });

    expect(summary).toMatchObject({
      email: "sean@example.com",
      contact_number: "+1-555-0191",
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
  it("maps note types into compact structured output", () => {
    expect(mapListNoteTypesResult(sampleNoteTypeListResponse)).toEqual({
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
  });

  it("maps created notes without exposing the related entity payload", () => {
    const result = mapCreateNoteResult(sampleCreatedNoteResponse);

    expect(result).toEqual({
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
      associated_companies: [],
      associated_contacts: [],
      associated_jobs: [],
      associated_deals: [],
      created_on: "2026-04-27T11:15:46.000000Z",
      updated_on: "2026-04-27T11:15:46.000000Z",
      created_by: 453,
      updated_by: 453,
      collaborator_users: [
        {
          id: 34,
          first_name: "Jane",
          last_name: "Scott",
        },
      ],
      collaborator_teams: [
        {
          team_id: 1435,
          team_name: null,
        },
        {
          team_id: 16,
          team_name: "Delivery",
        },
      ],
    });
    expect(result).not.toHaveProperty("related");
  });

  it("returns null related_to_view_url for created notes with unsupported or missing related context", () => {
    expect(
      mapCreateNoteResult({
        ...sampleCreatedNoteResponse,
        related_to_type: "unsupported",
      }).related_to_view_url,
    ).toBeNull();

    expect(
      mapCreateNoteResult({
        ...sampleCreatedNoteResponse,
        related_to: null,
      }).related_to_view_url,
    ).toBeNull();
  });

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
      resource_url: "https://app.recruitcrm.io/notes/24667666",
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
