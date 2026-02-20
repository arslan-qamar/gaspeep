import { fireEvent, render, screen } from '@testing-library/react';
import { AlertCard } from '../components/AlertCard';
import type { Alert } from '../types';

const baseAlert: Alert = {
  id: 'alert-1',
  userId: 'user-1',
  name: 'Morning commute alert',
  fuelTypeId: 'ulp91',
  fuelTypeName: 'Unleaded 91',
  fuelTypeColor: '#10b981',
  priceThreshold: 1.85,
  currency: 'AUD',
  unit: 'L',
  location: {
    address: 'Sydney NSW, Australia',
    latitude: -33.8688,
    longitude: 151.2093,
  },
  radius: 8,
  radiusUnit: 'km',
  status: 'active',
  notifyViaPush: true,
  notifyViaEmail: false,
  recurrenceType: 'one_off',
  createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
  lastModifiedAt: new Date('2026-01-01T00:00:00Z').toISOString(),
  lastTriggeredAt: null,
  triggerCount: 0,
};

describe('AlertCard', () => {
  it('shows fuel type, notification channels, and map coverage preview', () => {
    render(
      <AlertCard
        alert={baseAlert}
        onToggle={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getAllByText('Unleaded 91')).toHaveLength(2);
    expect(screen.getByText('Push')).toBeInTheDocument();
    expect(screen.getByText('Email off')).toBeInTheDocument();
    expect(screen.getByText('One-off notification')).toBeInTheDocument();
    expect(screen.getByText('Coverage preview')).toBeInTheDocument();
    expect(screen.getByTestId('map-mock')).toBeInTheDocument();
  });

  it('toggles active state without triggering card click', () => {
    const onToggle = jest.fn();
    const onClick = jest.fn();

    render(
      <AlertCard
        alert={baseAlert}
        onToggle={onToggle}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onClick={onClick}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pause alert' }));

    expect(onToggle).toHaveBeenCalledWith('alert-1', false);
    expect(onClick).not.toHaveBeenCalled();
  });
});
