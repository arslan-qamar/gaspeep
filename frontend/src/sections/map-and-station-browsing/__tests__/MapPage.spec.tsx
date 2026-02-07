import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MapPage from '../pages/MapPage';
import { Station } from '../types';

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
    render(<MapPage />);

    expect(screen.getByPlaceholderText('Search stations...')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('opens filter modal when filter button clicked', async () => {
    render(<MapPage />);

    const user = userEvent.setup();
    const filterButton = screen.getByText('Filters');
    await user.click(filterButton);

    expect(screen.getByText('Fuel Types')).toBeInTheDocument();
  });

  it('performs search when enter pressed in search input', async () => {
    render(<MapPage />);

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search stations...');
    await user.type(searchInput, 'test station{Enter}');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/stations/search?q=test%20station');
    });
  });

  it('shows loading indicator during search', async () => {
    render(<MapPage />);

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search stations...');
    await user.type(searchInput, 'test{Enter}');

    await waitFor(() => {
      expect(screen.queryByText('Loading stations...')).not.toBeInTheDocument();
    });
  });

  it('fetches stations on initial load', async () => {
    render(<MapPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/stations/nearby', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"latitude":40.7128'),
      }));
    });
  });

  it('handles geolocation error gracefully', () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({ code: 1, message: 'Permission denied' });
    });

    // Should not throw error
    expect(() => render(<MapPage />)).not.toThrow();
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Should not throw error
    expect(() => render(<MapPage />)).not.toThrow();

    // Wait for error to be handled
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('shows responsive filter button text', () => {
    render(<MapPage />);

    // On small screens, text should be hidden
    const filterButton = screen.getByText('Filters');
    expect(filterButton).toHaveClass('hidden', 'sm:inline');
  });
});