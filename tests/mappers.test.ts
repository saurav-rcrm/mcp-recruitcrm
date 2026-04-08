import { describe, expect, it } from "vitest";

import { mapCandidateSummary, mapSearchCandidatesResult } from "../src/recruitcrm/mappers.js";
import { sampleSearchResponse } from "./fixtures.js";

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
