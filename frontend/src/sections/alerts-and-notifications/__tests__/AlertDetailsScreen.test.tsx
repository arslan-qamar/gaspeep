import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AlertDetailsScreen } from '../screens/AlertDetailsScreen';
import type { Alert } from '../types';
import {
  deleteAlert,
  fetchAlertById,
  fetchAlertStatistics,
  fetchAlertTriggers,
  fetchMatchingStations,
  updateAlert,
} from '../api/alertsApi';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ alertId: 'alert-1' }),
}));

jest.mock('../api/alertsApi', () => ({
  fetchAlertById: jest.fn(),
  fetchAlertStatistics: jest.fn(),
  fetchAlertTriggers: jest.fn(),
  fetchMatchingStations: jest.fn(),
  updateAlert: jest.fn(),
  deleteAlert: jest.fn(),
}));

const mockAlert: Alert = {
  id: 'alert-1',
  userId: 'user-1',
  name: 'Home alert',
  fuelTypeId: 'ulp91',
  fuelTypeName: 'Unleaded 91',
  fuelTypeColor: '#3b82f6',
  priceThreshold: 1.8,
  currency: 'AUD',
  unit: 'L',
  location: {
    address: 'Sydney NSW, Australia',
    latitude: -33.8688,
    longitude: 151.2093,
  },
  radius: 10,
  radiusUnit: 'km',
  status: 'active',
  notifyViaPush: true,
  notifyViaEmail: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  lastModifiedAt: '2026-01-01T00:00:00.000Z',
  lastTriggeredAt: null,
  triggerCount: 0,
};

describe('AlertDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchAlertById as jest.Mock).mockResolvedValue(mockAlert);
    (fetchAlertStatistics as jest.Mock).mockResolvedValue({
      alertId: 'alert-1',
      triggerCount: 3,
      lastTriggeredAt: null,
      estimatedSavings: 12.5,
      currentMatchingStations: 2,
    });
    (fetchAlertTriggers as jest.Mock).mockResolvedValue([]);
    (fetchMatchingStations as jest.Mock).mockResolvedValue([]);
    (updateAlert as jest.Mock).mockResolvedValue({ ...mockAlert, status: 'paused' });
    (deleteAlert as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders alert details and coverage preview', async () => {
    render(<AlertDetailsScreen />);

    expect(await screen.findByText('Home alert')).toBeInTheDocument();
    expect(screen.getByText(/Coverage preview/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Matching Stations/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Trigger History/i })).toBeInTheDocument();
    expect(screen.getByTestId('map-mock')).toBeInTheDocument();
  });

  it('can pause and delete alert', async () => {
    render(<AlertDetailsScreen />);

    await screen.findByText('Home alert');
    fireEvent.click(screen.getByRole('button', { name: /Pause Alert/i }));
    await waitFor(() => {
      expect(updateAlert).toHaveBeenCalledWith('alert-1', { status: 'paused' });
    });

    fireEvent.click(screen.getByRole('button', { name: /^Delete$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Delete Alert/i }));
    await waitFor(() => {
      expect(deleteAlert).toHaveBeenCalledWith('alert-1');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/alerts');
  });
});
