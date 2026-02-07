
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MapView from '../components/MapView';
import { Station } from '../types';

jest.mock('react-map-gl/maplibre', () => ({
	__esModule: true,
	default: ({ children }: any) => <div data-testid="mock-map">{children}</div>,
	Marker: ({ children, ...props }: any) => <div data-testid="mock-marker" {...props}>{children}</div>,
	Popup: ({ children, ...props }: any) => <div data-testid="mock-popup" {...props}>{children}</div>,
	NavigationControl: () => <div data-testid="mock-nav-control" />,
	FullscreenControl: () => <div data-testid="mock-fullscreen-control" />,
	GeolocateControl: () => <div data-testid="mock-geolocate-control" />,
	ScaleControl: () => <div data-testid="mock-scale-control" />,
}));

const stations: Station[] = [
	{
		id: '1',
		name: 'Station One',
		address: '123 Main St',
		latitude: 40.7128,
		longitude: -74.006,
		prices: [
			{ fuelTypeId: 'e10', fuelTypeName: 'E10', price: 1.99, currency: 'USD', lastUpdated: '2026-02-07T08:00:00Z', verified: true },
			{ fuelTypeId: 'diesel', fuelTypeName: 'Diesel', price: 2.49, currency: 'USD', lastUpdated: '2026-02-07T08:00:00Z', verified: false }
		]
	},
	{
		id: '2',
		name: 'Station Two',
		address: '456 Market St',
		latitude: 40.7138,
		longitude: -74.007,
		prices: []
	}
];

describe('MapView', () => {
	it('renders map and station markers', () => {
		render(<MapView stations={stations} onStationSelect={() => {}} />);
		// Check for station marker buttons
		expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2);
		expect(screen.getByText('$1.99')).toBeInTheDocument();
		expect(screen.getByText('?')).toBeInTheDocument();
	});

	it('shows loading indicator when fetching more', () => {
		render(<MapView stations={stations} onStationSelect={() => {}} isFetchingMore={true} />);
		expect(screen.getByText(/Loading stations/i)).toBeInTheDocument();
	});

	it('calls onStationSelect when marker clicked', async () => {
		const mockSelect = jest.fn();
		render(<MapView stations={stations} onStationSelect={mockSelect} />);
		const user = userEvent.setup();
		await user.click(screen.getByText('$1.99'));
		expect(mockSelect).toHaveBeenCalled();
	});

	it('renders user location marker', () => {
		render(<MapView stations={stations} onStationSelect={() => {}} userLocation={{ lat: 40.7128, lng: -74.006 }} />);
		expect(screen.getAllByTestId('mock-marker').length).toBeGreaterThan(0);
	});

	it('renders popup for selected station', () => {
		render(<MapView stations={stations} onStationSelect={() => {}} selectedStationId="1" />);
		expect(screen.getByText('Station One')).toBeInTheDocument();
		expect(screen.getByText('Click for details')).toBeInTheDocument();
	});
});
