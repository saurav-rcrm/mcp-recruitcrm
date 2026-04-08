import type {
  CandidateDetail,
  CandidateSummary,
  RecruitCrmCandidate,
  RecruitCrmSearchResponse,
  SearchCandidatesResult,
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

export function mapCandidateDetail(candidate: RecruitCrmCandidate): CandidateDetail {
  return {
    slug: candidate.slug,
    full_name: buildFullName(candidate),
    email: normalizeString(candidate.email),
    contact_number: normalizeString(candidate.contact_number),
    position: normalizeString(candidate.position),
    current_organization: normalizeString(candidate.current_organization),
    current_status: normalizeString(candidate.current_status),
    status_label: normalizeString(candidate.status_label),
    location: buildLocation(candidate),
    work_ex_year: normalizeNumber(candidate.work_ex_year),
    relevant_experience: normalizeNumber(candidate.relevant_experience),
    specialization: normalizeString(candidate.specialization),
    skill: normalizeString(candidate.skill),
    language_skills: normalizeString(candidate.language_skills),
    notice_period: normalizeNumber(candidate.notice_period),
    available_from: normalizeString(candidate.available_from),
    willing_to_relocate: normalizeBoolean(candidate.willing_to_relocate),
    salary: {
      current: normalizeString(candidate.current_salary),
      expectation: normalizeString(candidate.salary_expectation),
      type: normalizeString(candidate.salary_type?.label),
      currency_id: normalizeNumber(candidate.currency_id),
    },
    linkedin: normalizeString(candidate.linkedin),
    github: normalizeString(candidate.github),
    candidate_summary: normalizeString(candidate.candidate_summary),
    updated_on: normalizeString(candidate.updated_on),
    owner: {
      id: normalizeNumber(candidate.owner),
    },
  };
}

function buildFullName(candidate: RecruitCrmCandidate): string {
  const fullName = [candidate.first_name, candidate.last_name]
    .map(normalizeString)
    .filter((part): part is string => Boolean(part))
    .join(" ");

  return fullName || candidate.slug;
}

function buildLocation(candidate: RecruitCrmCandidate): string | null {
  const location = [candidate.city, candidate.state, candidate.country]
    .map(normalizeString)
    .filter((part): part is string => Boolean(part))
    .join(", ");

  return location || null;
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

function normalizeBoolean(value: number | boolean | null | undefined): boolean | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === 1) {
    return true;
  }

  if (value === 0) {
    return false;
  }

  return null;
}
