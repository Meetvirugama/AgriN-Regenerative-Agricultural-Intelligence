import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { AdvisoryCard } from "../AdvisoryCard";
import { advisoryApi } from "../../api/advisoryApi";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the API module
vi.mock("../../api/advisoryApi", () => ({
  advisoryApi: {
    getAdvisory: vi.fn(),
    submitFeedback: vi.fn(),
  },
}));

describe("AdvisoryCard Component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders loading state initially and then shows advisory", async () => {
    const mockAdvisory = {
      id: "adv-123",
      field_id: "f1",
      what_text: "Crop health is looking good.",
      why_text: "Recent weather has been optimal.",
      action_text: "Continue standard irrigation schedule.",
      severity: "Medium",
      action_deadline: "Today",
      monitor_text: "Keep an eye on pests.",
      generated_at: new Date().toISOString(),
      trigger: "ai_generated",
      source_layers: [],
      farmer_response: null,
      overridden_reason: null,
      historical_parallel_callout: "Similar to last year",
    };

    vi.mocked(advisoryApi.getAdvisory).mockResolvedValue(mockAdvisory);

    render(<AdvisoryCard fieldId="f1" />);

    // Wait for the mock API to resolve and check if text appears
    await waitFor(() => {
      expect(screen.getByText(/Crop health is looking good./i)).toBeDefined();
    });

    expect(
      screen.getByText(/Continue standard irrigation schedule./i),
    ).toBeDefined();
  });

  it("shows error state if API fails", async () => {
    vi.mocked(advisoryApi.getAdvisory).mockRejectedValue(
      new Error("Network error"),
    );

    render(<AdvisoryCard fieldId="f1" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load AI advisory./i)).toBeDefined();
    });
  });
});
