import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AdvisoryCard } from '../features/agro-advisory/components/AdvisoryCard';
import { advisoryApi } from '../features/agro-advisory/api/advisoryApi';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the API module
vi.mock('../features/agro-advisory/api/advisoryApi', () => ({
  advisoryApi: {
    getAdvisory: vi.fn(),
  }
}));

describe('AdvisoryCard Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially and then shows advisory', async () => {
    const mockAdvisory = {
      id: 'adv-123',
      field_id: 'f1',
      what_text: 'Crop health is looking good.',
      why_text: 'Recent weather has been optimal.',
      action_text: 'Continue standard irrigation schedule.',
      severity: 'Medium',
      monitor_text: 'Keep an eye on pests.',
      generated_at: new Date().toISOString(),
      trigger: 'ai_generated',
      source_layers: [],
      farmer_response: null,
      overridden_reason: null,
      historical_parallel_callout: 'Similar to last year'
    };

    vi.mocked(advisoryApi.getAdvisory).mockResolvedValue(mockAdvisory);

    render(<AdvisoryCard fieldId="f1" />);

    // Wait for the mock API to resolve and check if text appears

    // Wait for the mock API to resolve and check if text appears
    await waitFor(() => {
      expect(screen.getByText(/Crop health is looking good./i)).toBeDefined();
    });

    expect(screen.getByText(/Continue standard irrigation schedule./i)).toBeDefined();
  });

  it('shows error state if API fails', async () => {
    vi.mocked(advisoryApi.getAdvisory).mockRejectedValue(new Error('Network error'));

    render(<AdvisoryCard fieldId="f1" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load AI advisory./i)).toBeDefined();
    });
  });
});
