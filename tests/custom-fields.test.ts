import { describe, expect, it } from "vitest";

import {
  filterCandidateCustomFields,
  getSupportedFilterTypes,
  mapCandidateCustomFieldDetail,
  mapCandidateCustomFieldSummary,
  validateCustomFieldFilters,
} from "../src/recruitcrm/custom-fields.js";
import { RecruitCrmApiError } from "../src/errors.js";
import { sampleCandidateCustomFieldsResponse } from "./fixtures.js";

describe("candidate custom field helpers", () => {
  it("maps searchable fields with bounded option previews", () => {
    const summary = mapCandidateCustomFieldSummary(sampleCandidateCustomFieldsResponse[0]!);

    expect(summary).toEqual({
      field_id: 34,
      field_name: "Tech Stack",
      field_type: "multiselect",
      searchable: true,
      supported_filter_types: ["equals", "not_equals", "available", "not_available"],
      filter_value_required_for: ["equals", "not_equals"],
      option_count: 3,
      options_preview: ["Python", "Java", "XYZ"],
    });
  });

  it("maps field details with full option lists", () => {
    const detail = mapCandidateCustomFieldDetail(sampleCandidateCustomFieldsResponse[1]!);

    expect(detail).toEqual({
      field_id: 38,
      field_name: "Category",
      field_type: "dropdown",
      searchable: true,
      supported_filter_types: ["equals", "not_equals", "available", "not_available"],
      filter_value_required_for: ["equals", "not_equals"],
      option_values: ["Sciences", "Finance", "Operations"],
    });
  });

  it("filters non-searchable fields from list output by default", () => {
    const filtered = filterCandidateCustomFields(sampleCandidateCustomFieldsResponse);

    expect(filtered.map((field) => field.field_id)).toEqual([34, 38, 80, 88]);
  });

  it("returns supported filter types from the field-type matrix", () => {
    expect(getSupportedFilterTypes("phonenumber")).toEqual([
      "equals",
      "not_equals",
      "contains",
      "not_contains",
      "available",
      "not_available",
    ]);
    expect(getSupportedFilterTypes("date_time")).toEqual([]);
  });

  it("rejects unknown fields, unsupported filters, and invalid filter_value usage", () => {
    expect(() =>
      validateCustomFieldFilters(
        [
          {
            field_id: 999,
            filter_type: "equals",
            filter_value: "Python",
          },
        ],
        sampleCandidateCustomFieldsResponse,
      ),
    ).toThrowError(new RecruitCrmApiError("Unknown candidate custom field field_id: 999."));

    expect(() =>
      validateCustomFieldFilters(
        [
          {
            field_id: 55,
            filter_type: "equals",
            filter_value: "Acme",
          },
        ],
        sampleCandidateCustomFieldsResponse,
      ),
    ).toThrowError(new RecruitCrmApiError("Custom field 55 cannot be used in search."));

    expect(() =>
      validateCustomFieldFilters(
        [
          {
            field_id: 80,
            filter_type: "greater_than",
            filter_value: 1,
          },
        ],
        sampleCandidateCustomFieldsResponse,
      ),
    ).toThrowError(new RecruitCrmApiError('Filter type "greater_than" is not supported for custom field 80.'));

    expect(() =>
      validateCustomFieldFilters(
        [
          {
            field_id: 34,
            filter_type: "equals",
          },
        ],
        sampleCandidateCustomFieldsResponse,
      ),
    ).toThrowError(
      new RecruitCrmApiError('filter_value is required for custom field 34 with filter type "equals".'),
    );

    expect(() =>
      validateCustomFieldFilters(
        [
          {
            field_id: 88,
            filter_type: "yes",
            filter_value: "true",
          },
        ],
        sampleCandidateCustomFieldsResponse,
      ),
    ).toThrowError(
      new RecruitCrmApiError('filter_value is not allowed for custom field 88 with filter type "yes".'),
    );
  });
});
