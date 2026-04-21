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

export function mapHttpError(statusCode: number, bodyText?: string, entity?: string): RecruitCrmApiError {
  const apiMessage = extractApiMessage(bodyText);
  const entityLabel = entity ?? "Resource";

  if (statusCode === 401 || statusCode === 403) {
    const detail = apiMessage ? ` Details: ${apiMessage}` : "";
    return new RecruitCrmApiError(
      `Recruit CRM API authentication failed (${statusCode}). The API token may be invalid, expired, or lack permissions. Please verify RECRUITCRM_API_TOKEN.${detail}`,
      statusCode,
    );
  }

  if (statusCode === 404) {
    const detail = apiMessage ? ` Details: ${apiMessage}` : "";
    return new RecruitCrmApiError(`${entityLabel} not found.${detail}`, statusCode);
  }

  if (statusCode === 422) {
    const detail = apiMessage ?? "The request parameters were rejected by Recruit CRM. Check filter values (e.g. invalid owner_name, bad date format, unknown ids).";
    return new RecruitCrmApiError(
      `Recruit CRM API validation error (422): ${detail}`,
      statusCode,
    );
  }

  if (statusCode === 400) {
    const detail = apiMessage ?? "The request was malformed.";
    return new RecruitCrmApiError(`Recruit CRM API bad request (400): ${detail}`, statusCode);
  }

  if (statusCode === 429) {
    return new RecruitCrmApiError(
      "Recruit CRM API rate limit exceeded (429). Please retry after a short delay.",
      statusCode,
    );
  }

  if (statusCode >= 500) {
    const detail = apiMessage ? ` Details: ${apiMessage}` : "";
    return new RecruitCrmApiError(
      `Recruit CRM API is unavailable right now (${statusCode}).${detail}`,
      statusCode,
    );
  }

  const detail = apiMessage ? ` Details: ${apiMessage}` : "";
  return new RecruitCrmApiError(`Recruit CRM API request failed (${statusCode}).${detail}`, statusCode);
}

export function invalidApiResponse(
  endpoint?: string,
  issues?: Array<{ path: PropertyKey[]; message: string }>,
): RecruitCrmApiError {
  const endpointLabel = endpoint ? ` for ${endpoint}` : "";

  if (!issues || issues.length === 0) {
    return new RecruitCrmApiError(`Recruit CRM API returned an invalid response${endpointLabel}.`);
  }

  const formatted = issues
    .slice(0, 5)
    .map((issue) => `${formatIssuePath(issue.path)}: ${issue.message}`)
    .join("; ");
  const moreNote = issues.length > 5 ? ` (+${issues.length - 5} more)` : "";

  return new RecruitCrmApiError(
    `Recruit CRM API returned an unexpected response shape${endpointLabel}. Schema issues: ${formatted}${moreNote}`,
  );
}

function extractApiMessage(bodyText: string | undefined): string | undefined {
  if (!bodyText) {
    return undefined;
  }

  const trimmed = bodyText.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;

    if (typeof parsed === "string") {
      return truncate(parsed);
    }

    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      const message =
        (typeof obj.message === "string" && obj.message) ||
        (typeof obj.error === "string" && obj.error) ||
        (typeof obj.detail === "string" && obj.detail) ||
        undefined;

      if (message) {
        return truncate(message);
      }

      if (obj.errors && typeof obj.errors === "object") {
        const errorsObj = obj.errors as Record<string, unknown>;
        const parts = Object.entries(errorsObj)
          .map(([field, value]) => {
            if (Array.isArray(value)) {
              return `${field}: ${value.join(", ")}`;
            }
            if (typeof value === "string") {
              return `${field}: ${value}`;
            }
            return `${field}: ${JSON.stringify(value)}`;
          })
          .join("; ");

        if (parts) {
          return truncate(parts);
        }
      }

      return truncate(JSON.stringify(obj));
    }
  } catch {
    // Not JSON — fall through
  }

  return truncate(trimmed);
}

function truncate(value: string, max = 500): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}…`;
}

function formatIssuePath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return "<root>";
  }
  return path.map((segment) => String(segment)).join(".");
}
