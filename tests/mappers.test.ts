import { describe, expect, it } from "vitest";

import { mapCandidateDetail, mapCandidateSummary, mapSearchCandidatesResult } from "../src/recruitcrm/mappers.js";
import { sampleSearchResponse } from "./fixtures.js";

describe("candidate mappers", () => {
  it("omits contact fields from search summaries", () => {
    const summary = mapCandidateSummary(sampleSearchResponse.data[0]!);

    expect(summary).toEqual({
      slug: "010011",
      full_name: "Michael Scott",
      position: "Software Developer",
      current_organization: "Dunder Mifflin",
      current_status: "Employed",
      status_label: "Unavailable",
      city: "New York",
      state: "New York",
      country: "United States",
      work_ex_year: 2,
      updated_on: "2020-06-29T05:36:22.000000Z",
    });
    expect("email" in summary).toBe(false);
    expect("contact_number" in summary).toBe(false);
  });

  it("includes contact fields in candidate details", () => {
    const detail = mapCandidateDetail(sampleSearchResponse.data[0]!);

    expect(detail.email).toBe("mscott@gmail.com");
    expect(detail.contact_number).toBe("+1123226666");
    expect(detail.location).toBe("New York, New York, United States");
    expect(detail.salary).toEqual({
      current: "150000",
      expectation: "180000",
      type: "Monthly Salary",
      currency_id: 2,
    });
    expect(detail.owner).toEqual({ id: 10001 });
  });

  it("maps search results into compact structured output", () => {
    const result = mapSearchCandidatesResult(sampleSearchResponse);

    expect(result.page).toBe(2);
    expect(result.returned_count).toBe(1);
    expect(result.has_more).toBe(true);
    expect(result.candidates).toHaveLength(1);
  });
});
