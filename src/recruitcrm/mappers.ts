import type {
  CandidateSummary,
  MeetingSummary,
  MeetingTypeSummary,
  RecruitCrmCandidate,
  RecruitCrmMeeting,
  RecruitCrmMeetingSearchResponse,
  RecruitCrmMeetingType,
  RecruitCrmTask,
  RecruitCrmTaskSearchResponse,
  RecruitCrmTaskType,
  RecruitCrmSearchResponse,
  SearchMeetingsResult,
  SearchCandidatesResult,
  SearchTasksResult,
  TaskSummary,
  TaskTypeSummary,
} from "./types.js";

export function mapSearchCandidatesResult(
  response: RecruitCrmSearchResponse,
): SearchCandidatesResult {
  return {
    page: response.current_page ?? 1,
    returned_count: response.data.length,
    has_more: hasNextPage(response.next_page_url),
    candidates: response.data.map(mapCandidateSummary),
  };
}

export function mapCandidateSummary(candidate: RecruitCrmCandidate): CandidateSummary {
  return {
    slug: candidate.slug,
    first_name: normalizeString(candidate.first_name),
    last_name: normalizeString(candidate.last_name),
    position: normalizeString(candidate.position),
    current_organization: normalizeString(candidate.current_organization),
    current_status: normalizeString(candidate.current_status),
    city: normalizeString(candidate.city),
    updated_on: normalizeString(candidate.updated_on),
  };
}

export function mapSearchTasksResult(response: RecruitCrmTaskSearchResponse): SearchTasksResult {
  return {
    page: response.current_page ?? 1,
    returned_count: response.data.length,
    has_more: hasNextPage(response.next_page_url),
    tasks: response.data.map(mapTaskSummary),
  };
}

export function mapSearchMeetingsResult(response: RecruitCrmMeetingSearchResponse): SearchMeetingsResult {
  return {
    page: response.current_page ?? 1,
    returned_count: response.data.length,
    has_more: hasNextPage(response.next_page_url),
    meetings: response.data.map(mapMeetingSummary),
  };
}

export function mapTaskSummary(task: RecruitCrmTask): TaskSummary {
  return {
    id: normalizeNumber(task.id),
    related_to: normalizeString(task.related_to),
    task_type: normalizeTaskTypes(task.task_type),
    related_to_type: normalizeString(task.related_to_type),
    related_to_name: normalizeString(task.related_to_name),
    description: normalizeString(task.description),
    title: normalizeString(task.title),
    status: normalizeNumber(task.status),
    start_date: normalizeString(task.start_date),
    reminder_date: normalizeString(task.reminder_date),
    reminder: normalizeNumber(task.reminder),
    owner: normalizeNumber(task.owner),
    created_on: normalizeString(task.created_on),
    updated_on: normalizeString(task.updated_on),
    created_by: normalizeNumber(task.created_by),
    updated_by: normalizeNumber(task.updated_by),
  };
}

export function mapMeetingSummary(meeting: RecruitCrmMeeting): MeetingSummary {
  return {
    id: normalizeNumber(meeting.id),
    title: normalizeString(meeting.title),
    meeting_type: normalizeMeetingTypes(meeting.meeting_type),
    description: normalizeString(meeting.description),
    address: normalizeString(meeting.address),
    reminder: normalizeNumber(meeting.reminder),
    start_date: normalizeString(meeting.start_date),
    end_date: normalizeString(meeting.end_date),
    related_to: normalizeString(meeting.related_to),
    related_to_type: normalizeString(meeting.related_to_type),
    do_not_send_calendar_invites: normalizeBoolean(meeting.do_not_send_calendar_invites),
    status: normalizeScalar(meeting.status),
    reminder_date: normalizeString(meeting.reminder_date),
    all_day: normalizeBoolean(meeting.all_day),
    owner: normalizeNumber(meeting.owner),
    created_on: normalizeString(meeting.created_on),
    updated_on: normalizeString(meeting.updated_on),
    created_by: normalizeNumber(meeting.created_by),
    updated_by: normalizeNumber(meeting.updated_by),
  };
}

function hasNextPage(nextPageUrl: string | null | undefined): boolean {
  return Boolean(nextPageUrl && nextPageUrl !== "null");
}

function normalizeString(value: string | number | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeNumber(value: number | string | null | undefined): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBoolean(value: number | string | boolean | null | undefined): boolean | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();

    if (trimmed === "1" || trimmed === "true") {
      return true;
    }

    if (trimmed === "0" || trimmed === "false") {
      return false;
    }

    return null;
  }

  if (value === 1) {
    return true;
  }

  if (value === 0) {
    return false;
  }

  return null;
}

function normalizeTaskTypes(
  taskTypes: RecruitCrmTaskType | RecruitCrmTaskType[] | null | undefined,
): TaskTypeSummary[] | null {
  if (taskTypes === undefined || taskTypes === null) {
    return null;
  }

  const normalizedTaskTypes = Array.isArray(taskTypes) ? taskTypes : [taskTypes];

  return normalizedTaskTypes.map((taskType) => ({
    id: normalizeIdentifier(taskType.id),
    label: normalizeString(taskType.label),
  }));
}

function normalizeIdentifier(value: number | string | null | undefined): number | string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeMeetingTypes(
  meetingTypes: RecruitCrmMeetingType | RecruitCrmMeetingType[] | null | undefined,
): MeetingTypeSummary[] | null {
  if (meetingTypes === undefined || meetingTypes === null) {
    return null;
  }

  const normalizedMeetingTypes = Array.isArray(meetingTypes) ? meetingTypes : [meetingTypes];

  return normalizedMeetingTypes.map((meetingType) => ({
    id: normalizeIdentifier(meetingType.id),
    label: normalizeString(meetingType.label),
  }));
}

function normalizeScalar(value: number | string | null | undefined): string | number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
