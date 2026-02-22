import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MapView from '../components/MapView';
import { Station } from '../types';

const mockFlyTo = jest.fn();
const mockGetZoom = jest.fn(() => 13);

jest.mock('react-map-gl/maplibre', () => {
	const React = require('react');
	const MapMock = React.forwardRef(({ children }: { children: any }, ref: any) => {
		React.useImperativeHandle(ref, () => ({
			getMap: () => ({
				flyTo: mockFlyTo,
				getZoom: mockGetZoom,
			}),
		}));
		return <div data-testid="mock-map">{children}</div>;
	});
	MapMock.displayName = 'MapMock';

	return {
		__esModule: true,
		default: MapMock,
		Map: MapMock,
		Marker: ({ children, ...props }: any) => <div data-testid="mock-marker" {...props}>{children}</div>,
		Popup: ({ children, ...props }: any) => <div data-testid="mock-popup" {...props}>{children}</div>,
		NavigationControl: () => <div data-testid="mock-nav-control" />,
		FullscreenControl: () => <div data-testid="mock-fullscreen-control" />,
		GeolocateControl: () => <div data-testid="mock-geolocate-control" />,
		ScaleControl: () => <div data-testid="mock-scale-control" />,
	};
});

const stations: Station[] = [
	{
		id: '1',
		name: 'Station One',
		brand: 'Shell',
		address: '123 Main St',
		latitude: 40.7128,
		longitude: -74.006,
		prices: [
			{ fuelTypeId: 'e10', fuelTypeName: 'E10', price: 199.9, currency: 'AUD', lastUpdated: '2026-02-07T08:00:00Z', verified: true },
			{ fuelTypeId: 'diesel', fuelTypeName: 'Diesel', price: 249.9, currency: 'AUD', lastUpdated: '2026-02-07T08:00:00Z', verified: false }
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
	beforeEach(() => {
		mockFlyTo.mockClear();
		mockGetZoom.mockClear();
		mockGetZoom.mockReturnValue(13);
	});

	it('renders map and station markers', () => {
		render(<MapView stations={stations} onStationSelect={() => {}} />);
		// Check for station marker buttons
		expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2);
		expect(screen.getByText('199.9')).toBeInTheDocument();
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
		await user.click(screen.getByText('199.9'));
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

	it('prefers official brand icon and falls back to generated icon', () => {
		render(<MapView stations={stations} onStationSelect={() => {}} />);

		const firstIcon = screen.getByAltText('Shell') as HTMLImageElement;
		expect(firstIcon.src).toContain('/icons-brand/Shell.svg');

		fireEvent.error(firstIcon);

		const fallbackIcon = screen.getByAltText('Shell') as HTMLImageElement;
		expect(fallbackIcon.src).toContain('/icons-svg/Shell.svg');

		fireEvent.error(fallbackIcon);

		expect(within(screen.getByTitle('Shell')).getByText('⛽')).toBeInTheDocument();
	});

	it('pans map to station when marker button receives keyboard focus', async () => {
		render(<MapView stations={stations} onStationSelect={() => {}} />);

		const user = userEvent.setup();
		await user.tab();
		await user.tab();

		expect(screen.getByRole('button', { name: /view station: station one/i })).toHaveFocus();
		expect(mockFlyTo).toHaveBeenCalledWith({
			center: [stations[0].longitude, stations[0].latitude],
			zoom: 13,
			duration: 600,
		});
	});

	it('does not select station when marker only receives focus', async () => {
		const mockSelect = jest.fn();
		render(<MapView stations={stations} onStationSelect={mockSelect} />);

		const user = userEvent.setup();
		await user.tab();
		await user.tab();

		expect(screen.getByRole('button', { name: /view station: station one/i })).toHaveFocus();
		expect(mockSelect).not.toHaveBeenCalled();
	});

	it('selects station when focused marker is activated with keyboard', async () => {
		const mockSelect = jest.fn();
		render(<MapView stations={stations} onStationSelect={mockSelect} />);

		const user = userEvent.setup();
		await user.tab();
		await user.tab();
		await user.keyboard('{Enter}');

		expect(mockSelect).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
	});
});
