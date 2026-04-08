export class RecruitCrmApiError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "RecruitCrmApiError";
  }
}

export function mapFetchError(error: unknown): RecruitCrmApiError {
  if (error instanceof RecruitCrmApiError) {
    return error;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return new RecruitCrmApiError("Recruit CRM API request timed out.", undefined, error);
  }

  return new RecruitCrmApiError("Unable to reach the Recruit CRM API.", undefined, error);
}

export function mapHttpError(statusCode: number): RecruitCrmApiError {
  if (statusCode === 401 || statusCode === 403) {
    return new RecruitCrmApiError("Recruit CRM API authentication failed.", statusCode);
  }

  if (statusCode === 404) {
    return new RecruitCrmApiError("Candidate not found.", statusCode);
  }

  if (statusCode === 429) {
    return new RecruitCrmApiError("Recruit CRM API rate limit exceeded.", statusCode);
  }

  if (statusCode >= 500) {
    return new RecruitCrmApiError("Recruit CRM API is unavailable right now.", statusCode);
  }

  return new RecruitCrmApiError("Recruit CRM API request failed.", statusCode);
}

export function invalidApiResponse(message = "Recruit CRM API returned an invalid response."): RecruitCrmApiError {
  return new RecruitCrmApiError(message);
}
