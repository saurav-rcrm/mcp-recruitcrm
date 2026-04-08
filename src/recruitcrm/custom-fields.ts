import { RecruitCrmApiError } from "../errors.js";
import type {
  CandidateCustomFieldDetail,
  CandidateCustomFieldSummary,
  CustomFieldFilterType,
  RecruitCrmCandidateCustomField,
  SearchCandidateCustomFieldFilter,
} from "./types.js";

const FILTER_TYPES_BY_FIELD_TYPE: Readonly<Record<string, readonly CustomFieldFilterType[]>> = {
  text: ["equals", "not_equals", "contains", "not_contains", "available", "not_available"],
  longtext: ["equals", "not_equals", "contains", "not_contains", "available", "not_available"],
  number: ["equals", "not_equals", "available", "not_available", "greater_than", "less_than"],
  date: ["equals", "not_equals", "available", "not_available", "greater_than", "less_than"],
  dropdown: ["equals", "not_equals", "available", "not_available"],
  multiselect: ["equals", "not_equals", "available", "not_available"],
  email: ["equals", "not_equals", "contains", "not_contains", "available", "not_available"],
  phonenumber: ["equals", "not_equals", "contains", "not_contains", "available", "not_available"],
  file: ["available", "not_available"],
  checkbox: ["yes", "no"],
};

const FILTER_TYPES_REQUIRING_VALUE = new Set<CustomFieldFilterType>([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "greater_than",
  "less_than",
]);

const OPTION_FIELD_TYPES = new Set(["dropdown", "multiselect"]);
const OPTIONS_PREVIEW_LIMIT = 10;

export function getSupportedFilterTypes(fieldType: string): CustomFieldFilterType[] {
  return [...(FILTER_TYPES_BY_FIELD_TYPE[normalizeFieldType(fieldType)] ?? [])];
}

export function getFilterValueRequiredFor(fieldType: string): CustomFieldFilterType[] {
  return getSupportedFilterTypes(fieldType).filter((filterType) => FILTER_TYPES_REQUIRING_VALUE.has(filterType));
}

export function isCustomFieldSearchable(fieldType: string): boolean {
  return getSupportedFilterTypes(fieldType).length > 0;
}

export function mapCandidateCustomFieldSummary(field: RecruitCrmCandidateCustomField): CandidateCustomFieldSummary {
  const optionValues = parseCustomFieldOptions(field);

  return {
    field_id: field.field_id,
    field_name: field.field_name,
    field_type: field.field_type,
    searchable: isCustomFieldSearchable(field.field_type),
    supported_filter_types: getSupportedFilterTypes(field.field_type),
    filter_value_required_for: getFilterValueRequiredFor(field.field_type),
    option_count: optionValues.length,
    options_preview: optionValues.slice(0, OPTIONS_PREVIEW_LIMIT),
  };
}

export function mapCandidateCustomFieldDetail(field: RecruitCrmCandidateCustomField): CandidateCustomFieldDetail {
  return {
    field_id: field.field_id,
    field_name: field.field_name,
    field_type: field.field_type,
    searchable: isCustomFieldSearchable(field.field_type),
    supported_filter_types: getSupportedFilterTypes(field.field_type),
    filter_value_required_for: getFilterValueRequiredFor(field.field_type),
    option_values: buildOptionValues(field),
  };
}

export function filterCandidateCustomFields(
  fields: RecruitCrmCandidateCustomField[],
  includeNonSearchable = false,
): RecruitCrmCandidateCustomField[] {
  if (includeNonSearchable) {
    return fields;
  }

  return fields.filter((field) => isCustomFieldSearchable(field.field_type));
}

export function validateCustomFieldFilters(
  filters: SearchCandidateCustomFieldFilter[],
  fields: RecruitCrmCandidateCustomField[],
): void {
  const fieldsById = new Map(fields.map((field) => [field.field_id, field]));

  for (const filter of filters) {
    const field = fieldsById.get(filter.field_id);

    if (!field) {
      throw new RecruitCrmApiError(`Unknown candidate custom field field_id: ${filter.field_id}.`);
    }

    const supportedFilterTypes = getSupportedFilterTypes(field.field_type);

    if (supportedFilterTypes.length === 0) {
      throw new RecruitCrmApiError(`Custom field ${filter.field_id} cannot be used in search.`);
    }

    if (!supportedFilterTypes.includes(filter.filter_type)) {
      throw new RecruitCrmApiError(
        `Filter type "${filter.filter_type}" is not supported for custom field ${filter.field_id}.`,
      );
    }

    const filterValue = normalizeFilterValue(filter.filter_value);

    if (FILTER_TYPES_REQUIRING_VALUE.has(filter.filter_type)) {
      if (filterValue === undefined) {
        throw new RecruitCrmApiError(
          `filter_value is required for custom field ${filter.field_id} with filter type "${filter.filter_type}".`,
        );
      }

      continue;
    }

    if (filter.filter_value !== undefined) {
      throw new RecruitCrmApiError(
        `filter_value is not allowed for custom field ${filter.field_id} with filter type "${filter.filter_type}".`,
      );
    }
  }
}

function buildOptionValues(field: RecruitCrmCandidateCustomField): string[] | null {
  const optionValues = parseCustomFieldOptions(field);
  return optionValues.length > 0 ? optionValues : null;
}

function parseCustomFieldOptions(field: RecruitCrmCandidateCustomField): string[] {
  if (!OPTION_FIELD_TYPES.has(normalizeFieldType(field.field_type))) {
    return [];
  }

  const defaultValue = field.default_value?.trim();

  if (!defaultValue) {
    return [];
  }

  return defaultValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function normalizeFieldType(fieldType: string): string {
  return fieldType.trim().toLowerCase();
}

function normalizeFilterValue(value: string | number | undefined): string | number | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }

  return value;
}
