import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StationDetailSheet from '../components/StationDetailSheet';
import { Station } from '../types';

const mockStation: Station = {
  id: '1',
  name: 'Test Station',
  address: '123 Test St, Test City, TC 12345',
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
    {
      fuelTypeId: '2',
      fuelTypeName: 'Premium',
      price: 4.29,
      currency: 'USD',
      lastUpdated: '2026-02-07T08:00:00Z',
      verified: false,
    },
  ],
};

const mockStationNoPrices: Station = {
  id: '2',
  name: 'Empty Station',
  address: '456 Empty Ave, Empty City, EC 67890',
  latitude: 40.7128,
  longitude: -74.006,
  operatingHours: '9 AM - 9 PM',
  prices: [],
};

describe('StationDetailSheet', () => {
  it('does not render when not open', () => {
    const { container } = render(
      <StationDetailSheet
        station={mockStation}
        isOpen={false}
        onClose={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('does not render when no station', () => {
    const { container } = render(
      <StationDetailSheet
        station={null}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders station details correctly', () => {
    render(
      <StationDetailSheet
        station={mockStation}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Test Station')).toBeInTheDocument();
    expect(screen.getByText('123 Test St, Test City, TC 12345')).toBeInTheDocument();
    expect(screen.getByText('24/7')).toBeInTheDocument();
  });

  it('displays fuel prices correctly', () => {
    render(
      <StationDetailSheet
        station={mockStation}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Regular')).toBeInTheDocument();
    expect(screen.getByText('$3.99')).toBeInTheDocument();
    expect(screen.getByText('✓ Verified')).toBeInTheDocument();

    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('$4.29')).toBeInTheDocument();
    expect(screen.getByText('Unverified')).toBeInTheDocument();
  });

  it('shows no price data message when no prices', () => {
    render(
      <StationDetailSheet
        station={mockStationNoPrices}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('No price data available')).toBeInTheDocument();
  });

  it('calls onSubmitPrice when update price button clicked', async () => {
    const mockSubmitPrice = jest.fn();
    render(
      <StationDetailSheet
        station={mockStation}
        isOpen={true}
        onClose={() => {}}
        onSubmitPrice={mockSubmitPrice}
      />
    );

    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /update price/i });
    await user.click(button);

    expect(mockSubmitPrice).toHaveBeenCalledTimes(1);
    const [stationId, fuelTypeId] = mockSubmitPrice.mock.calls[0];
    expect(stationId).toBe(mockStation.id);
    expect(typeof fuelTypeId).toBe('string');
  });

  it('calls onSubmitPrice with empty fuelTypeId when no prices', async () => {
    const mockSubmitPrice = jest.fn();
    render(
      <StationDetailSheet
        station={mockStationNoPrices}
        isOpen={true}
        onClose={() => {}}
        onSubmitPrice={mockSubmitPrice}
      />
    );

    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /update price/i });
    await user.click(button);

    expect(mockSubmitPrice).toHaveBeenCalledTimes(1);
    const [stationId, fuelTypeId] = mockSubmitPrice.mock.calls[0];
    expect(stationId).toBe(mockStationNoPrices.id);
    expect(fuelTypeId).toBe('');
  });

  it('calls onClose when backdrop clicked', async () => {
    const mockClose = jest.fn();
    render(
      <StationDetailSheet
        station={mockStation}
        isOpen={true}
        onClose={mockClose}
      />
    );

    const user = userEvent.setup();
    const backdrop = screen.getByTestId('backdrop');
    await user.click(backdrop);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button clicked', async () => {
    const mockClose = jest.fn();
    render(
      <StationDetailSheet
        station={mockStation}
        isOpen={true}
        onClose={mockClose}
      />
    );

    const user = userEvent.setup();
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('renders with dark mode classes', () => {
    render(
      <StationDetailSheet
        station={mockStation}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Check that dark mode classes are present
    const sheet = screen.getByRole('dialog');
    expect(sheet).toHaveClass('dark:bg-slate-900');
  });
});
