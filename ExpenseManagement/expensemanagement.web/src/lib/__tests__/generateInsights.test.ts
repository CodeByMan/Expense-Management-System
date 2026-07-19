import { describe, expect, it } from "vitest";
import { generateInsights } from "../generateInsights";

const summary = {
  month: 7,
  year: 2026,
  totalBudget: 100,
  totalSpent: 120,
  remaining: -20,
  totalAllocatedToSavings: 0,
  availableSurplus: 0,
  isOverBudget: true,
  categories: [{
    id: 1,
    categoryId: 1,
    categoryName: "Food",
    icon: "🍔",
    color: "#0058be",
    month: 7,
    year: 2026,
    amount: 100,
    totalSpent: 120,
    remaining: -20,
    percentageUsed: 120,
    isOverBudget: true,
  }],
};

describe("generateInsights", () => {
  it("returns an empty-period message when no data exists", () => {
    const result = generateInsights(undefined, [], "July", 2026);
    expect(result.insights[0]).toContain("No expenses recorded");
  });

  it("warns when a category is over budget", () => {
    const result = generateInsights(summary, [], "July", 2026);
    expect(result.warnings.some((warning) => warning.includes("Food is over budget"))).toBe(true);
  });
});
