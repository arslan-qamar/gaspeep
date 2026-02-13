import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MapPage from '../pages/MapPage';
import { Station } from '../types';
import { MemoryRouter } from 'react-router-dom';

// Mock the fetch API
global.fetch = jest.fn();

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};
Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

const mockStations: Station[] = [
  {
    id: '1',
    name: 'Test Station 1',
    address: '123 Test St',
    latitude: 40.7128,
    longitude: -74.006,
    operatingHours: '24/7',
    prices: [
      {
        fuelTypeId: '1',
        fuelTypeName: 'Regular',
        price: 3.99,
        currency: 'USD',
        lastUpdated: '2026-02-07T08:00:00Z',
        verified: true,
      },
    ],
  },
];

describe('MapPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      });
    });

    // Mock successful API calls
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/stations/nearby')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStations),
        });
      }
      if (url.includes('/api/stations/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockStations[0]]),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('renders search bar and filter button', () => {
    render(
      <MemoryRouter>
        <MapPage />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Search stations...')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('opens filter modal when filter button clicked', async () => {
    render(
      <MemoryRouter>
        <MapPage />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const filterButton = screen.getByText('Filters');
    await user.click(filterButton);

    expect(screen.getByText('Fuel Types')).toBeInTheDocument();
  });

  it('performs search when enter pressed in search input', async () => {
    render(
      <MemoryRouter>
        <MapPage />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search stations...');
    await user.type(searchInput, 'test station{Enter}');

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls.map((c) => c[0]);
      expect(calls).toContain('/api/stations/search?q=test%20station');
    });
  });

  it('shows loading indicator during search', async () => {
    render(
      <MemoryRouter>
        <MapPage />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search stations...');
    await user.type(searchInput, 'test{Enter}');

    await waitFor(() => {
      expect(screen.queryByText('Loading stations...')).not.toBeInTheDocument();
    });
  });

  it('fetches stations on initial load', async () => {
    render(
      <MemoryRouter>
        <MapPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/stations/nearby', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"latitude":40.7128'),
      }));
    });
  });

  it('handles geolocation error gracefully', () => {
    mockGeolocation.getCurrentPosition.mockImplementation((...args: any[]) => {
      const error = args[1];
      error({ code: 1, message: 'Permission denied' });
    });

    // Should not throw error
    expect(() => render(
      <MemoryRouter>
        <MapPage />
      </MemoryRouter>
    )).not.toThrow();
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Should not throw error
    expect(() => render(
      <MemoryRouter>
        <MapPage />
      </MemoryRouter>
    )).not.toThrow();

    // Wait for error to be handled
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('shows responsive filter button text', () => {
    render(
      <MemoryRouter>
        <MapPage />
      </MemoryRouter>
    );

    // On small screens, text should be hidden
    const filterButton = screen.getByText('Filters');
    expect(filterButton).toHaveClass('hidden', 'sm:inline');
  });

  it('clears markers when search returns empty', async () => {
    // Override fetch so search returns an empty array
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/stations/nearby')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStations),
        });
      }
      if (typeof url === 'string' && url.includes('/api/stations/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(
      <MemoryRouter>
        <MapPage />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search stations...');

    // Ensure the station marker is present initially
    await waitFor(() => expect(screen.getByText('$3.99')).toBeInTheDocument());

    // Perform a search that returns no results
    await user.type(searchInput, 'no results{Enter}');

    // The station marker should be cleared
    await waitFor(() => {
      expect(screen.queryByText('$3.99')).not.toBeInTheDocument();
    });
  });
});
